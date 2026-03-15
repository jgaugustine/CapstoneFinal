import { useState, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Layers, Download } from "lucide-react";
import { ImageCanvas, type ImageCanvasRef } from "@/components/ImageCanvas";
import { MathExplanation } from "@/components/MathExplanation";
import { TransformationType, RGB, BlurParams, SharpenParams, EdgeParams, DenoiseParams, CustomConvParams, defaultParamsFor } from "@/types/transformations";
import { AdjustmentLayer } from "@/components/AdjustmentLayer";
import { downsizeImageToDataURL } from "@/lib/imageResize";
import { FilterInstance, Checkpoint } from "@/types/transformations";
import { CheckpointPanel } from "@/components/CheckpointPanel";
import { TutorialTour } from "@/components/TutorialTour";
import { tutorialSteps, getFirstTutorialStepId } from "@/config/tutorialSteps";
import type { TutorialStep } from "@/config/tutorialSteps";

interface IndexProps {
  // Instance-based pipeline (introduced at App level)
  pipeline?: FilterInstance[];
  setPipeline?: (next: FilterInstance[] | ((prev: FilterInstance[]) => FilterInstance[])) => void;
  selectedInstanceId?: string | null;
  setSelectedInstanceId?: (id: string | null) => void;
  pipelineApi?: {
    addInstance: (kind: TransformationType) => void;
    duplicateInstance: (id: string) => void;
    deleteInstance: (id: string) => void;
    toggleInstance: (id: string) => void;
    reorderInstances: (activeId: string, overId: string) => void;
    updateInstanceParams: (id: string, updater: (prev: FilterInstance) => FilterInstance) => void;
  };
  checkpoints?: Checkpoint[];
  setCheckpoints?: (next: Checkpoint[] | ((prev: Checkpoint[]) => Checkpoint[])) => void;
  compareCheckpointId?: string | null;
  setCompareCheckpointId?: (id: string | null) => void;
}

