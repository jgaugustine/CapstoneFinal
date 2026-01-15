import React from 'react';
import type { RGB } from '../types/transformations';

interface StepItem {
  id: string;
  kind: string;
  inputRGB: RGB;
  outputRGB: RGB;
}

interface PixelInspectorProps {
  steps: StepItem[];
  finalRGB: RGB | null;
}

const fmt = (c: RGB) => `(${(c.r * 255).toFixed(0)}, ${(c.g * 255).toFixed(0)}, ${(c.b * 255).toFixed(0)})`;

const PixelInspector: React.FC<PixelInspectorProps> = ({ steps, finalRGB }) => {
  return (
    <div className="space-y-2">
      <div className="font-semibold">Pixel Inspector</div>
      {steps.length === 0 ? (
        <div className="text-sm text-muted-foreground">Click the image to inspect a pixel.</div>
      ) : (
        <div className="space-y-1">
          {steps.map((s, idx) => (
            <div key={s.id} className="text-sm">
              <span className="font-medium">{idx + 1}. {s.kind}</span>: {fmt(s.inputRGB)} → {fmt(s.outputRGB)}
            </div>
          ))}
          {finalRGB && (
            <div className="text-sm font-medium">Final: {fmt(finalRGB)}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default PixelInspector;
