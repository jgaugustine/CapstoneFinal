import { AEPriorities, AETrace, CameraSettings } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, ReferenceLine } from 'recharts';

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
  return (
    <Card>
      <CardHeader>
        <CardTitle>AE Mode</CardTitle>
        <CardDescription>
          Configure AE priorities and run auto-exposure to see the decision trace
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
                <span>{allocatedSettings.shutterSeconds >= 1 
                  ? `${allocatedSettings.shutterSeconds.toFixed(1)}s`
                  : `1/${Math.round(1 / allocatedSettings.shutterSeconds)}s`}</span>
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
          </div>
        )}

        {trace && (
          <div className="pt-4 border-t border-border space-y-4">
            <p className="text-sm font-semibold">AE Trace</p>
            
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
            </div>

            {trace.candidates.length > 0 && (
              <div className="pt-2">
                <p className="text-xs text-muted-foreground mb-2">EV vs Clipping</p>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={trace.candidates.map(c => ({
                    ev: c.ev,
                    highlightClip: c.highlightClip * 100,
                    shadowClip: c.shadowClip * 100,
                  }))}>
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
                      formatter={(value: number) => `${value.toFixed(2)}%`}
                      labelFormatter={(label) => `EV: ${label.toFixed(2)}`}
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
                      name="Highlight Clip"
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="shadowClip" 
                      stroke="hsl(var(--chart-3))" 
                      name="Shadow Clip"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
