// Stochastic helpers for the photon simulation

export function samplePoisson(lambda: number): number {
  if (lambda <= 0) return 0;
  if (lambda > 30) {
    // normal approximation
    const u = Math.random();
    const v = Math.random();
    const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    return Math.max(0, Math.round(lambda + Math.sqrt(lambda) * z));
  }
  const limit = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  while (p > limit) {
    k++;
    p *= Math.random();
  }
  return k - 1;
}

export function sampleBinomial(n: number, p: number): number {
  const prob = Math.min(1, Math.max(0, p));
  if (n <= 0 || prob <= 0) return 0;
  if (prob >= 1) return n;
  if (n > 50) {
    // normal approximation
    const mean = n * prob;
    const variance = n * prob * (1 - prob);
    const std = Math.sqrt(Math.max(variance, 0));
    const u = Math.random();
    const v = Math.random();
    const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    return Math.max(0, Math.min(n, Math.round(mean + std * z)));
  }
  let k = 0;
  for (let i = 0; i < n; i++) {
    if (Math.random() < prob) k++;
  }
  return k;
}

export function poissonProbability(k: number, lambda: number): number {
  if (lambda <= 0 || k < 0) return 0;
  if (k === 0) return Math.exp(-lambda);
  let logFactorial = 0;
  for (let i = 2; i <= k; i++) logFactorial += Math.log(i);
  const logProb = -lambda + k * Math.log(lambda) - logFactorial;
  return logProb > -50 ? Math.exp(logProb) : 0;
}


