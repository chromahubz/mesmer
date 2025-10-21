# MESMER

**Generative Audiovisual Engine**

A browser-based generative art engine that fuses AI-powered music generation with multi-layered GLSL visuals, creating an immersive Ethcapia-style experience.

## Features

- **Dual-Layer Visual System**
  - Main GLSL shader engine with raymarching, fractals, and plasma
  - ShaderToy-compatible secondary layer with audio-reactive effects
  - Real-time audio-reactive rendering

- **Live Shader Editor** ⭐ NEW
  - Write and compile custom GLSL/ShaderToy shaders in-browser
  - Toggle between GLSL and ShaderToy formats
  - 10+ built-in shader presets to learn from
  - Live compilation with error reporting
  - Syntax-highlighted code editor with line numbers
  - Copy/paste shaders from ShaderToy.com

- **Generative Music**
  - Algorithmic composition using Tone.js
  - Multi-track synthesis (pads, bass, leads, arpeggios)
  - Evolving scales and chord progressions
  - Professional reverb and delay effects

- **Audio Analysis**
  - Real-time frequency analysis
  - Low/mid/high band extraction
  - Smooth audio-reactive data for visuals

- **Modern UI**
  - Clean, minimal control panel
  - Live audio visualization
  - Shader switching
  - Volume and reverb controls
  - FPS monitoring

## Quick Start

1. **Open in browser:**
   ```bash
   npm run dev
   ```

2. **Or open directly:**
   - Simply open `index.html` in a modern browser (Chrome, Firefox, Edge)

3. **Click Play and enjoy!**

## Architecture

```
mesmer/
├── index.html              # Main HTML structure
├── styles.css              # UI styling
├── app.js                  # Main application orchestrator
├── lib/
│   └── shadertoy-lite.js   # ShaderToy renderer
└── src/
    ├── audio/
    │   ├── audio-engine.js      # Audio analysis
    │   └── generative-music.js  # Music generation
    └── visuals/
        ├── main-shader.js       # Main GLSL engine
        └── toy-renderer.js      # ShaderToy layer
```

## Controls

- **Play/Pause** - Start/stop generative music
- **Volume** - Master volume control
- **Reverb** - Reverb effect amount
- **Layer Toggles** - Show/hide visual layers
- **Shader Selectors** - Switch between different shaders
- **Fullscreen** - Enter fullscreen mode

## Shader Editor

### How to Use

1. **Click "Shader Editor"** to expand the editor panel
2. **Choose Format**:
   - **GLSL** - Full fragment shader (for Main Layer)
   - **ShaderToy** - mainImage() format (for Toy Layer)
3. **Select Target Layer**:
   - Main Layer or ShaderToy Layer
4. **Write or Paste Code**:
   - Write your own shader
   - Or click "Load Preset" to browse examples
5. **Click "Compile & Run"** to see your shader live!

### Available Uniforms

**GLSL Format (Main Layer):**
```glsl
uniform vec2 u_resolution;   // viewport resolution (in pixels)
uniform float u_time;         // time in seconds
uniform float u_audioLow;     // bass frequency (0.0-1.0)
uniform float u_audioMid;     // mid frequency (0.0-1.0)
uniform float u_audioHigh;    // treble frequency (0.0-1.0)
```

**ShaderToy Format (Toy Layer):**
```glsl
vec2 iResolution;    // viewport resolution (in pixels)
float iTime;         // time in seconds
float iAudioLow;     // bass frequency (0.0-1.0)
float iAudioMid;     // mid frequency (0.0-1.0)
float iAudioHigh;    // treble frequency (0.0-1.0)
```

### Preset Library

**GLSL Presets:**
- Voronoi Cells
- Mandelbrot Zoom
- Liquid Metal
- DNA Helix
- Grid Waves

**ShaderToy Presets:**
- Neon Rings
- Spiral Galaxy
- Glitch Art
- Hex Grid
- Sound Bars

### Tips

- Start with a preset and modify it
- Use audio uniforms to make visuals reactive
- Copy shaders from shadertoy.com (make sure to use ShaderToy format)
- Check browser console for compilation errors
- Save your favorite shaders externally

## Available Shaders

### Main Layer
1. **Organic Raymarcher** - Morphing 3D spheres with distortion
2. **Fractal Tunnel** - Hypnotic tunnel with rotating patterns
3. **Plasma Field** - Multi-layered plasma waves

### ShaderToy Layer
1. **Audio Waves** - Flowing sine waves
2. **Particle Storm** - Dynamic particle system
3. **Kaleidoscope** - Symmetrical patterns

## Browser Requirements

- WebGL 2.0 support
- Web Audio API support
- Modern JavaScript (ES6+)

Tested on:
- Chrome 90+
- Firefox 88+
- Edge 90+
- Safari 14+

## Technologies

- **Visuals**: WebGL 2.0, GLSL
- **Audio**: Web Audio API, Tone.js 14.8
- **Rendering**: Custom GLSL engines
- **UI**: Vanilla JavaScript, CSS3

## Customization

### Add New Shaders

Edit `src/visuals/main-shader.js` or `src/visuals/toy-renderer.js` to add new shader code.

### Modify Music

Edit `src/audio/generative-music.js` to change:
- Scales and progressions
- Instrument parameters
- Sequence patterns
- Evolution timing

### Adjust Audio Reactivity

Edit `src/audio/audio-engine.js` to modify:
- Frequency band ranges
- Smoothing factors
- Analysis resolution

## Performance

- Runs at 60 FPS on modern hardware
- Adjustable visual complexity via shader selection
- Optimized audio analysis
- Efficient dual-canvas rendering

## License

MIT

## Credits

Inspired by:
- Ethcapia
- ShaderToy community
- The Book of Shaders
- Tone.js

Built with love for generative art and creative coding.
# audioreactive
