import React from 'react';

interface ADCPanelProps {
  wellCapacity: number;
  maxDigitalValue: number;
  chargeAccumulated: number;
  isRunning: boolean;
}

const ADCPanel: React.FC<ADCPanelProps> = ({ wellCapacity, maxDigitalValue, chargeAccumulated, isRunning }) => {
  return (
    <div className="space-y-4 relative">
      <h3 className="text-lg font-semibold text-foreground">3. ADC Conversion</h3>
      <div className="relative bg-card border-2 border-border rounded-lg h-40 p-4">
        <div className="h-full flex flex-col justify-center items-center space-y-3">
          <div className="text-sm text-muted-foreground text-center">{wellCapacity} e⁻ → {maxDigitalValue} levels</div>
          <div className="w-full h-8 bg-secondary rounded overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-charge to-digital transition-all duration-500"
              style={{ width: `${(chargeAccumulated / wellCapacity) * 100}%` }}
            />
            {Array.from({ length: Math.min(8, maxDigitalValue) }).map((_, i) => (
              <div key={i} className="absolute top-0 bottom-0 w-px bg-border/50" style={{ left: `${(i / Math.min(8, maxDigitalValue)) * 100}%` }} />
            ))}
          </div>
          <div className="text-xs text-muted-foreground text-center">Step: {(wellCapacity / maxDigitalValue).toFixed(0)} e⁻/DN</div>
          {isRunning && (
            <div className="text-xs text-digital animate-pulse">Converting: {Math.round((chargeAccumulated / wellCapacity) * maxDigitalValue)} DN</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ADCPanel;


