import type { LucideIcon } from "lucide-react";
import { Sun, Cpu, Gauge, Grid3X3, SlidersHorizontal } from "lucide-react";

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
    label: "Light",
    path: "/light",
    icon: Sun,
    guidingQuestion: 'Why does "more light = less noise"?',
    takeaways: [
      "Brighter scenes → more photons per pixel",
      "More signal relative to random variation",
      "Expose to the right (ETTR) when you can",
    ],
    articleSlug: "light-to-image",
    labs: [{ label: "PhotonSimulation", path: "/labs/photon-sim" }],
  },
  {
    id: "sensor",
    label: "Sensor",
    path: "/sensor",
    icon: Cpu,
    guidingQuestion: "Why do sensor size and pixel count both matter?",
    takeaways: [
      "Bigger pixels → larger wells → better SNR at base ISO",
      "Small sensors hit limits sooner in low light",
    ],
    articleSlug: "pixels-wells",
    labs: [{ label: "PhotonToDigitalConverter", path: "/labs/photon-to-digital" }],
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
    labs: [
      { label: "BitDepthVisualizer", path: "/labs/bit-depth" },
      { label: "PhotonToDigitalConverter", path: "/labs/photon-to-digital" },
    ],
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
    icon: SlidersHorizontal,
    guidingQuestion: "How does my camera decide exposure?",
    takeaways: [
      "Metering mode (matrix/spot/center) weights the scene differently",
      "AE priorities (highlight vs. shadow) determine where clipping is tolerated",
    ],
    articleSlug: "metering",
    labs: [
      { label: "ExposureLAB", path: "/labs/exposure" },
      { label: "ImageLab", path: "/labs/image" },
    ],
  },
];

export function getStageById(id: StageId): StageConfig | undefined {
  return STAGES.find((s) => s.id === id);
}
