# AE & Allocation Flowchart

Two flowcharts, no subgraphs. AE output (chosenEV) feeds into Allocation as target EV.

**AE (EV selection)**

```mermaid
flowchart TB
    classDef input fill:#e3f2fd,stroke:#1976d2
    classDef process fill:#e8f5e9,stroke:#388e3c
    classDef decision fill:#fff3e0,stroke:#f57c00
    classDef output fill:#f3e5f5,stroke:#7b1fa2
    classDef relax fill:#ffebee,stroke:#c62828

    IMG[Scene image]
    W[Metering weights]
    P[AEPriorities]
    ALGO[AE algorithm]
    EV_RANGE[evRange from evRangeFromConstraints]
    LUM[Compute base luminance]
    HIST_INIT[computeWeightedHistogram base luminance]
    IQR["computeIQRBounds Q1 Q3 lower upper fence"]
    ALGO_TYPE{Algorithm?}
    GLOB["Global: w=1 for in-range pixels"]
    SEM["Semantic/Entropy: w=metering weight for in-range"]
    SAL["Saliency: w = |L-mean| × metering weight for in-range"]
    NORM[Normalize Σw=1]
    SWEEP[EV sweep: scale L×2^EV computeClipping computeWeightedHistogram]
    CANDIDATES[Per EV: highlightClip shadowClip median midtoneError entropy]
    SWEEP_ENTROPY[+ entropy if entropy algo]
    SWEEP_MID[+ median midtoneError if global/semantic/saliency]
    SEL_TYPE{Selection path?}
    E_PICK[Pick argmax entropy no feasibility check]
    FEAS[Feasible = highlightClip ≤ ηh ∧ shadowClip ≤ ηs]
    EMPTY{Feasible non-empty?}
    BEST[Pick argmin midtoneError among feasible]
    RELAX["Relax: single step over all candidates"]
    R1["highlightRatio = clip/ηh shadowRatio = clip/ηs"]
    R2["penalty = L1/L2/L∞ of ratios"]
    R3["argmin penalty tie-break midtoneError"]
    CHOSEN[chosen candidate EV]
    CLAMP_EV[Clamp to evRange min max]
    OUT[chosenEV]

    class IMG,W,P,ALGO,EV_RANGE input
    class LUM,HIST_INIT,IQR,NORM,SWEEP,CANDIDATES,SWEEP_ENTROPY,SWEEP_MID,GLOB,SEM,SAL,CLAMP_EV process
    class ALGO_TYPE,SEL_TYPE,EMPTY decision
    class E_PICK,FEAS,BEST,CHOSEN process
    class RELAX,R1,R2,R3 relax
    class OUT output

    IMG --> LUM
    W --> LUM
    P --> EV_RANGE
    LUM --> HIST_INIT
    HIST_INIT --> IQR
    IQR --> ALGO_TYPE
    ALGO_TYPE -->|global| GLOB
    ALGO_TYPE -->|semantic| SEM
    ALGO_TYPE -->|entropy| SEM
    ALGO_TYPE -->|saliency| SAL
    GLOB --> NORM
    SEM --> NORM
    SAL --> NORM
    NORM --> SWEEP
    EV_RANGE --> SWEEP
    SWEEP --> CANDIDATES
    CANDIDATES --> SWEEP_ENTROPY
    CANDIDATES --> SWEEP_MID
    SWEEP_ENTROPY --> SEL_TYPE
    SWEEP_MID --> SEL_TYPE
    SEL_TYPE -->|entropy| E_PICK
    SEL_TYPE -->|global/semantic/saliency| FEAS
    E_PICK --> CHOSEN
    FEAS --> EMPTY
    EMPTY -->|Yes| BEST
    EMPTY -->|No| RELAX
    BEST --> CHOSEN
    RELAX --> R1 --> R2 --> R3 --> CHOSEN
    CHOSEN --> CLAMP_EV
    EV_RANGE --> CLAMP_EV
    CLAMP_EV --> OUT
```

**Allocation**

```mermaid
flowchart TB
    classDef input fill:#e3f2fd,stroke:#1976d2
    classDef process fill:#e8f5e9,stroke:#388e3c
    classDef decision fill:#fff3e0,stroke:#f57c00
    classDef output fill:#f3e5f5,stroke:#7b1fa2

    CHOSEN_EV[chosenEV from AE]
    BASE[baseEV from current settings]
    EV_RANGE[evRangeFromConstraints]
    TARGET[target EV = baseEV + chosenEV]
    CLAMP_T[Clamp target to evRange]
    CONST[Constraints]
    PREF_IN[Preference]
    QEV[Quantize EV to 1/3 steps]
    PREF{Preference?}
    SHUT[Shutter: full EV to shutter 60/40 remainder]
    APERT[Aperture: full EV to aperture 60/40 remainder]
    ISO_P[ISO: ISO=min 50/50 shutter aperture]
    BAL[Balanced: e_T=e_N=e_S=EV/3]
    EV_TO_T[evToShutter evToAperture evToISO]
    CLAMP[Clamp to shutterMin/Max apertureMin/Max isoMax]
    QUANT[quantizeAperture quantizeISO to standard stops]
    SAFE[clampFinite sanitize]
    HITS[Record constraint hits]
    EV_BD[evBreakdown shutterEV apertureEV isoEV]
    SETTINGS[CameraSettings]
    SIM[simulateForward]

    class CHOSEN_EV,BASE,EV_RANGE,CONST,PREF_IN input
    class TARGET,CLAMP_T,QEV,EV_TO_T,CLAMP,QUANT,SAFE,HITS,EV_BD process
    class PREF decision
    class SHUT,APERT,ISO_P,BAL process
    class SETTINGS,SIM output

    CHOSEN_EV --> TARGET
    BASE --> TARGET
    CONST --> EV_RANGE
    PREF_IN --> EV_RANGE
    TARGET --> CLAMP_T
    EV_RANGE --> CLAMP_T
    CLAMP_T --> QEV
    CONST --> QEV
    PREF_IN --> QEV
    QEV --> PREF
    PREF --> SHUT
    PREF --> APERT
    PREF --> ISO_P
    PREF --> BAL
    SHUT --> EV_TO_T
    APERT --> EV_TO_T
    ISO_P --> EV_TO_T
    BAL --> EV_TO_T
    EV_TO_T --> CLAMP
    CLAMP --> QUANT
    QUANT --> SAFE
    SAFE --> HITS
    HITS --> EV_BD
    EV_BD --> SETTINGS
    SETTINGS --> SIM
```

---

## Key symbols

| Symbol | Meaning |
|--------|---------|
| in-range | Pixels within 1.5×IQR fence: Q1−1.5·IQR ≤ L ≤ Q3+1.5·IQR |
| ηh | max allowed highlight clipping fraction |
| ηs | max allowed shadow clipping fraction |
| penalty | L1, L2, or L∞ norm of (highlightRatio, shadowRatio) when relaxing |

---

## Files

- **AE (EV):** `src/ae/runLexiAE.ts`
- **Allocation:** `src/allocation/allocateSettings.ts`
- **Pipeline:** `src/pages/Lab.tsx`
