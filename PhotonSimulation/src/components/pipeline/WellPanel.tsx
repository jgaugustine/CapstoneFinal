import React from 'react';
import { Badge } from '@/components/ui/badge';

interface WellPanelProps {
  fillPercentage: number;
  isOverflow: boolean;
  wellCapacity: number;
  chargeAccumulated: number;
}

const WellPanel: React.FC<WellPanelProps> = ({ fillPercentage, isOverflow, wellCapacity, chargeAccumulated }) => {
  return (
    <div className="space-y-4 relative">
      <h3 className="text-lg font-semibold text-foreground">2. Photosite Well</h3>
      <div className="relative bg-card border-2 border-border rounded-lg h-40 p-4">
        <div className="relative h-full w-full border-2 border-charge rounded bg-secondary">
          <div
            className="absolute bottom-0 left-0 right-0 rounded transition-all duration-300 origin-bottom"
            style={{
              height: `${fillPercentage}%`,
              background: isOverflow ? 'linear-gradient(to top, hsl(var(--overflow)), hsl(var(--charge)))' : 'var(--gradient-pixel-well)',
            }}
          />

          <div className="absolute top-2 left-2 text-xs text-muted-foreground">{wellCapacity} e⁻ max</div>

          {Array.from({ length: Math.min(10, Math.floor(fillPercentage / 10)) }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-blue-300 rounded-full animate-pulse"
              style={{ left: `${20 + ((i % 3) * 20)}%`, bottom: `${10 + (i * 8)}%`, animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>

        {isOverflow && (
          <div className="absolute -bottom-2 left-4 right-4 h-3 bg-overflow/50 rounded-b border-2 border-overflow">
            <div className="text-xs text-center text-overflow font-medium">Overflow (Blooming risk)</div>
          </div>
        )}
      </div>
      <div className="text-center space-y-2">
        <Badge variant="outline" className="text-charge border-charge">
          {chargeAccumulated} e⁻ stored
        </Badge>
        <div className="text-xs text-muted-foreground">{fillPercentage.toFixed(1)}% capacity</div>
      </div>
    </div>
  );
};

export default WellPanel;


