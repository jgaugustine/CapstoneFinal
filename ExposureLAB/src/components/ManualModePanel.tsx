import { useState } from 'react';
import { CameraSettings, ExposureMetadata } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { APERTURE_STOPS, ISO_STOPS, SHUTTER_SPEEDS, snapToNearest } from '@/utils/cameraSettings';

// Fallback reference when no EXIF metadata (f/2.8, 1/60s, ISO 100)
const DEFAULT_REF = { aperture: 2.8, shutterSeconds: 1 / 60, iso: 100 };
function evOffsetFromRef(ref: { aperture: number; shutterSeconds: number; iso: number }): number {
  return Math.log2((ref.aperture * ref.aperture) / (ref.shutterSeconds * (ref.iso / 100)));
}

interface ManualModePanelProps {
  settings: CameraSettings;
  onSettingsChange: (settings: CameraSettings) => void;
  /** From image EXIF; EV 0 = as-captured when present */
  exposureMetadata?: ExposureMetadata | null;
  /** Global mode toggle between MF and AE */
  mode: 'manual' | 'ae';
  onModeChange: (mode: 'manual' | 'ae') => void;
}

type CameraProgramMode =
  | 'manual'
  | 'aperture_priority'
  | 'shutter_priority'
  | 'manual_auto_iso'
  | 'auto_ae';

