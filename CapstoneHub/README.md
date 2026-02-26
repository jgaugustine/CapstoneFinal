# Capstone Hub

Shell app for the camera pipeline: Light → Sensor → Readout → Demosaicing → Post-processing.

## Features

- **Continuous scroll** — Single page; all stages flow vertically
- **For Photographers** — Guiding questions and key takeaways per stage
- **Articles** — Markdown content with KaTeX math support
- **Integrated labs** — Photon Simulation, ExposureLAB, BitDepthVisualizer, DemosaicLab, ImageLab run in-app at `/labs/*` (iframe with “Back to Capstone” header)

## Development

From the **repo root**:

```bash
npm install
npm run build    # build hub + all labs into CapstoneHub/dist/
npm run dev      # hub at http://localhost:3000; labs load from dist/labs/
```

After one `npm run build`, the dev server serves built labs from `dist/labs/`, so you don’t need to run each lab separately. To develop a single lab with hot reload, run it on its port (e.g. `npm run dev:exposure` for ExposureLAB on 3001); the hub still serves built labs by default.

## Build (production)

From the repo root:

```bash
npm run build
npm run preview   # serve from CapstoneHub
```

Output: `CapstoneHub/dist/` (hub) and `CapstoneHub/dist/labs/{exposure,bit-depth,demosaic,image,photon-sim}/` (each lab).

## Content

Articles live in `content/*.md`. Edit or add markdown; the app loads them at runtime.
