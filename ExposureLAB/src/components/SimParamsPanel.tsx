import { useState, useCallback } from 'react';
import type { SimParams } from '@/types';
import {
  SIM_PRESETS,
  SIM_PRESET_LABELS,
  MOTION_THRESHOLD_OPTIONS,
  motionThresholdToOption,
  MOTION_DIRECTION_OPTIONS,
  type SimPreset,
} from '@/constants/simPresets';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, RotateCcw } from 'lucide-react';

interface SimParamsPanelProps {
  simParams: SimParams;
  onSimParamsChange: (params: SimParams) => void;
}

function paramsMatch(a: SimParams, b: SimParams): boolean {
  if (
    a.fullWell !== b.fullWell ||
    a.readNoise !== b.readNoise ||
    a.dofStrength !== b.dofStrength ||
    a.motionEnabled !== b.motionEnabled ||
    a.motionThreshold !== b.motionThreshold ||
    (a.motionSensitivity ?? 10) !== (b.motionSensitivity ?? 10)
  ) {
    return false;
  }
  const dirA = a.motionDirection;
  const dirB = b.motionDirection;
  if (!dirA && !dirB) return true;
  if (!dirA || !dirB) return false;
  return dirA.x === dirB.x && dirA.y === dirB.y;
}

function findMatchingPreset(params: SimParams): Exclude<SimPreset, 'custom'> | null {
  for (const key of Object.keys(SIM_PRESETS) as (Exclude<SimPreset, 'custom'>)[]) {
    if (paramsMatch(params, SIM_PRESETS[key])) return key;
  }
  return null;
}

function getMotionDirectionOption(
  direction: { x: number; y: number } | undefined
): (typeof MOTION_DIRECTION_OPTIONS)[number]['value'] {
  if (!direction) return 'handheld';
  if (direction.x === 1 && direction.y === 0) return 'horizontal';
  if (direction.x === 0 && direction.y === 1) return 'vertical';
  if (direction.x === 1 && direction.y === 1) return 'diagonal';
  return 'handheld';
}

