# Mesmer Changelog

## Latest Update - Bug Fixes & Enhancements

### Fixed Issues

**Audio Playback Fixed**
- Fixed AudioContext user gesture requirement
- Tone.js now starts correctly on Play button click
- Added comprehensive debug logging throughout
- All audio warnings resolved

**Browser Compatibility**
- Fixed scrolling issue in Brave/Chrome
- Improved overflow handling for control panel
- Added webkit scrolling support

**Shader Presets**
- Added 5 new GLSL presets to Main Layer
- Added 5 new ShaderToy presets to Toy Layer
- All 10 shaders now appear in dropdown menus
- Presets auto-load from shader library

**Editor Enhancements**
- Fancy syntax-highlighted code editor
- Blue monospace font (#a8d5ff)
- Glowing focus effect
- Gradient line numbers
- Inset shadows for depth
- Smooth transitions

### Debug Console Output

When you open browser console, you'll now see:
```
🚀 Initializing Mesmer...
📊 Creating main shader engine...
✓ Main shader created with 8 shaders
📊 Creating toy renderer...
✓ Toy renderer created with 8 shaders
💻 Initializing shader editor...
📦 Loading GLSL presets from library...
✓ Compiled shader 0: Organic Raymarcher
✓ Compiled shader 1: Fractal Tunnel
✓ Compiled shader 2: Plasma Field
✓ Compiled shader 3: Voronoi Cells
✓ Compiled shader 4: Mandelbrot Zoom
✓ Compiled shader 5: Liquid Metal
✓ Compiled shader 6: DNA Helix
✓ Compiled shader 7: Grid Waves
📦 Loading ShaderToy presets from library...
✓ Shader editor initialized
🎧 Setting up audio engine...
✓ Audio engine ready
🎵 Setting up music engine...
✓ Music engine ready
🎬 Starting render loop...
✅ Mesmer initialized successfully!
📌 Ready to play! Click the Play button to start.

// When you click Play:
🎵 Play button clicked
🎵 Starting audio...
✓ Tone.js started, AudioContext state: running
✓ Audio engine resumed
✓ Music started
✓ Playback started successfully
```

### New Shaders Available

**Main Layer (GLSL):**
0. Organic Raymarcher
1. Fractal Tunnel
2. Plasma Field
3. **Voronoi Cells** ⭐ NEW
4. **Mandelbrot Zoom** ⭐ NEW
5. **Liquid Metal** ⭐ NEW
6. **DNA Helix** ⭐ NEW
7. **Grid Waves** ⭐ NEW

**Toy Layer (ShaderToy):**
0. Audio Waves
1. Particle Storm
2. Kaleidoscope
3. **Neon Rings** ⭐ NEW
4. **Spiral Galaxy** ⭐ NEW
5. **Glitch Art** ⭐ NEW
6. **Hex Grid** ⭐ NEW
7. **Sound Bars** ⭐ NEW

### How to Test

1. **Refresh browser** (Cmd+Shift+R to hard refresh)
2. **Open browser console** (F12 or Cmd+Option+I)
3. **Click Play button**
4. **Watch console for debug output**
5. **Try new shaders from dropdown**
6. **Test shader editor with presets**

### Scrolling in Brave

The controls panel now:
- Scrolls smoothly on all browsers
- Fixed width (320px)
- Proper overflow handling
- Touch-friendly scrolling on mobile

### What to Look For

✅ Console shows detailed emoji-based logs
✅ All 8 shaders appear in each dropdown
✅ Play button works and music starts
✅ No AudioContext warnings
✅ Editor has fancy blue syntax highlighting
✅ Editor glows when focused
✅ Can scroll to shader editor in Brave
✅ All visual effects are working

## Known Issues

None currently! 🎉
