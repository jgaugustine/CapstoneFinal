import type { SimParams } from '@/types';

export type SimPreset =
  | 'tripod_landscape'
  | 'portrait'
  | 'moving_subject'
  | 'handheld'
  | 'sports'
  | 'lowlight'
  | 'custom';

export const SIM_PRESETS: Record<Exclude<SimPreset, 'custom'>, SimParams> = {
  tripod_landscape: {
    fullWell: 50000,
    readNoise: 1.5,
    dofStrength: 0,
    motionEnabled: false,
    motionThreshold: 1 / 30,
    motionSensitivity: 10,
  },
  portrait: {
    fullWell: 50000,
    readNoise: 1.5,
    dofStrength: 0.25,
    motionEnabled: false,
    motionThreshold: 1 / 30,
    motionSensitivity: 10,
  },
  moving_subject: {
    fullWell: 10000,
    readNoise: 2,
    dofStrength: 0.1,
    motionEnabled: true,
    motionThreshold: 1 / 60,
    motionDirection: { x: 1, y: 0 },
    motionSensitivity: 20,
  },
  handheld: {
    fullWell: 10000,
    readNoise: 2,
    dofStrength: 0.1,
    motionEnabled: true,
    motionThreshold: 1 / 30,
    motionDirection: undefined,
    motionSensitivity: 10,
  },
  sports: {
    fullWell: 10000,
    readNoise: 2,
    dofStrength: 0.08,
    motionEnabled: true,
    motionThreshold: 1 / 125,
    motionDirection: { x: 1, y: 0 },
    motionSensitivity: 25,
  },
  lowlight: {
    fullWell: 8000,
    readNoise: 4,
    dofStrength: 0.1,
    motionEnabled: true,
    motionThreshold: 1 / 30,
    motionDirection: undefined,
    motionSensitivity: 10,
  },
};

export const SIM_PRESET_LABELS: Record<Exclude<SimPreset, 'custom'>, string> = {
  tripod_landscape: 'Tripod landscape',
  portrait: 'Portrait',
  moving_subject: 'Moving subject',
  handheld: 'Handheld general',
  sports: 'Sports / action',
  lowlight: 'Low-light handheld',
};

/** Shutter speeds for motion threshold dropdown */
export const MOTION_THRESHOLD_OPTIONS: { value: string; num: number; label: string }[] = [
  { value: '1/250', num: 1 / 250, label: '1/250 s' },
  { value: '1/125', num: 1 / 125, label: '1/125 s' },
  { value: '1/60', num: 1 / 60, label: '1/60 s' },
  { value: '1/30', num: 1 / 30, label: '1/30 s' },
  { value: '1/15', num: 1 / 15, label: '1/15 s' },
  { value: '1/8', num: 1 / 8, label: '1/8 s' },
  { value: '1/4', num: 1 / 4, label: '1/4 s' },
];

export function motionThresholdToOption(seconds: number): string {
  const eps = 1e-6;
  const opt = MOTION_THRESHOLD_OPTIONS.find((o) => Math.abs(o.num - seconds) < eps);
  return opt?.value ?? MOTION_THRESHOLD_OPTIONS[3].value; // default 1/30
}

/** Motion direction options */
export type MotionDirectionOption = 'handheld' | 'horizontal' | 'vertical' | 'diagonal';

export const MOTION_DIRECTION_OPTIONS: {
  value: MotionDirectionOption;
  label: string;
  direction?: { x: number; y: number };
}[] = [
  { value: 'handheld', label: 'Handheld (isotropic)', direction: undefined },
  { value: 'horizontal', label: 'Horizontal', direction: { x: 1, y: 0 } },
  { value: 'vertical', label: 'Vertical', direction: { x: 0, y: 1 } },
  { value: 'diagonal', label: 'Diagonal', direction: { x: 1, y: 1 } },
];
