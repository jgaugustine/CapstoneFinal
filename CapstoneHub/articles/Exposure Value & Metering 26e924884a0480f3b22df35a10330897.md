# Exposure Value & Metering

## How we measure light (EV)

Exposure decisions are typically expressed in exposure value (EV), a logarithmic measure of scene brightness.

We want this metric to express how cameras see the world. If exposure time doubles, the sensor collects twice as many photons. If the aperture diameter increases, more light reaches the sensor per unit time. Exposure value formalizes these doubling relationships.
****

At the sensor, the total collected light is proportional to $H \propto E \cdot t$

where:

- $E$ is image-plane illuminance (light per unit area),
- $t$ is exposure time.

Doubling $t$ doubles $H$.

Illuminance $E$ depends on aperture area. Since aperture area scales with the square of the aperture diameter, and f-number is defined as

$N = \frac{f}{D},$

the light intensity at the sensor is proportional to $E \propto \frac{1}{N^2}.$ Thus total exposure becomes $H \propto \frac{t}{N^2}.$

Doubling exposure time doubles light. Reducing the f-number by a factor of $\sqrt{2}$ also doubles light. These are the familiar “one stop” changes in photography.

Because light scales multiplicatively, we measure it logarithmically. Exposure value is defined as $EV = \log_2\left(\frac{N^2}{t}\right).$

Each increment of +1 EV halves the collected light. Each decrement of −1 EV doubles it.

But EV is only meaningful relative to a measured scene brightness (set by engineers in a lab). To compute an exposure value from a scene, the camera must first reduce the entire image to a single representative luminance.

Call that representative brightness $\bar{Y}$.

The mapping from scene luminance to EV can be written abstractly as

$$
EV \propto -\log_2(\bar{Y}),
$$

since brighter scenes require less collected light and therefore higher EV.

The key question becomes:

How do we compute  $\bar{Y} \text{ from } Y(x,y)$?

## How We Measure Scene Brightness

A scene is a spatial luminance field $Y(x,y)$. If we averaged every pixel equally,

$$
\bar{Y} = \frac{1}{N} \sum_{i=1}^{N} Y_i.
$$

we would obtain one possible EV estimate.

But cameras rarely use a uniform average. Instead, they compute a weighted luminance

$$
\bar{Y}_w = \sum_{i=1}^{N} w_i Y_i,
\quad \text{where} \quad
w_i \ge 0, \quad \sum_i w_i = 1.
$$

Different metering modes correspond to different choices of $w_i$.

The exposure value derived from the scene therefore becomes

$$
EV \propto -\log_2(\bar{Y}_w).
$$

Change the weights, and you change $\bar{Y}_w$. Change $\bar{Y}_w$, and you change the EV estimate.

## **Four Metering Modes (Weight Functions)**

We would think that every pixel should contribute equally to exposure. In practice, that often fails. A vast sky with one tiny subject can fool a uniform average, causing the image to be “underexposed;” a dark foreground under a bright spotlight can hide detail; a snow-covered landscape at noon can trick the meter into dull gray, stripping the brilliance from white. Metering solves this by biasing the measurement toward the region of interest (ROI). The auto-exposure algorithm then treats that region.

Cameras offer several metering modes. Each mode corresponds to a different weight shape. The key modes are:

- **Matrix (Evaluative)**: Weights cover the whole frame with a light bias.
- **Center-Weighted**: Weights peak in the center and smoothly fall off.
- **Spot**: Weights are concentrated in a small circle, ignoring outside.
- **Subject-Based**: Weights follow a detected subject or face.

![**Figure 1:** Common metering patterns. The red shows which pixels are considered in the metering and light evaluation. Evaluative/Matrix (even weighting across the frame), Center‑weighted (strong emphasis on the central region with gentle falloff), Partial (a larger central area given dominant weight), and Spot (a small central spot used almost exclusively). ](Exposure%20Value%20&%20Metering/image.png)

