const e=`# Exposure Programs — AE, Shutter, Aperture Priority, and the Optimization Triangle

## **Auto Exposure: Constrained optimization**

AE is choosing an optimum under constraints. AE picks control variables (shutter time, aperture, gain/ISO) to produce an image that is “best” under some criterion, while staying inside limits imposed by mechanics, optics, and sensor electronics such as as shutter bounds, aperture bounds, sensor saturation, and acceptable noise [1]..

If exposure is too low, you can raise electronic gain (ISO) to maintain tone reproduction, but noise rises and image quality can become unacceptable. If exposure is too high, bright regions can exceed the sensor or processing pipeline’s maximum signal capacity, producing clipped highlights or even blooming into neighbors. AE therefore lives on a knife edge: brighten enough to avoid noisy shadows, but not so much that highlights collapse into uniform white [1].

EV is the metric that makes this optimization tractable. In photography, exposure value is commonly defined (at ISO 100) as:

[ \\mathrm{EV} = \\log_{2}!\\left(\\frac{N^{2}}{t}\\right) ]

where (N) is the f-number (aperture) and (t) is exposure time (seconds) [2].

![Screenshot 2026-02-23 at 12.30.18 PM.png](Exposure%20Programs%20%E2%80%94%20AE,%20Shutter,%20Aperture%20Priority/Screenshot_2026-02-23_at_12.30.18_PM.png)

EV is logarithmic: moving by 1 EV is a factor-of-two (one “step/stop”) change in exposure. This step notion is baked into standards language: an exposure-value unit corresponds to a factor-of-two exposure change.

[The exposure triangle isolated on white. Shutter speed, ISO, aperture with data. Motion blur, depth of field, image noise, or grain. Photography picture concept.](https://images.openai.com/static-rsc-3/HiV9ol2iYnBDlEojIWoa9HSrgs8tRszu9Yb7fhkusS_ShqnbzVIk3E8WKsjZMxYMg0-R10wSrM6Ziaad1NBQcmIeDQL3SpDMherza-bLAHc?purpose=inline)

## **AE pipeline: input, EV sweep, selection, allocation**

A practical AE system usually follows a pipeline with four phases:

- **Input:** a scene image (or preview), plus a weighting map (metering/ROI/saliency), plus priorities (e.g., midtone target, highlight tolerance (\\eta_h), shadow tolerance (\\eta_s)).
- **EV sweep:** evaluate candidate exposures by simulating how the scene’s luminance distribution moves under exposure changes.
- **Selection:** pick the EV that best meets an objective subject to tolerances (or relax tolerances when nothing fits).
- **Allocation:** convert the chosen EV into shutter/aperture/ISO settings with quantization and constraint reporting.

## **Histograms**

Most AE systems are histogram-based, commonly decomposed into “histogram manipulation” (deciding what pixels contribute and how strongly) followed by “exposure modification” (changing exposure to drive a statistic toward a target).

Why manipulate at all? Because raw histograms are easily hijacked by pixels you don’t want to optimize for: specular highlights, saturated bulbs, deep shadows, or small extreme regions. Clipping is especially pernicious: once highlights saturate, detail is unrecoverable, and sensor saturation is explicitly called out as a key failure mode for overexposure. As we previously discussed, this happens when the photosites overflow.

A practical way to suppress extreme luminance values without needing a full semantic interpretation is using statistics. Compute (Q_1), (Q_3), and (\\mathrm{IQR}=Q_3-Q_1). Then define a lower and upper “fence”:

[ \\text{low} = Q_1 - 1.5,\\mathrm{IQR}, \\quad \\text{high} = Q_3 + 1.5,\\mathrm{IQR} ]

[Understanding and interpreting boxplots, vector statistical diagram isolated on a white. Box plot, whisker plot explanation.](https://images.openai.com/static-rsc-3/NQOYo08yIQe-EKUO6bKR6h8J3Bu86jg-IE8wrZ5iAom1RWvOfL3rNIIm74yS83QC957rE6O7-7R2qgN2tn8zCjAtCA2G3VXr5GK72kKZTu8?purpose=inline)

Pixels outside ([\\text{low},\\text{high}]) are treated as outliers (not counted, or heavily down-weighted). This is the standard IQR outlier method taught in introductory statistics.

This fence is not “physically correct”; it is deliberately pragmatic. It says: “optimize exposure for the middle mass of the scene, not the tails.” That is often exactly what you want when tails correspond to sunlight glints, LEDs, or unusually deep shadows that would otherwise dominate decisions.

### **Weighting maps: full-frame, metering/ROI, saliency**

Once you decide which pixels are in-range, you still need to decide which of those pixels matter [3].

- **Full-frame weighting** treats all (in-range) pixels equally, approximating a global statistic.
- **ROI/metering weighting** assigns higher weights to a selected region from metering(center-weighted, spot, detected subject region of interest (ROI)). Industrial cameras often expose based on an “auto function area of interest (AOI),” and only pixels from the overlap between the AOI and the image region are used to control the auto function [4]).
- **Saliency weighting** boosts pixels that are “interesting” by some saliency detector; in AE research, saliency AE can be implemented by thresholding a saliency map and up-weighting salient pixels when constructing the histogram [3].

![**Figure 1.** Three metering pipelines compared. Row 1 (weight maps): Full frame (uniform weights), ROI/semantic (center-weighted matrix metering), and Saliency (weights by deviation from the ROI-weighted mean). Row 2 (weighted histograms): Luminance distributions under each weighting; saliency gives more weight to mid-tones. Row 3 (IQR-adjusted histograms): Same histograms after IQR trimming, with vertical dashed lines for IQR lower and upper bounds. For saliency, the upper bound is farther right because salient regions span brighter values and are less trimmed.](Exposure%20Programs%20%E2%80%94%20AE,%20Shutter,%20Aperture%20Priority/image.png)

**Figure 1.** Three metering pipelines compared. Row 1 (weight maps): Full frame (uniform weights), ROI/semantic (center-weighted matrix metering), and Saliency (weights by deviation from the ROI-weighted mean). Row 2 (weighted histograms): Luminance distributions under each weighting; saliency gives more weight to mid-tones. Row 3 (IQR-adjusted histograms): Same histograms after IQR trimming, with vertical dashed lines for IQR lower and upper bounds. For saliency, the upper bound is farther right because salient regions span brighter values and are less trimmed.

https://drive.google.com/file/d/1KeOZRnyRuR55ztnXsmakeDGLF0M3brZ6/view?usp=sharing

## **Four AE strategies: Global, Semantic, Saliency, Entropy**

It’s tempting to ask “what is the correct exposure?” But there is no single answer even for a human photographers. Some scenes are intentionally high key or low key, some tolerate blown highlights or shadows, and some must preserve highlights at all costs. Exposure strategy is about tradeoffs among noise, clipping, and intent [5].

A useful taxonomy is to separate algorithms by (1) how they weight pixels (what matters) and (2) what they optimize (what “best” means). A recent AE study explicitly contrasts global, semantic/ROI, saliency-weighted, and entropy maximization approaches, framing differences largely in terms of histogram construction and selection criteria [3].

### **Comparison table**

| **Strategy** | **Weighting (what pixels “count”)** | **Selection objective** | **Clipping handling** | **Typical use cases** |
| --- | --- | --- | --- | --- |
| Global | All in-range pixels weight = 1 | Minimize midtone error (median/mean vs target) | Explicit tolerances on highlight/shadow clipping | General scenes where “average” exposure is acceptable |
| Semantic / ROI-weighted | Metering map / ROI pixels weight more | Same as Global, but applied to ROI-weighted histogram | Explicit tolerances | Portraits, subjects against bright/dark backgrounds |
| Saliency | Pixels deviating from background / salient regions weighted more | Same as Global, but with saliency weighting | Explicit tolerances | Dynamic/challenging lighting where “subject” should dominate |
| Entropy | Same as ROI weighting (or full-frame) but scored by distribution spread | Maximize Shannon entropy of histogram | Implicit: clipping reduces entropy | Machine vision / “maximize information” capture, feature preservation |

**Table 1.** Comparison of common auto exposure (AE) strategies. Each method differs in how it weights pixels when building the exposure histogram, what objective function it optimizes (midtone accuracy vs. information spread), how it handles highlight and shadow clipping (explicit tolerances vs. implicit penalties), and the types of scenes for which it is best suited.

The first three strategies mirror the “histogram manipulation + exposure modification” pattern: vary histogram contributions and drive a statistic toward a target. The entropy strategy replaces the target statistic with “maximize entropy” [3].

### **Global**

Global AE is the default worldview: the whole frame matters, so the “right” exposure is one that makes the overall histogram land near a midtone target—often operationalized as driving the mean or median of a histogram toward a key value. This is the classic content-agnostic approach in the literature [3].

The upside is predictability: global weighting is stable when the scene is ordinary and evenly lit, and it aligns with the common camera behavior of placing average brightness in midtones unless the scene is strongly high key or low key [5].

The downside is equally predictable: if a small region (like a bright sky or a lamp) dominates the histogram, global AE can underexpose the subject; conversely, if the subject is bright but background is dark, global AE can overexpose the subject. In high dynamic range scenes, there may be no global exposure that preserves both extremes [3].

### **Semantic / ROI-weighted**

Semantic (ROI-weighted) AE changes a single assumption: the camera should expose for the region you care about, not the whole frame. In research settings this is often implemented using bounding boxes (faces, tracked objects) so that only ROI pixels (or ROI pixels with higher weight) contribute to the histogram [3].

In industrial practice, this has a direct analogue: an “auto function AOI” can define the region used for exposure control, and only pixels in the overlap between AOI and the effective image region are used by the auto function [4].

The tradeoff is clear: ROI AE gives you the exposure you intended (the subject looks right) but it can sacrifice the rest of the frame. If the ROI is too small or poorly placed, the algorithm can “do the right thing” for the wrong patch—often producing surprising global brightness shifts [4].

### **Saliency**

Saliency AE is ROI weighting without requiring an explicit ROI label. Instead, it tries to infer “what matters” by looking for visually distinct regions and weighting them more. In the AE literature, a simple saliency approach is to compute a saliency map, threshold it, and then up-weight salient pixels in the histogram [3].

This can behave better than global AE in challenging lighting because it naturally downplays flat backgrounds and emphasizes high-contrast, attention-grabbing regions—often the thing a viewer actually looks at. In one AE user study, saliency-weighted approaches were preferred over purely global methods across challenging scenes [3].

The risk is that saliency is not semantics. Highly salient highlights (neon signs, reflections) can steal priority from your intended subject unless you combine saliency with clipping tolerances and robust outlier suppression [3].

### **Entropy**

Entropy AE makes a different philosophical choice: instead of pushing the histogram toward a midtone target, choose the exposure that maximizes information content in the image, measured by Shannon entropy of the histogram. The Shannon entropy definition (for a discrete distribution (p_i)) is [6]:

[ H = -\\sum_{i=1}^{k} p_i \\log_2(p_i) ]

In machine vision, this is appealing because maximizing entropy tends to produce images with richer, more diverse intensity distributions—often correlating with more usable features. An “entropy camera” framing explicitly argues for maximizing entropy to capture more information, using Shannon entropy as the metric [7].

Entropy AE is typically search-based: evaluate entropy under different exposures and take the maximum, which in naïve form implies capturing multiple exposures (or sweeping candidate exposures in simulation). Research implementations describe computing the exposure that maximizes entropy across an exposure stack [3].

![**Figure 2**. EV-shifted versions of the luminance image at −2, −1, 0, +1, and +2 EV. Each subplot shows the image after applying, with entropy of the weighted histogram underneath.](Exposure%20Programs%20%E2%80%94%20AE,%20Shutter,%20Aperture%20Priority/image%201.png)

**Figure 2**. EV-shifted versions of the luminance image at −2, −1, 0, +1, and +2 EV. Each subplot shows the image after applying, with entropy of the weighted histogram underneath.

![**Figure 3.** Shannon entropy (nats) of the weighted luminance histogram versus EV shift. Entropy peaks near the exposure where values are spread across the range; clipping at 0 or 1 lowers entropy.](Exposure%20Programs%20%E2%80%94%20AE,%20Shutter,%20Aperture%20Priority/image%202.png)

**Figure 3.** Shannon entropy (nats) of the weighted luminance histogram versus EV shift. Entropy peaks near the exposure where values are spread across the range; clipping at 0 or 1 lowers entropy.

The weakness is that entropy is not a perfect proxy for “loks good.” Maximum entropy can still prefer an image that humans find too dark, too flat, or aesthetically wrong—especially when the scene contains large uniform regions or when the histogram is spread by noise rather than signal. In human-facing contexts, “information” and “pleasant exposure” can diverge [8].

## **AE Algorithm**

\`\`\`mermaid
flowchart TD
  A["Image/Scene"] --> B["Weight map: full-frame / ROI / saliency"]
  B --> C["Robust in-range fence (IQR) + manipulated histogram"]
  C --> D["EV sweep: simulate candidate exposures"]
  D --> E["Per-EV metrics: clip ratios, median/mean error, entropy"]
  E --> F{"Feasible under ηh & ηs?"}
  F -->|yes| G["Choose EV by objective (e.g., midtone error)"]
  F -->|no| H["Relax constraints: L1/L2/Linf penalty on clipping"]
  G --> I["Allocate EV to shutter/aperture/ISO"]
  H --> I
  I --> J["Quantize + clamp + report constraint hits"]
  J --> K["Final exposure settings"]

  %% Node classes
  classDef input fill:#E3F2FD,stroke:#1E88E5,stroke-width:2px,color:#0D47A1;
  classDef preprocess fill:#E8F5E9,stroke:#43A047,stroke-width:2px,color:#1B5E20;
  classDef simulate fill:#FFF3E0,stroke:#FB8C00,stroke-width:2px,color:#E65100;
  classDef decision fill:#FCE4EC,stroke:#D81B60,stroke-width:2px,color:#880E4F;
  classDef optimize fill:#F3E5F5,stroke:#8E24AA,stroke-width:2px,color:#4A148C;
  classDef output fill:#ECEFF1,stroke:#546E7A,stroke-width:2px,color:#263238;

  %% Assign classes
  class A input;
  class B,C preprocess;
  class D,E simulate;
  class F decision;
  class G,H,I,J optimize;
  class K output;
\`\`\`

**Figure 4.** Flowchart of the auto exposure (AE) pipeline, from scene input and histogram construction through EV sweep, feasibility testing under ηh/ηs constraints, optimization, and final exposure allocation.

## **EV selection**

A common failure mode in AE design is pretending that all goals are equally important. In reality, AE often has a priority structure: “first, don’t blow out too much highlight detail; second, don’t crush too much shadow detail; then, among what remains, aim for my midtone target.” That is lexicographic reasoning: optimize the most important criterion first, then optimize the next without degrading the first, and so on [8].

### **Tolerances: (\\eta_h) and (\\eta_s)**

Define:

- (\\eta_h) = **highlight tolerance**: maximum allowed fraction of metered pixels that may clip at the bright end (e.g., normalized luminance (\\ge 1)).
- (\\eta_s) = **shadow tolerance**: maximum allowed fraction of metered pixels that may crush at the dark end (e.g., normalized luminance (\\le \\varepsilon)).

Excess exposure can clip or bloom highlights when the signal exceeds capacity, while insufficient exposure can force higher gain and lead to unacceptable noise.

The shadow threshold (\\varepsilon) is often unspecified because “deep shadow” depends on encoding (RAW vs gamma-encoded preview), bit depth, and noise floor. A reasonable default for normalized linear luminance is (\\varepsilon \\in [10^{-3}, 10^{-2}]) (roughly 0.1%–1% of full scale), or (\\varepsilon = 1/255) if you want a simple 8-bit intuition, but it should be tuned against sensor noise characteristics [1].

### **Relaxation using (L_1), (L_2), or (L_\\infty) penalties**

When no candidate EV satisfies both clipping tolerances, you can relax constraints by penalizing violations. A simple approach is to measure the violation vector:

[ v(EV) = \\Big(\\max(0, \\text{highlightClip}(EV)-\\eta_h),\\ \\max(0, \\text{shadowClip}(EV)-\\eta_s)\\Big) ]

and select the EV minimizing (|v(EV)|*p), where (p\\in{1,2,\\infty}). Different norms reflect different “attitudes” toward imbalance: (L*\\infty) punishes the worst violation; (L_1) sums violations; (L_2) emphasizes larger violations smoothly.

## **Allocation: EV to shutter, aperture, ISO and program modes**

Choosing EV is only half of AE. You still have to express that EV as settings on the exposure triangle—and real cameras usually require **quantized steps [9].**

### **Clamp and quantize**

First clamp EV to what is achievable given constraints:

- shutter time limits (e.g., min/max exposure time),
- aperture limits,
- ISO/gain limits.

Industrial camera documentation is explicit about this “bounded control” idea: auto exposure adjusts exposure time within user-defined limits and targets an average gray value.

Then quantize to discrete steps. Many cameras expose and compensate in increments like 1/3 EV, and user-facing manuals explicitly describe EV adjustments in 1/3 EV increments.

### **Split rules: shutter-priority, aperture-priority, ISO-priority, balanced**

A practical allocation treats EV contributions as additive “stop budgets” across controls (a bookkeeping abstraction consistent with EV-as-steps). The exact mapping depends on what you are holding fixed (program mode) and what you prioritize.

A common set of split rules (expressed as EV contributions) is:

- **Shutter-priority:** allocate EV to shutter first; distribute the remainder across aperture and ISO.
- **Aperture-priority:** allocate EV to aperture first; distribute the remainder across shutter and ISO.
- **ISO-priority:** keep ISO near base when possible; distribute EV across shutter and aperture.
- **Balanced:** split evenly: (e_T=e_N=e_S=\\mathrm{EV}/3).

This priority framing has direct support in industrial AE controls: “gain priority” keeps gain low (to minimize noise) and adjusts exposure time; “exposure priority” keeps exposure time short (to capture motion) and adjusts gain, switching only when limits are hit [9].

### References

[1] International Organization for Standardization . (2019, February). Photography — Digital still cameras — Determination of exposure index, ISO speed ratings, standard output sensitivity, and recommended exposure index.

[2] Wikimedia Foundation. (2026, February 3). *Exposure value*. Wikipedia. https://en.wikipedia.org/wiki/Exposure_value 

[3] Tedla, S., Yang, B., & Brown, M. S. (2023). *Examining Autoexposure for Challenging Scenes*. Computer Visions Foundation. [https://openaccess.thecvf.com/content/ICCV2023/papers/Tedla_Examining_Autoexposure_for_Challenging_Scenes_ICCV_2023_paper.pdf](https://openaccess.thecvf.com/content/ICCV2023/papers/Tedla_Examining_Autoexposure_for_Challenging_Scenes_ICCV_2023_paper.pdf) 

[4] Basler AG. (n.d.). *ace GigE user’s manual* (Section 9.5, Area of interest). [https://partner.cognex.com/FileLibrary/1e78a000947d4bdda5ed27def0ee3394/ace%20GigE%20Users%20Manual.pdf](https://partner.cognex.com/FileLibrary/1e78a000947d4bdda5ed27def0ee3394/ace%20GigE%20Users%20Manual.pdf?utm_source=chatgpt.com)

[5] *Understanding digital camera histograms: Tones and contrast*. CAMERA HISTOGRAMS: TONES & CONTRAST. (n.d.). https://www.cambridgeincolour.com/tutorials/histograms1.htm 

[6] Shor, P. (2024, April 17). Data compression & Shannon’s Entropy Theorem. [https://ocw.mit.edu/courses/18-200-principles-of-discrete-applied-mathematics-spring-2024/](https://ocw.mit.edu/courses/18-200-principles-of-discrete-applied-mathematics-spring-2024/) 

[7] Wang, G. (2012). Active entropy camera. *Machine Vision and Applications*, *23*(4), 713-723. [https://link.springer.com/article/10.1007/s00138-011-0367-3](https://link.springer.com/article/10.1007/s00138-011-0367-3)

[8] Mavrotas, G. (2009). Effective implementation of the ε-constraint method in multi-objective mathematical programming problems. *Applied mathematics and computation*, *213*(2), 455-465.

[9] *Using auto exposure | teledyne vision solutions*. Teledyne. (n.d.). https://www.teledynevisionsolutions.com/support/support-center/application-note/iis/using-auto-exposure/  

[10] *Exposure auto*. Basler Product Documentation. (n.d.). https://docs.baslerweb.com/exposure-auto`;export{e as default};
