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
      stage: 'initial',
    });
  }
  
  // Stage 1: Find feasible set where Ch(E) ≤ ηh
  let stage1FeasibleCandidates = candidates.filter(c => c.highlightClip <= priorities.etaHighlight);
  let stage1Feasible = stage1FeasibleCandidates.map(c => c.ev);
  let relaxCountHighlight = 0;
  let relaxedEtaHighlight = priorities.etaHighlight;
  const relaxationStepsHighlight: AETrace['relaxationStepsHighlight'] = [];
  
  // Record initial highlight feasibility (even if empty)
  relaxationStepsHighlight.push({
    stepIndex: 0,
    maxHighlightClip: relaxedEtaHighlight,
    feasibleEVs: stage1Feasible,
  });

  // Relax if no feasible solutions
  if (stage1Feasible.length === 0) {
    while (stage1Feasible.length === 0 && relaxedEtaHighlight < 1.0) {
      relaxedEtaHighlight += 0.05;
      relaxCountHighlight++;
      stage1FeasibleCandidates = candidates.filter(c => c.highlightClip <= relaxedEtaHighlight);
      stage1Feasible = stage1FeasibleCandidates.map(c => c.ev);
      relaxationStepsHighlight.push({
        stepIndex: relaxationStepsHighlight.length,
        maxHighlightClip: relaxedEtaHighlight,
        feasibleEVs: stage1Feasible,
      });
    }
  } else {
    // Even if we didn't relax, mark the stage-1-feasible candidates
    stage1FeasibleCandidates.forEach(c => {
      c.stage = 'stage1_feasible';
    });
  }
  
  // Stage 2: From Stage 1 feasible, find where Cs(E) ≤ ηs
  let stage2FeasibleCandidates = candidates
    .filter(c => stage1Feasible.includes(c.ev) && c.shadowClip <= priorities.etaShadow);
  let stage2Feasible = stage2FeasibleCandidates.map(c => c.ev);
  let relaxCountShadow = 0;
  let relaxedEtaShadow = priorities.etaShadow;
  const relaxationStepsShadow: AETrace['relaxationStepsShadow'] = [];
  
  // Record initial shadow feasibility (even if empty)
  relaxationStepsShadow.push({
    stepIndex: 0,
    maxShadowClip: relaxedEtaShadow,
    feasibleEVs: stage2Feasible,
  });

  // Relax if no feasible solutions
  if (stage2Feasible.length === 0) {
    while (stage2Feasible.length === 0 && relaxedEtaShadow < 1.0) {
      relaxedEtaShadow += 0.05;
      relaxCountShadow++;
      stage2FeasibleCandidates = candidates
        .filter(c => stage1Feasible.includes(c.ev) && c.shadowClip <= relaxedEtaShadow);
      stage2Feasible = stage2FeasibleCandidates.map(c => c.ev);
      relaxationStepsShadow.push({
        stepIndex: relaxationStepsShadow.length,
        maxShadowClip: relaxedEtaShadow,
        feasibleEVs: stage2Feasible,
      });
    }
  }

  // Mark stage 1 and stage 2 feasible candidates with their highest stage
  candidates.forEach(c => {
    if (stage1Feasible.includes(c.ev)) {
      c.stage = 'stage1_feasible';
    }
    if (stage2Feasible.includes(c.ev)) {
      c.stage = 'stage2_feasible';
    }
  });
  
  // Stage 3: From Stage 2 feasible, choose E minimizing (median(E) - m)².
  // IMPORTANT: We do NOT add any extra EV penalty here so that the
  // midtone target and clipping tolerances fully drive the chosen EV.
  let chosenEV = evRange.min;
  let minError = Infinity;
  let chosenReason = '';
  
  if (stage2Feasible.length > 0) {
    for (const candidate of candidates) {
      if (!stage2Feasible.includes(candidate.ev)) continue;
      if (candidate.midtoneError < minError) {
        minError = candidate.midtoneError;
        chosenEV = candidate.ev;
      }
    }
    chosenReason = 'Selected from Stage 2 (highlights and shadows within relaxed tolerances) by minimizing midtone error.';
  } else if (stage1Feasible.length > 0) {
    // Fallback: use stage 1 feasible if stage 2 is empty
    for (const candidate of candidates) {
      if (!stage1Feasible.includes(candidate.ev)) continue;
      if (candidate.midtoneError < minError) {
        minError = candidate.midtoneError;
        chosenEV = candidate.ev;
      }
    }
    chosenReason = 'No candidates satisfied the shadow constraint; selected from Stage 1 (highlights within relaxed tolerance) by minimizing midtone error.';
  } else {
    // Fallback: use best overall
    for (const candidate of candidates) {
      if (candidate.midtoneError < minError) {
        minError = candidate.midtoneError;
        chosenEV = candidate.ev;
      }
    }
    chosenReason = 'No candidates satisfied highlight or shadow constraints; selected globally by minimizing midtone error.';
  }

  // Mark chosen candidate
  const chosenCandidate = candidates.find(c => c.ev === chosenEV);
  if (chosenCandidate) {
    chosenCandidate.stage = 'chosen';
  }

  // Extend sweep past max EV so the chart can show "what it would look like" (dotted)
  const extensionEV = 2;
  const extensionSteps = Math.ceil(extensionEV / evRange.step);
  for (let i = 1; i <= extensionSteps; i++) {
    const ev = evRange.max + i * evRange.step;
    const scale = Math.pow(2, ev);
    const scaledLuminance = new Float32Array(baseLuminance.length);
    for (let j = 0; j < baseLuminance.length; j++) {
      scaledLuminance[j] = baseLuminance[j] * scale;
    }
    const { highlightClip, shadowClip } = computeClipping(scaledLuminance, weights, priorities.epsilonShadow);
    const { cdf, min, max } = computeWeightedHistogram(scaledLuminance, weights);
    const median = computePercentiles(cdf, [0.5], min, max)[0];
    const midtoneError = Math.pow(median - priorities.midtoneTarget, 2);
    candidates.push({
      ev,
      highlightClip,
      shadowClip,
      median,
      midtoneError,
      stage: 'initial',
      extended: true,
    });
  }

  const trace: AETrace = {
    candidates,
    stage1Feasible,
    stage2Feasible,
    relaxCountHighlight,
    relaxCountShadow,
    chosenEV,
    relaxationStepsHighlight,
    relaxationStepsShadow,
    chosenReason,
  };
  
  return { chosenEV, trace };
}
