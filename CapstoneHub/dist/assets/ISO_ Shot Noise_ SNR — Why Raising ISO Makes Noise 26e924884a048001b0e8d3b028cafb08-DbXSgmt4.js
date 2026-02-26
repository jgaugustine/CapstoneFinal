const e=`# ISO, Shot Noise, SNR — Why Raising ISO Makes Noise Visible

Up to now, we’ve treated light as a steady stream of energy—photons arriving and filling photosite wells predictably. But light, in reality, is quantized and stochastic. Photons arrive one by one, at random intervals, following the rules of probability. Even under constant illumination, this randomness means that each photosite receives a slightly different number of photons every exposure.

This randomness is called **shot noise** [1][3].

### Photon Arrivals as a Poisson Process

When photon arrivals are independent and equally probable over time, the count of arrivals ( $N$ ) in a fixed interval follows a **Poisson distribution** [1][2]**.**

$P(k, \\lambda) = \\frac{\\lambda^k e^{-\\lambda}}{k!}$

where

- ( $k$ ) = number of photon arrivals,
- ( $\\lambda$ ) = expected number of arrivals (the mean).

The defining property of a Poisson process is that its variance equals its mean [2][4]:

$\\sigma_N^2 = \\lambda \\quad \\Rightarrow \\quad \\sigma_N = \\sqrt{\\lambda}$

Thus, even if two photosites receive identical illumination (same $\\lambda$), their actual photon counts will differ slightly by roughly  $\\pm\\sqrt{\\lambda}$  due to random chance.

The **signal-to-noise ratio (SNR)** for photon shot noise is then:

$\\text{SNR} = \\frac{N}{\\sqrt{N}} = \\sqrt{N}$

This simple relation shows that collecting more photons improves SNR—but only as the square root of the signal. Doubling exposure time or aperture area (2× more photons) increases SNR by only about 1.4×, not 2× [3].

| Mean photon count ($N$) | Std. dev. ( $\\sqrt{N}$ ) | Relative noise ( $\\frac{\\sigma}{N}$ ) |
| --- | --- | --- |
| 25 | 5 | 20% |
| 100 | 10 | 10% |
| 10,000 | 100 | 1% |

At high photon counts, the random fluctuation becomes negligible. But in the dark—when each pixel might collect only a few dozen photons—these fluctuations become proportionally large and visible as noise.

### From Photons to Electrons

The randomness of photons translates directly into electron counts in the photosites. Each photon that generates an electron (based on the sensor’s quantum efficiency) contributes to the signal:

$N_e = QE \\times N_\\text{photons}$

Since the conversion process is linear, the same Poisson variance applies to electrons:

$\\sigma_e = \\sqrt{N_e}$

This **shot noise** is irreducible: even an ideal, noiseless sensor will exhibit it, because it arises from the fundamental statistics of light [1][4][5].

When engineers speak of a sensor being “photon-limited,” they mean that its total noise is dominated by shot noise rather than by the electronics. That’s the theoretical limit of image quality—when the camera is as good as the physics of light allows [5][13].

### ISO is an Analog Amplifier

When learning photography, you’re generally taught that ISO is the sensitivity of the camera sensor, which, when you increase is makes your images prone to noise. While this is a helpful heuristic, it implies that ISO creates noise. As we explored above, shot noise is irreducible and there will always be noise. Higher ISOs make the existing noise more visible. 

Once electrons are collected, the sensor reads them out as a voltage, then passes that through an **analog amplifier** before digitization by the ADC. ISO is a label for the gain applied in this analog stage [8][9].

Doubling ISO doubles the amplifier gain—both the signal and its noise are multiplied by the same factor. No new information is captured; we are boosting what was already there [8][10].

At **base ISO**, the amplifier is calibrated so that full-well capacity roughly matches the ADC’s maximum input. At higher ISO, the amplifier reaches its saturation voltage sooner. The same number of electrons produces a larger voltage, so fewer electrons are needed to clip the signal at the ADC’s ceiling [8][10].

Mathematically, if ($G$) is the analog gain (proportional to ISO), and ($S$) is the signal voltage per electron, then:

$V_\\text{out} = G \\times S \\times N_e$

The ADC clips when  $V_\\text{out} \\geq V_\\text{max}$ .

Therefore, the effective maximum number of electrons before clipping shrinks with ISO:

$N_{e,\\text{max}} = \\frac{V_\\text{max}}{G S}$

Every doubling of ISO halves  $N_{e,\\text{max}}$ , cutting highlight headroom and reducing the usuable range (the **dynamic range** - more on this later) [10][12].

### Why High ISO Looks “Noisy”

At low ISO and bright light, each photosite might collect 20,000 electrons. The shot noise is $\\sqrt{20{,}000} = 141$$e⁻$, just 0.7% of the signal—imperceptible.

In dim light, suppose only 100 electrons are captured. Shot noise is $\\sqrt{100} = 10 e⁻$—a 10% variation. When the amplifier boosts both signal and noise, that 10% fluctuation becomes visible as grain [5][13].

At the same time, electronic read noise (thermal and circuit noise) remains roughly constant in electrons but gets amplified too, contributing more to the final image. The combined noise (shot + read) becomes:

$\\sigma_\\text{total} = \\sqrt{\\sigma_\\text{shot}^2 + \\sigma_\\text{read}^2}$

In bright conditions,  $\\sigma_\\text{shot} \\gg \\sigma_\\text{read}$ , so the total is dominated by photon statistics. In the dark,  $\\sigma_\\text{read}$  may dominate, leading to shadow noise and banding [5].

### ISO and Dynamic Range Tradeoff

Dynamic range (DR) can be roughly modeled as:

$\\text{DR} = 20 \\log_{10}!\\left(\\frac{N_{e,\\text{max}}}{\\sigma_\\text{read}}\\right)$

As ISO increases,  $N_{e,\\text{max}}$  decreases while  $\\sigma_\\text{read}$  (in output units) stays constant or rises slightly, compressing the usable range. This is why cameras lose highlight detail at high ISO even though shadows become visible—the upper bound collapses faster than the lower bound improves [10][12].

Dual-gain and modern back-illuminated sensors mitigate this by switching to higher conversion gain in low light, but they cannot escape the fundamental physics: ISO can amplify signal, not information [11].

### The Physics of “Grain”

What we perceive as *grain* in a high-ISO photo is the visual expression of photon randomness. Each pixel’s brightness jitters around its true mean value because it counted a slightly different number of photons. 

This is why long exposures, wide apertures, or higher quantum efficiency all reduce visible noise: they collect more photons, increasing ( $N_e$ ) and thereby improving SNR as ( $\\sqrt{N_e}$ ).

![**Figure 1 ****Simulated photon arrival histograms under equal illumination: top, bright light (large $N$, small relative variance); bottom, dim light (small $N$, large relative variance). Both follow Poisson statistics, but amplification at high ISO exposes the stochastic pattern of light itself. The low light follows ~Poisson(10) and the bright light ~Poisson(1000) [6][7].](ISO,%20Shot%20Noise,%20SNR%20%E2%80%94%20Why%20Raising%20ISO%20Makes%20Noise/Screenshot_2025-10-26_at_3.42.44_PM.png)

**Figure 1 ****Simulated photon arrival histograms under equal illumination: top, bright light (large $N$, small relative variance); bottom, dim light (small $N$, large relative variance). Both follow Poisson statistics, but amplification at high ISO exposes the stochastic pattern of light itself. The low light follows ~Poisson(10) and the bright light ~Poisson(1000) [6][7].

The histograms in Figure 1 reveal the statistical behavior of photon arrivals at a *single* photosite measured repeatedly over time. But a photograph is not made from one pixel sampled thousands of times—it's made from *thousands of pixels* sampled once, simultaneously.

### From Statistics to Spatial Patterns

The histograms in Figure 1 reveal the statistical behavior of photon arrivals at a *single* photosite measured repeatedly over time. But a photograph is not made from one pixel sampled thousands of times—it's made from *thousands of pixels* sampled once, simultaneously.

This is where shot noise transforms from an abstract probability distribution into visible grain.

Consider a camera sensor pointed at a uniform surface under two different lighting conditions. In bright light, each pixel might collect ( $\\lambda = 1024$) photons during the exposure. In dim light, only ( $\\lambda = 16$) photons arrive at each pixel. If light were deterministic, all pixels in each scene would record identical counts, producing perfectly smooth images.

But light is not deterministic. Each photosite independently samples from its respective Poisson distribution, creating pixel-to-pixel variation even when viewing a uniform surface [1][2]:

Bright scene: The Poisson statistics dictate a standard deviation of ( $\\sqrt{1024} = 32$) photons. This $±32$  photon variation represents only $32/1024 = 3.2$% of the mean—imperceptible to the eye. Neighboring pixels differ by at most a few percent.

Dim scene: The standard deviation is ($\\sqrt{16} = 4$) photons, representing $4/16=25$%  of the mean—a dramatically different relative magnitude. Neighboring pixels that should look identical can differ by factors of nearly $2×$. One pixel might capture 12 photons while its neighbor captures 20—both perfectly normal outcomes from the same ~Poisson(16) distribution, but wildly different in relative terms.

![**Figure 2**: Spatial shot noise visualization showing three images of a uniform surface. Left: bright scene (1024 photons/pixel) at ISO 100 produces a smooth mid-gray image with 3.2% relative noise. Middle: dim scene (16 photons/pixel) at ISO 100 produces an underexposed, nearly black image—the noise exists but is invisible. Right: the identical photon counts from the middle panel, amplified at ISO 6400 (6400/base ISO = 64), produces a properly exposed but grainy image. The grain arises not from the ISO setting, but from the 26% relative variance inherent in capturing only 16 photons per pixel. ](ISO,%20Shot%20Noise,%20SNR%20%E2%80%94%20Why%20Raising%20ISO%20Makes%20Noise/image.png)

**Figure 2**: Spatial shot noise visualization showing three images of a uniform surface. Left: bright scene (1024 photons/pixel) at ISO 100 produces a smooth mid-gray image with 3.2% relative noise. Middle: dim scene (16 photons/pixel) at ISO 100 produces an underexposed, nearly black image—the noise exists but is invisible. Right: the identical photon counts from the middle panel, amplified at ISO 6400 (6400/base ISO = 64), produces a properly exposed but grainy image. The grain arises not from the ISO setting, but from the 26% relative variance inherent in capturing only 16 photons per pixel. 

Lets make this more explicit, zooming in on a 5x5 grid, Figure 3 shows the photon counts, and output.

![**Figure 3:** Raw photon counts and their processed outputs. The three panels show identical layouts but different processing gains. Notice that the middle and right panels display identical photon counts (e.g., 15, 13, 18 photons)—the same raw sensor data—but radically different output values. At ISO 100, 16 photons produce a brightness value of ~2 (underexposed). At ISO 6400, those same 16 photons produce values ranging from 48 to 192, with massive pixel-to-pixel variation visible as grain. The noise was always present in the photon counts; amplification makes it visible by scaling both signal and noise proportionally.](ISO,%20Shot%20Noise,%20SNR%20%E2%80%94%20Why%20Raising%20ISO%20Makes%20Noise/e8429411-f932-46a5-88f3-9f3580b80e61.png)

**Figure 3:** Raw photon counts and their processed outputs. The three panels show identical layouts but different processing gains. Notice that the middle and right panels display identical photon counts (e.g., 15, 13, 18 photons)—the same raw sensor data—but radically different output values. At ISO 100, 16 photons produce a brightness value of ~2 (underexposed). At ISO 6400, those same 16 photons produce values ranging from 48 to 192, with massive pixel-to-pixel variation visible as grain. The noise was always present in the photon counts; amplification makes it visible by scaling both signal and noise proportionally.

The 26% relative variance was always present in the photon counts; high ISO simply makes it visible by lifting it above the noise floor.

![**Figure 4:** Top: Cross-section along a single row shows pixel-to-pixel fluctuation. The bright scene (green) varies gently by $±8$% around its mean. The dim scene at high ISO (red) swings wildly by $±50$% despite all pixels viewing the same uniform surface—this is the visible grain. Bottom: Histograms of all 400 pixels. The bright scene clusters in a tight distribution ($3.2$% coefficient of variation), while the amplified dim scene spreads across the full tonal range ($25$% coefficient of variation). Both distributions follow Poisson statistics; the dramatic difference in appearance stems from the square-root scaling of shot noise: ( $\\sigma/\\mu = 1/\\sqrt{N}$ ).](ISO,%20Shot%20Noise,%20SNR%20%E2%80%94%20Why%20Raising%20ISO%20Makes%20Noise/image%201.png)

**Figure 4:** Top: Cross-section along a single row shows pixel-to-pixel fluctuation. The bright scene (green) varies gently by $±8$% around its mean. The dim scene at high ISO (red) swings wildly by $±50$% despite all pixels viewing the same uniform surface—this is the visible grain. Bottom: Histograms of all 400 pixels. The bright scene clusters in a tight distribution ($3.2$% coefficient of variation), while the amplified dim scene spreads across the full tonal range ($25$% coefficient of variation). Both distributions follow Poisson statistics; the dramatic difference in appearance stems from the square-root scaling of shot noise: ( $\\sigma/\\mu = 1/\\sqrt{N}$ ).

The top panel shows a cross-section along a single row of pixels—a horizontal slice through each image:

- Green line (Bright @ ISO 100): The line gently undulates between 120 and 140, staying close to the mean of 128. This ±10-unit variation represents the 3.2% noise—barely perceptible.
- Blue line (Dim @ ISO 100): A flat line hugging zero. The photon noise exists but is compressed into invisibility by the lack of amplification.
- Red line (Dim @ ISO 6400): Wild fluctuations from 80 to 230—pixels that should be identical (all viewing the same uniform surface) differ by the full dynamic range of the sensor. This is the grain we see.

The bottom panel shows histograms of all 400 pixels in each image:

- Green histogram (Bright @ ISO 100): A tall, narrow peak centered at 127. Nearly all pixels fall within ±10 units of the mean. The coefficient of variation is 3.2%, yielding a smooth, professional-looking image.
- Red histogram (Dim @ ISO 6400): A wide, flat distribution spanning from 40 to 230. Pixels are scattered across the entire tonal range despite viewing a uniform surface. The coefficient of variation is 26%, creating severe visible grain.

The insight is that both histograms represent the same Poisson process, just at different photon count regimes. In other words, its the same process but at different light levels.

### The Fundamental Limit

No camera technology can eliminate shot noise at low photon counts. Even a theoretically perfect sensor with zero read noise, zero dark current, and 100% quantum efficiency would exhibit 25% grain when capturing only 16 photons per pixel, because the grain originates in quantum statistics [1][4][5].

The only solutions are to collect more photons:

- Longer exposure: More time for photons to accumulate
- Wider aperture: More photons per unit time
- Larger pixels: Greater collection area per pixel
- Brighter scene: More photons emitted

Going from ( $\\lambda = 16$) to ( $\\lambda = 1024$ )—a $64×$ increase—reduces relative noise from $25$% to $3.2$%, an $8×$ improvement in SNR (since $\\sqrt{64} = 8$). This is the power of the square-root law: noise improves not linearly with photon count, but as ($\\sqrt{N}$ ).

This is the photon shot noise limit: the theoretical best performance of any imaging system, bounded not by electronics or manufacturing, but by the nature of light itself [1][3][5].

### Why You Should Care

Shot noise is light’s randomness. High ISO doesn’t create it; it reveals it. Clean images come from capturing more photons with longer exposures, wider apertures, brighter scenes, or more efficient sensors. 

Code here:

[Google Colab](https://colab.research.google.com/drive/1JAkht2F-cddvkmvbSWyAe9ZttTi8rdt5?usp=sharing)

**Footnotes:**

1. Hasinoff, S. W. (2014). "Photon, Poisson Noise." In *Computer Vision: A Reference Guide*, Springer. [https://link.springer.com/referenceworkentry/10.1007/978-0-387-31439-6_482](https://link.springer.com/referenceworkentry/10.1007/978-0-387-31439-6_482)
2. Hasinoff, S. W. (2012). "Photon, Poisson Noise." Preprint. [https://people.csail.mit.edu/hasinoff/pubs/hasinoff-photon-2012-preprint.pdf](https://people.csail.mit.edu/hasinoff/pubs/hasinoff-photon-2012-preprint.pdf)
3. Wikipedia. "Shot Noise." [https://en.wikipedia.org/wiki/Shot_noise](https://en.wikipedia.org/wiki/Shot_noise)
4. ScienceDirect Topics. "Photon Shot Noise." [https://www.sciencedirect.com/topics/engineering/photon-shot-noise](https://www.sciencedirect.com/topics/engineering/photon-shot-noise)
5. Janesick, J. R. (2007). *Photon Transfer: DN → λ*. SPIE Press Monograph Vol. PM170. [https://spie.org/publications/book/725073](https://spie.org/publications/book/725073)
6. Ma, J., Masoodian, S., Starkey, D. A., & Fossum, E. R. (2017). "Photon-number-resolving megapixel image sensor at room temperature without avalanche gain." *Optica*, 4(12), 1474–1481. [https://www.researchgate.net/publication/321369678_Photon-number-resolving_megapixel_image_sensor_at_room_temperature_without_avalanche_gain](https://www.researchgate.net/publication/321369678_Photon-number-resolving_megapixel_image_sensor_at_room_temperature_without_avalanche_gain?__cf_chl_tk=U0prdF9sC7yEa.nwclp9050JKWipoHpLjkpKcqy2fjk-1761538542-1.0.1.1-rQaYRjNTYmVI5iJhji.xD3XNb4aFy6F3EBpq1qoB48o)
7. Jack Hogan (2025). "Photons, Shot Noise and Poisson Processes." *Strolls with my Dog*. [https://www.strollswithmydog.com/photons-poisson-shot-noise/](https://www.strollswithmydog.com/photons-poisson-shot-noise/)
8. RED Digital Cinema (2008). "ISO Speed Revisited." [https://www.red.com/red-101/iso-speed-revisited](https://www.red.com/red-101/iso-speed-revisited)
9. AbelCine (2013). "Sense And Sensitivity: ISO, EI, and Gain Explained." [https://www.abelcine.com/articles/blog-and-knowledge/tutorials-and-guides/iso-ei-and-gain-explained](https://www.abelcine.com/articles/blog-and-knowledge/tutorials-and-guides/iso-ei-and-gain-explained)
10. PhotoPXL (2020). "Noise, ISO and Dynamic Range Explained." [https://photopxl.com/noise-iso-and-dynamic-range-explained/](https://photopxl.com/noise-iso-and-dynamic-range-explained/)
11. Digital Photography Review (2023). "Ins and outs of ISO: where ISO gets complex." [https://www.dpreview.com/articles/5426898916/ins-and-outs-of-iso-where-iso-gets-complex](https://www.dpreview.com/articles/5426898916/ins-and-outs-of-iso-where-iso-gets-complex)
12. Grey Scale Motion Pictures (2020). "Understanding ISO selection vs. Effective Dynamic Range." [https://greyscalemp.com/blog/2020/2/25/iso-choice-vs-effect-dynamic-range](https://greyscalemp.com/blog/2020/2/25/iso-choice-vs-effect-dynamic-range)
13. Photography Stack Exchange. "Is Poisson Noise a significant source of noise for typical photography?" [https://photo.stackexchange.com/questions/37850/](https://photo.stackexchange.com/questions/37850/)`;export{e as default};