export function SimParamsPanel({ simParams, onSimParamsChange }: SimParamsPanelProps) {
  const [activePreset, setActivePreset] = useState<SimPreset>(() =>
    findMatchingPreset(simParams) ?? 'custom'
  );
  const [lastPreset, setLastPreset] = useState<Exclude<SimPreset, 'custom'>>('handheld');

  const handlePresetChange = useCallback(
    (value: string) => {
      if (value === 'custom') return;
      const preset = value as Exclude<SimPreset, 'custom'>;
      setActivePreset(preset);
      setLastPreset(preset);
      onSimParamsChange({ ...SIM_PRESETS[preset] });
    },
    [onSimParamsChange]
  );

  const handleManualChange = useCallback(
    (updates: Partial<SimParams>) => {
      const next = { ...simParams, ...updates };
      setActivePreset(findMatchingPreset(next) ?? 'custom');
      onSimParamsChange(next);
    },
    [simParams, onSimParamsChange]
  );

  const handleReset = useCallback(() => {
    setActivePreset(lastPreset);
    onSimParamsChange({ ...SIM_PRESETS[lastPreset] });
  }, [lastPreset, onSimParamsChange]);

  const displayPreset =
    activePreset === 'custom' ? 'custom' : (findMatchingPreset(simParams) ?? 'custom');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Simulation Parameters</CardTitle>
        <CardDescription>
          Choose scene type or adjust parameters for depth of field, noise, and motion blur
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="sim-preset">Scene type</Label>
          <div className="flex gap-2">
            <Select
              value={displayPreset}
              onValueChange={handlePresetChange}
            >
              <SelectTrigger id="sim-preset" className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SIM_PRESET_LABELS) as (Exclude<SimPreset, 'custom'>)[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {SIM_PRESET_LABELS[key]}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom (manual)</SelectItem>
              </SelectContent>
            </Select>
            {displayPreset === 'custom' && (
              <Button
                variant="outline"
                size="icon"
                onClick={handleReset}
                title="Reset to last preset"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <Collapsible className="rounded-lg border border-border">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium hover:bg-muted/50"
            >
              Depth of field
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-2 border-t border-border px-4 py-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="dof-strength" title="Scales depth-of-field blur. Higher = more bokeh for a given aperture.">
                  Intensity
                </Label>
                <span className="text-sm font-mono">{simParams.dofStrength.toFixed(2)}</span>
              </div>
              <Slider
                id="dof-strength"
                value={[simParams.dofStrength * 100]}
                onValueChange={([v]) => handleManualChange({ dofStrength: v / 100 })}
                min={0}
                max={100}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                Scales background blur. 0 = off; higher = more bokeh for a given aperture.
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible className="rounded-lg border border-border">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium hover:bg-muted/50"
            >
              Noise
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-4 border-t border-border px-4 py-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="full-well" title="Sensor full-well capacity. Higher = cleaner at high ISO.">
                    Full-well capacity
                  </Label>
                  <span className="text-sm font-mono">{simParams.fullWell.toLocaleString()}</span>
                </div>
                <Slider
                  id="full-well"
                  value={[simParams.fullWell]}
                  onValueChange={([v]) => handleManualChange({ fullWell: v })}
                  min={2000}
                  max={50000}
                  step={1000}
                />
                <p className="text-xs text-muted-foreground">
                  Sensor dynamic range. ~50k = modern FF; ~10k = older or smaller sensor.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="read-noise" title="Read noise RMS in electrons.">
                    Read noise
                  </Label>
                  <span className="text-sm font-mono">{simParams.readNoise.toFixed(1)}</span>
                </div>
                <Slider
                  id="read-noise"
                  value={[simParams.readNoise]}
                  onValueChange={([v]) => handleManualChange({ readNoise: v })}
                  min={0.5}
                  max={10}
                  step={0.5}
                />
                <p className="text-xs text-muted-foreground">
                  Lower = cleaner sensor. ~1 = modern; ~4+ = noisier.
                </p>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible className="rounded-lg border border-border">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium hover:bg-muted/50"
            >
              Motion
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-4 border-t border-border px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="motion-enabled">Motion blur</Label>
                <div className="flex gap-1">
                  <Button
                    variant={simParams.motionEnabled ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleManualChange({ motionEnabled: true })}
                  >
                    On
                  </Button>
                  <Button
                    variant={simParams.motionEnabled ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => handleManualChange({ motionEnabled: false })}
                  >
                    Off
                  </Button>
                </div>
              </div>
              {simParams.motionEnabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="motion-threshold">
                      Shutter threshold (blur appears above)
                    </Label>
                    <Select
                      value={motionThresholdToOption(simParams.motionThreshold)}
                      onValueChange={(v) => {
                        const opt = MOTION_THRESHOLD_OPTIONS.find((o) => o.value === v);
                        if (opt) handleManualChange({ motionThreshold: opt.num });
                      }}
                    >
                      <SelectTrigger id="motion-threshold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MOTION_THRESHOLD_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="motion-direction">Direction</Label>
                    <Select
                      value={getMotionDirectionOption(simParams.motionDirection)}
                      onValueChange={(v) => {
                        const opt = MOTION_DIRECTION_OPTIONS.find((o) => o.value === v);
                        handleManualChange({ motionDirection: opt?.direction });
                      }}
                    >
                      <SelectTrigger id="motion-direction">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MOTION_DIRECTION_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="motion-sensitivity" title="Higher = faster-moving subject, more blur for same shutter.">
                        Subject speed
                      </Label>
                      <span className="text-sm font-mono">
                        {(simParams.motionSensitivity ?? 10).toFixed(0)}
                      </span>
                    </div>
                    <Slider
                      id="motion-sensitivity"
                      value={[simParams.motionSensitivity ?? 10]}
                      onValueChange={([v]) => handleManualChange({ motionSensitivity: v })}
                      min={1}
                      max={30}
                      step={1}
                    />
                    <p className="text-xs text-muted-foreground">
                      Higher = faster subject, more motion blur.
                    </p>
                  </div>
                </>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
