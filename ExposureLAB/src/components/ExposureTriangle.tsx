import { CameraSettings } from '@/types';
import { settingsToEV, computeEVBreakdownFromSettings } from '@/allocation/allocateSettings';

function formatShutter(seconds: number): string {
  if (seconds >= 1) return `${seconds.toFixed(1)}s`;
  return `1/${Math.round(1 / seconds)}s`;
}

// Each setting controls the LENGTH of the side opposite its vertex. Vertex stays fixed.
// Scale reflects EV contribution to light: light ∝ 2^EV (log scale).
const SIDE_SCALE_MIN = 0.4;
const SIDE_SCALE_MAX = 1;

/** Map EV to side scale using log scale of light: 2^EV. 30s shutter → scale 1. */
function evToScaleLog(ev: number, evMin: number, evMax: number): number {
  const clamped = Math.max(evMin, Math.min(evMax, ev));
  const lightMin = Math.pow(2, evMin);
  const lightMax = Math.pow(2, evMax);
  const light = Math.pow(2, clamped);
  const t = (light - lightMin) / (lightMax - lightMin);
  return SIDE_SCALE_MIN + t * (SIDE_SCALE_MAX - SIDE_SCALE_MIN);
}

// Shutter: 30s = max (shutterEV ≈ 10.8). 1/8000s ≈ -7 EV.
const SHUTTER_EV_MIN = -7;
const SHUTTER_EV_MAX = 11;
// Aperture: f/2.8 (apertureEV=0) = max, f/32 (apertureEV≈-6) = min
const APERTURE_EV_MIN = -2;
const APERTURE_EV_MAX = 2;
// ISO: 25600 (isoEV=8) = max, 100 (isoEV=0) = min
const ISO_EV_MIN = -2;
const ISO_EV_MAX = 8;

interface ExposureTriangleProps {
  settings: CameraSettings;
  /** Optional className for the container */
  className?: string;
}

