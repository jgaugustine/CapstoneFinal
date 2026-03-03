export interface VocabTerm {
  id: string;
  term: string;
  aliases?: string[];
  definition: string;
  category: string;
}

/** Vocabulary terms extracted from the article archive. Sorted by term length (longest first) for matching. */
export const VOCAB_TERMS: VocabTerm[] = [
  // Light & Photophysics
  {
    id: "quantum-efficiency",
    term: "quantum efficiency",
    aliases: ["QE"],
    definition:
      "The fraction of incoming photons that successfully free electrons in the sensor. Higher QE means the camera wastes less light.",
    category: "Light & Photophysics",
  },
  {
    id: "photoelectric-effect",
    term: "photoelectric effect",
    definition:
      "When a photon strikes the sensor, it can knock an electron loose. One photon can free one electron—the fundamental signal a camera registers.",
    category: "Light & Photophysics",
  },
  {
    id: "photosites",
    term: "photosites",
    definition:
      "Physical regions on the sensor where photons are converted to electrons. Each photosite is a charge collector; the digital representation is a pixel.",
    category: "Light & Photophysics",
  },
  {
    id: "photon",
    term: "photon",
    definition:
      "A discrete packet of light energy. Photons arrive one by one at random; the camera counts how many reach each photosite.",
    category: "Light & Photophysics",
  },
  {
    id: "pixel",
    term: "pixel",
    definition:
      "The digital representation of the electron count from a photosite in the final image. A pixel is a single number; the photosite is the physical location.",
    category: "Light & Photophysics",
  },

  // Exposure & Metering
  {
    id: "exposure-value",
    term: "exposure value",
    aliases: ["EV"],
    definition:
      "A logarithmic measure of scene brightness. Each +1 EV halves collected light; each −1 EV doubles it. EV ties shutter and aperture together.",
    category: "Exposure & Metering",
  },
  {
    id: "illuminance",
    term: "illuminance",
    definition:
      "Light per unit area at the sensor. Determined by aperture (f-number) and scene brightness.",
    category: "Exposure & Metering",
  },
  {
    id: "f-number",
    term: "f-number",
    definition:
      "The ratio of focal length to aperture diameter (N = f/D). Light at the sensor scales as 1/N².",
    category: "Exposure & Metering",
  },
  {
    id: "matrix-metering",
    term: "matrix metering",
    aliases: ["evaluative metering"],
    definition:
      "Metering mode that weights most of the frame with mild center bias. Analyzes zones, tonality, and sometimes focus distance.",
    category: "Exposure & Metering",
  },
  {
    id: "center-weighted-metering",
    term: "center-weighted metering",
    definition:
      "Metering mode that strongly emphasizes the center with smooth falloff. Classic for portraits and centered subjects.",
    category: "Exposure & Metering",
  },
  {
    id: "spot-metering",
    term: "spot metering",
    definition:
      "Metering mode that restricts measurement to a small circular region. Ignores the rest of the frame.",
    category: "Exposure & Metering",
  },
  {
    id: "subject-based-metering",
    term: "subject-based metering",
    definition:
      "Metering that weights detected faces or subjects. Weights follow a detection mask rather than a fixed pattern.",
    category: "Exposure & Metering",
  },
  {
    id: "weighted-histogram",
    term: "weighted histogram",
    definition:
      "A histogram where each pixel's contribution to its luminance bin is weighted by the metering pattern.",
    category: "Exposure & Metering",
  },
  {
    id: "metering",
    term: "metering",
    definition:
      "The process of reducing the scene to a single representative luminance so the camera can choose exposure. Different modes use different weight functions.",
    category: "Exposure & Metering",
  },

  // Auto Exposure
  {
    id: "auto-exposure",
    term: "auto exposure",
    aliases: ["AE"],
    definition:
      "The system that chooses shutter, aperture, and ISO to produce a \"best\" image under constraints (shutter bounds, aperture limits, highlight/shadow tolerances).",
    category: "Auto Exposure",
  },
  {
    id: "region-of-interest",
    term: "region of interest",
    aliases: ["ROI"],
    definition:
      "The area given higher weight when computing exposure. Can come from metering (center-weighted, spot) or subject detection.",
    category: "Auto Exposure",
  },
  {
    id: "saliency",
    term: "saliency",
    definition:
      "Visual importance or distinctiveness of a region. Saliency-based AE weights \"interesting\" pixels more when building the exposure histogram.",
    category: "Auto Exposure",
  },
  {
    id: "shannon-entropy",
    term: "Shannon entropy",
    definition:
      "A measure of information content. Entropy-based AE chooses the exposure that maximizes the histogram's entropy.",
    category: "Auto Exposure",
  },
  {
    id: "iqr",
    term: "IQR",
    definition:
      "Interquartile range (Q3 − Q1). Used to define outlier fences in AE—pixels outside [Q1 − 1.5×IQR, Q3 + 1.5×IQR] are down-weighted.",
    category: "Auto Exposure",
  },
  {
    id: "exposure-triangle",
    term: "exposure triangle",
    definition:
      "Shutter speed, aperture, and ISO as the three controls that jointly determine exposure, noise, motion blur, and depth of field.",
    category: "Auto Exposure",
  },

  // Sensor & Readout
  {
    id: "full-well-capacity",
    term: "full-well capacity",
    aliases: ["FWC"],
    definition:
      "The maximum number of electrons a photosite can hold before saturating. Exceeding it causes clipping and may cause blooming.",
    category: "Sensor & Readout",
  },
  {
    id: "saturation",
    term: "saturation",
    definition:
      "When a photosite is full and cannot store more charge. Further photons are lost or overflow; the output clips to maximum.",
    category: "Sensor & Readout",
  },
  {
    id: "blooming",
    term: "blooming",
    definition:
      "Overflow of charge from a saturated photosite into neighboring sites. Produces bright streaks or halos around intense light sources.",
    category: "Sensor & Readout",
  },
  {
    id: "readout-chain",
    term: "readout chain",
    definition:
      "The analog pipeline: Reset → Integrate → Sample & Hold (with CDS) → Amplify → ADC. Converts photoelectrons to digital values.",
    category: "Sensor & Readout",
  },
  {
    id: "correlated-double-sampling",
    term: "correlated double sampling",
    aliases: ["CDS"],
    definition:
      "Sampling reset and signal levels, then subtracting. Cancels reset noise and fixed offsets in the readout chain.",
    category: "Sensor & Readout",
  },
  {
    id: "adc",
    term: "ADC",
    definition:
      "Analog-to-digital converter. Converts the amplified voltage from each photosite into a discrete digital value (typically 10–14 bits).",
    category: "Sensor & Readout",
  },
  {
    id: "read-noise",
    term: "read noise",
    definition:
      "Electronic noise introduced by the readout chain. Sets the lower limit on detectable signal; roughly constant in electrons.",
    category: "Sensor & Readout",
  },
  {
    id: "noise-floor",
    term: "noise floor",
    definition:
      "The level below which signal is indistinguishable from random noise. Determined by read noise and, in shadows, shot noise.",
    category: "Sensor & Readout",
  },
  {
    id: "pixel-pitch",
    term: "pixel pitch",
    definition:
      "The physical size of each photosite. Larger pitch usually means larger full-well capacity and better low-light performance.",
    category: "Sensor & Readout",
  },
  {
    id: "conversion-gain",
    term: "conversion gain",
    definition:
      "How many electrons translate to one digital count. Depends on photodiode capacitance and amplifier design. Higher ISO increases effective gain.",
    category: "Sensor & Readout",
  },

  // ISO & Noise
  {
    id: "shot-noise",
    term: "shot noise",
    definition:
      "Random variation in photon (and thus electron) counts. Follows Poisson statistics; variance equals mean. Irreducible—even a perfect sensor has it.",
    category: "ISO & Noise",
  },
  {
    id: "poisson-distribution",
    term: "Poisson distribution",
    definition:
      "The statistical model for photon arrivals. Variance equals mean (σ² = λ), so standard deviation scales as √N.",
    category: "ISO & Noise",
  },
  {
    id: "signal-to-noise-ratio",
    term: "signal-to-noise ratio",
    aliases: ["SNR"],
    definition:
      "For shot noise, SNR = N/σ = √N. More photons improve SNR, but only as the square root of the signal.",
    category: "ISO & Noise",
  },
  {
    id: "base-iso",
    term: "base ISO",
    definition:
      "The lowest ISO where full-well capacity roughly aligns with the ADC's maximum input. Maximizes dynamic range.",
    category: "ISO & Noise",
  },
  {
    id: "analog-gain",
    term: "analog gain",
    definition:
      "The amplifier stage that boosts voltage before digitization. ISO is a label for this gain; it amplifies both signal and noise.",
    category: "ISO & Noise",
  },

  // Bit Depth & Dynamic Range
  {
    id: "bit-depth",
    term: "bit depth",
    definition:
      "The number of discrete intensity levels (2^k for k bits). Governed by ADC resolution; more bits mean finer gradations.",
    category: "Bit Depth & Dynamic Range",
  },
  {
    id: "lsb",
    term: "LSB",
    definition:
      "Least significant bit. The smallest step size; quantization error is bounded by ±½ LSB.",
    category: "Bit Depth & Dynamic Range",
  },
  {
    id: "dynamic-range",
    term: "dynamic range",
    definition:
      "The ratio of brightest recordable signal (saturation) to faintest distinguishable signal (above noise). Often expressed in stops.",
    category: "Bit Depth & Dynamic Range",
  },
  {
    id: "posterization",
    term: "posterization",
    aliases: ["banding"],
    definition:
      "Visible steps in smooth gradients when too few bits represent the tones. Aggressive edits can reveal quantization.",
    category: "Bit Depth & Dynamic Range",
  },
  {
    id: "quantization",
    term: "quantization",
    definition:
      "Mapping a continuous analog signal onto a finite set of digital values. Inevitably introduces rounding error.",
    category: "Bit Depth & Dynamic Range",
  },

  // Color Filter Arrays
  {
    id: "color-filter-array",
    term: "color filter array",
    aliases: ["CFA"],
    definition:
      "The pattern of filters over photosites—each site sees only one color (R, G, or B). Demosaicing fills in the rest.",
    category: "Color Filter Arrays",
  },
  {
    id: "bayer-pattern",
    term: "Bayer pattern",
    definition:
      "A 2×2 repeating grid: one red, one blue, two green. Industry standard; green-heavy because human vision is most sensitive to luminance.",
    category: "Color Filter Arrays",
  },
  {
    id: "x-trans",
    term: "X-Trans",
    definition:
      "Fujifilm's 6×6 CFA pattern. Pseudo-random layout reduces moiré but requires more complex demosaicing.",
    category: "Color Filter Arrays",
  },
  {
    id: "foveon",
    term: "Foveon",
    definition:
      "Stacked photodiodes at different depths capture R, G, B at each location. No mosaic, but color separation and manufacturing are challenging.",
    category: "Color Filter Arrays",
  },

  // Demosaicing
  {
    id: "demosaicing",
    term: "demosaicing",
    aliases: ["CFA interpolation"],
    definition:
      "Estimating the two missing color channels at each pixel from neighboring CFA samples. Turns a mosaic into full RGB.",
    category: "Demosaicing",
  },
  {
    id: "moire",
    term: "moiré",
    definition:
      "Interference patterns when scene detail aliases against the CFA sampling grid. Can produce false colors and maze-like artifacts.",
    category: "Demosaicing",
  },
  {
    id: "false-colors",
    term: "false colors",
    definition:
      "Incorrect colors produced when demosaicing interpolates across edges, blending samples from different objects.",
    category: "Demosaicing",
  },
  {
    id: "zippering",
    term: "zippering",
    definition:
      "Zigzag or staircase artifacts along diagonal edges when demosaicing doesn't align with edge direction.",
    category: "Demosaicing",
  },
  {
    id: "bilinear",
    term: "bilinear",
    definition:
      "Demosaicing that averages same-color neighbors. Simple and fast but tends to blur edges and cause color bleed.",
    category: "Demosaicing",
  },
  {
    id: "edge-aware",
    term: "edge-aware",
    definition:
      "Demosaicing that interpolates along edges rather than across them. Reduces blur and false colors at boundaries.",
    category: "Demosaicing",
  },

  // General
  {
    id: "highlight-clipping",
    term: "highlight clipping",
    aliases: ["blown highlights"],
    definition:
      "When the brightest regions saturate; detail is lost and cannot be recovered. Clipping occurs at the sensor or ADC.",
    category: "General",
  },
  {
    id: "crushed-shadows",
    term: "crushed shadows",
    definition:
      "When shadow detail falls below the noise floor and becomes indistinguishable from black.",
    category: "General",
  },
  {
    id: "raw",
    term: "RAW",
    definition:
      "Minimally processed sensor data. Preserves the full range and bit depth; demosaicing and tone mapping happen in post.",
    category: "General",
  },
  {
    id: "olpf",
    term: "OLPF",
    definition:
      "Optical low-pass filter. Optically blurs the scene before sampling to reduce moiré, at the cost of sharpness.",
    category: "General",
  },
];

/** Map of term (lowercase) and aliases to vocab id for linking. Longest matches first. */
export function buildTermToIdMap(): Map<string, string> {
  const map = new Map<string, string>();
  const byLength = [...VOCAB_TERMS].sort(
    (a, b) => Math.max(b.term.length, ...(b.aliases || []).map((x) => x.length))
      - Math.max(a.term.length, ...(a.aliases || []).map((x) => x.length))
  );
  for (const t of byLength) {
    const key = t.term.toLowerCase();
    if (!map.has(key)) map.set(key, t.id);
    for (const a of t.aliases || []) {
      const ak = a.toLowerCase();
      if (!map.has(ak)) map.set(ak, t.id);
    }
  }
  return map;
}

