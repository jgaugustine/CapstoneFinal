# Photon-to-Digital Converter Visualization

An interactive, comprehensive visualization of the complete photon-to-digital conversion process in image sensors. This educational tool demonstrates the physics and electronics involved in converting light into digital image data.

## Features

### 🔬 **Complete Physics Simulation**
- **Poisson Process Photon Generation**: Realistic photon arrival times based on light intensity
- **Quantum Efficiency**: Wavelength-dependent photon absorption probability
- **Photoelectric Effect**: Visual representation of photon-to-electron conversion
- **Charge Accumulation**: Real-time pixel well filling with electron counting
- **Noise Sources**: Shot noise, read noise, dark current, thermal noise, and fixed pattern noise

### 🎛️ **Interactive Controls**
- **Light Intensity**: Adjust photon flux (100-10,000 photons/sec)
- **Quantum Efficiency**: Control sensor sensitivity (10-100%)
- **Exposure Time**: Set integration period (0.1-10 seconds)
- **Bit Depth**: Choose ADC resolution (8-16 bits)
- **Noise Toggles**: Enable/disable various noise sources
- **Real-time Statistics**: Live monitoring of all simulation parameters

### 📊 **Advanced Visualizations**
- **Sensor Array**: 10×10 pixel grid with real-time charge visualization
- **Photon Stream**: Animated particles with wavelength-based coloring
- **Readout Chain**: Step-by-step conversion process visualization
- **QE Curve**: Interactive quantum efficiency vs wavelength plot
- **Statistics Panel**: Comprehensive performance metrics

### 🎨 **Scientific Design**
- **Dark Theme**: Optimized for scientific visualization
- **Color-coded Elements**: Intuitive visual representation of different processes
- **Smooth Animations**: 60fps particle system and transitions
- **Responsive Layout**: Works on desktop and tablet devices

## Technical Implementation

### **Physics Engine**
- Poisson process for photon generation using exponential distribution
- Wavelength-to-RGB conversion for visible spectrum visualization
- Quantum efficiency calculation with Gaussian curve approximation
- Multiple noise source simulation with proper statistical models

### **Animation System**
- HTML5 Canvas for smooth particle rendering
- RequestAnimationFrame for 60fps performance
- Efficient particle management with object pooling
- Real-time pixel state updates

### **Architecture**
- **React 18** with TypeScript for type safety
- **Tailwind CSS** for consistent styling
- **Radix UI** components for accessibility
- **Custom hooks** for animation and state management
- **Modular design** for easy extension

## Getting Started

### Prerequisites
- Node.js 18+ or Bun
- Modern web browser with Canvas support

### Installation
```bash
# Install dependencies
npm install
# or
bun install

# Start development server
npm run dev
# or
bun dev

# Build for production
npm run build
# or
bun build
```

### Usage
1. **Start the simulation** with the default parameters
2. **Adjust controls** to see how different settings affect the process
3. **Enable noise sources** to observe realistic sensor behavior
4. **Watch the readout chain** during the conversion phase
5. **Analyze statistics** to understand sensor performance

## Educational Value

This visualization is designed for:
- **Students** learning about image sensors and digital photography
- **Engineers** understanding sensor design trade-offs
- **Educators** teaching photonics and electronics concepts
- **Researchers** exploring sensor physics and noise characteristics

### Key Learning Objectives
- Understanding the photoelectric effect in silicon
- Learning about quantum efficiency and spectral response
- Exploring noise sources and their impact on image quality
- Understanding analog-to-digital conversion in image sensors
- Visualizing the complete pipeline from photons to pixels

## Physics Parameters

### **Realistic Sensor Values**
- **Photon Flux**: 10³ to 10⁶ photons/pixel/second
- **Quantum Efficiency**: 40-95% (wavelength dependent)
- **Full Well Capacity**: 10,000-100,000 electrons
- **Read Noise**: 1-10 electrons RMS
- **Bit Depth**: 12, 14, or 16 bits
- **Dark Current**: 0.01-1 electron/pixel/second

### **Noise Models**
- **Shot Noise**: √N (Poisson statistics)
- **Read Noise**: Gaussian distribution
- **Dark Current**: Time-dependent electron generation
- **Thermal Noise**: Temperature-dependent fluctuations
- **Fixed Pattern Noise**: Pixel-to-pixel gain variation

## Browser Compatibility

- **Chrome/Edge**: Full support with hardware acceleration
- **Firefox**: Full support
- **Safari**: Full support
- **Mobile**: Responsive design with touch controls

## Performance

- **60 FPS** particle animation
- **1000+ photons** rendered simultaneously
- **Real-time** statistics calculation
- **Smooth** UI interactions
- **Memory efficient** with object pooling

## Future Enhancements

- [ ] **3D Sensor Visualization**: Three-dimensional pixel array
- [ ] **Advanced Noise Models**: More sophisticated noise simulation
- [ ] **Multiple Sensor Types**: CCD vs CMOS comparison
- [ ] **Export Functionality**: Save simulation data and images
- [ ] **VR Support**: Immersive visualization experience
- [ ] **Multi-language**: Internationalization support

## Contributing

This project is part of a capstone collection of scientific visualizations. Contributions are welcome for:
- Additional physics models
- Performance optimizations
- Educational content
- Accessibility improvements
- Mobile responsiveness

## License

This project is created for educational purposes as part of a capstone project collection.

---

**Built with ❤️ for science education**