export function ExposureTriangle({ settings, className = '' }: ExposureTriangleProps) {
  const { shutterSeconds, aperture, iso } = settings;
  const absEV = settingsToEV(settings);
  const { shutterEV, apertureEV, isoEV } = computeEVBreakdownFromSettings(settings);

  const shutterScale = evToScaleLog(shutterEV, SHUTTER_EV_MIN, SHUTTER_EV_MAX);
  const isoScale = evToScaleLog(isoEV, ISO_EV_MIN, ISO_EV_MAX);
  // Aperture: wider (f/2.8, apertureEV=0) = longer side. Narrower (f/32, apertureEV≈-6) = shorter.
  const apertureScale = evToScaleLog(apertureEV + APERTURE_EV_MAX, APERTURE_EV_MIN, APERTURE_EV_MAX);

  // Base equilateral triangle: Shutter (top), Aperture (bottom-left), ISO (bottom-right)
  // Centered in viewBox, circumradius R
  const cx = 60;
  const cy = 50;
  const R = 100;
  const sqrt3 = Math.sqrt(3);

  const eqShutter = { x: cx, y: cy - R };
  const eqAperture = { x: cx - (R * sqrt3) / 2, y: cy + R / 2 };
  const eqISO = { x: cx + (R * sqrt3) / 2, y: cy + R / 2 };

  // Scale each SIDE (the two vertices that form it move; the opposite vertex stays fixed).
  // Side opposite Shutter = Aperture-ISO (base). Shutter fixed. Scale base length.
  const scaleSide = (
    fixed: { x: number; y: number },
    v1: { x: number; y: number },
    v2: { x: number; y: number },
    scale: number
  ) => {
    const mx = (v1.x + v2.x) / 2;
    const my = (v1.y + v2.y) / 2;
    return [
      { x: mx + (v1.x - mx) * scale, y: my + (v1.y - my) * scale },
      { x: mx + (v2.x - mx) * scale, y: my + (v2.y - my) * scale },
    ];
  };

  // Apply in order: shutter (base), aperture (Shutter-ISO), iso (Shutter-Aperture)
  let ptShutter = { ...eqShutter };
  let ptAperture = { ...eqAperture };
  let ptISO = { ...eqISO };

  const [newAperture, newISO] = scaleSide(ptShutter, ptAperture, ptISO, shutterScale);
  ptAperture = newAperture;
  ptISO = newISO;

  const [newShutter2, newISO2] = scaleSide(ptAperture, ptShutter, ptISO, apertureScale);
  ptShutter = newShutter2;
  ptISO = newISO2;

  const [newShutter3, newAperture2] = scaleSide(ptISO, ptShutter, ptAperture, isoScale);
  ptShutter = newShutter3;
  ptAperture = newAperture2;

  const top = ptShutter;
  const bottomLeft = ptAperture;
  const bottomRight = ptISO;

  const points = `${top.x},${top.y} ${bottomRight.x},${bottomRight.y} ${bottomLeft.x},${bottomLeft.y}`;
  const centerX = (top.x + bottomRight.x + bottomLeft.x) / 3;
  const centerY = (top.y + bottomRight.y + bottomLeft.y) / 3;

  // Distance from point to line segment
  const distToSegment = (
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): number => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return Math.hypot(px - x1, py - y1);
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (len * len)));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    return Math.hypot(px - projX, py - projY);
  };
  const minDistToEdge = Math.min(
    distToSegment(centerX, centerY, top.x, top.y, bottomRight.x, bottomRight.y),
    distToSegment(centerX, centerY, bottomRight.x, bottomRight.y, bottomLeft.x, bottomLeft.y),
    distToSegment(centerX, centerY, bottomLeft.x, bottomLeft.y, top.x, top.y)
  );
  const EV_FIT_THRESHOLD = 14;
  const evPopsOut = minDistToEdge < EV_FIT_THRESHOLD;
  const evLabelOffset = 22;

  // Side midpoints (each setting labels the side it controls)
  const baseMid = { x: (bottomLeft.x + bottomRight.x) / 2, y: (bottomLeft.y + bottomRight.y) / 2 };
  const rightSideMid = { x: (top.x + bottomRight.x) / 2, y: (top.y + bottomRight.y) / 2 };
  const leftSideMid = { x: (top.x + bottomLeft.x) / 2, y: (top.y + bottomLeft.y) / 2 };

  // Perpendicular offset (outward from center) for label placement
  const labelOffset = 16;
  const shutterPos = { x: baseMid.x, y: baseMid.y + labelOffset };
  const aperturePos = {
    x: rightSideMid.x + labelOffset * 0.7,
    y: rightSideMid.y - labelOffset * 0.3,
  };
  const isoPos = {
    x: leftSideMid.x - labelOffset * 0.7,
    y: leftSideMid.y - labelOffset * 0.3,
  };

  return (
    <div
      className={`flex flex-col items-center gap-2 min-h-[200px] min-w-[200px] ${className}`}
      title="Exposure triangle: shutter speed, aperture, and ISO control exposure"
    >
      <div className="text-xs font-medium text-muted-foreground">Exposure Triangle</div>
      <svg
        viewBox="-50 -70 220 200"
        className="w-[200px] h-[200px]"
        aria-hidden
      >
        <defs>
          <linearGradient id="exposureTriangleGradient" x1="20" y1="8" x2="100" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="50%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>
        {/* Triangle with purple–orange–green gradient fill */}
        <polygon
          points={points}
          fill="url(#exposureTriangleGradient)"
          fillOpacity="0.3"
          stroke="hsl(var(--border))"
          strokeWidth="1.5"
        />
        {/* Absolute EV - center of triangle, or pop out with arrow when triangle is small */}
        {evPopsOut ? (
          <g>
            {/* Line from EV label down to arrow */}
            <line
              x1={centerX}
              y1={centerY - evLabelOffset + 6}
              x2={centerX}
              y2={centerY - 6}
              stroke="currentColor"
              strokeWidth="1"
              strokeOpacity="0.6"
            />
            {/* Arrowhead pointing at center */}
            <polygon
              points={`${centerX},${centerY} ${centerX - 4},${centerY - 6} ${centerX + 4},${centerY - 6}`}
              fill="currentColor"
              fillOpacity="0.6"
            />
            {/* EV label above triangle */}
            <text
              x={centerX}
              y={centerY - evLabelOffset - 4}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="currentColor"
              className="text-foreground text-[12px] font-mono font-bold"
            >
              {absEV >= 0 ? '+' : ''}{absEV.toFixed(1)} EV
            </text>
          </g>
        ) : (
          <text
            x={centerX}
            y={centerY}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="currentColor"
            className="text-foreground text-[12px] font-mono font-bold"
          >
            {absEV >= 0 ? '+' : ''}{absEV.toFixed(1)} EV
          </text>
        )}
        {/* Shutter - along base (side it controls) */}
        <g>
          <text
            x={shutterPos.x}
            y={shutterPos.y - 6}
            textAnchor="middle"
            fill="currentColor"
            className="text-muted-foreground text-[10px] font-medium"
          >
            Shutter
          </text>
          <text
            x={shutterPos.x}
            y={shutterPos.y + 6}
            textAnchor="middle"
            fill="currentColor"
            className="text-foreground text-[11px] font-mono font-semibold"
          >
            {formatShutter(shutterSeconds)}
          </text>
        </g>
        {/* Aperture - along right side (Shutter-ISO, side it controls) */}
        <g>
          <text
            x={aperturePos.x}
            y={aperturePos.y - 6}
            textAnchor="middle"
            fill="currentColor"
            className="text-muted-foreground text-[10px] font-medium"
          >
            Aperture
          </text>
          <text
            x={aperturePos.x}
            y={aperturePos.y + 6}
            textAnchor="middle"
            fill="currentColor"
            className="text-foreground text-[11px] font-mono font-semibold"
          >
            f/{aperture.toFixed(1)}
          </text>
        </g>
        {/* ISO - along left side (Shutter-Aperture, side it controls) */}
        <g>
          <text
            x={isoPos.x}
            y={isoPos.y - 6}
            textAnchor="middle"
            fill="currentColor"
            className="text-muted-foreground text-[10px] font-medium"
          >
            ISO
          </text>
          <text
            x={isoPos.x}
            y={isoPos.y + 6}
            textAnchor="middle"
            fill="currentColor"
            className="text-foreground text-[11px] font-mono font-semibold"
          >
            {iso}
          </text>
        </g>
      </svg>
    </div>
  );
}
