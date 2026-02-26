const e=`# Light → Image — Cameras as Photon Counters

When we talk about cameras, we often say they “capture” a scene, as if they’re little boxes that somehow swallow reality whole. But at the hardware level, a camera is far less mystical and far more methodical: it’s a counter. Specifically, it’s a device that counts photons.

Every patch of light that reaches the lens is a stream of photons. These photons don’t arrive in a continuous flow but one by one, each carrying a discrete packet of energy [1]. The camera’s role is to record how many of them arrive.

The process begins at the sensor. A modern image sensor is made of silicon, and when a photon strikes it, there’s a chance it will knock an electron loose. This is the photoelectric effect—the same principle that earned Einstein his Nobel Prize. One photon can free one electron, and that freed electron is the most basic signal a camera can register [2].

When light hits the sensor, it's no longer "light" in the everyday sense. It transforms into an electrical charge moving through circuits in the camera [3][4].

However, not every photon generates an electron. Some pass through, some bounce away, some are absorbed without effect. The fraction that successfully produce electrons is called the quantum efficiency of the sensor [5].

If a sensor has a quantum efficiency of 40%, that means roughly 4 out of every 10 photons that hit the surface result in an electron. Most camera manufactures do not report the QE of their sensors; however, ball park estimates for hobby cameras is between 40-60% whereas the highest end, scientific grade sensors may reach 95% [6]. 

Side note: We are making generalizations when talking about Quantum Efficiency and light. In practice, different light is more effective at knocking electrons free. That is, QE is dependent on the wavelength (the color of the light), and in general, we specify the QE of a sensor by a curve, showing how the QE changes based on the type of light (7). 

This doesn’t change the basic mechanism — the camera is still counting photons — but it determines how many of them actually make it into the count.

The sensor itself isn’t one continuous surface but a grid of millions of *photosites*. Each photosite is a tiny region of silicon designed to collect photons and store the electrons they generate (4).

These photosites function as physical buckets, they're simply charge collectors, meaning they don’t capture any information about color. During an exposure, each photosite accumulates electrons produced by arriving photons [4].

When the image is read out, the charge in each photosite is translated into a pixel in the final image. This distinction is subtle but important [8]:

- Photosite = the physical location on the sensor where photons are converted to electrons.
- Pixel = the digital representation of that count in the finished image. This is a single number.

So, when you look at a 20-megapixel photograph, you’re really seeing the combined electron counts from 20 million tiny photosites.

Because each photon has only a *chance* of freeing an electron (based on QE), the results are probabilistic, but the law of large numbers ensures that, over millions of photons, those random variations average out. The number of electrons in each photosite becomes proportional to the amount of light that struck it. Bright areas of a scene send more photons, producing more electrons; darker areas send fewer, producing smaller counts.

When the exposure ends (shutter closes), each photosite contains an electrical charge proportional to the number of photons it counted. Reading out the image means measuring these charges. The accumulated charge in each photosite (analog) is converted to a number (digital) during readout, typically by amplifiers and an analog-to-digital converter (ADC) attached to the sensor [4][8].

Before exploring noise, randomness, and the complexities of real sensors, this simple concept is worth remembering. Light arrives one photon at a time, and the sensor tracks these arrivals by converting them into electrons, then into numbers.

### Why you should care:

Quantum efficiency determines how far into the dark a camera can see. A sensor with higher QE converts a greater fraction of incoming light into signal, which is especially critical in low-light conditions. In a dimly lit scene or night shot, every photon is precious. A high-QE sensor “wastes” less of those photons, more of them get counted as electrons, so the camera can gather more image information from scarce light. In practical terms, a camera with higher quantum efficiency will require less exposure time or lower amplification (ISO) to capture a given scene, compared to a lower-QE camera. By capturing more of the available photons, a high-QE sensor preserves detail and achieves a better signal-to-noise ratio in dark areas, reducing the need for heavy post-capture amplification that would boost noise. The result is cleaner images with less grain and more accurate tones in the shadows. In other words, QE defines how effectively a camera translates incoming photons into useful image data. Two cameras might face the same faint scene, but the one with higher QE can render it more faithfully, while the one with lower QE may struggle, forcing longer exposures (risking blur), higher ISO (introducing noise/grain), or simply failing to record certain details at all. High quantum efficiency empowers a camera to pull image information out of the darkness where lower-efficiency devices would yield only blur, grain, or silence.

**Footnotes:** 

1: Giberson, K. (2023). *Einstein describes the photoelectric effect: Research starters: EBSCO research*. EBSCO. [https://www.ebsco.com/research-starters/history/einstein-describes-photoelectric-effect#full-article](https://www.ebsco.com/research-starters/history/einstein-describes-photoelectric-effect#full-article) 

2: Einstein and the photoelectric effect. (n.d). [https://www.aps.org/apsnews/2005/01/einstein-photoelectric-effect](https://www.aps.org/apsnews/2005/01/einstein-photoelectric-effect) 

3: Glossary. Shtrs. (n.d.). [https://www.shtrs.co/glossary](https://www.shtrs.co/glossary) 

4: Metz, C., & Santoso, G. N. (2025b, January 15). The photoelectric effect in cameras. Chemistry LibreTexts. [https://chem.libretexts.org/Courses/Duke_University/CHEM_110_Honors_Writing_Projects/Duke_CHEM_110_Fall_2022%3A_Cox_and_Shorb/The_Photoelectric_Effect_in_Cameras](https://chem.libretexts.org/Courses/Duke_University/CHEM_110_Honors_Writing_Projects/Duke_CHEM_110_Fall_2022%3A_Cox_and_Shorb/The_Photoelectric_Effect_in_Cameras) 

5: Edmund Optics. (n.d.-a). Imaging Electronics 101: Understanding camera sensors for machine vision applications. [https://www.edmundoptics.com/knowledge-center/application-notes/imaging/understanding-camera-sensors-for-machine-vision-applications/](https://www.edmundoptics.com/knowledge-center/application-notes/imaging/understanding-camera-sensors-for-machine-vision-applications/)

6: Edmund Optics. (n.d.-a). Imaging Electronics 101: Understanding camera sensors for machine vision applications. [https://www.edmundoptics.com/knowledge-center/application-notes/imaging/understanding-camera-sensors-for-machine-vision-applications/](https://www.edmundoptics.com/knowledge-center/application-notes/imaging/understanding-camera-sensors-for-machine-vision-applications/)

7: Teledyne. (n.d.-d). Quantum efficiency. [https://www.teledynevisionsolutions.com/learn/learning-center/imaging-fundamentals/quantum-efficiency/](https://www.teledynevisionsolutions.com/learn/learning-center/imaging-fundamentals/quantum-efficiency/) 

8: From photosites to pixels (I) – the process. Crafting Pixels. (2021, May 10). [https://pixelcraft.photo.blog/2021/05/10/from-photosites-to-pixels-i-the-process/](https://pixelcraft.photo.blog/2021/05/10/from-photosites-to-pixels-i-the-process/)`;export{e as default};
