# Exposure Lab

## Goal

**Build an interactive "Exposure Lab" that teaches and analyzes camera exposure by separating:**

1. **Auto-Exposure (AE) decision** (numeric, inspectable, priority-based)
2. **Forward-pass camera simulation** (the *only* way images change)

The user should be able to do **both**:

* **Manual mode:** freely adjust **shutter / aperture / ISO** and see the forward-simulated consequences.
* **AE mode:** choose metering + priorities, let AE pick **shutter / aperture / ISO**, then see the same forward simulation and the **trace explaining why**.

**Important constraint:** This app is *not* an image editor. No direct "brightness/blur/noise" sliders. Everything is caused by camera parameters or scene illumination ("world change").

---

## Architecture

### Module Boundaries

- `src/ae/` - AE optimizer + trace (NO sim imports)
- `src/metering/` - weights + stats + histograms
- `src/allocation/` - EV → (t, N, ISO) rule-based allocation
- `src/sim/` - Forward simulation (NO AE imports)
- `src/io/` - Image loading + linearization
- `src/state/` - Global state store
- `src/ui/` - Panels, canvas, charts, overlays
- `src/types/` - All shared types

**Rule:** `ae/` must not import `sim/`. `sim/` must not import `ae/`. They communicate only through shared types in `types/`.

---

## Development

```bash
npm install
npm run dev
```
