import React from 'react';
import type { FilterInstance } from '../types/transformations';

interface MathExplanationProps {
  pipeline: FilterInstance[];
  selectedInstanceId: string | null;
  onSelectInstance: (id: string) => void;
}

const MathExplanation: React.FC<MathExplanationProps> = ({ pipeline, selectedInstanceId }) => {
  const selected = pipeline.find(p => p.id === selectedInstanceId) || pipeline[pipeline.length - 1];
  if (!selected) return null;
  return (
    <div className="space-y-2">
      <div className="font-semibold">Math Explanation</div>
      <div className="text-sm text-muted-foreground">
        Showing formula for <span className="font-medium">{selected.kind}</span>.
        (Detailed math omitted in this stub.)
      </div>
    </div>
  );
};

export default MathExplanation;
