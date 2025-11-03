import React from 'react';
import type { FilterInstance, FilterKind, FilterParams } from '../types/transformations';
import { defaultParamsFor } from '../types/transformations';
import DraggableSliderCard from './DraggableSliderCard';
import { Button } from './ui/button';

interface TransformationSlidersProps {
  pipeline: FilterInstance[];
  onChangeParams: (id: string, params: FilterParams) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onAdd: (kind: FilterKind) => void;
  onReset: () => void;
}

const kinds: FilterKind[] = ['brightness', 'contrast', 'saturation', 'vibrance', 'hue'];

const TransformationSliders: React.FC<TransformationSlidersProps> = ({
  pipeline,
  onChangeParams,
  onDuplicate,
  onDelete,
  onToggle,
  onMoveUp,
  onMoveDown,
  onAdd,
  onReset,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {kinds.map((k) => (
          <Button key={k} onClick={() => onAdd(k)}>{k}</Button>
        ))}
        <Button variant="secondary" onClick={onReset}>Reset</Button>
      </div>
      <div className="space-y-3">
        {pipeline.map((inst) => (
          <DraggableSliderCard
            key={inst.id}
            instance={inst}
            onChangeParams={onChangeParams}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            onToggle={onToggle}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
          />
        ))}
      </div>
    </div>
  );
};

export default TransformationSliders;
