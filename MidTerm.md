## ImageLab MidTerm: How We Implement Image Transforms

This document explains how the image transformations in `ImageLab/src/components/ImageCanvas.tsx` actually work under the hood. You've seen the app—now let's understand the math behind it. We'll explain both the intuitive concepts and the mathematical details, assuming you know some linear algebra but explaining the fancy terms (affine transforms, projections) as we go.

### Getting Started: What Are We Working With?

Think of each pixel in your image as three numbers: Red, Green, and Blue. We can write this as a vector $\mathbf{r} = [R, G, B]^T$ where each value is between 0 and 255 (8-bit color).

When we read pixels from the canvas using `getImageData()`, we get these RGB values. Here's the key thing: **these values are already gamma-encoded**—they're not "raw" light values, but values that look good on your screen. This matters because we can work with them directly without expensive conversions.

**Quick glossary (we'll explain more as we go):**
- **Affine transform**: Think of it as "matrix multiplication plus an offset." Like scaling and then shifting. Formula: $\text{new\_pixel} = M \times \text{old\_pixel} + \text{offset}$ where $M$ is a 3×3 matrix.
- **Projection**: Imagine casting a shadow. When we "project" a color onto gray, we find its grayscale equivalent—like asking "what shade of gray is this color?" Projections preserve some properties (like brightness) while removing others (like color).
- **Gamma encoding**: Your screen doesn't show light linearly. Dark values get "stretched out" so human eyes perceive brightness steps evenly. sRGB uses a curve that approximates $\text{encoded} \approx \text{linear}^{1/2.4}$.

### Why We Work in Gamma-Encoded Space (Critical Design Decision)

**The big question**: Should we convert pixels to "linear-light" (true physical brightness) or work with them as-is (gamma-encoded for display)?

**We work in gamma-encoded space** (the pixels as they come from the canvas) for good reasons:

1. **It's Already There**: When we call `getImageData()`, we get gamma-encoded RGB values (0-255). If we wanted linear-light, we'd have to:
   - Decode every pixel: `linear = decode(gamma_encoded)`
   - Process in linear space
   - Encode back: `gamma = encode(linear)`
   This doubles our computational work!

2. **Everyone Else Does It**: Photoshop, GIMP, and most photo editors work in gamma-encoded space for display-referred edits. Users expect brightness/contrast/saturation to behave like they do in those tools.

3. **Good Enough**: For brightness, contrast, saturation, and hue, working in gamma space looks fine. The perceptual difference from "perfect" linear-space math is tiny for these operations.

**When we make an exception** (optional linear-light mode for saturation):
When you enable `linearSaturation`, we convert to linear-light, do the math there, then convert back. Why? Because saturation involves **mixing** (blending colors with gray). In gamma space, mixing can cause subtle hue shifts—like mixing red and gray might look slightly orange. In linear space, mixing preserves physical energy relationships better, so colors stay truer. But this costs performance, so it's optional.

**The tradeoff:**
- **Default (gamma)**: Fast, matches user expectations, looks good
- **Optional (linear)**: More accurate for mixing operations, but slower

Most users won't notice the difference, so gamma is the sensible default.

### How We Process the Image: Smart Batching

**The big idea**: Some transforms can be combined into one matrix operation. Others must be done pixel-by-pixel. We batch the ones we can for speed!

**Conceptually, what happens**:
Imagine you're applying 5 transforms in order: brightness → contrast → saturation → vibrance → hue. 

**The naive way** (slow):
```
FOR each pixel:
  pixel = apply_brightness(pixel)
  pixel = apply_contrast(pixel)
  pixel = apply_saturation(pixel)
  pixel = apply_vibrance(pixel)  // This one is tricky—different per pixel!
  pixel = apply_hue(pixel)
```
That's 5 operations per pixel.

**The smart way** (fast):
We notice that brightness, contrast, saturation, and hue can all be expressed as matrices that apply the same way to every pixel. So we:
1. Build matrices for brightness, contrast, saturation, hue
2. **Compose them** into one big matrix (like multiplying them together)
3. Apply that one matrix to all pixels = 1 operation instead of 4!
4. Then do vibrance pixel-by-pixel (because it's adaptive)

**Pseudocode**:
```
Scan through the transform order:
  WHILE we see matrix-compatible transforms (brightness, contrast, saturation, hue):
    Build their matrices
    Combine them into one matrix
    
  WHEN we hit a per-pixel transform (vibrance):
    First, apply the batched matrix to all pixels
    Then, apply vibrance pixel-by-pixel (each pixel needs its own calculation)
```

**Why this works**: Matrix composition is just math—if transform 1 is $M_1$ and transform 2 is $M_2$, doing both is $M_2 \times M_1$. We combine them ahead of time.

**Key insight: Saturation is NOT per-pixel**
Saturation uses the same formula for every pixel: `new_color = gray * (1-S) + original_color * S` where gray is computed from the original color. This can be expressed as a single matrix that works for all pixels. Only vibrance is truly per-pixel because it adapts based on each pixel's saturation level.

### Brightness Adjustment: Just Add a Number

**What it does**: Makes the image brighter or darker by adding (or subtracting) the same amount to every color channel.

**The simple idea**: 
- If brightness is +20, add 20 to Red, Green, and Blue
- If brightness is -30, subtract 30 from each channel
- Middle gray (128) becomes lighter or darker gray

**Mathematical formula**:
For each channel:
$$R' = R + b, \quad G' = G + b, \quad B' = B + b$$

Or in vector form:
$$\mathbf{r}' = \mathbf{r} + b\mathbf{1}$$

where $b$ is the brightness offset and $\mathbf{1} = [1, 1, 1]^T$ (we add the same $b$ to all three channels).

**Matrix form** (for batching):
$$\mathbf{r}' = I\mathbf{r} + b\mathbf{1}$$

where $I$ is the identity matrix (leaves colors unchanged) and we add $[b, b, b]^T$ as an offset.

**Why we do this in gamma space**:
Brightness is a "display-referred" adjustment—users expect it to behave like adding light in Photoshop. Adding to gamma-encoded values gives exactly that effect. If we converted to linear-light first, we'd need nonlinear adjustments that feel weird and don't match user expectations.

**Example**:
- Original pixel: `[100, 150, 200]` (dark blue-green)
- Brightness +50: `[150, 200, 250]` → `[150, 200, 255]` (clamped to max 255)
- Result: Brighter, more vibrant blue-green

**Code**:
```40:49:ImageLab/src/components/ImageCanvas.tsx
const buildBrightnessMatrix = (value: number): { matrix: number[]; offset: number[] } => {
  const matrix = [1, 0, 0, 0, 1, 0, 0, 0, 1]; // Identity—colors unchanged by matrix
  const offset = [value, value, value]; // Add brightness to all channels
  return { matrix, offset };
};
```

**Important**: Results are clamped to [0, 255]. Values that go above 255 become pure white; values below 0 become pure black.

### Contrast Adjustment: Stretching the Brightness Range

**What it does**: Makes dark areas darker and bright areas brighter (increase contrast) or brings everything closer to middle gray (decrease contrast).

**The rubber band analogy**: 
Imagine your image's brightness levels as a rubber band stretched from 0 (black) to 255 (white). Middle gray is 128. Contrast adjustment either:
- **Stretches** the band (contrast > 1): Dark pixels get darker, bright pixels get brighter
- **Compresses** the band (contrast < 1): Everything moves toward middle gray, less difference

**The key insight**: Middle gray (128) stays fixed. Everything else moves away from or toward it.

**Mathematical formula**:
For each channel:
$$R' = 128 + (R - 128) \times c$$

Rearranging:
$$R' = c \times R + 128(1 - c)$$

where $c$ is the contrast factor:
- $c = 1$: No change
- $c > 1$: Increase contrast (e.g., $c = 2$ doubles the distance from 128)
- $c < 1$: Decrease contrast (e.g., $c = 0.5$ halves the distance from 128)

**Why middle gray (128) stays fixed**: 
When $R = 128$: $R' = 128 + (128 - 128) \times c = 128$. Middle gray never changes!

**Example with numbers**:
Let's use contrast $c = 2$ (high contrast):
- Dark pixel: $R = 50$
  - $R' = 128 + (50 - 128) \times 2 = 128 + (-78) \times 2 = 128 - 156 = -28$
  - Clamped to 0 (pure black) ✓
- Bright pixel: $R = 200$
  - $R' = 128 + (200 - 128) \times 2 = 128 + 72 \times 2 = 128 + 144 = 272$
  - Clamped to 255 (pure white) ✓

See how darks got darker and brights got brighter? That's contrast!

**Matrix form** (for batching):
$$\mathbf{r}' = cI\mathbf{r} + 128(1-c)\mathbf{1}$$

The matrix $cI$ scales each channel by $c$, and the offset $128(1-c)$ shifts to keep middle gray fixed.

**Why gamma space**: 
The midpoint 128 is defined in display-referred terms (middle gray on your screen). Scaling around 128 in gamma space gives the expected perceptual effect that matches Photoshop and other tools.

**Code**:
```53:62:ImageLab/src/components/ImageCanvas.tsx
const buildContrastMatrix = (value: number): { matrix: number[]; offset: number[] } => {
  const matrix = [value, 0, 0, 0, value, 0, 0, 0, value]; // Scale each channel by c
  const offset = [128 * (1 - value), 128 * (1 - value), 128 * (1 - value)]; // Shift to preserve 128
  return { matrix, offset };
};
```

### Saturation Adjustment: Blending Color with Gray

**What it does**: Changes how vibrant or colorful an image looks. Think of it as a slider between the original colorful image and its grayscale version.

**The intuitive idea**:
Imagine mixing paint. You have a colorful red pixel `[200, 50, 50]`. You also have its grayscale version (just brightness, no color). Saturation is like asking: "How much of the original color should I keep, versus how much gray?"

**Two-step process**:
1. **Find the grayscale version**: Calculate how bright the color is (luminance)
2. **Mix them together**: `new_color = gray × (1 - S_f) + original_color × S_f`

**Finding the grayscale version**:
The grayscale equivalent isn't just `(R+G+B)/3`. Our eyes perceive green as brighter than blue. So we use weighted averages:

$$L = 0.2126R + 0.7152G + 0.0722B$$

This is the **sRGB luminance** formula. Notice green gets the biggest weight (0.7152) because our eyes are most sensitive to it. Then `gray = [L, L, L]`—all three channels become the same luminance value.

**Why Rec.709 weights (0.2126, 0.7152, 0.0722)?**

1. **Modern standard**: Rec.709 is the current standard for HDTV and sRGB displays (1990). Rec.601 (0.299, 0.587, 0.114) is from 1982 for old TV systems.
2. **Matches your display**: Rec.709 weights match how modern computer monitors actually work with sRGB primaries. Using Rec.601 would give slightly wrong brightness estimates.
3. **Industry standard**: Photoshop, modern tools use Rec.709 for sRGB. We match that.
4. **Better accuracy**: Rec.709 was optimized for modern displays and gives better perceptual uniformity.

**The mixing formula**:
$$\text{new\_RGB} = L_{\text{gray}} \times (1 - S_f) + \text{original\_RGB} \times S_f$$

where:
- $L_{\text{gray}} = [L, L, L]$ (the grayscale version)
- $S_f$ is the saturation factor
  - $S_f = 0$: Pure grayscale (monochrome image)
  - $S_f = 1$: Original color (unchanged)
  - $S_f > 1$: **Oversaturated** (more vibrant than original)
  - $S_f < 1$: Desaturated (closer to gray)

**What this means**:
- When $S_f = 0$, every pixel becomes its grayscale version—you get a black and white image
- When $S_f = 1$, colors stay as they are
- When $S_f = 0.5$, you're halfway between color and gray (pale colors)
- When $S_f = 2$, you push colors further from gray (very vibrant, but can look artificial)

**Example**:
Original pixel: `[200, 50, 50]` (bright red)
- Luminance: $L = 0.2126 \times 200 + 0.7152 \times 50 + 0.0722 \times 50 = 42.52 + 35.76 + 3.61 = 81.89$
- Gray version: `[82, 82, 82]` (medium gray)
- With $S_f = 0.5$ (half saturation):
  - $R' = 82 \times 0.5 + 200 \times 0.5 = 141$
  - $G' = 82 \times 0.5 + 50 \times 0.5 = 66$
  - $B' = 82 \times 0.5 + 50 \times 0.5 = 66$
  - Result: `[141, 66, 66]` (muted red, closer to gray)

**Why saturation is matrix-compatible (not per-pixel)**:

The formula `new_RGB = gray × (1-S) + original_RGB × S` applies the same way to every pixel. For any saturation value $S$, we can derive a single matrix that works for all pixels. This means we can batch saturation with other transforms!

**Expanding the formula to see the matrix**:

For the R channel, let's expand:
$$R' = L \times (1-S) + R \times S$$

But $L = 0.2126R + 0.7152G + 0.0722B$, so:
$$R' = (0.2126R + 0.7152G + 0.0722B)(1-S) + R \times S$$
$$R' = R(0.2126 + (1-0.2126)S) + G \times 0.7152(1-S) + B \times 0.0722(1-S)$$

Similar math for G and B gives us a 3×3 matrix that we can apply to any pixel:
$$M_S = \begin{bmatrix}
w_R + (1-w_R)S & w_G(1-S) & w_B(1-S) \\
w_R(1-S) & w_G + (1-w_G)S & w_B(1-S) \\
w_R(1-S) & w_G(1-S) & w_B + (1-w_B)S
\end{bmatrix}$$

where $w_R = 0.2126$, $w_G = 0.7152$, $w_B = 0.0722$.

**Special case: Saturation = 0 (pure grayscale)**:

When $S = 0$ (remove all color), the matrix simplifies:
$$M_0 = \begin{bmatrix}
0.2126 & 0.7152 & 0.0722 \\
0.2126 & 0.7152 & 0.0722 \\
0.2126 & 0.7152 & 0.0722
\end{bmatrix}$$

This is a **projection matrix**—it projects any color onto the gray axis. Every row is the same (the Rec.709 weights), meaning all three channels become the same luminance value.

**What "projection" means**: 
Imagine a 3D space where R, G, B are axes. Colors form a cube. The gray axis is the line where R=G=B (like a diagonal through the cube). When we "project" a color onto gray, we're finding the closest point on that line—its grayscale equivalent. This preserves perceptual brightness while removing color information.

**Why this works mathematically**:
- If you apply the projection twice, you get the same result: $M_0^2 = M_0$ (idempotent)
- This is the unique way to remove chroma while preserving luminance

**Code:**
```68:95:ImageLab/src/components/ImageCanvas.tsx
const buildSaturationMatrixGamma = (saturation: number): number[] => {
  if (saturation === 1) return [1, 0, 0, 0, 1, 0, 0, 0, 1]; // Identity
  
  const wR = 0.2126, wG = 0.7152, wB = 0.0722; // Rec.709 sRGB luminance weights
  const s = saturation;
  
  return [
    wR + (1 - wR) * s, wG * (1 - s), wB * (1 - s),
    wR * (1 - s), wG + (1 - wG) * s, wB * (1 - s),
    wR * (1 - s), wG * (1 - s), wB + (1 - wB) * s
  ];
};
```

**Why we use gamma-encoded by default:**
1. **Speed**: No conversion needed—work directly with the values we get from the canvas
2. **Matches standards**: Rec.709 weights are correct for sRGB displays even in gamma space
3. **User expectations**: Matches Photoshop and other modern tools

**Optional linear-light mode** (when `linearSaturation` is enabled):
For ultimate accuracy, we can convert to linear-light, do the math there, then convert back. This preserves physical energy relationships better when mixing colors. The formula is the same, just computed in linear space:

$$Y_{\text{linear}} = 0.2126R_l + 0.7152G_l + 0.0722B_l$$

Then: `new_RGB = Y + S × (original_RGB - Y)`

This reduces subtle hue shifts that can occur when mixing in gamma space. But it's slower, so it's optional.

### Vibrance: Smart Saturation (Adaptive Per-Pixel)

**What vibrance does differently**: Unlike saturation (which applies the same boost to all colors), vibrance is **smart**—it boosts dull colors more than already-vibrant ones. This prevents over-saturation and protects skin tones.

**The problem with regular saturation**:
If you boost saturation on an image with people, skin tones can turn orange. Sky and water can look fake. Vibrance solves this by being selective.

**How vibrance works**:

**Step 1: Estimate how colorful each pixel already is**
For each pixel, we make a quick guess about its saturation level:
$$\hat{s} = \frac{\max(R, G, B) - \min(R, G, B)}{\max(R, G, B)}$$

- $\hat{s} = 0$: Already gray (R = G = B)
- $\hat{s} \approx 1$: Very saturated (one channel dominates)

**Step 2: Calculate an adaptive boost factor**
$$f = 1 + V \times (1 - \hat{s})$$

where $V$ is your vibrance slider value:
- $V = 0$: $f = 1$ (no change)
- $V > 0$: Boost colors, but more for dull ones
- $V < 0$: Desaturate, but more gently for dull colors

**The smart part**: 
- Dull color ($\hat{s} = 0.2$): $f = 1 + V \times 0.8$ → gets a big boost
- Already vibrant ($\hat{s} = 0.9$): $f = 1 + V \times 0.1$ → gets a small boost
- Gray ($\hat{s} = 0$): $f = 1 + V$, but since it's already gray, there's nothing to boost!

**Step 3: Apply adaptive saturation**
$$\text{new\_RGB} = \text{gray} + f \times (\text{original\_RGB} - \text{gray})$$

This is the same blending formula as saturation, but with a factor $f$ that adapts per pixel!

**Example with numbers**:
Original pixel: `[200, 195, 190]` (pale, near-gray red)
- Saturation estimate: $\hat{s} = (200 - 190) / 200 = 0.05$ (very low, dull)
- Vibrance $V = 0.5$ (moderate boost)
- Factor: $f = 1 + 0.5 \times (1 - 0.05) = 1 + 0.475 = 1.475$ (big boost!)
- Gray: $L = 0.2126 \times 200 + 0.7152 \times 195 + 0.0722 \times 190 = 194.5$
- Result: `gray + 1.475 × (original - gray)` → More vibrant red

Compare to a saturated pixel: `[255, 50, 50]` (bright red)
- Saturation estimate: $\hat{s} = (255 - 50) / 255 = 0.80$ (already vibrant)
- Same vibrance $V = 0.5$
- Factor: $f = 1 + 0.5 \times (1 - 0.80) = 1 + 0.1 = 1.1$ (small boost)
- Result: Gets a gentle boost, but doesn't oversaturate

**Why vibrance cannot be batched (must be per-pixel)**:

The factor $f$ depends on each pixel's saturation estimate $\hat{s}(\mathbf{r})$. Since different pixels have different $\hat{s}$ values, they need different factors $f$. You can't express this as a single matrix that works for all pixels.

**Proof**: Suppose vibrance could be a global matrix $M$. Then a dull pixel ($\hat{s} = 0$) would get factor $f = 1+V$, and a vibrant pixel ($\hat{s} \approx 1$) would get $f \approx 1$. But a single matrix $M$ applies the same transformation to both, contradicting the adaptive behavior we want.

**Code:**
```194:210:ImageLab/src/components/ImageCanvas.tsx
const applyVibranceGamma = (rgb: RGB, vibrance: number): RGB => {
  if (vibrance === 0) return rgb;
  const R = rgb.r, G = rgb.g, B = rgb.b;
  const maxC = Math.max(R, G, B), minC = Math.min(R, G, B);
  const sEst = maxC === 0 ? 0 : (maxC - minC) / maxC; // ŝ estimate
  const f = 1 + vibrance * (1 - sEst); // Adaptive factor
  const gray = 0.2126 * R + 0.7152 * G + 0.0722 * B; // Rec.709 sRGB luminance
  if (R === G && G === B) return { r: R, g: G, b: B }; // Already gray, invariant
  return { r: clamp(gray + (R - gray) * f), g: clamp(gray + (G - gray) * f), b: clamp(gray + (B - gray) * f) };
};
```

**Why gamma-encoded by default**:
Since vibrance is already per-pixel (slower than matrix operations), adding sRGB↔linear conversion would make it even slower. The saturation estimate works fine in gamma space for the adaptive effect we want.

**Why gray pixels stay gray**:
If a pixel is already gray `[g, g, g]`, then:
- The saturation estimate $\hat{s} = 0$ (it's gray!)
- The factor $f = 1 + V$, but...
- The formula is: `new = gray + f × (original - gray)`
- Since `original - gray = [0, 0, 0]` (they're the same!), multiplying by anything gives zero
- So: `new = gray + 0 = gray` ✓

Gray pixels are **invariant** under vibrance—they never change, which is exactly what we want!

### Hue Rotation: Spinning Colors Around the Gray Axis

**What it does**: Shifts all colors around the color wheel while keeping grays unchanged. Reds might become oranges, blues might become purples, but gray stays gray.

**The 3D rotation idea**:
Think of RGB space as a 3D cube. The gray axis is the diagonal line from black `[0,0,0]` through middle gray `[128,128,128]` to white `[255,255,255]`. When we rotate colors around this axis, we're spinning them in a circle while keeping the same distance from the gray line. This changes hue but preserves brightness and saturation (roughly).

**Why this works**:
If you rotate a point around an axis, points ON the axis don't move. So grays (which are on the gray axis) stay gray. Colors off the axis rotate, changing their hue.

**Mathematical approach: Rodrigues' rotation formula**

To rotate by angle $\theta$ around axis $\mathbf{u}$ (the gray axis), we use:
$$R(\theta, \mathbf{u}) = \cos\theta \cdot I + (1-\cos\theta)(\mathbf{u}\mathbf{u}^T) + \sin\theta \cdot [\mathbf{u}]_\times$$

where:
- $I$: Identity matrix (does nothing)
- $\mathbf{u}\mathbf{u}^T$: Outer product (projects onto the axis)
- $[\mathbf{u}]_\times$: Cross-product matrix (rotates perpendicular to axis)

**For the gray axis**: $\mathbf{u} = \frac{1}{\sqrt{3}}[1, 1, 1]^T$ (the normalized diagonal)

**After simplifying**, the rotation matrix becomes:
$$R(\theta) = \begin{bmatrix}
c + \frac{1-c}{3} & \frac{1-c}{3} - \frac{s}{\sqrt{3}} & \frac{1-c}{3} + \frac{s}{\sqrt{3}} \\
\frac{1-c}{3} + \frac{s}{\sqrt{3}} & c + \frac{1-c}{3} & \frac{1-c}{3} - \frac{s}{\sqrt{3}} \\
\frac{1-c}{3} - \frac{s}{\sqrt{3}} & \frac{1-c}{3} + \frac{s}{\sqrt{3}} & c + \frac{1-c}{3}
\end{bmatrix}$$

where $c = \cos\theta$ and $s = \sin\theta$.

**Why grays stay gray (intuitive proof)**:

Any gray color is a multiple of the rotation axis: `[g, g, g] = g × [1, 1, 1]`. When you rotate around an axis, points ON the axis don't move (by definition of rotation). So gray pixels become... gray pixels! The rotation only affects colors that are off the gray axis.

**Example**:
- Original: `[255, 0, 0]` (pure red)
- Rotate 60°: Becomes something like `[128, 255, 0]` (yellow-green)
- But `[128, 128, 128]` (gray) → stays `[128, 128, 128]`

**Code:**
```98:123:ImageLab/src/components/ImageCanvas.tsx
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

**Why gamma-encoded**: Hue rotation is a geometric operation—we're spinning colors in 3D RGB space. The rotation preserves the relative relationships between colors regardless of whether they're gamma-encoded or linear. Working in gamma space is fine and matches what other tools do.

### Matrix Composition: Combining Multiple Transforms

**Why we do this**: Instead of applying 5 transforms sequentially (5 operations per pixel), we combine them into one matrix (1 operation per pixel). Much faster!

**The idea**:
If transform 1 is: `pixel' = M1 × pixel + offset1`
And transform 2 is: `pixel'' = M2 × pixel' + offset2`

Then doing both is:
$$\text{pixel}'' = M_2(M_1 \times \text{pixel} + \text{offset}_1) + \text{offset}_2$$
$$= (M_2M_1) \times \text{pixel} + (M_2 \times \text{offset}_1 + \text{offset}_2)$$

So the combined transform is:
- Matrix: $M_{\text{combined}} = M_2 \times M_1$ (multiply the matrices)
- Offset: $\text{offset}_{\text{combined}} = M_2 \times \text{offset}_1 + \text{offset}_2$ (transform the first offset through the second matrix, then add)

**For $n$ transforms in sequence**:
We multiply all matrices together and chain all the offsets:
- $M_{\text{composed}} = M_n \times M_{n-1} \times \cdots \times M_1$
- $\text{offset}_{\text{composed}} = M_n \times \cdots \times M_2 \times \text{offset}_1 + M_n \times \cdots \times M_3 \times \text{offset}_2 + \cdots + \text{offset}_n$

**The speed gain**: 
Instead of doing $n$ matrix multiplications per pixel, we:
1. Compose matrices once (before the loop)
2. Apply the single composed matrix to all pixels

For an image with 1 million pixels and 4 transforms:
- Naive: 4 million operations
- Batched: 1 million operations (after one-time composition)

**Code:**
```235:286:ImageLab/src/components/ImageCanvas.tsx
const composeAffineTransforms = (transforms: Array<{ matrix: number[]; offset: number[] }>): { matrix: number[]; offset: number[] } => {
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
    
    // M_composed = M2 * M1 (matrix multiplication)
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
    
    // o_composed = M2 * o1 + o2 (offset transformation)
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

**Why this is fast**: Instead of doing 5 matrix operations per pixel, we compose them once and do 1 operation per pixel. For a million-pixel image, that's 5 million operations → 1 million operations. Big speedup!

### Summary: The Big Picture

**How we work with pixels (gamma vs linear)**:
- **Default (gamma-encoded)**: Fast, matches what users expect from Photoshop, looks great
  - Used for: Brightness, contrast, saturation, hue, vibrance
  - Why: No conversion needed, works directly with canvas values
- **Optional (linear-light)**: More accurate for mixing colors, but slower
  - Used for: Saturation and vibrance (when enabled)
  - Why: Better preserves physical energy relationships when blending colors with gray

**How we process transforms (batching)**:
- **Matrix-compatible** (can be batched): Brightness, contrast, saturation, hue
  - These use the same formula for every pixel, so we can combine them into one matrix
  - Result: 4 operations → 1 operation per pixel
- **Per-pixel** (cannot be batched): Vibrance, optional linear-saturation
  - These adapt based on each pixel's properties, so each pixel needs its own calculation
  - Result: Must be done individually, but we still batch the matrix transforms before and after

**Key insight: Saturation is NOT per-pixel!**
Many people think saturation is per-pixel because it computes gray from each pixel. But the formula `new = gray × (1-S) + original × S` applies the same way to all pixels. We can express this as a single matrix $M_S$ that works for everyone. Only vibrance is truly per-pixel because its boost factor adapts per pixel.

**The projection trick (saturation = 0)**:
When saturation is zero, we project every color onto the gray axis (its grayscale equivalent). This is a mathematical projection—each color maps to a single gray value. The projection matrix has every row the same (the Rec.709 weights), so all channels become the same luminance.

**Gray invariance**:
Both saturation and vibrance preserve gray pixels. If a pixel is already `[g, g, g]`, applying saturation or vibrance leaves it unchanged. This is by design—gray has no color to saturate!

**Bottom line**: We balance speed (gamma + batching), accuracy (optional linear), and correctness (proper math). For most users, the default settings are fast and look great. Power users can enable linear mode for ultimate accuracy.
