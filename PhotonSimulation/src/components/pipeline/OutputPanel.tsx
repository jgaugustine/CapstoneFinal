import React from 'react';
import { Badge } from '@/components/ui/badge';

interface OutputPanelProps {
  isExposureComplete: boolean;
  digitalValue: number;
  bitDepth: number;
  maxDigitalValue: number;
}

const OutputPanel: React.FC<OutputPanelProps> = ({ isExposureComplete, digitalValue, bitDepth, maxDigitalValue }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">4. Digital Output</h3>
      <div className="relative bg-card border-2 border-border rounded-lg h-40 p-4 flex flex-col items-center justify-center space-y-3">
        {isExposureComplete ? (
          <>
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold text-digital animate-digital-pulse" style={{ textShadow: '0 0 10px hsl(var(--digital-glow))' }}>
                {digitalValue}
              </div>
              <div className="text-sm text-muted-foreground">{bitDepth}-bit value</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-xs text-muted-foreground">Pixel Brightness:</div>
              <div
                className="w-12 h-12 border-2 border-border rounded shadow-inner"
                style={{ backgroundColor: `rgb(${Array(3).fill(Math.round((digitalValue / maxDigitalValue) * 255)).join(',')})` }}
              />
            </div>
          </>
        ) : (
          <div className="text-center space-y-2">
            <div className="text-2xl text-muted-foreground">---</div>
            <div className="text-sm text-muted-foreground">Converting...</div>
          </div>
        )}
      </div>
      <div className="text-center">
        <Badge variant="outline" className="text-digital border-digital">
          Range: 0-{maxDigitalValue}
        </Badge>
      </div>
    </div>
  );
};

export default OutputPanel;


