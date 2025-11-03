import { useState } from 'react'
import PhotonToDigitalConverter from './components/PhotonToDigitalConverter'
import './App.css'
import type { FilterInstance, FilterKind, FilterParams, RGB } from './types/transformations'
import { defaultParamsFor } from './types/transformations'
import TransformationSliders from './components/TransformationSliders'
import ImageCanvas from './components/ImageCanvas'
import PixelInspector from './components/PixelInspector'
import MathExplanation from './components/MathExplanation'
import RGBCubeVisualizer from './components/RGBCubeVisualizer'

function App() {
  const [pipeline, setPipeline] = useState<FilterInstance[]>([])
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null)
  const [inspectorSteps, setInspectorSteps] = useState<{ id: string; kind: string; inputRGB: RGB; outputRGB: RGB }[]>([])
  const [inspectorFinal, setInspectorFinal] = useState<RGB | null>(null)

  const genId = () => `inst_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`

  const addInstance = (kind: FilterKind) => {
    const inst: FilterInstance = {
      id: genId(),
      kind,
      params: defaultParamsFor(kind),
      enabled: true,
    }
    setPipeline((prev) => [...prev, inst])
    setSelectedInstanceId(inst.id)
  }

  const duplicateInstance = (id: string) => {
    setPipeline((prev) => {
      const idx = prev.findIndex((p) => p.id === id)
      if (idx < 0) return prev
      const orig = prev[idx]
      const copy: FilterInstance = { ...orig, id: genId() }
      const next = [...prev]
      next.splice(idx + 1, 0, copy)
      return next
    })
  }

  const deleteInstance = (id: string) => {
    setPipeline((prev) => prev.filter((p) => p.id !== id))
    setSelectedInstanceId((cur) => (cur === id ? null : cur))
  }

  const toggleInstance = (id: string) => {
    setPipeline((prev) => prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p)))
  }

  const moveUp = (id: string) => {
    setPipeline((prev) => {
      const idx = prev.findIndex((p) => p.id === id)
      if (idx <= 0) return prev
      const next = [...prev]
      const [item] = next.splice(idx, 1)
      next.splice(idx - 1, 0, item)
      return next
    })
  }

  const moveDown = (id: string) => {
    setPipeline((prev) => {
      const idx = prev.findIndex((p) => p.id === id)
      if (idx < 0 || idx >= prev.length - 1) return prev
      const next = [...prev]
      const [item] = next.splice(idx, 1)
      next.splice(idx + 1, 0, item)
      return next
    })
  }

  const changeParams = (id: string, params: FilterParams) => {
    setPipeline((prev) => prev.map((p) => (p.id === id ? { ...p, params } : p)))
    setSelectedInstanceId(id)
  }

  const resetPipeline = () => {
    setPipeline([])
    setSelectedInstanceId(null)
  }

  return (
    <div className="min-h-screen bg-background">
      <PhotonToDigitalConverter />

      <div className="max-w-7xl mx-auto p-4 space-y-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Image Filter Pipeline (Prototype)</h2>
          <p className="text-sm text-muted-foreground">Add adjustments, reorder, and inspect per-step pixel changes.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <TransformationSliders
              pipeline={pipeline}
              onChangeParams={changeParams}
              onDuplicate={duplicateInstance}
              onDelete={deleteInstance}
              onToggle={toggleInstance}
              onMoveUp={moveUp}
              onMoveDown={moveDown}
              onAdd={addInstance}
              onReset={resetPipeline}
            />
            <ImageCanvas
              pipeline={pipeline}
              onInspectPixel={(_x, _y, steps, final) => {
                setInspectorSteps(steps)
                setInspectorFinal(final)
              }}
            />
          </div>

          <div className="space-y-4">
            <PixelInspector steps={inspectorSteps} finalRGB={inspectorFinal} />
            <MathExplanation
              pipeline={pipeline}
              selectedInstanceId={selectedInstanceId}
              onSelectInstance={setSelectedInstanceId}
            />
            <RGBCubeVisualizer
              pipeline={pipeline}
              selectedInstanceId={selectedInstanceId}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App

