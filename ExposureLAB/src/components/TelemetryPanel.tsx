import { Telemetry } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface TelemetryPanelProps {
  telemetry: Telemetry | null;
  sceneLuminance?: Float32Array;
  outputLuminance?: Float32Array;
}

export function TelemetryPanel({ telemetry, sceneLuminance, outputLuminance }: TelemetryPanelProps) {
  const buildHistogramData = (luminance?: Float32Array) => {
    if (!luminance || luminance.length === 0) return [];

    const bins = 64;
    const histogram = new Array(bins).fill(0);

    for (let i = 0; i < luminance.length; i++) {
      const value = luminance[i];
      const clamped = Math.max(0, Math.min(1, value));
      const bin = Math.floor(clamped * (bins - 1));
      histogram[bin]++;
    }

    const maxCount = Math.max(...histogram);
    if (maxCount === 0) return [];

    return histogram.map((count, index) => ({
      bin: index,
      value: count / maxCount,
      luminance: index / bins,
    }));
  };

  const sceneHist = buildHistogramData(sceneLuminance);
  const outputHist = buildHistogramData(outputLuminance);

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
            <p className="text-sm text-muted-foreground">Lower fence (IQR)</p>
            <p className="text-lg font-semibold">{telemetry.p1.toFixed(3)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Upper fence (IQR)</p>
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

        {(sceneHist.length > 0 || outputHist.length > 0) && (
          <div className="pt-4 border-t border-border space-y-4">
            {sceneHist.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-2">Scene luminance (metered image)</p>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={sceneHist}>
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
            {outputHist.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-2">Post-edit luminance (simulated output)</p>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={outputHist}>
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
                    <Bar dataKey="value" fill="hsl(0, 70%, 50%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
