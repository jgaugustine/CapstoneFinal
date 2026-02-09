import { SceneState, CameraSettings, SimParams, SimOutput, Mask } from '@/types';
import { ImageRGBAFloat } from '@/types';

// Simple Gaussian blur kernel
function createGaussianKernel(size: number, sigma: number): number[][] {
  const kernel: number[][] = [];
  const center = Math.floor(size / 2);
  let sum = 0;
  
  for (let y = 0; y < size; y++) {
    kernel[y] = [];
    for (let x = 0; x < size; x++) {
      const dx = x - center;
      const dy = y - center;
      const value = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
      kernel[y][x] = value;
      sum += value;
    }
  }
  
  // Normalize
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      kernel[y][x] /= sum;
    }
  }
  
  return kernel;
}

// Apply convolution
function applyConvolution(
  image: ImageRGBAFloat,
  kernel: number[][],
  mask?: Mask
): Float32Array {
  const result = new Float32Array(image.data.length);
  const kernelSize = kernel.length;
  const halfSize = Math.floor(kernelSize / 2);
  
  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      const idx = (y * image.width + x) * 4;
      
      // Check if pixel should be blurred (not in subject mask)
      if (mask && mask[y * image.width + x] > 0.5) {
        // Keep sharp (copy original)
        result[idx] = image.data[idx];
        result[idx + 1] = image.data[idx + 1];
        result[idx + 2] = image.data[idx + 2];
        result[idx + 3] = image.data[idx + 3];
        continue;
      }
      
      // Apply convolution
      let r = 0, g = 0, b = 0, a = 0;
      
      for (let ky = 0; ky < kernelSize; ky++) {
        for (let kx = 0; kx < kernelSize; kx++) {
          const px = x + kx - halfSize;
          const py = y + ky - halfSize;
          
          if (px >= 0 && px < image.width && py >= 0 && py < image.height) {
            const pidx = (py * image.width + px) * 4;
            const weight = kernel[ky][kx];
            r += image.data[pidx] * weight;
            g += image.data[pidx + 1] * weight;
            b += image.data[pidx + 2] * weight;
            a += image.data[pidx + 3] * weight;
          }
        }
      }
      
      result[idx] = r;
      result[idx + 1] = g;
      result[idx + 2] = b;
      result[idx + 3] = a;
    }
  }
  
  return result;
}

// Apply motion blur (simplified directional blur)
function applyMotionBlur(
  image: ImageRGBAFloat,
  direction: { x: number; y: number },
  amount: number
): Float32Array {
  const result = new Float32Array(image.data.length);
  const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
  if (length === 0) {
    return image.data.slice();
  }
  
  const normalized = { x: direction.x / length, y: direction.y / length };
  const samples = Math.max(3, Math.floor(amount * 10));
  
  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      const idx = (y * image.width + x) * 4;
      
      let r = 0, g = 0, b = 0, a = 0;
      
      for (let s = 0; s < samples; s++) {
        const t = (s / (samples - 1)) - 0.5;
        const px = x + normalized.x * amount * t;
        const py = y + normalized.y * amount * t;
        
        const pxInt = Math.floor(px);
        const pyInt = Math.floor(py);
        
        if (pxInt >= 0 && pxInt < image.width && pyInt >= 0 && pyInt < image.height) {
          const pidx = (pyInt * image.width + pxInt) * 4;
          r += image.data[pidx];
          g += image.data[pidx + 1];
          b += image.data[pidx + 2];
          a += image.data[pidx + 3];
        }
      }
      
      result[idx] = r / samples;
      result[idx + 1] = g / samples;
      result[idx + 2] = b / samples;
      result[idx + 3] = a / samples;
    }
  }
  
  return result;
}

