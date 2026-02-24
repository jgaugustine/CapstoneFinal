# Capstone Hub

Shell app for the camera pipeline: Light → Sensor → Readout → Demosaicing → Post-processing.

## Features

- **Continuous scroll** — Single page; all stages flow vertically (ready for scroll-triggered animation)
- **For Photographers** — Guiding questions and key takeaways per stage
- **Articles** — Markdown content with KaTeX math support
- **Integrated labs** — Photon Simulation, ExposureLAB, BitDepthVisualizer, DemosaicLab, ImageLab run in-app at `/labs/*`

Each section has `id` and `data-stage` attributes for future animation hooks.

## Development

From the repo root:

```bash
npm install
npm run dev          # Hub at http://localhost:3000
```

To develop a specific lab (optional): run its dev server so the hub can proxy to it:

```bash
npm run dev:exposure   # ExposureLAB at :3001, proxied from /labs/exposure
npm run dev:bit-depth  # BitDepthVisualizer at :3002
npm run dev:demosaic   # DemosaicLab at :3003
npm run dev:image      # ImageLab at :3004
npm run dev:photon     # PhotonSimulation at :3005
```

## Build

From the repo root, builds the hub and all labs into `CapstoneHub/dist/`:

```bash
npm run build
npm run preview       # Serve from CapstoneHub
```

Output structure: `CapstoneHub/dist/` (hub) + `CapstoneHub/dist/labs/{exposure,bit-depth,demosaic,image,photon-sim}/` (each lab).

## Content

Articles live in `content/*.md`. Edit or add markdown; the app loads them at runtime.
