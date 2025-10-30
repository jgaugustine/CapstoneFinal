import { Pixel, SimulationParameters } from '../types/simulation'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { cn } from '../lib/utils'

interface ReadoutChainProps {
  pixels: Pixel[][]
  parameters: SimulationParameters
  phase: 'integration' | 'readout' | 'complete'
}

export default function ReadoutChain({ pixels, parameters, phase }: ReadoutChainProps) {
  const steps = [
    {
      id: 'integration',
      name: 'Integration',
      description: 'Photons accumulate as electrons',
      active: phase === 'integration',
      completed: phase === 'readout' || phase === 'complete'
    },
    {
      id: 'charge-transfer',
      name: 'Charge Transfer',
      description: 'Electrons move to readout circuit',
      active: phase === 'readout' && false, // This would be more complex in real implementation
      completed: phase === 'complete'
    },
    {
      id: 'amplification',
      name: 'Amplification',
      description: 'Charge converted to voltage',
      active: phase === 'readout' && false,
      completed: phase === 'complete'
    },
    {
      id: 'adc',
      name: 'ADC',
      description: `${parameters.bitDepth}-bit analog-to-digital conversion`,
      active: phase === 'readout',
      completed: phase === 'complete'
    },
    {
      id: 'output',
      name: 'Digital Output',
      description: 'Final image data',
      active: phase === 'complete',
      completed: phase === 'complete'
    }
  ]

  const getStepStatus = (step: typeof steps[0]) => {
    if (step.completed) return 'completed'
    if (step.active) return 'active'
    return 'pending'
  }

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'active': return 'bg-primary'
      default: return 'bg-muted'
    }
  }

  // Calculate some statistics for the readout process
  const totalElectrons = pixels.flat().reduce((sum, pixel) => sum + pixel.electronCount, 0)
  const maxElectrons = Math.max(...pixels.flat().map(p => p.electronCount))
  const digitalValues = pixels.flat().map(p => Math.min(Math.pow(2, parameters.bitDepth) - 1, Math.round(p.electronCount * 0.1)))
  const meanDN = digitalValues.reduce((sum, val) => sum + val, 0) / digitalValues.length

  return (
    <Card>
      <CardHeader>
        <CardTitle>Readout Chain</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Step indicators */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white transition-all duration-300",
                    getStepColor(getStepStatus(step))
                  )}
                >
                  {step.completed ? '✓' : index + 1}
                </div>
                <div className="mt-2 text-center">
                  <div className="text-xs font-medium">{step.name}</div>
                  <div className="text-xs text-muted-foreground max-w-20">
                    {step.description}
                  </div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={cn(
                  "w-8 h-0.5 mx-2 transition-colors duration-300",
                  step.completed ? "bg-green-500" : "bg-muted"
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Current process details */}
        {phase === 'readout' && (
          <div className="space-y-4">
            <div className="text-center">
              <Badge variant="outline" className="text-lg px-4 py-2">
                Converting {totalElectrons.toLocaleString()} electrons to digital values
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {totalElectrons.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Total Electrons</div>
              </div>
              
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {maxElectrons.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Max per Pixel</div>
              </div>
              
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {Math.round(meanDN)}
                </div>
                <div className="text-sm text-muted-foreground">Mean DN</div>
              </div>
            </div>
          </div>
        )}

        {phase === 'complete' && (
          <div className="space-y-4">
            <div className="text-center">
              <Badge className="text-lg px-4 py-2 bg-green-500">
                ✓ Conversion Complete
              </Badge>
            </div>
            
            <div className="text-center text-muted-foreground">
              Final image contains {digitalValues.length} pixels with {parameters.bitDepth}-bit depth
            </div>
          </div>
        )}

        {/* Technical details */}
        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <h4 className="font-semibold mb-2">Technical Parameters</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Bit Depth:</span>
              <span className="ml-2 font-mono">{parameters.bitDepth}-bit</span>
            </div>
            <div>
              <span className="text-muted-foreground">Max Value:</span>
              <span className="ml-2 font-mono">{Math.pow(2, parameters.bitDepth) - 1}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Read Noise:</span>
              <span className="ml-2 font-mono">{parameters.readNoise} e⁻ RMS</span>
            </div>
            <div>
              <span className="text-muted-foreground">Full Well:</span>
              <span className="ml-2 font-mono">{parameters.fullWellCapacity.toLocaleString()} e⁻</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

