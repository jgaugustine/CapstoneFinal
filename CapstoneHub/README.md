# Capstone Hub

Shell app for the camera pipeline: Light → Sensor → Readout → Demosaicing → Post-processing.

## Features

- **Continuous scroll** — Single page; all stages flow vertically (ready for scroll-triggered animation)
- **For Photographers** — Guiding questions and key takeaways per stage
- **Articles** — Markdown content with KaTeX math support
- **Lab links** — Links to PhotonSimulation, ExposureLAB, DemosaicLab, etc.

Each section has `id` and `data-stage` attributes for future animation hooks.

## Development

```bash
npm install
npm run dev
```

Runs at http://localhost:3000

## Build

```bash
npm run build
npm run preview
```

## Lab URLs

Lab links point to `/labs/photon-sim`, `/labs/exposure`, etc. Configure your deployment to serve the lab apps at these paths, or update `src/config/stages.ts` with full URLs.

## Content

Articles live in `content/*.md`. Edit or add markdown; the app loads them at runtime.
