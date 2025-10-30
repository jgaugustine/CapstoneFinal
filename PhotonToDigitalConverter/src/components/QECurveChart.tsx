import { SimulationParameters } from '../types/simulation'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { calculateQE } from '../lib/utils'

interface QECurveChartProps {
  parameters: SimulationParameters
}

export default function QECurveChart({ parameters }: QECurveChartProps) {
  // Generate QE curve data
  const wavelengths = Array.from({ length: 37 }, (_, i) => 380 + i * 10) // 380nm to 750nm
  const qeData = wavelengths.map(wl => ({
    wavelength: wl,
    efficiency: calculateQE(wl, parameters.quantumEfficiency)
  }))

  const maxQE = Math.max(...qeData.map(d => d.efficiency))
  const currentQE = parameters.quantumEfficiency

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quantum Efficiency Curve</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Chart */}
          <div className="relative h-48 bg-muted/20 rounded-lg p-4">
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 400 200"
              className="overflow-visible"
            >
              {/* Grid lines */}
              <defs>
                <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 20" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" opacity="0.3"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              {/* QE Curve */}
              <path
                d={qeData.map((point, index) => {
                  const x = (index / (qeData.length - 1)) * 360 + 20
                  const y = 180 - (point.efficiency / maxQE) * 160
                  return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
                }).join(' ')}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2"
              />
              
              {/* Current QE line */}
              <line
                x1="20"
                y1={180 - (currentQE / maxQE) * 160}
                x2="380"
                y2={180 - (currentQE / maxQE) * 160}
                stroke="hsl(var(--accent))"
                strokeWidth="1"
                strokeDasharray="5,5"
              />
              
              {/* Peak wavelength marker */}
              <circle
                cx={20 + (550 - 380) / (750 - 380) * 360}
                cy={180 - (calculateQE(550, parameters.quantumEfficiency) / maxQE) * 160}
                r="3"
                fill="hsl(var(--primary))"
              />
            </svg>
            
            {/* Y-axis labels */}
            <div className="absolute left-0 top-4 space-y-1 text-xs text-muted-foreground">
              <div>100%</div>
              <div>75%</div>
              <div>50%</div>
              <div>25%</div>
              <div>0%</div>
            </div>
            
            {/* X-axis labels */}
            <div className="absolute bottom-0 left-4 right-4 flex justify-between text-xs text-muted-foreground">
              <div>380nm</div>
              <div>500nm</div>
              <div>650nm</div>
              <div>750nm</div>
            </div>
          </div>

          {/* Current QE value */}
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {(currentQE * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">Peak Quantum Efficiency</div>
          </div>

          {/* Wavelength info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Peak Wavelength:</div>
              <div className="font-mono">550nm (Green)</div>
            </div>
            <div>
              <div className="text-muted-foreground">Spectral Range:</div>
              <div className="font-mono">380-750nm</div>
            </div>
          </div>

          {/* Color spectrum indicator */}
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Visible Spectrum:</div>
            <div className="h-4 rounded overflow-hidden flex">
              <div className="w-1/7 bg-purple-500"></div>
              <div className="w-1/7 bg-blue-500"></div>
              <div className="w-1/7 bg-cyan-500"></div>
              <div className="w-1/7 bg-green-500"></div>
              <div className="w-1/7 bg-yellow-500"></div>
              <div className="w-1/7 bg-orange-500"></div>
              <div className="w-1/7 bg-red-500"></div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>UV</span>
              <span>Blue</span>
              <span>Cyan</span>
              <span>Green</span>
              <span>Yellow</span>
              <span>Orange</span>
              <span>Red</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

