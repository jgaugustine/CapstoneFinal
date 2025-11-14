This explains how I implemented the image transformations in `ImageLab/src/components/ImageCanvas.tsx`. I present each transform as an algorithm, prove its correctness, and explain my design decisions.

## 1. Color Space and Design

### 1.1 sRGB

All modern displays, web browsers, and the HTML Canvas API work in sRGB color space. sRGB values are gamma-encoded. They don't represent linear light intensity, but rather perceptually-uniform brightness levels optimized for human vision.

This means that...
- Values range from 0 to 255 for each channel (R, G, B)
- The relationship to linear light is non-linear: $R_{linear} \approx (R_{sRGB}/255)^{2.2}$
- Value 128 appears as perceptual "middle gray" on screen (not 50% light intensity)
- Gamma encoding makes efficient use of 8 bits by allocating more values to darker tones where human eyes are more sensitive

### 1.2 Design Decisions

I chose to perform all transformations in sRGB space (without linearization because):

1. Linearizing and re-encoding requires power operations per pixel which are expensive and computation matters as we are working with large images
2. For real-time image editing, gamma-space operations provide visually acceptable results
3. Canvas ImageData provides sRGB values

This means most transforms work on gamma-encoded values. I've ensured each algorithm is mathematically sound in this space.

As I am most comfortable with Python, I originally thought it would be most computationally efficient to leverage libraries for the matrix operations. However, when looking through the documentation for libraries like ml-matrix or numeric.js, I noticed they require individual function calls for each operation. Unlike NumPy, which delegates to optimized C/Fortran code and processes batched operations in compiled code, JavaScript matrix libraries execute in the JavaScript runtime. For our use case—applying a 3×3 transformation to 2+ million pixels—this means 2+ million separate function calls, each with JavaScript overhead, object allocations, and garbage collection pressure.

Therefore, I write all matrix operations inline by extracting matrix elements and computing per pixel.

### 1.3 Mathematical Notation

- $\mathbf{r} = [R, G, B]^T$ represents a pixel in gamma-encoded sRGB space, where each component is in $[0, 255]$
- $I$ denotes the $3 \times 3$ identity matrix
- $M$ denotes a $3 \times 3$ transformation matrix
- $\mathbf{o}$ denotes a $3 \times 1$ offset vector
- An affine transform has the form: $\mathbf{r}' = M\mathbf{r} + \mathbf{o}$
- All operations include implicit clamping to $[0, 255]$




## 2. Brightness Adjustment

**What I wanted:** A transform that shifts all color channels by the same amount, making the image uniformly lighter or darker.

### Algorithm 2.1: Brightness Transform

```
Input: pixel r = [R, G, B]ᵀ, brightness offset b ∈ ℝ
Output: transformed pixel r' = [R', G', B']ᵀ

1. R' ← clamp(R + b, 0, 255)
2. G' ← clamp(G + b, 0, 255)  
3. B' ← clamp(B + b, 0, 255)
4. return [R', G', B']ᵀ
```

**Affine form:** $\mathbf{r}' = I\mathbf{r} + b\mathbf{1}$ where $\mathbf{1} = [1, 1, 1]^T$

**Implementation:** See `buildBrightnessMatrix()` at lines 40-49 in `ImageCanvas.tsx`:
```typescript
const buildBrightnessMatrix = (value: number): { matrix: number[]; offset: number[] } => {
  const matrix = [1, 0, 0, 0, 1, 0, 0, 0, 1]; // Identity matrix
  const offset = [value, value, value]; // Uniform offset
  return { matrix, offset };
};
```

### Proof of Correctness

**Claim:** This transform shifts all channels uniformly while preserving color relationships.

**Proof:**
For any two pixels $\mathbf{r}_1, \mathbf{r}_2$:
$$\mathbf{r}'_1 - \mathbf{r}'_2 = (I\mathbf{r}_1 + b\mathbf{1}) - (I\mathbf{r}_2 + b\mathbf{1}) = I(\mathbf{r}_1 - \mathbf{r}_2) = \mathbf{r}_1 - \mathbf{r}_2$$

The difference between any two pixels remains constant, preserving relative color relationships. The transform is a translation in RGB space. 




