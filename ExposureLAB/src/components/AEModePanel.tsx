import { AEPriorities, AETrace, CameraSettings, AECandidateStage } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, ReferenceLine } from 'recharts';
import { Card as UITableCard, CardHeader as UITableCardHeader, CardContent as UITableCardContent, CardTitle as UITableCardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

type CandidateChartPoint = {
  ev: number;
  highlightClip: number;
  shadowClip: number;
  median: number;
  midtoneError: number;
  stage: AECandidateStage;
};

interface AEModePanelProps {
  priorities: AEPriorities;
  onPrioritiesChange: (priorities: AEPriorities) => void;
  onRunAE: () => void;
  trace: AETrace | null;
  allocatedSettings: CameraSettings | null;
}

export function AEModePanel({
  priorities,
  onPrioritiesChange,
  onRunAE,
  trace,
  allocatedSettings,
}: AEModePanelProps) {
  const chartData: CandidateChartPoint[] | null = trace
    ? trace.candidates.map((c) => ({
        ev: c.ev,
        highlightClip: c.highlightClip * 100,
        shadowClip: c.shadowClip * 100,
        median: c.median,
        midtoneError: c.midtoneError,
        stage: c.stage,
      }))
    : null;

  const getStageColor = (stage: AECandidateStage): string => {
    if (stage === 'chosen') return 'hsl(var(--primary))';
    if (stage === 'stage2_feasible') return 'hsl(var(--chart-2))';
    if (stage === 'stage1_feasible') return 'hsl(var(--chart-3))';
    return 'hsl(var(--muted-foreground))';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AE Mode</CardTitle>
        <CardDescription>
          The auto-exposure engine sweeps across EVs: first protecting highlights, then guarding shadows, then choosing the EV whose midtones are closest to your target.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <p className="text-sm font-semibold">AE Priorities</p>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="etaHighlight">Highlight Tolerance (ηh)</Label>
              <span className="text-sm font-mono">{priorities.etaHighlight.toFixed(3)}</span>
            </div>
            <Slider
              id="etaHighlight"
              value={[priorities.etaHighlight * 100]}
              onValueChange={([value]) => {
                onPrioritiesChange({
                  ...priorities,
                  etaHighlight: value / 100,
                });
              }}
              min={0}
              max={100}
              step={1}
            />
            <p className="text-xs text-muted-foreground">Maximum allowed highlight clipping percentage</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="etaShadow">Shadow Tolerance (ηs)</Label>
              <span className="text-sm font-mono">{priorities.etaShadow.toFixed(3)}</span>
            </div>
            <Slider
              id="etaShadow"
              value={[priorities.etaShadow * 100]}
              onValueChange={([value]) => {
                onPrioritiesChange({
                  ...priorities,
                  etaShadow: value / 100,
                });
              }}
              min={0}
              max={100}
              step={1}
            />
            <p className="text-xs text-muted-foreground">Maximum allowed shadow clipping percentage</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="midtoneTarget">Midtone Target (m)</Label>
              <span className="text-sm font-mono">{priorities.midtoneTarget.toFixed(3)}</span>
            </div>
            <Slider
              id="midtoneTarget"
              value={[priorities.midtoneTarget * 100]}
              onValueChange={([value]) => {
                onPrioritiesChange({
                  ...priorities,
                  midtoneTarget: value / 100,
                });
              }}
              min={0}
              max={100}
              step={1}
            />
            <p className="text-xs text-muted-foreground">Target median luminance value</p>
          </div>
        </div>

        <Button onClick={onRunAE} className="w-full">
          Run Auto-Exposure
        </Button>

        {allocatedSettings && (
          <div className="pt-4 border-t border-border space-y-2">
            <p className="text-sm font-semibold">Allocated Settings</p>
            <div className="text-sm space-y-1 font-mono">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shutter:</span>
                <span>
                  {allocatedSettings.shutterSeconds >= 1
                    ? `${allocatedSettings.shutterSeconds.toFixed(1)}s`
                    : `1/${Math.round(1 / allocatedSettings.shutterSeconds)}s`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Aperture:</span>
                <span>f/{allocatedSettings.aperture.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ISO:</span>
                <span>{allocatedSettings.iso}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              This EV is then split across shutter speed, aperture, and ISO according to the current preference mode.
            </p>
          </div>
        )}

        {trace && (
          <div className="pt-4 border-t border-border space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold">AE Trace</p>
              <p className="text-xs text-muted-foreground">
                Stage 1: cap highlight clipping. Stage 2: also cap shadow clipping. Stage 3: within the feasible set, pick the EV whose midtones land closest to your target.
              </p>
            </div>
            
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Chosen EV:</span>
                <span className="font-mono">{trace.chosenEV.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stage 1 Feasible:</span>
                <span className="font-mono">{trace.stage1Feasible.length} candidates</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stage 2 Feasible:</span>
                <span className="font-mono">{trace.stage2Feasible.length} candidates</span>
              </div>
              {trace.relaxCountHighlight > 0 && (
                <div className="text-xs text-yellow-500">
                  Highlight tolerance relaxed {trace.relaxCountHighlight} time(s)
                </div>
              )}
              {trace.relaxCountShadow > 0 && (
                <div className="text-xs text-yellow-500">
                  Shadow tolerance relaxed {trace.relaxCountShadow} time(s)
                </div>
              )}
              {trace.chosenReason && (
                <p className="text-xs text-muted-foreground">
                  Why this EV: {trace.chosenReason}
                </p>
              )}
            </div>

            {chartData && chartData.length > 0 && (
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">EV vs Clipping</p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-full bg-[hsl(var(--muted-foreground))]" />
                      <span className="text-[10px] text-muted-foreground">Infeasible</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-full bg-[hsl(var(--chart-3))]" />
                      <span className="text-[10px] text-muted-foreground">Stage 1 (highlights ok)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-full bg-[hsl(var(--chart-2))]" />
                      <span className="text-[10px] text-muted-foreground">Stage 2 (highlights + shadows ok)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-full bg-[hsl(var(--primary))]" />
                      <span className="text-[10px] text-muted-foreground">Chosen EV</span>
                    </div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <XAxis 
                      dataKey="ev" 
                      type="number"
                      domain={['dataMin', 'dataMax']}
                      tickFormatter={(value) => value.toFixed(1)}
                    />
                    <YAxis 
                      label={{ value: 'Clipping %', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      formatter={(value: number, name, props) => {
                        if (name === 'median') {
                          return [value.toFixed(3), 'Median luminance'];
                        }
                        if (name === 'midtoneError') {
                          return [value.toFixed(4), 'Midtone error'];
                        }
                        return [`${value.toFixed(2)}%`, name];
                      }}
                      labelFormatter={(label) => `EV: ${Number(label).toFixed(2)}`}
                    />
                    <Legend />
                    <ReferenceLine 
                      x={trace.chosenEV} 
                      stroke="hsl(var(--primary))" 
                      strokeDasharray="3 3"
                      label="Chosen"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="highlightClip" 
                      stroke="hsl(var(--destructive))" 
                      name="Highlight Clip (blown highlights)"
                      dot={{ r: 2, strokeWidth: 0, fill: (d: any) => getStageColor(d.stage) }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="shadowClip" 
                      stroke="hsl(var(--chart-3))" 
                      name="Shadow Clip (crushed shadows)"
                      dot={{ r: 2, strokeWidth: 0, fill: (d: any) => getStageColor(d.stage) }}
                    />
                    {/* Optional median and midtone error curves to show Stage 3 reasoning */}
                    <Line
                      type="monotone"
                      yAxisId={1}
                      dataKey="median"
                      stroke="hsl(var(--chart-4))"
                      name="Median luminance (0-1)"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      yAxisId={2}
                      dataKey="midtoneError"
                      stroke="hsl(var(--chart-5))"
                      name="Midtone error (distance from target)"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Candidate comparison table */}
            {chartData && chartData.length > 0 && (
              <UITableCard className="mt-4">
                <UITableCardHeader className="pb-2">
                  <UITableCardTitle className="text-sm">Candidate comparison</UITableCardTitle>
                  <p className="text-xs text-muted-foreground">
                    See how different EVs trade off highlight/shadow clipping and midtone fit. The chosen EV is highlighted.
                  </p>
                </UITableCardHeader>
                <UITableCardContent className="pt-0">
                  <ScrollArea className="h-40">
                    <table className="w-full text-xs">
                      <thead className="text-[10px] text-muted-foreground">
                        <tr className="border-b border-border">
                          <th className="py-1 pr-2 text-right">EV</th>
                          <th className="py-1 pr-2 text-right">Highlight %</th>
                          <th className="py-1 pr-2 text-right">Shadow %</th>
                          <th className="py-1 pr-2 text-right">Median</th>
                          <th className="py-1 pr-2 text-right">Midtone err</th>
                          <th className="py-1 pr-2 text-left">Stage / Outcome</th>
                        </tr>
                      </thead>
                      <tbody>
                        {chartData
                          .slice()
                          .sort((a, b) => a.ev - b.ev)
                          .map((row) => {
                            const isChosen = Math.abs(row.ev - trace.chosenEV) < 1e-6;
                            let stageLabel = 'Rejected';
                            if (row.stage === 'stage1_feasible') stageLabel = 'Stage 1 (ηh ok)';
                            if (row.stage === 'stage2_feasible') stageLabel = 'Stage 2 (ηh, ηs ok)';
                            if (row.stage === 'chosen') stageLabel = 'Chosen';

                            let reason = '';
                            if (row.stage === 'initial') {
                              if (row.highlightClip > aePriorities.etaHighlight) {
                                reason = '> ηh (too much highlight clip)';
                              } else if (row.shadowClip > aePriorities.etaShadow) {
                                reason = '> ηs (too much shadow clip)';
                              }
                            }

                            return (
                              <tr
                                key={row.ev}
                                className={`border-b border-border/40 ${isChosen ? 'bg-primary/10 font-semibold' : ''}`}
                              >
                                <td className="py-1 pr-2 text-right font-mono">{row.ev.toFixed(2)}</td>
                                <td className="py-1 pr-2 text-right font-mono">
                                  {row.highlightClip.toFixed(2)}
                                </td>
                                <td className="py-1 pr-2 text-right font-mono">
                                  {row.shadowClip.toFixed(2)}
                                </td>
                                <td className="py-1 pr-2 text-right font-mono">
                                  {row.median.toFixed(3)}
                                </td>
                                <td className="py-1 pr-2 text-right font-mono">
                                  {row.midtoneError.toFixed(4)}
                                </td>
                                <td className="py-1 pr-2 text-left">
                                  <span className="block">{stageLabel}</span>
                                  {reason && (
                                    <span className="block text-[10px] text-muted-foreground">{reason}</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </ScrollArea>
                </UITableCardContent>
              </UITableCard>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
