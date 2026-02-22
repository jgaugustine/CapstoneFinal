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

*Explore PhotonToDigitalConverter to see wells, QE, and charge accumulation.*