## 3. Contrast Adjustment

**What I wanted:** A transform that scales distances from middle gray (128), making dark regions darker and bright regions brighter while keeping middle gray fixed.

### Algorithm 3.1: Contrast Transform

```
Input: pixel r = [R, G, B]ᵀ, contrast factor c ∈ ℝ⁺
Output: transformed pixel r'

1. For each channel k ∈ {R, G, B}:
2.   k' ← 128 + c(k - 128)
3.   k' ← clamp(k', 0, 255)
4. return r'
```

**Affine form:** $\mathbf{r}' = cI\mathbf{r} + 128(1-c)\mathbf{1}$

**Implementation:** See `buildContrastMatrix()` at lines 53-62 in `ImageCanvas.tsx`:
```typescript
const buildContrastMatrix = (value: number): { matrix: number[]; offset: number[] } => {
  const matrix = [value, 0, 0, 0, value, 0, 0, 0, value]; // Scale by c
  const offset = [128 * (1 - value), 128 * (1 - value), 128 * (1 - value)];
  return { matrix, offset };
};
```

### Proof of Correctness

**Claim:** Middle gray (128) is a fixed point, and distances from middle gray scale by factor $c$.

**Proof:**
Let $\mathbf{g} = [128, 128, 128]^T$ represent middle gray in sRGB.

**(1) Fixed point property:**
$$\mathbf{g}' = cI\mathbf{g} + 128(1-c)\mathbf{1} = c \cdot 128 + 128(1-c) = 128 = \mathbf{g}$$

**(2) Distance scaling:**
For any pixel $\mathbf{r}$, the distance from middle gray after transformation is:
$$\mathbf{r}' - \mathbf{g} = (cI\mathbf{r} + 128(1-c)\mathbf{1}) - 128\mathbf{1} = c(\mathbf{r} - 128\mathbf{1}) = c(\mathbf{r} - \mathbf{g})$$

Thus distances from middle gray scale by exactly $c$. 

*Note:* In sRGB, the value 128 represents perceptual middle gray (approximately 50% brightness as perceived by human vision), making it the natural anchor point for contrast adjustments.


## 4. Saturation Adjustment

**What I wanted:** A transform that blends each color with its grayscale equivalent, controlling color intensity while preserving perceived brightness.

### Algorithm 4.1: Saturation Transform

```
Input: pixel r = [R, G, B]ᵀ, saturation factor s ∈ ℝ
Output: transformed pixel r'

1. L ← 0.299·R + 0.587·G + 0.114·B    // Gamma-space luminance
2. gray ← [L, L, L]ᵀ
3. r' ← gray·(1 - s) + r·s             // Linear interpolation
4. return clamp(r', 0, 255)
```

**Affine form:** This can be expressed as $\mathbf{r}' = M_s\mathbf{r}$ where:

$$M_s = \begin{bmatrix}
w_R + (1-w_R)s & w_G(1-s) & w_B(1-s) \\
w_R(1-s) & w_G + (1-w_G)s & w_B(1-s) \\
w_R(1-s) & w_G(1-s) & w_B + (1-w_B)s
\end{bmatrix}$$

where $(w_R, w_G, w_B) = (0.299, 0.587, 0.114)$ are the **Rec.601 luminance weights**.

**Implementation:** See `buildSaturationMatrixGamma()` at lines 68-95 in `ImageCanvas.tsx`:
```typescript
const buildSaturationMatrixGamma = (saturation: number): number[] => {
  if (saturation === 1) return [1, 0, 0, 0, 1, 0, 0, 0, 1];
  
  const wR = 0.299, wG = 0.587, wB = 0.114;
  const s = saturation;
  
  return [
    wR + (1 - wR) * s, wG * (1 - s), wB * (1 - s),
    wR * (1 - s), wG + (1 - wG) * s, wB * (1 - s),
    wR * (1 - s), wG * (1 - s), wB + (1 - wB) * s
  ];
};
```

### Proof of Correctness

**Claim:** The saturation transform (1) preserves gamma-space luminance and (2) leaves gray pixels invariant.

**Proof:**

