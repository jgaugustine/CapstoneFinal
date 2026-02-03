import { useEffect, useRef } from 'react';
import { ImageRGBAFloat, Mask } from '@/types';
import { linearToSrgb } from '@/io/loadImage';
import { Loader2 } from 'lucide-react';

interface ImageCanvasProps {
  image: ImageRGBAFloat | null;
  highlightClipMask?: Mask;
  shadowClipMask?: Mask;
  showClipping?: boolean;
  isLoading?: boolean;
  displayWidth?: number;
}

const CANVAS_MIN_HEIGHT = 360;

export function ImageCanvas({ image, highlightClipMask, shadowClipMask, showClipping = true, isLoading = false, displayWidth }: ImageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = image.width;
    canvas.height = image.height;

    const imageData = ctx.createImageData(image.width, image.height);

    // Convert linear float to sRGB for display
    for (let i = 0; i < image.data.length; i += 4) {
      const idx = i / 4;
      const r = linearToSrgb(image.data[i]);
      const g = linearToSrgb(image.data[i + 1]);
      const b = linearToSrgb(image.data[i + 2]);
      const a = Math.round(image.data[i + 3] * 255);

      imageData.data[i] = r;
      imageData.data[i + 1] = g;
      imageData.data[i + 2] = b;
      imageData.data[i + 3] = a;
    }

    ctx.putImageData(imageData, 0, 0);

    // Overlay clipping masks if enabled
    if (showClipping && (highlightClipMask || shadowClipMask)) {
      const overlay = ctx.createImageData(image.width, image.height);
      
      for (let i = 0; i < image.width * image.height; i++) {
        const idx = i * 4;
        let r = 0, g = 0, b = 0, a = 0;

        if (highlightClipMask && highlightClipMask[i] > 0) {
          // Red overlay for highlight clipping
          r = 255;
          a = Math.round(highlightClipMask[i] * 128);
        } else if (shadowClipMask && shadowClipMask[i] > 0) {
          // Blue overlay for shadow clipping
          b = 255;
          a = Math.round(shadowClipMask[i] * 128);
        }

        overlay.data[idx] = r;
        overlay.data[idx + 1] = g;
        overlay.data[idx + 2] = b;
        overlay.data[idx + 3] = a;
      }

      ctx.putImageData(overlay, 0, 0);
    }
  }, [image, highlightClipMask, shadowClipMask, showClipping]);

  return (
    <div
      className="relative flex items-center justify-center w-full border border-border rounded-lg bg-muted overflow-hidden"
      style={{ 
        minHeight: CANVAS_MIN_HEIGHT,
        ...(displayWidth ? { maxWidth: `${displayWidth}px` } : {})
      }}
    >
      {!image && !isLoading && (
        <p className="text-muted-foreground text-sm">No image</p>
      )}
      {image && (
        <canvas
          ref={canvasRef}
          className="max-w-full h-auto"
          style={{ imageRendering: 'auto' }}
        />
      )}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/80">
          <Loader2 className="h-12 w-12 animate-spin text-primary" aria-hidden />
        </div>
      )}
    </div>
  );
}
