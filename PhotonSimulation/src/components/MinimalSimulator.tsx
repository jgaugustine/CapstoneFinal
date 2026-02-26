import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { poissonProbability, samplePoisson } from '@/lib/sim';

const MinimalSimulator: React.FC = () => {
  const [flux, setFlux] = useState([1_000_000]); // photons/sec
  const [exposure, setExposure] = useState([1]); // seconds
  const [qe, setQe] = useState([80]); // %
  const [well, setWell] = useState([10000]); // electrons
  const [bitDepth, setBitDepth] = useState([8]);
  const [runs, setRuns] = useState([0]);

  const [lastPhotons, setLastPhotons] = useState(0);
  const [lastElectrons, setLastElectrons] = useState(0);
  const [lastDn, setLastDn] = useState(0);
  const [hist, setHist] = useState<number[]>([]);

  const maxDn = Math.pow(2, bitDepth[0]) - 1;

  const lambdaPhotons = useMemo(() => Math.max(0, flux[0] * exposure[0]), [flux, exposure]);
  const lambdaElectrons = useMemo(() => lambdaPhotons * (qe[0] / 100), [lambdaPhotons, qe]);

  function runOnce() {
    // photons ~ Poisson(lambdaPhotons)
    const photons = samplePoisson(lambdaPhotons);
    // electrons ~ Binomial(photons, qe) ~ Poisson(lambdaElectrons) approximation if large
    const electrons = Math.min(well[0], samplePoisson(lambdaElectrons));
    const dn = Math.min(maxDn, Math.round((electrons / well[0]) * maxDn));
    setLastPhotons(photons);
    setLastElectrons(electrons);
    setLastDn(dn);
  }

  function runMany() {
    const n = Math.max(0, Math.floor(runs[0]));
    if (n <= 0) {
      setHist([]);
      return;
    }
    const counts: number[] = [];
    for (let i = 0; i < n; i++) {
      const e = Math.min(well[0], samplePoisson(lambdaElectrons));
      counts.push(e);
    }
    setHist(counts);
  }

  const electronsHistogram = useMemo(() => {
    if (hist.length === 0) return [] as { x: number; empirical: number; theoretical: number }[];
    const mean = lambdaElectrons;
    const std = Math.sqrt(Math.max(mean, 1e-9));
    const min = Math.max(0, Math.floor(mean - 5 * std));
    const max = Math.min(well[0], Math.ceil(mean + 5 * std));
    const bins: number[] = [];
    for (let k = min; k <= max; k++) bins.push(k);
    const counts = new Array(bins.length).fill(0);
    hist.forEach((e) => {
      const idx = Math.max(0, Math.min(bins.length - 1, e - min));
      counts[idx]++;
    });
    const total = Math.max(1, hist.length);
    return bins.map((k, i) => ({ x: k, empirical: counts[i] / total, theoretical: poissonProbability(k, mean) }));
  }, [hist, lambdaElectrons, well]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Minimal Photon → DN Simulator</h1>
          <p className="text-muted-foreground">One-shot, correct pipeline: photons → electrons → well → DN</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <label className="text-sm font-medium mb-2 block">Flux: {(flux[0] / 1_000_000).toFixed(2)} M photons/s</label>
                <Slider value={flux} onValueChange={setFlux} min={100_000} max={10_000_000} step={100_000} />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Exposure: {exposure[0]} s</label>
                <Slider value={exposure} onValueChange={setExposure} min={0.1} max={5} step={0.1} />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">QE: {qe[0]}%</label>
                <Slider value={qe} onValueChange={setQe} min={5} max={95} step={5} />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Well Capacity: {well[0]} e⁻</label>
                <Slider value={well} onValueChange={setWell} min={1000} max={100000} step={1000} />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Bit Depth: {bitDepth[0]} (0-{maxDn})</label>
                <Slider value={bitDepth} onValueChange={setBitDepth} min={4} max={16} step={1} />
              </div>
              <div className="flex gap-2">
                <Button onClick={runOnce} className="flex-1">Run</Button>
                <Button variant="outline" onClick={() => { setLastPhotons(0); setLastElectrons(0); setLastDn(0); setHist([]); }}>Reset</Button>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Runs for histogram: {runs[0]}</label>
                <Slider value={runs} onValueChange={setRuns} min={0} max={500} step={10} />
                <div className="mt-2"><Button variant="outline" onClick={runMany}>Run N</Button></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <div className="text-muted-foreground">Sampled photons</div>
                  <Badge variant="outline">{lastPhotons}</Badge>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground">Electrons</div>
                  <Badge variant="outline" className="text-charge border-charge">{lastElectrons}</Badge>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground">Well fill</div>
                  <div className="w-full h-2 bg-secondary rounded overflow-hidden">
                    <div className="h-full bg-charge" style={{ width: `${Math.min(100, (lastElectrons / Math.max(1, well[0])) * 100)}%` }} />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground">DN</div>
                  <Badge variant="outline" className="text-digital border-digital">{lastDn}</Badge>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                λp = flux×exposure = {lambdaPhotons.toFixed(2)}; λe = QE×λp = {lambdaElectrons.toFixed(2)}
              </div>

              <div className="mt-2">
                <div className="text-sm font-medium mb-1">Electrons per exposure (empirical vs theoretical)</div>
                <div className="relative h-64 bg-card border rounded overflow-hidden">
                  {electronsHistogram.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">Run N to build histogram</div>
                  ) : (
                    <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
                      {(() => {
                        const data = electronsHistogram;
                        const yTop = 10; const yBottom = 85; const height = yBottom - yTop;
                        const xLeft = 20; const xRight = 90;
                        const maxTheoretical = Math.max(...data.map(d => d.theoretical));
                        const maxEmpirical = Math.max(...data.map(d => d.empirical));
                        const maxY = Math.max(maxTheoretical, maxEmpirical, 1e-9);
                        const xTickEvery = Math.max(1, Math.ceil((data[data.length - 1].x - data[0].x) / 8));
                        return (
                          <>
                            {data.map((d, i) => {
                              const x = xLeft + (70 * i) / (data.length - 1);
                              if ((d.x - data[0].x) % xTickEvery === 0) {
                                return (
                                  <g key={`tick-${i}`}>
                                    <line x1={x} y1={85} x2={x} y2={87} stroke="hsl(var(--muted-foreground))" strokeWidth="0.2" />
                                    <text x={x} y={95} textAnchor="middle" fontSize="2.5" fill="hsl(var(--muted-foreground))">{d.x}</text>
                                  </g>
                                );
                              }
                              return null;
                            })}
                            {data.map((d, i) => {
                              if (d.empirical <= 0) return null;
                              const x = xLeft + (70 * i) / (data.length - 1);
                              const h = (d.empirical / maxY) * height;
                              return <rect key={`bar-${i}`} x={x - 1} y={yBottom - h} width={2} height={Math.max(0, h)} fill="hsl(var(--primary))" fillOpacity={0.35} />
                            })}
                            <path
                              d={data.map((d, i) => {
                                const x = xLeft + (70 * i) / (data.length - 1);
                                const y = yBottom - (d.theoretical / maxY) * height;
                                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                              }).join(' ')}
                              fill="none"
                              stroke="hsl(var(--destructive))"
                              strokeWidth="1.2"
                            />
                            <line x1={xLeft} y1={yTop} x2={xLeft} y2={yBottom} stroke="hsl(var(--muted-foreground))" strokeWidth="0.3" />
                            <line x1={xLeft} y1={yBottom} x2={xRight} y2={yBottom} stroke="hsl(var(--muted-foreground))" strokeWidth="0.3" />
                          </>
                        );
                      })()}
                    </svg>
                  )}
                </div>
                <div className="flex justify-between items-center text-xs mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-0.5 bg-destructive rounded-full" />
                    <span className="text-muted-foreground">Theoretical</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-primary/70 border border-primary rounded" />
                    <span className="text-muted-foreground">Observed</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MinimalSimulator;


