/** Lab slug (URL segment) -> display label for the Lab iframe page */
export const LAB_SLUGS: Record<string, string> = {
  exposure: "ExposureLAB",
  "bit-depth": "BitDepthVisualizer",
  demosaic: "DemosaicLab",
  image: "ImageLab",
  "photon-sim": "Photon Simulation",
};

export function getLabLabel(slug: string): string | undefined {
  return LAB_SLUGS[slug];
}