export function ManualModePanel({
  settings,
  onSettingsChange,
  exposureMetadata,
  mode,
  onModeChange,
}: ManualModePanelProps) {
  const [programMode, setProgramMode] = useState<CameraProgramMode>('manual');

  const evOffset = exposureMetadata
    ? evOffsetFromRef(exposureMetadata)
    : evOffsetFromRef(DEFAULT_REF);

  // Reference EV used for priority/auto modes (match capture brightness when possible)
  const ref = exposureMetadata ?? DEFAULT_REF;
  const evRef = Math.log2(
    (ref.shutterSeconds * (ref.iso / 100)) / (ref.aperture * ref.aperture)
  );

  // Generate shutter speeds from 1/8000s to 30s with 1/3 stop increments
  // 1/3 stop = 2^(1/3) ≈ 1.26 multiplier
  const generateShutterSpeeds = (): number[] => {
    // Reuse shared shutter speed table so sliders and auto modes align
    return SHUTTER_SPEEDS;
  };

  const shutterSpeeds = generateShutterSpeeds();

  const shutterToSlider = (shutter: number): number => {
    // Find closest shutter speed index
    let closestIdx = 0;
    let minDiff = Math.abs(shutter - shutterSpeeds[0]);
    for (let i = 1; i < shutterSpeeds.length; i++) {
      const diff = Math.abs(shutter - shutterSpeeds[i]);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    }
    return (closestIdx / (shutterSpeeds.length - 1)) * 100;
  };

  const sliderToShutter = (value: number): number => {
    const idx = Math.round((value / 100) * (shutterSpeeds.length - 1));
    return shutterSpeeds[Math.max(0, Math.min(shutterSpeeds.length - 1, idx))];
  };

  // Aperture slider: f/2.8 to f/32 with full stops (doubling light each step)
  const apertureStops = APERTURE_STOPS;

  const apertureToSlider = (aperture: number): number => {
    let closestIdx = 0;
    let minDiff = Math.abs(aperture - apertureStops[0]);
    for (let i = 1; i < apertureStops.length; i++) {
      const diff = Math.abs(aperture - apertureStops[i]);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    }
    // f/2.8 (index 0, lowest f-number, most light) → 0% (left side)
    // f/32 (index 7, highest f-number, least light) → 100% (right side)
    return (closestIdx / (apertureStops.length - 1)) * 100;
  };

  const sliderToAperture = (value: number): number => {
    // value 0% (left) → f/2.8, value 100% (right) → f/32
    const idx = Math.round((value / 100) * (apertureStops.length - 1));
    return apertureStops[Math.max(0, Math.min(apertureStops.length - 1, idx))];
  };

  // ISO slider: 100 to 25600
  const isoToSlider = (iso: number): number => {
    const stops = ISO_STOPS;
    let closestIdx = 0;
    let minDiff = Math.abs(iso - stops[0]);
    for (let i = 1; i < stops.length; i++) {
      const diff = Math.abs(iso - stops[i]);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    }
    return (closestIdx / (stops.length - 1)) * 100;
  };

  const sliderToISO = (value: number): number => {
    const stops = ISO_STOPS;
    const idx = Math.round((value / 100) * (stops.length - 1));
    return stops[Math.max(0, Math.min(stops.length - 1, idx))];
  };

  const formatShutter = (shutter: number): string => {
    if (shutter >= 1) return `${shutter.toFixed(1)}s`;
    return `1/${Math.round(1 / shutter)}s`;
  };

  // Helpers for auto modes: solve for the missing parameter at the reference EV and quantize
  const solveShutterForRefEV = (aperture: number, iso: number): number => {
    const rawShutter = (Math.pow(2, evRef) * aperture * aperture) / (iso / 100);
    return snapToNearest(rawShutter, SHUTTER_SPEEDS);
  };

  const solveApertureForRefEV = (shutterSeconds: number, iso: number): number => {
    const rawAperture = Math.sqrt(
      (shutterSeconds * (iso / 100)) / Math.pow(2, evRef)
    );
    return snapToNearest(rawAperture, APERTURE_STOPS);
  };

  const solveISOForRefEV = (shutterSeconds: number, aperture: number): number => {
    const rawISO = 100 * (Math.pow(2, evRef) * (aperture * aperture)) / shutterSeconds;
    // Clamp/quantize to ISO stops between 100 and 25600
    return snapToNearest(rawISO, ISO_STOPS, 100, 25600);
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Camera Mode</CardTitle>
          <CardDescription>
            Choose between full manual, aperture/shutter priority, manual with auto ISO, or full AE
          </CardDescription>
        </div>
        <div className="mt-4">
          <Tabs
            value={programMode}
            onValueChange={(value) => {
              const nextMode = value as CameraProgramMode;
              setProgramMode(nextMode);
              // When user selects AE in the program bar, switch global mode to AE.
              // All other program modes are treated as manual-focus (MF) variants.
              if (nextMode === 'auto_ae') {
                onModeChange('ae');
              } else {
                onModeChange('manual');
              }
            }}
          >
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="manual">M</TabsTrigger>
              <TabsTrigger value="aperture_priority">Av</TabsTrigger>
              <TabsTrigger value="shutter_priority">Tv</TabsTrigger>
              <TabsTrigger value="manual_auto_iso">M + Auto ISO</TabsTrigger>
              <TabsTrigger value="auto_ae">AE</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {(programMode === 'manual' ||
          programMode === 'shutter_priority' ||
          programMode === 'manual_auto_iso' ||
          programMode === 'auto_ae') && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="shutter">Shutter Speed</Label>
              <span className="text-sm font-mono">
                {formatShutter(settings.shutterSeconds)}
              </span>
            </div>
            <Slider
              id="shutter"
              disabled={mode === 'ae'}
              value={[shutterToSlider(settings.shutterSeconds)]}
              onValueChange={([value]) => {
                const newShutter = sliderToShutter(value);
                let next = { ...settings, shutterSeconds: newShutter };

                if (programMode === 'manual_auto_iso') {
                  // M + Auto ISO: user controls shutter/aperture, ISO is computed
                  next.iso = solveISOForRefEV(next.shutterSeconds, next.aperture);
                } else if (programMode === 'shutter_priority') {
                  // Tv: user controls shutter/ISO, aperture is computed
                  next.aperture = solveApertureForRefEV(next.shutterSeconds, next.iso);
                }

                onSettingsChange(next);
              }}
              min={0}
              max={100}
              step={1}
            />
          </div>
        )}

        {(programMode === 'manual' ||
          programMode === 'aperture_priority' ||
          programMode === 'manual_auto_iso' ||
          programMode === 'auto_ae') && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="aperture">Aperture (f-number)</Label>
              <span className="text-sm font-mono">
                f/{settings.aperture.toFixed(1)}
              </span>
            </div>
            <Slider
              id="aperture"
              disabled={mode === 'ae'}
              value={[apertureToSlider(settings.aperture)]}
              onValueChange={([value]) => {
                const newAperture = sliderToAperture(value);
                let next = { ...settings, aperture: newAperture };

                if (programMode === 'aperture_priority') {
                  // Av: user controls aperture/ISO, shutter is computed
                  next.shutterSeconds = solveShutterForRefEV(
                    next.aperture,
                    next.iso
                  );
                } else if (programMode === 'manual_auto_iso') {
                  // M + Auto ISO: user controls shutter/aperture, ISO is computed
                  next.iso = solveISOForRefEV(next.shutterSeconds, next.aperture);
                }

                onSettingsChange(next);
              }}
              min={0}
              max={100}
              step={1}
            />
          </div>
        )}

        {(programMode === 'manual' ||
          programMode === 'aperture_priority' ||
          programMode === 'shutter_priority' ||
          programMode === 'auto_ae') && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="iso">ISO</Label>
              <span className="text-sm font-mono">{settings.iso}</span>
            </div>
            <Slider
              id="iso"
              disabled={mode === 'ae'}
              value={[isoToSlider(settings.iso)]}
              onValueChange={([value]) => {
                const newISO = sliderToISO(value);
                let next = { ...settings, iso: newISO };

                if (programMode === 'aperture_priority') {
                  // Av: user controls aperture/ISO, shutter is computed
                  next.shutterSeconds = solveShutterForRefEV(
                    next.aperture,
                    next.iso
                  );
                } else if (programMode === 'shutter_priority') {
                  // Tv: user controls shutter/ISO, aperture is computed
                  next.aperture = solveApertureForRefEV(
                    next.shutterSeconds,
                    next.iso
                  );
                }

                onSettingsChange(next);
              }}
              min={0}
              max={100}
              step={1}
            />
          </div>
        )}

        <div className="pt-4 border-t border-border">
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Exposure Value (EV):</span>
              <span className="font-mono">
                {(Math.log2((settings.shutterSeconds * (settings.iso / 100)) / (settings.aperture * settings.aperture)) + evOffset).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
