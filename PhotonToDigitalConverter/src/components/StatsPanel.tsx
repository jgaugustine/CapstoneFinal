import { SimulationStats } from '../types/simulation'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'

interface StatsPanelProps {
  statistics: SimulationStats
}

export default function StatsPanel({ statistics }: StatsPanelProps) {
  const absorptionRate = statistics.totalPhotons > 0 
    ? (statistics.absorbedPhotons / statistics.totalPhotons * 100).toFixed(1)
    : '0.0'

  const efficiency = statistics.totalPhotons > 0
    ? (statistics.absorbedPhotons / statistics.totalPhotons).toFixed(3)
    : '0.000'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Photon Statistics */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-muted-foreground">PHOTON INTERACTION</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {statistics.totalPhotons.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Total Photons</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-green-500">
                {statistics.absorbedPhotons.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Absorbed</div>
            </div>
          </div>
          <div className="text-center">
            <Badge variant="outline">
              {absorptionRate}% Absorption Rate
            </Badge>
          </div>
        </div>

        {/* Electron Statistics */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-muted-foreground">CHARGE ACCUMULATION</h4>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-purple-500">
              {statistics.totalElectrons.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Total Electrons</div>
          </div>
        </div>

        {/* Digital Statistics */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-muted-foreground">DIGITAL OUTPUT</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-xl font-bold text-cyan-500">
                {Math.round(statistics.meanDN)}
              </div>
              <div className="text-xs text-muted-foreground">Mean DN</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-xl font-bold text-cyan-500">
                {statistics.maxDN}
              </div>
              <div className="text-xs text-muted-foreground">Max DN</div>
            </div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-xl font-bold text-cyan-500">
              {statistics.minDN}
            </div>
            <div className="text-xs text-muted-foreground">Min DN</div>
          </div>
        </div>

        {/* Saturation Warning */}
        {statistics.saturatedPixels > 0 && (
          <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
            <div className="text-center">
              <div className="text-lg font-bold text-red-500">
                {statistics.saturatedPixels}
              </div>
              <div className="text-xs text-red-400">Saturated Pixels</div>
            </div>
          </div>
        )}

        {/* Performance Metrics */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-muted-foreground">PERFORMANCE</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quantum Efficiency:</span>
              <span className="font-mono">{efficiency}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dynamic Range:</span>
              <span className="font-mono">
                {statistics.maxDN > 0 ? (statistics.maxDN / Math.max(1, statistics.minDN)).toFixed(1) : '∞'}:1
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Signal/Noise:</span>
              <span className="font-mono">
                {statistics.meanDN > 0 ? Math.round(Math.sqrt(statistics.meanDN)).toLocaleString() : '0'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
