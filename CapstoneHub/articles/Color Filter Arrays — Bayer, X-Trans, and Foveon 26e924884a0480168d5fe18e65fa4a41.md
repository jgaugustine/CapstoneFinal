# Color Filter Arrays — Bayer, X-Trans, and Foveon

Description: Pixels measure intensity; CFAs spatially sample color channels. Compares Bayer’s 2G:1R:1B layout (better luminance detail) with alternatives (X-Trans patterning, Foveon vertical stacking), and explains spectral response trade-offs.
Implementing?: Yes
Status: Writing
🎓 HC/LO Tracker: #modeling (https://www.notion.so/modeling-1b0924884a0481578121d1d08be9010f?pvs=21)

Camera sensors are colorblind. The photosites count photons. It doesn't distinguish between red, green, or blue light. They all register the same to silicon. So how does your camera create a color photograph from a device that only measures brightness?

When light hits a sensor, each photosite accumulates electrons. More light generates more electrons. That's the only information available. The sensor records how many photons arrived, but has no information about what color they were.

To capture color, we need to split light into its components. We need to know not just "how much light?" but "how much red light? How much green? How much blue?"

This is where the Color Filter Arrays (CFAs) comes in.

## Solution 1: The Bayer Pattern

In the 1970s, Bryce Bayer at Kodak developed a straightforward solution: place tiny color filters over each photosite. Some photosites would see only red light, some only green, some only blue. The full color image would be reconstructed from these separate pieces.

His pattern became the industry standard: a repeating 2×2 grid with one red filter, one blue, and two green[1]. He chose two green filters because our eyes are most sensitive to green light, and image sharpness comes primarily from brightness detail. More green samples translates to sharper perceived images.

![**Figure 1.** Retrieved from 9. Bayer CFA pattern.](Color%20Filter%20Arrays%20%E2%80%94%20Bayer,%20X-Trans,%20and%20Foveon/Screenshot_2025-10-28_at_4.41.18_PM.png)

**Figure 1.** Retrieved from 9. Bayer CFA pattern.

![**Figure 2.** Retrieved from 9. How Bayer CFA filters light.](Color%20Filter%20Arrays%20%E2%80%94%20Bayer,%20X-Trans,%20and%20Foveon/Screenshot_2025-10-28_at_4.41.32_PM.png)

**Figure 2.** Retrieved from 9. How Bayer CFA filters light.

### How It Works

When you photograph a red apple against a blue sky, here's what the sensor records:

- Red photosites under red parts of the scene collect many electrons
- Blue photosites under the sky collect many electrons
- Green photosites collect moderate amounts everywhere (since most real-world colors contain some green)
- For each photosite, the camera must estimate the two missing colors from neighboring sites

This estimation process is called demosaicing—mathematical interpolation to fill in the gaps. Where your sensor recorded a green value but needs red and blue, it examines nearby red and blue photosites and calculates what those colors likely were at that location.

When demosaicing works well, the interpolation is invisible. When it doesn't, artifacts appear: false colors, maze patterns, zipper-like edges along diagonals (more on this in the next section).

## Solution 2: X-Trans

Fujifilm examined the moiré problem and asked a different question: what if the sensor pattern itself prevented the artifacts?

X-Trans replaces Bayer's 2×2 grid with a larger, pseudo-random 6×6 pattern[3]. Instead of red-green-green-blue repeating every two pixels, X-Trans distributes colors more irregularly across 36 pixels before the pattern repeats.

The key principle: randomness disrupts moiré. Without a short repeating cycle in the sensor pattern, there's no reinforcement of regular patterns in the scene. No reinforcement means no interference artifacts[5].

### The X-Trans Design

Every row and column in an X-Trans block contains all three colors[2]. In Bayer, some rows lack red or blue entirely, which can create color errors when demosaicing fine detail. X-Trans ensures that on any line of pixels, red, green, and blue are all sampled, making color interpolation more accurate.

Green channels remain dominant (approximately 55% of photosites), preserving the luminance detail advantage, but they're arranged along diagonals and in clusters rather than a strict grid[3][4].

![**Figure 3.** Retrieved from [10]. X-Trans pattern.](Color%20Filter%20Arrays%20%E2%80%94%20Bayer,%20X-Trans,%20and%20Foveon/Screenshot_2025-12-13_at_7.33.22_PM.png)

**Figure 3.** Retrieved from [10]. X-Trans pattern.

### The Processing Challenge

X-Trans sensors are computationally demanding to demosaic.

The 6×6 pattern requires algorithms to analyze a larger neighborhood of pixels. Traditional Bayer demosaicers don't work—new algorithms had to be developed. Early software implementations struggled, sometimes producing "worm" artifacts in foliage and fine textures[1].

Processing time is also longer. Testing shows X-Trans demosaicing can take three times as long as Bayer for equivalent images[3]. Fujifilm has acknowledged that a 50-megapixel X-Trans sensor would be too computationally expensive to process at practical speeds which influenced their decision to use Bayer for medium-format cameras[3].

Over time, software has improved significantly. Modern RAW converters handle X-Trans well, though computational demands remain higher. The moiré reduction is measurable: Fuji cameras consistently capture fine detail without the rainbow artifacts that affect Bayer sensors.

X-Trans represents a tradeoff: sharper output in exchange for more complex processing.

## Solution 3: Foveon

Foveon took a fundamentally different approach: instead of arranging colored filters next to each other on the surface, stack three photodiodes vertically within the silicon[6].

