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

    // For display, stretch the *actual* luminance range to fill [0, 1],
    // so the histogram always uses the full x-axis even if the image
    // only occupies a subrange like [0, 0.5]. This is purely visual;
    // AE math still uses absolute [0, 1] elsewhere.
    let min = Infinity;
    let maxVal = -Infinity;
    for (let i = 0; i < luminance.length; i++) {
      const v = luminance[i];
      if (v < min) min = v;
      if (v > maxVal) maxVal = v;
    }
    if (!Number.isFinite(min) || !Number.isFinite(maxVal) || min === maxVal) {
      return [];
    }
    const range = maxVal - min;

    for (let i = 0; i < luminance.length; i++) {
      const value = luminance[i];
      const normalized = (value - min) / range; // 0–1 over actual used range
      const clamped = Math.max(0, Math.min(1, normalized));
      const bin = Math.floor(clamped * (bins - 1));
      histogram[bin]++;
    }

    // Normalize to 0-1 for display
    const maxCount = Math.max(...histogram);
    if (maxCount === 0) return [];

    return histogram.map((count, index) => ({
      bin: index,
      value: count / maxCount,
      luminance: index / bins, // 0–1 over stretched display range
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
