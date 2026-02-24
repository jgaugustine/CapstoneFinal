# Demosaicing Algorithms

Raw sensor data is a mosaic: each pixel has only one color (R, G, or B). **Demosaicing** reconstructs full RGB at every pixel by interpolating from neighbors.

## Common algorithms

- **Nearest neighbor**: Copy from nearest same-color pixel. Fast, blocky.
- **Bilinear**: Average neighbors. Simple, some blur.
- **Edge-aware (e.g., Niu, Lien)**: Preserve edges, reduce color fringing.
- **Residual / learning-based**: Higher quality, more compute.

## Tradeoffs

- Simpler algorithms: faster, more artifacts (zipper, false color).
- Edge-aware: better sharpness, some wormy texture risk.
- RAW processors (Adobe, Capture One) use proprietary algorithms.

*Explore DemosaicLab to compare algorithms on real and synthetic images.*
