import { useState } from 'react';
import { AEPriorities, AETrace, CameraSettings, AllocationLog, Constraints, AEAlgorithm } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, ReferenceLine, ReferenceArea, BarChart, Bar, Cell } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WeightMapHeatmap } from '@/components/WeightMapHeatmap';

interface AEModePanelProps {
  priorities: AEPriorities;
  onPrioritiesChange: (priorities: AEPriorities) => void;
  algorithm: AEAlgorithm;
  onAlgorithmChange: (algo: AEAlgorithm) => void;
  onRunAE: () => void;
  trace: AETrace | null;
  allocatedSettings: CameraSettings | null;
  allocationLog: AllocationLog | null;
  constraints: Constraints;
  baseEV: number | null;
  targetEV: number | null;
  clampedTargetEV: number | null;
}

export function AEModePanel({
  priorities,
  onPrioritiesChange,
  algorithm,
  onAlgorithmChange,
  onRunAE,
  trace,
  allocatedSettings,
  allocationLog,
  constraints,
  baseEV,
  targetEV,
  clampedTargetEV,
}: AEModePanelProps) {
  const [showExplainer, setShowExplainer] = useState(false);

  const evBreakdown = allocationLog?.evBreakdown;

  return (
    <Card>
      <CardHeader>
        <CardTitle>AE Mode</CardTitle>
        <CardDescription>
          Choose a histogram-based AE algorithm that optimizes EV from the metering histogram, then see how that EV is split across shutter speed, aperture, and ISO within your constraints.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <p className="text-sm font-semibold">AE Algorithm & Priorities</p>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="aeAlgorithm"
                title="Controls how the metering histogram is interpreted when choosing the target exposure value (EV)."
              >
                AE Algorithm
              </Label>
            </div>
            <Select
              value={algorithm}
              onValueChange={(value) => onAlgorithmChange(value as AEAlgorithm)}
            >
              <SelectTrigger id="aeAlgorithm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">Global (full-frame manipulated histogram)</SelectItem>
                <SelectItem value="semantic">Semantic / ROI-weighted histogram</SelectItem>
                <SelectItem value="saliency">Saliency-weighted histogram</SelectItem>
                <SelectItem value="entropy">Entropy (max-entropy histogram)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Global/semantic/saliency build a manipulated luminance histogram and choose the EV whose median is closest to a key midtone value, subject to highlight/shadow clipping tolerances; entropy picks the EV whose manipulated histogram has maximum entropy under the same tolerances.
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="etaHighlight"
                title="Maximum fraction of metered pixels the AE is allowed to clip in highlights before it starts relaxing its constraints."
              >
                Highlight Tolerance (ηh)
              </Label>
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
              <Label
                htmlFor="etaShadow"
                title="Maximum fraction of metered pixels the AE is allowed to crush into deep shadows before relaxing its constraints."
              >
                Shadow Tolerance (ηs)
              </Label>
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
              <Label
                htmlFor="midtoneTarget"
                title="Target median luminance level in the manipulated histogram, often thought of as '18% gray'."
              >
                Midtone Target (m)
              </Label>
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
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={onRunAE} className="w-full sm:flex-1">
            Run Auto-Exposure
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => setShowExplainer((prev) => !prev)}
            disabled={!trace && !allocationLog}
            title="Show a step-by-step explanation of how AE chose ΔEV and how it was split across shutter, aperture, and ISO."
          >
            {showExplainer ? 'Hide explainer' : 'Explain AE & EV'}
          </Button>
        </div>

        {trace && (
          <div className="pt-4 border-t border-border space-y-2">
            <p className="text-sm font-semibold">Chosen ΔEV</p>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ΔEV:</span>
                <span className="font-mono">{trace.chosenEV >= 0 ? '+' : ''}{trace.chosenEV.toFixed(2)}</span>
              </div>
              {trace.chosenReason && (
                <p className="text-xs text-muted-foreground">
                  {trace.chosenReason}
                </p>
              )}
            </div>
          </div>
        )}

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
              Target EV is split across shutter, aperture, and ISO by the allocation optimizer, subject to your constraints.
            </p>
          </div>
        )}

        {showExplainer && (
          <div className="pt-4 border-t border-border space-y-3">
            <p className="text-sm font-semibold">How AE chose ΔEV and how it became settings</p>
            <p className="text-xs text-muted-foreground">
              {algorithm === 'global' &&
                'For this algorithm we use a full-frame histogram with no spatial weighting; only saturated pixels (luminance ≥ 0.98) are excluded. Four steps: (1) build the manipulated histogram, (2) enforce clipping tolerances, (3) pick the EV that minimizes midtone error, (4) convert ΔEV into camera settings.'}
              {algorithm === 'semantic' &&
                'For this algorithm we use an ROI/subject-weighted histogram from your metering (e.g. subject mask). Four steps: (1) build the weighted histogram, (2) enforce clipping tolerances, (3) pick the EV that minimizes midtone error, (4) convert ΔEV into camera settings.'}
              {algorithm === 'saliency' &&
                'For this algorithm we use a saliency-weighted histogram (pixels that stand out from the mean get higher weight). Four steps: (1) build the weighted histogram, (2) enforce clipping tolerances, (3) pick the EV that minimizes midtone error, (4) convert ΔEV into camera settings.'}
              {algorithm === 'entropy' &&
                'For this algorithm we maximize histogram entropy (tone spread) under clipping tolerances; there is no midtone target. Four steps: (1) build the full-frame histogram (saturated excluded), (2) enforce clipping tolerances, (3) pick the EV that maximizes entropy, (4) convert ΔEV into camera settings.'}
            </p>
            {!trace && (
              <p className="text-xs text-muted-foreground">
                Run auto-exposure to see each step with your image and parameters.
              </p>
            )}
            {trace && (
                  <div className="space-y-6 pt-2">
                    {/* Step 1: Histogram after outlier removal, at reference exposure (EV=0) so it matches the scene */}
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Step 1: Build the manipulated histogram</p>
                      <p className="text-xs text-muted-foreground">
                        {algorithm === 'global' &&
                          'We remove outliers (pixels with luminance ≥ 0.98 are excluded) and use full-frame weighting (all remaining pixels weighted equally). Below is the weight map and the resulting histogram at reference exposure (EV=0). The vertical line is the midtone target m = '}
                        {algorithm === 'semantic' &&
                          'We remove outliers and apply ROI/subject weights from metering. Below is the weight map and the weighted histogram at EV=0. The vertical line is the midtone target m = '}
                        {algorithm === 'saliency' &&
                          'We remove outliers and apply saliency weights (higher where luminance deviates from the mean). Below is the saliency weight map and the weighted histogram at EV=0. The vertical line is the midtone target m = '}
                        {algorithm === 'entropy' &&
                          'We remove outliers and use full-frame weighting (saturated excluded). Below is the weight map and the histogram at EV=0. There is no midtone target; in Step 3 we pick the EV that maximizes this histogram\'s entropy. For reference, the midtone target m = '}
                        {(algorithm === 'global' || algorithm === 'semantic' || algorithm === 'saliency') && (
                          <>
                            <span className="font-mono">{priorities.midtoneTarget.toFixed(3)}</span>;
                            the median line shows where the scene sits. We choose ΔEV so the median moves toward m.
                          </>
                        )}
                        {algorithm === 'entropy' && (
                          <>
                            <span className="font-mono">{priorities.midtoneTarget.toFixed(3)}</span> (used only for display; entropy mode does not target it).
                          </>
                        )}
                      </p>
                      {trace.algorithmWeightMap && (
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground font-medium">
                            {algorithm === 'global' || algorithm === 'entropy'
                              ? 'Full-frame weighting (brighter = included, dark = saturated excluded)'
                              : algorithm === 'semantic'
                              ? 'ROI / subject weight map (brighter = higher weight)'
                              : 'Saliency weight map (brighter = higher weight)'}
                          </p>
                          <WeightMapHeatmap
                            width={trace.algorithmWeightMap.width}
                            height={trace.algorithmWeightMap.height}
                            data={trace.algorithmWeightMap.data}
                            maxWidth={280}
                            maxHeight={160}
                          />
                        </div>
                      )}
                      {trace.manipulatedHistogramAtZero && trace.manipulatedHistogramAtZero.bins.length > 0 && (() => {
                        const { bins, min: hMin, max: hMax, median: refMedian } = trace.manipulatedHistogramAtZero;
                        const total = bins.reduce((a, b) => a + b, 0);
                        const maxFraction = total > 0 ? Math.max(...bins) / total : 0;
                        const yMax = maxFraction > 0 ? maxFraction * 1.1 : 0.1;
                        const histData = bins.map((count, i) => ({
                          luminance: hMin + (i + 0.5) * (hMax - hMin) / bins.length,
                          fraction: total > 0 ? count / total : 0,
                        }));
                        return (
                          <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={histData} margin={{ top: 4, right: 24, bottom: 24, left: 4 }}>
                                <XAxis
                                  dataKey="luminance"
                                  type="number"
                                  domain={[0, 1]}
                                  tickFormatter={(v) => v.toFixed(2)}
                                  label={{ value: 'Luminance', position: 'insideBottom', offset: -5 }}
                                />
                                <YAxis
                                  tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                                  domain={[0, yMax]}
                                  label={{ value: 'Fraction', angle: -90, position: 'insideLeft' }}
                                />
                                <Tooltip
                                  formatter={(value: number) => [`${(value * 100).toFixed(2)}%`, 'Fraction']}
                                  labelFormatter={(label) => `Luminance: ${Number(label).toFixed(3)}`}
                                />
                                <ReferenceLine
                                  x={priorities.midtoneTarget}
                                  stroke="hsl(var(--primary))"
                                  strokeDasharray="3 3"
                                  label={{ value: 'Target m', position: 'top' }}
                                />
                                {refMedian != null && (
                                  <ReferenceLine
                                    x={refMedian}
                                    stroke="hsl(var(--chart-2))"
                                    strokeDasharray="2 2"
                                    label={{ value: 'Median', position: 'top' }}
                                  />
                                )}
                                <Bar dataKey="fraction" fill="hsl(var(--chart-1))" name="Fraction" isAnimationActive={false} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Step 2: Feasibility (clipping tolerances) */}
                    {trace.candidates.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">Step 2: Enforce clipping tolerances</p>
                        <p className="text-xs text-muted-foreground">
                          We sweep EV candidates and keep only those whose weighted highlight clip ≤ ηh (
                          <span className="font-mono">{priorities.etaHighlight.toFixed(3)}</span>) and shadow clip ≤ ηs (
                          <span className="font-mono">{priorities.etaShadow.toFixed(3)}</span>). Candidates below the
                          tolerance lines are feasible; the vertical line is the chosen EV.
                        </p>
                        <div className="h-[200px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={trace.candidates.map((c) => ({
                                ev: c.ev,
                                highlightClip: c.highlightClip,
                                shadowClip: c.shadowClip,
                              }))}
                            >
                              <XAxis
                                dataKey="ev"
                                type="number"
                                tickFormatter={(v) => v.toFixed(1)}
                                label={{ value: 'EV', position: 'insideBottom', offset: -5 }}
                              />
                              <YAxis
                                tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                                domain={[0, 1]}
                                label={{ value: 'Clip fraction', angle: -90, position: 'insideLeft' }}
                              />
                              <Tooltip
                                formatter={(value: number, name: string) => [
                                  `${(value * 100).toFixed(2)}%`,
                                  name === 'highlightClip' ? 'Highlight clip' : 'Shadow clip',
                                ]}
                                labelFormatter={(label) => `EV: ${Number(label).toFixed(2)}`}
                              />
                              <Legend />
                              <ReferenceLine
                                y={priorities.etaHighlight}
                                stroke="hsl(var(--chart-1))"
                                strokeDasharray="3 3"
                                label={{ value: 'ηh', position: 'right' }}
                              />
                              <ReferenceLine
                                y={priorities.etaShadow}
                                stroke="hsl(var(--chart-2))"
                                strokeDasharray="3 3"
                                label={{ value: 'ηs', position: 'right' }}
                              />
                              {(() => {
                                // Shade feasible EV range in green: candidates that pass clipping
                                // tolerances (stage2_feasible or chosen).
                                const feasibleIntervals: { x1: number; x2: number }[] = [];
                                let blockStart: number | null = null;
                                for (let i = 0; i < trace.candidates.length; i++) {
                                  const c = trace.candidates[i];
                                  const feasible =
                                    c.stage === 'stage2_feasible' || c.stage === 'chosen';
                                  if (feasible) {
                                    if (blockStart === null) blockStart = c.ev;
                                  } else if (blockStart !== null) {
                                    feasibleIntervals.push({
                                      x1: blockStart,
                                      x2: trace.candidates[i - 1].ev,
                                    });
                                    blockStart = null;
                                  }
                                }
                                if (blockStart !== null) {
                                  const last = trace.candidates[trace.candidates.length - 1];
                                  feasibleIntervals.push({ x1: blockStart, x2: last.ev });
                                }
                                return feasibleIntervals.map((interval, idx) => (
                                  <ReferenceArea
                                    key={idx}
                                    x1={interval.x1}
                                    x2={interval.x2}
                                    fill="rgba(34, 197, 94, 0.18)" // green, matches "feasible" semantics
                                  />
                                ));
                              })()}
                              <Line
                                type="monotone"
                                dataKey="highlightClip"
                                stroke="hsl(var(--chart-1))"
                                name="Highlight clip"
                                dot={false}
                                connectNulls
                              />
                              <Line
                                type="monotone"
                                dataKey="shadowClip"
                                stroke="hsl(var(--chart-2))"
                                name="Shadow clip"
                                dot={false}
                                connectNulls
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Objective (entropy or midtone error) */}
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Step 3: Choose the best EV among feasible</p>
                      {algorithm === 'entropy' && trace.candidates.some((c) => c.entropy != null) ? (
                        <>
                          <p className="text-xs text-muted-foreground">
                            Among feasible EVs, we pick the one that maximizes histogram entropy (spread of tones).
                          </p>
                          <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart
                                data={trace.candidates.map((c) => ({
                                  ev: c.ev,
                                  entropy: c.entropy ?? undefined,
                                }))}
                              >
                                <XAxis
                                  dataKey="ev"
                                  type="number"
                                  tickFormatter={(v) => v.toFixed(1)}
                                  label={{ value: 'EV', position: 'insideBottom', offset: -5 }}
                                />
                                <YAxis
                                  tickFormatter={(v) => v.toFixed(2)}
                                  label={{ value: 'Entropy', angle: -90, position: 'insideLeft' }}
                                />
                                <Tooltip
                                  formatter={(value: number) => [value != null ? value.toFixed(3) : '—', 'Entropy']}
                                  labelFormatter={(label) => `EV: ${Number(label).toFixed(2)}`}
                                />
                                {(() => {
                                  const infeasibleIntervals: { x1: number; x2: number }[] = [];
                                  let blockStart: number | null = null;
                                  for (let i = 0; i < trace.candidates.length; i++) {
                                    const c = trace.candidates[i];
                                    const feasible = c.stage === 'stage2_feasible' || c.stage === 'chosen';
                                    if (!feasible) {
                                      if (blockStart === null) blockStart = c.ev;
                                    } else {
                                      if (blockStart !== null) {
                                        infeasibleIntervals.push({ x1: blockStart, x2: trace.candidates[i - 1].ev });
                                        blockStart = null;
                                      }
                                    }
                                  }
                                  if (blockStart !== null) {
                                    const last = trace.candidates[trace.candidates.length - 1];
                                    infeasibleIntervals.push({ x1: blockStart, x2: last.ev });
                                  }
                                  return infeasibleIntervals.map((interval, idx) => (
                                    <ReferenceArea key={idx} x1={interval.x1} x2={interval.x2} fill="rgba(239, 68, 68, 0.18)" />
                                  ));
                                })()}
                                <ReferenceLine
                                  x={trace.chosenEV}
                                  stroke="hsl(var(--primary))"
                                  strokeDasharray="3 3"
                                  label="Chosen EV"
                                />
                                <Line
                                  type="monotone"
                                  dataKey="entropy"
                                  stroke="hsl(var(--chart-3))"
                                  name="Entropy"
                                  dot={false}
                                  connectNulls
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Light red = infeasible (exceeds ηh or ηs). Choice is made only among unshaded EVs.
                          </p>
                        </>
                      ) : (
                        algorithm !== 'entropy' && (
                          <>
                            <p className="text-xs text-muted-foreground">
                              Among feasible EVs (those that pass the clipping tolerances in Step 2), we pick the one that minimizes midtone error (median closest to target m). The chosen EV is the minimum of the curve within that feasible band; if it is not the global minimum of the curve, that is because the global minimum lies where highlight or shadow clip would exceed the tolerances.
                            </p>
                            <div className="h-[200px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                  data={trace.candidates.map((c) => ({
                                    ev: c.ev,
                                    midtoneError: c.midtoneError,
                                    median: c.median,
                                  }))}
                                >
                                  <XAxis
                                    dataKey="ev"
                                    type="number"
                                    tickFormatter={(v) => v.toFixed(1)}
                                    label={{ value: 'EV', position: 'insideBottom', offset: -5 }}
                                  />
no                                  <YAxis
                                    yAxisId="error"
                                    orientation="left"
                                    tickFormatter={(v) => v.toFixed(3)}
                                    label={{ value: 'Midtone error', angle: -90, position: 'insideLeft' }}
                                  />
                                  <YAxis
                                    yAxisId="median"
                                    orientation="right"
                                    tickFormatter={(v) => v.toFixed(2)}
                                    label={{ value: 'Median', angle: 90, position: 'insideRight' }}
                                  />
                                  <Tooltip
                                    formatter={(value: number, name: string) => {
                                      if (name === 'midtoneError') return [value.toFixed(4), 'Midtone error'];
                                      if (name === 'median') return [value.toFixed(3), 'Median'];
                                      return [value, name];
                                    }}
                                    labelFormatter={(label) => `EV: ${Number(label).toFixed(2)}`}
                                  />
                                  {(() => {
                                    const infeasibleIntervals: { x1: number; x2: number }[] = [];
                                    let blockStart: number | null = null;
                                    for (let i = 0; i < trace.candidates.length; i++) {
                                      const c = trace.candidates[i];
                                      const feasible = c.stage === 'stage2_feasible' || c.stage === 'chosen';
                                      if (!feasible) {
                                        if (blockStart === null) blockStart = c.ev;
                                      } else {
                                        if (blockStart !== null) {
                                          infeasibleIntervals.push({ x1: blockStart, x2: trace.candidates[i - 1].ev });
                                          blockStart = null;
                                        }
                                      }
                                    }
                                    if (blockStart !== null) {
                                      const last = trace.candidates[trace.candidates.length - 1];
                                      infeasibleIntervals.push({ x1: blockStart, x2: last.ev });
                                    }
                                    return infeasibleIntervals.map((interval, idx) => (
                                      <ReferenceArea
                                        key={idx}
                                        x1={interval.x1}
                                        x2={interval.x2}
                                        yAxisId="error"
                                        fill="rgba(239, 68, 68, 0.18)"
                                      />
                                    ));
                                  })()}
                                  <Legend />
                                  <ReferenceLine
                                    yAxisId="error"
                                    x={trace.chosenEV}
                                    stroke="hsl(var(--primary))"
                                    strokeDasharray="3 3"
                                    label="Chosen EV"
                                  />
                                  <ReferenceLine
                                    yAxisId="median"
                                    y={priorities.midtoneTarget}
                                    stroke="hsl(var(--chart-2))"
                                    strokeDasharray="3 3"
                                    label={{ value: 'Target m', position: 'right' }}
                                  />
                                  <Line
                                    type="monotone"
                                    yAxisId="error"
                                    dataKey="midtoneError"
                                    stroke="hsl(var(--chart-1))"
                                    name="Midtone error"
                                    dot={false}
                                    connectNulls
                                  />
                                  <Line
                                    type="monotone"
                                    yAxisId="median"
                                    dataKey="median"
                                    stroke="hsl(var(--chart-2))"
                                    name="Median"
                                    dot={false}
                                    connectNulls
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Light red = infeasible (exceeds ηh or ηs). Choice is made only among unshaded EVs.
                            </p>
                          </>
                        )
                      )}
                    </div>

                    {/* Step 4: How settings are chosen + allocation algorithm */}
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">Step 4: Convert ΔEV into camera settings</p>
                        <p className="text-xs text-muted-foreground">
                          The chosen ΔEV is added to the current exposure EV to get a target EV, which is clamped to the
                          feasible range and then split across shutter speed, aperture, and ISO by the allocation
                          optimizer (subject to your constraints).
                        </p>
                      </div>

                      {/* How allocation works — 4 sub-steps with plots */}
                      <div className="space-y-6 pl-2 border-l-2 border-border">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          How allocation works
                        </p>

                        {/* Allocation Step 1: Quantize target EV */}
                        <div className="space-y-2">
                          <p className="text-sm font-semibold">Allocation Step 1: Quantize target EV</p>
                          <p className="text-xs text-muted-foreground">
                            The allocator works in discrete EV steps (e.g. 1/3 EV). The target EV is rounded to the nearest{' '}
                            <span className="font-mono">{constraints.quantizationStep.toFixed(3)}</span> step so all downstream
                            math uses a single quantized value.
                          </p>
                          {allocationLog?.quantizationApplied && clampedTargetEV != null && (
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="text-xs text-muted-foreground">
                                Target was adjusted to the nearest step (quantization applied).
                              </span>
                              <div className="h-[80px] w-[200px]">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart
                                    data={[
                                      { name: 'Target EV', value: clampedTargetEV, fill: 'hsl(var(--muted-foreground))' },
                                      {
                                        name: 'Quantized',
                                        value: Math.round(clampedTargetEV / constraints.quantizationStep) * constraints.quantizationStep,
                                        fill: 'hsl(var(--primary))',
                                      },
                                    ]}
                                    layout="vertical"
                                    margin={{ top: 4, right: 24, bottom: 4, left: 4 }}
                                  >
                                    <XAxis type="number" tickFormatter={(v) => v.toFixed(2)} dataKey="value" />
                                    <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 11 }} />
                                    <Tooltip formatter={(v: number) => [v.toFixed(3), 'EV']} />
                                    <Bar dataKey="value" radius={[0, 2, 2, 0]} />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Allocation Step 2: Choose preference and target split */}
                        <div className="space-y-2">
                          <p className="text-sm font-semibold">Allocation Step 2: Choose preference and target split</p>
                          <p className="text-xs text-muted-foreground">
                            The <span className="font-mono">{allocationLog?.preference ?? 'balanced'}</span> preference fixes
                            how the total EV is split across shutter, aperture, and ISO:
                          </p>
                          <ul className="text-xs text-muted-foreground list-disc list-inside space-y-0.5">
                            <li><strong>shutter:</strong> Give shutter full EV first; remainder split 60% aperture / 40% ISO.</li>
                            <li><strong>aperture:</strong> Give aperture full EV first; remainder 60% shutter / 40% ISO.</li>
                            <li><strong>iso:</strong> Fix ISO at base; split 50% shutter / 50% aperture.</li>
                            <li><strong>balanced:</strong> Split evenly: one-third each.</li>
                          </ul>
                          {clampedTargetEV != null && (allocationLog?.preference === 'balanced' || allocationLog?.preference === 'iso') && (
                            <div className="h-[140px]">
                              <p className="text-xs text-muted-foreground mb-1">Target EV split (conceptual)</p>
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                  data={
                                    allocationLog.preference === 'balanced'
                                      ? [
                                          { name: 'Shutter', ev: clampedTargetEV / 3, fill: 'hsl(var(--chart-1))' },
                                          { name: 'Aperture', ev: clampedTargetEV / 3, fill: 'hsl(var(--chart-2))' },
                                          { name: 'ISO', ev: clampedTargetEV / 3, fill: 'hsl(var(--chart-3))' },
                                        ]
                                      : [
                                          { name: 'Shutter', ev: clampedTargetEV / 2, fill: 'hsl(var(--chart-1))' },
                                          { name: 'Aperture', ev: clampedTargetEV / 2, fill: 'hsl(var(--chart-2))' },
                                          { name: 'ISO', ev: 0, fill: 'hsl(var(--chart-3))' },
                                        ]
                                  }
                                  margin={{ top: 4, right: 24, bottom: 24, left: 4 }}
                                >
                                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                  <YAxis tickFormatter={(v) => v.toFixed(2)} label={{ value: 'EV', angle: -90, position: 'insideLeft' }} />
                                  <Tooltip formatter={(v: number) => [v.toFixed(3), 'EV']} />
                                  <Bar dataKey="ev" radius={[2, 2, 0, 0]}>
                                    {[ 'hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))' ].map((fill, i) => (
                                      <Cell key={i} fill={fill} />
                                    ))}
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          )}
                        </div>

                        {/* Allocation Step 3: Compute settings and apply constraints */}
                        <div className="space-y-2">
                          <p className="text-sm font-semibold">Allocation Step 3: Compute settings and apply constraints</p>
                          <p className="text-xs text-muted-foreground">
                            The target EV split is converted to shutter time, f-number, and ISO. Each value is clamped to your
                            bounds and (for aperture and ISO) quantized to standard camera stops.
                          </p>
                          {allocatedSettings && (
                            <>
                              <p className="text-xs text-muted-foreground">Settings within constraint range (0 = min, 1 = max)</p>
                              <div className="h-[180px]">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart
                                    data={[
                                      {
                                        name: 'Shutter',
                                        norm: constraints.shutterMax > constraints.shutterMin
                                          ? (allocatedSettings.shutterSeconds - constraints.shutterMin) /
                                            (constraints.shutterMax - constraints.shutterMin)
                                          : 0.5,
                                      },
                                      {
                                        name: 'Aperture',
                                        norm: constraints.apertureMax > constraints.apertureMin
                                          ? (allocatedSettings.aperture - constraints.apertureMin) /
                                            (constraints.apertureMax - constraints.apertureMin)
                                          : 0.5,
                                      },
                                      {
                                        name: 'ISO',
                                        norm: constraints.isoMax > 100
                                          ? (allocatedSettings.iso - 100) / (constraints.isoMax - 100)
                                          : 0.5,
                                      },
                                    ]}
                                    margin={{ top: 4, right: 24, bottom: 24, left: 4 }}
                                  >
                                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                    <YAxis domain={[ 0, 1 ]} tickFormatter={(v) => v.toFixed(2)} label={{ value: 'Fraction of range', angle: -90, position: 'insideLeft' }} />
                                    <Tooltip formatter={(v: number) => [v.toFixed(2), 'Fraction']} />
                                    <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" />
                                    <ReferenceLine y={1} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" />
                                    <Bar dataKey="norm" fill="hsl(var(--primary))" radius={[ 2, 2, 0, 0 ]} />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Allocation Step 4: Record constraint hits and finalize + EV breakdown plot */}
                        <div className="space-y-2">
                          <p className="text-sm font-semibold">Allocation Step 4: Record constraint hits and finalize</p>
                          <p className="text-xs text-muted-foreground">
                            The allocator records which limits were hit, sanitizes the triple (T, N, S), and computes the
                            actual EV breakdown of the chosen settings (which may differ from the target if constraints bit).
                          </p>
                          {allocationLog && evBreakdown && (
                            <>
                              <p className="text-xs text-muted-foreground">Resulting EV contribution by control</p>
                              <div className="h-[200px]">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart
                                    data={[
                                      { name: 'Shutter', ev: evBreakdown.shutterEV, fill: 'hsl(var(--chart-1))' },
                                      { name: 'Aperture', ev: evBreakdown.apertureEV, fill: 'hsl(var(--chart-2))' },
                                      { name: 'ISO', ev: evBreakdown.isoEV, fill: 'hsl(var(--chart-3))' },
                                    ]}
                                    margin={{ top: 4, right: 24, bottom: 24, left: 4 }}
                                  >
                                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                    <YAxis tickFormatter={(v) => v.toFixed(2)} label={{ value: 'EV', angle: -90, position: 'insideLeft' }} />
                                    <Tooltip formatter={(v: number) => [v.toFixed(3), 'EV']} />
                                    <ReferenceLine
                                      y={evBreakdown.totalEV}
                                      stroke="hsl(var(--primary))"
                                      strokeDasharray="3 3"
                                      label={{ value: 'Total EV', position: 'right' }}
                                    />
                                    <Bar dataKey="ev" radius={[ 2, 2, 0, 0 ]}>
                                      <Cell fill="hsl(var(--chart-1))" />
                                      <Cell fill="hsl(var(--chart-2))" />
                                      <Cell fill="hsl(var(--chart-3))" />
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                              <div className="text-xs text-muted-foreground space-y-1">
                                <p>
                                  Shutter: <span className="font-mono">{evBreakdown.shutterEV.toFixed(2)} EV</span>
                                  {' · '}
                                  Aperture: <span className="font-mono">{evBreakdown.apertureEV.toFixed(2)} EV</span>
                                  {' · '}
                                  ISO: <span className="font-mono">{evBreakdown.isoEV.toFixed(2)} EV</span>
                                  {' → '}
                                  Total: <span className="font-mono">{evBreakdown.totalEV.toFixed(2)} EV</span>
                                </p>
                                {allocationLog.constraintHits.length > 0 && (
                                  <p>
                                    Constraints hit: <span className="font-mono">{allocationLog.constraintHits.join(', ')}</span>
                                    , so other channels absorbed more of the EV change.
                                  </p>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Final settings summary */}
                      {allocatedSettings && (
                        <div className="text-xs text-muted-foreground font-mono flex flex-wrap gap-x-4 gap-y-1 pt-2 border-t border-border">
                          <span>
                            Shutter: {allocatedSettings.shutterSeconds >= 1
                              ? `${allocatedSettings.shutterSeconds.toFixed(1)}s`
                              : `1/${Math.round(1 / allocatedSettings.shutterSeconds)}s`}
                          </span>
                          <span>Aperture: f/{allocatedSettings.aperture.toFixed(1)}</span>
                          <span>ISO: {allocatedSettings.iso}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
        )}
      </CardContent>
    </Card>
  );
}
