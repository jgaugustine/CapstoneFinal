# Light → Image: Cameras as Photon Counters

Cameras are fundamentally photon counters. Light from the scene arrives at the sensor, where each pixel collects photons during the exposure. The more photons collected, the stronger the signal—and the better the signal-to-noise ratio.

## What happens at this stage

- **Scene radiance** determines how many photons reach the sensor per unit area and time.
- **Exposure time** and **aperture** control how many photons each pixel receives.
- **Quantum efficiency (QE)** describes the fraction of arriving photons that generate electrons.

## Key concepts

- **Photon shot noise**: The random arrival of photons follows a Poisson distribution. This fundamental noise cannot be eliminated—only reduced by collecting more photons.
- **Expose to the right (ETTR)**: Maximizing exposure without clipping highlights improves SNR in the shadows.

*Explore the PhotonSimulation lab to see photon arrival and conversion in action.*
