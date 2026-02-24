const e=`# Metering: How the Camera Decides What to Measure

Before a camera can choose exposure, it must answer a simple but crucial question: *Which parts of the scene matter?* Metering is the process of turning the raw image into a weighted map that tells the exposure system where to look—and how much to care about each region.

## Why Metering Matters

A photograph is made of light from many sources: a bright sky, a shaded face, a sunlit wall, a dark shadow. If the camera treated every pixel equally, it would aim for an average that often satisfies nobody—the sky might blow out, or the subject might be lost in shadow. Metering modes solve this by letting the photographer (or the camera) emphasize certain regions over others.

## Weight Maps: The Foundation

Under the hood, metering is implemented as a **weight map**: a value for every pixel that sums to 1. Pixels with higher weights contribute more to the luminance statistics that drive auto exposure. The same scene, metered differently, produces a different weighted histogram—and thus a different exposure decision.

## Four Metering Modes

### Matrix (Evaluative)

Matrix metering considers the whole frame but gives slightly more importance to the center. Edges contribute less; the center contributes more. This mimics evaluative metering on real cameras: the entire frame is used, but the assumption that subjects are often near the center skews the result.

### Center-Weighted

Center-weighted metering strongly favors the middle of the frame. Pixels near the center have high weight; pixels farther out drop off quickly. Useful when the subject is clearly in the center (portraits, products).

### Spot

Spot metering measures only a small region—typically a circular spot centered on the focus point. Inside the spot, pixels get weight; outside, weight is zero. Spot is ideal when you know exactly what to expose for: a face, a bird in a tree, a backlit subject. The rest of the frame is ignored.

### Subject-Based

When a subject mask is available (e.g., from segmentation), subject-based metering uses it directly:

- Pixels where the mask exceeds a threshold get full weight
- Pixels below the threshold get reduced weight (e.g., 10% of mask value)
- Normalized to sum to 1

This is the most “semantic” mode: the camera meters what it believes is the subject, not a fixed geometric region.

## From Weights to Luminance

Metering weights do not replace the image—they reshape how it is interpreted. The pipeline:

1. **Luminance**: Convert each pixel to linear luminance (e.g., Y = 0.2126R + 0.7152G + 0.0722B).
2. **Weighted statistics**: When building histograms or computing means, each pixel contributes proportionally to its weight.
3. **Outlier trimming**: Many AE algorithms use an IQR (interquartile range) fence to exclude extreme values, so a few specular highlights or deep shadows do not dominate the meter.

The result is a luminance distribution that reflects “what the camera cares about” for that metering mode.

## Metering and AE: A Two-Stage Relationship

Metering provides the **input** to auto exposure. The AE algorithm then interprets that input in its own way:

- **Global AE** can treat all in-range pixels equally (effectively ignoring metering for histogram construction, though the initial luminance uses the full image).
- **Semantic and entropy AE** use the metering weights directly when building the histogram.
- **Saliency AE** combines metering weights with a measure of local contrast (deviation from the mean).

So metering defines the *region of interest*; the AE algorithm defines *how* that region drives the EV choice. Both matter.

## Practical Takeaways

- **Matrix**: Default choice for most scenes; good balance of frame-wide and center-weighted.
- **Center-weighted**: When the subject is centered and you want to ignore the edges.
- **Spot**: When you have a clear target (focus point, face) and the rest of the scene is irrelevant or misleading.
- **Subject-based**: When you have segmentation and want the camera to prioritize the detected subject.

*Check out ExposureLAB to explore metering for yourself.*
`;export{e as default};
