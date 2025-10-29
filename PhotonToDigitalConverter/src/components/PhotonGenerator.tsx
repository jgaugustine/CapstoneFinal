import { useEffect, useRef } from 'react'
import { Photon } from '../types/simulation'
import { wavelengthToRGB } from '../lib/utils'

interface PhotonGeneratorProps {
  photons: Photon[]
  isRunning: boolean
  phase: 'integration' | 'readout' | 'complete'
}

export default function PhotonGenerator({ photons, isRunning, phase }: PhotonGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw photons
    photons.forEach(photon => {
      if (phase === 'integration' || photon.arrivalTime < 0.1) {
        const color = wavelengthToRGB(photon.wavelength)
        const alpha = Math.max(0, 1 - (photon.arrivalTime * 2)) // Fade out over time
        
        ctx.save()
        ctx.globalAlpha = alpha
        ctx.fillStyle = color
        ctx.shadowColor = color
        ctx.shadowBlur = 8
        ctx.beginPath()
        ctx.arc(photon.x, photon.y, 2, 0, 2 * Math.PI)
        ctx.fill()
        ctx.restore()
      }
    })

    // Draw photon trails for moving photons
    if (isRunning && phase === 'integration') {
      ctx.save()
      ctx.strokeStyle = 'hsl(var(--photon))'
      ctx.lineWidth = 1
      ctx.globalAlpha = 0.6
      
      photons.slice(-50).forEach(photon => {
        if (photon.y < 200) { // Only draw trails for photons still moving
          ctx.beginPath()
          ctx.moveTo(photon.x, photon.y)
          ctx.lineTo(photon.x, photon.y + 20)
          ctx.stroke()
        }
      })
      ctx.restore()
    }
  }, [photons, isRunning, phase])

  return (
    <div className="relative w-full h-64 bg-gradient-to-b from-transparent to-muted/20 rounded-lg overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ background: 'transparent' }}
      />
      
      {/* Photon source indicator */}
      <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
        <div className="flex items-center gap-2 px-3 py-1 bg-primary/20 rounded-full border border-primary/30">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          <span className="text-xs text-primary font-medium">Photon Source</span>
        </div>
      </div>

      {/* Wavelength legend */}
      <div className="absolute top-2 right-2 space-y-1">
        <div className="text-xs text-muted-foreground">Wavelengths:</div>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-full" style={{ background: wavelengthToRGB(400) }}></div>
          <div className="w-3 h-3 rounded-full" style={{ background: wavelengthToRGB(550) }}></div>
          <div className="w-3 h-3 rounded-full" style={{ background: wavelengthToRGB(700) }}></div>
        </div>
        <div className="text-xs text-muted-foreground">
          <div>400nm</div>
          <div>550nm</div>
          <div>700nm</div>
        </div>
      </div>
    </div>
  )
}
