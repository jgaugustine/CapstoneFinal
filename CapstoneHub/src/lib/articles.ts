// Article content - Vite glob for content/*.md (relative to project root)
// Vite glob: paths are from project root (CapstoneHub/)
const articleModules = import.meta.glob<string>("./content/*.md", { query: "?raw", import: "default" });

const contentCache: Record<string, string> = {};

function slugToPath(slug: string): string {
  return `./content/${slug}.md`;
}

export async function loadArticle(slug: string): Promise<string> {
  if (contentCache[slug]) return contentCache[slug];
  const path = slugToPath(slug);
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
  };
  return placeholders[slug] ?? `# ${slug}\n\n*Article content will appear here.*`;
}
