import { CameraSettings, Constraints, AllocationLog } from '@/types';
import type { ExposureMetadata } from '@/types';

export type Preference = 'shutter' | 'aperture' | 'iso' | 'balanced';

/**
 * EV formula that exactly matches simulateForward.ts. Used to ensure allocated
 * settings produce the same brightness as the EV sweep's chosen frame when run
 * through the simulation.
 */
export function settingsToSimEV(settings: CameraSettings | ExposureMetadata): number {
  return Math.log2(
    (settings.shutterSeconds * (settings.iso / 100)) / (settings.aperture * settings.aperture)
  );
}

/**
 * Achievable EV range for allocation (no constraint hits). Used to restrict AE candidates.
 * When relaxing constraints, the minimum for any setting is what the user set — never stricter.
 */
export function evRangeFromConstraints(
  constraints: Constraints,
  preference: Preference = 'balanced'
): { min: number; max: number; step: number } {
  const step = constraints.quantizationStep;
  const sampleMin = -10;
  const sampleMax = 15;
  const steps = Math.ceil((sampleMax - sampleMin) / step) + 1;
  let minEV: number | null = null;
  let maxEV: number | null = null;

  for (let i = 0; i < steps; i++) {
    const ev = sampleMin + i * step;
    if (ev > sampleMax) break;
    const { log } = allocateSettings(ev, constraints, preference);
    if (log.constraintHits.length === 0) {
      if (minEV == null) minEV = ev;
      maxEV = ev;
    }
  }

  if (minEV != null && maxEV != null) {
    return { min: minEV, max: maxEV, step };
  }
  return { min: -6, max: 6, step };
}

// Quantize to 1/3 EV steps
function quantizeEV(ev: number, step: number): number {
  return Math.round(ev / step) * step;
}

// Base "reference" settings used for EV math. These are chosen to be
// representative of a typical camera default and are shared between
// allocation and EV breakdown helpers so that EV is computed
// consistently across the app.
const BASE_SHUTTER = 1 / 60;
const BASE_APERTURE = 2.8;
const BASE_ISO = 100;

type EVBreakdown = NonNullable<AllocationLog['evBreakdown']>;

export function computeEVBreakdownFromSettings(settings: CameraSettings): EVBreakdown {
  const shutterEV = Math.log2(settings.shutterSeconds / BASE_SHUTTER);
  const apertureEV =
    Math.log2(BASE_APERTURE / settings.aperture) / Math.log2(Math.sqrt(2));
  const isoEV = Math.log2(settings.iso / BASE_ISO);
  return {
    shutterEV,
    apertureEV,
    isoEV,
    totalEV: shutterEV + apertureEV + isoEV,
  };
}

// Convert EV to shutter speed (in seconds). Higher EV = more exposure = longer shutter.
function evToShutter(ev: number, baseShutter: number = BASE_SHUTTER): number {
  return baseShutter * Math.pow(2, ev);
}

// Convert EV to aperture (f-number). Higher EV = more exposure = wider aperture (lower f-number).
function evToAperture(ev: number, baseAperture: number = BASE_APERTURE): number {
  return baseAperture * Math.pow(Math.sqrt(2), -ev);
}

// Convert EV to ISO
function evToISO(ev: number, baseISO: number = BASE_ISO): number {
  return baseISO * Math.pow(2, ev);
}

// Standard aperture stops
const apertureStops = [1.0, 1.4, 2.0, 2.8, 4.0, 5.6, 8.0, 11, 16, 22, 32];
function quantizeAperture(aperture: number, min: number, max: number): number {
  let closest = apertureStops[0];
  let minDiff = Math.abs(aperture - closest);
  
  for (const stop of apertureStops) {
    if (stop >= min && stop <= max) {
      const diff = Math.abs(aperture - stop);
      if (diff < minDiff) {
        minDiff = diff;
        closest = stop;
      }
    }
  }
  
  return Math.max(min, Math.min(max, closest));
}

// Standard ISO stops (include extended lows for cameras with isoMin < 100)
const isoStops = [50, 64, 100, 200, 400, 800, 1600, 3200, 6400, 12800, 25600];
function quantizeISO(iso: number, min: number, max: number): number {
  let closest = isoStops.find((s) => s >= min && s <= max) ?? min;
  let minDiff = Math.abs(iso - closest);

  for (const stop of isoStops) {
    if (stop >= min && stop <= max) {
      const diff = Math.abs(iso - stop);
      if (diff < minDiff) {
        minDiff = diff;
        closest = stop;
      }
    }
  }

  return Math.max(min, Math.min(max, closest));
}

/** Default ISO minimum when user does not set isoMin. Never use a stricter (higher) minimum than the user set. */
const ISO_MIN_DEFAULT = 100;

