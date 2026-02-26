import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { poissonProbability } from '@/lib/sim';

interface Props {
  exposureSeconds: number;
  photonFlux: number; // photons/sec
  quantumEfficiencyPct: number; // 0-100
  timeElapsed: number;
  revealedPhotons: number[]; // length 200
  revealedElectrons: number[]; // length 200
}

const DistributionPanel: React.FC<Props> = ({
  exposureSeconds,
  photonFlux,
  quantumEfficiencyPct,
  timeElapsed,
  revealedPhotons,
  revealedElectrons,
}) => {
  const windowDuration = exposureSeconds / 200;
  const lambdaPhotons = Math.max(0.1, photonFlux * windowDuration);
  const qe = Math.min(1, Math.max(0, quantumEfficiencyPct / 100));
  const lambdaElectrons = Math.max(0.1, lambdaPhotons * qe);

  function buildHistogram(revealed: number[], lambda: number) {
    const currentTimeWindow = Math.min(199, Math.floor((timeElapsed / exposureSeconds) * 200));
    // Include zeros; filtering them out biases the distribution
    const samples = revealed.slice(0, Math.min(currentTimeWindow + 1, 200));
    const sqrtLambda = Math.sqrt(lambda);
    const displayMin = Math.max(0, Math.floor(lambda - 5 * sqrtLambda));
    const displayMax = Math.ceil(lambda + 5 * sqrtLambda);
    const bins = [] as number[];
    for (let i = displayMin; i <= Math.max(displayMax, lambda < 1 ? Math.max(5, displayMax) : displayMax); i++) bins.push(i);
    const empiricalCounts = new Array(bins.length).fill(0);
    const totalSamples = Math.max(1, samples.length);
    samples.forEach((count) => {
      const idx = Math.max(0, Math.min(bins.length - 1, count - bins[0]));
      empiricalCounts[idx]++;
    });
    return bins.map((bin, index) => ({
      photons: bin,
      empirical: empiricalCounts[index] / totalSamples,
      theoretical: poissonProbability(bin, lambda),
    }));
  }

  const photonsData = useMemo(() => buildHistogram(revealedPhotons, lambdaPhotons), [revealedPhotons, lambdaPhotons, timeElapsed]);
  const electronsData = useMemo(() => buildHistogram(revealedElectrons, lambdaElectrons), [revealedElectrons, lambdaElectrons, timeElapsed]);

  function Chart({ data, title, lambda }: { data: any[]; title: string; lambda: number }) {
    if (!data || data.length === 0) {
      return (
        <div className="h-80 flex items-center justify-center text-muted-foreground text-sm border rounded">
          Start simulation to see distribution
        </div>
      );
    }
    // Guard against misleading bars with very few samples collected
    // Estimate samples by summing empirical mass (roughly equals 1 when enough windows accumulated)
    const empiricalMass = data.reduce((acc, d) => acc + (d.empirical || 0), 0);
    const enoughSamples = empiricalMass > 0.5; // heuristic ~ at least ~50 windows
    const minPhotons = Math.min(...data.map((d) => d.photons));
    const maxTheoreticalProb = Math.max(...data.map((d) => d.theoretical));
    const maxEmpiricalProb = enoughSamples && data.some((d) => d.empirical > 0)
      ? Math.max(...data.filter((d) => d.empirical > 0).map((d) => d.empirical))
      : maxTheoreticalProb;
    const maxProb = Math.max(maxTheoreticalProb, maxEmpiricalProb);
    const photonRange = data[data.length - 1].photons - minPhotons;
    const xTickInterval = Math.max(1, Math.ceil(photonRange / 8));
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-muted-foreground space-y-1">
            <div>Expected λ = {lambda.toFixed(2)} per window</div>
            <div>
              Data bins: {data.length} (range: {data[0]?.photons} - {data[data.length - 1]?.photons})
            </div>
          </div>
        </div>
        <div className="relative h-80 bg-card border rounded overflow-hidden">
          <div className="absolute left-8 top-1/2 transform -translate-y-1/2 -rotate-90 text-xs text-muted-foreground z-10">
            Probability
          </div>
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground z-10">
            Count per window
          </div>
          <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
            {(() => {
              const yTop = 10;
              const yBottom = 85;
              const height = yBottom - yTop;
              const yTicks = 5;
              const xLeft = 20;
              const xRight = 90;
              return (
                <>
                  {Array.from({ length: yTicks + 1 }, (_, i) => {
                    const y = yTop + (height * i) / yTicks;
                    const probValue = maxProb - (maxProb * i) / yTicks;
                    return (
                      <g key={`grid-${i}`}>
                        <line x1={xLeft} y1={y} x2={xRight} y2={y} stroke="hsl(var(--border))" strokeWidth="0.1" opacity="0.3" />
                        <line x1={xLeft - 2} y1={y} x2={xLeft} y2={y} stroke="hsl(var(--muted-foreground))" strokeWidth="0.2" />
                        <text x={xLeft - 4} y={y + 1} textAnchor="end" fontSize="2.5" fill="hsl(var(--muted-foreground))">
                          {probValue.toFixed(4)}
                        </text>
                      </g>
                    );
                  })}
                  {data.map((d, i) => {
                    if ((d.photons - minPhotons) % xTickInterval !== 0) return null;
                    const x = xLeft + (70 * i) / (data.length - 1);
                    return (
                      <g key={`xlabel-${i}`}>
                        <line x1={x} y1={yBottom} x2={x} y2={yBottom + 2} stroke="hsl(var(--muted-foreground))" strokeWidth="0.2" />
                        <text x={x} y={95} textAnchor="middle" fontSize="2.5" fill="hsl(var(--muted-foreground))">
                          {d.photons}
                        </text>
                      </g>
                    );
                  })}
                  {data.map((d, i) => {
                    if (d.empirical <= 0) return null;
                    const barHeight = (d.empirical / maxProb) * height;
                    const x = xLeft + (70 * i) / (data.length - 1);
                    const y = yBottom - barHeight;
                    const barWidth = Math.max(0.8, (70 / data.length) * 0.8);
                    return (
                      <rect
                        key={`bar-${i}`}
                        x={x - barWidth / 2}
                        y={y}
                        width={barWidth}
                        height={Math.max(0, barHeight)}
                        fill="hsl(var(--primary))"
                        fillOpacity={0.35}
                        stroke="hsl(var(--primary))"
                        strokeWidth="0.3"
                        rx="0.2"
                      />
                    );
                  })}
                  <path
                    d={data
                      .map((d, i) => {
                        const x = xLeft + (70 * i) / (data.length - 1);
                        const y = yBottom - (d.theoretical / maxProb) * height;
                        return `${i === 0 ? 'M' : 'L'} ${x} ${Math.max(yTop, y)}`;
                      })
                      .join(' ')}
                    fill="none"
                    stroke="hsl(var(--destructive))"
                    strokeWidth="1.2"
                    opacity="0.9"
                  />
                  <line x1={xLeft} y1={yTop} x2={xLeft} y2={yBottom} stroke="hsl(var(--muted-foreground))" strokeWidth="0.3" />
                  <line x1={xLeft} y1={yBottom} x2={xRight} y2={yBottom} stroke="hsl(var(--muted-foreground))" strokeWidth="0.3" />
                </>
              );
            })()}
          </svg>
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
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-primary">Distributions</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="photons">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="photons">Photons</TabsTrigger>
            <TabsTrigger value="electrons">Electrons</TabsTrigger>
          </TabsList>
          <TabsContent value="photons" className="mt-4">
            <Chart data={photonsData} title="Photons per window" lambda={lambdaPhotons} />
          </TabsContent>
          <TabsContent value="electrons" className="mt-4">
            <Chart data={electronsData} title="Electrons per window" lambda={lambdaElectrons} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DistributionPanel;


