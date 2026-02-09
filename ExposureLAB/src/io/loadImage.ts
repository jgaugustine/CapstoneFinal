import exifr from 'exifr';
import { ImageRGBAFloat, ExposureMetadata } from '@/types';

// Pre-computed lookup table for sRGB to linear conversion (256 entries)
// This is much faster than calling Math.pow() for every pixel
const SRGB_TO_LINEAR_LUT = new Float32Array(256);
for (let i = 0; i < 256; i++) {
  const x = i / 255;
  SRGB_TO_LINEAR_LUT[i] = x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}

// Fast sRGB to linear using lookup table
const srgbToLinear = (channel0to255: number): number => {
  return SRGB_TO_LINEAR_LUT[Math.round(Math.max(0, Math.min(255, channel0to255)))];
};

// Linear to sRGB conversion (for display)
export const linearToSrgb = (linear0to1: number): number => {
  const y = linear0to1 <= 0.0031308 ? 12.92 * linear0to1 : 1.055 * Math.pow(linear0to1, 1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, Math.round(y * 255)));
};

// Maximum dimension for longest side (2048px for good performance with 100MP+ images)
const MAX_DIMENSION = 2048;

export type LoadImageResult = {
  image: ImageRGBAFloat;
  exposureMetadata?: ExposureMetadata;
};

/** Extract exposure metadata from EXIF if present and valid */
async function extractExposureMetadata(file: File): Promise<ExposureMetadata | undefined> {
  try {
    const exif = await exifr.parse(file, {
      pick: ['ExposureTime', 'FNumber', 'ISO', 'ExposureCompensation'],
    });
    if (!exif) return undefined;
    const exposureTime = exif.ExposureTime; // seconds (e.g. 0.004 for 1/250)
    const fNumber = exif.FNumber;
    const iso = exif.ISO ?? exif.ISOSpeed;
    if (
      typeof exposureTime !== 'number' ||
      typeof fNumber !== 'number' ||
      typeof iso !== 'number' ||
      exposureTime <= 0 ||
      fNumber <= 0 ||
      iso <= 0
    ) {
      return undefined;
    }
    const exposureCompensation =
      typeof exif.ExposureCompensation === 'number' ? exif.ExposureCompensation : undefined;
    return { shutterSeconds: exposureTime, aperture: fNumber, iso, exposureCompensation };
  } catch {
    return undefined;
  }
}

export async function loadImage(file: File): Promise<LoadImageResult> {
  try {
    // Use createImageBitmap for efficient decoding and resizing
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;

    // Calculate if we need to downsize
    const longestSide = Math.max(width, height);
    const needsResize = longestSide > MAX_DIMENSION;
    
    let targetWidth = width;
    let targetHeight = height;
    
    if (needsResize) {
      const scale = MAX_DIMENSION / longestSide;
      targetWidth = Math.round(width * scale);
      targetHeight = Math.round(height * scale);
    }

    // Create canvas and draw resized image
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      bitmap.close();
      throw new Error('Could not get canvas context');
    }
    
    // Enable high-quality image smoothing for resize
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
    
    // Release bitmap memory
    bitmap.close();
    
    // Get image data
    const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
    
    // Convert to linear float RGBA using lookup table
    const linearData = new Float32Array(targetWidth * targetHeight * 4);
    const { data } = imageData;
    
    // Process in chunks to avoid blocking UI for very large images
    const chunkSize = 100000; // Process 100k pixels at a time
    let processed = 0;
    const totalPixels = targetWidth * targetHeight;
    
    return new Promise((resolve) => {
      const processChunk = async (startIdx: number) => {
        const endIdx = Math.min(startIdx + chunkSize * 4, data.length);
        
        for (let i = startIdx; i < endIdx; i += 4) {
          linearData[i] = srgbToLinear(data[i]);         // R
          linearData[i + 1] = srgbToLinear(data[i + 1]); // G
          linearData[i + 2] = srgbToLinear(data[i + 2]); // B
          linearData[i + 3] = data[i + 3] / 255;         // A
        }
        
        processed += (endIdx - startIdx) / 4;
        
        if (endIdx < data.length) {
          setTimeout(() => processChunk(endIdx), 0);
        } else {
          const exposureMetadata = await extractExposureMetadata(file);
          resolve({
            image: {
              data: linearData,
              width: targetWidth,
              height: targetHeight,
            },
            exposureMetadata,
          });
        }
      };
      
      processChunk(0);
    });
  } catch (error) {
    // Fallback to original method if createImageBitmap fails
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const img = new Image();
        
        img.onload = () => {
          // Still apply resize in fallback
          const longestSide = Math.max(img.width, img.height);
          const needsResize = longestSide > MAX_DIMENSION;
          
          let targetWidth = img.width;
          let targetHeight = img.height;
          
          if (needsResize) {
            const scale = MAX_DIMENSION / longestSide;
            targetWidth = Math.round(img.width * scale);
            targetHeight = Math.round(img.height * scale);
          }
          
          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
          
          // Convert to linear float RGBA
          const linearData = new Float32Array(targetWidth * targetHeight * 4);
          for (let i = 0; i < imageData.data.length; i += 4) {
            linearData[i] = srgbToLinear(imageData.data[i]);
            linearData[i + 1] = srgbToLinear(imageData.data[i + 1]);
            linearData[i + 2] = srgbToLinear(imageData.data[i + 2]);
            linearData[i + 3] = imageData.data[i + 3] / 255;
          }
          
          extractExposureMetadata(file).then((exposureMetadata) => {
            resolve({
              image: {
                data: linearData,
                width: targetWidth,
                height: targetHeight,
              },
              exposureMetadata,
            });
          });
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
        
        img.src = event.target?.result as string;
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
  }
}
