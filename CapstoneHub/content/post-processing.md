# Post-processing

After demosaicing, the image undergoes **tone mapping** and **color correction** before it reaches the final output. This is distinct from exposure decisions (metering, AE), which happen at capture time.

## What happens here

- **Tone mapping**: Map linear sensor values to display/output gamma; preserve or compress highlights and shadows.
- **Color correction**: White balance, color matrix, creative adjustments.
- **Editing**: Filters, curves, local adjustments—all operate on the post-demosaic image.

*Explore ImageLab for color transforms and the filter pipeline.*
