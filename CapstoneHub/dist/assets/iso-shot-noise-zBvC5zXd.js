const e=`# ISO, Shot Noise, SNR: Why Raising ISO Makes Noise Visible

ISO is **analog or digital gain** applied to the signal after the sensor. It doesn't change how many photons you collect—it amplifies what you already have.

## The relationship

- **Shot noise** scales with the square root of the signal. It's inherent to photon counting.
- **ISO gain** amplifies both signal and shot noise equally. SNR does not improve.
- **Read noise** is fixed. At high ISO, the amplified signal and shot noise dominate; at base ISO, read noise can matter more in deep shadows.

## Practical implications

- Raising ISO does not "add" noise—it makes existing shot noise more visible by boosting the whole signal.
- Prefer **longer shutter** or **wider aperture** when possible to collect more photons.
- Base ISO typically gives the best SNR when you have enough light.

*Check out the labs to explore quantization and readout effects.*
`;export{e as default};