Each pixel location has three detectors at different depths, exploiting how silicon absorbs different wavelengths at different depths. Blue light is absorbed near the surface. Green penetrates deeper. Red penetrates deepest[7].

The top photodiode layer primarily registers blue, the middle layer green, and the bottom layer red—using the silicon itself as a wavelength-dependent filter[6][7].

![**Figure 4.** Retrieved from [6]. Foveon CFA pixel photodiode layers.](Color%20Filter%20Arrays%20%E2%80%94%20Bayer,%20X-Trans,%20and%20Foveon/Screenshot_2025-12-13_at_7.34.10_PM.png)

**Figure 4.** Retrieved from [6]. Foveon CFA pixel photodiode layers.

### True Per-Pixel Color

This approach is fundamentally different from mosaic-based systems. Every pixel location captures full RGB information at the same spatial coordinate [8]. There's no mosaic to interpolate, no missing colors to estimate from neighbors.

Without demosaicing, there are no demosaicing artifacts. No color moiré. No maze patterns. No false colors at edges. Each pixel location simply contains complete color information [8].

In theory, this represents an ideal approach to color imaging—three complete sensors stacked together, each recording a different color, all perfectly aligned. Foveon's marketing reflected this: a 3-megapixel Foveon sensor was claimed to match a 10-megapixel Bayer for detail, since every photosite contributes full color information[7].

### The Implementation Challenges

If Foveon's approach is superior in concept, why hasn't it become standard?

The answer lies in several significant technical challenges:

1. The three layers don't cleanly separate into red, green, and blue channels. The top "blue" layer still absorbs green and red light. The middle "green" layer catches red photons. The bottom "red" layer receives whatever made it through the layers above [8]. Each layer's signal is a mixture of colors, not a pure channel. Color separation still requires processing—a matrix that multiplies and subtracts the layers to recover true RGB [8]. This mathematical separation can amplify noise, particularly in shadows where signals are weak.
2. Photons must traverse multiple layers. Some are absorbed in the wrong layer, some reflect back, some don't reach the bottom layer. The "red" photodiodes deep in the silicon receive fewer photons and generate weaker signals, leading to increased noise in that channel[7].
3. Building three stacked photodiodes requires epitaxial growth, precise doping at different depths, and managing readout from all three layers [8]. This is expensive, yield-limited, and hasn't scaled well. Sigma has worked for years on a full-frame Foveon sensor but continues to face technical obstacles [7].
4. Despite capturing all wavelengths of light (without color filter losses), Foveon sensors produce more noise in low light than equivalent Bayer sensors. The color separation mathematics amplifies noise. The deeper layers have lower quantum efficiency. Above ISO 800, Foveon images show noticeable color noise in shadows [7].

## Why This Matters

Understanding these sensor architectures clarifies your camera's capabilities and limitations.

If you notice faint color artifacts along edges in Bayer images, that's demosaicing. If X-Trans files take longer to import, that's the computational cost of moiré resistance. If you've seen remarkably detailed Sigma photographs and wondered about broader Foveon adoption, the answer lies in its narrow optimal operating range.

Every camera embodies one of these design philosophies. Knowing which approach your camera uses, and what it trades for its strengths, helps match your equipment to your work.

## References

[1]  *X-Trans vs Bayer: Which Sensor Reigns Supreme for Your Photography?*. Out of Focus. (2025, January 22). https://www.canonoutsideofauto.ca/2024/10/16/x-trans-vs-bayer-which-sensor-reigns-supreme-for-your-photography/ 

[2] *Fujifilm X-Trans Sensor*. (2025, November 6). Wikipedia. https://en.wikipedia.org/wiki/Fujifilm_X-Trans_sensor 

[3] Liles, J. M. (2017, March 3). X-trans vs Bayer: Fantastic claims and how to test them | by Jonathan Moore Liles | medium. [https://medium.com/@nevermindhim/x-trans-vs-bayer-fantastic-claims-and-how-to-test-them-475b4f1b7fae](https://medium.com/@nevermindhim/x-trans-vs-bayer-fantastic-claims-and-how-to-test-them-475b4f1b7fae) 

[4] X-Trans CMOS | FUJIFILM X Series & GFX - USA

https://www.fujifilm-x.com/en-us/products/x-trans-cmos/

[5] Koifman, V. (n.d.). *Fujifilm X-Trans CFA eliminates the need in OLPF*. Fujifilm X-Trans CFA Eliminates the Need in OLPF. http://image-sensors-world.blogspot.com/2013/01/fujifilm-x-trans-cfa-eliminates-need-in.html 

[6] *Foveon X3 sensor*. Wikipedia Foundation. https://en.wikipedia.org/wiki/Foveon_X3_sensor 

[7]  Cognard, T. (2022, June 13). *Foveon: The clever image sensor that has failed to catch on*. PetaPixel. https://petapixel.com/foveon-x3-image-sensor-explained/ 

[8] Turner, R., & Guttosch, R. (2006). Development challenges of a new image capture. [https://www.imaging.org/common/uploaded files/pdfs/Papers/2006/ICIS-0-736/33720.pdf](https://www.imaging.org/common/uploaded%20files/pdfs/Papers/2006/ICIS-0-736/33720.pdf) 

[9] *Bayer filter*. Wikipedia. [https://en.wikipedia.org/wiki/Fujifilm_X-Trans_sensor](https://en.wikipedia.org/wiki/Bayer_filter) 

[10] *The basics of the X-Trans Sensor Filter*. Crafting Pixels. (2022, January 7). https://pixelcraft.photo.blog/2022/01/07/the-basics-of-the-x-trans-sensor-filter/