export default function Index(_props: IndexProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(1);
  const [saturation, setSaturation] = useState(1);
  const [hue, setHue] = useState(0);
  const [vibrance, setVibrance] = useState(0);
  const [whites, setWhites] = useState(0);
  const [blacks, setBlacks] = useState(0);
  const [linearSaturation, setLinearSaturation] = useState(false);
  const [transformOrder, setTransformOrder] = useState<TransformationType[]>(['hue', 'vibrance', 'saturation', 'contrast', 'brightness', 'whites', 'blacks']);
  const [selectedRGB, setSelectedRGB] = useState<RGB | null>(null);
  const [activeTab, setActiveTab] = useState<string>('brightness');
  const [previewOriginal, setPreviewOriginal] = useState(false);
  const [dechanneled, setDechanneled] = useState(false);
  const [convAnalysis, setConvAnalysis] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageCanvasRef = useRef<ImageCanvasRef>(null);
  const MathAny = MathExplanation as any;

  // Tutorial tour state
  const TOUR_SEEN_KEY = "imagelab:tour-seen";
  const [tourStepId, setTourStepId] = useState<TutorialStep["id"] | null>(() => {
    if (typeof window === "undefined") return getFirstTutorialStepId();
    const params = new URLSearchParams(window.location.search);
    if (params.get("resetTour") === "1") {
      try { sessionStorage.removeItem(TOUR_SEEN_KEY); } catch {}
      return getFirstTutorialStepId();
    }
    if (sessionStorage.getItem(TOUR_SEEN_KEY)) return null;
    return getFirstTutorialStepId();
  });

  const advanceTour = useCallback(() => {
    setTourStepId((prev) => {
      const idx = tutorialSteps.findIndex((s) => s.id === prev);
      if (idx === -1 || idx >= tutorialSteps.length - 1) return null;
      return tutorialSteps[idx + 1].id;
    });
  }, []);

  const backTour = useCallback(() => {
    setTourStepId((prev) => {
      const idx = tutorialSteps.findIndex((s) => s.id === prev);
      if (idx <= 0) return prev;
      return tutorialSteps[idx - 1].id;
    });
  }, []);

  const closeTour = useCallback(() => {
    setTourStepId(null);
    try { sessionStorage.setItem(TOUR_SEEN_KEY, "1"); } catch {}
  }, []);

  const advanceTourOn = useCallback((event: import("@/config/tutorialSteps").TutorialEvent) => {
    setTourStepId((prev) => {
      if (!prev) return prev;
      const step = tutorialSteps.find((s) => s.id === prev);
      if (step?.advanceOn === event) {
        const idx = tutorialSteps.findIndex((s) => s.id === prev);
        if (idx >= 0 && idx < tutorialSteps.length - 1) return tutorialSteps[idx + 1].id;
        return null;
      }
      return prev;
    });
  }, []);
  const generateId = useCallback(() => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  }, []);

  const saveCheckpoint = useCallback(() => {
    if (!_props.pipeline || !_props.setCheckpoints) return;
    const checkpoint: Checkpoint = {
      id: generateId(),
      pipeline: structuredClone(_props.pipeline),
      createdAt: Date.now(),
    };
    _props.setCheckpoints((prev) => [checkpoint, ...prev]);
  }, [_props.pipeline, _props.setCheckpoints, generateId]);

  const revertCheckpoint = useCallback((id: string) => {
    const cp = _props.checkpoints?.find((c) => c.id === id);
    if (!cp || !_props.setPipeline || !_props.setCompareCheckpointId) return;
    _props.setPipeline(cp.pipeline);
    _props.setCompareCheckpointId(null);
  }, [_props.checkpoints, _props.setPipeline, _props.setCompareCheckpointId]);

  const compareCheckpoint = useCallback((id: string) => {
    _props.setCompareCheckpointId?.((prev) => (prev === id ? null : id));
  }, [_props.setCompareCheckpointId]);

  const deleteCheckpoint = useCallback((id: string) => {
    _props.setCheckpoints?.((prev) => prev.filter((c) => c.id !== id));
    if (_props.compareCheckpointId === id) {
      _props.setCompareCheckpointId?.(null);
    }
  }, [_props.setCheckpoints, _props.compareCheckpointId, _props.setCompareCheckpointId]);

  const handleDownload = useCallback(async () => {
    const blob = await imageCanvasRef.current?.exportToBlob("image/png");
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `imagelab-export-${Date.now()}.png`;
    a.click();
    URL.revokeObjectURL(url);
    advanceTourOn("image-downloaded");
  }, [advanceTourOn]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await downsizeImageToDataURL(file, 2048, 0.85);
      const img = new Image();
      img.onload = () => {
        setImage(img);
        advanceTourOn("image-loaded");
      };
      img.src = dataUrl;
    } catch (err) {
      // Fallback to original file if resize fails
      const reader = new FileReader();
      reader.onload = event => {
        const img = new Image();
        img.onload = () => setImage(img);
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };
  return <div className="min-h-screen bg-background flex flex-col">
      <TutorialTour
        steps={tutorialSteps}
        currentStepId={tourStepId}
        onNext={advanceTour}
        onBack={backTour}
        onSkip={closeTour}
        onComplete={closeTour}
      />
      <header className="shrink-0 border-b bg-background px-4 py-2">
        <div className="flex items-center gap-2">
          <a
            href="/"
            target="_top"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to Capstone
          </a>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center rounded-md border border-border bg-background px-3 py-1 text-xs font-medium text-foreground shadow-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={() => {
                try { sessionStorage.removeItem(TOUR_SEEN_KEY); } catch {}
                setTourStepId(getFirstTutorialStepId());
              }}
            >
              Guided tour
            </button>
          </div>
        </div>
      </header>
      <div className="flex-1 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Panel - Image & Controls */}
          <div className="space-y-6">
            <Card className="p-6 border-border bg-card" data-tour-id="image-preview">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-semibold text-primary flex items-center gap-2 shrink-0">
                  <Upload className="w-5 h-5" />
                  Image Preview
                </h2>
            {image && (
              <div className="flex flex-wrap items-center gap-2 min-w-0 justify-end">
                <Button
                  className="shrink-0"
                  variant={dechanneled ? "default" : "outline"}
                  onClick={() => setDechanneled(!dechanneled)}
                  data-tour-id="dechannel-btn"
                  aria-pressed={dechanneled}
                >
                  <Layers className="w-4 h-4 mr-2" />
                  Dechannel
                </Button>
                <Button
                  className="shrink-0"
                  variant="outline"
                  onPointerDown={() => setPreviewOriginal(true)}
                  onPointerUp={() => setPreviewOriginal(false)}
                  onPointerLeave={() => setPreviewOriginal(false)}
                  onBlur={() => setPreviewOriginal(false)}
                  aria-pressed={previewOriginal}
                >
                  Show Original
                </Button>
                <Button
                  className="shrink-0"
                  variant="outline"
                  onClick={handleDownload}
                  disabled={dechanneled}
                  data-tour-id="download-btn"
                  title={dechanneled ? "Switch to normal view to download" : "Download processed image (PNG)"}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                    <Button
                      className="shrink-0"
                      variant="outline"
                      onClick={() => {
                        setImage(null);
                        setSelectedRGB(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                    >
                      Remove Image
                    </Button>
                  </div>
                )}
              </div>
              
              {!image ? <div className="aspect-video border-2 border-dashed border-border rounded-lg flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
                    <Button onClick={() => fileInputRef.current?.click()}>
                      Upload Image
                    </Button>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </div>
                </div> : _props.compareCheckpointId && _props.checkpoints?.find((c) => c.id === _props.compareCheckpointId) ? (
                <div className="aspect-video w-full overflow-hidden" data-tour-id="compare-view">
                  <div className="grid grid-cols-2 gap-2 h-full">
                    <div className="flex flex-col overflow-hidden rounded-lg border border-border">
                      <div className="shrink-0 px-2 py-1 text-xs font-medium bg-muted text-muted-foreground">Checkpoint</div>
                      <div className="flex-1 min-h-0">
                        <ImageCanvas
                          key="compare-checkpoint"
                          image={image}
                          pipeline={_props.checkpoints?.find((c) => c.id === _props.compareCheckpointId)?.pipeline}
                          brightness={brightness}
                          contrast={contrast}
                          saturation={saturation}
                          hue={hue}
                          whites={whites}
                          blacks={blacks}
                          linearSaturation={linearSaturation}
                          vibrance={vibrance}
                          transformOrder={transformOrder}
                          enableInspector={false}
                          previewOriginal={false}
                          dechanneled={false}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col overflow-hidden rounded-lg border border-border">
                      <div className="shrink-0 px-2 py-1 text-xs font-medium bg-muted text-muted-foreground">Current</div>
                      <div className="flex-1 min-h-0">
                        <ImageCanvas
                          ref={imageCanvasRef}
                          key="compare-current"
                          image={image}
                          pipeline={_props.pipeline}
                          onSelectInstance={_props.setSelectedInstanceId}
                          selectedInstanceId={_props.selectedInstanceId ?? null}
                          brightness={brightness}
                          contrast={contrast}
                          saturation={saturation}
                          hue={hue}
                          whites={whites}
                          blacks={blacks}
                          linearSaturation={linearSaturation}
                          vibrance={vibrance}
                          transformOrder={transformOrder}
                          onPixelSelect={(rgb: RGB) => { setSelectedRGB(rgb); advanceTourOn("pixel-selected"); }}
                          onSelectConvAnalysis={setConvAnalysis}
                          previewOriginal={previewOriginal}
                          dechanneled={false}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="aspect-video w-full overflow-hidden"><ImageCanvas ref={imageCanvasRef} key={dechanneled ? 'dechanneled' : 'normal'} image={image} pipeline={_props.pipeline} onSelectInstance={_props.setSelectedInstanceId} selectedInstanceId={_props.selectedInstanceId ?? null} brightness={brightness} contrast={contrast} saturation={saturation} hue={hue} whites={whites} blacks={blacks} linearSaturation={linearSaturation} vibrance={vibrance} transformOrder={transformOrder} onPixelSelect={(rgb: RGB) => { setSelectedRGB(rgb); advanceTourOn("pixel-selected"); }} onSelectConvAnalysis={setConvAnalysis} previewOriginal={previewOriginal} dechanneled={dechanneled} /></div>
              )}
            </Card>

            <Card className="p-6 border-border bg-card" data-tour-id="transform-controls">
              <h2 className="text-xl font-semibold text-primary mb-6">Transformation Controls</h2>
              
              <AdjustmentLayer
                highlightConvolutionOptions={tourStepId === "add-conv-layer"}
                transformOrder={transformOrder}
                onOrderChange={setTransformOrder}
                pipeline={_props.pipeline}
                onReorderInstances={_props.pipelineApi?.reorderInstances ? (a: string, o: string) => { _props.pipelineApi!.reorderInstances(a, o); advanceTourOn("layer-reordered"); } : undefined}
                onAddInstance={_props.pipelineApi?.addInstance ? (k: any) => {
                  _props.pipelineApi!.addInstance(k);
                  const convKinds = new Set(['blur', 'sharpen', 'edge', 'denoise', 'customConv']);
                  if (convKinds.has(k)) {
                    advanceTourOn("conv-layer-added");
                  }
                  advanceTourOn("layer-added");
                } : undefined}
                onDuplicateInstance={_props.pipelineApi?.duplicateInstance}
                onDeleteInstance={_props.pipelineApi?.deleteInstance}
                onToggleInstance={_props.pipelineApi?.toggleInstance}
                image={image}
                linearSaturation={linearSaturation}
                onChangeInstanceParams={(id, kind, nextValue) => {
                  _props.pipelineApi?.updateInstanceParams?.(id, (prev) => {
                    if (kind === 'vibrance') return { ...prev, params: { vibrance: nextValue } };
                    if (kind === 'hue') return { ...prev, params: { hue: nextValue } };
                    if (kind === 'blur') {
                      const p = prev.params as BlurParams;
                      if (p.kind === 'gaussian') {
                        const sigma = Math.max(0.05, Number(nextValue) || 0.05);
                        return { ...prev, params: { ...p, sigma } };
                      } else {
                        const size = ((): 3|5|7 => {
                          const v = Math.round(Number(nextValue));
                          if (v <= 4) return 3; if (v <= 6) return 5; return 7;
                        })();
                        return { ...prev, params: { ...p, size } };
                      }
                    }
                    if (kind === 'sharpen') {
                      const p = prev.params as SharpenParams;
                      const amount = Math.max(0, Number(nextValue) || 0);
                      return { ...prev, params: { ...p, amount } };
                    }
                    if (kind === 'edge') {
                      const p = prev.params as EdgeParams;
                      const size = (Number(nextValue) || 3) <= 4 ? 3 : 5;
                      return { ...prev, params: { ...p, size } };
                    }
                    if (kind === 'denoise') {
                      const p = prev.params as DenoiseParams;
                      const strength = Math.max(0, Math.min(1, Number(nextValue)));
                      return { ...prev, params: { ...p, strength } };
                    }
                    if (kind === 'customConv') {
                      const p = prev.params as CustomConvParams;
                      const newSize = ((): 3|5|7|9 => {
                        const v = Math.round(Number(nextValue));
                        if (v <= 4) return 3; if (v <= 6) return 5; if (v <= 8) return 7; return 9;
                      })();
                      // Resize kernel when size changes
                      const oldSize = p.kernel.length;
                      const newKernel: number[][] = Array.from({ length: newSize }, () => 
                        Array.from({ length: newSize }, () => 0)
                      );
                      // Copy existing values, centered
                      const offset = Math.floor((newSize - oldSize) / 2);
                      for (let y = 0; y < oldSize && y + offset < newSize; y++) {
                        for (let x = 0; x < oldSize && x + offset < newSize; x++) {
                          if (y + offset >= 0 && x + offset >= 0) {
                            newKernel[y + offset][x + offset] = p.kernel[y][x];
                          }
                        }
                      }
                      // If expanding, initialize center to 1 (identity-like) if it's zero
                      if (newSize > oldSize) {
                        const center = Math.floor(newSize / 2);
                        if (newKernel[center][center] === 0) {
                          newKernel[center][center] = 1;
                        }
                      }
                      return { ...prev, params: { ...p, size: newSize, kernel: newKernel } };
                    }
                    return { ...prev, params: { value: nextValue } };
                  });
                  advanceTourOn("slider-changed");
                  return;
                }}
                brightness={brightness}
                setBrightness={setBrightness}
                contrast={contrast}
                setContrast={setContrast}
                saturation={saturation}
                setSaturation={setSaturation}
                vibrance={vibrance}
                setVibrance={setVibrance}
                hue={hue}
                setHue={setHue}
                whites={whites}
                setWhites={setWhites}
                blacks={blacks}
                setBlacks={setBlacks}
                onResetAll={() => {
                  // Reset legacy sliders
                  setBrightness(0);
                  setContrast(1);
                  setSaturation(1);
                  setHue(0);
                  setVibrance(0);
                  setWhites(0);
                  setBlacks(0);
                  setLinearSaturation(false);
                  // Reset all pipeline instances to their defaults
                  if (_props.pipeline && _props.pipelineApi?.updateInstanceParams) {
                    _props.pipeline.forEach(instance => {
                      const defaultParams = defaultParamsFor(instance.kind);
                      _props.pipelineApi?.updateInstanceParams(instance.id, (prev) => ({
                        ...prev,
                        params: defaultParams
                      }));
                    });
                  }
                }}
                onCardClick={(transformType) => setActiveTab(transformType as string)}
                onInstanceSelect={(instanceId) => {
                  _props.setSelectedInstanceId?.(instanceId);
                  const instance = _props.pipeline?.find(p => p.id === instanceId);
                  if (instance) {
                    setActiveTab(instance.kind);
                    const convKinds = new Set(['blur', 'sharpen', 'edge', 'denoise', 'customConv']);
                    if (convKinds.has(instance.kind)) {
                      advanceTourOn("conv-layer-selected");
                    }
                  }
                }}
                activeTab={activeTab}
              />
            </Card>
          </div>

          {/* Right Panel - Checkpoints & Mathematical Explanation */}
          <div className="space-y-6" data-tour-id="math-panel">
            <Card className="p-6 border-border bg-card">
              <CheckpointPanel
                checkpoints={_props.checkpoints ?? []}
                onSaveCheckpoint={saveCheckpoint}
                onRevert={revertCheckpoint}
                onCompare={compareCheckpoint}
                onDelete={deleteCheckpoint}
                compareCheckpointId={_props.compareCheckpointId ?? null}
                hasImage={!!image}
                onCheckpointSaved={() => advanceTourOn("checkpoint-saved")}
              />
            </Card>
            <MathAny
              brightness={brightness}
              contrast={contrast}
              saturation={saturation}
              hue={hue}
              vibrance={vibrance}
              whites={whites}
              blacks={blacks}
              linearSaturation={linearSaturation}
              onToggleLinearSaturation={setLinearSaturation}
              selectedRGB={selectedRGB || undefined}
              transformOrder={transformOrder}
              pipeline={_props.pipeline}
              selectedInstanceId={_props.selectedInstanceId ?? null}
              hasImage={!!image}
              activeTab={activeTab}
              convAnalysis={convAnalysis}
              onUpdateInstanceParams={_props.pipelineApi?.updateInstanceParams}
              image={image}
              onActiveTabChange={setActiveTab}
            />
          </div>
        </div>
      </div>
      </div>
    </div>;
}