**(1) Gamma-space luminance preservation:**

The gamma-space luminance of the transformed pixel is:
$$L' = w_R R' + w_G G' + w_B B'$$

Substituting $\mathbf{r}' = L\mathbf{1}(1-s) + \mathbf{r} \cdot s$:
$$L' = w_R[L(1-s) + Rs] + w_G[L(1-s) + Gs] + w_B[L(1-s) + Bs]$$
$$= L(1-s)(w_R + w_G + w_B) + s(w_R R + w_G G + w_B B)$$
$$= L(1-s) \cdot 1 + s \cdot L = L$$

The gamma-space luminance is preserved. 

**(2) Gray invariance:**

Let $\mathbf{r} = [g, g, g]^T$ be a gray pixel. Then:
$$L = w_R g + w_G g + w_B g = g(w_R + w_G + w_B) = g$$

Thus:
$$\mathbf{r}' = [g, g, g](1-s) + [g, g, g]s = [g, g, g]$$

Gray pixels remain unchanged for all $s$. 


I use Rec.601 weights $(0.299, 0.587, 0.114)$ rather than the more modern Rec.709 weights $(0.2126, 0.7152, 0.0722)$ because Rec.709 weights are designed for linear light. Rec.601 weights are empirically better for gamma space. 

However, there is no perfect set of constant weights for gamma-space luminance because gamma encoding is non-linear. The most correct approach would be to linearize -> apply Rec.709 -> apply saturation -> transform to sRGB. However, this requires expensive power operations and the Rec.601 approximation provides acceptable perceptual results for real-time editing while maintaining our performance advantage of working natively in sRGB. 

*Note:* I want to add a feature later that allows use to compare the edit applied in linear- and gamma- encoded light.

## 5. Vibrance Adjustment

**What I wanted:** An adaptive saturation that boosts dull colors more than already-saturated colors, preventing oversaturation of skin tones and vivid regions.

### Algorithm 5.1: Vibrance Transform

```
Input: pixel r = [R, G, B]ᵀ, vibrance factor v ∈ ℝ
Output: transformed pixel r'

1. maxC ← max(R, G, B)
2. minC ← min(R, G, B)
3. ŝ ← (maxC - minC) / maxC        // Saturation estimate
4. f ← 1 + v(1 - ŝ)                 // Adaptive factor
5. L ← 0.299·R + 0.587·G + 0.114·B
6. r' ← [L, L, L]ᵀ + f(r - [L, L, L]ᵀ)
7. return clamp(r', 0, 255)
```

**Key insight:** Unlike saturation, the factor $f$ depends on each pixel's current saturation $\hat{s}(\mathbf{r})$, making this inherently per-pixel.

**Implementation:** See `applyVibranceGamma()` at lines 194-210 in `ImageCanvas.tsx`:
```typescript
const applyVibranceGamma = (rgb: RGB, vibrance: number): RGB => {
  if (vibrance === 0) return rgb;
  const R = rgb.r, G = rgb.g, B = rgb.b;
  const maxC = Math.max(R, G, B), minC = Math.min(R, G, B);
  const sEst = maxC === 0 ? 0 : (maxC - minC) / maxC;
  const f = 1 + vibrance * (1 - sEst);
  const gray = 0.299 * R + 0.587 * G + 0.114 * B;
  if (R === G && G === B) return { r: R, g: G, b: B };
  return { 
    r: clamp(gray + (R - gray) * f), 
    g: clamp(gray + (G - gray) * f), 
    b: clamp(gray + (B - gray) * f) 
  };
};
```

### Proof of Non-Composability

Vibrance cannot be expressed as a global affine transform (matrix + offset).

**Proof by contradiction:**

Assume vibrance can be expressed as $V(\mathbf{r}) = M\mathbf{r} + \mathbf{o}$ for some fixed $M$ and $\mathbf{o}$.

Consider two pixels:
- $\mathbf{r}_1 = [255, 0, 0]^T$ (saturated red): $\hat{s}_1 = 1$, so $f_1 = 1 + v(1-1) = 1$
- $\mathbf{r}_2 = [200, 195, 190]^T$ (desaturated): $\hat{s}_2 \approx 0.05$, so $f_2 = 1 + v(0.95) \approx 1 + 0.95v$

