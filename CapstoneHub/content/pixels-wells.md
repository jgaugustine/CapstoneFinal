# Pixels, Wells, and Readout: Architecture and Limits

Each pixel on a sensor is a **photosite**—a well that collects electrons generated when photons are absorbed. The well has a maximum capacity (full well capacity); beyond that, the pixel saturates (clips).

## Pixel architecture

- **Well capacity**: Determines dynamic range. Larger wells hold more electrons before saturation.
- **Pixel size vs. count**: Smaller pixels pack more resolution but have smaller wells, reducing per-pixel SNR.
- **Color filter array (CFA)**: Most sensors use a Bayer, X-Trans, or similar pattern so each pixel captures one color. Demosaicing reconstructs full RGB later.

## Limits

- **Shot noise** dominates in low light.
- **Read noise** from the ADC affects shadow detail.
- **Dark current** adds unwanted electrons during long exposures.

## Metering

Metering determines how the camera weights the scene to decide exposure. **Matrix** (evaluative) weights the whole frame; **center-weighted** emphasizes the center; **spot** measures a small region (e.g., the focus point). AE (auto exposure) uses metering to choose shutter, aperture, and ISO within highlight and shadow tolerances.

*Check out ExposureLAB to explore metering and AE.*
