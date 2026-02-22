# Metering and Auto Exposure

After demosaicing, the camera (or raw processor) applies **exposure** and **tone mapping**. Auto exposure (AE) decides shutter, aperture, and ISO to hit a target brightness.

## Metering modes

- **Matrix/Evaluative**: Weights the whole frame, often with scene recognition.
- **Center-weighted**: Emphasizes the center.
- **Spot**: Measures a small region (e.g., focus point).

## How AE works

1. Compute weighted luminance from the metered region.
2. Compare to a target (e.g., mid-gray at 18%).
3. Choose EV adjustment (ΔEV) and allocate to shutter, aperture, ISO.

**AE priorities** (highlight vs. shadow tolerance) determine how much clipping is allowed. Conservative AE protects highlights; aggressive AE brightens shadows but may clip.

*Explore ExposureLAB to see metering modes and AE in action.*
