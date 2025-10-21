/**
 * TRON / Vector Graphics / Early CGI Shaders
 * Classic neon wireframe, grid-based, geometric aesthetics
 */

const TronShaders = {
    // ===== MAIN LAYER (GLSL) =====

    neon_grid: {
        name: '🔷 Neon Grid',
        description: 'Classic TRON grid floor with perspective',
        format: 'glsl',
        code: `#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_audioLow;
uniform float u_audioMid;
uniform float u_audioHigh;

out vec4 fragColor;

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;

    // Perspective grid
    float perspective = 1.0 / (1.0 - uv.y * 0.5);
    vec2 gridUV = uv * perspective + vec2(0.0, u_time * 0.2);

    // Grid lines
    vec2 grid = abs(fract(gridUV * 8.0) - 0.5);
    float lines = min(grid.x, grid.y);
    float gridPattern = smoothstep(0.02, 0.0, lines);

    // Audio reactive intensity
    float intensity = 0.5 + u_audioMid * 0.5;

    // Neon colors
    vec3 cyan = vec3(0.0, 1.0, 1.0);
    vec3 magenta = vec3(1.0, 0.0, 1.0);
    vec3 color = mix(cyan, magenta, uv.y + 0.5);

    // Glow effect
    float glow = gridPattern * intensity;
    color *= glow;
    color += gridPattern * 0.5;

    // Fade to horizon
    color *= smoothstep(-0.5, 0.5, uv.y);

    fragColor = vec4(color, 1.0);
}`
    },

    wireframe_tunnel: {
        name: '🔷 Wireframe Tunnel',
        description: 'Rotating wireframe tunnel like early vector graphics',
        format: 'glsl',
        code: `#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_audioLow;
uniform float u_audioMid;
uniform float u_audioHigh;

out vec4 fragColor;

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;

    // Polar coordinates
    float angle = atan(uv.y, uv.x);
    float radius = length(uv);

    // Tunnel depth
    float z = 1.0 / radius - u_time * 0.3;

    // Wireframe rings
    float rings = fract(z * 2.0);
    float ringLine = smoothstep(0.1, 0.0, abs(rings - 0.5) - 0.4);

    // Wireframe spokes
    float spokes = fract(angle * 8.0 / 6.28318);
    float spokeLine = smoothstep(0.05, 0.0, abs(spokes - 0.5) - 0.45);

    // Combine
    float wireframe = max(ringLine, spokeLine);

    // Audio reactive rotation
    float rotation = u_time + u_audioMid * 2.0;

    // Color gradient
    vec3 color1 = vec3(0.0, 0.8, 1.0); // Cyan
    vec3 color2 = vec3(1.0, 0.3, 0.0); // Orange
    vec3 color = mix(color1, color2, fract(z + rotation));

    color *= wireframe * (1.0 + u_audioHigh);

    fragColor = vec4(color, 1.0);
}`
    },

    vector_lines: {
        name: '🔷 Vector Lines',
        description: 'Glowing vector line patterns',
        format: 'glsl',
        code: `#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_audioLow;
uniform float u_audioMid;
uniform float u_audioHigh;

out vec4 fragColor;

float line(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    uv = (uv - 0.5) * 2.0;
    uv.x *= u_resolution.x / u_resolution.y;

    float t = u_time * 0.5;
    vec3 color = vec3(0.0);

    // Multiple animated vector lines
    for(float i = 0.0; i < 6.0; i++) {
        float phase = i * 1.047 + t;
        vec2 p1 = vec2(cos(phase), sin(phase)) * 0.8;
        vec2 p2 = vec2(cos(phase + 3.14159), sin(phase + 3.14159)) * 0.8;

        float d = line(uv, p1, p2);
        float thickness = 0.01 + u_audioMid * 0.02;
        float glow = thickness / d;

        vec3 lineColor = vec3(
            0.5 + 0.5 * cos(i + u_time),
            0.5 + 0.5 * sin(i * 2.0),
            1.0
        );

        color += lineColor * glow * 0.1 * (1.0 + u_audioHigh);
    }

    fragColor = vec4(color, 1.0);
}`
    },

    circuit_board: {
        name: '🔷 Circuit Board',
        description: 'Animated PCB traces and components',
        format: 'glsl',
        code: `#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_audioLow;
uniform float u_audioMid;
uniform float u_audioHigh;

out vec4 fragColor;

float box(vec2 p, vec2 size) {
    vec2 d = abs(p) - size;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
    uv *= 4.0;

    vec2 id = floor(uv);
    vec2 gv = fract(uv) - 0.5;

    vec3 color = vec3(0.0);

    // Random circuit pattern
    float n = fract(sin(dot(id, vec2(12.9898, 78.233))) * 43758.5453);

    // Horizontal traces
    if(n > 0.7) {
        float trace = smoothstep(0.05, 0.0, abs(gv.y));
        color += vec3(0.0, 1.0, 0.5) * trace;
    }

    // Vertical traces
    if(n > 0.4 && n < 0.7) {
        float trace = smoothstep(0.05, 0.0, abs(gv.x));
        color += vec3(0.0, 0.5, 1.0) * trace;
    }

    // Component pads
    if(n < 0.3) {
        float pad = smoothstep(0.15, 0.1, box(gv, vec2(0.1)));
        float pulse = 0.5 + 0.5 * sin(u_time * 2.0 + n * 10.0);
        color += vec3(1.0, 0.8, 0.0) * pad * pulse * (1.0 + u_audioMid);
    }

    // Grid
    vec2 grid = abs(fract(uv) - 0.5);
    float gridLine = min(grid.x, grid.y);
    color += vec3(0.1, 0.2, 0.3) * smoothstep(0.02, 0.0, gridLine);

    fragColor = vec4(color, 1.0);
}`
    },

    scan_lines: {
        name: '🔷 Scan Lines',
        description: 'CRT-style scan lines with digital glitches',
        format: 'glsl',
        code: `#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_audioLow;
uniform float u_audioMid;
uniform float u_audioHigh;

out vec4 fragColor;

float random(vec2 st) {
    return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;

    // Scan lines
    float scanline = sin(uv.y * 800.0 + u_time * 5.0) * 0.5 + 0.5;
    scanline = pow(scanline, 10.0);

    // Horizontal sync issues
    float glitch = step(0.98, random(vec2(floor(u_time * 10.0), floor(uv.y * 20.0))));
    uv.x += glitch * 0.1 * sin(u_time * 50.0);

    // RGB separation
    vec2 offset = vec2(0.005, 0.0) * u_audioHigh;
    float r = step(0.3, fract(uv.x * 20.0 + u_time));
    float g = step(0.3, fract((uv.x + offset.x) * 20.0 + u_time));
    float b = step(0.3, fract((uv.x - offset.x) * 20.0 + u_time));

    vec3 color = vec3(r, g, b);

    // Vertical bars
    float bars = smoothstep(0.5, 0.55, fract(uv.y * 8.0 + u_time * 0.2));
    color *= 0.5 + bars * 0.5;

    // Apply scanline
    color *= 0.8 + scanline * 0.2;

    // Vignette
    vec2 center = uv - 0.5;
    float vignette = 1.0 - dot(center, center) * 0.5;
    color *= vignette;

    // Glow
    color += vec3(0.0, 0.3, 0.5) * (1.0 + u_audioMid) * 0.2;

    fragColor = vec4(color, 1.0);
}`
    },

    // ===== TOY LAYER (ShaderToy format) =====

    light_cycles: {
        name: '🔷 Light Cycles',
        description: 'Moving light trails like TRON light cycles',
        format: 'shadertoy',
        code: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;

    vec3 color = vec3(0.0);

    // Multiple light cycles
    for(float i = 0.0; i < 4.0; i++) {
        float angle = i * 1.57 + iTime * 0.5;
        float radius = 0.3 + 0.2 * sin(iTime * 0.3 + i);

        vec2 pos = vec2(cos(angle), sin(angle)) * radius;
        float dist = length(uv - pos);

        // Trail
        float trail = smoothstep(0.1, 0.0, dist);
        vec3 cycleColor = vec3(
            0.5 + 0.5 * sin(i + iTime),
            0.5 + 0.5 * cos(i * 2.0),
            1.0
        );

        color += cycleColor * trail * (1.0 + iAudioMid);

        // Glow
        color += cycleColor * 0.02 / dist * (1.0 + iAudioHigh);
    }

    fragColor = vec4(color, 1.0);
}`
    },

    hex_grid: {
        name: '🔷 Hexagon Grid',
        description: 'Honeycomb hexagonal grid with neon edges',
        format: 'shadertoy',
        code: `vec2 hexCoords(vec2 uv) {
    const float s = 0.866025404; // sqrt(3)/2
    vec2 h = vec2(uv.x - uv.y * 0.5, uv.y * s);
    vec2 f = fract(h) - 0.5;
    vec2 i = h - f;

    if(abs(f.x) + abs(f.y) > 0.5) {
        vec2 s = sign(f);
        f = vec2(0.5 - abs(f.y) * s.y, 0.5 - abs(f.x) * s.x);
    }

    return i;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    uv *= 8.0;

    vec2 hexID = hexCoords(uv);
    vec2 hexUV = fract(uv) - 0.5;

    // Hex distance field
    float hexDist = abs(hexUV.x) + abs(hexUV.y) * 0.866025404;

    // Hex border
    float border = smoothstep(0.48, 0.45, hexDist);

    // Random per hex
    float n = fract(sin(dot(hexID, vec2(12.9898, 78.233))) * 43758.5453);

    // Pulse
    float pulse = 0.5 + 0.5 * sin(iTime * 2.0 + n * 10.0);

    // Color
    vec3 color1 = vec3(0.0, 1.0, 1.0);
    vec3 color2 = vec3(1.0, 0.0, 1.0);
    vec3 color = mix(color1, color2, n);

    color *= border * pulse * (0.5 + iAudioMid * 0.5);

    fragColor = vec4(color, 1.0);
}`
    },

    digital_rain: {
        name: '🔷 Digital Rain',
        description: 'Matrix-style falling code/digits',
        format: 'shadertoy',
        code: `float random(vec2 st) {
    return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    uv.x *= iResolution.x / iResolution.y;

    uv *= vec2(40.0, 30.0); // Grid size
    vec2 id = floor(uv);
    vec2 gv = fract(uv);

    // Random offset for each column
    float offset = random(vec2(id.x, 0.0));

    // Falling animation
    float fall = fract(iTime * 0.5 + offset);
    float yPos = fall * 30.0;

    // Character position
    float charDist = abs(id.y - yPos);

    // Brightness based on distance from head
    float brightness = exp(-charDist * 0.3);

    // Random character shape (simulated)
    float char = step(0.3, random(id + floor(iTime * 10.0)));

    // Grid shape
    float shape = char * step(0.2, gv.x) * step(gv.x, 0.8) *
                        step(0.2, gv.y) * step(gv.y, 0.8);

    // Green glow
    vec3 color = vec3(0.0, 1.0, 0.3) * shape * brightness;

    // Head glow (brightest point)
    if(charDist < 1.0) {
        color += vec3(0.5, 1.0, 0.5) * (1.0 - charDist) * (1.0 + iAudioHigh);
    }

    fragColor = vec4(color, 1.0);
}`
    },

    vector_scope: {
        name: '🔷 Vector Scope',
        description: 'Oscilloscope-style vector display',
        format: 'shadertoy',
        code: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;

    vec3 color = vec3(0.0);

    // Draw waveforms
    float numWaves = 3.0;
    for(float i = 0.0; i < numWaves; i++) {
        float freq = 2.0 + i * 2.0;
        float phase = i * 2.094;

        // Lissajous pattern
        float t = iTime * 0.5;
        vec2 wave = vec2(
            sin(t * freq + phase),
            cos(t * (freq + 1.0) + phase + 1.0)
        ) * 0.4;

        // Audio modulation
        wave *= (1.0 + iAudioMid * 0.3);

        float dist = length(uv - wave);

        // Trace
        float trace = smoothstep(0.02, 0.0, dist);

        // Glow
        float glow = 0.01 / dist;

        vec3 waveColor = vec3(
            0.5 + 0.5 * sin(i),
            0.5 + 0.5 * cos(i * 1.5),
            1.0
        );

        color += waveColor * (trace + glow * 0.5);
    }

    // Grid
    vec2 grid = abs(fract(uv * 4.0) - 0.5);
    float gridLine = min(grid.x, grid.y);
    color += vec3(0.0, 0.3, 0.3) * smoothstep(0.02, 0.0, gridLine) * 0.3;

    fragColor = vec4(color, 1.0);
}`
    },

    retro_blocks: {
        name: '🔷 Retro Blocks',
        description: 'Early CGI block patterns and transitions',
        format: 'shadertoy',
        code: `float box(vec2 p, vec2 size) {
    vec2 d = abs(p) - size;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    uv *= 3.0;

    vec2 id = floor(uv);
    vec2 gv = fract(uv) - 0.5;

    float n = fract(sin(dot(id, vec2(12.9898, 78.233))) * 43758.5453);

    // Animated blocks
    float anim = fract(iTime * 0.5 + n);
    float scale = 0.1 + anim * 0.4;

    float d = box(gv, vec2(scale));

    // Block face
    float block = smoothstep(0.01, 0.0, d);

    // Edge glow
    float edge = smoothstep(0.05, 0.0, abs(d));

    // Color based on position and time
    vec3 color1 = vec3(0.0, 1.0, 1.0);
    vec3 color2 = vec3(1.0, 0.0, 1.0);
    vec3 color3 = vec3(1.0, 1.0, 0.0);

    vec3 col = mix(color1, color2, n);
    col = mix(col, color3, anim);

    vec3 finalColor = col * block * 0.8 + col * edge * (1.0 + iAudioHigh);

    fragColor = vec4(finalColor, 1.0);
}`
    }
};
