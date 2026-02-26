// Article content - Vite glob for long-form articles in /articles
const articleModules = import.meta.glob<string>("../../articles/*.md", {
  query: "?raw",
  import: "default",
});

const contentCache: Record<string, string> = {};

// Map short slugs used in the app to specific article files
const SLUG_TO_PATH: Record<string, string> = {
  "light-to-image":
    "../../articles/Light → Image — Cameras as Photon Counters 26e924884a0480f68be7fd04b52941af.md",
  metering:
    "../../articles/Exposure Value & Metering 26e924884a0480f3b22df35a10330897.md",
  "ae-algorithms":
    "../../articles/Exposure Programs — AE, Shutter, Aperture Priority 26f924884a0480fdb672ef956ac03f44.md",
  "pixels-wells":
    "../../articles/Pixels, Wells, and Readout — Architecture and Limi 26e924884a0480d28f7fc4ec4be2f47f.md",
  "iso-shot-noise":
    "../../articles/ISO, Shot Noise, SNR — Why Raising ISO Makes Noise 26e924884a048001b0e8d3b028cafb08.md",
  demosaicing:
    "../../articles/Demosaicing 26e924884a0480f8be17f2d3debeda46.md",
  "bit-depth":
    "../../articles/Bit Depth & Dynamic Range— How Many Shades Can We  26e924884a048034b3a8c1863022b03e.md",
  "cfa-full":
    "../../articles/Color Filter Arrays — Bayer, X-Trans, and Foveon 26e924884a0480168d5fe18e65fa4a41.md",
};

export async function loadArticle(slug: string): Promise<string> {
  if (contentCache[slug]) return contentCache[slug];
  const path = SLUG_TO_PATH[slug];
  if (!path) return getPlaceholder(slug);
  const loader = articleModules[path];
  if (loader) {
    const content = await loader();
    contentCache[slug] = content;
    return content;
  }
  return getPlaceholder(slug);
}

export function getArticleContent(slug: string): string {
  if (contentCache[slug]) return contentCache[slug];
  return getPlaceholder(slug);
}

export async function preloadArticles(slugs: string[]): Promise<void> {
  await Promise.all(slugs.map(loadArticle));
}

function getPlaceholder(slug: string): string {
  const placeholders: Record<string, string> = {
    "light-to-image": `# Light → Image: Cameras as Photon Counters

This article explains how cameras convert light into digital images by counting photons.

*Full article coming soon. Content will be loaded from markdown.*`,
    "pixels-wells": `# Pixels, Wells, and Readout: Architecture and Limits

Sensor architecture determines how charge is collected and digitized.

*Full article coming soon.*`,
    "iso-shot-noise": `# ISO, Shot Noise, SNR: Why Raising ISO Makes Noise Visible

Understanding the relationship between ISO, shot noise, and signal-to-noise ratio.

*Full article coming soon.*`,
    "cfa": `# Color Filter Arrays: Bayer, X-Trans, and Foveon

Different CFA patterns affect color reproduction and sharpness.

*Full article coming soon.*`,
    "metering": `# Metering and Auto Exposure

How cameras decide exposure based on metering mode and AE priorities.

*Full article coming soon.*`,
    "demosaicing": `# Demosaicing Algorithms

From raw CFA data to full RGB per pixel.

*Full article coming soon.*`,
    "auto-exposure": `# Auto Exposure

How AE algorithms choose shutter, aperture, and ISO.

*Full article coming soon.*`,
    "post-processing": `# Post-processing

Tone mapping, color correction, and editing after capture.

*Full article coming soon.*`,
    "ae-algorithms": `# Exposure Programs: AE, Shutter, Aperture Priority

How auto exposure chooses EV and splits it across the exposure triangle.

*Full article coming soon.*`,
    "cfa-full": `# Color Filter Arrays: Bayer, X-Trans, and Foveon

Different CFA patterns affect color reproduction and sharpness.

*Full article coming soon.*`,
  };
  return placeholders[slug] ?? `# ${slug}\n\n*Article content will appear here.*`;
}
