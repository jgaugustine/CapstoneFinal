# Bit Depth Visualizer Math Notes

## 1. Quantization Model

### 1.1 Setup

Let an sRGB pixel be \( \mathbf{p} = [R, G, B]^T \) with channel values in \([0, 255]\). Define gamma-space luminance \(L = 0.299 R + 0.587 G + 0.114 B\). For a chosen bit depth \(b \in \{1,\dots,16\}\), the number of levels is \(K = 2^b\) and the step size is \(\Delta = 256 / K\).

### 1.2 Scalar Quantization

Quantized luminance \(L_q\) is computed by
\[
L_q = \left\lfloor \frac{L}{\Delta} \right\rfloor \Delta.
\]
The bucket index is \(k = \lfloor L / \Delta \rfloor \in \{0, \dots, K-1\}\). Error per pixel is
\[
e_L = L_q - L, \quad |e_L| < \Delta.
\]

### 1.3 Back-Projection to RGB

We scale the RGB channels by a common factor
\[
f = \frac{L_q}{L + \epsilon},
\]
with \(\epsilon\) preventing division by zero. The processed pixel is
\[
\mathbf{p}_q = f \cdot \mathbf{p} \quad \text{clamped to } [0, 255].
\]
This preserves chroma ratios while matching the quantized luminance.

## 2. Histogram

We accumulate a 256-bin histogram on \(L_q\):
\[
H[i] = \#\{ \text{pixels with } \lfloor L_q \rfloor = i \}.
\]
Narrow peaks reveal quantization buckets; peak spacing is \(\Delta\).

## 3. Band Edge Detection

### 3.1 Processed vs. Original Sobel

We form luminance arrays for the original \(L_{\text{orig}}\) and processed \(L_{\text{proc}}\). Sobel magnitude for an image \(X\) is
\[
S_X = |G_x| + |G_y|,
\]
with standard 3×3 Sobel kernels. We then take a per-pixel edge lift
\[
D = \max(0, S_{\text{proc}} - S_{\text{orig}}).
\]
When bit depth is not reduced, \(L_{\text{proc}} = L_{\text{orig}}\) and \(D = 0\).

### 3.2 Band Mask

Bucket boundaries are detected by checking 4-neighbor bucket changes in \(k\). A pixel is marked boundary if any neighbor has a different bucket index. The final edge mask is
\[
M = \text{dilate}\big( \mathbf{1}[D \ge \tau] \odot \mathbf{1}[\text{bucket change}] \big),
\]
where \(\tau = 0.14 \cdot \max(D)\) and dilation is 3×3. Mask pixels are overlaid with an auto-chosen high-contrast color (yellow, magenta, or cyan).

## 4. Bit Depth Limits

Uploaded PNG bit depth is detected from IHDR; the slider upper bound is \(\min(16, b_{\text{orig}})\). If \(b \ge b_{\text{orig}}\), quantization is bypassed and edges are skipped.

## 5. Performance Notes

- Canvas contexts use `willReadFrequently: true` where heavy `getImageData` occurs.
- All math stays in gamma space for speed; luminance weights follow Rec.601.

## 6. Overlay Color Selection

To keep edges visible on varied content, we pick the overlay color by maximizing Euclidean distance from the image mean color. Let \(\bar{\mathbf{p}} = [\bar{R}, \bar{G}, \bar{B}]\) be the per-channel average over processed pixels. Candidates are \(c_1 = [255, 215, 0]\) (yellow), \(c_2 = [255, 0, 255]\) (magenta), \(c_3 = [0, 255, 255]\) (cyan). Choose
\[
c^* = \arg\max_{c_i} \|c_i - \bar{\mathbf{p}}\|_2^2.
\]
The overlay blends as \(\mathbf{p}_{\text{out}} = (1-\alpha)\mathbf{p}_{\text{in}} + \alpha c^*\) with \(\alpha = 0.6\).

## 7. Interaction Rules

- If the uploaded bit depth is \(b_{\text{orig}}\), the slider upper bound is \(\min(16, b_{\text{orig}})\). When the user selects \(b \ge b_{\text{orig}}\), quantization and edge overlay are skipped and the processed canvas matches the original.
- The edge overlay is gated by a checkbox; when off, only the quantized image renders.
- Bucket boundaries rely on per-pixel bucket indices; edges require both a bucket change and Sobel lift above threshold to avoid false positives from original texture.

## 8. Failure Modes and Mitigations

- Near-zero luminance can cause division artifacts in the scaling step; we clamp the denominator with a small \(\epsilon\).
- If maxDiff is zero (uniform images), the edge mask stays empty and no overlay draws.
- Very low bit depths (e.g., \(b = 1\)) can saturate the histogram; the overlay still aligns to bucket transitions because the mask keys on bucket changes, not histogram shape.

