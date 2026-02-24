const e=`# AE Algorithms: How Auto Exposure Chooses EV

Auto exposure (AE) solves a constrained optimization problem: find the exposure value (EV) that produces the best-looking image within the camera’s limits. Different AE algorithms disagree on what “best” means—some target a midtone, others maximize information, and they differ in how they handle highlight and shadow clipping. This article explains how AE strategies work and how a chosen EV is turned into camera settings.

## The AE Pipeline at a Glance

1. **Input**: Scene image, metering weights, AE priorities (ηh, ηs, midtone target)
2. **EV sweep**: For each candidate EV, scale luminance, measure clipping, build a weighted histogram
3. **Selection**: Pick the best EV (by midtone error, entropy, or relaxed clipping penalty)
4. **Allocation**: Split the target EV across shutter, aperture, and ISO per user preference and constraints

## The Manipulated Histogram

AE does not use the raw luminance histogram. It builds a **manipulated histogram**: only pixels within an IQR-based in-range fence contribute, and their contribution is weighted by an algorithm-specific map. This lets each AE algorithm emphasize different regions (full frame, ROI, high-contrast areas) without changing the underlying metering mode.

## Four AE Algorithms

### Global

- **Weighting**: All in-range pixels get weight 1; clipped/outlier pixels get 0
- **Selection**: Among EVs that satisfy highlight (ηh) and shadow (ηs) tolerances, pick the one whose histogram median is closest to the midtone target (e.g., 18%)
- **Use case**: Full-frame, “average” exposure; good when the whole scene matters

### Semantic (ROI-Weighted)

- **Weighting**: In-range pixels are weighted by the metering map (matrix, center, spot, or subject)
- **Selection**: Same as global—minimize midtone error subject to ηh and ηs
- **Use case**: Expose for the metered region; combines metering mode with midtone targeting

### Saliency

- **Weighting**: Emphasizes pixels whose luminance deviates from the weighted mean; modulated by metering weights
- **Selection**: Same as global—minimize midtone error subject to ηh and ηs
- **Use case**: Favors high-contrast, “interesting” regions; less influenced by flat backgrounds

### Entropy

- **Weighting**: Same as semantic (metering weights for in-range pixels)
- **Selection**: **Maximize histogram entropy** over the EV sweep—no explicit clipping constraints
- **Behavior**: Entropy is highest when the histogram is spread out; clipping (saturated or crushed pixels) reduces entropy, so it is implicitly discouraged
- **Use case**: Maximize information preserved; good when you want a balanced histogram without hard ηh/ηs tuning

## Lexicographic EV Selection

For global, semantic, and saliency, the choice follows a **lexicographic** order:

1. **Feasibility**: Include only EVs where \`highlightClip ≤ ηh\` and \`shadowClip ≤ ηs\`
2. **If any feasible**: Pick the one with minimum midtone error
3. **If none feasible**: Relax constraints using a penalty on (highlightRatio, shadowRatio) with L1, L2, or L∞ norm; pick the EV with the smallest penalty, then smallest midtone error as tiebreaker

This keeps the most important constraints (clipping limits) first, and only relaxes when no EV can satisfy both.

## AE Priorities: ηh and ηs

- **ηh (highlight tolerance)**: Maximum fraction of metered pixels allowed to clip (L ≥ 1) before relaxation
- **ηs (shadow tolerance)**: Maximum fraction allowed to crush into deep shadow (L ≤ ε) before relaxation
- **Conservative** (low ηh, low ηs): Protects highlights and shadows; may underexpose or leave midtones dark
- **Aggressive** (higher ηh, ηs): Allows more clipping to brighten the image; risk of blown highlights or noisy shadows

## Allocation: EV → Shutter, Aperture, ISO

Once a target EV is chosen, it must be turned into concrete settings. The allocation step:

1. **Clamp** target EV to the achievable range (from constraints: shutter limits, aperture limits, ISO max)
2. **Quantize** to standard steps (e.g., 1/3 EV)
3. **Split** according to user preference:
   - **Shutter-priority**: Give shutter the full EV first; remainder splits 60% aperture / 40% ISO
   - **Aperture-priority**: Give aperture the full EV first; remainder splits 60% shutter / 40% ISO
   - **ISO-priority**: Fix ISO at base; split 50% shutter / 50% aperture
   - **Balanced**: e_T = e_N = e_S = EV / 3
4. **Clamp and quantize** each setting to valid bounds and standard stops (f/2.8, 1/60 s, ISO 100, etc.)

Constraint hits (e.g., shutter_max, iso_max) are recorded so the user sees when the desired EV could not be fully achieved.

## Program Modes

- **Full AE**: Run the chosen algorithm, allocate, simulate
- **Av (aperture-priority)**: User sets aperture; AE chooses EV; allocation assigns shutter and ISO
- **Tv (shutter-priority)**: User sets shutter; AE chooses EV; allocation assigns aperture and ISO
- **Manual**: User sets all three; the AE logic still computes what it would have chosen for reference.

## Understanding AE Decisions

The full decision path includes the EV sweep, feasible set, chosen EV and reason, and allocation breakdown—helping you see *why* a particular exposure was selected and how it was realized on the exposure triangle.

*Check out ExposureLAB to explore AE algorithms and see how EV choice and allocation change with the scene.*
`;export{e as default};
