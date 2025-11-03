import React from 'react';
import type { FilterInstance, RGB } from '../types/transformations';

interface RGBCubeVisualizerProps {
  pipeline: FilterInstance[];
  selectedInstanceId: string | null;
}

const Box: React.FC<{ color: RGB; label: string }> = ({ color, label }) => (
  <div className="flex items-center gap-2">
    <div
      className="w-6 h-6 border"
      style={{ backgroundColor: `rgb(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)})` }}
    />
    <span className="text-xs">{label}</span>
  </div>
);

const RGBCubeVisualizer: React.FC<RGBCubeVisualizerProps> = ({ pipeline, selectedInstanceId }) => {
  // This is a simple placeholder visualizer: show two color swatches prev -> next for a mid-gray input
  const input: RGB = { r: 0.5, g: 0.5, b: 0.5 };
  let prev = input;
  let next = input;
  const selIdx = pipeline.findIndex(p => p.id === selectedInstanceId);
  pipeline.forEach((inst, idx) => {
    if (!inst.enabled) return;
    if (selIdx >= 0 && idx < selIdx) {
      // accumulate up to selected
      // dynamic import to avoid cycle
      const { TRANSFORMS } = require('../types/transformations');
      prev = TRANSFORMS[inst.kind].applyPixel(prev, inst.params);
      next = prev;
    } else if (selIdx === idx) {
      const { TRANSFORMS } = require('../types/transformations');
      next = TRANSFORMS[inst.kind].applyPixel(prev, inst.params);
    }
  });

  return (
    <div className="space-y-2">
      <div className="font-semibold">RGB Cube Visualizer (stub)</div>
      <div className="flex items-center gap-4">
        <Box color={prev} label="Prev" />
        <span>→</span>
        <Box color={next} label="Next" />
      </div>
    </div>
  );
};

export default RGBCubeVisualizer;
