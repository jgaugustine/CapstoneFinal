import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Pause, RefreshCw, Camera, Eye } from 'lucide-react';
import DistributionPanel from '@/components/DistributionPanel';
import { sampleBinomial } from '@/lib/sim';
import PhotonPanel from '@/components/pipeline/PhotonPanel';
import WellPanel from '@/components/pipeline/WellPanel';
import ADCPanel from '@/components/pipeline/ADCPanel';
import OutputPanel from '@/components/pipeline/OutputPanel';

interface Photon {
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

interface Electron {
  id: number;
  x: number;
  y: number;
  inWell: boolean;
  targetX?: number;
  targetY?: number;
  progress?: number;
}

interface SimulationState {
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
  currentTimeWindow: number;
  mode: 'manual' | 'preset';
  performanceMode: boolean;
  theoreticalLambda: number | null;
  theoreticalDistribution: number[];
  sensorHeatMap: { x: number; y: number; intensity: number; timestamp: number }[];
  realTimeEfficiency: number;
}

const PhotonSimulator: React.FC = () => {
  const [photonFlux, setPhotonFlux] = useState([1000000]); // photons per second
  const [exposureTime, setExposureTime] = useState([2]); // seconds
  const [wellCapacity, setWellCapacity] = useState([10000]); // electrons
  const [bitDepth, setBitDepth] = useState([8]); // bits
  const [quantumEfficiency, setQuantumEfficiency] = useState([80]); // percentage
  const [brightness, setBrightness] = useState([50]); // preset brightness 0-100
  
  const [simulation, setSimulation] = useState<SimulationState>({
    photons: [],
    electrons: [],
    chargeAccumulated: 0,
    electronsGenerated: 0,
    photonsAbsorbed: 0,
    isRunning: false,
    timeElapsed: 0,
    digitalValue: 0,
    isOverflow: false,
    photonArrivals: new Array(200).fill(0), // This will hold pre-generated samples
    currentTimeWindow: 0,
    mode: 'manual',
    performanceMode: false,
    theoreticalLambda: null,
    theoreticalDistribution: [],
    sensorHeatMap: [],
    realTimeEfficiency: 0,
  });

  // Store pre-generated samples (seeded)
  const [preGeneratedPhotons, setPreGeneratedPhotons] = useState<number[]>([]);
  const [preGeneratedElectrons, setPreGeneratedElectrons] = useState<number[]>([]);
  const [revealedPhotons, setRevealedPhotons] = useState<number[]>(new Array(200).fill(0));
  const [revealedElectrons, setRevealedElectrons] = useState<number[]>(new Array(200).fill(0));
  const [seed, setSeed] = useState([0]);
  const [speedMs, setSpeedMs] = useState([100]);
  // Advanced realism
  const [darkCurrent, setDarkCurrent] = useState([0]); // electrons per second
  const [readNoiseElectrons, setReadNoiseElectrons] = useState([0]); // e- std dev
  const [shutterModel, setShutterModel] = useState<'global' | 'rolling'>('global');

  // Preset configurations based on brightness
  const presetConfigs = useMemo(() => {
    const brightnessValue = brightness[0];
    if (brightnessValue <= 10) {
      return { flux: 200000, exposure: 4, description: 'Starlight' };
    } else if (brightnessValue <= 25) {
      return { flux: 800000, exposure: 2, description: 'Moonlight' };
    } else if (brightnessValue <= 50) {
      return { flux: 2000000, exposure: 1, description: 'Indoor Lighting' };
    } else if (brightnessValue <= 75) {
      return { flux: 5000000, exposure: 0.5, description: 'Overcast Day' };
    } else {
      return { flux: 8000000, exposure: 0.2, description: 'Bright Sunlight' };
    }
  }, [brightness]);

  const currentFlux = simulation.mode === 'preset' ? presetConfigs.flux : photonFlux[0];
  const currentExposure = simulation.mode === 'preset' ? presetConfigs.exposure : exposureTime[0];

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const photonIdRef = useRef(0);

  const maxDigitalValue = Math.pow(2, bitDepth[0]) - 1;

  // Function to generate Poisson random number
  const generatePoissonSample = (lambda: number): number => {
    if (lambda === 0) return 0;
    
    // For large lambda, use normal approximation
    if (lambda > 30) {
      const normal = Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random());
      return Math.max(0, Math.round(lambda + Math.sqrt(lambda) * normal));
    }
    
    // Knuth's algorithm for small lambda
    const limit = Math.exp(-lambda);
    let k = 0;
    let p = Math.random();
    
    while (p > limit) {
      k++;
      p *= Math.random();
    }
    
    return k;
  };

