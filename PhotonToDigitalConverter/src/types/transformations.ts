export type FilterKind = 'brightness' | 'contrast' | 'saturation' | 'vibrance' | 'hue';

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export type FilterParams =
  | { value: number } // brightness, contrast, saturation share a single value
  | { vibrance: number }
  | { hue: number };

export interface FilterInstance {
  id: string;
  kind: FilterKind;
  params: FilterParams;
  enabled: boolean;
}

export function defaultParamsFor(kind: FilterKind): FilterParams {
  switch (kind) {
    case 'brightness':
      return { value: 0 };
    case 'contrast':
      return { value: 0 };
    case 'saturation':
      return { value: 0 };
    case 'vibrance':
      return { vibrance: 0 };
    case 'hue':
      return { hue: 0 };
  }
}

export function formatValueFor(kind: FilterKind, params: FilterParams): string {
  switch (kind) {
    case 'brightness':
      return `${(params as any).value}`;
    case 'contrast':
      return `${(params as any).value}`;
    case 'saturation':
      return `${(params as any).value}`;
    case 'vibrance':
      return `${(params as any).vibrance}`;
    case 'hue':
      return `${(params as any).hue}`;
  }
}

// Utility color helpers
function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  const l = (max + min) / 2;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h, s, l };
}

function hue2rgb(p: number, q: number, t: number): number {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

function hslToRgb(h: number, s: number, l: number): RGB {
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return { r, g, b };
}

// Transform registry
export interface TransformDefinition {
  isPerPixel: boolean;
  applyPixel: (rgb: RGB, params: FilterParams) => RGB;
}

export const TRANSFORMS: Record<FilterKind, TransformDefinition> = {
  brightness: {
    isPerPixel: true,
    applyPixel: (rgb, params) => {
      const v = (params as any).value; // [-1, 1] expected
      return {
        r: clamp01(rgb.r + v),
        g: clamp01(rgb.g + v),
        b: clamp01(rgb.b + v),
      };
    },
  },
  contrast: {
    isPerPixel: true,
    applyPixel: (rgb, params) => {
      const v = (params as any).value; // [-1, 1]
      const factor = (1 + v);
      const apply = (c: number) => clamp01((c - 0.5) * factor + 0.5);
      return { r: apply(rgb.r), g: apply(rgb.g), b: apply(rgb.b) };
    },
  },
  saturation: {
    isPerPixel: true,
    applyPixel: (rgb, params) => {
      const v = (params as any).value; // [-1, 1]
      const gray = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
      const apply = (c: number) => clamp01(gray + (c - gray) * (1 + v));
      return { r: apply(rgb.r), g: apply(rgb.g), b: apply(rgb.b) };
    },
  },
  vibrance: {
    isPerPixel: true,
    applyPixel: (rgb, params) => {
      const v = (params as any).vibrance; // [-1, 1]
      const max = Math.max(rgb.r, rgb.g, rgb.b);
      const min = Math.min(rgb.r, rgb.g, rgb.b);
      const amt = (1 - (max - min)) * v; // boost less-saturated colors more
      const gray = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
      const apply = (c: number) => clamp01(gray + (c - gray) * (1 + amt));
      return { r: apply(rgb.r), g: apply(rgb.g), b: apply(rgb.b) };
    },
  },
  hue: {
    isPerPixel: true,
    applyPixel: (rgb, params) => {
      const hShift = (params as any).hue; // [-1, 1] maps to [-180, 180] degrees
      const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);
      const newH = (h + hShift) % 1;
      const out = hslToRgb(newH < 0 ? newH + 1 : newH, s, l);
      return { r: clamp01(out.r), g: clamp01(out.g), b: clamp01(out.b) };
    },
  },
};

export function applyPipelineToPixel(
  input: RGB,
  pipeline: FilterInstance[]
): { steps: { id: string; kind: FilterKind; inputRGB: RGB; outputRGB: RGB }[]; output: RGB } {
  const steps: { id: string; kind: FilterKind; inputRGB: RGB; outputRGB: RGB }[] = [];
  let cur: RGB = { ...input };
  for (const inst of pipeline) {
    if (!inst.enabled) continue;
    const before = cur;
    const after = TRANSFORMS[inst.kind].applyPixel(before, inst.params);
    steps.push({ id: inst.id, kind: inst.kind, inputRGB: before, outputRGB: after });
    cur = after;
  }
  return { steps, output: cur };
}
