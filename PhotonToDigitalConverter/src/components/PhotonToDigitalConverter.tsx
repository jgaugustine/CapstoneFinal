import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Slider } from './ui/slider'
import { Switch } from './ui/switch'
import { Badge } from './ui/badge'
import { Play, Pause, RotateCcw, Download, Settings } from 'lucide-react'
import PhotonGenerator from './PhotonGenerator'
import SensorGrid from './SensorGrid'
import ReadoutChain from './ReadoutChain'
import StatsPanel from './StatsPanel'
import QECurveChart from './QECurveChart'
import { SimulationState, SimulationParameters, Pixel } from '../types/simulation'
import { generatePoissonTimes, calculateQE, randomVisibleWavelength, addShotNoise, addReadNoise, addDarkCurrent, addFixedPatternNoise, addThermalNoise } from '../lib/utils'

const DEFAULT_PARAMS: SimulationParameters = {
  lightIntensity: 1000, // photons per second
  quantumEfficiency: 0.8,
  exposureTime: 2.0,
  pixelSize: 20,
  gridSize: 10,
  fullWellCapacity: 50000,
  readNoise: 2,
  bitDepth: 12,
  wavelengthRange: [380, 750],
  enableNoise: true,
  enableDarkCurrent: true,
  darkCurrentRate: 0.1
}