For $v = 1$, we have $f_1 = 1$ and $f_2 \approx 1.95$.

If vibrance were a linear transform, the ratio of how much each pixel changes would be constant:
$$\frac{\|\mathbf{r}'_1 - L_1\mathbf{1}\|}{\|\mathbf{r}_1 - L_1\mathbf{1}\|} = \frac{\|\mathbf{r}'_2 - L_2\mathbf{1}\|}{\|\mathbf{r}_2 - L_2\mathbf{1}\|}$$

But by construction:
$$\frac{\|\mathbf{r}'_1 - L_1\mathbf{1}\|}{\|\mathbf{r}_1 - L_1\mathbf{1}\|} = f_1 = 1 \neq 1.95 \approx f_2 = \frac{\|\mathbf{r}'_2 - L_2\mathbf{1}\|}{\|\mathbf{r}_2 - L_2\mathbf{1}\|}$$

This contradicts linearity. Therefore, vibrance cannot be a global affine transform. 



## 6. Hue Rotation

**What I wanted:** A transform that rotates colors around the gray axis in RGB space, changing hue while preserving brightness and leaving grays unchanged.

### Algorithm 6.1: Hue Rotation

```
Input: pixel r = [R, G, B]ᵀ, angle θ (in degrees)
Output: rotated pixel r'

1. Convert θ to radians: θ_rad ← θ · π/180
2. Compute rotation matrix R(θ) using Rodrigues' formula
3. r' ← R(θ) · r
4. return clamp(r', 0, 255)
```

**Mathematical form:** I use Rodrigues' rotation formula for rotation by angle $\theta$ around the normalized gray axis $\mathbf{u} = \frac{1}{\sqrt{3}}[1, 1, 1]^T$:

$$R(\theta) = \cos\theta \cdot I + (1-\cos\theta)(\mathbf{u}\mathbf{u}^T) + \sin\theta \cdot [\mathbf{u}]_\times$$

where $[\mathbf{u}]_\times$ is the skew-symmetric cross-product matrix:

$$[\mathbf{u}]_\times = \frac{1}{\sqrt{3}}\begin{bmatrix}0 & -1 & 1\\1 & 0 & -1\\-1 & 1 & 0\end{bmatrix}$$

After algebraic simplification, this becomes:

$$R(\theta) = \begin{bmatrix}
c + \frac{1-c}{3} & \frac{1-c}{3} - \frac{s}{\sqrt{3}} & \frac{1-c}{3} + \frac{s}{\sqrt{3}} \\
\frac{1-c}{3} + \frac{s}{\sqrt{3}} & c + \frac{1-c}{3} & \frac{1-c}{3} - \frac{s}{\sqrt{3}} \\
\frac{1-c}{3} - \frac{s}{\sqrt{3}} & \frac{1-c}{3} + \frac{s}{\sqrt{3}} & c + \frac{1-c}{3}
\end{bmatrix}$$

where $c = \cos\theta$ and $s = \sin\theta$.

**Implementation:** See `buildHueMatrix()` at lines 98-123 in `ImageCanvas.tsx`:
```typescript
const buildHueMatrix = (value: number): number[] => {
  if (value === 0) return [1, 0, 0, 0, 1, 0, 0, 0, 1];
  
  const angle = (value * Math.PI) / 180;
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  
  return [
    cosA + (1 - cosA) / 3,
    1/3 * (1 - cosA) - Math.sqrt(1/3) * sinA,
    1/3 * (1 - cosA) + Math.sqrt(1/3) * sinA,
    1/3 * (1 - cosA) + Math.sqrt(1/3) * sinA,
    cosA + 1/3 * (1 - cosA),
    1/3 * (1 - cosA) - Math.sqrt(1/3) * sinA,
    1/3 * (1 - cosA) - Math.sqrt(1/3) * sinA,
    1/3 * (1 - cosA) + Math.sqrt(1/3) * sinA,
    cosA + 1/3 * (1 - cosA)
  ];
};
```

### Proof of Properties

