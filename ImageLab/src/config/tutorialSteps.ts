import type { ReactNode } from "react";

export type TutorialTarget =
  | "center-overlay"
  | "image-preview"
  | "transform-controls"
  | "math-panel"
  | "pixel-inspector"
  | "dechannel-btn";

export type TutorialEvent =
  | "image-loaded"
  | "slider-changed"
  | "pixel-selected";

export interface TutorialStep {
  id:
    | "welcome"
    | "upload"
    | "canvas"
    | "layers"
    | "adjust"
    | "math"
    | "pixel"
    | "dechannel"
    | "finish";
  title: string;
  body: ReactNode;
  target: TutorialTarget;
  advanceOn?: TutorialEvent;
}

export const tutorialSteps: TutorialStep[] = [
  {
    id: "welcome",
    title: "Welcome to ImageLab",
    target: "center-overlay",
    body: "ImageLab lets you apply image transformations — brightness, contrast, saturation, hue, convolution filters, and more — while seeing the math behind each one in real time. This tour walks you through the interface.",
  },
  {
    id: "upload",
    title: "Upload an image",
    target: "image-preview",
    body: "Start by uploading an image. Click the upload area or drag and drop a photo. The image will be displayed on the canvas where all transformations are applied live.",
    advanceOn: "image-loaded",
  },
  {
    id: "canvas",
    title: "Interactive canvas",
    target: "image-preview",
    body: "Once loaded, click any pixel on the canvas to inspect its RGB values. The pixel inspector shows the original and transformed color, and the math panel updates to show how each transformation affects that specific pixel.",
  },
  {
    id: "layers",
    title: "Transformation pipeline",
    target: "transform-controls",
    body: "Each transformation is an adjustment layer in a pipeline. Drag to reorder, toggle layers on/off, duplicate, or delete them. The order matters — transformations are applied top to bottom, just like a real image editor.",
  },
  {
    id: "adjust",
    title: "Adjust parameters",
    target: "transform-controls",
    body: "Click any layer to select it and adjust its parameters with the slider. You can also add convolution filters like blur, sharpen, edge detection, and custom kernels. Double-click a slider to reset it.",
    advanceOn: "slider-changed",
  },
  {
    id: "math",
    title: "Math explanation panel",
    target: "math-panel",
    body: "The right panel shows the mathematical formula behind the currently selected transformation. When you select a pixel, it substitutes the actual RGB values into the formula so you can see the computation step by step.",
  },
  {
    id: "dechannel",
    title: "Dechannel view",
    target: "dechannel-btn",
    body: "Toggle the Dechannel button to split the image into its individual R, G, and B channels. This helps visualize how each transformation affects the color channels independently.",
  },
  {
    id: "finish",
    title: "You're ready to explore",
    target: "center-overlay",
    body: "Upload an image, stack transformations, inspect individual pixels, and see the math behind every operation. You can re-open this tour anytime from the header.",
  },
];

export const getFirstTutorialStepId = (): TutorialStep["id"] | null =>
  tutorialSteps.length > 0 ? tutorialSteps[0].id : null;

export const getTutorialStepById = (
  id: TutorialStep["id"] | null | undefined,
): TutorialStep | null =>
  id ? tutorialSteps.find((step) => step.id === id) ?? null : null;
