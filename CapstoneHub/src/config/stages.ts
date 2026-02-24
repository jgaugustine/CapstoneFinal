import type { LucideIcon } from "lucide-react";
import { Sun, Cpu, Gauge, Palette } from "lucide-react";

export type StageId = "light" | "sensor" | "readout-digitization" | "post";

export interface ArticleMeta {
  slug: string;
  title: string;
  abstract: string;
  fullSlug?: string;
}

export interface StageConfig {
  id: StageId;
  label: string;
  path: string;
  icon: LucideIcon;
  guidingQuestion: string;
  takeaways: string[];
  /** Article metadata for cards: title, abstract, optional fullSlug for extended article */
  articles: ArticleMeta[];
  labs: { label: string; path: string }[];
}

export const STAGES: StageConfig[] = [
  {
    id: "light",
    label: "Light & Exposure",
    path: "/light",
    icon: Sun,
    guidingQuestion: 'Why does "more light = less noise"?',
    takeaways: [
      "Brighter scenes → more photons per pixel",
      "Shutter, aperture, and ISO control light; ETTR when possible",
    ],
    articles: [
      { slug: "light-to-image", title: "Light → Image: Cameras as Photon Counters", abstract: "How cameras convert light into digital images by counting photons." },
      { slug: "ae-algorithms", title: "Exposure Programs — AE, Shutter, Aperture Priority", abstract: "How AE chooses EV and allocates it across shutter, aperture, and ISO." },
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
    guidingQuestion: "Does Bayer vs. X-Trans actually change my photos?",
    takeaways: [
      "Different CFA patterns → different sharpness/artifact tradeoffs",
      "Processing matters more than sensor brand in practice",
    ],
    articles: [
      { slug: "cfa", title: "Color Filter Arrays — Bayer, X-Trans, Foveon", abstract: "How CFAs sample color and how demosaicing reconstructs full RGB.", fullSlug: "cfa-full" },
      { slug: "metering", title: "Exposure Value, Dynamic Range, Metering", abstract: "How the camera decides what to measure for exposure." },
    ],
    labs: [{ label: "ExposureLAB", path: "/labs/exposure" }],
  },
  {
    id: "readout-digitization",
    label: "Readout & Digitization",
    path: "/readout-digitization",
    icon: Gauge,
    guidingQuestion: "From raw sensor data to full-color image?",
    takeaways: [
      "ISO amplifies signal and noise; shot noise dominates in shadows",
      "Prefer longer shutter or wider aperture when possible",
      "Demosaicing trades speed for quality",
    ],
    articles: [
      { slug: "pixels-wells", title: "Pixels, Wells, and Readout", abstract: "Sensor architecture and charge-to-digital conversion." },
      { slug: "iso-shot-noise", title: "ISO, Shot Noise, SNR", abstract: "Why raising ISO makes noise visible." },
      { slug: "demosaicing", title: "Demosaicing — Interpolation, Edges, Moiré", abstract: "From raw CFA data to full RGB per pixel." },
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
    takeaways: [
      "Tone mapping and color correction shape the final image",
      "Editing preserves or alters the original capture",
    ],
    articles: [
      { slug: "post-processing", title: "Post-processing", abstract: "Tone mapping, color correction, and editing after capture." },
    ],
    labs: [{ label: "ImageLab", path: "/labs/image" }],
  },
];

export function getStageById(id: StageId): StageConfig | undefined {
  return STAGES.find((s) => s.id === id);
}
