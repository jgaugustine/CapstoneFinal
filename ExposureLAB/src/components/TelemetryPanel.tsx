import { Telemetry } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface TelemetryPanelProps {
  telemetry: Telemetry | null;
  luminance?: Float32Array;
}

export function TelemetryPanel({ telemetry, luminance }: TelemetryPanelProps) {
  // Compute histogram data
  const histogramData = (() => {
    if (!luminance || luminance.length === 0) return [];

    const bins = 64;
    const histogram = new Array(bins).fill(0);
    
    for (let i = 0; i < luminance.length; i++) {
      const value = Math.max(0, Math.min(1, luminance[i]));
      const bin = Math.floor(value * (bins - 1));
      histogram[bin]++;
    }

    // Normalize to 0-1 for display
    const max = Math.max(...histogram);
    if (max === 0) return [];

    return histogram.map((count, index) => ({
      bin: index,
      value: count / max,
      luminance: index / bins,
    }));
  })();

  if (!telemetry) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Telemetry</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Load an image to see telemetry</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Telemetry</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Mean</p>
            <p className="text-lg font-semibold">{telemetry.mean.toFixed(3)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Median</p>
            <p className="text-lg font-semibold">{telemetry.median.toFixed(3)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">P1</p>
            <p className="text-lg font-semibold">{telemetry.p1.toFixed(3)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">P99</p>
            <p className="text-lg font-semibold">{telemetry.p99.toFixed(3)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Highlight Clip</p>
            <p className="text-lg font-semibold text-destructive">
              {telemetry.highlightClipPercent.toFixed(2)}%
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Shadow Clip</p>
            <p className="text-lg font-semibold text-destructive">
              {telemetry.shadowClipPercent.toFixed(2)}%
            </p>
          </div>
        </div>

        {telemetry.subjectStats && (
          <div className="pt-4 border-t border-border">
            <p className="text-sm font-semibold mb-2">Subject Stats</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Mean</p>
                <p className="text-lg font-semibold">{telemetry.subjectStats.mean.toFixed(3)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Median</p>
                <p className="text-lg font-semibold">{telemetry.subjectStats.median.toFixed(3)}</p>
              </div>
            </div>
          </div>
        )}

        {histogramData.length > 0 && (
          <div className="pt-4 border-t border-border">
            <p className="text-sm font-semibold mb-2">Luminance Histogram</p>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={histogramData}>
                <XAxis 
                  dataKey="luminance" 
                  type="number"
                  domain={[0, 1]}
                  tickFormatter={(value) => value.toFixed(1)}
                />
                <YAxis hide />
                <Tooltip 
                  formatter={(value: number) => value.toFixed(2)}
                  labelFormatter={(label) => `Luminance: ${label.toFixed(2)}`}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
