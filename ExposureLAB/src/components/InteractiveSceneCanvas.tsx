import { useEffect, useRef, useState } from 'react';
import { ImageRGBAFloat, RadialMaskConfig, LinearMaskConfig } from '@/types';
import { linearToSrgb } from '@/io/loadImage';
import { generateRadialMask, generateLinearMask } from '@/utils/masks';

interface InteractiveSceneCanvasProps {
  image: ImageRGBAFloat | null;
  radialMasks?: RadialMaskConfig[];
  linearMasks?: LinearMaskConfig[];
  displayWidth?: number;
  showMaskOverlay?: boolean;
  onAddRadialMask: (centerX: number, centerY: number, radiusX: number, radiusY: number) => void;
  onAddLinearMask: (angle: number, offset: number, width: number) => void;
  maskDrawingMode: 'radial' | 'linear' | null;
}

const CANVAS_MIN_HEIGHT = 360;

export function InteractiveSceneCanvas({
  image,
  radialMasks,
  linearMasks,
  displayWidth,
  showMaskOverlay = true,
  onAddRadialMask,
  onAddLinearMask,
  maskDrawingMode,
}: InteractiveSceneCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);

  // Get canvas coordinates from mouse event
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !image) return null;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Calculate actual displayed size (accounting for aspect ratio)
    const canvasAspect = image.width / image.height;
    const containerAspect = rect.width / rect.height;
    
    let drawWidth: number;
    let drawHeight: number;
    let offsetX: number;
    let offsetY: number;
    
    if (containerAspect > canvasAspect) {
      drawHeight = rect.height;
      drawWidth = drawHeight * canvasAspect;
      offsetX = (rect.width - drawWidth) / 2;
      offsetY = 0;
    } else {
      drawWidth = rect.width;
      drawHeight = drawWidth / canvasAspect;
      offsetX = 0;
      offsetY = (rect.height - drawHeight) / 2;
    }
    
    const relX = e.clientX - rect.left - offsetX;
    const relY = e.clientY - rect.top - offsetY;
    
    if (relX < 0 || relY < 0 || relX >= drawWidth || relY >= drawHeight) return null;
    
    // Convert to image coordinates (normalized 0-1)
    const normX = relX / drawWidth;
    const normY = relY / drawHeight;
    
    return { x: normX, y: normY };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!maskDrawingMode || !image) return;
    const coords = getCanvasCoords(e);
    if (!coords) return;
    
    setIsDrawing(true);
    setDrawStart(coords);
    setDrawCurrent(coords);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !drawStart) return;
    const coords = getCanvasCoords(e);
    if (!coords) return;
    setDrawCurrent(coords);
  };

  const handleMouseUp = () => {
    if (!isDrawing || !drawStart || !drawCurrent || !image) {
      setIsDrawing(false);
      setDrawStart(null);
      setDrawCurrent(null);
      return;
    }
    
    if (maskDrawingMode === 'radial') {
      // Calculate elliptical radii based on drag direction
      const dx = drawCurrent.x - drawStart.x;
      const dy = drawCurrent.y - drawStart.y;
      // Use absolute values for radii (ellipse extends in both directions)
      const radiusX = Math.abs(dx);
      const radiusY = Math.abs(dy);
      
      onAddRadialMask(drawStart.x, drawStart.y, Math.min(radiusX, 0.5), Math.min(radiusY, 0.5));
    } else if (maskDrawingMode === 'linear') {
      // Calculate angle and offset for linear mask
      const dx = drawCurrent.x - drawStart.x;
      const dy = drawCurrent.y - drawStart.y;
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const offset = distance * 0.5; // Use half distance as offset
      const width = distance * 0.3; // Use 30% of distance as width
      
      onAddLinearMask(angle, offset, width);
    }
    
    setIsDrawing(false);
    setDrawStart(null);
    setDrawCurrent(null);
  };

  // Draw image and masks
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

    // Draw red overlay for enabled masks (must composite, not replace - putImageData overwrites)
    if (showMaskOverlay && (radialMasks || linearMasks)) {
      const overlay = ctx.createImageData(image.width, image.height);
      
      // Initialize overlay with transparent pixels
      for (let i = 0; i < overlay.data.length; i += 4) {
        overlay.data[i] = 0;
        overlay.data[i + 1] = 0;
        overlay.data[i + 2] = 0;
        overlay.data[i + 3] = 0;
      }
      
      // Draw radial masks - combine using maximum alpha
      // Only draw enabled masks (toggled off masks won't appear)
      if (radialMasks) {
        for (const config of radialMasks) {
          if (config.enabled) {
            const mask = generateRadialMask(image.width, image.height, config);
            for (let i = 0; i < mask.length; i++) {
              if (mask[i] > 0) {
                const idx = i * 4;
                // Use lower alpha so image shows through (80/255 = ~31% opacity)
                const alpha = Math.round(mask[i] * 80);
                // Use maximum alpha for overlapping masks
                overlay.data[idx] = 255; // Red
                overlay.data[idx + 1] = 0;
                overlay.data[idx + 2] = 0;
                overlay.data[idx + 3] = Math.max(overlay.data[idx + 3], alpha);
              }
            }
          }
        }
      }
      
      // Draw linear masks - combine using maximum alpha
      // Only draw enabled masks (toggled off masks won't appear)
      if (linearMasks) {
        for (const config of linearMasks) {
          if (config.enabled) {
            const mask = generateLinearMask(image.width, image.height, config);
            for (let i = 0; i < mask.length; i++) {
              if (mask[i] > 0) {
                const idx = i * 4;
                // Use lower alpha so image shows through (80/255 = ~31% opacity)
                const alpha = Math.round(mask[i] * 80);
                // Use maximum alpha for overlapping masks
                overlay.data[idx] = 255; // Red
                overlay.data[idx + 1] = 0;
                overlay.data[idx + 2] = 0;
                overlay.data[idx + 3] = Math.max(overlay.data[idx + 3], alpha);
              }
            }
          }
        }
      }
      
      // Composite overlay on top of image: putImageData overwrites, so use offscreen canvas + drawImage
      const overlayCanvas = document.createElement('canvas');
      overlayCanvas.width = image.width;
      overlayCanvas.height = image.height;
      const overlayCtx = overlayCanvas.getContext('2d');
      if (overlayCtx) {
        overlayCtx.putImageData(overlay, 0, 0);
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(overlayCanvas, 0, 0);
      }
    }

    // Draw preview of mask being drawn (on top of everything)
    if (isDrawing && drawStart && drawCurrent && maskDrawingMode) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.9)';
      ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.lineWidth = 3;
      
      if (maskDrawingMode === 'radial') {
        const centerX = drawStart.x * image.width;
        const centerY = drawStart.y * image.height;
        const dx = drawCurrent.x - drawStart.x;
        const dy = drawCurrent.y - drawStart.y;
        const radiusX = Math.abs(dx) * image.width;
        const radiusY = Math.abs(dy) * image.height;
        
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      } else if (maskDrawingMode === 'linear') {
        // Draw line preview for linear mask
        const startX = drawStart.x * image.width;
        const startY = drawStart.y * image.height;
        const endX = drawCurrent.x * image.width;
        const endY = drawCurrent.y * image.height;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }
    }
  }, [image, radialMasks, linearMasks, isDrawing, drawStart, drawCurrent, maskDrawingMode, showMaskOverlay]);

  return (
    <div
      className="relative flex items-center justify-center w-full border border-dashed border-border rounded-lg bg-muted overflow-hidden"
      style={{ minHeight: CANVAS_MIN_HEIGHT }}
    >
      {!image && (
        <p className="text-muted-foreground text-sm">No image</p>
      )}
      {image && (
        <canvas
          ref={canvasRef}
          className="max-w-full h-auto cursor-crosshair"
          style={{ 
            imageRendering: 'auto',
            ...(displayWidth ? { width: `${displayWidth}px` } : {})
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      )}
    </div>
  );
}
