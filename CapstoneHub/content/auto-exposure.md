# Auto Exposure

Auto exposure (AE) chooses shutter speed, aperture, and ISO to achieve a target brightness. The algorithm evaluates the scene, computes a desired exposure value (EV), and allocates that EV across the three parameters.

## How AE chooses EV

1. **Meter**: Compute weighted luminance from the metered region.
2. **Target**: Compare to mid-gray (e.g., 18% reflectance).
3. **Sweep**: Evaluate candidate EVs for highlight/shadow clipping.
4. **Select**: Pick the best EV within clipping tolerances (ηh, ηs).
5. **Allocate**: Split ΔEV across shutter, aperture, ISO per user preference.

## Priorities

- **Highlight tolerance (ηh)**: Max allowed highlight clipping.
- **Shadow tolerance (ηs)**: Max allowed shadow clipping.
- **Midtone target**: Where the histogram center should land.

*Explore ExposureLAB to run AE with different metering modes and priorities.*
