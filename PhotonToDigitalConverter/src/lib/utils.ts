import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Physics constants and utilities
export const PHYSICS_CONSTANTS = {
  PLANCK: 6.626e-34, // J⋅s
  SPEED_OF_LIGHT: 3e8, // m/s
  ELECTRON_CHARGE: 1.602e-19, // C
  BOLTZMANN: 1.381e-23, // J/K
  TEMPERATURE: 300, // K (room temperature)
}

// Poisson process for photon generation
export function generatePoissonTimes(lambda: number, duration: number): number[] {
  const times: number[] = []
  let currentTime = 0
  
  while (currentTime < duration) {
    // Generate inter-arrival time using exponential distribution
    const interArrivalTime = -Math.log(1 - Math.random()) / lambda
    currentTime += interArrivalTime
    
    if (currentTime < duration) {
      times.push(currentTime)
    }
  }
  
  return times
}

// Quantum efficiency calculation (wavelength dependent)
export function calculateQE(wavelength: number, maxQE: number = 0.8): number {
  // Simplified QE curve - peaks around 550nm (green)
  const peakWavelength = 550
  const sigma = 100 // width of the curve
  
  const gaussian = Math.exp(-Math.pow((wavelength - peakWavelength) / sigma, 2))
  return maxQE * gaussian
}

// Convert wavelength to RGB color
export function wavelengthToRGB(wavelength: number): string {
  let r, g, b
  
  if (wavelength >= 380 && wavelength < 440) {
    r = -(wavelength - 440) / (440 - 380)
    g = 0
    b = 1
  } else if (wavelength >= 440 && wavelength < 490) {
    r = 0
    g = (wavelength - 440) / (490 - 440)
    b = 1
  } else if (wavelength >= 490 && wavelength < 510) {
    r = 0
    g = 1
    b = -(wavelength - 510) / (510 - 490)
  } else if (wavelength >= 510 && wavelength < 580) {
    r = (wavelength - 510) / (580 - 510)
    g = 1
    b = 0
  } else if (wavelength >= 580 && wavelength < 645) {
    r = 1
    g = -(wavelength - 645) / (645 - 580)
    b = 0
  } else if (wavelength >= 645 && wavelength <= 750) {
    r = 1
    g = 0
    b = 0
  } else {
    r = 0.5
    g = 0.5
    b = 0.5
  }
  
  // Adjust for brightness
  const factor = 0.8
  r = Math.round(255 * r * factor)
  g = Math.round(255 * g * factor)
  b = Math.round(255 * b * factor)
  
  return `rgb(${r}, ${g}, ${b})`
}

// Generate random wavelength in visible spectrum
export function randomVisibleWavelength(): number {
  return 380 + Math.random() * (750 - 380)
}

// Calculate photon energy
export function photonEnergy(wavelength: number): number {
  return (PHYSICS_CONSTANTS.PLANCK * PHYSICS_CONSTANTS.SPEED_OF_LIGHT) / (wavelength * 1e-9)
}

// Simulate shot noise (Poisson statistics)
export function addShotNoise(electronCount: number): number {
  if (electronCount <= 0) return 0
  // Shot noise follows Poisson statistics: σ = √N
  const noise = Math.sqrt(electronCount) * (Math.random() - 0.5) * 2
  return Math.max(0, electronCount + noise)
}

// Simulate read noise (Gaussian)
export function addReadNoise(electronCount: number, readNoiseRMS: number = 2): number {
  // Box-Muller transform for Gaussian noise
  const u1 = Math.random()
  const u2 = Math.random()
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  const noise = z0 * readNoiseRMS
  return Math.max(0, electronCount + noise)
}

// Simulate dark current
export function addDarkCurrent(electronCount: number, darkCurrentRate: number, deltaTime: number): number {
  // Dark current adds electrons over time
  const darkElectrons = darkCurrentRate * deltaTime * Math.random()
  return electronCount + darkElectrons
}

// Simulate fixed pattern noise (pixel-to-pixel variation)
export function addFixedPatternNoise(electronCount: number, pixelId: string, gainVariation: number = 0.05): number {
  // Use pixel ID as seed for consistent variation
  const seed = pixelId.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
  const random = (Math.sin(seed) + 1) / 2 // Pseudo-random between 0 and 1
  const variation = 1 + (random - 0.5) * gainVariation
  return electronCount * variation
}

// Simulate thermal noise
export function addThermalNoise(electronCount: number, temperature: number = 300): number {
  const kT = PHYSICS_CONSTANTS.BOLTZMANN * temperature
  const thermalElectrons = Math.sqrt(kT / (PHYSICS_CONSTANTS.ELECTRON_CHARGE * 0.026)) * (Math.random() - 0.5)
  return Math.max(0, electronCount + thermalElectrons)
}

// Calculate signal-to-noise ratio
export function calculateSNR(signal: number, noise: number): number {
  return noise > 0 ? 20 * Math.log10(signal / noise) : Infinity
}

// Simulate blooming (charge spillover to adjacent pixels)
export function simulateBlooming(pixels: any[][], row: number, col: number, spilloverRatio: number = 0.1): void {
  const maxRow = pixels.length - 1
  const maxCol = pixels[0].length - 1
  
  // Check adjacent pixels
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue
      
      const newRow = row + dr
      const newCol = col + dc
      
      if (newRow >= 0 && newRow <= maxRow && newCol >= 0 && newCol <= maxCol) {
        const spillover = pixels[row][col].electronCount * spilloverRatio * Math.random()
        pixels[newRow][newCol].electronCount += spillover
      }
    }
  }
}

// Convert electrons to digital number
export function electronsToDN(electrons: number, gain: number = 1, bitDepth: number = 12): number {
  const voltage = electrons * gain
  const maxValue = Math.pow(2, bitDepth) - 1
  return Math.min(maxValue, Math.round(voltage))
}

// Format time for display
export function formatTime(seconds: number): string {
  if (seconds < 1) {
    return `${Math.round(seconds * 1000)}ms`
  }
  return `${seconds.toFixed(1)}s`
}
