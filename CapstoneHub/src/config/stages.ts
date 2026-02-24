import type { LucideIcon } from "lucide-react";
import { Sun, Cpu, Gauge, Grid3X3, Palette } from "lucide-react";

export type StageId = "light" | "sensor" | "readout" | "demosaic" | "post";

export interface StageConfig {
  id: StageId;
  label: string;
  path: string;
  icon: LucideIcon;
  guidingQuestion: string;
  takeaways: string[];
  articleSlug: string;
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
      "More signal relative to random variation",
      "Shutter, aperture, and ISO control how much light reaches the sensor",
      "Expose to the right (ETTR) when you can",
    ],
    articleSlug: "light-to-image",
    labs: [{ label: "ExposureLAB", path: "/labs/exposure" }],
  },
  {
    id: "sensor",
    label: "Sensor & Metering",
    path: "/sensor",
    icon: Cpu,
    guidingQuestion: "How does my camera measure the scene?",
    takeaways: [
      "Bigger pixels → larger wells → better SNR at base ISO",
      "Metering mode (matrix/spot/center) weights the scene differently",
      "AE priorities (highlight vs. shadow) determine where clipping is tolerated",
    ],
    articleSlug: "pixels-wells",
    labs: [{ label: "ExposureLAB", path: "/labs/exposure" }],
  },
  {
    id: "readout",
    label: "Readout",
    path: "/readout",
    icon: Gauge,
    guidingQuestion: "Why does raising ISO make noise visible?",
    takeaways: [
      "ISO amplifies both signal and noise",
      "Shot noise dominates in shadows",
      "Prefer longer shutter / wider aperture when possible",
    ],
    articleSlug: "iso-shot-noise",
    labs: [{ label: "BitDepthVisualizer", path: "/labs/bit-depth" }],
  },
  {
    id: "demosaic",
    label: "Demosaicing",
    path: "/demosaic",
    icon: Grid3X3,
    guidingQuestion: "Does Bayer vs. X-Trans actually change my photos?",
    takeaways: [
      "Different CFA patterns → different sharpness/artifact tradeoffs",
      "In practice, processing matters more than sensor brand",
    ],
    articleSlug: "cfa",
    labs: [{ label: "DemosaicLab", path: "/labs/demosaic" }],
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
    articleSlug: "post-processing",
    labs: [{ label: "ImageLab", path: "/labs/image" }],
  },
];

export function getStageById(id: StageId): StageConfig | undefined {
  return STAGES.find((s) => s.id === id);
}