**Claim 1:** Any gray pixel $\mathbf{g} = [g, g, g]^T$ remains unchanged under hue rotation.

**Proof:**

By definition of rotation, any vector parallel to the rotation axis is unchanged. Since $\mathbf{g} = g[1,1,1]^T = g\sqrt{3} \cdot \mathbf{u}$ is parallel to $\mathbf{u}$:

$$R(\theta)\mathbf{g} = R(\theta)(g\sqrt{3}\mathbf{u}) = g\sqrt{3} \cdot R(\theta)\mathbf{u} = g\sqrt{3} \cdot \mathbf{u} = \mathbf{g}$$

The last equality follows because rotating a vector around itself leaves it unchanged. ∎

**Claim 2:** $R(\theta)$ is an orthogonal matrix, preserving distances and angles.

**Proof:**

Rodrigues' formula constructs rotation matrices by definition. All rotation matrices satisfy the orthogonality property $R(\theta)^T R(\theta) = I$.

This can be verified directly from the formula: the three components $\cos\theta \cdot I$, $(1-\cos\theta)(\mathbf{u}\mathbf{u}^T)$, and $\sin\theta \cdot [\mathbf{u}]_\times$ are constructed such that their combination produces an orthogonal matrix.

As a consequence, for any two pixels $\mathbf{r}_1, \mathbf{r}_2$:
$$\|\mathbf{r}'_1 - \mathbf{r}'_2\| = \|R(\mathbf{r}_1 - \mathbf{r}_2)\| = \|\mathbf{r}_1 - \mathbf{r}_2\|$$

Hue rotation preserves all distances in RGB space. ∎

*Note:* Hue rotation is a geometric operation (it works identically in linear or gamma) encoded RGB space since it's just a 3D rotation. The operation is space-independent.


## 7. Transform Composition

I realized that brightness, contrast, saturation, and hue are all affine transforms (matrix + offset). By composing them algebraically before processing pixels, I can apply multiple transforms with a single matrix multiplication per pixel.

### Algorithm 7.1: Affine Transform Composition

```
Input: List of transforms T₁, T₂, ..., Tₙ where Tᵢ = (Mᵢ, oᵢ)
Output: Composed transform T_composed = (M_composed, o_composed)

1. M ← M₁
2. o ← o₁
3. for i = 2 to n:
4.   M ← Mᵢ · M          // Matrix multiplication
5.   o ← Mᵢ · o + oᵢ      // Transform offset through matrix
6. return (M, o)
```

**Mathematical justification:** Composing two affine transforms:
$$\mathbf{r}'' = M_2(M_1\mathbf{r} + \mathbf{o}_1) + \mathbf{o}_2 = (M_2 M_1)\mathbf{r} + (M_2\mathbf{o}_1 + \mathbf{o}_2)$$

So the composed transform is $(M_2 M_1, M_2\mathbf{o}_1 + \mathbf{o}_2)$.

