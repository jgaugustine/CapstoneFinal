const e=`# Bit Depth & Dynamic Range— How Many Shades Can We Encode?
th
As we discussed, digital camera sensor begins with a physical measurement: light energy arriving at each photosite (often called a “pixel” on the sensor). In a widely used linear model, incoming photons generate charge (electrons), that charge is converted to a voltage, amplified by the camera’s electronics, and finally converted to a digital signal by an analog-to-digital converter (ADC) [1].

Once the ADC has sampled that analog voltage, it outputs an integer code. A *k*-bit camera produces digital gray values between 0 and (2^k-1); these are the discrete “bins” that represent brightness in the raw measurement domain. In practice, the *theoretical* range is rarely fully usable end-to-end because saturation/clipping at the top and noise/offset constraints at the bottom shrink the *practically usable* code range [1].

A helpful way to keep the pipeline straight is to separate two ideas: (1) how much signal the sensor can physically collect and distinguish (a dynamic-range question), and (2) how finely that signal is sliced into digital steps (a bit-depth/quantization question). Standards and measurement frameworks treat these as related but distinct, which is why you’ll see both “noise floor / sensitivity threshold” language and “ADC code / digitization” language used side-by-side [1][2][4]

## **Bit depth as intensity sampling resolution**

Bit depth, in its most general sense, describes how many distinct levels can be represented. More bits means more possible combinations, hence finer numerical precision for representing intensities or colors [3].  In camera-capture terms, bit depth is primarily governed by the ADC resolution: How many discrete output codes the converter can produce for a given analog input range.[4]

For an idealized ADC, the “step size” (the least significant bit, LSB) is set by the full-scale input range (FSR) divided by the number of quantization steps. A common ideal form is: [ \\text{LSB size} \\approx \\frac{\\text{FSR}}{2^N} ] and the conversion introduces a quantization uncertainty bounded on the order of (\\pm \\tfrac{1}{2}) LSB [5]. The analog world is continuous, but the recorded number must land on one of a finite set of rungs [5].

A concrete example shows why extra bits mean finer gradations. If the analog range presented to the ADC (after amplification) corresponds to 0 to 1.0 V, then:

- a 12-bit ADC maps that span into (2^{12}=4096) steps, or about (1/4096 \\approx 0.000244) V per step,
- a 14-bit ADC maps it into (2^{14}=16384) steps, or about (1/16384 \\approx 0.000061) V per step.

So going from 12-bit to 14-bit does not add a new “kind” of information, but it does make each brightness increment about four times finer (because (2^{14}/2^{12}=4)) [6].  That finer slicing is one reason higher bit depth can reduce visible banding/posterization when you later stretch tones in editing—because your adjustments are less likely to reveal the “rungs” in smooth gradients.

## **Dynamic range as a physical limit**

Dynamic range is about span. Its the range between the brightest signal that can be recorded without saturating and the faintest signal that can be distinguished above noise. We measure dynamic range as the ratio of the maximum measurable light intensity at pixel saturation to the minimum measurable intensity above read-out noise, often expressed in stops (powers of two). [6]

![**Figure 1.** Light transfer curve illustrating the practical limits of sensor dynamic range. At low signal levels, the noise floor is set by read noise, limiting the ability to distinguish very dark tones. As signal increases, shot noise dominates and grows with the square root of the collected charge, defining the linear operating region of the sensor. At high signal levels, the response approaches the pixel’s full well capacity, where saturation compresses highlights. The usable dynamic range is therefore bounded on the low end by read noise and on the high end by full well capacity, and is typically smaller in practice than the theoretical range due to noise, nonlinearity, and real-world operating constraints. Retrieved from [https://www.msss.com/http/near_cal/robinson_stuff/ltc.html](https://www.msss.com/http/near_cal/robinson_stuff/ltc.html)](Bit%20Depth%20&%20Dynamic%20Range%E2%80%94%20How%20Many%20Shades%20Can%20We%20/Screenshot_2026-02-24_at_1.10.25_PM.png)

**Figure 1.** Light transfer curve illustrating the practical limits of sensor dynamic range. At low signal levels, the noise floor is set by read noise, limiting the ability to distinguish very dark tones. As signal increases, shot noise dominates and grows with the square root of the collected charge, defining the linear operating region of the sensor. At high signal levels, the response approaches the pixel’s full well capacity, where saturation compresses highlights. The usable dynamic range is therefore bounded on the low end by read noise and on the high end by full well capacity, and is typically smaller in practice than the theoretical range due to noise, nonlinearity, and real-world operating constraints. Retrieved from [https://www.msss.com/http/near_cal/robinson_stuff/ltc.html](https://www.msss.com/http/near_cal/robinson_stuff/ltc.html)

In the language we discussed earlier, its the ratio of full well capacity (electrons) to read noise (electrons) [7]. But what about photon noise? Because photon/electron arrival is statistical, shot noise follows Poisson behavior, and the standard deviation scales as the square root of the signal [1]. This is why dynamic range is not merely about “how many electrons you can collect,” but also about what uncertainty you must live with at different signal levels [8] (figure 1).

## **Where bit depth and dynamic range meet**

Bit depth and dynamic range are tightly coupled in practice, but they answer different questions. One of the clearest metaphors is: dynamic range is the height of a staircase; bit depth is the number of steps [6].  A high-bit-depth ADC gives you many steps, but it does not magically make the staircase taller if sensor noise and saturation remain unchanged [6].

This is where quantization matters. If the ADC has *too few* bits for the sensor’s usable range, the step size can become large enough that quantization error becomes a meaningful part of the noise floor. Ideal quantization error is bounded around (\\pm \\tfrac{1}{2}) LSB, so coarse steps translate into rounding (figure 2).  

![**Figure 2:** Quantization of a continuous analog signal by an ideal ADC. The straight line represents the ideal linear relationship between analog input and digital output, while the stair-step curve shows the discrete output codes produced by finite bit depth. Each step corresponds to one least significant bit (LSB), and each digital code represents a finite range of input values centered on its midstep value. The lower plot illustrates the resulting quantization error, which is inherently bounded between −½ LSB and +½ LSB. This error reflects the unavoidable rounding introduced when a continuous signal is encoded into discrete digital levels. Retrieved from [https://www.ti.com/lit/an/slaa013/slaa013.pdf](https://www.ti.com/lit/an/slaa013/slaa013.pdf)](Bit%20Depth%20&%20Dynamic%20Range%E2%80%94%20How%20Many%20Shades%20Can%20We%20/Screenshot_2026-02-24_at_1.02.26_PM.png)

**Figure 2:** Quantization of a continuous analog signal by an ideal ADC. The straight line represents the ideal linear relationship between analog input and digital output, while the stair-step curve shows the discrete output codes produced by finite bit depth. Each step corresponds to one least significant bit (LSB), and each digital code represents a finite range of input values centered on its midstep value. The lower plot illustrates the resulting quantization error, which is inherently bounded between −½ LSB and +½ LSB. This error reflects the unavoidable rounding introduced when a continuous signal is encoded into discrete digital levels. Retrieved from [https://www.ti.com/lit/an/slaa013/slaa013.pdf](https://www.ti.com/lit/an/slaa013/slaa013.pdf)

Conversely, if the ADC has *more* bits than the sensor chain can effectively support, those additional codes can become “empty precision”. They exist numerically, but are dominated by sensor/electronic noise rather than new scene detail. 

This is the same intuition captured by the broader ADC concept of “bits on paper vs bits in practice,” where real-world noise and distortion reduce the effective number of usable bits compared with the nominal resolution [9].

## **Practical implications for RAW shooting and editing**

The most visible, day-to-day consequence of higher bit depth is not “more dynamic range,” but more editing headroom before you see artifacts when you apply strong tonal moves. Because high ADC precision mostly helps prevent posterization (color banding) when tones are stretched or remapped, its benefits show up most when you do aggressive shadow lifting, heavy local contrast, or large exposure corrections [6].  If noise is already high in the region you are pushing, extra steps may primarily be subdividing noise rather than revealing new texture. This is one reason bit-depth gains can be subtle unless your workflow stresses the file [7].

Camera manufacturers also treat bit depth as part of an overall throughput budget. Higher precision generally increases data volume and can stress readout/buffer pipelines, which is why some cameras reduce bit depth under high-speed or special modes. For example, Nikon explicitly lists a higher maximum frame rate in high-speed continuous (extended) shooting but a lower one when recording 14-bit NEF/RAW (12 fps versus 9 fps for 14-bit RAW) on the Z 6 specification page [10]  Sony similarly documents cases where RAW is normally 14-bit but becomes limited to 12-bit under certain shooting conditions (e.g., continuous shooting or silent shooting on some models), making the speed/precision trade-off explicit in official support documentation [11].

At the high end, some systems advertise or provide 16-bit RAW outputs, but the same “effective precision” caution still applies: what matters is whether the sensor and readout chain deliver correspondingly low noise and high usable range. Hasselblad markets the X2D 100C as supporting 16-bit color depth and continuous shooting of 16-bit RAW, paired with a stated 15-stop dynamic range [12].  Capture One’s documentation for Phase One RAW options is unusually candid about what this can mean: it describes a 16-bit variant designed to take advantage of a *15-bit dynamic range* for a specific sensor, and contrasts it with a smaller 14-bit RAW option [13].  Even Phase One’s own product material frames “16-bit RAW” as part of a workflow/data-rate capability (storage and transfer staying smooth “even when shooting 16-bit RAW images”), which is a reminder that bit depth is as much an engineering and pipeline choice as it is an image-quality headline [14].

In editing workflows, it’s also common to process RAW into higher-bit-depth working formats (for example, 16-bit-per-channel intermediates) not because it creates new sensor information, but because it reduces the chance of posterization during repeated tone and color operations [3].

## **References**

[1] European Machine Vision Association. (2010, November 29). *EMVA standard 1288: Standard for characterization of image sensors and cameras (Release 3.0)*. [https://www.emva.org/wp-content/uploads/EMVA1288-3.0.pdf](https://www.emva.org/wp-content/uploads/EMVA1288-3.0.pdf?utm_source=chatgpt.com)

[2] Imaging Science and Technology. (n.d.). *Digital camera noise tools*. [https://www.imaging.org/IST/IST/Standards/Digital_Camera_Noise_Tools.aspx](https://www.imaging.org/IST/IST/Standards/Digital_Camera_Noise_Tools.aspx?utm_source=chatgpt.com)

[3] Cambridge in Colour. (n.d.). *Bit depth*. [https://www.cambridgeincolour.com/tutorials/bit-depth.htm](https://www.cambridgeincolour.com/tutorials/bit-depth.htm?utm_source=chatgpt.com)

[4] Texas Instruments. (1997, June). *Time budgeting of the FlatLink interface (Application Report SLLA013)*. [https://www.ti.com/lit/an/slaa013/slaa013.pdf](https://www.ti.com/lit/an/slaa013/slaa013.pdf)

[5] Texas Instruments. (n.d.). *[Technical brief SLYY192A]*. [https://www.ti.com/lit/eb/slyy192a/slyy192a.pdf?ts=1771870493729](https://www.ti.com/lit/eb/slyy192a/slyy192a.pdf?ts=1771870493729)

[6]Cambridge in Colour. (n.d.). *Dynamic range*. [https://www.cambridgeincolour.com/tutorials/dynamic-range.htm](https://www.cambridgeincolour.com/tutorials/dynamic-range.htm?utm_source=chatgpt.com)

[7] Fellers, T., & Davidson, M. (n.d.). *Signal-to-noise ratio in CCD cameras*. [https://hamamatsu.magnet.fsu.edu/articles/ccdsnr.html](https://hamamatsu.magnet.fsu.edu/articles/ccdsnr.html)

[8] Gardner, G (n.d). *Taking a closer look at camera specifications*. [https://www.photonics.com/Articles/Taking-a-Closer-Look-at-Camera-Specifications/a15891](https://www.photonics.com/Articles/Taking-a-Closer-Look-at-Camera-Specifications/a15891?utm_source=chatgpt.com)

[9] O’bien, J. (2025 November 19). *Understanding ENOB (effective number of bits)*. [https://www.tek.com/en/blog/understanding-enob](https://www.tek.com/en/blog/understanding-enob)

[10] Nikon Corporation. (n.d.). *Nikon Z 6*. [https://imaging.nikon.com/imaging/lineup/mirrorless/z_6/](https://imaging.nikon.com/imaging/lineup/mirrorless/z_6/)

[11] Nikon Corporation. (n.d.). *Nikon Z 6*. [https://imaging.nikon.com/imaging/lineup/mirrorless/z_6/](https://imaging.nikon.com/imaging/lineup/mirrorless/z_6/)

[12] Hasselblad. (n.d.). *X2D 100C*. [https://www.hasselblad.com/x-system/x2d-100c/](https://www.hasselblad.com/x-system/x2d-100c/)

[13] Capture One. (n.d.). *Phase One RAW files option*. [https://support.captureone.com/hc/en-us/articles/360002564358-Phase-One-RAW-files-option](https://support.captureone.com/hc/en-us/articles/360002564358-Phase-One-RAW-files-option)`;export{e as default};
