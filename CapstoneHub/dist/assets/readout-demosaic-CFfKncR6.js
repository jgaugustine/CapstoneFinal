const e=`# Readout & Demosaicing: From Raw Sensor to Full-Color Image

**Readout** converts charge to digital values; **demosaicing** reconstructs full RGB from the CFA mosaic. Together they turn raw sensor data into a viewable image.

## The relationship

- **ISO** is analog or digital gain—it amplifies what you already have. Shot noise scales with √signal; ISO gain amplifies both equally, so SNR doesn't improve.
- **Read noise** is fixed. At high ISO, signal and shot noise dominate; at base ISO, read noise can matter more in shadows.
- **Demosaicing** interpolates missing colors at each pixel. Simpler algorithms are faster but create artifacts (zipper, false color); edge-aware methods preserve sharpness.

## Practical implications

- Prefer **longer shutter** or **wider aperture** when possible to collect more photons before readout.
- Base ISO typically gives the best SNR when you have enough light.
- Simpler demosaic algorithms: faster, more artifacts. Edge-aware and proprietary RAW processors balance quality and compute.

*Check out the labs to explore quantization, readout, and demosaicing.*
`;export{e as default};