export function allocateSettings(
  targetEV: number,
  constraints: Constraints,
  preference: Preference = 'balanced'
): { settings: CameraSettings, log: AllocationLog } {
  const log: AllocationLog = {
    constraintHits: [],
    quantizationApplied: false,
    preference,
  };
  
  // Quantize target EV
  const quantizedEV = quantizeEV(targetEV, constraints.quantizationStep);
  if (Math.abs(quantizedEV - targetEV) > 0.001) {
    log.quantizationApplied = true;
  }
  
  let shutter: number;
  let aperture: number;
  let iso: number;
  
  if (preference === 'shutter') {
    // Prioritize shutter speed
    shutter = evToShutter(quantizedEV, BASE_SHUTTER);
    shutter = Math.max(constraints.shutterMin, Math.min(constraints.shutterMax, shutter));
    
    // Remaining EV for aperture and ISO
    const remainingEV = quantizedEV - Math.log2(shutter / BASE_SHUTTER);
    const apertureEV = remainingEV * 0.6;
    const isoEV = remainingEV * 0.4;
    
    aperture = evToAperture(apertureEV, BASE_APERTURE);
    aperture = quantizeAperture(aperture, constraints.apertureMin, constraints.apertureMax);
    
    const finalApertureEV = Math.log2(BASE_APERTURE / aperture) / Math.log2(Math.sqrt(2));
    const finalISOEV = remainingEV - finalApertureEV;
    iso = evToISO(finalISOEV, BASE_ISO);
    iso = quantizeISO(iso, constraints.isoMin ?? ISO_MIN_DEFAULT, constraints.isoMax);

  } else if (preference === 'aperture') {
    // Prioritize aperture
    aperture = evToAperture(quantizedEV, BASE_APERTURE);
    aperture = quantizeAperture(aperture, constraints.apertureMin, constraints.apertureMax);
    
    const apertureEV = Math.log2(BASE_APERTURE / aperture) / Math.log2(Math.sqrt(2));
    const remainingEV = quantizedEV - apertureEV;
    const shutterEV = remainingEV * 0.6;
    const isoEV = remainingEV * 0.4;
    
    shutter = evToShutter(shutterEV, BASE_SHUTTER);
    shutter = Math.max(constraints.shutterMin, Math.min(constraints.shutterMax, shutter));
    
    const finalShutterEV = Math.log2(shutter / BASE_SHUTTER);
    const finalISOEV = remainingEV - finalShutterEV;
    iso = evToISO(finalISOEV, BASE_ISO);
    iso = quantizeISO(iso, constraints.isoMin ?? ISO_MIN_DEFAULT, constraints.isoMax);

  } else if (preference === 'iso') {
    // Minimize ISO: use the user's minimum (never impose a stricter floor)
    iso = quantizeISO(
      constraints.isoMin ?? ISO_MIN_DEFAULT,
      constraints.isoMin ?? ISO_MIN_DEFAULT,
      constraints.isoMax
    );
    const isoEV = Math.log2(iso / BASE_ISO);
    const remainingEV = quantizedEV - isoEV;
    
    // Balance shutter and aperture
    const shutterEV = remainingEV * 0.5;
    const apertureEV = remainingEV * 0.5;
    
    shutter = evToShutter(shutterEV, BASE_SHUTTER);
    shutter = Math.max(constraints.shutterMin, Math.min(constraints.shutterMax, shutter));
    
    aperture = evToAperture(apertureEV, BASE_APERTURE);
    aperture = quantizeAperture(aperture, constraints.apertureMin, constraints.apertureMax);
    
  } else {
    // Balanced: distribute EV across all three
    const shutterEV = quantizedEV / 3;
    const apertureEV = quantizedEV / 3;
    const isoEV = quantizedEV / 3;
    
    shutter = evToShutter(shutterEV, BASE_SHUTTER);
    shutter = Math.max(constraints.shutterMin, Math.min(constraints.shutterMax, shutter));
    
    aperture = evToAperture(apertureEV, BASE_APERTURE);
    aperture = quantizeAperture(aperture, constraints.apertureMin, constraints.apertureMax);
    
    iso = evToISO(isoEV, BASE_ISO);
    iso = quantizeISO(iso, constraints.isoMin ?? ISO_MIN_DEFAULT, constraints.isoMax);
  }

  // Check constraint hits. Never impose a stricter minimum than the user set.
  const isoMin = constraints.isoMin ?? ISO_MIN_DEFAULT;
  if (shutter <= constraints.shutterMin) {
    log.constraintHits.push('shutter_min');
  }
  if (shutter >= constraints.shutterMax) {
    log.constraintHits.push('shutter_max');
  }
  if (aperture <= constraints.apertureMin) {
    log.constraintHits.push('aperture_min');
  }
  if (aperture >= constraints.apertureMax) {
    log.constraintHits.push('aperture_max');
  }
  if (iso <= isoMin) {
    log.constraintHits.push('iso_min');
  }
  if (iso >= constraints.isoMax) {
    log.constraintHits.push('iso_max');
  }

  // Ensure valid exposure settings: finite, positive, within constraints.
  // Min for anything is what the user set; never impose a stricter minimum when relaxing.
  const safeShutter = clampFinite(shutter, constraints.shutterMin, constraints.shutterMax);
  const safeAperture = clampFinite(aperture, constraints.apertureMin, constraints.apertureMax);
  const safeIso = Math.max(isoMin, clampFinite(iso, isoMin, constraints.isoMax));

  // Populate EV breakdown in log if we have finite values
  if (
    Number.isFinite(quantizedEV) &&
    Number.isFinite(safeShutter) &&
    Number.isFinite(safeAperture) &&
    Number.isFinite(safeIso)
  ) {
    log.evBreakdown = computeEVBreakdownFromSettings({
      shutterSeconds: safeShutter,
      aperture: safeAperture,
      iso: safeIso,
    });
  }

  return {
    settings: {
      shutterSeconds: safeShutter,
      aperture: safeAperture,
      iso: safeIso,
    },
    log,
  };
}

