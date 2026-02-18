import { AEPriorities, AETrace, WeightMap, AEAlgorithm } from '@/types';
import {
  computeWeightedLuminance,
  computeClipping,
  computeWeightedHistogram,
  computePercentiles,
} from '@/metering/stats';
import { ImageRGBAFloat } from '@/types';

type CandidateStats = {
  ev: number;
  highlightClip: number;
  shadowClip: number;
  median: number;
  midtoneError: number;
  entropy?: number;
};

export function runLexiAE(
  image: ImageRGBAFloat,
  weights: WeightMap,
  priorities: AEPriorities,
  evRange: { min: number; max: number; step: number } = { min: -6, max: 6, step: 0.1 },
  algorithm: AEAlgorithm = 'global'
): { chosenEV: number; trace: AETrace } {
  // Compute base luminance for the metered image
  const baseLuminance = computeWeightedLuminance(image, weights);
  const n = baseLuminance.length;
  const satThreshold = 0.98;

  // Build algorithm-specific weights over pixels for histogram / statistics.
  // These correspond to the "manipulated histogram" in the paper: we reshape
  // the metering distribution once per frame, then reuse it for all EV
  // candidates so that the EV decision is driven by this manipulated
  // histogram rather than by the raw meter alone.
  const algoWeights = new Float32Array(n);

  if (algorithm === 'global' || algorithm === 'entropy') {
    // Global / entropy: treat all non-saturated pixels equally (full-frame
    // histogram). Pixels that are already near saturation are excluded from
    // the manipulated histogram.
    for (let i = 0; i < n; i++) {
      algoWeights[i] = baseLuminance[i] >= satThreshold ? 0 : 1;
    }
  } else if (algorithm === 'semantic') {
    // Semantic: rely on the incoming metering weights (e.g. subject mask).
    for (let i = 0; i < n; i++) {
      algoWeights[i] = baseLuminance[i] >= satThreshold ? 0 : weights[i];
    }
  } else if (algorithm === 'saliency') {
    // Saliency: simple single-frame proxy. Emphasize pixels whose luminance
    // deviates from the global mean, modulated by the metering weights.
    let sum = 0;
    let wsum = 0;
    for (let i = 0; i < n; i++) {
      const w = weights[i];
      sum += baseLuminance[i] * w;
      wsum += w;
    }
    const mean = wsum > 0 ? sum / wsum : 0;
    let maxDev = 0;
    const tmpDev = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const dev = Math.abs(baseLuminance[i] - mean);
      tmpDev[i] = dev;
      if (dev > maxDev) maxDev = dev;
    }
    const invMaxDev = maxDev > 0 ? 1 / maxDev : 0;
    for (let i = 0; i < n; i++) {
      const sal = tmpDev[i] * invMaxDev; // 0–1
      algoWeights[i] = baseLuminance[i] >= satThreshold ? 0 : sal * weights[i];
    }
  }

  // Normalize algorithm-specific weights so that clipping fractions and
  // histogram-derived statistics are expressed in units of "fraction of
  // metered pixels" rather than raw weight sums. This keeps highlight/shadow
  // clipping directly comparable to the user-facing tolerances ηh / ηs.
  let algoWeightSum = 0;
  for (let i = 0; i < n; i++) {
    algoWeightSum += algoWeights[i];
  }
  if (algoWeightSum > 0) {
    const inv = 1 / algoWeightSum;
    for (let i = 0; i < n; i++) {
      algoWeights[i] *= inv;
    }
  }

  // Attach algorithm weight map for explainer (downscale if large to keep trace small).
  const maxDisplaySide = 256;
  const w = image.width;
  const h = image.height;
  const scale = Math.min(1, maxDisplaySide / Math.max(w, h));
  const outW = scale < 1 ? Math.max(1, Math.round(w * scale)) : w;
  const outH = scale < 1 ? Math.max(1, Math.round(h * scale)) : h;
  const weightMapData = new Float32Array(outW * outH);
  if (scale >= 1) {
    weightMapData.set(algoWeights);
  } else {
    for (let oy = 0; oy < outH; oy++) {
      for (let ox = 0; ox < outW; ox++) {
        const y0 = Math.floor((oy * h) / outH);
        const y1 = Math.min(h, Math.floor(((oy + 1) * h) / outH));
        const x0 = Math.floor((ox * w) / outW);
        const x1 = Math.min(w, Math.floor(((ox + 1) * w) / outW));
        let sum = 0;
        let count = 0;
        for (let y = y0; y < y1; y++) {
          for (let x = x0; x < x1; x++) {
            sum += algoWeights[y * w + x];
            count++;
          }
        }
        weightMapData[oy * outW + ox] = count > 0 ? sum / count : 0;
      }
    }
  }
  const algorithmWeightMap: AETrace['algorithmWeightMap'] = {
    width: outW,
    height: outH,
    data: weightMapData,
  };

  const algoLabel =
    algorithm === 'global'
      ? 'global'
      : algorithm === 'semantic'
      ? 'semantic (ROI-weighted)'
      : algorithm === 'saliency'
      ? 'saliency-weighted'
      : 'entropy-based';

  const maxHighlight = priorities.etaHighlight;
  const maxShadow = priorities.etaShadow;

  const candidates: CandidateStats[] = [];

  // Sweep EV range and collect candidate statistics for each EV.
  //
  // Conceptually this plays the role of a 1D traversal through an exposure
  // stack: each candidate EV represents one possible exposure of the same
  // scene. For each candidate we:
  //   1) scale luminance by 2^EV,
  //   2) measure clipping under the manipulated weights,
  //   3) build a manipulated histogram and derive median / entropy,
  //   4) feed these into a lexicographic AE search.
  for (let ev = evRange.min; ev <= evRange.max + 1e-6; ev += evRange.step) {
    const scale = Math.pow(2, ev);
    const scaledLuminance = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      scaledLuminance[i] = baseLuminance[i] * scale;
    }

    const { highlightClip, shadowClip } = computeClipping(
      scaledLuminance,
      algoWeights,
      priorities.epsilonShadow
    );

    // Use the manipulated histogram for midtone targeting so that the EV
    // choice is driven by the algorithm-specific notion of importance (full
    // frame, ROI, or saliency-weighted), not by the raw metering weights.
    const { cdf, min, max } = computeWeightedHistogram(scaledLuminance, algoWeights);
    const median = computePercentiles(cdf, [0.5], min, max)[0];
    const midtoneError = Math.pow(median - priorities.midtoneTarget, 2);

    let entropy: number | undefined;
    if (algorithm === 'entropy') {
      const { bins } = computeWeightedHistogram(scaledLuminance, algoWeights, 128);
      const total = bins.reduce((acc, v) => acc + v, 0);
      if (total > 0) {
        let e = 0;
        for (const count of bins) {
          if (count <= 0) continue;
          const p = count / total;
          e -= p * Math.log(p); // natural log; base is irrelevant for argmax
        }
        entropy = e;
      } else {
        entropy = -Infinity;
      }
    }

    candidates.push({
      ev,
      highlightClip,
      shadowClip,
      median,
      midtoneError,
      entropy,
    });
  }

  const isWithinTolerances = (c: CandidateStats): boolean => {
    const withinHighlight = maxHighlight <= 0 ? c.highlightClip === 0 : c.highlightClip <= maxHighlight;
    const withinShadow = maxShadow <= 0 ? c.shadowClip === 0 : c.shadowClip <= maxShadow;
    return withinHighlight && withinShadow;
  };

  const feasible = candidates.filter(isWithinTolerances);

  const penaltyFor = (c: CandidateStats): number => {
    const highlightRatio =
      maxHighlight > 0 ? c.highlightClip / maxHighlight : c.highlightClip > 0 ? Infinity : 0;
    const shadowRatio =
      maxShadow > 0 ? c.shadowClip / maxShadow : c.shadowClip > 0 ? Infinity : 0;
    return Math.max(highlightRatio, shadowRatio);
  };

  let chosen: CandidateStats | null = null;
  let chosenReason: string;
  let constraintsRelaxed = false;

  if (algorithm === 'entropy') {
    // Entropy-based AE: among EVs that satisfy clipping tolerances, pick the one
    // that maximizes entropy. If none exist, gradually relax tolerances by
    // penalizing over-clipping and still maximize entropy within that penalty.
    if (feasible.length > 0) {
      chosen = feasible.reduce((best, c) =>
        (best.entropy ?? -Infinity) > (c.entropy ?? -Infinity) ? best : c
      );
      chosenReason =
        'ΔEV chosen by maximizing histogram entropy subject to highlight/shadow clipping tolerances (ηh, ηs).';
    } else {
      constraintsRelaxed = true;
      chosen = candidates.reduce((best, c) => {
        const bestPenalty = penaltyFor(best);
        const currentPenalty = penaltyFor(c);
        if (currentPenalty < bestPenalty - 1e-6) return c;
        if (Math.abs(currentPenalty - bestPenalty) < 1e-6) {
          return (best.entropy ?? -Infinity) > (c.entropy ?? -Infinity) ? best : c;
        }
        return best;
      });
      chosenReason =
        'ΔEV chosen by maximizing histogram entropy while minimizing violation of highlight/shadow clipping tolerances (ηh, ηs).';
    }
  } else {
    // Global / semantic / saliency family: among EVs that satisfy clipping
    // tolerances, pick the one whose median is closest to the midtone target.
    if (feasible.length > 0) {
      chosen = feasible.reduce((best, c) =>
        c.midtoneError < best.midtoneError ? c : best
      );
      chosenReason =
        `ΔEV chosen by the ${algoLabel} histogram method: minimize midtone error subject to highlight/shadow clipping tolerances (ηh, ηs).`;
    } else {
      // No EV satisfies both tolerances; relax them by choosing the candidate
      // that minimally violates them, then minimize midtone error as a
      // secondary criterion.
      constraintsRelaxed = true;
      chosen = candidates.reduce((best, c) => {
        const bestPenalty = penaltyFor(best);
        const currentPenalty = penaltyFor(c);
        if (currentPenalty < bestPenalty - 1e-6) return c;
        if (Math.abs(currentPenalty - bestPenalty) < 1e-6) {
          return c.midtoneError < best.midtoneError ? c : best;
        }
        return best;
      });
      chosenReason =
        `ΔEV chosen by the ${algoLabel} histogram method after relaxing highlight/shadow tolerances: first minimize violation of ηh/ηs, then midtone error.`;
    }
  }

  if (!chosen) {
    // Fallback (should not happen): pick EV = 0 with a basic explanation.
    chosen = (
      candidates.find((c) => Math.abs(c.ev) < 1e-6) ??
      candidates[Math.floor(candidates.length / 2)]
    );
    chosenReason =
      'ΔEV fallback: unable to find a candidate under the configured tolerances; using the nearest-to-zero EV.';
  }

  const chosenEV = Math.max(evRange.min, Math.min(evRange.max, chosen.ev));

  const histBins = 64;

  // Manipulated histogram at reference exposure (EV=0) for the Step 1 explainer.
  // Here we dynamically stretch the *used* luminance range so the histogram
  // always fills the x-axis, matching the user's mental model of "fit everything".
  const binsAtZero = new Array(histBins).fill(0);
  let histMinRef = Infinity;
  let histMaxRef = -Infinity;
  for (let i = 0; i < n; i++) {
    const w = algoWeights[i];
    if (w <= 0) continue;
    const v = baseLuminance[i];
    if (v < histMinRef) histMinRef = v;
    if (v > histMaxRef) histMaxRef = v;
  }
  if (!Number.isFinite(histMinRef) || !Number.isFinite(histMaxRef) || histMinRef === histMaxRef) {
    histMinRef = 0;
    histMaxRef = 1;
  }
  const rangeRef = histMaxRef - histMinRef;
  for (let i = 0; i < n; i++) {
    const w = algoWeights[i];
    if (w <= 0) continue;
    const v = baseLuminance[i];
    const normalized = (v - histMinRef) / rangeRef; // 0–1 over used range
    const clamped = Math.max(0, Math.min(1, normalized));
    const bin = Math.floor(clamped * (histBins - 1));
    binsAtZero[bin] += w;
  }
  const cdfAtZero = new Array(histBins);
  {
    let sum = 0;
    for (let i = 0; i < histBins; i++) {
      sum += binsAtZero[i];
      cdfAtZero[i] = sum;
    }
  }
  const medianAtZero = computePercentiles(cdfAtZero, [0.5], histMinRef, histMaxRef)[0];

  // Histogram at chosen EV (for optional use; Step 1 uses at-zero for consistency with Luminance Histogram).
  const scaleChosen = Math.pow(2, chosenEV);
  const scaledLuminanceChosen = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    scaledLuminanceChosen[i] = baseLuminance[i] * scaleChosen;
  }
  const { bins: chosenBins, min: histMin, max: histMax } = computeWeightedHistogram(
    scaledLuminanceChosen,
    algoWeights,
    histBins
  );

  // Build AETrace that honestly reflects the sweep and tolerance filtering.
  const stage1Feasible: number[] = feasible.map((c) => c.ev);
  const stage2Feasible: number[] = feasible.map((c) => c.ev);

  const traceCandidates: AETrace['candidates'] = candidates.map((c) => ({
    ev: c.ev,
    highlightClip: c.highlightClip,
    shadowClip: c.shadowClip,
    median: c.median,
    midtoneError: c.midtoneError,
    stage:
      c === chosen
        ? 'chosen'
        : isWithinTolerances(c)
        ? 'stage2_feasible'
        : 'initial',
    entropy: c.entropy,
  }));

  const relaxationStepsHighlight: AETrace['relaxationStepsHighlight'] = [
    {
      stepIndex: 0,
      maxHighlightClip: maxHighlight,
      feasibleEVs: stage1Feasible,
    },
  ];

  const relaxationStepsShadow: AETrace['relaxationStepsShadow'] = [
    {
      stepIndex: 0,
      maxShadowClip: maxShadow,
      feasibleEVs: stage2Feasible,
    },
  ];

  const relaxCountHighlight = constraintsRelaxed ? 1 : 0;
  const relaxCountShadow = constraintsRelaxed ? 1 : 0;

  const trace: AETrace = {
    candidates: traceCandidates,
    stage1Feasible,
    stage2Feasible,
    relaxCountHighlight,
    relaxCountShadow,
    chosenEV,
    relaxationStepsHighlight,
    relaxationStepsShadow,
    chosenReason,
    chosenHistogram: { bins: chosenBins, min: histMin, max: histMax },
    manipulatedHistogramAtZero: { bins: binsAtZero, min: histMinRef, max: histMaxRef, median: medianAtZero },
    algorithmWeightMap,
  };

  return { chosenEV, trace };
}