**Figure 1:** Common metering patterns. The red shows which pixels are considered in the metering and light evaluation. Evaluative/Matrix (even weighting across the frame), Center‑weighted (strong emphasis on the central region with gentle falloff), Partial (a larger central area given dominant weight), and Spot (a small central spot used almost exclusively). 

### **Matrix (Evaluative) Metering**

This mode uses most of the frame, with only gentle weighting. Practically, modern “matrix” or “evaluative” metering analyzes the scene in multiple zones and uses tonality, color, and sometimes focus-distance information to set exposure [1].

A simple model: weight decays linearly from center: $$ w(x,y) = \max\bigl(0, 1 - k \frac{d(x,y)}{d_{\max}}\bigr) $$ Here $d(x,y)$ is distance from image center, $d_{\max}$ to a corner. A reasonable default might be $k=0.7$. After computing $w$, normalize to $\tilde{w}$. All pixels still contribute, but corners less. This matches Nikon’s description of using “the entire frame” with some center bias [1].

### **Center-Weighted Metering**

This mode *deliberately* emphasizes the center more strongly. It is a classic choice for portraits. A Gaussian kernel is a natural model:

$$ w(x,y) = \exp\Bigl(-\frac{u^2+v^2}{2}\Bigr),\quad u = \frac{x - x_c}{\sigma W},\; v = \frac{y - y_c}{\sigma H}. $$ Here $(x_c,y_c)$ is center, $W,H$ image size, and $\sigma$ controls spread. A default $\sigma\approx 0.3$ yields a prominent central peak. This produces a smooth falloff; pixels near center have high weight [1].

### **Spot Metering**

Spot metering restricts measurement to a small region. For example, Nikon’s spot mode meters a ~4 mm circle (~1.5% of view) around the AF point.

Model as a circular Gaussian: $$ w(x,y) = \begin{cases} \exp\bigl(-\tfrac{1}{2}(r/(\alpha R))^2\bigr), & r \le R,\\ 0, & r>R, \end{cases} $$ where $r$ is distance from the spot center, $R$ the chosen radius (e.g. 50 pixels), and $\alpha\approx 0.5$ controls softness. This weights only the spot region, essentially ignoring the rest of the frame [1].

### **Subject-Based Metering**

Modern cameras can detect faces or subjects, and weight those pixels. In effect, the mask of the subject becomes the weight map.

Let $M(x,y) \in [0,1]$ be a subject confidence mask. A simple rule is

$$
w(x,y) =
\begin{cases}
1, & M(x,y) \ge T \\
\beta M(x,y), & M(x,y) < T
\end{cases}
$$

with threshold $T$ (e.g. 0.5) and floor $\beta \approx 0.1$ to retain some background contribution. The weights are then normalized.

Patents note that AE can be “aided by face detection:” the camera finds faces and “tailor[s] its exposure to the location of the face” since faces are usually the intended subject [2]. In short, subject-based metering boldly weights the important object (e.g. a face) over the background.

## Metering as Expectation (LOTUS View)

Up to this point, we have written metering as a weighted sum:

$$
\bar{Y}_w = \sum_{i=1}^{N} w_i Y_i,
\quad \text{where} \quad
\sum_i w_i = 1.
$$

There is a useful way to reinterpret this expression.

Because the weights are nonnegative and sum to 1, they define a probability distribution over pixels. Let

$$
p_i = w_i.
$$

Now consider a discrete random variable $X$ that selects pixel $i$ with probability $p_i$. The luminance at that pixel is $Y(X)$.

The metered luminance becomes

$$
\bar{Y}_w = \sum_i p_i Y_i = \mathbb{E}[Y(X)].
$$

This is an instance of the Law of the Unconscious Statistician (LOTUS):

$$
\mathbb{E}[g(X)] = \sum_i p_i g(i).
$$

Here,

- $X$ is the pixel index,
- $g(i) = Y_i$,
- $p_i = w_i$.

Metering is therefore computing the expected luminance under a chosen pixel distribution.

Different metering modes correspond to different probability distributions:

