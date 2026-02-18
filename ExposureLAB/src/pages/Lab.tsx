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
  AllocationLog,
  AEAlgorithm,
} from '@/types';
import { loadImage } from '@/io/loadImage';
import { simulateForward } from '@/sim/simulateForward';
import { runLexiAE } from '@/ae/runLexiAE';
import {
  allocateSettings,
  evRangeFromConstraints,
  settingsToEV,
  Preference,
} from '@/allocation/allocateSettings';
import {
  computeMatrixWeights,
  computeCenterWeights,
  computeSpotWeights,
  computeSubjectWeights,
} from '@/metering/weights';
import { computeWeightedLuminance, computeTelemetry } from '@/metering/stats';
import { applyMasksToScene } from '@/utils/masks';
import { snapMetadataToSliderValues } from '@/utils/cameraSettings';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { ImageCanvas } from '@/components/ImageCanvas';
import { ManualModePanel, CameraProgramMode } from '@/components/ManualModePanel';
import { AEModePanel } from '@/components/AEModePanel';
import { MeteringPanel } from '@/components/MeteringPanel';
import { TelemetryPanel } from '@/components/TelemetryPanel';
import { ScenePanel } from '@/components/ScenePanel';

export default function Lab() {
  const [scene, setScene] = useState<SceneState | null>(null);
  const [mode, setMode] = useState<'manual' | 'ae'>('manual');
  const [programMode, setProgramMode] = useState<CameraProgramMode>('manual');
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
  const [aeAlgorithm, setAEAlgorithm] = useState<AEAlgorithm>('global');
  const [allocatedSettings, setAllocatedSettings] = useState<CameraSettings | null>(null);
  const [allocationLog, setAllocationLog] = useState<AllocationLog | null>(null);
  const [simOutput, setSimOutput] = useState<SimOutput | null>(null);
  const [showClipping, setShowClipping] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const rafIdRef = useRef<number>(0);
  const [lastBaseEV, setLastBaseEV] = useState<number | null>(null);
  const [lastTargetEV, setLastTargetEV] = useState<number | null>(null);
  const [lastClampedTargetEV, setLastClampedTargetEV] = useState<number | null>(null);

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
      const { image, exposureMetadata } = await loadImage(file);
      setScene({
        image,
        illumination: 1.0,
        exposureMetadata,
      });
      setSimOutput(null);
      setAETrace(null);
      setAllocatedSettings(null);
      setAllocationLog(null);
      // Set slider defaults from EXIF when available, else use fallback
      setManualSettings(
        exposureMetadata
          ? snapMetadataToSliderValues(exposureMetadata, constraints)
          : { shutterSeconds: 1 / 60, aperture: 2.8, iso: 100 }
      );
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

  const runAEForTargetEV = useCallback(
    (preference: Preference) => {
      if (!scene?.image || !meteringWeights) {
        return null;
      }

      const meteringImage = applyMasksToScene(
        scene.image,
        scene.illumination,
        scene.radialMasks,
        scene.linearMasks
      );

      const evRange = evRangeFromConstraints(constraints, preference);
      const sweepRange = { min: -6, max: 6, step: 0.1 };
      const { chosenEV, trace } = runLexiAE(
        meteringImage,
        meteringWeights,
        aePriorities,
        sweepRange,
        aeAlgorithm
      );

      const baseEV = settingsToEV(manualSettings);
      const targetEV = baseEV + chosenEV;
      const clampedTargetEV = Math.max(evRange.min, Math.min(evRange.max, targetEV));
      const { settings: newSettings, log } = allocateSettings(
        clampedTargetEV,
        constraints,
        preference
      );

      return {
        newSettings,
        log,
        trace,
        baseEV,
        targetEV,
        clampedTargetEV,
      };
    },
    [
      scene,
      meteringWeights,
      aePriorities,
      aeAlgorithm,
      constraints,
      manualSettings,
    ]
  );

  const mapProgramModeToPreference = (mode: CameraProgramMode): Preference => {
    if (mode === 'aperture_priority') return 'aperture';
    if (mode === 'shutter_priority') return 'shutter';
    if (mode === 'manual_auto_iso') return 'iso';
    // manual and auto_ae both map to balanced full-triplet allocation
    return 'balanced';
  };

  // Run AE
  const handleRunAE = useCallback(() => {
    const preference = mapProgramModeToPreference(programMode);
    const result = runAEForTargetEV(preference);
    if (!result) return;

    const { newSettings, log, trace, baseEV, targetEV, clampedTargetEV } = result;

    setAETrace(trace);
    setAllocationLog(log);
    setLastBaseEV(baseEV);
    setLastTargetEV(targetEV);
    setLastClampedTargetEV(clampedTargetEV);

    setManualSettings(newSettings);
    setAllocatedSettings(newSettings);
    runSimulationDeferred(newSettings);
  }, [programMode, runAEForTargetEV, runSimulationDeferred]);

  // Base (scene) luminance for telemetry/histograms: metering image at EV=0 (masks + illumination applied)
  const sceneLuminance = useMemo(() => {
    if (!scene?.image || !meteringWeights) return undefined;
    const meteringImage = applyMasksToScene(
      scene.image,
      scene.illumination,
      scene.radialMasks,
      scene.linearMasks
    );
    return computeWeightedLuminance(meteringImage, meteringWeights);
  }, [scene, meteringWeights]);

  // Luminance from simulated output (post-edit)
  const outputLuminance = useMemo(() => {
    if (!simOutput?.image || !meteringWeights) return undefined;
    return computeWeightedLuminance(simOutput.image, meteringWeights);
  }, [simOutput, meteringWeights]);

  // Compute telemetry from simulated output
  const telemetry = useMemo(() => {
    if (!outputLuminance || !meteringWeights) return null;
    return computeTelemetry(outputLuminance, meteringWeights, aePriorities.epsilonShadow, scene?.subjectMask);
  }, [outputLuminance, meteringWeights, aePriorities.epsilonShadow, scene?.subjectMask]);

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
            {/* Left: Telemetry + Camera settings */}
            <div className="lg:col-span-3 space-y-6">
              <TelemetryPanel
                telemetry={telemetry}
                sceneLuminance={sceneLuminance}
                outputLuminance={outputLuminance}
              />

              <ManualModePanel
                settings={mode === 'ae' && allocatedSettings ? allocatedSettings : manualSettings}
                onSettingsChange={setManualSettings}
                exposureMetadata={scene?.exposureMetadata}
                mode={mode}
                onModeChange={(value) => setMode(value)}
                programMode={programMode}
                onProgramModeChange={setProgramMode}
              />
            </div>

            {/* Center: Metering (top middle) + simulated output */}
            <div className="lg:col-span-4 space-y-6">
              {/* Metering mode - affects telemetry */}
              <MeteringPanel
                meteringMode={meteringMode}
                onMeteringModeChange={setMeteringMode}
              />

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
            </div>

            {/* Right: Scene + lighting */}
            <div className="lg:col-span-5 space-y-6">
              <ScenePanel
                scene={scene}
                onImageUpload={handleImageUpload}
                illumination={scene?.illumination ?? 1.0}
                onIlluminationChange={handleIlluminationChange}
                onSceneChange={handleSceneChange}
                canvasDisplayWidth={canvasDisplayWidth}
              />
            </div>
          </div>

          {/* AE details span full width at the bottom in AE mode */}
          <TabsContent value="ae" className="mt-6">
            <AEModePanel
              priorities={aePriorities}
              onPrioritiesChange={setAEPriorities}
              algorithm={aeAlgorithm}
              onAlgorithmChange={setAEAlgorithm}
              onRunAE={handleRunAE}
              trace={aeTrace}
              allocatedSettings={allocatedSettings}
              allocationLog={allocationLog}
              constraints={constraints}
              baseEV={lastBaseEV}
              targetEV={lastTargetEV}
              clampedTargetEV={lastClampedTargetEV}
              programMode={programMode}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
