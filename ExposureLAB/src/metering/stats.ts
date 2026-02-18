import { ImageRGBAFloat, WeightMap, Mask, Telemetry } from '@/types';

// Compute weighted luminance: Y = 0.2126*R + 0.7152*G + 0.0722*B (linear).
// The weights are not applied here; they are applied later when building
// histograms / telemetry so that different AE algorithms can plug in their
// own manipulated weight maps.
export function computeWeightedLuminance(image: ImageRGBAFloat, weights: WeightMap): Float32Array {
  const luminance = new Float32Array(image.width * image.height);
  
  for (let i = 0; i < luminance.length; i++) {
    const idx = i * 4;
    const r = image.data[idx];
    const g = image.data[idx + 1];
    const b = image.data[idx + 2];
    
    luminance[i] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  
  return luminance;
}

export function computeWeightedHistogram(
  luminance: Float32Array,
  weights: WeightMap,
  bins: number = 256
): { bins: number[]; cdf: number[]; min: number; max: number } {
  // IMPORTANT: We treat luminance as an absolute linear value in [0, 1].
  // This keeps percentiles and the midtone target in the same space and
  // avoids per-call dynamic rescaling that would make the histogram and
  // median "float" with EV.
  const min = 0;
  const max = 1;
  const histogram = new Array(bins).fill(0);

  for (let i = 0; i < luminance.length; i++) {
    // Clamp luminance into [0, 1] for histogram purposes. Values > 1 are
    // considered clipped highlights; values < 0 shouldn't occur but are
    // clamped defensively.
    const valueClamped = Math.max(0, Math.min(1, luminance[i]));
    const bin = Math.floor(
      Math.max(0, Math.min(bins - 1, valueClamped * (bins - 1)))
    );
    histogram[bin] += weights[i];
  }

  // Compute CDF
  const cdf = new Array(bins);
  let sum = 0;
  for (let i = 0; i < bins; i++) {
    sum += histogram[i];
    cdf[i] = sum;
  }

  return { bins: histogram, cdf, min, max };
}

export function computePercentiles(
  cdf: number[], 
  percentiles: number[],
  min: number = 0,
  max: number = 1
): number[] {
  const total = cdf[cdf.length - 1];
  if (total === 0) return percentiles.map(() => min);
  
  const bins = cdf.length;
  const range = max - min;
  const results: number[] = [];
  
  for (const p of percentiles) {
    const target = p * total;
    let bin = 0;
    for (let i = 0; i < cdf.length; i++) {
      if (cdf[i] >= target) {
        bin = i;
        break;
      }
    }
    // Map bin back to actual luminance value
    // Use bin center for better accuracy
    const normalizedValue = (bin + 0.5) / bins;
    const actualValue = min + normalizedValue * range;
    results.push(actualValue);
  }
  
  return results;
}

export function computeClipping(
  luminance: Float32Array,
  weights: WeightMap,
  epsilon: number = 0.01
): { highlightClip: number, shadowClip: number } {
  let highlightClip = 0;
  let shadowClip = 0;
  let totalWeight = 0;
  
  for (let i = 0; i < luminance.length; i++) {
    const value = luminance[i];
    const w = weights[i];
    totalWeight += w;
    if (value >= 1.0) {
      highlightClip += w;
    }
    if (value <= epsilon) {
      shadowClip += w;
    }
  }

  // Normalize by total weight so results are proper fractions of the metered
  // pixels regardless of whether the incoming weight map was normalized.
  if (totalWeight > 0) {
    const invTotal = 1 / totalWeight;
    highlightClip *= invTotal;
    shadowClip *= invTotal;
  }

  return { highlightClip, shadowClip };
}

export function computeTelemetry(
  luminance: Float32Array,
  weights: WeightMap,
  epsilon: number = 0.01,
  subjectMask?: Mask
): Telemetry {
  // Compute weighted mean
  let mean = 0;
  for (let i = 0; i < luminance.length; i++) {
    mean += luminance[i] * weights[i];
  }
  
  // Compute histogram and percentiles
  const { cdf, min, max } = computeWeightedHistogram(luminance, weights);
  const [p1, p99] = computePercentiles(cdf, [0.01, 0.99], min, max);
  const median = computePercentiles(cdf, [0.5], min, max)[0];
  
  // Compute clipping
  const { highlightClip, shadowClip } = computeClipping(luminance, weights, epsilon);
  
  const telemetry: Telemetry = {
    mean,
    median,
    p99,
    p1,
    highlightClipPercent: highlightClip * 100,
    shadowClipPercent: shadowClip * 100,
  };
  
  // Compute subject-only stats if mask exists
  if (subjectMask) {
    const subjectWeights = new Float32Array(weights.length);
    let subjectSum = 0;
    for (let i = 0; i < weights.length; i++) {
      subjectWeights[i] = weights[i] * subjectMask[i];
      subjectSum += subjectWeights[i];
    }
    
    if (subjectSum > 0) {
      // Normalize subject weights
      for (let i = 0; i < subjectWeights.length; i++) {
        subjectWeights[i] /= subjectSum;
      }
      
      let subjectMean = 0;
      for (let i = 0; i < luminance.length; i++) {
        subjectMean += luminance[i] * subjectWeights[i];
      }
      
      const { cdf: subjectCdf, min: subjectMin, max: subjectMax } = computeWeightedHistogram(luminance, subjectWeights);
      const subjectMedian = computePercentiles(subjectCdf, [0.5], subjectMin, subjectMax)[0];
      
      telemetry.subjectStats = {
        mean: subjectMean,
        median: subjectMedian,
      };
    }
  }
  
  return telemetry;
}
