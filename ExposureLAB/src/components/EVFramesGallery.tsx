import { useMemo, useEffect, useRef } from 'react';
import { AETrace, ImageRGBAFloat, SceneState } from '@/types';
import { applyMasksToScene } from '@/utils/masks';
import { linearToSrgb } from '@/io/loadImage';
import { Check } from 'lucide-react';

const THUMB_MAX_SIZE = 140;
const GALLERY_MAX_IMAGES = 12;

/** Downscale image for thumbnail display */
function downscaleForThumb(
  image: ImageRGBAFloat,
  maxSize: number
): ImageRGBAFloat {
  const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
  if (scale >= 1) return image;

  const outW = Math.max(1, Math.round(image.width * scale));
  const outH = Math.max(1, Math.round(image.height * scale));
  const out = new Float32Array(outW * outH * 4);

  for (let oy = 0; oy < outH; oy++) {
    for (let ox = 0; ox < outW; ox++) {
      const sx = (ox / outW) * image.width;
      const sy = (oy / outH) * image.height;
      const x0 = Math.floor(sx);
      const y0 = Math.floor(sy);
      const x1 = Math.min(image.width - 1, x0 + 1);
      const y1 = Math.min(image.height - 1, y0 + 1);
      const fx = sx - x0;
      const fy = sy - y0;

      const idx = (oy * outW + ox) * 4;
      for (let c = 0; c < 4; c++) {
        const v00 = image.data[(y0 * image.width + x0) * 4 + c];
        const v10 = image.data[(y0 * image.width + x1) * 4 + c];
        const v01 = image.data[(y1 * image.width + x0) * 4 + c];
        const v11 = image.data[(y1 * image.width + x1) * 4 + c];
        out[idx + c] = (1 - fx) * (1 - fy) * v00 + fx * (1 - fy) * v10 + (1 - fx) * fy * v01 + fx * fy * v11;
      }
    }
  }
  return { data: out, width: outW, height: outH };
}

/** Scale RGB by 2^ev and clamp to [0,1] */
function scaleByEV(image: ImageRGBAFloat, ev: number): ImageRGBAFloat {
  const scale = Math.pow(2, ev);
  const out = new Float32Array(image.data.length);
  for (let i = 0; i < image.data.length; i += 4) {
    out[i] = Math.max(0, Math.min(1, image.data[i] * scale));
    out[i + 1] = Math.max(0, Math.min(1, image.data[i + 1] * scale));
    out[i + 2] = Math.max(0, Math.min(1, image.data[i + 2] * scale));
    out[i + 3] = image.data[i + 3];
  }
  return { ...image, data: out };
}

interface EVFramesGalleryProps {
  scene: SceneState | null;
  trace: AETrace | null;
  /** Display width for each thumbnail */
  thumbSize?: number;
}

/** Sample EV candidates for display, always including chosen */
function sampleCandidates(trace: AETrace): Array<{ ev: number; isChosen: boolean }> {
  const { candidates, chosenEV } = trace;
  if (candidates.length === 0) return [];

  const step = Math.max(1, Math.floor(candidates.length / (GALLERY_MAX_IMAGES - 1)));
  const sampled: Array<{ ev: number; isChosen: boolean }> = [];
  const seen = new Set<number>();
  const evKey = (ev: number) => Math.round(ev * 100) / 100;

  for (let i = 0; i < candidates.length; i += step) {
    const c = candidates[i];
    const key = evKey(c.ev);
    if (seen.has(key)) continue;
    seen.add(key);
    sampled.push({ ev: c.ev, isChosen: Math.abs(c.ev - chosenEV) < 0.01 });
  }

  // Ensure chosen is included
  const chosenKey = evKey(chosenEV);
  if (!seen.has(chosenKey)) {
    const closest = candidates.reduce((best, c) =>
      Math.abs(c.ev - chosenEV) < Math.abs(best.ev - chosenEV) ? c : best
    );
    sampled.push({ ev: closest.ev, isChosen: true });
    sampled.sort((a, b) => a.ev - b.ev);
  }

  return sampled;
}

export function EVFramesGallery({
  scene,
  trace,
  thumbSize = THUMB_MAX_SIZE,
}: EVFramesGalleryProps) {
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());

  const { maskedImage, sampled } = useMemo(() => {
    if (!scene?.image || !trace?.candidates.length) {
      return { maskedImage: null, sampled: [] };
    }
    const masked = applyMasksToScene(
      scene.image,
      scene.illumination,
      scene.radialMasks,
      scene.linearMasks
    );
    const thumb = downscaleForThumb(masked, thumbSize * 2);
    const sampled = sampleCandidates(trace);
    return { maskedImage: thumb, sampled };
  }, [scene, trace, thumbSize]);

  const frames = useMemo(() => {
    if (!maskedImage || sampled.length === 0) return [];
    return sampled.map(({ ev, isChosen }) => ({
      ev,
      isChosen,
      image: scaleByEV(maskedImage, ev),
    }));
  }, [maskedImage, sampled]);

  useEffect(() => {
    if (!frames.length) return;

    frames.forEach(({ ev, image }) => {
      const canvas = canvasRefs.current.get(ev);
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = image.width;
      canvas.height = image.height;

      const imageData = ctx.createImageData(image.width, image.height);
      for (let i = 0; i < image.data.length; i += 4) {
        imageData.data[i] = linearToSrgb(image.data[i]);
        imageData.data[i + 1] = linearToSrgb(image.data[i + 1]);
        imageData.data[i + 2] = linearToSrgb(image.data[i + 2]);
        imageData.data[i + 3] = Math.round(image.data[i + 3] * 255);
      }
      ctx.putImageData(imageData, 0, 0);
    });
  }, [frames]);

  if (!trace || frames.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">EV sweep preview</p>
      <p className="text-xs text-muted-foreground">
        Frames at different ΔEV values. The chosen EV by the algorithm is highlighted.
      </p>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1" style={{ minHeight: thumbSize + 48 }}>
        {frames.map(({ ev, isChosen }, idx) => (
          <div
            key={`${ev.toFixed(2)}-${idx}`}
            className={`flex-shrink-0 flex flex-col items-center gap-1 transition-all ${
              isChosen
                ? 'ring-2 ring-primary ring-offset-2 ring-offset-background rounded-lg'
                : 'opacity-85 hover:opacity-100'
            }`}
          >
            <div
              className="relative rounded overflow-hidden border border-border bg-muted flex items-center justify-center"
              style={{ width: thumbSize, height: thumbSize }}
            >
              <canvas
                ref={(el) => {
                  if (el) canvasRefs.current.set(ev, el);
                }}
                width={maskedImage?.width ?? 0}
                height={maskedImage?.height ?? 0}
                className="max-w-full max-h-full object-contain"
                style={{
                  maxWidth: thumbSize,
                  maxHeight: thumbSize,
                }}
              />
              {isChosen && (
                <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded px-1.5 py-0.5 flex items-center gap-1 text-[10px] font-semibold">
                  <Check className="h-3 w-3" />
                  Chosen
                </div>
              )}
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">
              {ev >= 0 ? '+' : ''}{ev.toFixed(1)} EV
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