**Implementation:** See `composeAffineTransforms()` at lines 235-286 in `ImageCanvas.tsx`:
```typescript
const composeAffineTransforms = (
  transforms: Array<{ matrix: number[]; offset: number[] }>
): { matrix: number[]; offset: number[] } => {
  if (transforms.length === 0) {
    return { matrix: [1, 0, 0, 0, 1, 0, 0, 0, 1], offset: [0, 0, 0] };
  }
  
  if (transforms.length === 1) {
    return transforms[0];
  }
  
  let resultMatrix = [...transforms[0].matrix];
  let resultOffset = [...transforms[0].offset];
  
  for (let i = 1; i < transforms.length; i++) {
    const M2 = transforms[i].matrix;
    const o2 = transforms[i].offset;
    
    // Matrix multiplication: M_composed = M2 * M1
    const newMatrix = [
      M2[0] * resultMatrix[0] + M2[1] * resultMatrix[3] + M2[2] * resultMatrix[6],
      M2[0] * resultMatrix[1] + M2[1] * resultMatrix[4] + M2[2] * resultMatrix[7],
      M2[0] * resultMatrix[2] + M2[1] * resultMatrix[5] + M2[2] * resultMatrix[8],
      M2[3] * resultMatrix[0] + M2[4] * resultMatrix[3] + M2[5] * resultMatrix[6],
      M2[3] * resultMatrix[1] + M2[4] * resultMatrix[4] + M2[5] * resultMatrix[7],
      M2[3] * resultMatrix[2] + M2[4] * resultMatrix[5] + M2[5] * resultMatrix[8],
      M2[6] * resultMatrix[0] + M2[7] * resultMatrix[3] + M2[8] * resultMatrix[6],
      M2[6] * resultMatrix[1] + M2[7] * resultMatrix[4] + M2[8] * resultMatrix[7],
      M2[6] * resultMatrix[2] + M2[7] * resultMatrix[5] + M2[8] * resultMatrix[8]
    ];
    
    // Offset transformation: o_composed = M2 * o1 + o2
    const newOffset = [
      M2[0] * resultOffset[0] + M2[1] * resultOffset[1] + M2[2] * resultOffset[2] + o2[0],
      M2[3] * resultOffset[0] + M2[4] * resultOffset[1] + M2[5] * resultOffset[2] + o2[1],
      M2[6] * resultOffset[0] + M2[7] * resultOffset[1] + M2[8] * resultOffset[2] + o2[2]
    ];
    
    resultMatrix = newMatrix;
    resultOffset = newOffset;
  }
  
  return { matrix: resultMatrix, offset: resultOffset };
};
```


### Proof of Correctness

For transforms $T_1, T_2, \ldots, T_n$, Algorithm 7.1 produces a transform $T$ such that:
$$T(\mathbf{r}) = T_n(T_{n-1}(\cdots T_2(T_1(\mathbf{r})) \cdots))$$

**Proof by induction:**

*Base case ($n=1$):* Trivial—the single transform is returned as-is.

*Inductive step:* Assume correctness for $n-1$ transforms. Let $(M', \mathbf{o}')$ be the composition of $T_1, \ldots, T_{n-1}$. After iteration $n$:
$$M = M_n M', \quad \mathbf{o} = M_n\mathbf{o}' + \mathbf{o}_n$$

Applying this to pixel $\mathbf{r}$:
$$T(\mathbf{r}) = M\mathbf{r} + \mathbf{o} = M_n M'\mathbf{r} + M_n\mathbf{o}' + \mathbf{o}_n$$
$$= M_n(M'\mathbf{r} + \mathbf{o}') + \mathbf{o}_n = T_n(T'(\mathbf{r}))$$

where $T'$ is the composition of $T_1, \ldots, T_{n-1}$. By the inductive hypothesis, this equals the full composition. ∎


## 8. Processing Pipeline

I scan through the transform order and batch all consecutive affine transforms, then apply per-pixel transforms individually when encountered.

### Algorithm 8.1: Smart Batching Pipeline

```
Input: Pixel array P, ordered transform list L
Output: Transformed pixel array P'

1. i ← 0
2. while i < length(L):
3.   batch ← []
4.   while i < length(L) and L[i] is affine:  // Collect affine transforms
5.     batch.append(L[i])
6.     i ← i + 1
7.   if batch is not empty:
8.     (M, o) ← composeAffineTransforms(batch)
9.     for each pixel p in P:
10.      p ← M · p + o
11. if i < length(L) and L[i] is per-pixel:    // Apply per-pixel transform
12.   for each pixel p in P:
13.     p ← L[i].apply(p)
14.   i ← i + 1
15. return P
```

**Why this works:**
- Affine transforms (brightness, contrast, saturation, hue) can be batched because they apply the same matrix to every pixel
- Per-pixel transforms (vibrance) adapt per pixel, so they must be applied individually
- By batching consecutive affine transforms, I minimize per-pixel operations

**Complexity analysis:**
Let $n$ be the number of transforms and $p$ be the number of pixels.

Without batching: $O(np)$ matrix-vector multiplications

With batching: $O(n^2)$ matrix-matrix multiplications (negligible for small $n$) + $O(kp)$ matrix-vector multiplications, where $k$ is the number of batches (typically $k \ll n$).

For typical image processing where $n \ll \sqrt{p}$ (e.g., 5 transforms on a 2-megapixel image), batching provides significant performance gains.