  // Seeded PRNG (mulberry32-like)
  const prng = useCallback((s: number) => {
    let t = (s || 1) >>> 0;
    return () => {
      t += 0x6D2B79F5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }, []);

  // Pre-generate photons and electrons per window with a seed
  const generateSeededSamples = useCallback(() => {
    const windowDuration = currentExposure / 200;
    const lambda = Math.max(0, currentFlux * windowDuration);
    const qe = Math.min(1, Math.max(0, quantumEfficiency[0] / 100));
    const rnd = prng(seed[0] || 1);
    const photons: number[] = [];
    const electrons: number[] = [];
    for (let i = 0; i < 200; i++) {
      // Knuth with seeded RNG
      const limit = Math.exp(-lambda);
      let k = 0;
      let p = 1;
      while (p > limit) {
        k++;
        p *= rnd();
      }
      const nPhotons = Math.max(0, k - 1);
      photons.push(nPhotons);
      // Binomial with seeded RNG (normal approx for large n)
      let nElectrons = 0;
      if (nPhotons > 50) {
        const mean = nPhotons * qe;
        const variance = nPhotons * qe * (1 - qe);
        const u = rnd();
        const v = rnd();
        const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
        nElectrons = Math.max(0, Math.min(nPhotons, Math.round(mean + Math.sqrt(Math.max(variance, 0)) * z)));
      } else {
        for (let j = 0; j < nPhotons; j++) if (rnd() < qe) nElectrons++;
      }
      electrons.push(nElectrons);
    }
    return { photons, electrons };
  }, [currentExposure, currentFlux, quantumEfficiency, prng, seed]);

  // Enhanced photon animation based on pre-generated samples
  const animatePhotonsForTimeWindow = useCallback((timeWindow: number, sampleCount: number, electronsForWindow?: number) => {
    if (timeWindow >= 200 || sampleCount === 0) return;

    // Smart scaling based on flux rate for visual representation
    const isHighFlux = currentFlux > 3000000;
    const isMediumFlux = currentFlux > 1000000;
    const maxVisualPhotons = isHighFlux ? 10 : isMediumFlux ? 20 : 30;
    
    // Create visual photons proportional to sample count but limited for performance
    const visualPhotonsCount = Math.min(maxVisualPhotons, Math.ceil(sampleCount / 5));
    
    // Use pre-generated electrons when available, otherwise sample
    const qe = Math.min(1, Math.max(0, quantumEfficiency[0] / 100));
    let electronsToGenerate = typeof electronsForWindow === 'number' ? electronsForWindow : sampleBinomial(sampleCount, qe);
    const photonsAbsorbedCount = sampleCount - electronsToGenerate;
    
    // Update simulation state with sampled data
    setSimulation(prev => {
      const newCharge = Math.min(prev.chargeAccumulated + electronsToGenerate, wellCapacity[0]);
      const isOverflow = newCharge >= wellCapacity[0];
      
      // Create visual photons for animation
      const newPhotons = [];
      for (let i = 0; i < visualPhotonsCount; i++) {
        const newPhoton: Photon = {
          id: photonIdRef.current++,
          x: -20, // Start from left
          y: Math.random() * 70 + 15, // Random vertical position
          collected: false,
          isElectron: false,
          bounced: false,
          trailPoints: [],
        };
        newPhotons.push(newPhoton);
      }

      // Update real-time efficiency using cumulative totals including this window
      const cumPhotons = prev.electronsGenerated + prev.photonsAbsorbed + sampleCount;
      const cumElectrons = prev.electronsGenerated + electronsToGenerate;
      const newEfficiency = cumPhotons > 0 ? (cumElectrons / cumPhotons) * 100 : 0;
      
      return {
        ...prev,
        photons: [...prev.photons, ...newPhotons],
        currentTimeWindow: timeWindow,
        chargeAccumulated: newCharge,
        electronsGenerated: prev.electronsGenerated + electronsToGenerate,
        photonsAbsorbed: prev.photonsAbsorbed + photonsAbsorbedCount,
        isOverflow: isOverflow,
        realTimeEfficiency: newEfficiency,
      };
    });

    // Animate visual photons with reduced complexity
    const animationDuration = isHighFlux ? 150 : isMediumFlux ? 200 : 300;
    
    setTimeout(() => {
      setSimulation(prev => {
        const currentTime = Date.now();
        const newHeatMapPoints: { x: number; y: number; intensity: number; timestamp: number }[] = [];
        
        const updatedPhotons = prev.photons.map(p => {
          if (p.x === -20) { // New photons - move them right and determine interaction
            // For visual consistency, use QE probability for the particle effect
            const willConvert = Math.random() < qe;
            const impactY = p.y;
            const sensorX = 70; // Sensor position on the right
            
            // Add heat map point for impact
            newHeatMapPoints.push({
              x: sensorX,
              y: impactY,
              intensity: willConvert ? 1 : 0.3,
              timestamp: currentTime
            });
            
            if (willConvert) {
              // Successful conversion - create electron for transfer to section 2
              const newElectron = {
                id: Date.now() + Math.random(),
                x: sensorX,
                y: impactY,
                targetX: 95, // Target: right edge of section 1 (will continue to section 2)
                targetY: impactY, // Keep same vertical position
                inWell: false,
                progress: 0
              };
              
            // Add electron to simulation with target coordinates for transfer between sections
            setSimulation(current => ({
              ...current,
              electrons: [...current.electrons, newElectron]
            }));

            return { 
              ...p, 
              x: sensorX,
              collected: true, 
              isElectron: true, 
              bounced: false,
              impactTime: currentTime,
              trailPoints: [{ x: -20, y: p.y, opacity: 1 }, { x: sensorX, y: impactY, opacity: 0.8 }]
            };
            } else {
              // Bounce with realistic physics
              const bounceAngle = (Math.random() - 0.5) * Math.PI * 0.6;
              const bounceSpeed = 2 + Math.random() * 3;
              return { 
                ...p, 
                x: 65,
                y: impactY,
                collected: false, 
                isElectron: false, 
                bounced: true,
                impactTime: currentTime,
                bounceVelocity: {
                  vx: -Math.cos(bounceAngle) * bounceSpeed, // Bounce back left
                  vy: Math.sin(bounceAngle) * bounceSpeed
                },
                trailPoints: [{ x: -20, y: p.y, opacity: 1 }, { x: 65, y: impactY, opacity: 0.6 }]
              };
            }
          }
          return p;
        });
        
        // Clean old heat map points (older than 2 seconds)
        const filteredHeatMap = [...prev.sensorHeatMap, ...newHeatMapPoints]
          .filter(point => currentTime - point.timestamp < 2000);
        
        return { 
          ...prev, 
          photons: updatedPhotons,
          sensorHeatMap: filteredHeatMap
        };
      });

      // Scheduled cleanup of bounced photons after 0.25s
      setTimeout(() => {
        setSimulation(prev => ({
          ...prev,
          photons: prev.photons.filter(p => {
            if (p.bounced && p.impactTime) {
              return Date.now() - p.impactTime < 250;
            }
            return true;
          })
        }));
      }, 250);

      // Animate bounced photons
      const bounceAnimationTime = animationDuration * 2;
      setTimeout(() => {
        setSimulation(prev => ({
          ...prev,
          photons: prev.photons.map(p => {
            if (p.bounced && p.bounceVelocity) {
              const deltaTime = 0.1;
              const newX = Math.max(5, Math.min(95, p.x + p.bounceVelocity.vx * deltaTime));
              const newY = Math.max(-50, p.y + p.bounceVelocity.vy * deltaTime);
              
              // Update trail
              const newTrail = [...(p.trailPoints || []), { x: newX, y: newY, opacity: 0.4 }].slice(-3);
              
              return {
                ...p,
                x: newX,
                y: newY,
                bounceVelocity: {
                  vx: p.bounceVelocity.vx * 0.95, // Slight deceleration
                  vy: p.bounceVelocity.vy - 0.5 // Gravity effect
                },
                trailPoints: newTrail
              };
            }
            return p;
          })
        }));
      }, animationDuration);

      // Animate electron transfer to photosite
      setTimeout(() => {
        const transferDuration = 800; // 800ms transfer time
        const transferSteps = 20;
        let currentStep = 0;
        
        const electronTransferInterval = setInterval(() => {
          currentStep++;
          const progress = currentStep / transferSteps;
          
          setSimulation(prev => ({
            ...prev,
            electrons: prev.electrons.map(electron => {
              if (!electron.inWell && electron.targetX && electron.targetY) {
                const newProgress = Math.min(progress, 1);
                const isComplete = newProgress >= 1;
                
                return {
                  ...electron,
                  progress: newProgress,
                  inWell: isComplete
                };
              }
              return electron;
            })
          }));
          
          if (currentStep >= transferSteps) {
            clearInterval(electronTransferInterval);
          }
        }, transferDuration / transferSteps);
      }, animationDuration + 100);

      // Final cleanup - remove old photons
      setTimeout(() => {
        setSimulation(prev => ({
          ...prev,
          photons: prev.photons.filter(p => {
            if (p.bounced) {
              return p.y > -100; // Remove bounced photons that have gone too far
            }
            return p.y === -20; // Keep only new incoming photons
          }).slice(-maxVisualPhotons),
        }));
      }, bounceAnimationTime);
    }, animationDuration);
  }, [simulation.timeElapsed, currentExposure, currentFlux, wellCapacity, quantumEfficiency, simulation.photons.length]);

  // Run simulation with performance monitoring
  useEffect(() => {
    // Auto-enable performance mode for high flux
    const shouldUsePerformanceMode = currentFlux > 5000000;
    if (shouldUsePerformanceMode !== simulation.performanceMode) {
      setSimulation(prev => ({ ...prev, performanceMode: shouldUsePerformanceMode }));
    }

    if (simulation.isRunning && simulation.timeElapsed < currentExposure) {
      const intervalTime = simulation.performanceMode ? 50 : Math.max(20, speedMs[0]);
      
      intervalRef.current = setInterval(() => {
        setSimulation(prev => {
          const newTimeElapsed = prev.timeElapsed + (intervalTime / 1000);
          // Scale time into 200 windows across the current exposure
          const currentTimeWindow = Math.min(199, Math.floor((newTimeElapsed / currentExposure) * 200));
          
          // Check if we've moved to a new time window
          if (currentTimeWindow < 200 && currentTimeWindow !== prev.currentTimeWindow && currentTimeWindow < preGeneratedPhotons.length) {
            const sampleCount = preGeneratedPhotons[currentTimeWindow];
            const electronsCount = preGeneratedElectrons[currentTimeWindow] ?? 0;
            
            // Update revealed samples array
            const newRevealedPhotons = [...revealedPhotons];
            newRevealedPhotons[currentTimeWindow] = sampleCount;
            setRevealedPhotons(newRevealedPhotons);
            const newRevealedElectrons = [...revealedElectrons];
            newRevealedElectrons[currentTimeWindow] = electronsCount;
            setRevealedElectrons(newRevealedElectrons);
            
            // Update photonArrivals in simulation state
            const newPhotonArrivals = [...prev.photonArrivals];
            newPhotonArrivals[currentTimeWindow] = sampleCount;
            
            // Trigger animation for this time window's sample
            setTimeout(() => animatePhotonsForTimeWindow(currentTimeWindow, sampleCount, electronsCount), 0);
            
            return {
              ...prev,
              timeElapsed: newTimeElapsed,
              currentTimeWindow: currentTimeWindow,
              photonArrivals: newPhotonArrivals
            };
          }
          
          return {
            ...prev,
            timeElapsed: newTimeElapsed,
          };
        });
      }, intervalTime);
    } else if (simulation.timeElapsed >= currentExposure && simulation.isRunning) {
      // Convert to digital value with dark current and read noise in electrons domain
      const electronsFromDarkCurrent = Math.max(0, darkCurrent[0]) * currentExposure;
      const electronsNoisy = (() => {
        const base = Math.min(wellCapacity[0], simulation.chargeAccumulated + electronsFromDarkCurrent);
        const sigma = Math.max(0, readNoiseElectrons[0]);
        if (sigma <= 0) return base;
        const u = Math.random();
        const v = Math.random();
        const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
        return Math.min(wellCapacity[0], Math.max(0, base + z * sigma));
      })();
      const analogValue = electronsNoisy / wellCapacity[0];
      const quantizedValue = Math.round(analogValue * maxDigitalValue);
      
      setSimulation(prev => ({
        ...prev,
        digitalValue: Math.min(quantizedValue, maxDigitalValue),
        isRunning: false,
      }));
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [simulation.isRunning, simulation.timeElapsed, currentExposure, animatePhotonsForTimeWindow, maxDigitalValue, wellCapacity, simulation.chargeAccumulated, currentFlux, simulation.performanceMode, simulation.currentTimeWindow, preGeneratedPhotons, preGeneratedElectrons, revealedPhotons, revealedElectrons, speedMs, darkCurrent, readNoiseElectrons]);

  const startSimulation = () => {
    // Pre-generate photons/electrons using seed
    const { photons, electrons } = generateSeededSamples();
    setPreGeneratedPhotons(photons);
    setPreGeneratedElectrons(electrons);
    setRevealedPhotons(new Array(200).fill(0));
    setRevealedElectrons(new Array(200).fill(0));
    
    setSimulation(prev => ({ 
      ...prev, 
      isRunning: true,
      timeElapsed: 0, // Reset time elapsed when starting
      photonArrivals: new Array(200).fill(0), // Start with empty arrivals, will fill progressively
      currentTimeWindow: -1, // Start at -1 so time window 0 is detected as a change
      chargeAccumulated: 0, // Reset accumulated charge
      electronsGenerated: 0, // Reset electron count
      photonsAbsorbed: 0, // Reset photon count
      digitalValue: 0, // Reset digital value
      isOverflow: false, // Reset overflow flag
      photons: [], // Clear visual photons
      electrons: [], // Clear visual electrons
      sensorHeatMap: [], // Clear heat map
      realTimeEfficiency: 0, // Reset efficiency
    }));
  };

  const pauseSimulation = () => {
    setSimulation(prev => ({ ...prev, isRunning: false }));
  };

  const resetSimulation = () => {
    setSimulation(prev => ({
      photons: [],
      electrons: [],
      chargeAccumulated: 0,
      electronsGenerated: 0,
      photonsAbsorbed: 0,
      isRunning: false,
      timeElapsed: 0,
      digitalValue: 0,
      isOverflow: false,
      photonArrivals: new Array(200).fill(0),
      currentTimeWindow: 0,
      mode: prev.mode,
      performanceMode: prev.performanceMode,
      theoreticalLambda: null,
      theoreticalDistribution: [],
      sensorHeatMap: [],
      realTimeEfficiency: 0,
    }));
    setPreGeneratedPhotons([]);
    setPreGeneratedElectrons([]);
    setRevealedPhotons(new Array(200).fill(0));
    setRevealedElectrons(new Array(200).fill(0));
    photonIdRef.current = 0;
  };

  const fillPercentage = (simulation.chargeAccumulated / wellCapacity[0]) * 100;
  const isExposureComplete = simulation.timeElapsed >= currentExposure;

  // Using DistributionPanel instead of inline histogram

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Photon to Digital Converter
          </h1>
          <p className="text-lg text-muted-foreground">
            Simulate how camera sensors convert light into digital values
          </p>
        </header>
        {/* Explanation: How photons become numbers */}
        <Card className="mb-6">
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
            <div>
              <div className="font-semibold text-foreground mb-1">1) Photons arrive (Poisson)</div>
              <div>
                Light is random. We model incident photons per small time window with a Poisson
                distribution whose mean λ = flux × window duration.
              </div>
            </div>
            <div>
              <div className="font-semibold text-foreground mb-1">2) Quantum efficiency (Binomial)</div>
              <div>
                Each photon independently has a QE% chance to create an electron. This is a binomial
                process applied to the photons in that window.
              </div>
            </div>
            <div>
              <div className="font-semibold text-foreground mb-1">3) Charge integrates in the well</div>
              <div>
                Electrons accumulate in the pixel’s potential well until exposure ends or capacity
                is reached. Overflow means clipping.
              </div>
            </div>
            <div>
              <div className="font-semibold text-foreground mb-1">4) ADC quantizes to DN</div>
              <div>
                The analog charge is mapped to a {maxDigitalValue}-level digital number (DN) based
                on bit depth: more bits → finer steps and higher dynamic range.
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Top row - Controls and Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls Panel */}
          <Card className="lg:col-span-1 xl:col-span-1">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Simulation Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs 
                value={simulation.mode} 
                onValueChange={(value) => setSimulation(prev => ({ ...prev, mode: value as 'manual' | 'preset' }))}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="manual" className="flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    Manual
                  </TabsTrigger>
                  <TabsTrigger value="preset" className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Brightness
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="manual" className="space-y-6 mt-6">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Photon Flux: {(photonFlux[0] / 1000000).toFixed(1)}M photons/sec
                    </label>
                    <Slider
                      value={photonFlux}
                      onValueChange={setPhotonFlux}
                      min={100000}
                      max={10000000}
                      step={100000}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Exposure Time: {exposureTime[0]}s
                    </label>
                    <Slider
                      value={exposureTime}
                      onValueChange={setExposureTime}
                      min={0.5}
                      max={5}
                      step={0.5}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Well Capacity: {wellCapacity[0]} electrons
                    </label>
                    <Slider
                      value={wellCapacity}
                      onValueChange={setWellCapacity}
                      min={1000}
                      max={100000}
                      step={1000}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Bit Depth: {bitDepth[0]} bits (0-{maxDigitalValue})
                    </label>
                    <Slider
                      value={bitDepth}
                      onValueChange={setBitDepth}
                      min={4}
                      max={16}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Quantum Efficiency: {quantumEfficiency[0]}%
                    </label>
                    <Slider
                      value={quantumEfficiency}
                      onValueChange={setQuantumEfficiency}
                      min={10}
                      max={95}
                      step={5}
                      className="w-full"
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="preset" className="space-y-6 mt-6">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Scene Brightness: {brightness[0]}% ({presetConfigs.description})
                    </label>
                    <Slider
                      value={brightness}
                      onValueChange={setBrightness}
                      min={5}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="bg-card border rounded-lg p-4 space-y-2">
                    <h4 className="text-sm font-medium text-foreground">Auto Settings:</h4>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Photon Flux: {(presetConfigs.flux / 1000000).toFixed(1)}M/sec</div>
                      <div>Exposure: {presetConfigs.exposure}s</div>
                      <div>Quantum Efficiency: {quantumEfficiency[0]}%</div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Quantum Efficiency: {quantumEfficiency[0]}%
                    </label>
                    <Slider
                      value={quantumEfficiency}
                      onValueChange={setQuantumEfficiency}
                      min={10}
                      max={95}
                      step={5}
                      className="w-full"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-2">
                <Button
                  onClick={simulation.isRunning ? pauseSimulation : startSimulation}
                  disabled={isExposureComplete}
                  variant="default"
                  className="flex-1"
                >
                  {simulation.isRunning ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Start
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    if (simulation.isRunning) return;
                    setSimulation(prev => {
                      const nextWindow = Math.min(199, prev.currentTimeWindow + 1);
                      const sampleCount = preGeneratedPhotons[nextWindow] ?? 0;
                      const electronsCount = preGeneratedElectrons[nextWindow] ?? 0;
                      const newRevealedPhotons = [...revealedPhotons];
                      newRevealedPhotons[nextWindow] = sampleCount;
                      setRevealedPhotons(newRevealedPhotons);
                      const newRevealedElectrons = [...revealedElectrons];
                      newRevealedElectrons[nextWindow] = electronsCount;
                      setRevealedElectrons(newRevealedElectrons);
                      setTimeout(() => animatePhotonsForTimeWindow(nextWindow, sampleCount, electronsCount), 0);
                      return { ...prev, currentTimeWindow: nextWindow, timeElapsed: ((nextWindow + 1) / 200) * currentExposure };
                    });
                  }}
                  variant="outline"
                >
                  Step
                </Button>
                <Button onClick={resetSimulation} variant="outline">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-4 pt-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Seed: {seed[0]}</label>
                  <Slider value={seed} onValueChange={setSeed} min={0} max={100000} step={1} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Speed: {Math.max(20, speedMs[0])} ms step</label>
                  <Slider value={speedMs} onValueChange={setSpeedMs} min={20} max={400} step={10} />
                </div>
              </div>

              <div className="text-sm text-muted-foreground space-y-1">
                <div>Time: {simulation.timeElapsed.toFixed(1)}s / {currentExposure}s</div>
                {simulation.performanceMode && (
                  <Badge variant="outline" className="text-xs">
                    Performance Mode Active
                  </Badge>
                )}
              </div>

              {/* Perception Mapping */}
              <div className="pt-4 border-t space-y-3">
                <div className="text-sm font-medium text-foreground">Perception Mapping</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-xs">
                    <div className="text-muted-foreground">What our eyes register</div>
                    <div className="font-medium">
                      {currentFlux < 5e5 ? 'Starlight / Very dark' : currentFlux < 2e6 ? 'Moonlight / Dim' : currentFlux < 4e6 ? 'Dim Indoors' : currentFlux < 7e6 ? 'Office Lighting' : currentFlux < 1e7 ? 'Overcast Daylight' : 'Bright Daylight'}
                    </div>
                  </div>
                  <div className="text-xs">
                    <div className="text-muted-foreground">What the camera sees</div>
                    <div className="flex items-center gap-2">
                      {(() => {
                        if (!simulation.isRunning && simulation.timeElapsed === 0) {
                          return <span className="text-muted-foreground">Run simulation to preview</span>;
                        }
                        const expectedElectrons = currentFlux * currentExposure * (quantumEfficiency[0] / 100);
                        const fraction = Math.min(expectedElectrons / wellCapacity[0], 1);
                        const gray = Math.round(fraction * 255);
                        const label = fraction < 0.1 ? 'Very dark' : fraction < 0.3 ? 'Dim' : fraction < 0.7 ? 'Mid' : fraction < 0.95 ? 'Bright' : 'Clipped / Saturated';
                        return (
                          <>
                            <div
                              className="w-5 h-5 border border-border rounded"
                              style={{ backgroundColor: `rgb(${gray}, ${gray}, ${gray})` }}
                              aria-label={`Expected pixel brightness: ${label}`}
                            />
                            <span className="font-medium">{label}</span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Advanced realism controls */}
              <div className="pt-4 border-t space-y-6">
                <div className="text-sm font-medium text-foreground">Advanced</div>
                <div className="text-xs text-muted-foreground">Shutter Model: 
                  <span className="ml-1 font-medium text-foreground">{shutterModel === 'global' ? 'Global' : 'Rolling'}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={shutterModel === 'global' ? 'default' : 'outline'}
                    onClick={() => setShutterModel('global')}
                  >
                    Global
                  </Button>
                  <Button
                    variant={shutterModel === 'rolling' ? 'default' : 'outline'}
                    onClick={() => setShutterModel('rolling')}
                  >
                    Rolling
                  </Button>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Dark Current: {darkCurrent[0].toFixed(2)} e⁻/s
                  </label>
                  <Slider
                    value={darkCurrent}
                    onValueChange={setDarkCurrent}
                    min={0}
                    max={5}
                    step={0.05}
                    className="w-full"
                  />
                  </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Read Noise: {readNoiseElectrons[0].toFixed(1)} e⁻ RMS
                  </label>
                  <Slider
                    value={readNoiseElectrons}
                    onValueChange={setReadNoiseElectrons}
                    min={0}
                    max={10}
                    step={0.5}
                    className="w-full"
                  />
                    </div>
              </div>
            </CardContent>
          </Card>

          <DistributionPanel
            exposureSeconds={currentExposure}
            photonFlux={currentFlux}
            quantumEfficiencyPct={quantumEfficiency[0]}
            timeElapsed={simulation.timeElapsed}
            revealedPhotons={revealedPhotons}
            revealedElectrons={revealedElectrons}
          />
         </div>

         {/* Bottom row - Sensor Process Flow */}
         <div className="w-full">
           <Card>
             <CardHeader>
               <CardTitle className="text-primary">Sensor Process Flow</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-96">
                 {/* Photon Input with Quantum Efficiency */}
               <PhotonPanel
                 timeElapsed={simulation.timeElapsed}
                 currentExposure={currentExposure}
                 quantumEfficiencyPct={quantumEfficiency[0]}
                 simulation={{
                   photons: simulation.photons,
                   electrons: simulation.electrons,
                   electronsGenerated: simulation.electronsGenerated,
                   photonsAbsorbed: simulation.photonsAbsorbed,
                   sensorHeatMap: simulation.sensorHeatMap,
                   realTimeEfficiency: simulation.realTimeEfficiency,
                 }}
               />

                {/* Photosite Well */}
                <WellPanel
                  fillPercentage={fillPercentage}
                  isOverflow={simulation.isOverflow}
                  wellCapacity={wellCapacity[0]}
                  chargeAccumulated={simulation.chargeAccumulated}
                />

                {/* ADC Process */}
                <ADCPanel
                  wellCapacity={wellCapacity[0]}
                  maxDigitalValue={maxDigitalValue}
                  chargeAccumulated={simulation.chargeAccumulated}
                  isRunning={simulation.isRunning}
                />

                {/* Digital Output */}
                <OutputPanel
                  isExposureComplete={isExposureComplete}
                  digitalValue={simulation.digitalValue}
                  bitDepth={bitDepth[0]}
                  maxDigitalValue={maxDigitalValue}
                />
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    </div>
  );
};

export default PhotonSimulator;