- Matrix metering spreads probability broadly across the frame.
- Center-weighted metering concentrates probability near the center.
- Spot metering assigns probability mass to a small region.
- Subject-based metering assigns probability according to a detection mask.

The exposure value derived from the scene becomes

$$
EV \propto -\log_2\big(\mathbb{E}[Y(X)]\big).
$$

Metering defines the distribution.

EV applies the logarithm.

Two metering modes applied to the same scene correspond to two different probability measures over pixels. The scene does not change. The distribution does.

And because exposure is a logarithmic function of an expectation, small changes in the weight distribution can produce noticeable shifts in EV.

## Weighted Histograms and Auto-Exposure

Cameras often build **weighted histograms** from $w_i$. For a luminance bin $b_k$,

$$ H(k) = \sum_{i: Y_i \in b_k} w_i. $$

Each pixel’s weight contributes to its luminance bin. The metering pattern sculpts the histogram shape.

From this weighted histogram, the AE system may compute different statistics:

- A weighted mean (targeting a reference luminance).
- A weighted median (more robust to outliers).
- Percentile-based clamps (to avoid highlight/shadow bias).
- Entropy maximization (choosing exposure that maximizes histogram entropy).

For example, one patent describes clipping the top percentile (95–98%) to ignore stray highlights when computing exposure [2][2]. Another uses the median or mean of the histogram relative to a target gray level. Entropy-based AE searches for the exposure yielding maximum histogram entropy [2]. The key point is: metering reshapes the histogram before the exposure logic is applied. A bright sky dominates a matrix histogram but is nearly absent from a spot histogram centered on the subject. Figure 2 illustrates how different $w$ produce different effective luminance distributions.

### **Comparison and why it matters**

| **Mode** | **Weight Shape** | **Use-Cases** | **Pros / Cons** |
| --- | --- | --- | --- |
| **Matrix** | Broad, multi-zone; mild center bias | General scenes, mixed contrast | *Pros:* Balanced default. ([nikon-z9]) *Cons:* May underexpose small subjects against bright backgrounds. ([nikon-z9]) |
| **Center-Weighted** | Radial falloff (Gaussian-like) from center | Portraits, products, centered subjects | *Pros:* Resists distracting edges. ([nikon-z9]) *Cons:* Fails if subject is off-center. |
| **Spot** | Small circular support, soft inside | Backlit faces, stage lighting | *Pros:* Focuses on chosen area. *Cons:* Very sensitive to placement. ([nikon-z9]) |
| **Subject-Based** | Arbitrary mask (face/subject) | People, animals, off-center subjects | *Pros:* Exposes the subject, not frame. ([patents]) *Cons:* Depends on detection accuracy. ([patents]) |

![**Figure 2:** Matrix, Center‑weighted, Spot, and Subject‑based metering patterns, each shown as a 2D weight map (top row), the corresponding weighted luminance histogram (middle row), and the IQR‑trimmed histogram with 1.5×IQR fence (bottom row, red dashed line). The comparison illustrates how each metering pattern redistributes emphasis across the scene and how that emphasis changes the effective luminance distribution used for exposure decisions.](Exposure%20Value%20&%20Metering/image%201.png)

**Figure 2:** Matrix, Center‑weighted, Spot, and Subject‑based metering patterns, each shown as a 2D weight map (top row), the corresponding weighted luminance histogram (middle row), and the IQR‑trimmed histogram with 1.5×IQR fence (bottom row, red dashed line). The comparison illustrates how each metering pattern redistributes emphasis across the scene and how that emphasis changes the effective luminance distribution used for exposure decisions.

## **References**

[1] Nikon Corporation. (n.d.). Metering. [https://onlinemanual.nikonimglib.com/d850/en/11_exposure_01.html](https://onlinemanual.nikonimglib.com/d850/en/11_exposure_01.html) 

[2] *US20120307107A1 - automatic exposure control based on multiple regions* (n.d.). Google Patents. [https://patents.google.com/patent/US20120307107A1/en](https://patents.google.com/patent/US20120307107A1/en)