export type ImageRGBAFloat = {
  data: Float32Array; // RGBA interleaved, 0-1 linear
  width: number;
  height: number;
}

export type Mask = Float32Array; // 0-1 float, same dimensions as image

export type MeteringMode = 'matrix' | 'center' | 'spot' | 'subject';

export type WeightMap = Float32Array; // 0-1 weights, same dimensions

export type RadialMaskConfig = {
  id: string;
  enabled: boolean;
  centerX: number; // 0-1 normalized
  centerY: number; // 0-1 normalized
  radiusX: number; // 0-1 normalized, horizontal radius
  radiusY: number; // 0-1 normalized, vertical radius
  feather: number; // 0-1, edge softness
  illumination: number; // illumination multiplier for this mask
}

export type LinearMaskConfig = {
  id: string;
  enabled: boolean;
  angle: number; // degrees, 0-360
  offset: number; // 0-1 normalized, distance from center
  width: number; // 0-1 normalized, gradient width
  feather: number; // 0-1, edge softness
  illumination: number; // illumination multiplier for this mask
}

export type SceneState = {
  image: ImageRGBAFloat;
  illumination: number; // scalar multiplier
  /** Capture settings from EXIF; used as EV 0 reference when present */
  exposureMetadata?: ExposureMetadata;
  subjectMask?: Mask;
  depthMode?: 'none' | 'subject' | 'click';
  radialMasks?: RadialMaskConfig[];
  linearMasks?: LinearMaskConfig[];
}

export type CameraSettings = {
  shutterSeconds: number;
  aperture: number; // f-number
  iso: number;
}

/** Exposure metadata from image EXIF (used as EV reference when available) */
export type ExposureMetadata = {
  shutterSeconds: number;
  aperture: number;
  iso: number;
  /** Exposure compensation in EV stops (e.g. 0.5 for +0.5 EV), from EXIF */
  exposureCompensation?: number;
}

export type Constraints = {
  /**
   * Reserved for future use to indicate "handheld" capture scenarios.
   * Currently not used by the allocation or simulation pipeline.
   */
  handheld: boolean;
  isoMax: number;
  shutterMin: number;
  shutterMax: number;
  apertureMin: number;
  apertureMax: number;
  quantizationStep: number; // EV steps (e.g., 1/3)
}

export type AEPriorities = {
  etaHighlight: number; // ηh
  etaShadow: number; // ηs
  epsilonShadow: number;
  midtoneTarget: number; // m
}

export type AERelaxationStep = {
  stepIndex: number;
  /** Maximum allowed highlight clipping at this step (0-1) */
  maxHighlightClip?: number;
  /** Maximum allowed shadow clipping at this step (0-1) */
  maxShadowClip?: number;
  /** EV values that are feasible at this step, after applying the current constraint */
  feasibleEVs: number[];
};

export type AECandidateStage =
  | 'initial'
  | 'stage1_feasible'
  | 'stage2_feasible'
  | 'chosen';

export type AETrace = {
  candidates: Array<{
    ev: number;
    highlightClip: number;
    shadowClip: number;
    median: number;
    midtoneError: number;
    /** Highest stage this candidate reached in the lexicographic search */
    stage: AECandidateStage;
    /** True if this EV was computed past the sweep (for display only; not used in choice) */
    extended?: boolean;
    /** Histogram entropy at this EV (entropy mode only); used for optimization plots */
    entropy?: number;
  }>;
  stage1Feasible: number[]; // EV values
  stage2Feasible: number[];
  relaxCountHighlight: number;
  relaxCountShadow: number;
  chosenEV: number;
  /** Detailed history of highlight-constraint relaxation */
  relaxationStepsHighlight: AERelaxationStep[];
  /** Detailed history of shadow-constraint relaxation (applied on top of highlight-feasible set) */
  relaxationStepsShadow: AERelaxationStep[];
  /** Human-readable explanation of why this EV was chosen */
  chosenReason: string;
  /** Manipulated histogram at the chosen EV (for explainer); bins over [min, max] luminance */
  chosenHistogram?: { bins: number[]; min: number; max: number };
  /** Manipulated histogram at EV=0 (reference exposure) so Step 1 matches scene; bins + median at zero */
  manipulatedHistogramAtZero?: { bins: number[]; min: number; max: number; median: number };
  /** Algorithm weight map for explainer (may be downscaled); 0–1 per pixel, same layout as image */
  algorithmWeightMap?: { width: number; height: number; data: Float32Array };
}

export type Telemetry = {
  mean: number;
  median: number;
  p99: number;
  p1: number;
  highlightClipPercent: number;
  shadowClipPercent: number;
  subjectStats?: {
    mean: number;
    median: number;
  };
}

// AE algorithm families for EV selection
export type AEAlgorithm = 'global' | 'semantic' | 'saliency' | 'entropy';

export type SimParams = {
  fullWell: number; // K
  readNoise: number; // σr
  dofStrength: number;
  motionEnabled: boolean;
  motionDirection?: { x: number; y: number };
  motionThreshold: number; // shutter speed threshold
}

export type SimOutput = {
  image: ImageRGBAFloat;
  highlightClipMask: Mask;
  shadowClipMask: Mask;
  snrMap?: Float32Array;
  blurMap?: Float32Array;
}

export type AllocationLog = {
  constraintHits: string[];
  quantizationApplied: boolean;
  preference: 'shutter' | 'aperture' | 'iso' | 'balanced';
  /** Decomposition of quantized EV into component contributions */
  evBreakdown?: {
    shutterEV: number;
    apertureEV: number;
    isoEV: number;
    totalEV: number;
  };
}
