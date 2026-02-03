import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { 
  SceneState, 
  CameraSettings, 
  MeteringMode, 
  AEPriorities, 
  SimParams, 
  SimOutput,
  AETrace,
  Constraints,
  WeightMap,
} from '@/types';
import { loadImage } from '@/io/loadImage';
import { simulateForward } from '@/sim/simulateForward';
import { runLexiAE } from '@/ae/runLexiAE';
import { allocateSettings, evRangeFromConstraints } from '@/allocation/allocateSettings';
import { 
  computeMatrixWeights, 
  computeCenterWeights, 
  computeSpotWeights, 
  computeSubjectWeights 
} from '@/metering/weights';
import { computeWeightedLuminance, computeTelemetry } from '@/metering/stats';
import { applyMasksToScene } from '@/utils/masks';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageCanvas } from '@/components/ImageCanvas';
import { ManualModePanel } from '@/components/ManualModePanel';
import { AEModePanel } from '@/components/AEModePanel';
import { MeteringPanel } from '@/components/MeteringPanel';
import { TelemetryPanel } from '@/components/TelemetryPanel';
import { ScenePanel } from '@/components/ScenePanel';

export default function Lab() {
  const [scene, setScene] = useState<SceneState | null>(null);
  const [mode, setMode] = useState<'manual' | 'ae'>('manual');
  const [manualSettings, setManualSettings] = useState<CameraSettings>({
    shutterSeconds: 1/60,
    aperture: 2.8,
    iso: 100,
  });
  const [meteringMode, setMeteringMode] = useState<MeteringMode>('matrix');
  const [aePriorities, setAEPriorities] = useState<AEPriorities>({
    etaHighlight: 0.05,
    etaShadow: 0.05,
    epsilonShadow: 0.01,
    midtoneTarget: 0.18,
  });
  const [aeTrace, setAETrace] = useState<AETrace | null>(null);
  const [allocatedSettings, setAllocatedSettings] = useState<CameraSettings | null>(null);
  const [simOutput, setSimOutput] = useState<SimOutput | null>(null);
  const [showClipping, setShowClipping] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const rafIdRef = useRef<number>(0);

  // Simulation parameters
  const simParams: SimParams = {
    fullWell: 10000,
    readNoise: 2.0,
    dofStrength: 0.1,
    motionEnabled: false,
    motionThreshold: 1/30,
  };

  // Constraints for allocation
  const constraints: Constraints = {
    handheld: true,
    isoMax: 25600,
    shutterMin: 1/8000,
    shutterMax: 30,
    apertureMin: 2.8,
    apertureMax: 32,
    quantizationStep: 1/3,
  };

  // Compute metering weights based on mode
  const meteringWeights = useMemo((): WeightMap | null => {
    if (!scene?.image) return null;

    const { image, subjectMask } = scene;

    switch (meteringMode) {
      case 'matrix':
        return computeMatrixWeights(image.width, image.height);
      case 'center':
        return computeCenterWeights(image.width, image.height, 0.3);
      case 'spot':
        return computeSpotWeights(image.width, image.height, image.width / 2, image.height / 2, 50);
      case 'subject':
        if (subjectMask) {
          return computeSubjectWeights(image.width, image.height, subjectMask);
        }
        return computeMatrixWeights(image.width, image.height);
      default:
        return computeMatrixWeights(image.width, image.height);
    }
  }, [scene, meteringMode]);

  // Handle image upload
  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const image = await loadImage(file);
      setScene({
        image,
        illumination: 1.0,
      });
      setSimOutput(null);
      setAETrace(null);
      setAllocatedSettings(null);
    } catch (error) {
      console.error('Failed to load image:', error);
      alert('Failed to load image. Please try another file.');
    }
  }, []);

  // Run forward simulation (sync)
  const runSimulationSync = useCallback((settings: CameraSettings): SimOutput | null => {
    if (!scene) return null;
    
    // Apply masks to scene image before simulation
    const maskedImage = applyMasksToScene(
      scene.image,
      scene.illumination,
      scene.radialMasks,
      scene.linearMasks
    );
    
    // Create scene state with masked image for simulation
    const sceneForSim: SceneState = {
      ...scene,
      image: maskedImage,
      illumination: 1.0, // Already applied in masked image
    };
    
    return simulateForward(sceneForSim, settings, simParams);
  }, [scene, simParams]);

  // Deferred sim: show spinner, yield to paint, then run sim
  const runSimulationDeferred = useCallback((settings: CameraSettings) => {
    if (!scene) return;

    setIsRendering(true);
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = 0;
      const output = runSimulationSync(settings);
      setSimOutput(output);
      setIsRendering(false);
    });
  }, [scene, runSimulationSync]);

  // Run AE
  const handleRunAE = useCallback(() => {
    if (!scene?.image || !meteringWeights) return;

    const evRange = evRangeFromConstraints(constraints, 'balanced');
    const { chosenEV, trace } = runLexiAE(
      scene.image,
      meteringWeights,
      aePriorities,
      { ...evRange, step: Math.min(evRange.step, 0.1) }
    );

    const clampedEV = Math.max(evRange.min, Math.min(evRange.max, chosenEV));
    setAETrace({ ...trace, chosenEV: clampedEV });

    const { settings } = allocateSettings(clampedEV, constraints, 'balanced');
    setAllocatedSettings(settings);
    // Sim runs via effect when allocatedSettings updates
  }, [scene, meteringWeights, aePriorities, constraints]);

  // Compute telemetry from simulated output
  const telemetry = useMemo(() => {
    if (!simOutput?.image || !meteringWeights) return null;

    const luminance = computeWeightedLuminance(simOutput.image, meteringWeights);
    return computeTelemetry(luminance, meteringWeights, aePriorities.epsilonShadow, scene?.subjectMask);
  }, [simOutput, meteringWeights, aePriorities.epsilonShadow, scene?.subjectMask]);

  // Luminance for histogram
  const luminance = useMemo(() => {
    if (!simOutput?.image || !meteringWeights) return undefined;
    return computeWeightedLuminance(simOutput.image, meteringWeights);
  }, [simOutput, meteringWeights]);

  // Calculate consistent display width for both canvases
  const canvasDisplayWidth = useMemo(() => {
    if (!scene?.image) return undefined;
    const maxDisplayWidth = 600;
    return Math.min(scene.image.width, maxDisplayWidth);
  }, [scene?.image]);

  // Update scene illumination (global lighting)
  const handleIlluminationChange = useCallback((value: number) => {
    setScene((prev) => (prev ? { ...prev, illumination: value } : null));
  }, []);

  // Update scene (for mask changes)
  const handleSceneChange = useCallback((newScene: SceneState) => {
    setScene(newScene);
  }, []);

  // Update simulation when manual settings change or scene/illumination/masks change
  useEffect(() => {
    if (mode === 'manual' && scene) {
      runSimulationDeferred(manualSettings);
    }
  }, [mode, scene, manualSettings, scene?.illumination, scene?.radialMasks, scene?.linearMasks, runSimulationDeferred]);

  // Update simulation when allocated settings change (AE mode)
  useEffect(() => {
    if (mode === 'ae' && scene && allocatedSettings) {
      runSimulationDeferred(allocatedSettings);
    }
  }, [mode, scene, allocatedSettings, runSimulationDeferred]);

  // Cleanup raf on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <Tabs value={mode} onValueChange={(value) => setMode(value as 'manual' | 'ae')}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
            {/* Left: Camera settings (MF / AE) */}
            <div className="lg:col-span-3 space-y-6">
              <TabsList>
                <TabsTrigger value="manual">MF</TabsTrigger>
                <TabsTrigger value="ae">AE</TabsTrigger>
              </TabsList>
              <TabsContent value="manual" className="mt-0">
                <ManualModePanel
                  settings={manualSettings}
                  onSettingsChange={setManualSettings}
                />
              </TabsContent>
              <TabsContent value="ae" className="mt-0">
                <AEModePanel
                  priorities={aePriorities}
                  onPrioritiesChange={setAEPriorities}
                  onRunAE={handleRunAE}
                  trace={aeTrace}
                  allocatedSettings={allocatedSettings}
                />
              </TabsContent>
            </div>

            {/* Center: Simulated output (left photo panel) */}
            <div className="lg:col-span-4 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Simulated output</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowClipping(!showClipping)}
                      disabled={!scene}
                    >
                      {showClipping ? 'Hide' : 'Show'} clipping
                    </Button>
                  </div>
                  <CardDescription>
                    Forward-simulated result from current camera settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ImageCanvas
                    image={simOutput?.image ?? null}
                    highlightClipMask={simOutput?.highlightClipMask}
                    shadowClipMask={simOutput?.shadowClipMask}
                    showClipping={showClipping}
                    isLoading={isRendering}
                    displayWidth={canvasDisplayWidth}
                  />
                </CardContent>
              </Card>

              {/* Scene statistics & histograms */}
              <TelemetryPanel telemetry={telemetry} luminance={luminance} />
            </div>

            {/* Right: Scene + lighting + metering + stats below */}
            <div className="lg:col-span-5 space-y-6">
              <ScenePanel
                scene={scene}
                onImageUpload={handleImageUpload}
                illumination={scene?.illumination ?? 1.0}
                onIlluminationChange={handleIlluminationChange}
                onSceneChange={handleSceneChange}
                canvasDisplayWidth={canvasDisplayWidth}
              />

              {/* Metering mode - affects telemetry */}
              <MeteringPanel
                meteringMode={meteringMode}
                onMeteringModeChange={setMeteringMode}
              />
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
