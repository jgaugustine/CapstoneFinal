import React, { useEffect, useRef } from 'react';
import type { FilterInstance, RGB } from '../types/transformations';
import { applyPipelineToPixel } from '../types/transformations';

interface ImageCanvasProps {
  pipeline: FilterInstance[];
  width?: number;
  height?: number;
  onInspectPixel?: (x: number, y: number, steps: { id: string; kind: string; inputRGB: RGB; outputRGB: RGB }[], finalRGB: RGB) => void;
}

const ImageCanvas: React.FC<ImageCanvasProps> = ({ pipeline, width = 256, height = 256, onInspectPixel }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // draw a simple test gradient image
    const imgData = ctx.createImageData(width, height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = x / (width - 1);
        const g = y / (height - 1);
        const b = 0.5 * (1 - r) + 0.5 * g;
        const { output } = applyPipelineToPixel({ r, g, b }, pipeline);
        imgData.data[idx] = Math.round(output.r * 255);
        imgData.data[idx + 1] = Math.round(output.g * 255);
        imgData.data[idx + 2] = Math.round(output.b * 255);
        imgData.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }, [pipeline, width, height]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onInspectPixel) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * (width - 1));
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * (height - 1));
    // reconstruct original gradient color
    const r = x / (width - 1);
    const g = y / (height - 1);
    const b = 0.5 * (1 - r) + 0.5 * g;
    const { steps, output } = applyPipelineToPixel({ r, g, b }, pipeline);
    onInspectPixel(x, y, steps, output);
  };

  return <canvas ref={canvasRef} width={width} height={height} onClick={handleClick} className="border rounded" />;
};

export default ImageCanvas;
