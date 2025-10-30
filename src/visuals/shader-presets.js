/**
 * Shader Preset Library
 * Collection of GLSL and ShaderToy-format shaders
 */

const ShaderPresets = {
    // GLSL Format Shaders (for Main Layer)
    glsl: [
        {
            name: 'Voronoi Cells',
            description: 'Animated Voronoi diagram with audio reactivity',
            format: 'glsl',
            code: `#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_audioLow;
uniform float u_audioMid;
uniform float u_audioHigh;

out vec4 fragColor;

vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453);
}

float voronoi(vec2 x) {
    vec2 n = floor(x);
    vec2 f = fract(x);

    float minDist = 1.0;
    for (int j = -1; j <= 1; j++) {
        for (int i = -1; i <= 1; i++) {
            vec2 b = vec2(float(i), float(j));
            vec2 r = b - f + hash2(n + b);
            r.x += sin(u_time * 0.5 + u_audioLow * 2.0) * 0.3;
            r.y += cos(u_time * 0.7 + u_audioMid * 2.0) * 0.3;
            float d = length(r);
            minDist = min(minDist, d);
        }
    }
    return minDist;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.y;

    float scale = 5.0 + u_audioHigh * 3.0;
    float v = voronoi(uv * scale);

    vec3 col = vec3(
        0.5 + 0.5 * sin(v * 10.0 + u_time + u_audioLow * 2.0),
        0.5 + 0.5 * cos(v * 8.0 + u_time * 0.7 + u_audioMid * 2.0),
        0.5 + 0.5 * sin(v * 12.0 + u_time * 0.5 + u_audioHigh * 2.0)
    );

    fragColor = vec4(col, 1.0);
}`
        },
        {
            name: 'Mandelbrot Zoom',
            description: 'Classic Mandelbrot fractal with audio-driven zoom',
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
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;

    float zoom = 0.5 + sin(u_time * 0.3) * 0.3 + u_audioLow * 0.5;
    uv = uv / zoom - vec2(0.5, 0.0);

    vec2 z = vec2(0.0);
    int iterations = 0;
    int maxIter = 100;

    for (int i = 0; i < 100; i++) {
        if (i >= maxIter) break;
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + uv;
        if (length(z) > 2.0) break;
        iterations++;
    }

    float t = float(iterations) / float(maxIter);

    vec3 col = vec3(
        0.5 + 0.5 * sin(t * 10.0 + u_audioLow * 2.0),
        0.5 + 0.5 * cos(t * 8.0 + u_audioMid * 2.0),
        0.5 + 0.5 * sin(t * 12.0 + u_audioHigh * 2.0)
    );

    fragColor = vec4(col, 1.0);
}`
        },
        {
            name: 'Liquid Metal',
            description: 'Flowing metallic surface simulation',
            format: 'glsl',
            code: `#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_audioLow;
uniform float u_audioMid;
uniform float u_audioHigh;

out vec4 fragColor;

float noise(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= u_resolution.x / u_resolution.y;

    float t = u_time * 0.5;
    vec3 col = vec3(0.0);

    for (float i = 0.0; i < 5.0; i++) {
        vec2 q = p;
        q.x += sin(t + i + u_audioLow * 2.0) * 0.5;
        q.y += cos(t * 0.7 + i + u_audioMid * 1.5) * 0.5;

        float d = length(q);
        float wave = sin(d * 10.0 - t * 2.0 + i + u_audioHigh * 3.0);

        col += vec3(0.3, 0.6, 0.9) * wave / (d + 0.5);
    }

    col = pow(col, vec3(1.5));
    fragColor = vec4(col, 1.0);
}`
        },
        {
            name: 'DNA Helix',
            description: 'Rotating double helix structure',
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
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;

    float t = u_time * 0.5;
    vec3 col = vec3(0.0);

    for (float i = 0.0; i < 20.0; i++) {
        float z = i * 0.3 - t;
        float size = 0.3 + u_audioMid * 0.2;

        vec2 pos1 = vec2(sin(z) * size, z);
        vec2 pos2 = vec2(-sin(z) * size, z);

        float d1 = length(uv - pos1);
        float d2 = length(uv - pos2);

        float glow = 0.02 / (d1 + 0.01);
        glow += 0.02 / (d2 + 0.01);

        vec3 color1 = vec3(1.0, 0.3, 0.5) * glow;
        vec3 color2 = vec3(0.3, 0.5, 1.0) * glow;

        col += color1 + color2;

        // Connecting bars
        if (mod(z, 0.5) < 0.05) {
            float bar = abs(uv.y - z) < 0.01 ? 1.0 : 0.0;
            col += vec3(0.5, 0.8, 0.3) * bar * (1.0 + u_audioHigh);
        }
    }

    fragColor = vec4(col, 1.0);
}`
        },
        {
            name: 'Grid Waves',
            description: 'Undulating 3D grid with perspective',
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
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;

    float perspective = 2.0;
    uv.y += perspective;
    uv /= uv.y * 0.5;

    float t = u_time * 0.5;

    float wave = sin(uv.x * 5.0 + t + u_audioLow * 2.0) * 0.5;
    wave += cos(uv.x * 3.0 - t * 0.7 + u_audioMid * 1.5) * 0.3;

    vec2 grid = fract(uv * vec2(10.0, 30.0) + vec2(0.0, t + wave));
    float lines = step(0.95, grid.x) + step(0.95, grid.y);

    vec3 col = vec3(lines);
    col *= vec3(
        0.5 + 0.5 * sin(uv.y * 2.0 + u_audioLow),
        0.5 + 0.5 * cos(uv.y * 1.5 + u_audioMid),
        0.7 + 0.3 * sin(uv.y + u_audioHigh)
    );

    fragColor = vec4(col, 1.0);
}`
        },
        {
            name: 'Vector Lines',
            description: 'Flowing audio-reactive vector line patterns',
            format: 'glsl',
            code: `#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_audioLow;
uniform float u_audioMid;
uniform float u_audioHigh;

out vec4 fragColor;

float hash(float n) {
    return fract(sin(n) * 43758.5453);
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;

    vec3 col = vec3(0.0);
    float t = u_time * 0.5;

    // Multiple flowing lines
    for (float i = 0.0; i < 12.0; i++) {
        float offset = hash(i) * 6.28;
        float speed = 0.5 + hash(i + 10.0) * 0.5;

        // Line position
        float y = sin(uv.x * 3.0 + t * speed + offset + u_audioLow * 2.0) * 0.3;
        y += cos(uv.x * 5.0 - t * speed * 0.7 + offset + u_audioMid * 1.5) * 0.15;

        // Audio amplitude affects line width
        float width = 0.005 + u_audioHigh * 0.01;
        float line = smoothstep(width, 0.0, abs(uv.y - y));

        // Color varies per line
        vec3 lineColor = vec3(
            0.5 + 0.5 * sin(i * 0.5 + t + u_audioLow * 2.0),
            0.5 + 0.5 * cos(i * 0.7 + t * 0.8 + u_audioMid * 2.0),
            0.5 + 0.5 * sin(i * 0.3 + t * 0.6 + u_audioHigh * 2.0)
        );

        // Add glow
        float glow = 0.02 / (abs(uv.y - y) + 0.02);
        col += line * lineColor * 2.0;
        col += glow * lineColor * 0.3 * (1.0 + u_audioMid);
    }

    fragColor = vec4(col, 1.0);
}`
        },
        {
            name: 'Colorful Swirl',
            description: 'Hypnotic spiraling colors with audio reactivity',
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
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;

    float t = u_time * 0.3;
    float audio = (u_audioLow + u_audioMid + u_audioHigh) / 3.0;

    // Polar coordinates
    float angle = atan(uv.y, uv.x);
    float radius = length(uv);

    // Spiral pattern
    float spiral = angle + radius * 8.0 - t * 2.0;
    spiral += sin(radius * 10.0 + t * 3.0 + u_audioLow * 3.0) * 0.5;

    // Multiple color layers
    vec3 col = vec3(0.0);

    for (float i = 0.0; i < 5.0; i++) {
        float phase = i * 1.5;
        float wave = sin(spiral + phase + u_audioMid * 3.0);

        // Color rotation with audio
        vec3 color = vec3(
            0.5 + 0.5 * sin(wave * 3.0 + t + i + u_audioLow * 2.0),
            0.5 + 0.5 * cos(wave * 2.0 + t * 0.7 + i + u_audioMid * 2.0),
            0.5 + 0.5 * sin(wave * 4.0 + t * 0.5 + i + u_audioHigh * 2.0)
        );

        // Intensity based on distance from center
        float intensity = 1.0 / (1.0 + radius * 2.0);
        intensity *= (0.5 + 0.5 * wave);
        intensity *= (1.0 + audio * 0.5);

        col += color * intensity * 0.4;
    }

    // Add radial glow
    float glow = 0.1 / (radius + 0.1);
    col += glow * vec3(
        0.3 + u_audioLow * 0.5,
        0.4 + u_audioMid * 0.5,
        0.6 + u_audioHigh * 0.5
    );

    // Boost brightness
    col = pow(col, vec3(0.9));

    fragColor = vec4(col, 1.0);
}`
        },
        {
            name: 'Aurora Borealis',
            description: 'Northern lights with flowing colors and audio reactivity',
            format: 'glsl',
            code: `#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_audioLow;
uniform float u_audioMid;
uniform float u_audioHigh;

out vec4 fragColor;

// Simplex noise functions
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

// Fractal Brownian Motion
float fbm(vec2 p) {
    float f = 0.0;
    float w = 0.5;
    for (int i = 0; i < 5; i++) {
        f += w * snoise(p);
        p *= 2.0;
        w *= 0.5;
    }
    return f;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= u_resolution.x / u_resolution.y;

    float t = u_time * 0.3;

    // Aurora bands with audio reactivity
    float aurora1 = fbm(vec2(p.x * 2.0 + t + u_audioLow * 2.0, p.y * 3.0 + sin(p.x * 3.0 + t) * 0.5));
    float aurora2 = fbm(vec2(p.x * 1.5 - t * 0.7 + u_audioMid * 1.5, p.y * 4.0 + cos(p.x * 2.0 - t) * 0.4));
    float aurora3 = fbm(vec2(p.x * 2.5 + t * 0.5 + u_audioHigh * 2.0, p.y * 2.5 + sin(p.x * 4.0 + t * 1.5) * 0.6));

    // Vertical gradient (aurora appears at top)
    float vertGradient = 1.0 - smoothstep(0.0, 0.8, abs(p.y + 0.3));

    // Audio-reactive intensity
    float audioBoost = 1.0 + (u_audioLow + u_audioMid + u_audioHigh) * 0.3;

    // Aurora colors - green, blue, purple, pink
    vec3 color1 = vec3(0.1, 0.9, 0.3); // Green
    vec3 color2 = vec3(0.2, 0.5, 1.0); // Blue
    vec3 color3 = vec3(0.8, 0.2, 0.9); // Purple
    vec3 color4 = vec3(1.0, 0.3, 0.6); // Pink

    // Mix colors based on noise
    vec3 col = vec3(0.0);
    col += color1 * max(0.0, aurora1) * (1.0 + u_audioLow * 0.5);
    col += color2 * max(0.0, aurora2) * (1.0 + u_audioMid * 0.5);
    col += color3 * max(0.0, aurora3) * (1.0 + u_audioHigh * 0.5);
    col += color4 * max(0.0, (aurora1 + aurora2) * 0.5) * audioBoost;

    // Apply vertical gradient
    col *= vertGradient;

    // Add subtle shimmer
    float shimmer = sin(p.x * 10.0 + t * 2.0 + aurora1 * 5.0) * 0.1 + 0.9;
    col *= shimmer;

    // Dark sky background
    vec3 skyColor = vec3(0.02, 0.02, 0.08) * (1.0 - uv.y * 0.5);
    col = mix(skyColor, col, clamp(length(col) * 0.8, 0.0, 1.0));

    // Add stars
    float stars = step(0.998, fract(sin(dot(floor(uv * 300.0), vec2(127.1, 311.7))) * 43758.5453));
    col += stars * vec3(1.0, 1.0, 0.9) * (0.5 + u_audioHigh * 0.5);

    // Brightness and saturation boost
    col = pow(col, vec3(0.8));

    fragColor = vec4(col, 1.0);
}`
        },
        {
            name: 'Fire Flames',
            description: 'Realistic fire simulation with heat distortion and audio reactivity',
            format: 'glsl',
            code: `#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_audioLow;
uniform float u_audioMid;
uniform float u_audioHigh;

out vec4 fragColor;

// Hash function for noise
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// 2D Noise
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Fractal noise
float fbm(vec2 p) {
    float f = 0.0;
    float w = 0.5;
    for (int i = 0; i < 6; i++) {
        f += w * noise(p);
        p *= 2.0;
        w *= 0.5;
    }
    return f;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = uv;
    p.x *= u_resolution.x / u_resolution.y;

    float t = u_time * 0.5;

    // Audio-reactive flame intensity
    float audioIntensity = (u_audioLow + u_audioMid * 0.8 + u_audioHigh * 0.5) * 0.5;

    // Flame shape - rises from bottom with turbulence
    vec2 flamePos = p;
    flamePos.y -= 0.2; // Start from bottom

    // Add turbulence
    float turbulence = fbm(vec2(flamePos.x * 3.0 + t, flamePos.y * 2.0 - t * 2.0));
    flamePos.x += sin(flamePos.y * 5.0 - t * 3.0 + turbulence * 2.0) * 0.1 * (1.0 + audioIntensity);

    // Flame core
    float flame = fbm(vec2(flamePos.x * 4.0 + sin(t) * 0.5, flamePos.y * 6.0 - t * 3.0));
    flame += fbm(vec2(flamePos.x * 6.0 - cos(t * 1.3) * 0.3, flamePos.y * 8.0 - t * 4.0)) * 0.5;

    // Vertical gradient (fire rises up)
    float vertGradient = smoothstep(0.0, 0.5, flamePos.y) * smoothstep(1.2, 0.2, flamePos.y);

    // Horizontal gradient (centered flame)
    float horizGradient = 1.0 - smoothstep(0.0, 0.5, abs(flamePos.x - 0.5));

    // Combine gradients
    flame *= vertGradient * horizGradient;

    // Audio makes flame taller and more intense
    flame += audioIntensity * 0.3 * vertGradient * horizGradient;

    // Fire color palette
    vec3 col = vec3(0.0);

    // Hot core (white-yellow)
    vec3 hotColor = vec3(1.0, 1.0, 0.9);
    col += hotColor * pow(flame, 3.0) * (1.5 + audioIntensity);

    // Main flame (yellow-orange)
    vec3 flameColor = vec3(1.0, 0.6, 0.1);
    col += flameColor * pow(flame, 1.5) * (1.2 + audioIntensity * 0.5);

    // Outer flame (orange-red)
    vec3 outerColor = vec3(1.0, 0.2, 0.0);
    col += outerColor * flame * (1.0 + audioIntensity * 0.3);

    // Dark red edges
    vec3 edgeColor = vec3(0.5, 0.05, 0.0);
    col += edgeColor * pow(flame, 0.5) * 0.5;

    // Add heat shimmer/distortion effect
    float shimmer = sin(p.x * 20.0 + t * 5.0 + flame * 10.0) * cos(p.y * 15.0 - t * 3.0) * 0.1;
    col += vec3(0.8, 0.3, 0.1) * shimmer * flame;

    // Sparks (audio-reactive)
    float sparks = 0.0;
    for (float i = 0.0; i < 8.0; i++) {
        vec2 sparkPos = vec2(
            hash(vec2(i, floor(t * 2.0))) * 2.0 - 1.0,
            fract(hash(vec2(i + 10.0, floor(t * 2.0))) + t * 0.5) * 1.5 - 0.2
        );
        float sparkDist = length(p - vec2(0.5, 0.0) - sparkPos * 0.3);
        sparks += (0.005 / sparkDist) * (0.5 + audioIntensity);
    }
    col += vec3(1.0, 0.8, 0.3) * sparks;

    // Dark background
    vec3 bgColor = vec3(0.02, 0.01, 0.0);
    col = mix(bgColor, col, clamp(flame * 2.0, 0.0, 1.0));

    // Brightness and contrast
    col = pow(col, vec3(0.9));

    fragColor = vec4(col, 1.0);
}`
        },
        {
            name: 'Lightning Storm',
            description: 'Electric lightning bolts with branching and audio-reactive strikes',
            format: 'glsl',
            code: `#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_audioLow;
uniform float u_audioMid;
uniform float u_audioHigh;

out vec4 fragColor;

// Hash function
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// 2D Noise
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Lightning bolt function
float lightning(vec2 p, float seed, float time) {
    float bolt = 0.0;
    vec2 pos = p;

    // Main bolt path
    float x = pos.x;
    float y = pos.y;

    // Zigzag pattern
    float freq = 8.0 + seed * 4.0;
    float path = sin(y * freq + seed * 10.0 + time) * 0.15;
    path += sin(y * freq * 2.0 + seed * 20.0) * 0.05;

    // Distance from bolt path
    float dist = abs(x - path);

    // Bolt thickness with glow
    bolt = 0.02 / (dist + 0.01);
    bolt += 0.01 / (dist + 0.05);

    // Fade out at ends
    bolt *= smoothstep(-1.0, 0.0, y);
    bolt *= smoothstep(1.5, 0.5, y);

    return bolt;
}

// Branching bolts
float branches(vec2 p, float seed, float time) {
    float result = 0.0;

    for (float i = 0.0; i < 5.0; i++) {
        float branchSeed = seed + i * 123.456;
        float branchY = hash(vec2(branchSeed)) * 0.8 + 0.2;
        float branchX = (hash(vec2(branchSeed + 50.0)) - 0.5) * 0.4;

        vec2 branchPos = p;
        branchPos.y -= branchY;
        branchPos.x -= branchX;

        // Rotate branch
        float angle = (hash(vec2(branchSeed + 100.0)) - 0.5) * 0.8;
        float c = cos(angle);
        float s = sin(angle);
        branchPos = vec2(
            branchPos.x * c - branchPos.y * s,
            branchPos.x * s + branchPos.y * c
        );

        float branch = lightning(branchPos * 2.0, branchSeed, time);
        result += branch * 0.5;
    }

    return result;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= u_resolution.x / u_resolution.y;

    float t = u_time * 0.5;

    // Audio-reactive strike probability and intensity
    float audioIntensity = (u_audioLow * 0.3 + u_audioMid * 0.5 + u_audioHigh * 1.0);
    float strikeFreq = 2.0 + audioIntensity * 3.0;

    vec3 col = vec3(0.0);

    // Multiple lightning bolts
    for (float i = 0.0; i < 3.0; i++) {
        float boltTime = t * strikeFreq + i * 2.5;
        float boltSeed = floor(boltTime) + i * 456.789;
        float boltPhase = fract(boltTime);

        // Flash duration
        float flash = smoothstep(0.0, 0.05, boltPhase) * smoothstep(0.3, 0.1, boltPhase);

        if (flash > 0.01) {
            // Position bolt horizontally
            vec2 boltPos = p;
            float xOffset = (hash(vec2(boltSeed)) - 0.5) * 1.5;
            boltPos.x -= xOffset;

            // Main bolt
            float mainBolt = lightning(boltPos, boltSeed, boltTime);

            // Branches
            float branchBolts = branches(boltPos, boltSeed, boltTime);

            // Lightning color (blue-white electric)
            vec3 boltColor = vec3(0.7, 0.8, 1.0);
            vec3 coreColor = vec3(1.0, 1.0, 1.0);

            // Add main bolt
            col += mix(boltColor, coreColor, pow(mainBolt, 2.0)) * mainBolt * flash;

            // Add branches
            col += boltColor * branchBolts * flash * 0.8;

            // Add atmospheric glow
            float glow = (mainBolt + branchBolts) * 0.2;
            col += vec3(0.4, 0.5, 0.8) * glow * flash;
        }
    }

    // Add storm clouds (dark background with movement)
    float clouds = noise(vec2(p.x * 2.0 + t * 0.1, p.y * 1.5 + sin(t * 0.2) * 0.3));
    clouds = clouds * 0.5 + 0.3;
    vec3 skyColor = vec3(0.05, 0.05, 0.15) * clouds;

    // Rain effect
    float rain = 0.0;
    for (float i = 0.0; i < 50.0; i++) {
        float x = hash(vec2(i, 0.0)) * 2.0 - 1.0;
        float y = fract(hash(vec2(i, 1.0)) - t * 2.0) * 2.0;
        vec2 rainPos = vec2(x, y);
        float rainDist = length((p - rainPos) * vec2(50.0, 5.0));
        rain += 0.002 / (rainDist + 0.01);
    }
    col += vec3(0.4, 0.5, 0.6) * rain * 0.3;

    // Flashes light up the sky
    float ambientFlash = length(col) * 0.3;
    skyColor += vec3(0.6, 0.7, 0.9) * ambientFlash;

    // Combine
    col = mix(skyColor, col, clamp(length(col), 0.0, 1.0));

    // Audio-reactive brightness
    col *= 1.0 + audioIntensity * 0.3;

    fragColor = vec4(col, 1.0);
}`
        },
        {
            name: 'CRT Monitor',
            description: 'Retro CRT screen with scanlines, chromatic aberration, and curvature',
            format: 'glsl',
            code: `#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_audioLow;
uniform float u_audioMid;
uniform float u_audioHigh;

out vec4 fragColor;

// Hash for random noise
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// CRT curvature
vec2 curve(vec2 uv) {
    uv = uv * 2.0 - 1.0;
    vec2 offset = abs(uv.yx) / vec2(6.0, 4.0);
    uv = uv + uv * offset * offset;
    uv = uv * 0.5 + 0.5;
    return uv;
}

// Vignette effect
float vignette(vec2 uv) {
    uv = uv * 2.0 - 1.0;
    return 1.0 - dot(uv, uv) * 0.3;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;

    // Apply CRT curvature
    vec2 curvedUV = curve(uv);

    // Check if outside screen bounds (for rounded corners)
    if (curvedUV.x < 0.0 || curvedUV.x > 1.0 || curvedUV.y < 0.0 || curvedUV.y > 1.0) {
        fragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }

    float t = u_time * 0.5;

    // Audio-reactive pattern content
    vec2 p = curvedUV * 10.0;

    // Create colorful pattern
    float pattern = 0.0;
    pattern += sin(p.x + t + u_audioLow * 2.0) * 0.5;
    pattern += cos(p.y - t * 0.7 + u_audioMid * 1.5) * 0.5;
    pattern += sin(length(p - 5.0) * 3.0 - t * 2.0 + u_audioHigh * 2.0) * 0.5;

    vec3 baseColor = vec3(
        0.5 + 0.5 * sin(pattern + t + u_audioLow * 2.0),
        0.5 + 0.5 * cos(pattern + t * 0.7 + u_audioMid * 2.0),
        0.5 + 0.5 * sin(pattern + t * 0.5 + u_audioHigh * 2.0)
    );

    // Chromatic aberration (RGB split)
    vec2 aberration = vec2(0.002 + u_audioHigh * 0.003, 0.0);
    vec2 uvR = curvedUV - aberration;
    vec2 uvG = curvedUV;
    vec2 uvB = curvedUV + aberration;

    // Apply aberration to pattern
    float patternR = sin((uvR.x * 10.0) + t + u_audioLow * 2.0);
    float patternG = sin((uvG.x * 10.0) + t + u_audioLow * 2.0);
    float patternB = sin((uvB.x * 10.0) + t + u_audioLow * 2.0);

    vec3 col = vec3(
        baseColor.r + patternR * 0.1,
        baseColor.g + patternG * 0.1,
        baseColor.b + patternB * 0.1
    );

    // Scanlines
    float scanline = sin(curvedUV.y * u_resolution.y * 1.5) * 0.04 + 0.96;
    col *= scanline;

    // Horizontal scanline interference (audio-reactive)
    float interference = sin(curvedUV.y * 10.0 + t * 20.0 + u_audioMid * 5.0) * 0.02;
    col += interference;

    // Pixel mask (RGB phosphor dots)
    float mask = 1.0;
    vec2 pixelPos = gl_FragCoord.xy;
    float maskPhase = mod(pixelPos.x, 3.0);
    if (maskPhase < 1.0) {
        col.r *= 1.2;
        col.gb *= 0.8;
    } else if (maskPhase < 2.0) {
        col.g *= 1.2;
        col.rb *= 0.8;
    } else {
        col.b *= 1.2;
        col.rg *= 0.8;
    }

    // Flicker effect (audio-reactive)
    float flicker = 0.98 + hash(vec2(floor(t * 60.0))) * 0.02;
    flicker += u_audioMid * 0.05;
    col *= flicker;

    // Rolling interference bands
    float roll = smoothstep(0.0, 0.05, abs(sin(curvedUV.y * 3.0 - t * 2.0 + u_audioLow * 3.0)));
    col += vec3(0.1, 0.15, 0.1) * (1.0 - roll) * 0.3;

    // Vignette (darker edges)
    col *= vignette(curvedUV);

    // Bloom/glow effect
    float bloom = length(col) * 0.2;
    col += bloom * vec3(0.6, 0.7, 0.8) * u_audioHigh;

    // Screen glare
    float glare = pow(max(0.0, 1.0 - length(curvedUV - 0.5)), 5.0) * 0.3;
    col += glare;

    // Static noise (subtle)
    float noise = hash(curvedUV * 1000.0 + t * 100.0) * 0.05;
    col += noise;

    // CRT green/amber tint option (commented out - can enable for retro look)
    // col = vec3(col.r * 0.3 + col.g * 0.59 + col.b * 0.11);
    // col *= vec3(0.2, 1.0, 0.3); // Green phosphor
    // col *= vec3(1.0, 0.7, 0.2); // Amber phosphor

    // Brightness boost
    col *= 1.2;

    fragColor = vec4(col, 1.0);
}`
        },
        {
            name: 'Kaleidoscope',
            description: 'Symmetrical kaleidoscope patterns with audio-reactive colors',
            format: 'glsl',
            code: `#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_audioLow;
uniform float u_audioMid;
uniform float u_audioHigh;

out vec4 fragColor;

#define PI 3.14159265359

// Hash function
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// 2D noise
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Kaleidoscope effect
vec2 kaleidoscope(vec2 p, float segments) {
    float angle = atan(p.y, p.x);
    float radius = length(p);

    // Create symmetry
    float segmentAngle = 2.0 * PI / segments;
    angle = mod(angle, segmentAngle);

    // Mirror alternating segments
    float segmentId = floor(angle / segmentAngle);
    if (mod(segmentId, 2.0) > 0.5) {
        angle = segmentAngle - mod(angle, segmentAngle);
    }

    return vec2(cos(angle), sin(angle)) * radius;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= u_resolution.x / u_resolution.y;

    float t = u_time * 0.3;

    // Audio-reactive segments (6-12 segments)
    float segments = 6.0 + floor(u_audioLow * 6.0);

    // Rotation
    float rotation = t + u_audioMid * 2.0;
    float c = cos(rotation);
    float s = sin(rotation);
    p = vec2(p.x * c - p.y * s, p.x * s + p.y * c);

    // Apply kaleidoscope effect
    vec2 kp = kaleidoscope(p, segments);

    // Zoom and scroll
    float zoom = 2.0 + sin(t * 0.5 + u_audioLow) * 0.5;
    kp *= zoom;
    kp += vec2(sin(t * 0.3), cos(t * 0.4)) * 0.5;

    // Create intricate pattern using multiple layers
    vec3 col = vec3(0.0);

    // Layer 1: Circular waves
    float d = length(kp);
    float wave1 = sin(d * 8.0 - t * 2.0 + u_audioHigh * 3.0);
    wave1 = wave1 * 0.5 + 0.5;

    // Layer 2: Grid pattern
    vec2 grid = fract(kp * 3.0) - 0.5;
    float wave2 = max(abs(grid.x), abs(grid.y));
    wave2 = smoothstep(0.3, 0.2, wave2);

    // Layer 3: Radial lines
    float angle = atan(kp.y, kp.x);
    float wave3 = sin(angle * 12.0 + t + u_audioMid * 2.0);
    wave3 = wave3 * 0.5 + 0.5;

    // Layer 4: Noise texture
    float wave4 = noise(kp * 5.0 + t * 0.5);

    // Combine layers
    float pattern = wave1 * 0.4 + wave2 * 0.3 + wave3 * 0.2 + wave4 * 0.1;

    // Audio-reactive color palette
    vec3 color1 = vec3(
        0.5 + 0.5 * sin(t + u_audioLow * 2.0),
        0.5 + 0.5 * cos(t * 0.7 + u_audioMid * 2.0),
        0.5 + 0.5 * sin(t * 0.5 + u_audioHigh * 2.0)
    );

    vec3 color2 = vec3(
        0.5 + 0.5 * sin(t + PI + u_audioLow * 2.0),
        0.5 + 0.5 * cos(t * 0.7 + PI + u_audioMid * 2.0),
        0.5 + 0.5 * sin(t * 0.5 + PI + u_audioHigh * 2.0)
    );

    vec3 color3 = vec3(
        0.5 + 0.5 * sin(t + PI * 0.5 + u_audioLow * 2.0),
        0.5 + 0.5 * cos(t * 0.7 + PI * 0.5 + u_audioMid * 2.0),
        0.5 + 0.5 * sin(t * 0.5 + PI * 0.5 + u_audioHigh * 2.0)
    );

    // Mix colors based on pattern
    col = mix(color1, color2, pattern);
    col = mix(col, color3, wave3);

    // Add radial gradient
    float radialGrad = 1.0 - smoothstep(0.0, 2.0, length(p));
    col *= 0.3 + radialGrad * 0.7;

    // Add highlights
    float highlight = pow(pattern, 3.0);
    col += vec3(1.0, 0.9, 0.8) * highlight * 0.5 * (1.0 + u_audioHigh);

    // Edge glow
    float edge = smoothstep(0.4, 0.5, wave2);
    col += vec3(0.8, 0.9, 1.0) * edge * 0.3;

    // Brightness modulation
    float brightness = 0.8 + sin(t * 2.0 + u_audioMid * 3.0) * 0.2;
    col *= brightness;

    // Vignette
    float vignette = 1.0 - dot(uv - 0.5, uv - 0.5) * 0.5;
    col *= vignette;

    // Saturation boost
    float gray = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(vec3(gray), col, 1.3);

    fragColor = vec4(col, 1.0);
}`
        },
        {
            name: 'Black Hole',
            description: 'Gravitational lensing with accretion disk and event horizon',
            format: 'glsl',
            code: `#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_audioLow;
uniform float u_audioMid;
uniform float u_audioHigh;

out vec4 fragColor;

#define PI 3.14159265359

// Hash function
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// 2D noise
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Gravitational lensing distortion
vec2 lensDistortion(vec2 p, float mass) {
    float d = length(p);
    float angle = atan(p.y, p.x);

    // Schwarzschild radius effect
    float distortion = mass / (d * d + 0.1);

    // Bend space around black hole
    vec2 offset = vec2(cos(angle), sin(angle)) * distortion;

    return p + offset * 0.5;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= u_resolution.x / u_resolution.y;

    float t = u_time * 0.2;

    // Black hole center
    vec2 bhCenter = vec2(0.0);
    float bhMass = 0.3 + u_audioLow * 0.2;

    // Apply gravitational lensing
    vec2 lensedP = lensDistortion(p - bhCenter, bhMass);

    float dist = length(p - bhCenter);
    float angle = atan(p.y - bhCenter.y, p.x - bhCenter.x);

    vec3 col = vec3(0.0);

    // Event horizon (pure black)
    float eventHorizon = 0.2 + u_audioLow * 0.05;
    if (dist < eventHorizon) {
        // Inside event horizon - completely black with subtle noise
        float edgeGlow = smoothstep(eventHorizon * 0.9, eventHorizon, dist);
        col = vec3(0.0) + vec3(0.02, 0.01, 0.0) * edgeGlow;
    } else {
        // Accretion disk
        float diskDist = abs(length(lensedP) - 0.5);
        float diskThickness = 0.15 + sin(angle * 3.0 + t * 2.0) * 0.05;

        if (diskDist < diskThickness) {
            // Rotating accretion disk
            float rotation = angle + t * (2.0 + u_audioMid * 2.0) + dist * 5.0;
            float diskPattern = noise(vec2(rotation * 2.0, dist * 10.0));

            // Disk color - hot plasma (red-orange-yellow-white)
            float temp = 1.0 - (diskDist / diskThickness);
            temp *= 1.0 - smoothstep(0.4, 0.7, dist);

            // Temperature-based color
            vec3 coldColor = vec3(1.0, 0.2, 0.0); // Red
            vec3 warmColor = vec3(1.0, 0.6, 0.1); // Orange
            vec3 hotColor = vec3(1.0, 0.9, 0.5);  // Yellow
            vec3 veryHotColor = vec3(1.0, 1.0, 1.0); // White

            vec3 diskColor = mix(coldColor, warmColor, temp * 0.5);
            diskColor = mix(diskColor, hotColor, temp * 0.7);
            diskColor = mix(diskColor, veryHotColor, pow(temp, 3.0));

            // Add turbulence
            diskColor *= 0.7 + diskPattern * 0.6;

            // Audio reactivity
            diskColor *= 1.0 + u_audioHigh * 0.5;

            col += diskColor * temp * 1.5;

            // Inner disk glow
            float innerGlow = smoothstep(diskThickness, 0.0, diskDist) * temp;
            col += vec3(1.0, 0.8, 0.4) * innerGlow;
        }

        // Gravitational lensing glow/halo
        float lensGlow = 1.0 / (dist * dist * 10.0 + 1.0);
        col += vec3(0.4, 0.5, 0.8) * lensGlow * 0.3;

        // Photon sphere (where light orbits)
        float photonSphere = 0.3 + u_audioMid * 0.05;
        float photonRing = abs(dist - photonSphere);
        float ring = smoothstep(0.02, 0.0, photonRing);
        col += vec3(0.6, 0.7, 1.0) * ring * (1.0 + u_audioHigh * 0.5);

        // Event horizon edge glow
        float horizonGlow = smoothstep(eventHorizon + 0.15, eventHorizon, dist);
        col += vec3(1.0, 0.5, 0.2) * horizonGlow * 0.8 * (1.0 + u_audioLow);

        // Space background with stars
        float starField = hash(floor(lensedP * 100.0));
        float stars = step(0.995, starField);

        // Stars are stretched near black hole
        float stretch = 1.0 - smoothstep(0.5, 1.5, dist);
        stars *= 1.0 - stretch * 0.8;

        col += vec3(0.9, 0.9, 1.0) * stars * 0.5;

        // Distant galaxy/nebula (affected by lensing)
        float nebula = noise(lensedP * 2.0 + t * 0.1);
        nebula = pow(nebula, 3.0);
        vec3 nebulaColor = vec3(
            0.3 + 0.2 * sin(t + u_audioLow * 2.0),
            0.2 + 0.2 * cos(t * 0.7 + u_audioMid * 2.0),
            0.5 + 0.2 * sin(t * 0.5 + u_audioHigh * 2.0)
        );
        col += nebulaColor * nebula * 0.2 * (1.0 - smoothstep(0.5, 1.5, dist));

        // Jets from poles (perpendicular to accretion disk)
        float jetAngle = abs(sin(angle));
        float jetStrength = smoothstep(0.9, 1.0, jetAngle) * smoothstep(1.5, 0.3, dist);
        vec3 jetColor = vec3(0.3, 0.5, 1.0);
        col += jetColor * jetStrength * 0.5 * (1.0 + u_audioMid * 0.5);
    }

    // Doppler shift (blue shift approaching, red shift receding)
    float velocity = sin(angle + t * 2.0);
    col.r += velocity * 0.1 * smoothstep(1.0, 0.3, dist);
    col.b -= velocity * 0.1 * smoothstep(1.0, 0.3, dist);

    // Overall brightness and contrast
    col = pow(col, vec3(0.9));

    fragColor = vec4(col, 1.0);
}`
        },
        {
            name: 'Wormhole',
            description: 'Spacetime tunnel with swirling energy and depth perception',
            format: 'glsl',
            code: `#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_audioLow;
uniform float u_audioMid;
uniform float u_audioHigh;

out vec4 fragColor;

#define PI 3.14159265359

// Hash function
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// 2D noise
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= u_resolution.x / u_resolution.y;

    float t = u_time * 0.5;

    // Convert to polar coordinates
    float angle = atan(p.y, p.x);
    float radius = length(p);

    // Audio-reactive travel speed
    float travelSpeed = 1.0 + u_audioLow * 0.5;
    float depth = t * travelSpeed;

    // Tunnel effect - compress space radially
    float tunnel = 1.0 / (radius + 0.1);
    vec2 tunnelCoord = vec2(angle / PI, tunnel + depth);

    vec3 col = vec3(0.0);

    // Tunnel walls with spiral patterns
    float spiral = sin(tunnelCoord.y * 20.0 + angle * 8.0 + t * 2.0 + u_audioMid * 3.0);
    spiral = spiral * 0.5 + 0.5;

    // Multiple layers of spirals
    float spiral2 = sin(tunnelCoord.y * 15.0 - angle * 6.0 - t * 1.5 + u_audioHigh * 2.0);
    spiral2 = spiral2 * 0.5 + 0.5;

    // Combine spirals
    float pattern = spiral * 0.6 + spiral2 * 0.4;

    // Distance-based coloring (depth perception)
    float depthColor = fract(tunnelCoord.y * 2.0);

    // Color palette - electric blue to purple to pink
    vec3 color1 = vec3(0.1, 0.3, 1.0); // Blue
    vec3 color2 = vec3(0.6, 0.2, 0.9); // Purple
    vec3 color3 = vec3(1.0, 0.2, 0.6); // Pink
    vec3 color4 = vec3(0.2, 0.8, 0.9); // Cyan

    // Mix colors based on depth and pattern
    vec3 tunnelColor = mix(color1, color2, depthColor);
    tunnelColor = mix(tunnelColor, color3, pattern);
    tunnelColor = mix(tunnelColor, color4, spiral2);

    // Audio-reactive color shift
    tunnelColor.r += sin(t + u_audioLow * 2.0) * 0.2;
    tunnelColor.g += cos(t * 0.7 + u_audioMid * 2.0) * 0.2;
    tunnelColor.b += sin(t * 0.5 + u_audioHigh * 2.0) * 0.2;

    // Apply pattern intensity
    col = tunnelColor * pattern;

    // Tunnel structure/grid lines
    float gridAngle = fract(angle / (PI / 12.0));
    float gridDepth = fract(tunnelCoord.y * 4.0);

    float grid = 0.0;
    grid += smoothstep(0.05, 0.0, abs(gridAngle - 0.5)) * 0.5;
    grid += smoothstep(0.05, 0.0, abs(gridDepth - 0.5)) * 0.5;

    col += vec3(0.5, 0.7, 1.0) * grid * (1.0 + u_audioMid * 0.5);

    // Energy bands flowing through tunnel
    float bands = sin(tunnelCoord.y * 8.0 - t * 3.0 + u_audioHigh * 5.0);
    bands = smoothstep(0.6, 0.8, bands);
    vec3 bandColor = vec3(1.0, 0.8, 0.5);
    col += bandColor * bands * 0.8 * (1.0 + u_audioHigh);

    // Particles/stars streaming past
    for (float i = 0.0; i < 20.0; i++) {
        float particleAngle = hash(vec2(i, 0.0)) * PI * 2.0;
        float particleDepth = fract(hash(vec2(i, 1.0)) + depth * 0.5);
        float particleRadius = 0.3 + hash(vec2(i, 2.0)) * 0.5;

        vec2 particlePos = vec2(
            cos(particleAngle) * particleRadius,
            sin(particleAngle) * particleRadius
        );

        float particleDist = length(p - particlePos * (1.0 - particleDepth));
        float particle = 0.005 / (particleDist + 0.001);

        col += vec3(0.9, 0.9, 1.0) * particle * particleDepth * (0.5 + u_audioMid * 0.5);
    }

    // Radial blur/speed lines (motion effect)
    float speedLines = 1.0 - smoothstep(0.0, 0.5, abs(fract(angle / (PI * 0.1)) - 0.5));
    speedLines *= smoothstep(0.0, 0.3, radius) * 0.2;
    col += speedLines * (1.0 + u_audioHigh * 0.5);

    // Center glow (bright exit/entrance)
    float centerGlow = 1.0 / (radius * radius * 5.0 + 0.5);
    vec3 glowColor = mix(
        vec3(0.5, 0.8, 1.0),
        vec3(1.0, 0.5, 0.8),
        sin(t + u_audioLow * 2.0) * 0.5 + 0.5
    );
    col += glowColor * centerGlow * (1.0 + u_audioLow * 0.5);

    // Distance fog/atmosphere
    float fog = smoothstep(0.0, 1.5, radius);
    col *= 1.0 - fog * 0.3;

    // Vignette
    float vignette = 1.0 - radius * 0.4;
    col *= vignette;

    // Temporal distortion waves (spacetime ripples)
    float ripple = sin(radius * 20.0 - t * 5.0 + u_audioMid * 4.0) * 0.05;
    col += ripple * (1.0 + u_audioMid * 0.3);

    // Brightness and contrast
    col = pow(col, vec3(0.85));
    col *= 1.2;

    fragColor = vec4(col, 1.0);
}`
        },
        {
            name: 'Lava Lamp',
            description: 'Retro lava lamp with organic blobs and smooth animation',
            format: 'glsl',
            code: `#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_audioLow;
uniform float u_audioMid;
uniform float u_audioHigh;

out vec4 fragColor;

#define PI 3.14159265359

// Hash function
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// 2D noise
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Smooth metaball function
float metaball(vec2 p, vec2 center, float radius) {
    float d = length(p - center);
    return radius / (d * d + 0.01);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= u_resolution.x / u_resolution.y;

    float t = u_time * 0.3;

    // Audio-reactive blob count and movement speed
    float blobCount = 6.0 + floor(u_audioLow * 4.0);
    float moveSpeed = 0.5 + u_audioMid * 0.3;

    float field = 0.0;

    // Create multiple organic blobs
    for (float i = 0.0; i < 10.0; i++) {
        if (i >= blobCount) break;

        // Blob properties
        float phase = i * 2.456;
        float speed = 0.3 + hash(vec2(i, 0.0)) * 0.4;

        // Blob movement (sinusoidal up and down)
        vec2 blobPos = vec2(
            sin(t * speed * moveSpeed + phase) * 0.4,
            sin(t * speed * moveSpeed * 0.7 + phase * 1.5) * 0.6 - 0.2
        );

        // Add some horizontal drift
        blobPos.x += sin(t * 0.2 + phase) * 0.2;

        // Blob size (audio-reactive)
        float blobSize = 0.2 + hash(vec2(i, 1.0)) * 0.15;
        blobSize *= 1.0 + sin(t * 2.0 + phase) * 0.2;
        blobSize *= 1.0 + u_audioHigh * 0.3;

        // Add to field
        field += metaball(p, blobPos, blobSize);
    }

    // Threshold for blob edges
    float threshold = 1.0;
    float blobMask = smoothstep(threshold - 0.1, threshold + 0.1, field);

    // Color gradient for blobs (retro lava lamp colors)
    vec3 blobColor1 = vec3(1.0, 0.2, 0.3); // Red
    vec3 blobColor2 = vec3(1.0, 0.4, 0.1); // Orange
    vec3 blobColor3 = vec3(1.0, 0.8, 0.2); // Yellow

    // Mix colors based on field intensity
    vec3 blobColor = mix(blobColor1, blobColor2, smoothstep(1.0, 2.0, field));
    blobColor = mix(blobColor, blobColor3, smoothstep(2.0, 3.5, field));

    // Audio-reactive color shift
    blobColor.r += sin(t + u_audioLow * 2.0) * 0.1;
    blobColor.g += cos(t * 0.7 + u_audioMid * 2.0) * 0.1;

    // Inner glow (brighter center)
    float glow = smoothstep(1.0, 3.0, field);
    blobColor += vec3(1.0, 0.9, 0.7) * glow * 0.5;

    // Apply blob mask
    vec3 col = blobColor * blobMask;

    // Add specular highlights
    float highlight = smoothstep(3.0, 4.5, field);
    col += vec3(1.0, 1.0, 0.9) * highlight * 0.7;

    // Background color (dark blue/purple liquid)
    vec3 bgColor = vec3(0.05, 0.08, 0.2);

    // Add some background variation
    float bgNoise = noise(p * 3.0 + t * 0.1);
    bgColor += vec3(0.02, 0.03, 0.08) * bgNoise;

    // Mix with background
    col = mix(bgColor, col, blobMask);

    // Glass container effect (vignette and edges)
    float vignette = 1.0 - length(p * 0.7) * 0.5;
    vignette = smoothstep(0.3, 1.0, vignette);

    // Container edges (darker at sides)
    float containerEdge = smoothstep(0.0, 0.1, abs(p.x) - 0.6);
    col *= 1.0 - containerEdge * 0.5;

    // Top and bottom cap
    float topCap = smoothstep(0.0, 0.05, p.y - 0.8);
    float bottomCap = smoothstep(0.0, 0.05, -p.y - 0.8);
    col *= 1.0 - topCap * 0.7;
    col *= 1.0 - bottomCap * 0.7;

    // Vertical gradient (lighter at top)
    float vertGradient = mix(0.8, 1.2, (p.y + 1.0) * 0.5);
    col *= vertGradient;

    // Glass reflection/glare
    float glare = 0.0;
    vec2 glarePos1 = vec2(-0.6, 0.3);
    vec2 glarePos2 = vec2(0.6, -0.2);

    glare += smoothstep(0.3, 0.0, length(p - glarePos1)) * 0.4;
    glare += smoothstep(0.2, 0.0, length(p - glarePos2)) * 0.3;

    col += vec3(0.9, 0.9, 1.0) * glare;

    // Subtle bubbles (small reflections in liquid)
    for (float i = 0.0; i < 5.0; i++) {
        vec2 bubblePos = vec2(
            sin(t * 1.5 + i * 2.5) * 0.5,
            fract(t * 0.3 + i * 0.2) * 2.0 - 1.0
        );
        float bubbleDist = length(p - bubblePos);
        float bubble = smoothstep(0.05, 0.0, bubbleDist);
        col += vec3(0.7, 0.8, 0.9) * bubble * 0.3;
    }

    // Apply vignette
    col *= vignette;

    // Warmth adjustment (retro look)
    col *= vec3(1.05, 1.0, 0.95);

    // Slight color saturation boost
    float gray = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(vec3(gray), col, 1.2);

    // Brightness and contrast
    col = pow(col, vec3(0.9));

    fragColor = vec4(col, 1.0);
}`
        }
    ],

    // ShaderToy Format Shaders (for Toy Layer)
    shadertoy: [
        {
            name: 'Neon Rings',
            description: 'Pulsing neon ring patterns',
            format: 'shadertoy',
            code: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;

    float audio = (iAudioLow + iAudioMid + iAudioHigh) / 3.0;
    vec3 col = vec3(0.0);

    for (float i = 0.0; i < 8.0; i++) {
        float radius = 0.2 + i * 0.15;
        float thickness = 0.03 + audio * 0.02;

        float d = abs(length(uv) - radius);
        float ring = smoothstep(thickness, 0.0, d);

        float pulse = sin(iTime * 2.0 - i * 0.5 + audio * 3.0);

        vec3 ringColor = vec3(
            0.5 + 0.5 * sin(i + iAudioLow * 2.0),
            0.5 + 0.5 * cos(i * 0.7 + iAudioMid * 2.0),
            0.7 + 0.3 * sin(i * 0.5 + iAudioHigh * 2.0)
        );

        col += ring * ringColor * (0.5 + pulse * 0.5);
    }

    fragColor = vec4(col, 0.8);
}`
        },
        {
            name: 'Spiral Galaxy',
            description: 'Rotating spiral with stars',
            format: 'shadertoy',
            code: `float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;

    float a = atan(uv.y, uv.x);
    float r = length(uv);

    float spiral = sin(a * 3.0 + r * 10.0 - iTime + iAudioLow * 2.0);
    spiral = smoothstep(0.3, 0.7, spiral);

    vec3 col = vec3(0.0);
    col += vec3(0.3, 0.5, 0.9) * spiral / (r + 0.5);

    // Stars
    for (float i = 0.0; i < 50.0; i++) {
        vec2 starPos = vec2(hash(vec2(i)), hash(vec2(i + 100.0))) * 2.0 - 1.0;
        float starDist = length(uv - starPos);
        float star = 0.003 / starDist;
        col += vec3(1.0) * star * (0.5 + iAudioHigh * 0.5);
    }

    fragColor = vec4(col, 0.7);
}`
        },
        {
            name: 'Glitch Art',
            description: 'Digital glitch effects',
            format: 'shadertoy',
            code: `float random(vec2 st) {
    return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    float glitch = step(0.98, random(vec2(floor(uv.y * 20.0), floor(iTime * 10.0))));
    uv.x += glitch * (random(vec2(iTime)) - 0.5) * 0.1 * iAudioMid;

    vec3 col = vec3(0.0);

    float bars = step(0.5, sin(uv.y * 30.0 + iTime * 5.0 + iAudioLow * 3.0));
    col.r = bars * (0.5 + iAudioLow);
    col.g = bars * (0.5 + iAudioMid);
    col.b = bars * (0.5 + iAudioHigh);

    // RGB split
    float offset = 0.01 * iAudioHigh;
    col.r += step(0.5, sin(uv.x * 50.0 + offset));
    col.b += step(0.5, sin(uv.x * 50.0 - offset));

    fragColor = vec4(col, 0.75);
}`
        },
        {
            name: 'Hex Grid',
            description: 'Hexagonal grid with glow',
            format: 'shadertoy',
            code: `vec2 hexCenter(vec2 p) {
    float q = p.x;
    float r = p.y;
    float x = q - r * 0.5;
    float z = r;
    float y = -x - z;

    float rx = floor(x + 0.5);
    float ry = floor(y + 0.5);
    float rz = floor(z + 0.5);

    float dx = abs(rx - x);
    float dy = abs(ry - y);
    float dz = abs(rz - z);

    if (dx > dy && dx > dz) rx = -ry - rz;
    else if (dy > dz) ry = -rx - rz;
    else rz = -rx - ry;

    return vec2(rx + rz * 0.5, rz);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    uv *= 8.0;

    vec2 center = hexCenter(uv);
    float d = length(uv - center);

    float hex = smoothstep(0.5, 0.48, d);
    float glow = 0.1 / (d + 0.1);

    vec3 col = vec3(hex) * vec3(
        0.5 + 0.5 * sin(center.x + iTime + iAudioLow * 2.0),
        0.5 + 0.5 * cos(center.y + iTime * 0.7 + iAudioMid * 2.0),
        0.7 + 0.3 * sin(length(center) + iAudioHigh * 2.0)
    );

    col += glow * vec3(0.3, 0.6, 0.9) * (1.0 + iAudioMid);

    fragColor = vec4(col, 0.6);
}`
        },
        {
            name: 'Sound Bars',
            description: 'Classic audio visualizer bars',
            format: 'shadertoy',
            code: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    float bars = 20.0;
    float barId = floor(uv.x * bars);
    float barX = fract(uv.x * bars);

    float audio = mix(iAudioLow, iAudioHigh, barId / bars);
    float height = 0.1 + audio * 0.8;

    float bar = step(barX, 0.8) * step(uv.y, height);

    vec3 col = vec3(
        uv.x,
        1.0 - uv.y,
        0.5 + audio * 0.5
    ) * bar;

    col += vec3(0.2, 0.4, 0.8) * (1.0 - step(0.02, abs(uv.y - height)));

    fragColor = vec4(col, 0.8);
}`
        }
    ],

    // Get all presets
    getAll() {
        // Merge with OSMOS shaders if available
        let allShaders = [...this.glsl, ...this.shadertoy];
        if (typeof OsmosShaders !== 'undefined') {
            // Add all OSMOS shaders
            for (let key in OsmosShaders) {
                if (OsmosShaders[key].format) {
                    allShaders.push(OsmosShaders[key]);
                }
            }
        }
        // Add TRON shaders if available
        if (typeof TronShaders !== 'undefined') {
            for (let key in TronShaders) {
                if (TronShaders[key].format) {
                    allShaders.push(TronShaders[key]);
                }
            }
        }
        return allShaders;
    },

    // Get by format
    getByFormat(format) {
        let shaders = format === 'glsl' ? [...this.glsl] : [...this.shadertoy];

        // Add OSMOS shaders of matching format
        if (typeof OsmosShaders !== 'undefined') {
            for (let key in OsmosShaders) {
                if (OsmosShaders[key].format === format) {
                    shaders.push(OsmosShaders[key]);
                }
            }
        }

        // Add TRON shaders of matching format
        if (typeof TronShaders !== 'undefined') {
            for (let key in TronShaders) {
                if (TronShaders[key].format === format) {
                    shaders.push(TronShaders[key]);
                }
            }
        }

        // Add ShaderToy imports
        if (typeof ShaderToyImports !== 'undefined') {
            for (let key in ShaderToyImports) {
                if (ShaderToyImports[key].format === format) {
                    shaders.push(ShaderToyImports[key]);
                }
            }
        }

        return shaders;
    }
};
