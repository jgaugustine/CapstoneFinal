import React from 'react';
import type { FilterInstance, FilterKind, FilterParams } from '../types/transformations';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Slider } from './ui/slider';

interface DraggableSliderCardProps {
  instance: FilterInstance;
  onChangeParams: (id: string, params: FilterParams) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
}

const labelForKind = (kind: FilterKind) => {
  switch (kind) {
    case 'brightness':
      return 'Brightness';
    case 'contrast':
      return 'Contrast';
    case 'saturation':
      return 'Saturation';
    case 'vibrance':
      return 'Vibrance';
    case 'hue':
      return 'Hue';
  }
};

export const DraggableSliderCard: React.FC<DraggableSliderCardProps> = ({
  instance,
  onChangeParams,
  onDuplicate,
  onDelete,
  onToggle,
  onMoveUp,
  onMoveDown,
}) => {
  const renderSlider = () => {
    switch (instance.kind) {
      case 'brightness':
      case 'contrast':
      case 'saturation': {
        const value = (instance.params as any).value as number;
        return (
          <Slider
            value={[value]}
            min={-1}
            max={1}
            step={0.01}
            onValueChange={(v) => onChangeParams(instance.id, { value: v[0] })}
          />
        );
      }
      case 'vibrance': {
        const value = (instance.params as any).vibrance as number;
        return (
          <Slider
            value={[value]}
            min={-1}
            max={1}
            step={0.01}
            onValueChange={(v) => onChangeParams(instance.id, { vibrance: v[0] })}
          />
        );
      }
      case 'hue': {
        const value = (instance.params as any).hue as number;
        return (
          <Slider
            value={[value]}
            min={-1}
            max={1}
            step={0.01}
            onValueChange={(v) => onChangeParams(instance.id, { hue: v[0] })}
          />
        );
      }
    }
  };

  return (
    <Card className="p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="font-medium">{labelForKind(instance.kind)}</div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => onMoveUp(instance.id)}>↑</Button>
          <Button variant="secondary" onClick={() => onMoveDown(instance.id)}>↓</Button>
          <Button variant="secondary" onClick={() => onDuplicate(instance.id)}>Duplicate</Button>
          <Button variant="destructive" onClick={() => onDelete(instance.id)}>Delete</Button>
          <Button variant={instance.enabled ? 'default' : 'secondary'} onClick={() => onToggle(instance.id)}>
            {instance.enabled ? 'On' : 'Off'}
          </Button>
        </div>
      </div>
      {renderSlider()}
    </Card>
  );
};

export default DraggableSliderCard;
