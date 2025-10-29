export interface Photon {
  id: string
  x: number
  y: number
  wavelength: number
  energy: number
  arrivalTime: number
  absorbed: boolean
  targetPixel: { row: number; col: number }
}

export interface Pixel {
  row: number
  col: number
  electronCount: number
  digitalValue: number
  saturated: boolean
  lastUpdate: number
}

export interface SimulationState {
  isRunning: boolean
  isPaused: boolean
  currentTime: number
  exposureTime: number
  phase: 'integration' | 'readout' | 'complete'
  photons: Photon[]
  pixels: Pixel[][]
  statistics: SimulationStats
}

export interface SimulationStats {
  totalPhotons: number
  absorbedPhotons: number
  totalElectrons: number
  meanDN: number
  maxDN: number
  minDN: number
  saturatedPixels: number
}

export interface SimulationParameters {
  lightIntensity: number // photons per second
  quantumEfficiency: number // 0-1
  exposureTime: number // seconds
  pixelSize: number
  gridSize: number
  fullWellCapacity: number
  readNoise: number
  bitDepth: number
  wavelengthRange: [number, number]
  enableNoise: boolean
  enableDarkCurrent: boolean
  darkCurrentRate: number
}

export interface ReadoutStep {
  id: string
  name: string
  description: string
  active: boolean
  completed: boolean
  progress: number
}

export interface QECurve {
  wavelength: number
  efficiency: number
}

export interface AnimationFrame {
  timestamp: number
  photons: Photon[]
  pixels: Pixel[][]
  readoutStep?: string
}
