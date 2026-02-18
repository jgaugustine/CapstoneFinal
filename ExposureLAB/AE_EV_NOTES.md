## AE & EV explainer

ExposureLAB includes an in-app **Exposure explainer** panel that shows how the auto‑exposure (AE) engine chooses a target exposure value (EV) and how that EV is allocated across shutter speed, aperture, and ISO.

- **Where to find it**: Open the Lab view, switch to **AE mode**, and click **“Explain AE & EV”** in the AE Mode panel.
- **Key pipeline** (implemented in [`src/pages/Lab.tsx`](src/pages/Lab.tsx)):
  - Scene image + metering weights → `runLexiAE` (`src/ae/runLexiAE.ts`) → chosen ΔEV (relative to current settings).
  - Current settings EV (`settingsToEV`) + ΔEV → clamped target EV using `evRangeFromConstraints` and `Constraints` from [`src/types/index.ts`](src/types/index.ts).
  - Target EV → `allocateSettings` (`src/allocation/allocateSettings.ts`) → concrete `CameraSettings` and an `AllocationLog` with an EV breakdown and constraint hits.
  - Final settings → `simulateForward` (`src/sim/simulateForward.ts`) → simulated output and clipping masks.

The explainer UI lives in [`src/components/AEModePanel.tsx`](src/components/AEModePanel.tsx) and uses:

- `AETrace` and `AEPriorities` from [`src/types/index.ts`](src/types/index.ts) to describe how **Lexi AE** evaluates candidate EVs, enforces highlight/shadow tolerances, and picks the final ΔEV.
- `AllocationLog` (including `evBreakdown`, `constraintHits`, and `preference`) plus `Constraints` to describe how the target EV is split across shutter/aperture/ISO and which limits were hit.
- Optional EV scalars (`baseEV`, `targetEV`, `clampedTargetEV`) passed from `Lab.tsx` so the UI can explain “base EV + ΔEV → clamped target EV” for the most recent AE run.

Use this panel as the primary reference for explaining the behavior of the AE algorithms and exposure allocation to users; the underlying implementation details are documented inline in:

- `src/ae/runLexiAE.ts`
- `src/allocation/allocateSettings.ts`
- `src/metering/stats.ts` and `src/metering/weights.ts`
- `src/sim/simulateForward.ts`

---

## Allocation algorithm (steps)

The allocation algorithm turns a target EV into concrete shutter speed, aperture, and ISO under `Constraints` and a user **preference** (`shutter` | `aperture` | `iso` | `balanced`). It is implemented in [`src/allocation/allocateSettings.ts`](src/allocation/allocateSettings.ts). The following breakdown matches the step-by-step depth of the Lexi AE explainer (Steps 1–4 in the panel).

### Step 1: Quantize target EV

The allocator works in discrete EV steps (e.g. 1/3 EV). The incoming target EV is rounded to the nearest step so all downstream math uses a single quantized value.

- **Formula:** `quantizedEV = round(targetEV / quantizationStep) * quantizationStep`.
- If `|quantizedEV - targetEV| > 0.001`, the log records `quantizationApplied: true` so the UI can explain that the target was adjusted to a valid step.
- **Parameters:** `targetEV` (from AE: base EV + ΔEV, then clamped); `constraints.quantizationStep` (e.g. 1/3).

**Code:** Lines 111–115 in `allocateSettings.ts` (`quantizeEV`, `log.quantizationApplied`).

### Step 2: Choose preference and target EV split

The user’s **preference** fixes how the total EV is allocated across shutter, aperture, and ISO. Each preference corresponds to a target split of EV contributions (e_T, e_N, e_S) or a priority order; the rest of the algorithm then tries to achieve that split subject to constraints.

**Per preference:**

- **shutter:** Give shutter the full EV first (ideal e_T = quantizedEV). Whatever shutter can’t use (after clamping) is “remaining EV,” split 60% aperture / 40% ISO.
- **aperture:** Give aperture the full EV first (ideal e_N = quantizedEV). Remainder split 60% shutter / 40% ISO.
- **iso:** Fix ISO at base (e_S = 0). Split the full EV 50% shutter / 50% aperture (minimize ISO, balance the other two).
- **balanced:** Split evenly: e_T = e_N = e_S = quantizedEV / 3.

**Parameters:** `preference`; base reference values used for EV math: `BASE_SHUTTER = 1/60`, `BASE_APERTURE = 2.8`, `BASE_ISO = 100` (same as in `settingsToEV` and the explainer).

