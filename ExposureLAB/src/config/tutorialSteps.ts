import type { ReactNode } from "react";

export type TutorialTarget =
  | "center-overlay"
  | "scene-panel"
  | "camera-mode-panel"
  | "metering-panel"
  | "sim-output"
  | "ae-panel";

export type TutorialEvent =
  | "image-loaded"
  | "settings-changed"
  | "metering-changed"
  | "ae-run";

export interface TutorialStep {
  id: "welcome" | "scene" | "camera" | "metering" | "sim" | "ae" | "ae-param" | "ae-run" | "finish";
  title: string;
  body: ReactNode;
  target: TutorialTarget;
  /**
   * Optional event that, when emitted while this step is active,
   * should automatically advance to the next step.
   * Steps without `advanceOn` only advance via explicit Next/Back.
   */
  advanceOn?: TutorialEvent;
}

export const tutorialSteps: TutorialStep[] = [
  {
    id: "welcome",
    title: "Welcome to ExposureLAB",
    target: "center-overlay",
    body:
      "ExposureLAB is a lab for exposure, metering, and auto-exposure allocation. This quick tour walks you through loading a scene, adjusting camera controls, choosing a metering mode, and running auto-exposure.",
  },
  {
    id: "scene",
    title: "Start by loading a scene",
    target: "scene-panel",
    body:
      "Upload a reference image in the Scene panel. ExposureLAB will read its exposure metadata and build a scene model you can relight and meter.",
    advanceOn: "image-loaded",
  },
  {
    id: "camera",
    title: "Explore the camera controls",
    target: "camera-mode-panel",
    body:
      "Use the Camera Mode card to adjust shutter speed, aperture, and ISO. Watch how the exposure triangle summarizes the current settings.",
    advanceOn: "settings-changed",
  },
  {
    id: "metering",
    title: "Choose a metering pattern",
    target: "metering-panel",
    body:
      "Switch between matrix, center, spot, and subject metering. The metering mode controls how ExposureLAB samples the scene when it decides on an exposure.",
    advanceOn: "metering-changed",
  },
  {
    id: "sim",
    title: "Inspect the simulated output",
    target: "sim-output",
    body:
      "The simulated output shows what the sensor would capture for the current settings, including highlight and shadow clipping overlays when enabled.",
  },
  {
    id: "ae",
    title: "Switch to AE mode",
    target: "camera-mode-panel",
    body:
      "In the Camera Mode card, click AE (or Av, Tv, or Auto ISO) so the Auto Exposure panel appears below. That panel lets you pick a target EV from the metering histogram and see how it's split across shutter, aperture, and ISO.",
  },
  {
    id: "ae-param",
    title: "Set auto-exposure parameters",
    target: "ae-panel",
    body:
      "Choose the auto-exposure algorithm (e.g. Global or Semantic). Optionally adjust highlight and shadow tolerances (ηh, ηs) to control how much clipping the algorithm allows before relaxing the target EV.",
  },
  {
    id: "ae-run",
    title: "Run auto-exposure and see the breakdown",
    target: "ae-panel",
    body:
      "Click Run Auto-Exposure. You'll see the chosen target EV and a step-by-step breakdown of how it's allocated to shutter speed, aperture, and ISO under your constraints.",
    advanceOn: "ae-run",
  },
  {
    id: "finish",
    title: "You’re ready to explore exposure",
    target: "center-overlay",
    body:
      "You’ve loaded a scene, adjusted camera controls, chosen a metering mode, and run auto-exposure. You can re-open this tour anytime from the header if you want a refresher.",
  },
];

export const getFirstTutorialStepId = (): TutorialStep["id"] | null =>
  tutorialSteps.length > 0 ? tutorialSteps[0].id : null;

export const getTutorialStepById = (
  id: TutorialStep["id"] | null | undefined,
): TutorialStep | null =>
  id ? tutorialSteps.find((step) => step.id === id) ?? null : null;

