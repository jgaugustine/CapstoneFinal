import { WeightMap, Mask } from '@/types';

export function computeMatrixWeights(width: number, height: number): WeightMap {
  const weights = new Float32Array(width * height);
  const centerX = width / 2;
  const centerY = height / 2;
  const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = (x - centerX) / width;
      const dy = (y - centerY) / height;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // Center-weighted with edge falloff
      // Higher weight in center, lower at edges
      const weight = 1.0 - (dist / maxDist) * 0.7;
      weights[y * width + x] = Math.max(0, weight);
    }
  }
  
  // Normalize to sum = 1
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum > 0) {
    for (let i = 0; i < weights.length; i++) {
      weights[i] /= sum;
    }
  }
  
  return weights;
}

export function computeCenterWeights(width: number, height: number, sigma: number = 0.3): WeightMap {
  const weights = new Float32Array(width * height);
  const centerX = width / 2;
  const centerY = height / 2;
  const sigmaX = width * sigma;
  const sigmaY = height * sigma;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = (x - centerX) / sigmaX;
      const dy = (y - centerY) / sigmaY;
      const distSq = dx * dx + dy * dy;
      
      // Radial Gaussian falloff
      weights[y * width + x] = Math.exp(-0.5 * distSq);
    }
  }
  
  // Normalize to sum = 1
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum > 0) {
    for (let i = 0; i < weights.length; i++) {
      weights[i] /= sum;
    }
  }
  
  return weights;
}

export function computeSpotWeights(
  width: number,
  height: number,
  centerX: number,
  centerY: number,
  radius: number
): WeightMap {
  const weights = new Float32Array(width * height);
  const radiusSq = radius * radius;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      const distSq = dx * dx + dy * dy;
      
      if (distSq <= radiusSq) {
        // Gaussian falloff within radius
        const dist = Math.sqrt(distSq);
        const normalizedDist = dist / radius;
        weights[y * width + x] = Math.exp(-2 * normalizedDist * normalizedDist);
      } else {
        weights[y * width + x] = 0;
      }
    }
  }
  
  // Normalize to sum = 1
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum > 0) {
    for (let i = 0; i < weights.length; i++) {
      weights[i] /= sum;
    }
  }
  
  return weights;
}

export function computeSubjectWeights(width: number, height: number, mask: Mask, threshold: number = 0.5): WeightMap {
  const weights = new Float32Array(width * height);
  
  for (let i = 0; i < mask.length; i++) {
    // Higher weight where mask > threshold
    weights[i] = mask[i] > threshold ? mask[i] : mask[i] * 0.1;
  }
  
  // Normalize to sum = 1
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum > 0) {
    for (let i = 0; i < weights.length; i++) {
      weights[i] /= sum;
    }
  }
  
  return weights;
}
