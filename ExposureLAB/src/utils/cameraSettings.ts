import { CameraSettings, ExposureMetadata, Constraints } from '@/types';

// Match ManualModePanel slider values exactly
export const APERTURE_STOPS = [2.8, 4.0, 5.6, 8.0, 11, 16, 22, 32];
export const ISO_STOPS = [50, 64, 100, 200, 400, 800, 1600, 3200, 6400, 12800, 25600];

export function generateShutterSpeeds(): number[] {
  const speeds: number[] = [];
  const minShutter = 1 / 8000;
  const maxShutter = 30;
  const stopIncrement = 1 / 3;
  let current = minShutter;
  while (current <= maxShutter) {
    speeds.push(current);
    current *= Math.pow(2, stopIncrement);
  }
  if (speeds[speeds.length - 1] < maxShutter) {
    speeds.push(maxShutter);
  }
  return speeds;
}

export const SHUTTER_SPEEDS = generateShutterSpeeds();

export function snapToNearest(value: number, options: number[], min?: number, max?: number): number {
  const valid = options.filter((o) => (min == null || o >= min) && (max == null || o <= max));
  const opts = valid.length > 0 ? valid : options;
  let closest = opts[0];
  let minDiff = Math.abs(value - opts[0]);
  for (const opt of opts) {
    const diff = Math.abs(value - opt);
    if (diff < minDiff) {
      minDiff = diff;
      closest = opt;
    }
  }
  return closest;
}

/** Snap EXIF metadata to nearest valid slider values for use as initial settings */
export function snapMetadataToSliderValues(
  meta: ExposureMetadata,
  constraints: Constraints
): CameraSettings {
  const shutter = snapToNearest(
    meta.shutterSeconds,
    SHUTTER_SPEEDS,
    constraints.shutterMin,
    constraints.shutterMax
  );
  const aperture = snapToNearest(
    meta.aperture,
    APERTURE_STOPS,
    constraints.apertureMin,
    constraints.apertureMax
  );
  const isoMin = constraints.isoMin ?? 100;
  const iso = snapToNearest(meta.iso, ISO_STOPS, isoMin, constraints.isoMax);

  return { shutterSeconds: shutter, aperture, iso };
}
