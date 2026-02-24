# Color Filter Arrays — Bayer, X-Trans, and Foveon

**Color Filter Arrays (CFAs)** sample color spatially—each photosite sees only red, green, or blue. Bayer's 2G:1R:1B layout dominates; X-Trans and Foveon offer different trade-offs for moiré, sharpness, and per-pixel color.

## The relationship

- **Bayer** uses a repeating 2×2 grid. Two green filters per block improve luminance detail; demosaicing interpolates the two missing colors at each pixel.
- **X-Trans** replaces the 2×2 with a 6×6 pseudo-random pattern. Randomness disrupts moiré, but demosaicing is more complex and computationally costly.
- **Foveon** stacks three photodiodes vertically in silicon. Each location captures full RGB—no demosaicing—but color separation and noise in shadows remain challenges.

## Practical implications

- Faint color artifacts along edges in Bayer images are demosaicing artifacts.
- X-Trans files often take longer to import; that's the cost of moiré resistance.
- Foveon excels in optimal conditions; above ISO 800, color noise becomes noticeable.
- In practice, **processing matters more than sensor brand**—modern RAW converters handle all three well.

*Check out DemosaicLab to explore CFA patterns.*
