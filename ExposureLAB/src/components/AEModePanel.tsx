import { useState } from 'react';
import { AEPriorities, AETrace, CameraSettings, AllocationLog, Constraints, AEAlgorithm, SceneState, MeteringMode } from '@/types';
import type { CameraProgramMode } from '@/components/ManualModePanel';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, ReferenceLine, ReferenceArea, BarChart, Bar, Cell } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EVFramesGallery } from '@/components/EVFramesGallery';
import { ChevronDown, AlertTriangle, Check, X } from 'lucide-react';

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
  programMode: CameraProgramMode;
  scene: SceneState | null;
  meteringMode: MeteringMode;
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
  programMode,
  scene,
  meteringMode,
}: AEModePanelProps) {
  // Manual mode can toggle the explainer; all other modes always show it.
  const [showExplainerManual, setShowExplainerManual] = useState(false);
  const showExplainer = programMode !== 'manual' ? true : showExplainerManual;

  const evBreakdown = allocationLog?.evBreakdown;
  const isoMin = constraints.isoMin ?? 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {programMode === 'aperture_priority'
            ? 'Av Mode'
            : programMode === 'shutter_priority'
            ? 'Tv Mode'
            : 'Auto Exposure Mode'}
        </CardTitle>
        <CardDescription>
          {programMode === 'aperture_priority'
            ? 'Choose a histogram-based auto-exposure algorithm that optimizes EV from the metering histogram, then split that EV across shutter speed and ISO while honoring your chosen aperture.'
            : programMode === 'shutter_priority'
            ? 'Choose a histogram-based auto-exposure algorithm that optimizes EV from the metering histogram, then split that EV across aperture and ISO while honoring your chosen shutter speed.'
            : 'Choose a histogram-based auto-exposure algorithm that optimizes EV from the metering histogram, then see how that EV is split across shutter speed, aperture, and ISO within your constraints.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={onRunAE} className="w-full sm:flex-1">
            {programMode === 'aperture_priority'
              ? 'Run Av exposure'
              : programMode === 'shutter_priority'
              ? 'Run Tv exposure'
              : 'Run Auto-Exposure'}
          </Button>
          {programMode === 'manual' && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => setShowExplainerManual((prev) => !prev)}
              disabled={!trace && !allocationLog}
              title="Show a step-by-step explanation of how auto exposure chose ΔEV and how it was split across shutter, aperture, and ISO."
            >
              {showExplainer ? 'Hide explainer' : 'Explain exposure choice'}
            </Button>
          )}
        </div>

        <div className="space-y-4 rounded-lg border border-border px-4 py-4">
          <p className="text-sm font-semibold">Auto-exposure algorithm & priorities</p>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="aeAlgorithm"
                title="Controls how the metering histogram is interpreted when choosing the target exposure value."
              >
                Auto-exposure algorithm
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

          {algorithm !== 'entropy' && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="etaHighlight"
                    title="Maximum fraction of metered pixels auto exposure is allowed to clip in highlights before it starts relaxing its constraints."
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
                    title="Maximum fraction of metered pixels auto exposure is allowed to crush into deep shadows before relaxing its constraints."
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
            </>
          )}

          {algorithm === 'entropy' && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                <strong>What is entropy?</strong> Entropy measures how evenly tones are spread across the luminance histogram. Higher entropy means more tonal variety (shadows, midtones, and highlights are all represented). Lower entropy means tones are concentrated in fewer bins—e.g. blown highlights or crushed shadows reduce entropy. We pick the EV that maximizes this spread.
              </p>
              <p className="text-xs text-muted-foreground italic">
                Entropy mode has no hyperparameters. Clipping is naturally penalized (saturated/crushed pixels reduce entropy).
              </p>
            </div>
          )}

          {algorithm !== 'entropy' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="midtoneTarget"
                  title="Target median luminance level in the manipulated histogram, often thought of as '18% gray'. Not used by entropy mode."
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
              <p className="text-xs text-muted-foreground">Target median luminance (global/semantic/saliency only)</p>
            </div>
          )}
        </div>

        <Collapsible defaultOpen className="rounded-lg border border-border">
          <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-left font-semibold hover:bg-muted/50 transition-colors rounded-lg [&[data-state=open]>svg]:rotate-180">
            Auto exposure steps breakdown
            <ChevronDown className="h-4 w-4 shrink-0 transition-transform" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 pt-2 space-y-4 border-t border-border">
        {trace && (
          <div className="space-y-4">
            <EVFramesGallery scene={scene} trace={trace} algorithm={algorithm} />
            {/* Clipping exceeded warning: chosen EV lies outside feasible band */}
            {algorithm !== 'entropy' &&
              (trace.relaxCountHighlight > 0 || trace.relaxCountShadow > 0) &&
              (() => {
                const chosen = trace.candidates.find((c) => c.stage === 'chosen');
                if (!chosen) return null;
                const highlightExceeds = chosen.highlightClip > priorities.etaHighlight;
                const shadowExceeds = chosen.shadowClip > priorities.etaShadow;
                return (
                  <div
                    className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm"
                    role="alert"
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500 mt-0.5" />
                      <div className="space-y-2">
                        <p className="font-semibold text-amber-800 dark:text-amber-200">
                          Chosen EV exceeds clipping tolerances
                        </p>
                        <p className="text-muted-foreground">
                          No EV in the sweep satisfied both ηh and ηs. The algorithm relaxed constraints and picked the EV
                          that minimally violates them. At chosen ΔEV {trace.chosenEV >= 0 ? '+' : ''}
                          {trace.chosenEV.toFixed(2)}, the scene clips more than your current limits allow.
                        </p>
                        <div className="space-y-1 pt-1">
                          <p className="font-medium text-amber-800 dark:text-amber-200">
                            To bring this EV into the feasible band, relax the parameters:
                          </p>
                          <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                            {highlightExceeds && (
                              <li>
                                Increase <strong>Highlight Tolerance (ηh)</strong> to at least{' '}
                                <span className="font-mono">{(chosen.highlightClip * 100).toFixed(1)}%</span> (current ηh:{' '}
                                <span className="font-mono">{(priorities.etaHighlight * 100).toFixed(1)}%</span>)
                              </li>
                            )}
                            {shadowExceeds && (
                              <li>
                                Increase <strong>Shadow Tolerance (ηs)</strong> to at least{' '}
                                <span className="font-mono">{(chosen.shadowClip * 100).toFixed(1)}%</span> (current ηs:{' '}
                                <span className="font-mono">{(priorities.etaShadow * 100).toFixed(1)}%</span>)
                              </li>
                            )}
                          </ul>
                          <p className="text-xs text-muted-foreground pt-1">
                            Use the sliders above to adjust ηh and ηs, then run auto-exposure again.
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 pt-2 border-t border-amber-500/30 mt-2">
                          <Label htmlFor="relaxationNorm" className="text-amber-800 dark:text-amber-200">
                            Norm when relaxing
                          </Label>
                          <Select
                            value={priorities.relaxationNorm ?? 'Linf'}
                            onValueChange={(value) =>
                              onPrioritiesChange({
                                ...priorities,
                                relaxationNorm: value as 'Linf' | 'L1' | 'L2',
                              })
                            }
                          >
                            <SelectTrigger id="relaxationNorm" className="w-fit min-w-[140px] bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Linf">L∞ (max violation)</SelectItem>
                              <SelectItem value="L1">L1 (sum of violations)</SelectItem>
                              <SelectItem value="L2">L2 (Euclidean)</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            Choose which norm minimizes violation: L∞ = worst ratio, L1 = sum, L2 = Euclidean. Re-run
                            auto-exposure to apply.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            <div className="space-y-2">
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
          </div>
        )}

        {showExplainer && (
          <div className="space-y-3 pt-2">
            <p className="text-sm font-semibold">How auto exposure chose ΔEV</p>
            <p className="text-xs text-muted-foreground">
              {algorithm === 'global' &&
                'For this algorithm we use a full-frame histogram with no spatial weighting; outliers are trimmed using the 1.5×IQR rule. Three steps: (1) build the manipulated histogram, (2) enforce clipping tolerances, (3) pick the EV that minimizes midtone error.'}
              {algorithm === 'semantic' &&
                'For this algorithm we use an ROI/subject-weighted histogram from your metering (e.g. subject mask). Three steps: (1) build the weighted histogram, (2) enforce clipping tolerances, (3) pick the EV that minimizes midtone error.'}
              {algorithm === 'saliency' &&
                'For this algorithm we use a saliency-weighted histogram (pixels that stand out from the mean get higher weight). Three steps: (1) build the weighted histogram, (2) enforce clipping tolerances, (3) pick the EV that minimizes midtone error.'}
              {algorithm === 'entropy' &&
                'For this algorithm we maximize histogram entropy (tone spread) over the full EV sweep—no clipping or midtone constraints; entropy naturally penalizes clipping. Two steps: (1) build the metering-weighted histogram (outliers trimmed by 1.5×IQR), (2) pick the EV that maximizes entropy.'}
            </p>
            {!trace && (
              <p className="text-xs text-muted-foreground">
                Run auto-exposure to see each step with your image and parameters.
              </p>
            )}
            {trace && (
                  <div className="space-y-6 pt-2">
                    {/* Step 1: Histogram at EV=0 */}
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Step 1: Build the manipulated histogram</p>
                      <p className="text-xs text-muted-foreground">
                        {algorithm === 'global' &&
                          'We trim outliers using the 1.5×IQR rule and use full-frame weighting (all remaining pixels weighted equally). Below is the resulting histogram at reference exposure (EV=0). The vertical line is the midtone target m = '}
                        {algorithm === 'semantic' &&
                          'We trim outliers (1.5×IQR) and apply ROI/subject weights from metering. Below is the weighted histogram at EV=0. The vertical line is the midtone target m = '}
                        {algorithm === 'saliency' &&
                          'We trim outliers (1.5×IQR) and apply saliency weights (higher where luminance deviates from the mean). Below is the weighted histogram at EV=0. The vertical line is the midtone target m = '}
                        {algorithm === 'entropy' &&
                          (meteringMode === 'matrix'
                            ? 'We trim outliers (1.5×IQR) and use full-frame weighting. Below is the histogram at EV=0. In Step 2 we pick the EV that maximizes this histogram\'s entropy.'
                            : meteringMode === 'center'
                            ? 'We trim outliers (1.5×IQR) and use center-weighted metering. Below is the histogram at EV=0. In Step 2 we pick the EV that maximizes this histogram\'s entropy.'
                            : meteringMode === 'spot'
                            ? 'We trim outliers (1.5×IQR) and use spot-weighted metering. Below is the histogram at EV=0. In Step 2 we pick the EV that maximizes this histogram\'s entropy.'
                            : 'We trim outliers (1.5×IQR) and use subject/ROI-weighted metering. Below is the histogram at EV=0. In Step 2 we pick the EV that maximizes this histogram\'s entropy.')}
                        {(algorithm === 'global' || algorithm === 'semantic' || algorithm === 'saliency') && (
                          <>
                            <span className="font-mono">{priorities.midtoneTarget.toFixed(3)}</span>;
                            the median line shows where the scene sits. We choose ΔEV so the median moves toward m.
                          </>
                        )}
                      </p>
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
                          <div className="h-[200px] overflow-visible">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={histData} margin={{ top: 28, right: 24, bottom: 24, left: 50 }}>
                                <XAxis
                                  dataKey="luminance"
                                  type="number"
                                  domain={[hMin, hMax]}
                                  tickFormatter={(v) => v.toFixed(2)}
                                  label={{ value: 'Luminance', position: 'insideBottom', offset: 5 }}
                                />
                                <YAxis
                                  tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                                  domain={[0, yMax]}
                                  label={{ value: 'Fraction', angle: -90, position: 'insideBottomLeft', offset: -15 }}
                                />
                                <Tooltip
                                  formatter={(value: number) => [`${(value * 100).toFixed(2)}%`, 'Fraction']}
                                  labelFormatter={(label) => `Luminance: ${Number(label).toFixed(3)}`}
                                />
                                {algorithm !== 'entropy' && (
                                  <ReferenceLine
                                    x={priorities.midtoneTarget}
                                    stroke="hsl(var(--primary))"
                                    strokeDasharray="3 3"
                                    label={{ value: 'Target m', position: 'top', fill: 'hsl(var(--primary))' }}
                                    ifOverflow="visible"
                                  />
                                )}
                                {refMedian != null && (
                                  <ReferenceLine
                                    x={refMedian}
                                    stroke="hsl(var(--chart-2))"
                                    strokeDasharray="2 2"
                                    label={{ value: 'Median', position: 'top', fill: 'hsl(var(--chart-2))' }}
                                    ifOverflow="visible"
                                  />
                                )}
                                <Bar dataKey="fraction" fill="hsl(var(--chart-1))" name="Fraction" isAnimationActive={false} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Step 2: Feasibility (clipping tolerances) — not used by entropy */}
                    {trace.candidates.length > 0 && algorithm !== 'entropy' && (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">Step 2: Enforce clipping tolerances</p>
                        <p className="text-xs text-muted-foreground">
                          We sweep EV candidates and keep only those whose weighted highlight clip ≤ ηh (
                          <span className="font-mono">{priorities.etaHighlight.toFixed(3)}</span>) and shadow clip ≤ ηs (
                          <span className="font-mono">{priorities.etaShadow.toFixed(3)}</span>). Candidates below the
                          tolerance lines are feasible; the vertical line is the chosen EV. Tolerance lines are{' '}
                          <span className="text-green-600 dark:text-green-400">green</span> when a feasible band exists,{' '}
                          <span className="text-amber-600 dark:text-amber-400">orange</span> when no EV satisfies both.
                          {(trace.relaxCountHighlight > 0 || trace.relaxCountShadow > 0) && (
                            <span className="block mt-1 text-amber-700 dark:text-amber-400">
                              In this run, no EV passed both tolerances, so we relaxed constraints and chose the EV that
                              minimally violates them. Orange lines = your limits; green dashed = relaxed values at the
                              chosen EV (increase ηh/ηs to those values to bring this EV into the feasible band). See the
                              warning above for steps.
                            </span>
                          )}
                        </p>
                        <div className="flex flex-col">
                          <div className="h-[200px] overflow-visible">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart
                                data={trace.candidates.map((c) => ({
                                  ev: c.ev,
                                  highlightClip: c.highlightClip,
                                  shadowClip: c.shadowClip,
                                }))}
                                margin={{ top: 24, right: 24, bottom: 32, left: 85 }}
                              >
                              <XAxis
                                dataKey="ev"
                                type="number"
                                tickFormatter={(v) => v.toFixed(1)}
                                label={{ value: 'EV', position: 'insideBottom', offset: 5 }}
                              />
                              <YAxis
                                tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                                domain={[0, 1]}
                                width={65}
                                tickMargin={8}
                                label={{ value: 'Clip fraction', angle: -90, position: 'insideBottomLeft', offset: -20 }}
                              />
                              <Tooltip
                                content={({ active, payload }) => {
                                  if (!active || !payload?.length) return null;
                                  const row = payload[0]?.payload as { ev: number; highlightClip: number; shadowClip: number } | undefined;
                                  if (!row) return null;
                                  const { etaHighlight, etaShadow } = priorities;
                                  const withinHighlight = etaHighlight <= 0 ? row.highlightClip === 0 : row.highlightClip <= etaHighlight;
                                  const withinShadow = etaShadow <= 0 ? row.shadowClip === 0 : row.shadowClip <= etaShadow;
                                  const relaxed = trace.relaxCountHighlight > 0 || trace.relaxCountShadow > 0;
                                  const chosen = trace.candidates.find((c) => c.stage === 'chosen');
                                  const withinRelaxedHighlight = chosen && row.highlightClip <= chosen.highlightClip;
                                  const withinRelaxedShadow = chosen && row.shadowClip <= chosen.shadowClip;
                                  const cols = relaxed && chosen ? 3 : 2;
                                  return (
                                    <div className="rounded-md border border-border bg-background px-3 py-2 shadow-md">
                                      <p className="font-medium mb-2">EV: {(row.ev >= 0 ? '+' : '') + row.ev.toFixed(2)}</p>
                                      <div
                                        className={`grid gap-x-4 gap-y-1 text-xs ${cols === 3 ? 'grid-cols-[auto_1fr_1fr]' : 'grid-cols-[auto_1fr]'}`}
                                      >
                                        <div className="font-medium text-muted-foreground">Clipping</div>
                                        <div className="font-medium text-muted-foreground">Status</div>
                                        {cols === 3 && (
                                          <div className="font-medium text-muted-foreground">Relaxed</div>
                                        )}
                                        <div>Highlight: {(row.highlightClip * 100).toFixed(2)}%</div>
                                        <div className="flex items-center gap-1">
                                          {withinHighlight ? <Check className="h-3.5 w-3.5 shrink-0 text-green-600" /> : <X className="h-3.5 w-3.5 shrink-0 text-red-600" />}
                                        </div>
                                        {cols === 3 && (
                                          <div className="flex items-center gap-1">
                                            {withinRelaxedHighlight ? <Check className="h-3.5 w-3.5 shrink-0 text-green-600" /> : <X className="h-3.5 w-3.5 shrink-0 text-red-600" />}
                                          </div>
                                        )}
                                        <div>Shadow: {(row.shadowClip * 100).toFixed(2)}%</div>
                                        <div className="flex items-center gap-1">
                                          {withinShadow ? <Check className="h-3.5 w-3.5 shrink-0 text-green-600" /> : <X className="h-3.5 w-3.5 shrink-0 text-red-600" />}
                                        </div>
                                        {cols === 3 && (
                                          <div className="flex items-center gap-1">
                                            {withinRelaxedShadow ? <Check className="h-3.5 w-3.5 shrink-0 text-green-600" /> : <X className="h-3.5 w-3.5 shrink-0 text-red-600" />}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                }}
                              />
                              <Legend verticalAlign="bottom" />
                              {(() => {
                                const relaxed =
                                  trace.relaxCountHighlight > 0 || trace.relaxCountShadow > 0;
                                const strokeColor = relaxed
                                  ? 'rgb(217, 119, 6)' // amber-600
                                  : 'rgb(34, 197, 94)'; // green-500
                                const greenColor = 'rgb(34, 197, 94)'; // green-500
                                const sameTolerance =
                                  Math.abs(priorities.etaHighlight - priorities.etaShadow) < 1e-9;
                                const chosen = trace.candidates.find((c) => c.stage === 'chosen');
                                const sameRelaxed =
                                  chosen &&
                                  Math.abs(chosen.highlightClip - chosen.shadowClip) < 1e-9;
                                return (
                                  <>
                                    {/* Tolerance lines (orange when relaxed, green when feasible) */}
                                    {sameTolerance ? (
                                      <ReferenceLine
                                        y={priorities.etaHighlight}
                                        stroke={strokeColor}
                                        strokeDasharray="4 4"
                                      />
                                    ) : (
                                      <>
                                        <ReferenceLine
                                          y={priorities.etaHighlight}
                                          stroke={strokeColor}
                                          strokeDasharray="6 3"
                                        />
                                        <ReferenceLine
                                          y={priorities.etaShadow}
                                          stroke={strokeColor}
                                          strokeDasharray="2 3"
                                        />
                                      </>
                                    )}
                                    {/* Relaxed constraint lines (green): min ηh/ηs for chosen EV to be feasible */}
                                    {relaxed && chosen && (
                                      sameRelaxed ? (
                                        <ReferenceLine
                                          y={chosen.highlightClip}
                                          stroke={greenColor}
                                          strokeDasharray="4 4"
                                        />
                                      ) : (
                                        <>
                                          <ReferenceLine
                                            y={chosen.highlightClip}
                                            stroke={greenColor}
                                            strokeDasharray="6 3"
                                          />
                                          <ReferenceLine
                                            y={chosen.shadowClip}
                                            stroke={greenColor}
                                            strokeDasharray="2 3"
                                          />
                                        </>
                                      )
                                    )}
                                  </>
                                );
                              })()}
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
                          {(() => {
                            const relaxed =
                              trace.relaxCountHighlight > 0 || trace.relaxCountShadow > 0;
                            const strokeColor = relaxed
                              ? 'rgb(217, 119, 6)'
                              : 'rgb(34, 197, 94)';
                            const greenColor = 'rgb(34, 197, 94)';
                            const sameTolerance =
                              Math.abs(priorities.etaHighlight - priorities.etaShadow) < 1e-9;
                            const chosen = trace.candidates.find((c) => c.stage === 'chosen');
                            const sameRelaxed =
                              chosen &&
                              Math.abs(chosen.highlightClip - chosen.shadowClip) < 1e-9;
                            const LineSwatch = ({
                              stroke,
                              dash,
                              label,
                            }: {
                              stroke: string;
                              dash: string;
                              label: string;
                            }) => (
                              <div className="flex items-center gap-1.5">
                                <svg width={24} height={8} className="shrink-0">
                                  <line
                                    x1={0}
                                    y1={4}
                                    x2={24}
                                    y2={4}
                                    stroke={stroke}
                                    strokeWidth={1.5}
                                    strokeDasharray={dash}
                                  />
                                </svg>
                                <span className="text-xs text-muted-foreground">{label}</span>
                              </div>
                            );
                            return (
                              <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1 py-2">
                                {sameTolerance ? (
                                  <LineSwatch
                                    stroke={strokeColor}
                                    dash="4 4"
                                    label="ηh = ηs (both highlight & shadow)"
                                  />
                                ) : (
                                  <>
                                    <LineSwatch
                                      stroke={strokeColor}
                                      dash="6 3"
                                      label="ηh"
                                    />
                                    <LineSwatch
                                      stroke={strokeColor}
                                      dash="2 3"
                                      label="ηs"
                                    />
                                  </>
                                )}
                                {relaxed && chosen &&
                                  (sameRelaxed ? (
                                    <LineSwatch
                                      stroke={greenColor}
                                      dash="4 4"
                                      label="relaxed (both)"
                                    />
                                  ) : (
                                    <>
                                      <LineSwatch
                                        stroke={greenColor}
                                        dash="6 3"
                                        label="ηh relaxed"
                                      />
                                      <LineSwatch
                                        stroke={greenColor}
                                        dash="2 3"
                                        label="ηs relaxed"
                                      />
                                    </>
                                  ))}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Step 3: Objective (entropy or midtone error) */}
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">
                        {algorithm === 'entropy'
                          ? 'Step 2: Maximize entropy over the full EV sweep'
                          : 'Step 3: Minimize midtone error among feasible EVs'}
                      </p>
                      {algorithm === 'entropy' && trace.candidates.some((c) => c.entropy != null) ? (
                        <>
                          <p className="text-xs text-muted-foreground">
                            We pick the EV that maximizes histogram entropy (spread of tones). No clipping constraints—entropy naturally penalizes clipping.
                          </p>
                          <div className="h-[200px] overflow-visible">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart
                                data={trace.candidates.map((c) => ({
                                  ev: c.ev,
                                  entropy: c.entropy ?? undefined,
                                }))}
                                margin={{ top: 24, right: 24, bottom: 32, left: 85 }}
                              >
                                <XAxis
                                  dataKey="ev"
                                  type="number"
                                  tickFormatter={(v) => v.toFixed(1)}
                                  label={{ value: 'EV', position: 'insideBottom', offset: 5 }}
                                />
                                <YAxis
                                  tickFormatter={(v) => v.toFixed(2)}
                                  width={65}
                                  tickMargin={8}
                                  label={{ value: 'Entropy', angle: -90, position: 'insideBottomLeft', offset: -20 }}
                                />
                                <Tooltip
                                  formatter={(value: number) => [value != null ? value.toFixed(3) : '—', 'Entropy']}
                                  labelFormatter={(label) => `EV: ${Number(label).toFixed(2)}`}
                                />
                                <ReferenceLine
                                  x={trace.chosenEV}
                                  stroke="hsl(var(--primary))"
                                  strokeDasharray="3 3"
                                  label={{ value: 'Chosen EV (max entropy)', position: 'top', fill: 'hsl(var(--primary))' }}
                                  ifOverflow="visible"
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
                        </>
                      ) : (
                        algorithm !== 'entropy' && (
                          <>
                            <p className="text-xs text-muted-foreground">
                              Among feasible EVs (those that pass the clipping tolerances in Step 2), we pick the one that minimizes midtone error (median closest to target m). The chosen EV is the minimum of the curve within that feasible band; if it is not the global minimum of the curve, that is because the global minimum lies where highlight or shadow clip would exceed the tolerances.
                            </p>
                            <div className="h-[200px] overflow-visible">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                  data={trace.candidates.map((c) => ({
                                    ev: c.ev,
                                    midtoneError: c.midtoneError,
                                    median: c.median,
                                  }))}
                                  margin={{ top: 24, right: 100, bottom: 32, left: 95 }}
                                >
                                  <XAxis
                                    dataKey="ev"
                                    type="number"
                                    tickFormatter={(v) => v.toFixed(1)}
                                    label={{ value: 'EV', position: 'insideBottom', offset: 5 }}
                                  />
                                  <YAxis
                                    yAxisId="error"
                                    orientation="left"
                                    tickFormatter={(v) => v.toFixed(3)}
                                    width={70}
                                    tickMargin={8}
                                    label={{ value: 'Midtone error', angle: -90, position: 'insideBottomLeft', offset: -20 }}
                                  />
                                  <YAxis
                                    yAxisId="median"
                                    orientation="right"
                                    width={70}
                                    tickMargin={8}
                                    tickFormatter={(v) => v.toFixed(2)}
                                    label={{ value: 'Median', angle: 90, position: 'insideBottomRight', offset: -20 }}
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
                                    label={{ value: 'Chosen EV (min error)', position: 'top', fill: 'hsl(var(--primary))' }}
                                    ifOverflow="visible"
                                  />
                                  <ReferenceLine
                                    yAxisId="median"
                                    y={priorities.midtoneTarget}
                                    stroke="hsl(var(--chart-2))"
                                    strokeDasharray="3 3"
                                    label={{ value: 'Target m', position: 'right', fill: 'hsl(var(--chart-2))' }}
                                    ifOverflow="visible"
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
                  </div>
                )}
              </div>
            )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible defaultOpen className="rounded-lg border border-border">
          <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-left font-semibold hover:bg-muted/50 transition-colors rounded-lg [&[data-state=open]>svg]:rotate-180">
            Exposure allocation steps breakdown
            <ChevronDown className="h-4 w-4 shrink-0 transition-transform" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 pt-2 space-y-4 border-t border-border">
        {allocatedSettings && (
          <div className="space-y-2">
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
          <div className="space-y-3 pt-2">
            <p className="text-sm font-semibold">How ΔEV becomes camera settings</p>
                    {/* Step 4: Convert ΔEV into settings + allocation steps */}
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
                                    margin={{ top: 4, right: 24, bottom: 4, left: 90 }}
                                  >
                                    <XAxis type="number" tickFormatter={(v) => v.toFixed(2)} dataKey="value" />
                                    <YAxis type="category" dataKey="name" width={85} tick={{ fontSize: 11 }} />
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
                                  margin={{ top: 4, right: 24, bottom: 24, left: 50 }}
                                >
                                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                  <YAxis tickFormatter={(v) => v.toFixed(2)} label={{ value: 'EV', angle: -90, position: 'insideBottomLeft', offset: -15 }} />
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
                                        norm: constraints.isoMax > isoMin
                                          ? (allocatedSettings.iso - isoMin) / (constraints.isoMax - isoMin)
                                          : 0.5,
                                      },
                                    ]}
                                    margin={{ top: 4, right: 24, bottom: 24, left: 50 }}
                                  >
                                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                    <YAxis domain={[ 0, 1 ]} tickFormatter={(v) => v.toFixed(2)} label={{ value: 'Fraction of range', angle: -90, position: 'insideBottomLeft', offset: -15 }} />
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
                                    margin={{ top: 4, right: 50, bottom: 24, left: 50 }}
                                  >
                                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                    <YAxis tickFormatter={(v) => v.toFixed(2)} label={{ value: 'EV', angle: -90, position: 'insideLeft' }} />
                                    <Tooltip formatter={(v: number) => [v.toFixed(3), 'EV']} />
                                    <ReferenceLine
                                      y={evBreakdown.totalEV}
                                      stroke="hsl(var(--primary))"
                                      strokeDasharray="3 3"
                                      label={{ value: 'Total EV', position: 'right', fill: 'hsl(var(--primary))' }}
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
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