export function simulateForward(
  scene: SceneState,
  settings: CameraSettings,
  simParams: SimParams
): SimOutput {
  const { image, illumination, subjectMask } = scene;
  
  // Step 1: Apply scene illumination scalar
  // Note: Masks are already applied to the scene image before simulation
  let processed = new Float32Array(image.data.length);
  for (let i = 0; i < image.data.length; i += 4) {
    processed[i] = image.data[i] * illumination;
    processed[i + 1] = image.data[i + 1] * illumination;
    processed[i + 2] = image.data[i + 2] * illumination;
    processed[i + 3] = image.data[i + 3];
  }
  
  // Step 2: Apply exposure scaling (relative to capture settings)
  // When settings match scene.exposureMetadata, output = input (scale = 1)
  // Light ∝ (shutter × ISO) / aperture² — smaller aperture = less light
  const evCurrent = Math.log2(
    (settings.shutterSeconds * (settings.iso / 100)) / (settings.aperture * settings.aperture)
  );
  const meta = scene.exposureMetadata;
  const evRef = meta
    ? Math.log2(
        (meta.shutterSeconds * (meta.iso / 100)) / (meta.aperture * meta.aperture)
      )
    : Math.log2((2.8 * 2.8) / ((1 / 60) * 1)); // fallback: f/2.8, 1/60, ISO 100
  const exposureScale = Math.pow(2, evCurrent - evRef);
  
  for (let i = 0; i < processed.length; i += 4) {
    processed[i] *= exposureScale;
    processed[i + 1] *= exposureScale;
    processed[i + 2] *= exposureScale;
  }
  
  // Step 3: Apply ISO noise model (expected variance mode)
  // σ² = (K / ISO) + σr²
  const variance = (simParams.fullWell / settings.iso) + (simParams.readNoise * simParams.readNoise);
  const stdDev = Math.sqrt(variance);
  
  // Apply noise as variance (deterministic - adds variance to signal)
  // For display, we'll add a small amount of noise for realism
  for (let i = 0; i < processed.length; i += 4) {
    // Add noise proportional to signal (shot noise) + read noise
    const signal = (processed[i] + processed[i + 1] + processed[i + 2]) / 3;
    const shotNoise = Math.sqrt(signal * simParams.fullWell / settings.iso) / simParams.fullWell;
    const totalNoise = Math.sqrt(shotNoise * shotNoise + (stdDev / simParams.fullWell) * (stdDev / simParams.fullWell));
    
    // Apply noise (simplified - just add variance)
    processed[i] = Math.max(0, Math.min(1, processed[i] + totalNoise * (Math.random() - 0.5) * 0.1));
    processed[i + 1] = Math.max(0, Math.min(1, processed[i + 1] + totalNoise * (Math.random() - 0.5) * 0.1));
    processed[i + 2] = Math.max(0, Math.min(1, processed[i + 2] + totalNoise * (Math.random() - 0.5) * 0.1));
  }
  
  // Create temporary image for blur operations
  let blurredImage: ImageRGBAFloat = {
    data: processed,
    width: image.width,
    height: image.height,
  };
  
  // Step 4: Apply DoF blur
  if (simParams.dofStrength > 0) {
    // Blur strength proportional to aperture
    const blurSigma = settings.aperture * simParams.dofStrength * 0.5;
    const kernelSize = Math.min(15, Math.max(3, Math.ceil(blurSigma * 6) | 1));
    const kernel = createGaussianKernel(kernelSize, blurSigma);
    processed = applyConvolution(blurredImage, kernel, subjectMask);
    blurredImage = {
      data: processed,
      width: image.width,
      height: image.height,
    };
  }
  
  // Step 5: Apply motion blur
  if (simParams.motionEnabled && settings.shutterSeconds > simParams.motionThreshold) {
    const motionAmount = (settings.shutterSeconds - simParams.motionThreshold) * 10;
    const direction = simParams.motionDirection || { x: 1, y: 1 }; // Default diagonal
    
    if (simParams.motionDirection) {
      // Directional motion
      processed = applyMotionBlur(blurredImage, direction, motionAmount);
    } else {
      // Isotropic (handheld) - apply in multiple directions
      const directions = [
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
        { x: 1, y: -1 },
      ];
      
      for (const dir of directions) {
        processed = applyMotionBlur(blurredImage, dir, motionAmount * 0.25);
        blurredImage = {
          data: processed,
          width: image.width,
          height: image.height,
        };
      }
    }
  }
  
  // Create final image
  const finalImage: ImageRGBAFloat = {
    data: processed,
    width: image.width,
    height: image.height,
  };
  
  // Compute clipping masks
  const highlightClipMask = new Float32Array(image.width * image.height);
  const shadowClipMask = new Float32Array(image.width * image.height);
  const epsilon = 0.01;
  
  for (let i = 0; i < processed.length; i += 4) {
    const idx = i / 4;
    const r = processed[i];
    const g = processed[i + 1];
    const b = processed[i + 2];
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    
    highlightClipMask[idx] = luminance >= 1.0 ? 1.0 : 0.0;
    shadowClipMask[idx] = luminance <= epsilon ? 1.0 : 0.0;
  }
  
  return {
    image: finalImage,
    highlightClipMask,
    shadowClipMask,
  };
}
