import { Mask, RadialMaskConfig, LinearMaskConfig } from '@/types';
import { ImageRGBAFloat } from '@/types';

/**
 * Generate a radial mask (elliptical gradient)
 */
export function generateRadialMask(
  width: number,
  height: number,
  config: RadialMaskConfig
): Mask {
  const mask = new Float32Array(width * height);
  const centerX = config.centerX * width;
  const centerY = config.centerY * height;
  const radiusX = width * config.radiusX;
  const radiusY = height * config.radiusY;
  const maxRadius = Math.max(radiusX, radiusY);
  const featherRadius = maxRadius * config.feather;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = (x - centerX) / radiusX;
      const dy = (y - centerY) / radiusY;
      // Elliptical distance: sqrt(dx^2 + dy^2) = 1 on the ellipse boundary
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      let value = 1.0;
      if (dist > 1.0) {
        value = 0.0;
      } else if (dist > 1.0 - (featherRadius / maxRadius) && config.feather > 0) {
        // Feather edge - normalize feather by max radius
        const normalizedFeather = featherRadius / maxRadius;
        const t = (1.0 - dist) / normalizedFeather;
        value = Math.max(0, Math.min(1, t));
      }
      
      mask[y * width + x] = value;
    }
  }

  return mask;
}

/**
 * Generate a linear mask (gradient along a line)
 */
export function generateLinearMask(
  width: number,
  height: number,
  config: LinearMaskConfig
): Mask {
  const mask = new Float32Array(width * height);
  const angleRad = (config.angle * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  
  // Center point
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Distance from center along perpendicular to gradient line
  const maxDist = Math.sqrt(width * width + height * height) / 2;
  const offsetDist = maxDist * config.offset;
  const halfWidth = maxDist * config.width / 2;
  const featherWidth = halfWidth * config.feather;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Vector from center to pixel
      const dx = x - centerX;
      const dy = y - centerY;
      
      // Project onto perpendicular to gradient line
      // The gradient line direction is (cos, sin)
      // Perpendicular is (-sin, cos)
      const perpDist = -dx * sin + dy * cos;
      
      // Distance from the gradient line (accounting for offset)
      const distFromLine = Math.abs(perpDist - offsetDist);
      
      let value = 1.0;
      if (distFromLine > halfWidth) {
        value = 0.0;
      } else if (distFromLine > halfWidth - featherWidth && featherWidth > 0) {
        // Feather edge
        const t = (halfWidth - distFromLine) / featherWidth;
        value = Math.max(0, Math.min(1, t));
      }
      
      mask[y * width + x] = value;
    }
  }

  return mask;
}

/**
 * Combine multiple masks using maximum (union)
 */
export function combineMasks(masks: Mask[]): Mask | null {
  if (masks.length === 0) return null;
  if (masks.length === 1) return masks[0];
  
  const result = new Float32Array(masks[0].length);
  for (let i = 0; i < result.length; i++) {
    let max = 0;
    for (const mask of masks) {
      max = Math.max(max, mask[i]);
    }
    result[i] = max;
  }
  
  return result;
}

/**
 * Generate combined mask from all enabled radial and linear masks
 */
export function generateCombinedMask(
  image: ImageRGBAFloat,
  radialMasks?: RadialMaskConfig[],
  linearMasks?: LinearMaskConfig[]
): Mask | null {
  const masks: Mask[] = [];
  
  if (radialMasks) {
    for (const config of radialMasks) {
      if (config.enabled) {
        masks.push(generateRadialMask(image.width, image.height, config));
      }
    }
  }
  
  if (linearMasks) {
    for (const config of linearMasks) {
      if (config.enabled) {
        masks.push(generateLinearMask(image.width, image.height, config));
      }
    }
  }
  
  return combineMasks(masks);
}

/**
 * Apply masks to scene image with their individual illumination values
 * Returns a new image with masks applied
 * Uses weighted average for overlapping masks
 */
export function applyMasksToScene(
  image: ImageRGBAFloat,
  baseIllumination: number,
  radialMasks?: RadialMaskConfig[],
  linearMasks?: LinearMaskConfig[]
): ImageRGBAFloat {
  const result = new Float32Array(image.data.length);
  
  // Collect all masks with their illumination values
  const maskData: Array<{ mask: Mask; illumination: number }> = [];
  
  if (radialMasks) {
    for (const config of radialMasks) {
      if (config.enabled) {
        maskData.push({
          mask: generateRadialMask(image.width, image.height, config),
          illumination: config.illumination,
        });
      }
    }
  }
  
  if (linearMasks) {
    for (const config of linearMasks) {
      if (config.enabled) {
        maskData.push({
          mask: generateLinearMask(image.width, image.height, config),
          illumination: config.illumination,
        });
      }
    }
  }
  
  // Apply masks to each pixel
  for (let i = 0; i < image.data.length; i += 4) {
    const idx = i / 4;
    
    // Calculate weighted illumination from all masks
    let totalWeight = 0;
    let weightedIllum = 0;
    
    for (const { mask, illumination } of maskData) {
      const maskValue = mask[idx];
      if (maskValue > 0) {
        totalWeight += maskValue;
        weightedIllum += maskValue * illumination;
      }
    }
    
    // Determine final illumination
    let finalIllum = baseIllumination;
    if (totalWeight > 0 && maskData.length > 0) {
      // Blend between base and weighted mask illumination
      const avgMaskIllum = weightedIllum / totalWeight;
      // Use the maximum mask value to determine blend strength
      const maxMaskValue = Math.max(...maskData.map(m => m.mask[idx]));
      finalIllum = baseIllumination * (1 - maxMaskValue) + (baseIllumination * avgMaskIllum) * maxMaskValue;
    }
    
    result[i] = image.data[i] * finalIllum;
    result[i + 1] = image.data[i + 1] * finalIllum;
    result[i + 2] = image.data[i + 2] * finalIllum;
    result[i + 3] = image.data[i + 3];
  }
  
  return {
    data: result,
    width: image.width,
    height: image.height,
  };
}