**Code:** The `if (preference === 'shutter')` … `else if (preference === 'aperture')` … block (lines 120–186); the 0.6/0.4 and 0.5/0.5 ratios and “remaining EV” formulas are the concrete target splits.

### Step 3: Compute settings and apply constraints

For the chosen preference branch, the allocator converts the target EV split into concrete shutter time T, f-number N, and ISO S. It then clamps each to the allowed bounds and (for aperture and ISO) quantizes to standard camera stops so the result is achievable on real hardware.

- **EV ↔ settings (shared formulas):**
  - Shutter: `T = BASE_SHUTTER * 2^e_T`; inverse `e_T = log2(T / BASE_SHUTTER)`.
  - Aperture: `N = BASE_APERTURE * (√2)^(-e_N)`; inverse uses √2 stops.
  - ISO: `S = BASE_ISO * 2^e_S`.
- **Clamping:** Shutter to `[shutterMin, shutterMax]`, aperture to `[apertureMin, apertureMax]`, ISO to `[ISO_MIN=100, isoMax]`. Applied after computing ideal values from the target split; clamping can make total EV differ from target (reported in Step 4).
- **Quantization:** Aperture → nearest standard f-stop in {1, 1.4, 2, 2.8, 4, 5.6, 8, 11, 16, 22, 32} within bounds. ISO → nearest standard stop in {100, 200, 400, …} up to isoMax. Shutter is only clamped (no discrete stop list).
- **Order within a branch:** (1) Set the preferred variable from its target EV and clamp/quantize. (2) Compute “remaining EV” from the exposure identity. (3) Split remainder by the fixed ratios (60/40 or 50/50). (4) Convert the other two variables and clamp/quantize them (and for shutter-priority and aperture-priority, ISO is computed from the residual so that e_T + e_N + e_S still matches the remaining EV).

**Parameters:** `constraints`: `shutterMin`, `shutterMax`, `apertureMin`, `apertureMax`, `isoMax`, `quantizationStep`. Standard stop lists and `ISO_MIN` in `allocateSettings.ts`.

**Code:** `evToShutter` / `evToAperture` / `evToISO`, `quantizeAperture`, `quantizeISO`, and the per-branch math (lines 46–96, 116–186).

### Step 4: Record constraint hits and finalize

The allocator records which limits were hit (so the UI can show “Constraints hit: shutter_max, iso_max”) and sanitizes the triple (T, N, S) so it is finite, positive, and within bounds. It then computes the **actual** EV breakdown of the chosen triple and attaches it to the log so the user sees how much each control contributed to the final exposure (which may differ from the target if constraints bit).

- **Constraint hits:** For each of shutter, aperture, and ISO, if the value equals (or is at) the min/max bound, push `shutter_min`, `shutter_max`, `aperture_min`, `aperture_max`, or `iso_max` onto `log.constraintHits`.
- **Sanitize:** `clampFinite(x, min, max)` ensures the value is finite and positive; otherwise use the min bound. Applied to shutter, aperture, and ISO to produce `safeShutter`, `safeAperture`, `safeIso`.
- **EV breakdown:** If all of quantizedEV and the three safe values are finite, compute: `shutterEV`, `apertureEV`, `isoEV` from the inverse formulas above; `totalEV = shutterEV + apertureEV + isoEV`. Store in `log.evBreakdown`. This is the exposure the user actually gets; it can differ from the requested target EV when constraints force a different triple.

**Output:** `settings: { shutterSeconds, aperture, iso }` and `log: { constraintHits, quantizationApplied, preference, evBreakdown? }`.

**Code:** Lines 188–221 (constraint hits, clampFinite, evBreakdown), 223–230 (return).

### Auxiliary: evRangeFromConstraints

Used by the AE pipeline to know the EV range for which the allocator can return settings **without** any constraint hit. Sweeps EV from -10 to +15 in `quantizationStep` steps, calls `allocateSettings(ev, constraints, preference)` for each EV, and returns the min and max EV where `log.constraintHits.length === 0`. If none, returns a default range (e.g. [-6, 6]). This range is used to clamp the target EV before calling `allocateSettings` so the AE explainer’s “Step 4” only asks the allocator for EVs it can satisfy when possible.

**Code:** `evRangeFromConstraints` in `allocateSettings.ts` (lines 6–30).

