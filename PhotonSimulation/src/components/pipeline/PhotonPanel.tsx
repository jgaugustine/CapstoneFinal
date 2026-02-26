import React from 'react';
import { Badge } from '@/components/ui/badge';

interface PhotonPanelProps {
  timeElapsed: number;
  currentExposure: number;
  quantumEfficiencyPct: number;
  simulation: {
    photons: any[];
    electrons: any[];
    electronsGenerated: number;
    photonsAbsorbed: number;
    sensorHeatMap: { x: number; y: number; intensity: number; timestamp: number }[];
    realTimeEfficiency: number;
  };
}

const PhotonPanel: React.FC<PhotonPanelProps> = ({ timeElapsed, currentExposure, quantumEfficiencyPct, simulation }) => {
  return (
    <div className="space-y-4 relative">
      <h3 className="text-lg font-semibold text-foreground">1. Photon Impact</h3>
      <div className="relative bg-card border-2 border-border rounded-lg h-40 overflow-hidden">
        <div className="absolute top-2 left-2 right-2 h-2 bg-primary/20 rounded">
          <div
            className="h-full bg-primary rounded transition-all duration-300"
            style={{ width: `${Math.min((timeElapsed / currentExposure) * 100, 100)}%` }}
          />
        </div>

        <div className="absolute top-4 right-4 bottom-4 w-20 border-2 border-primary rounded bg-gradient-to-r from-primary/10 to-primary/30 shadow-lg overflow-hidden">
          {simulation.sensorHeatMap.map((point, index) => {
            const age = Date.now() - point.timestamp;
            const opacity = Math.max(0, 1 - age / 2000) * point.intensity;
            return (
              <div
                key={index}
                className="absolute w-4 h-4 rounded-full pointer-events-none"
                style={{
                  left: `${point.x - 70}%`,
                  top: `${point.y}%`,
                  background:
                    point.intensity > 0.5
                      ? `radial-gradient(circle, rgba(59, 130, 246, ${opacity}) 0%, transparent 70%)`
                      : `radial-gradient(circle, rgba(239, 68, 68, ${opacity}) 0%, transparent 70%)`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            );
          })}

          <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-primary-foreground transform -rotate-90">
            Sensor Surface
          </div>
          <div className="absolute top-1 left-1 text-xs text-primary-foreground/70 transform -rotate-90 origin-left">
            QE: {quantumEfficiencyPct}%
          </div>
          <div className="absolute bottom-1 right-1 text-xs text-primary-foreground/90 bg-black/20 rounded px-1 transform -rotate-90 origin-right">
            Live QE: {simulation.realTimeEfficiency.toFixed(1)}%
          </div>
        </div>

        {simulation.photons.map((photon: any) => (
          <div key={photon.id}>
            {photon.trailPoints?.map((point: any, index: number) => (
              <div
                key={`trail-${photon.id}-${index}`}
                className="absolute w-1 h-1 rounded-full pointer-events-none"
                style={{
                  left: `${point.x}%`,
                  top: `${point.y}%`,
                  background: photon.bounced
                    ? `rgba(239, 68, 68, ${point.opacity * 0.4})`
                    : `rgba(59, 130, 246, ${point.opacity * 0.6})`,
                  transform: 'translate(-50%, -50%)',
                  transition: 'opacity 0.5s ease-out',
                }}
              />
            ))}

            <div
              className={`absolute rounded-full transition-all duration-500 ease-in-out ${
                photon.bounced ? 'w-2.5 h-2.5 bg-red-400' : photon.isElectron ? 'w-2 h-2 bg-blue-400' : 'w-2 h-2 bg-photon'
              }`}
              style={{
                left: `${photon.x}%`,
                top: `${photon.y}%`,
                boxShadow: photon.bounced
                  ? '0 0 12px rgba(239, 68, 68, 0.8), 0 0 20px rgba(239, 68, 68, 0.4)'
                  : photon.isElectron
                  ? '0 0 8px rgba(59, 130, 246, 0.8)'
                  : 'var(--gradient-glow)',
                transform: `translate(-50%, -50%) ${
                  photon.bounced ? 'scale(1.2) rotate(45deg)' : photon.collected ? 'scale(0.5)' : 'scale(1)'
                }`,
                opacity: photon.bounced ? 0.9 : 1,
                zIndex: photon.bounced ? 10 : 5,
              }}
            />

            {photon.impactTime && Date.now() - photon.impactTime < 1000 && (
              <div
                className="absolute rounded-full border pointer-events-none animate-ping"
                style={{
                  left: `${photon.x}%`,
                  top: `${photon.y}%`,
                  width: '20px',
                  height: '20px',
                  borderColor: photon.bounced ? 'rgba(239, 68, 68, 0.5)' : 'rgba(59, 130, 246, 0.5)',
                  transform: 'translate(-50%, -50%)',
                  animationDuration: '1s',
                }}
              />
            )}
          </div>
        ))}

        {simulation.electrons.map((electron: any) => {
          if (electron.inWell) return null;
          const progress = Math.min(electron.progress || 0, 1);
          const currentX = electron.x + (95 - electron.x) * progress;
          const currentY = electron.y;
          return (
            <div
              key={electron.id}
              className="absolute w-1.5 h-1.5 bg-blue-400 rounded-full transition-all duration-300 ease-in-out"
              style={{
                left: `${currentX}%`,
                top: `${currentY}%`,
                boxShadow: '0 0 6px rgba(59, 130, 246, 0.8)',
                opacity: 1 - progress * 0.3,
              }}
            />
          );
        })}
      </div>
      <div className="text-center space-y-1">
        <Badge variant="outline" className="text-photon border-photon">
          {simulation.photons.length} photons
        </Badge>
        <div className="text-xs text-muted-foreground">{simulation.electronsGenerated} electrons generated</div>
      </div>

      <div className="mt-2 bg-card border rounded-lg p-2 relative overflow-hidden">
        <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center justify-between">
          <span>Absorbed (No Conversion)</span>
          <span className="text-red-500 animate-pulse">●</span>
        </div>
        <div className="relative h-6 bg-secondary rounded overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-400/40 to-red-600/60 transition-all duration-300 flex items-center justify-center relative"
            style={{
              width: `${Math.min(
                100,
                (simulation.photonsAbsorbed / Math.max(1, simulation.electronsGenerated + simulation.photonsAbsorbed)) * 100
              )}%`,
            }}
          >
            <span className="text-xs text-red-900 font-bold relative z-10">{simulation.photonsAbsorbed}</span>
            {simulation.photonsAbsorbed > 0 && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-300/30 to-transparent animate-pulse" />
            )}
          </div>
        </div>
        <div className="text-xs text-muted-foreground mt-1 flex justify-between">
          <span>
            QE Loss:{' '}
            {(
              (simulation.photonsAbsorbed / Math.max(1, simulation.electronsGenerated + simulation.photonsAbsorbed)) * 100
            ).toFixed(1)}%
          </span>
          <span className="text-red-600 font-medium">
            {simulation.photonsAbsorbed > 0 ? '+' + Math.floor(simulation.photonsAbsorbed / 10) : '0'} bounced
          </span>
        </div>
      </div>
    </div>
  );
};

export default PhotonPanel;


