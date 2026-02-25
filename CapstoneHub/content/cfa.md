# Color Filter Arrays: Bayer, X-Trans, and Foveon

Most sensors capture one color per pixel using a **color filter array (CFA)**. The raw image is a mosaic; demosaicing reconstructs full RGB.

## Common CFAs

- **Bayer**: 2×2 pattern (RGGB). Simple, widely used. Demosaicing is well-studied.
- **X-Trans**: 6×6 pattern (Fujifilm). Aims to reduce moiré and improve color. Different demosaicing challenges.
- **Foveon**: Stacked layers capture R, G, B at each pixel. No demosaicing, but other tradeoffs.

## Tradeoffs

- Bayer: Mature algorithms, predictable artifacts.
- X-Trans: Potential for better acuity, but artifacts (e.g., wormy textures) if demosaicing is poor.
- In practice, **lens quality and processing** often matter more than CFA choice.

*Explore DemosaicLab to compare CFA patterns and demosaicing algorithms.*
