import { useEffect, useRef } from 'react';

interface WeightMapHeatmapProps {
  width: number;
  height: number;
  data: Float32Array;
  maxWidth?: number;
  maxHeight?: number;
}

/** Renders a 0–1 weight map as a grayscale heatmap (0 = dark, 1 = bright). */
export function WeightMapHeatmap({
  width,
  height,
  data,
  maxWidth = 256,
  maxHeight = 192,
}: WeightMapHeatmapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || width <= 0 || height <= 0 || data.length !== width * height) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    const imageData = ctx.createImageData(width, height);

    for (let i = 0; i < data.length; i++) {
      const v = Math.max(0, Math.min(1, data[i]));
      const byte = Math.round(v * 255);
      const idx = i * 4;
      imageData.data[idx] = byte;
      imageData.data[idx + 1] = byte;
      imageData.data[idx + 2] = byte;
      imageData.data[idx + 3] = 255;
    }

    ctx.putImageData(imageData, 0, 0);
  }, [width, height, data]);

  const aspect = width / height;
  let displayWidth = width;
  let displayHeight = height;
  if (maxWidth && displayWidth > maxWidth) {
    displayWidth = maxWidth;
    displayHeight = Math.round(maxWidth / aspect);
  }
  if (maxHeight && displayHeight > maxHeight) {
    displayHeight = maxHeight;
    displayWidth = Math.round(maxHeight * aspect);
  }

  return (
    <div className="rounded border border-border overflow-hidden bg-muted inline-block">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          width: displayWidth,
          height: displayHeight,
          imageRendering: 'pixelated',
        }}
      />
    </div>
  );
}
