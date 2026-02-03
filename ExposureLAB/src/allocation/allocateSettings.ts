import { CameraSettings, Constraints, AllocationLog } from '@/types';

export type Preference = 'shutter' | 'aperture' | 'iso' | 'balanced';

/** Achievable EV range for allocation (no constraint hits). Used to restrict AE candidates. */
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

// Convert EV to shutter speed (in seconds)
function evToShutter(ev: number, baseShutter: number = 1/60): number {
  return baseShutter * Math.pow(2, -ev);
}

// Convert EV to aperture (f-number)
function evToAperture(ev: number, baseAperture: number = 2.8): number {
  return baseAperture * Math.pow(Math.sqrt(2), ev);
}

// Convert EV to ISO
function evToISO(ev: number, baseISO: number = 100): number {
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

// Standard ISO stops
const isoStops = [100, 200, 400, 800, 1600, 3200, 6400, 12800, 25600];
function quantizeISO(iso: number, max: number): number {
  let closest = isoStops[0];
  let minDiff = Math.abs(iso - closest);
  
  for (const stop of isoStops) {
    if (stop <= max) {
      const diff = Math.abs(iso - stop);
      if (diff < minDiff) {
        minDiff = diff;
        closest = stop;
      }
    }
  }
  
  return Math.min(max, closest);
}

const ISO_MIN = 100;

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
  
  // Base values (typical camera defaults)
  const baseShutter = 1/60;
  const baseAperture = 2.8;
  const baseISO = 100;
  
  if (preference === 'shutter') {
    // Prioritize shutter speed
    shutter = evToShutter(quantizedEV, baseShutter);
    shutter = Math.max(constraints.shutterMin, Math.min(constraints.shutterMax, shutter));
    
    // Remaining EV for aperture and ISO
    const remainingEV = quantizedEV - Math.log2(baseShutter / shutter);
    const apertureEV = remainingEV * 0.6;
    const isoEV = remainingEV * 0.4;
    
    aperture = evToAperture(apertureEV, baseAperture);
    aperture = quantizeAperture(aperture, constraints.apertureMin, constraints.apertureMax);
    
    const finalApertureEV = Math.log2(aperture / baseAperture) / Math.log2(Math.sqrt(2));
    const finalISOEV = remainingEV - finalApertureEV;
    iso = evToISO(finalISOEV, baseISO);
    iso = quantizeISO(iso, constraints.isoMax);
    
  } else if (preference === 'aperture') {
    // Prioritize aperture
    aperture = evToAperture(quantizedEV, baseAperture);
    aperture = quantizeAperture(aperture, constraints.apertureMin, constraints.apertureMax);
    
    const apertureEV = Math.log2(aperture / baseAperture) / Math.log2(Math.sqrt(2));
    const remainingEV = quantizedEV - apertureEV;
    const shutterEV = remainingEV * 0.6;
    const isoEV = remainingEV * 0.4;
    
    shutter = evToShutter(shutterEV, baseShutter);
    shutter = Math.max(constraints.shutterMin, Math.min(constraints.shutterMax, shutter));
    
    const finalShutterEV = Math.log2(baseShutter / shutter);
    const finalISOEV = remainingEV - finalShutterEV;
    iso = evToISO(finalISOEV, baseISO);
    iso = quantizeISO(iso, constraints.isoMax);
    
  } else if (preference === 'iso') {
    // Minimize ISO
    iso = baseISO;
    const isoEV = 0;
    const remainingEV = quantizedEV - isoEV;
    
    // Balance shutter and aperture
    const shutterEV = remainingEV * 0.5;
    const apertureEV = remainingEV * 0.5;
    
    shutter = evToShutter(shutterEV, baseShutter);
    shutter = Math.max(constraints.shutterMin, Math.min(constraints.shutterMax, shutter));
    
    aperture = evToAperture(apertureEV, baseAperture);
    aperture = quantizeAperture(aperture, constraints.apertureMin, constraints.apertureMax);
    
  } else {
    // Balanced: distribute EV across all three
    const shutterEV = quantizedEV / 3;
    const apertureEV = quantizedEV / 3;
    const isoEV = quantizedEV / 3;
    
    shutter = evToShutter(shutterEV, baseShutter);
    shutter = Math.max(constraints.shutterMin, Math.min(constraints.shutterMax, shutter));
    
    aperture = evToAperture(apertureEV, baseAperture);
    aperture = quantizeAperture(aperture, constraints.apertureMin, constraints.apertureMax);
    
    iso = evToISO(isoEV, baseISO);
    iso = quantizeISO(iso, constraints.isoMax);
  }
  
  // Check constraint hits
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
  if (iso >= constraints.isoMax) {
    log.constraintHits.push('iso_max');
  }

  // Ensure valid exposure settings: finite, positive, within constraints
  const safeShutter = clampFinite(shutter, constraints.shutterMin, constraints.shutterMax);
  const safeAperture = clampFinite(aperture, constraints.apertureMin, constraints.apertureMax);
  const safeIso = Math.max(ISO_MIN, clampFinite(iso, ISO_MIN, constraints.isoMax));

  return {
    settings: {
      shutterSeconds: safeShutter,
      aperture: safeAperture,
      iso: safeIso,
    },
    log,
  };
}

function clampFinite(x: number, min: number, max: number): number {
  if (!Number.isFinite(x) || x <= 0) return min;
  return Math.max(min, Math.min(max, x));
}
