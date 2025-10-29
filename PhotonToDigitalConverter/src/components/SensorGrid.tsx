import { Pixel, SimulationParameters } from '../types/simulation'
import { cn } from '../lib/utils'

interface SensorGridProps {
  pixels: Pixel[][]
  parameters: SimulationParameters
  phase: 'integration' | 'readout' | 'complete'
  currentTime?: number
}

export default function SensorGrid({ pixels, parameters, phase, currentTime = 0 }: SensorGridProps) {
  const maxElectrons = parameters.fullWellCapacity
  const bitDepth = parameters.bitDepth
  const maxDN = Math.pow(2, bitDepth) - 1

  const getPixelIntensity = (pixel: Pixel) => {
    const fillRatio = pixel.electronCount / maxElectrons
    return Math.min(1, fillRatio)
  }

  const getPixelColor = (pixel: Pixel) => {
    const intensity = getPixelIntensity(pixel)
    
    if (pixel.saturated) {
      return 'hsl(var(--overflow))'
    }
    
    if (intensity > 0) {
      // Create a gradient from dark to bright based on electron count
      const hue = 280 // Purple for charge
      const saturation = 100
      const lightness = 30 + (intensity * 40) // 30% to 70% lightness
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`
    }
    
    return 'hsl(var(--muted))'
  }

  const getDigitalValue = (pixel: Pixel) => {
    // Convert electrons to digital number
    const gain = 0.1 // electrons per DN
    return Math.min(maxDN, Math.round(pixel.electronCount * gain))
  }

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Sensor Array ({parameters.gridSize}×{parameters.gridSize})</h3>
        <div className="text-sm text-muted-foreground">
          Phase: <span className="font-medium capitalize">{phase}</span>
        </div>
      </div>
      
      <div 
        className="grid gap-1 mx-auto"
        style={{
          gridTemplateColumns: `repeat(${parameters.gridSize}, 1fr)`,
          width: 'fit-content'
        }}
      >
        {pixels.map((row, rowIndex) =>
          row.map((pixel, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={cn(
                "pixel-well relative border rounded-sm transition-all duration-300",
                pixel.electronCount > 0 && "filled",
                pixel.saturated && "saturated"
              )}
              style={{
                width: parameters.pixelSize,
                height: parameters.pixelSize,
                backgroundColor: getPixelColor(pixel),
                boxShadow: pixel.electronCount > 0 
                  ? `inset 0 0 ${Math.min(10, pixel.electronCount / 1000)}px hsl(var(--charge-glow) / 0.3)`
                  : undefined
              }}
            >
              {/* Impact flash */}
              {pixel.showUntil && currentTime <= pixel.showUntil && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    boxShadow: '0 0 12px 4px hsl(var(--photon-glow) / 0.6)',
                    borderRadius: 2,
                  }}
                />
              )}

              {/* Hit counter overlay */}
              {pixel.showUntil && currentTime <= pixel.showUntil && (
                <div className="absolute -top-3 -left-3 px-1.5 py-0.5 text-[10px] rounded bg-primary text-primary-foreground shadow" >
                  +{pixel.recentHits ?? 1}
                </div>
              )}
              {/* Electron count indicator */}
              {pixel.electronCount > 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-xs font-mono text-white drop-shadow-lg">
                    {pixel.electronCount > 1000 
                      ? `${Math.round(pixel.electronCount / 1000)}k`
                      : pixel.electronCount
                    }
                  </div>
                </div>
              )}
              
              {/* Digital value (shown during readout) */}
              {phase === 'readout' && (
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
                  <div className="digital-value text-xs">
                    {getDigitalValue(pixel)}
                  </div>
                </div>
              )}
              
              {/* Saturation indicator */}
              {pixel.saturated && (
                <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              )}
            </div>
          ))
        )}
      </div>
      
      {/* Legend */}
      <div className="mt-6 flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-muted rounded border"></div>
          <span>Empty</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border" style={{ background: 'hsl(280, 100%, 50%)' }}></div>
          <span>Charged</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border bg-red-500"></div>
          <span>Saturated</span>
        </div>
      </div>
      
      {/* Statistics */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="text-center">
          <div className="font-semibold text-primary">
            {pixels.flat().reduce((sum, pixel) => sum + pixel.electronCount, 0)}
          </div>
          <div className="text-muted-foreground">Total Electrons</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-primary">
            {pixels.flat().filter(p => p.electronCount > 0).length}
          </div>
          <div className="text-muted-foreground">Active Pixels</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-destructive">
            {pixels.flat().filter(p => p.saturated).length}
          </div>
          <div className="text-muted-foreground">Saturated</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-primary">
            {Math.round(pixels.flat().reduce((sum, pixel) => sum + getDigitalValue(pixel), 0) / (parameters.gridSize * parameters.gridSize))}
          </div>
          <div className="text-muted-foreground">Avg DN</div>
        </div>
      </div>
    </div>
  )
}
