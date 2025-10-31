## ImageLab – Key Challenges and Solutions

### 1) Real-time, accurate color math across multiple edits
- **Challenge**: Implement brightness, contrast, saturation (sRGB vs linear), vibrance, and hue so the preview, math, and examples are consistent and numerically stable.
- **Solution**:
  - Centralized the math inside `ImageLab/src/components/MathExplanation.tsx` and mirrored the same logic in `ImageLab/src/components/RGBCubeVisualizer.tsx` and `ImageLab/src/components/ImageCanvas.tsx`.
  - Added explicit conversions for linear-light operations to avoid gamma errors and kept sRGB operations separate.

### 2) Visualizing color transforms intuitively in 3D
- **Challenge**: Show how a pixel’s RGB vector changes (addition, scaling, interpolation to gray, rotation) in a way that’s easy to grasp.
- **Solution**:
  - Built `RGBCubeVisualizer` to render the RGB cube and arrows for original and transformed vectors.
  - Mode-specific helpers depict: addition (brightness), midpoint scaling (contrast), gray interpolation (saturation/vibrance), rotation arc (hue).

### 3) Using the clicked pixel as the math example
- **Challenge**: Keep the numeric examples in the math tabs synchronized with the user’s selected pixel.
- **Solution**:
  - Threaded `selectedRGB` from `ImageCanvas` up to `Index` and into `MathExplanation` and `RGBCubeVisualizer`.
  - Replaced hard-coded example vectors with computed values based on `selectedRGB`.

### 4) Performance and responsiveness with high-DPI and interaction
- **Challenge**: Maintain smooth interactions (drag/zoom) and crisp rendering across devices while projecting 3D to 2D.
- **Solution**:
  - Used device-pixel-ratio aware canvas sizing and lightweight 3D math with cached projections.
  - Kept draw routines minimal and scoped to state that actually changes (yaw, pitch, zoom, params).

### 5) Consistent hue rotation math
- **Challenge**: Implement a luminance-preserving hue rotation in RGB space that matches the derivation shown in the UI.
- **Solution**:
  - Implemented the 3×3 matrix `M(θ) = B · R(θ) · Bᵀ` with diagonals `cosθ + (1−cosθ)/3` and off-diagonals `(1/3)(1−cosθ) ± √(1/3)·sinθ` in both the visualizer and the math panels.

### 6) Clear separation of sRGB vs linear-light saturation
- **Challenge**: Users often conflate saturation in display (gamma) space and in linear radiometric space.
- **Solution**:
  - Added an explicit toggle for “Compute saturation in linear color space,” switching weights and conversions.
  - Displayed both paths with step-by-step numeric breakdowns to show their differences.

### 7) Keeping UI explanations readable but rigorous
- **Challenge**: Present math that is accurate without overwhelming the user.
- **Solution**:
  - Organized each tab with a brief concept summary, a compact formula block, and a concise numeric example sourced from `selectedRGB`.
  - Used consistent typography and code-like formatting for matrices and equations.

### 8) Ensuring state resets are predictable (cross-project lesson)
- **Challenge**: In long-running interactions, stale state can block new runs (e.g., simulations not starting or visualizations not updating).
- **Solution**:
  - Standardized start/reset handlers to clear transient state, reset clocks/counters, and ensure the first frame/time-window is processed.

### Key Files
- `ImageLab/src/pages/Index.tsx` – wires image, sliders, selected pixel, and math panel.
- `ImageLab/src/components/ImageCanvas.tsx` – applies the edit pipeline to the image.
- `ImageLab/src/components/MathExplanation.tsx` – tabbed math with live examples from `selectedRGB`.
- `ImageLab/src/components/RGBCubeVisualizer.tsx` – reusable 3D visualization for all edits.