/**
 * Compute the total EV of a concrete set of camera settings relative to the
 * shared base settings (BASE_SHUTTER / BASE_APERTURE / BASE_ISO). This is
 * the inverse of the allocation logic used when populating evBreakdown and
 * lets callers interpret the AE-chosen ΔEV as a delta from the current
 * exposure.
 */
export function settingsToEV(settings: CameraSettings): number {
  const shutterEV = Math.log2(settings.shutterSeconds / BASE_SHUTTER);
  const apertureEV = Math.log2(BASE_APERTURE / settings.aperture) / Math.log2(Math.sqrt(2));
  const isoEV = Math.log2(settings.iso / BASE_ISO);
  return shutterEV + apertureEV + isoEV;
}

/**
 * Allocate exposure settings as adjustments to the base (typically from EXIF metadata).
 * Result satisfies simEV(result) - simEV(base) = adjustmentEV, so the simulation
 * produces the same brightness as the EV sweep's chosen frame.
 */
export function allocateSettingsForSimEVDelta(
  baseSettings: CameraSettings | ExposureMetadata,
  adjustmentEV: number,
  constraints: Constraints,
  preference: Preference = 'balanced'
): { settings: CameraSettings; log: AllocationLog } {
  const targetAllocEV = settingsToEV(baseSettings) + adjustmentEV;
  const evRange = evRangeFromConstraints(constraints, preference);
  const clampedTarget = Math.max(evRange.min, Math.min(evRange.max, targetAllocEV));
  const { settings, log } = allocateSettings(clampedTarget, constraints, preference);

  const targetSimEV = settingsToSimEV(baseSettings) + adjustmentEV;
  const actualSimEV = settingsToSimEV(settings);
  if (Math.abs(targetSimEV - actualSimEV) < 0.01) return { settings, log };

  // Correct by solving for ISO: (shutter*iso/100)/aperture² = 2^targetSimEV
  let { shutterSeconds, aperture, iso } = settings;
  const targetProduct = Math.pow(2, targetSimEV) * aperture * aperture;
  let solvedISO = (100 * targetProduct) / shutterSeconds;
  const isoMin = constraints.isoMin ?? ISO_MIN_DEFAULT;
  solvedISO = Math.max(isoMin, Math.min(constraints.isoMax, solvedISO));
  iso = quantizeISO(solvedISO, isoMin, constraints.isoMax);

  const finalSettings: CameraSettings = {
    shutterSeconds: clampFinite(shutterSeconds, constraints.shutterMin, constraints.shutterMax),
    aperture: clampFinite(aperture, constraints.apertureMin, constraints.apertureMax),
    iso: Math.max(isoMin, clampFinite(iso, isoMin, constraints.isoMax)),
  };

  if (
    Number.isFinite(finalSettings.shutterSeconds) &&
    Number.isFinite(finalSettings.aperture) &&
    Number.isFinite(finalSettings.iso)
  ) {
    log.evBreakdown = computeEVBreakdownFromSettings(finalSettings);
  }

  return {
    settings: finalSettings,
    log,
  };
}

function clampFinite(x: number, min: number, max: number): number {
  if (!Number.isFinite(x) || x <= 0) return min;
  return Math.max(min, Math.min(max, x));
}