export default function PhotonToDigitalConverter() {
  const [simulationState, setSimulationState] = useState<SimulationState>({
    isRunning: false,
    isPaused: false,
    currentTime: 0,
    exposureTime: DEFAULT_PARAMS.exposureTime,
    phase: 'integration',
    photons: [],
    pixels: initializePixels(DEFAULT_PARAMS.gridSize),
    statistics: {
      totalPhotons: 0,
      absorbedPhotons: 0,
      totalElectrons: 0,
      meanDN: 0,
      maxDN: 0,
      minDN: 0,
      saturatedPixels: 0
    }
  })

  const [parameters, setParameters] = useState<SimulationParameters>(DEFAULT_PARAMS)
  const animationRef = useRef<number>()
  const lastTimeRef = useRef<number>(0)

  // Initialize pixel grid
  function initializePixels(gridSize: number): Pixel[][] {
    const pixels: Pixel[][] = []
    for (let row = 0; row < gridSize; row++) {
      pixels[row] = []
      for (let col = 0; col < gridSize; col++) {
        pixels[row][col] = {
          row,
          col,
          electronCount: 0,
          digitalValue: 0,
          saturated: false,
          lastUpdate: 0
        }
      }
    }
    return pixels
  }

  // Generate photons using Poisson process
  const generatePhotons = useCallback((currentTime: number, deltaTime: number) => {
    if (simulationState.phase !== 'integration') return []

    const lambda = parameters.lightIntensity
    const newPhotons: any[] = []
    
    // Generate photon arrival times for this frame
    const frameTimes = generatePoissonTimes(lambda, deltaTime)
    
    frameTimes.forEach((time, index) => {
      const wavelength = randomVisibleWavelength()
      const qe = calculateQE(wavelength, parameters.quantumEfficiency)
      
      // Random position across the sensor width
      const x = Math.random() * (parameters.gridSize * parameters.pixelSize)
      const targetPixel = {
        row: Math.floor(Math.random() * parameters.gridSize),
        col: Math.floor(Math.random() * parameters.gridSize)
      }

      newPhotons.push({
        id: `photon-${Date.now()}-${index}`,
        x,
        y: 0,
        wavelength,
        energy: (6.626e-34 * 3e8) / (wavelength * 1e-9),
        arrivalTime: currentTime + time,
        absorbed: Math.random() < qe,
        targetPixel
      })
    })

    return newPhotons
  }, [parameters, simulationState.phase])

  // Update pixel states when photons are absorbed
  const updatePixels = useCallback((photons: any[], deltaTime: number) => {
    setSimulationState(prev => {
      const newPixels = prev.pixels.map(row => row.map(pixel => ({ ...pixel })))
      let absorbedCount = 0
      let totalElectrons = 0

      // Process photon absorption
      photons.forEach(photon => {
        if (photon.absorbed) {
          const pixel = newPixels[photon.targetPixel.row][photon.targetPixel.col]
          pixel.electronCount += 1
          pixel.lastUpdate = photon.arrivalTime
          pixel.saturated = pixel.electronCount >= parameters.fullWellCapacity
          absorbedCount++
        }
      })

      // Apply noise sources if enabled
      if (parameters.enableNoise) {
        newPixels.forEach((row, rowIndex) => {
          row.forEach((pixel, colIndex) => {
            if (pixel.electronCount > 0) {
              // Apply shot noise
              pixel.electronCount = addShotNoise(pixel.electronCount)
              
              // Apply fixed pattern noise
              const pixelId = `${rowIndex}-${colIndex}`
              pixel.electronCount = addFixedPatternNoise(pixel.electronCount, pixelId)
              
              // Apply thermal noise
              pixel.electronCount = addThermalNoise(pixel.electronCount)
              
              // Apply dark current
              if (parameters.enableDarkCurrent) {
                pixel.electronCount = addDarkCurrent(pixel.electronCount, parameters.darkCurrentRate, deltaTime)
              }
              
              // Ensure non-negative
              pixel.electronCount = Math.max(0, pixel.electronCount)
              pixel.saturated = pixel.electronCount >= parameters.fullWellCapacity
            }
          })
        })
      }

      // Calculate statistics
      const allPixels = newPixels.flat()
      totalElectrons = allPixels.reduce((sum, pixel) => sum + pixel.electronCount, 0)
      
      // Apply read noise for digital conversion
      const digitalValues = allPixels.map(p => {
        let electrons = p.electronCount
        if (parameters.enableNoise) {
          electrons = addReadNoise(electrons, parameters.readNoise)
        }
        return Math.min(Math.pow(2, parameters.bitDepth) - 1, Math.round(electrons * 0.1))
      })
      
      const meanDN = digitalValues.reduce((sum, val) => sum + val, 0) / digitalValues.length
      const maxDN = Math.max(...digitalValues)
      const minDN = Math.min(...digitalValues)
      const saturatedPixels = allPixels.filter(p => p.saturated).length

      return {
        ...prev,
        pixels: newPixels,
        statistics: {
          totalPhotons: prev.statistics.totalPhotons + photons.length,
          absorbedPhotons: prev.statistics.absorbedPhotons + absorbedCount,
          totalElectrons,
          meanDN,
          maxDN,
          minDN,
          saturatedPixels
        }
      }
    })
  }, [parameters])

  // Animation loop
  const animate = useCallback((currentTime: number) => {
    if (!simulationState.isRunning || simulationState.isPaused) return

    const deltaTime = (currentTime - lastTimeRef.current) / 1000
    lastTimeRef.current = currentTime

    setSimulationState(prev => {
      const newTime = prev.currentTime + deltaTime
      
      // Check if exposure time is complete
      if (newTime >= prev.exposureTime && prev.phase === 'integration') {
        return {
          ...prev,
          currentTime: newTime,
          phase: 'readout'
        }
      }

      // Generate new photons during integration phase
      if (prev.phase === 'integration') {
        const newPhotons = generatePhotons(newTime, deltaTime)
        updatePixels(newPhotons, deltaTime)
        
        return {
          ...prev,
          currentTime: newTime,
          photons: [...prev.photons, ...newPhotons].slice(-1000) // Keep last 1000 photons for performance
        }
      }

      return {
        ...prev,
        currentTime: newTime
      }
    })

    animationRef.current = requestAnimationFrame(animate)
  }, [simulationState.isRunning, simulationState.isPaused, generatePhotons, updatePixels])

  // Start animation loop
  useEffect(() => {
    if (simulationState.isRunning && !simulationState.isPaused) {
      lastTimeRef.current = performance.now()
      animationRef.current = requestAnimationFrame(animate)
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [simulationState.isRunning, simulationState.isPaused, animate])

  // Control functions
  const startSimulation = () => {
    setSimulationState(prev => ({ ...prev, isRunning: true, isPaused: false }))
  }

  const pauseSimulation = () => {
    setSimulationState(prev => ({ ...prev, isPaused: !prev.isPaused }))
  }

  const resetSimulation = () => {
    setSimulationState({
      isRunning: false,
      isPaused: false,
      currentTime: 0,
      exposureTime: parameters.exposureTime,
      phase: 'integration',
      photons: [],
      pixels: initializePixels(parameters.gridSize),
      statistics: {
        totalPhotons: 0,
        absorbedPhotons: 0,
        totalElectrons: 0,
        meanDN: 0,
        maxDN: 0,
        minDN: 0,
        saturatedPixels: 0
      }
    })
  }

  const updateParameter = (key: keyof SimulationParameters, value: number | boolean) => {
    setParameters(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground">
            Photon-to-Digital Converter Visualization
          </h1>
          <p className="text-muted-foreground">
            Interactive simulation of the complete image sensor pipeline
          </p>
        </div>

        {/* Controls Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Simulation Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Light Intensity */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Light Intensity</label>
                <Slider
                  value={[parameters.lightIntensity]}
                  onValueChange={([value]) => updateParameter('lightIntensity', value)}
                  min={100}
                  max={10000}
                  step={100}
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground">
                  {parameters.lightIntensity} photons/sec
                </div>
              </div>

              {/* Quantum Efficiency */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Quantum Efficiency</label>
                <Slider
                  value={[parameters.quantumEfficiency]}
                  onValueChange={([value]) => updateParameter('quantumEfficiency', value)}
                  min={0.1}
                  max={1.0}
                  step={0.05}
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground">
                  {(parameters.quantumEfficiency * 100).toFixed(0)}%
                </div>
              </div>

              {/* Exposure Time */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Exposure Time</label>
                <Slider
                  value={[parameters.exposureTime]}
                  onValueChange={([value]) => updateParameter('exposureTime', value)}
                  min={0.1}
                  max={10.0}
                  step={0.1}
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground">
                  {parameters.exposureTime.toFixed(1)}s
                </div>
              </div>

              {/* Bit Depth */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Bit Depth</label>
                <Slider
                  value={[parameters.bitDepth]}
                  onValueChange={([value]) => updateParameter('bitDepth', value)}
                  min={8}
                  max={16}
                  step={1}
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground">
                  {parameters.bitDepth}-bit
                </div>
              </div>
            </div>

            {/* Noise Controls */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={parameters.enableNoise}
                  onCheckedChange={(checked) => updateParameter('enableNoise', checked)}
                />
                <label className="text-sm">Enable Noise</label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={parameters.enableDarkCurrent}
                  onCheckedChange={(checked) => updateParameter('enableDarkCurrent', checked)}
                />
                <label className="text-sm">Dark Current</label>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center gap-4">
              <Button
                onClick={startSimulation}
                disabled={simulationState.isRunning}
                className="flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                Start
              </Button>
              <Button
                onClick={pauseSimulation}
                disabled={!simulationState.isRunning}
                variant="outline"
                className="flex items-center gap-2"
              >
                {simulationState.isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                {simulationState.isPaused ? 'Resume' : 'Pause'}
              </Button>
              <Button
                onClick={resetSimulation}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
              <Button
                onClick={() => {/* TODO: Implement export */}}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>

            {/* Status */}
            <div className="flex items-center gap-4">
              <Badge variant={simulationState.isRunning ? 'default' : 'secondary'}>
                {simulationState.phase === 'integration' ? 'Integration' : 
                 simulationState.phase === 'readout' ? 'Readout' : 'Complete'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Time: {(simulationState.currentTime).toFixed(2)}s / {simulationState.exposureTime.toFixed(1)}s
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Main Visualization Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Sensor and Photons */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sensor Array & Photon Stream</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <PhotonGenerator
                    photons={simulationState.photons}
                    isRunning={simulationState.isRunning}
                    phase={simulationState.phase}
                  />
                  <SensorGrid
                    pixels={simulationState.pixels}
                    parameters={parameters}
                    phase={simulationState.phase}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Readout Chain */}
            <ReadoutChain
              phase={simulationState.phase}
              pixels={simulationState.pixels}
              parameters={parameters}
            />
          </div>

          {/* Right Panel - Statistics and Charts */}
          <div className="space-y-4">
            <StatsPanel statistics={simulationState.statistics} />
            <QECurveChart parameters={parameters} />
          </div>
        </div>
      </div>
    </div>
  )
}
