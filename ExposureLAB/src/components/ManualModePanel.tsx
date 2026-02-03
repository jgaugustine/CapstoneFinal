import { CameraSettings } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

interface ManualModePanelProps {
  settings: CameraSettings;
  onSettingsChange: (settings: CameraSettings) => void;
}

export function ManualModePanel({ settings, onSettingsChange }: ManualModePanelProps) {
  // Generate shutter speeds from 1/8000s to 30s with 1/3 stop increments
  // 1/3 stop = 2^(1/3) ≈ 1.26 multiplier
  const generateShutterSpeeds = (): number[] => {
    const speeds: number[] = [];
    const minShutter = 1/8000;
    const maxShutter = 30;
    const stopIncrement = 1/3; // 1/3 stop increments
    
    // Start from 1/8000 and go up to 30s
    let current = minShutter;
    while (current <= maxShutter) {
      speeds.push(current);
      // Next value: multiply by 2^(1/3) for 1/3 stop
      current *= Math.pow(2, stopIncrement);
    }
    // Ensure we include exactly 30s
    if (speeds[speeds.length - 1] < maxShutter) {
      speeds.push(maxShutter);
    }
    return speeds;
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
  // Full stops: f/2.8, f/4, f/5.6, f/8, f/11, f/16, f/22, f/32
  const apertureStops = [2.8, 4.0, 5.6, 8.0, 11, 16, 22, 32];

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
    const stops = [100, 200, 400, 800, 1600, 3200, 6400, 12800, 25600];
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
    const stops = [100, 200, 400, 800, 1600, 3200, 6400, 12800, 25600];
    const idx = Math.round((value / 100) * (stops.length - 1));
    return stops[Math.max(0, Math.min(stops.length - 1, idx))];
  };

  const formatShutter = (shutter: number): string => {
    if (shutter >= 1) return `${shutter.toFixed(1)}s`;
    return `1/${Math.round(1 / shutter)}s`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manual Mode</CardTitle>
        <CardDescription>
          Adjust camera settings manually and see the forward-simulated results
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="shutter">Shutter Speed</Label>
            <span className="text-sm font-mono">{formatShutter(settings.shutterSeconds)}</span>
          </div>
          <Slider
            id="shutter"
            value={[shutterToSlider(settings.shutterSeconds)]}
            onValueChange={([value]) => {
              onSettingsChange({
                ...settings,
                shutterSeconds: sliderToShutter(value),
              });
            }}
            min={0}
            max={100}
            step={1}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="aperture">Aperture (f-number)</Label>
            <span className="text-sm font-mono">f/{settings.aperture.toFixed(1)}</span>
          </div>
          <Slider
            id="aperture"
            value={[apertureToSlider(settings.aperture)]}
            onValueChange={([value]) => {
              onSettingsChange({
                ...settings,
                aperture: sliderToAperture(value),
              });
            }}
            min={0}
            max={100}
            step={1}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="iso">ISO</Label>
            <span className="text-sm font-mono">{settings.iso}</span>
          </div>
          <Slider
            id="iso"
            value={[isoToSlider(settings.iso)]}
            onValueChange={([value]) => {
              onSettingsChange({
                ...settings,
                iso: sliderToISO(value),
              });
            }}
            min={0}
            max={100}
            step={1}
          />
        </div>

        <div className="pt-4 border-t border-border">
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Exposure Value (EV):</span>
              <span className="font-mono">
                {Math.log2((settings.aperture * settings.aperture * (settings.iso / 100)) / settings.shutterSeconds).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
