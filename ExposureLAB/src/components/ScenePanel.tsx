import { useState } from 'react';
import { SceneState, RadialMaskConfig, LinearMaskConfig, WeightMap } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { InteractiveSceneCanvas } from '@/components/InteractiveSceneCanvas';
import { Upload, Plus, Trash2, Circle, Minus, Loader2 } from 'lucide-react';
import { applyMasksToScene } from '@/utils/masks';

const CANVAS_MIN_HEIGHT = 360;

interface ScenePanelProps {
  scene: SceneState | null;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onImageRemove?: () => void;
  illumination: number;
  onIlluminationChange: (value: number) => void;
  onSceneChange: (scene: SceneState) => void;
  canvasDisplayWidth?: number;
  isUploading?: boolean;
  meteringWeights?: WeightMap | null;
}

export function ScenePanel({
  scene,
  onImageUpload,
  onImageRemove,
  illumination,
  onIlluminationChange,
  onSceneChange,
  canvasDisplayWidth,
  isUploading = false,
  meteringWeights = null,
}: ScenePanelProps) {
  const radialMasks = scene?.radialMasks || [];
  const linearMasks = scene?.linearMasks || [];
  const [maskDrawingMode, setMaskDrawingMode] = useState<'radial' | 'linear' | null>(null);
  const [showMaskOverlay, setShowMaskOverlay] = useState(true);
  const [showWeightOverlay, setShowWeightOverlay] = useState(false);

  // Apply scene illumination and masks to the displayed image as well,
  // so the scene canvas matches what is being simulated.
  const maskedSceneImage = scene
    ? applyMasksToScene(
        scene.image,
        illumination,
        scene.radialMasks,
        scene.linearMasks
      )
    : null;

  const handleAddRadialMask = (centerX: number, centerY: number, radiusX: number, radiusY: number) => {
    if (!scene) return;
    const newMask: RadialMaskConfig = {
      id: `radial-${Date.now()}`,
      enabled: true,
      centerX,
      centerY,
      radiusX: Math.min(radiusX, 0.5),
      radiusY: Math.min(radiusY, 0.5),
      feather: 0.2,
      illumination: 1.0,
    };
    onSceneChange({
      ...scene,
      radialMasks: [...radialMasks, newMask],
    });
    // Reset drawing mode after mask is added
    setMaskDrawingMode(null);
  };

  const handleAddLinearMask = (angle: number, offset: number, width: number) => {
    if (!scene) return;
    const newMask: LinearMaskConfig = {
      id: `linear-${Date.now()}`,
      enabled: true,
      angle: (angle + 360) % 360, // Normalize to 0-360
      offset: Math.max(-1, Math.min(1, offset)), // Clamp offset
      width: Math.min(width, 0.5),
      feather: 0.2,
      illumination: 1.0,
    };
    onSceneChange({
      ...scene,
      linearMasks: [...linearMasks, newMask],
    });
    // Reset drawing mode after mask is added
    setMaskDrawingMode(null);
  };

  const updateRadialMask = (id: string, updates: Partial<RadialMaskConfig>) => {
    if (!scene) return;
    onSceneChange({
      ...scene,
      radialMasks: radialMasks.map(m => m.id === id ? { ...m, ...updates } : m),
    });
  };

  const updateLinearMask = (id: string, updates: Partial<LinearMaskConfig>) => {
    if (!scene) return;
    onSceneChange({
      ...scene,
      linearMasks: linearMasks.map(m => m.id === id ? { ...m, ...updates } : m),
    });
  };

  const removeRadialMask = (id: string) => {
    if (!scene) return;
    onSceneChange({
      ...scene,
      radialMasks: radialMasks.filter(m => m.id !== id),
    });
  };

  const removeLinearMask = (id: string) => {
    if (!scene) return;
    onSceneChange({
      ...scene,
      linearMasks: linearMasks.filter(m => m.id !== id),
    });
  };
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Scene</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowWeightOverlay((prev) => !prev)}
              disabled={!scene || !meteringWeights}
            >
              {showWeightOverlay ? 'Hide' : 'Show'} metering
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMaskOverlay((prev) => !prev)}
              disabled={!scene}
            >
              {showMaskOverlay ? 'Hide masks' : 'Show masks'}
            </Button>
          </div>
        </div>
        <CardDescription>
          Upload a reference image. Adjust global and mask lighting to shape the scene.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Scene photo area: upload when empty, image when loaded */}
        {!scene ? (
          <label
            className={`flex flex-col items-center justify-center w-full border border-dashed border-border rounded-lg bg-muted gap-3 py-12 px-6 transition-colors ${isUploading ? 'cursor-wait' : 'cursor-pointer hover:bg-muted/80'}`}
            style={{ minHeight: CANVAS_MIN_HEIGHT }}
          >
            {isUploading ? (
              <Loader2 className="h-10 w-10 text-primary animate-spin" aria-hidden />
            ) : (
              <Upload className="h-10 w-10 text-muted-foreground" />
            )}
            <span className="text-sm font-medium text-foreground">
              {isUploading ? 'Loading image…' : 'Upload image'}
            </span>
            <span className="text-xs text-muted-foreground">PNG, JPG, WebP</span>
            <input
              type="file"
              accept="image/*"
              onChange={onImageUpload}
              className="hidden"
              disabled={isUploading}
            />
          </label>
        ) : (
          <div className="relative">
            <InteractiveSceneCanvas
              image={maskedSceneImage}
              radialMasks={scene.radialMasks}
              linearMasks={scene.linearMasks}
              displayWidth={canvasDisplayWidth}
              showMaskOverlay={showMaskOverlay}
              showWeightOverlay={showWeightOverlay}
              meteringWeights={meteringWeights}
              onAddRadialMask={handleAddRadialMask}
              onAddLinearMask={handleAddLinearMask}
              maskDrawingMode={maskDrawingMode}
            />
            {onImageRemove && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onImageRemove}
                className="absolute top-2 right-2 shadow-md"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Remove
              </Button>
            )}
          </div>
        )}

        {/* Global lighting */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="global-light">Global lighting</Label>
            <span className="text-sm font-mono">{illumination.toFixed(2)}</span>
          </div>
          <Slider
            id="global-light"
            value={[illumination * 100]}
            onValueChange={([v]) => onIlluminationChange(v / 100)}
            min={10}
            max={200}
            step={1}
            disabled={!scene}
          />
        </div>


        {/* Radial Masks */}
        <div className="space-y-3 border-t pt-4">
          <div className="flex items-center justify-between">
            <Label>Radial Masks</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMaskDrawingMode('radial')}
              disabled={!scene}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
          {radialMasks.map((mask) => (
            <div key={mask.id} className="space-y-2 p-3 border rounded-lg bg-muted/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Circle className="h-4 w-4" />
                  <Label className="text-sm">Radial {mask.id.slice(-4)}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateRadialMask(mask.id, { enabled: !mask.enabled })}
                  >
                    {mask.enabled ? 'On' : 'Off'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRadialMask(mask.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>Feather</span>
                    <span className="font-mono">{(mask.feather * 100).toFixed(0)}%</span>
                  </div>
                  <Slider
                    value={[mask.feather * 100]}
                    onValueChange={([v]) => updateRadialMask(mask.id, { feather: v / 100 })}
                    min={0}
                    max={100}
                    step={1}
                    disabled={!mask.enabled}
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>Illumination</span>
                    <span className="font-mono">{(mask.illumination * 100).toFixed(0)}%</span>
                  </div>
                  <Slider
                    value={[mask.illumination * 100]}
                    onValueChange={([v]) => updateRadialMask(mask.id, { illumination: v / 100 })}
                    min={10}
                    max={200}
                    step={1}
                    disabled={!mask.enabled}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Linear Masks */}
        <div className="space-y-3 border-t pt-4">
          <div className="flex items-center justify-between">
            <Label>Linear Masks</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMaskDrawingMode('linear')}
              disabled={!scene}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
          {linearMasks.map((mask) => (
            <div key={mask.id} className="space-y-2 p-3 border rounded-lg bg-muted/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Minus className="h-4 w-4" />
                  <Label className="text-sm">Linear {mask.id.slice(-4)}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateLinearMask(mask.id, { enabled: !mask.enabled })}
                  >
                    {mask.enabled ? 'On' : 'Off'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLinearMask(mask.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>Feather</span>
                    <span className="font-mono">{(mask.feather * 100).toFixed(0)}%</span>
                  </div>
                  <Slider
                    value={[mask.feather * 100]}
                    onValueChange={([v]) => updateLinearMask(mask.id, { feather: v / 100 })}
                    min={0}
                    max={100}
                    step={1}
                    disabled={!mask.enabled}
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>Illumination</span>
                    <span className="font-mono">{(mask.illumination * 100).toFixed(0)}%</span>
                  </div>
                  <Slider
                    value={[mask.illumination * 100]}
                    onValueChange={([v]) => updateLinearMask(mask.id, { illumination: v / 100 })}
                    min={10}
                    max={200}
                    step={1}
                    disabled={!mask.enabled}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
