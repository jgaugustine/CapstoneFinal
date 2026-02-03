import { AEPriorities, AETrace, WeightMap } from '@/types';
import { computeWeightedLuminance, computeClipping, computeWeightedHistogram, computePercentiles } from '@/metering/stats';
import { ImageRGBAFloat } from '@/types';

export function runLexiAE(
  image: ImageRGBAFloat,
  weights: WeightMap,
  priorities: AEPriorities,
  evRange: { min: number; max: number; step: number } = { min: -6, max: 6, step: 0.1 }
): { chosenEV: number, trace: AETrace } {
  // Compute base luminance
  const baseLuminance = computeWeightedLuminance(image, weights);
  
  // Generate candidate EVs
  const candidates: AETrace['candidates'] = [];
  const evValues: number[] = [];
  
  for (let ev = evRange.min; ev <= evRange.max; ev += evRange.step) {
    evValues.push(ev);
    
    // Scale luminance: X(x) = 2^EV * S(x)
    const scale = Math.pow(2, ev);
    const scaledLuminance = new Float32Array(baseLuminance.length);
    for (let i = 0; i < baseLuminance.length; i++) {
      scaledLuminance[i] = baseLuminance[i] * scale;
    }
    
    // Compute clipping
    const { highlightClip, shadowClip } = computeClipping(scaledLuminance, weights, priorities.epsilonShadow);
    
    // Compute weighted median
    const { cdf, min, max } = computeWeightedHistogram(scaledLuminance, weights);
    const median = computePercentiles(cdf, [0.5], min, max)[0];
    const midtoneError = Math.pow(median - priorities.midtoneTarget, 2);
    
    candidates.push({
      ev,
      highlightClip,
      shadowClip,
      median,
      midtoneError,
    });
  }
  
  // Stage 1: Find feasible set where Ch(E) ≤ ηh
  let stage1Feasible = candidates.filter(c => c.highlightClip <= priorities.etaHighlight).map(c => c.ev);
  let relaxCountHighlight = 0;
  let relaxedEtaHighlight = priorities.etaHighlight;
  
  // Relax if no feasible solutions
  if (stage1Feasible.length === 0) {
    relaxedEtaHighlight = priorities.etaHighlight;
    while (stage1Feasible.length === 0 && relaxedEtaHighlight < 1.0) {
      relaxedEtaHighlight += 0.05;
      relaxCountHighlight++;
      stage1Feasible = candidates.filter(c => c.highlightClip <= relaxedEtaHighlight).map(c => c.ev);
    }
  }
  
  // Stage 2: From Stage 1 feasible, find where Cs(E) ≤ ηs
  let stage2Feasible = candidates
    .filter(c => stage1Feasible.includes(c.ev) && c.shadowClip <= priorities.etaShadow)
    .map(c => c.ev);
  let relaxCountShadow = 0;
  let relaxedEtaShadow = priorities.etaShadow;
  
  // Relax if no feasible solutions
  if (stage2Feasible.length === 0) {
    relaxedEtaShadow = priorities.etaShadow;
    while (stage2Feasible.length === 0 && relaxedEtaShadow < 1.0) {
      relaxedEtaShadow += 0.05;
      relaxCountShadow++;
      stage2Feasible = candidates
        .filter(c => stage1Feasible.includes(c.ev) && c.shadowClip <= relaxedEtaShadow)
        .map(c => c.ev);
    }
  }
  
  // Stage 3: From Stage 2 feasible, choose E minimizing (median(E) - m)²
  let chosenEV = evRange.min;
  let minError = Infinity;
  
  if (stage2Feasible.length > 0) {
    for (const candidate of candidates) {
      if (stage2Feasible.includes(candidate.ev) && candidate.midtoneError < minError) {
        minError = candidate.midtoneError;
        chosenEV = candidate.ev;
      }
    }
  } else if (stage1Feasible.length > 0) {
    // Fallback: use stage 1 feasible if stage 2 is empty
    for (const candidate of candidates) {
      if (stage1Feasible.includes(candidate.ev) && candidate.midtoneError < minError) {
        minError = candidate.midtoneError;
        chosenEV = candidate.ev;
      }
    }
  } else {
    // Fallback: use best overall
    for (const candidate of candidates) {
      if (candidate.midtoneError < minError) {
        minError = candidate.midtoneError;
        chosenEV = candidate.ev;
      }
    }
  }
  
  const trace: AETrace = {
    candidates,
    stage1Feasible,
    stage2Feasible,
    relaxCountHighlight,
    relaxCountShadow,
    chosenEV,
  };
  
  return { chosenEV, trace };
}
