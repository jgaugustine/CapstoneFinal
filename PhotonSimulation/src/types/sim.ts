export type SimPhase = 'idle' | 'exposing' | 'readout' | 'done';

export interface Photon {
  id: number;
  x: number;
  y: number;
  collected: boolean;
  isElectron: boolean;
  bounced: boolean;
  bounceVelocity?: { vx: number; vy: number };
  impactTime?: number;
  trailPoints?: { x: number; y: number; opacity: number }[];
}

export interface Electron {
  id: number;
  x: number;
  y: number;
  inWell: boolean;
  targetX?: number;
  targetY?: number;
  progress?: number;
}

export interface SimulationState {
  phase: SimPhase;
  photons: Photon[];
  electrons: Electron[];
  chargeAccumulated: number;
  electronsGenerated: number;
  photonsAbsorbed: number;
  isRunning: boolean;
  timeElapsed: number;
  digitalValue: number;
  isOverflow: boolean;
  photonArrivals: number[];
  electronArrivals: number[];
  currentTimeWindow: number;
  mode: 'manual' | 'preset';
  performanceMode: boolean;
  theoreticalLambda: number | null;
  theoreticalDistribution: number[];
  sensorHeatMap: { x: number; y: number; intensity: number; timestamp: number }[];
  realTimeEfficiency: number;
}


