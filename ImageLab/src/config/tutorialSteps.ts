import type { ReactNode } from "react";

export type TutorialTarget =
  | "center-overlay"
  | "image-preview"
  | "transform-controls"
  | "add-adjustment-btn"
  | "layer-list"
  | "math-panel"
  | "pixel-inspector"
  | "dechannel-btn";

export type TutorialEvent =
  | "image-loaded"
  | "slider-changed"
  | "pixel-selected"
  | "layer-added"
  | "layer-reordered"
  | "conv-layer-added"
  | "conv-layer-selected";

export interface TutorialStep {
  id:
    | "welcome"
    | "upload"
    | "canvas"
    | "rgb-cube"
    | "add-layer"
    | "reorder"
    | "adjust"
    | "add-conv-layer"
    | "click-conv-layer"
    | "inspect-conv-math"
    | "math"
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
    body: "Click any pixel on the canvas to inspect its RGB values. The pixel inspector shows the original and transformed color, and the math panel updates to show how each transformation affects that specific pixel.",
    advanceOn: "pixel-selected",
  },
  {
    id: "rgb-cube",
    title: "3D RGB cube & math",
    target: "math-panel",
    body: "Look at the right panel. The 3D RGB cube visualizes your selected pixel in color space — drag to rotate the view and see how the point moves. The pixel you clicked populates both the cube and the math formulas below, so you can trace each transformation step by step.",
  },
  {
    id: "add-layer",
    title: "Add an adjustment layer",
    target: "add-adjustment-btn",
    body: "Click \"New Adjustment\" to add a transformation layer. Choose from color adjustments (brightness, contrast, saturation, hue) or convolution filters (blur, sharpen, edge detection, custom kernels). Try adding one now!",
    advanceOn: "layer-added",
  },
  {
    id: "reorder",
    title: "Drag to reorder layers",
    target: "layer-list",
    body: "The order matters — transformations are applied top to bottom, just like a real image editor. Drag any layer card up or down to reorder. The result changes in real time as you rearrange the pipeline. Try dragging a layer now!",
    advanceOn: "layer-reordered",
  },
  {
    id: "adjust",
    title: "Adjust parameters",
    target: "transform-controls",
    body: "Click any layer to select it, then use the slider to adjust its value. You can toggle layers on/off with the eye icon, duplicate, or delete them. Double-click a slider to reset it to the default.",
    advanceOn: "slider-changed",
  },
  {
    id: "add-conv-layer",
    title: "Add a convolution layer",
    target: "add-adjustment-btn",
    body: "Now try adding a convolution filter. Click \"New Adjustment\" and pick one from the second group — Blur, Sharpen, Denoise, Edge Detect, or Custom Convolution.",
    advanceOn: "conv-layer-added",
  },
  {
    id: "click-conv-layer",
    title: "Click the layer to inspect the math",
    target: "layer-list",
    body: "Click on your convolution layer in the list to select it. The math panel on the right updates to show that layer's formula and kernel.",
    advanceOn: "conv-layer-selected",
  },
  {
    id: "inspect-conv-math",
    title: "Inspect the convolution math",
    target: "math-panel",
    body: "Look at the bottom right — the math panel shows the convolution formula and the 3D product cubes. Drag the 32×32 box to select a region, then click \"Use This Region\" to populate the dot-product breakdown for each color channel, with the neighborhood values multiplied by the kernel weights.",
    advanceOn: "pixel-selected",
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
