import { MeteringMode } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MeteringPanelProps {
  meteringMode: MeteringMode;
  onMeteringModeChange: (mode: MeteringMode) => void;
  showWeightOverlay: boolean;
  onShowWeightOverlayToggle: () => void;
  showMeteringDisabled?: boolean;
}

export function MeteringPanel({
  meteringMode,
  onMeteringModeChange,
  showWeightOverlay,
  onShowWeightOverlayToggle,
  showMeteringDisabled = false,
}: MeteringPanelProps) {
  return (
    <Card data-tour-id="metering-panel">
      <CardHeader>
        <CardTitle>Metering Mode</CardTitle>
        <CardDescription>
          Select how the camera meters the scene. This affects telemetry and auto-exposure decisions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="metering">Metering Mode</Label>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={meteringMode} onValueChange={(value) => onMeteringModeChange(value as MeteringMode)}>
              <SelectTrigger id="metering" className="w-full min-w-[180px] sm:w-auto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="matrix">Matrix</SelectItem>
                <SelectItem value="center">Center-weighted</SelectItem>
                <SelectItem value="spot">Spot</SelectItem>
                <SelectItem value="subject">Subject-based</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={onShowWeightOverlayToggle}
              disabled={showMeteringDisabled}
            >
              {showWeightOverlay ? 'Hide' : 'Show'} metering
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {meteringMode === 'matrix' && 'Evaluative metering across the entire frame'}
            {meteringMode === 'center' && 'Weighted toward the center of the frame'}
            {meteringMode === 'spot' && 'Meters from a small spot in the center'}
            {meteringMode === 'subject' && 'Meters based on subject mask (if available)'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
