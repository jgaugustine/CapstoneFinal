import type { LucideIcon } from "lucide-react";
import { Sun, Cpu, Gauge, Grid3X3, Palette } from "lucide-react";

export type StageId = "light" | "sensor" | "readout-demosaic" | "post";

export interface StageArticle {
  slug: string;
  title: string;
  summary: string;
  fullSlug?: string;
}

export interface StageConfig {
  id: StageId;
  label: string;
  path: string;
  icon: LucideIcon;
  guidingQuestion: string;
  whatHappens: string[];
  keyConcepts: string[];
  takeaways: string[];
  articles: StageArticle[];
  labs: { label: string; path: string }[];
}

export const STAGES: StageConfig[] = [
  {
    id: "light",
    label: "Light & Exposure",
    path: "/light",
    icon: Sun,
    guidingQuestion: 'Why does "more light = less noise"?',
    whatHappens: [
      "Scene radiance, exposure time, and aperture together determine how many photons each photosite receives.",
      "Each photosite converts a fraction of those photons into electrons based on the sensor's quantum efficiency.",
      "At the end of the exposure, the accumulated charge per photosite is read out and turned into a pixel value.",
    ],
    keyConcepts: [
      "Photon shot noise: random arrival of photons limits how clean shadows can be.",
      "Quantum efficiency (QE): how efficiently the sensor converts photons to electrons.",
      "Exposure triangle: shutter, aperture, and ISO jointly control light and noise.",
    ],
    takeaways: [
      "Brighter scenes → more photons per pixel and better signal-to-noise ratio.",
      "Expose to the right (ETTR) when you can, without clipping important highlights.",
    ],
    articles: [
      { slug: "light-to-image", title: "Light → Image: Cameras as Photon Counters", summary: "How cameras count photons and why more light means less noise." },
    ],
    labs: [
      { label: "Photon Simulation", path: "/labs/photon-sim" },
      { label: "ExposureLAB", path: "/labs/exposure" },
    ],
  },
  {
    id: "sensor",
    label: "Sensor & Metering",
    path: "/sensor",
    icon: Cpu,
    guidingQuestion: "How does my camera measure the scene?",
    whatHappens: [
      "The metering system compresses the whole scene into a representative brightness value (EV).",
      "Weights from the chosen metering mode (matrix, center-weighted, spot, subject) decide which areas matter most.",
      "The camera (or AE algorithm) picks an exposure based on that EV and its priorities for highlights vs. shadows.",
    ],
    keyConcepts: [
      "Exposure value (EV) is a logarithmic measure that ties shutter and aperture together.",
      "Metering patterns and subject weighting change which parts of the frame drive exposure.",
      "CFA design (Bayer, X-Trans, Foveon) determines how the sensor samples color before demosaicing.",
    ],
    takeaways: [
      "Metering mode and subject placement strongly influence exposure on auto/AE modes.",
      "Different CFA designs trade sharpness, moiré resistance, and processing complexity.",
    ],
    articles: [
      {
        slug: "cfa-full",
        title: "Color Filter Arrays — Bayer, X-Trans, and Foveon",
        summary: "How sensors sample color and how Bayer, X-Trans, and Foveon differ.",
      },
      {
        slug: "pixels-wells",
        title: "Pixels, Wells, and Readout — Architecture and Limits",
        summary: "How charge is collected, stored, and digitized; well capacity and read noise.",
      },
      {
        slug: "ae-algorithms",
        title: "Exposure Programs: AE, Shutter, Aperture Priority",
        summary: "How auto exposure chooses EV and splits it across the exposure triangle.",
      },
      {
        slug: "metering",
        title: "Exposure Value & Metering",
        summary: "How EV condenses shutter and aperture and how cameras measure scene brightness.",
      },
    ],
    labs: [{ label: "ExposureLAB", path: "/labs/exposure" }],
  },
  {
    id: "readout-demosaic",
    label: "Digitization & Demosaicing",
    path: "/readout-demosaic",
    icon: Gauge,
    guidingQuestion: "From raw sensor data to full-color image?",
    whatHappens: [
      "Analog charge in each photosite is amplified and converted to a digital number (bit depth).",
      "Raising ISO increases amplification, making both signal and noise more visible in the final image.",
      "Demosaicing algorithms reconstruct full RGB pixels from the CFA mosaic pattern.",
    ],
    keyConcepts: [
      "Well capacity and read noise set the limits on dynamic range and usable ISO.",
      "Shot noise dominates in very dark regions; read noise and quantization matter near the noise floor.",
      "Different demosaicing strategies trade speed, detail retention, and artifact suppression.",
    ],
    takeaways: [
      "Prefer gaining exposure with shutter and aperture before relying on high ISO.",
      "Bit depth and readout electronics determine how many subtle tonal steps the camera can represent.",
    ],
    articles: [
      {
        slug: "bit-depth",
        title: "Bit Depth & Dynamic Range — How Many Shades Can We Capture?",
        summary: "How bit depth, quantization, and electronics set dynamic range limits.",
      },
      {
        slug: "iso-shot-noise",
        title: "ISO, Shot Noise, SNR — Why Raising ISO Makes Noise Visible",
        summary: "Why ISO doesn't add light and how it interacts with shot noise and SNR.",
      },
      {
        slug: "demosaicing",
        title: "Demosaicing",
        summary: "From raw CFA data to full RGB; edge-aware interpolation and artifacts.",
      },
    ],
    labs: [
      { label: "BitDepthVisualizer", path: "/labs/bit-depth" },
      { label: "DemosaicLab", path: "/labs/demosaic" },
    ],
  },
  {
    id: "post",
    label: "Post-processing",
    path: "/post",
    icon: Palette,
    guidingQuestion: "What happens after demosaicing?",
    whatHappens: [
      "The linear sensor data is tone mapped into a viewable contrast curve.",
      "Color transforms move from sensor space to working space to output space.",
    ],
    keyConcepts: [
      "Tone curves, local contrast, and color grading all reshape the captured signal.",
      "Non-destructive editing lets you revisit the original capture decisions.",
    ],
    takeaways: [
      "Most of the \"look\" of a photo is decided in post more than at capture.",
    ],
    articles: [
      { slug: "post-processing", title: "Post-processing", summary: "Tone mapping, color correction, and editing after capture." },
    ],
    labs: [{ label: "ImageLab", path: "/labs/image" }],
  },
];

export function getStageById(id: StageId): StageConfig | undefined {
  return STAGES.find((s) => s.id === id);
}
