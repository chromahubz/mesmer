/**
 * OSMOS-Inspired Shaders
 * Luminescent orbs, ambient particles, dreamy visuals
 */

const OsmosShaders = {
    glowing_orbs: {
        name: 'Glowing Orbs (OSMOS)',
        description: 'Luminescent floating orbs like OSMOS',
        format: 'glsl',
        code: `#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_audioLow;
uniform float u_audioMid;
uniform float u_audioHigh;

out vec4 fragColor;

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;

    vec3 col = vec3(0.0);

    // Ambient background glow
    float bgGlow = length(uv) * 0.3;
    col += vec3(0.05, 0.02, 0.1) * (1.0 - bgGlow);

    // Create multiple glowing orbs
    for (float i = 0.0; i < 12.0; i++) {
        float t = u_time * 0.3 + i * 0.5;
        float size = 0.15 + hash(vec2(i)) * 0.2;

        // Orb position (slow floating motion)
        vec2 orbPos = vec2(
            sin(t * 0.5 + i) * 0.6,
            cos(t * 0.3 + i * 0.7) * 0.5
        );

        float d = length(uv - orbPos);

        // Soft orb with audio reactivity
        float orb = size / (d + 0.1);
        orb *= (1.0 + u_audioLow * 0.3 + u_audioMid * 0.2);

        // Iridescent color per orb
        vec3 orbColor = 0.5 + 0.5 * sin(vec3(0.0, 2.0, 4.0) + i * 0.5 + u_time * 0.2);
        orbColor = mix(orbColor, vec3(0.3, 0.6, 1.0), 0.3);

        // Core glow
        float core = smoothstep(size * 2.0, 0.0, d) * 0.5;
        col += orbColor * (orb * 0.1 + core);

        // Outer ethereal glow
        float halo = exp(-d * 2.0) * 0.2 * (1.0 + u_audioHigh * 0.5);
        col += orbColor * halo;
    }

    // Subtle vignette
    float vignette = 1.0 - length(uv) * 0.4;
    col *= vignette;

    fragColor = vec4(col, 1.0);
}`
    },

    ambient_motes: {
        name: 'Ambient Motes (OSMOS)',
        description: 'Tiny floating particles in ambient space',
        format: 'shadertoy',
        code: `float hash21(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;

    vec3 col = vec3(0.0);
    float audio = (iAudioLow + iAudioMid + iAudioHigh) / 3.0;

    // Layers of motes
    for (float layer = 0.0; layer < 3.0; layer++) {
        vec2 layerUV = uv * (2.0 + layer);
        vec2 grid = fract(layerUV) - 0.5;
        vec2 id = floor(layerUV);

        float t = iTime * (0.5 + layer * 0.2);

        // Mote position with drift
        vec2 offset = vec2(
            hash21(id + vec2(0.0, layer)) - 0.5,
            hash21(id + vec2(100.0, layer)) - 0.5
        ) * 0.3;

        offset.x += sin(t + hash21(id) * 6.28) * 0.2;
        offset.y += cos(t * 0.7 + hash21(id + 50.0) * 6.28) * 0.2;

        vec2 motePos = grid - offset;
        float d = length(motePos);

        // Mote size varies
        float size = 0.01 + hash21(id + 200.0) * 0.02;
        size *= (1.0 + audio * 0.3);

        // Soft glow
        float mote = size / (d + size * 2.0);
        mote = pow(mote, 1.5);

        // Layer-based color
        vec3 moteColor = mix(
            vec3(0.3, 0.5, 1.0),
            vec3(0.8, 0.3, 0.9),
            layer / 3.0
        );

        col += moteColor * mote * (0.3 / (layer + 1.0));
    }

    fragColor = vec4(col, 0.7);
}`
    },

    ethereal_flow: {
        name: 'Ethereal Flow (Ethcapia)',
        description: 'Flowing ambient energy fields',
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
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = fract(sin(dot(i, vec2(127.1, 311.7))) * 43758.5453);
    float b = fract(sin(dot(i + vec2(1.0, 0.0), vec2(127.1, 311.7))) * 43758.5453);
    float c = fract(sin(dot(i + vec2(0.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
    float d = fract(sin(dot(i + vec2(1.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 5; i++) {
        value += amplitude * noise(p);
        p *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;

    float t = u_time * 0.2;

    // Flowing energy fields
    vec2 flow = vec2(
        fbm(p * 2.0 + t + u_audioLow),
        fbm(p * 2.0 + t * 0.8 + u_audioMid)
    );

    p += flow * 0.3;

    // Multiple layers of flow
    float pattern = 0.0;
    pattern += fbm(p * 3.0 + t);
    pattern += fbm(p * 5.0 - t * 0.5) * 0.5;
    pattern += fbm(p * 8.0 + t * 0.3) * 0.25;

    // Audio reactive intensity
    pattern *= (1.0 + (u_audioLow + u_audioMid + u_audioHigh) * 0.3);

    // Ethereal color palette
    vec3 color1 = vec3(0.1, 0.3, 0.8);
    vec3 color2 = vec3(0.8, 0.2, 0.6);
    vec3 color3 = vec3(0.2, 0.8, 0.7);

    vec3 col = mix(color1, color2, sin(pattern * 3.14159 + t) * 0.5 + 0.5);
    col = mix(col, color3, cos(pattern * 2.0 + t * 0.7) * 0.5 + 0.5);

    col *= pattern * 0.8;

    // Soft vignette
    float vignette = 1.0 - length(p) * 0.5;
    col *= vignette;

    fragColor = vec4(col, 1.0);
}`
    },

    aurora_waves: {
        name: 'Aurora Waves (Ethcapia)',
        description: 'Flowing aurora-like waves',
        format: 'shadertoy',
        code: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;

    float t = iTime * 0.3;
    float audio = (iAudioLow + iAudioMid + iAudioHigh) / 3.0;

    vec3 col = vec3(0.0);

    // Multiple wave layers
    for (float i = 0.0; i < 6.0; i++) {
        float wave = sin(uv.x * 3.0 + t + i * 0.5) * 0.3;
        wave += sin(uv.x * 5.0 - t * 0.7 + i) * 0.15;

        float y = uv.y - wave - (i * 0.1 - 0.25);
        float band = exp(-abs(y) * (8.0 + i * 2.0));

        // Aurora colors
        vec3 waveColor = 0.5 + 0.5 * sin(vec3(0.0, 2.0, 4.0) + i + t);
        waveColor = mix(waveColor, vec3(0.2, 0.8, 0.6), 0.4);

        col += waveColor * band * (0.5 + audio * 0.5);
    }

    // Shimmer effect
    float shimmer = sin(uv.x * 20.0 + t * 2.0) * cos(uv.y * 15.0 - t * 1.5);
    col += vec3(0.1, 0.3, 0.4) * shimmer * 0.1 * (1.0 + iAudioHigh);

    fragColor = vec4(col, 0.8);
}`
    },

    cosmic_dust: {
        name: 'Cosmic Dust (OSMOS)',
        description: 'Swirling cosmic particle field',
        format: 'glsl',
        code: `#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_audioLow;
uniform float u_audioMid;
uniform float u_audioHigh;

out vec4 fragColor;

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;

    vec3 col = vec3(0.0);
    float t = u_time * 0.2;

    // Swirling motion
    float angle = atan(uv.y, uv.x);
    float radius = length(uv);

    // Create spiral
    float spiral = angle + radius * 3.0 - t * 2.0;

    // Dust particles along spiral
    for (float i = 0.0; i < 100.0; i++) {
        float particleAngle = hash(vec2(i, 0.0)) * 6.28318;
        float particleRadius = 0.2 + hash(vec2(i, 1.0)) * 0.8;

        float offset = t + i * 0.1;
        particleAngle += offset + particleRadius * 2.0;

        vec2 particlePos = vec2(
            cos(particleAngle) * particleRadius,
            sin(particleAngle) * particleRadius
        );

        float d = length(uv - particlePos);
        float size = 0.005 + hash(vec2(i, 2.0)) * 0.01;

        // Glowing particle
        float particle = size / (d + size * 3.0);
        particle *= (1.0 + u_audioMid * 0.5);

        // Color based on position
        vec3 particleColor = 0.5 + 0.5 * sin(vec3(0.0, 2.0, 4.0) + i * 0.1 + t);

        col += particleColor * particle * 0.3;
    }

    // Nebula glow
    float glow = exp(-radius * 1.5) * 0.3;
    col += vec3(0.2, 0.1, 0.4) * glow * (1.0 + u_audioLow);

    fragColor = vec4(col, 1.0);
}`
    },

    dreamy_bokeh: {
        name: 'Dreamy Bokeh (OSMOS)',
        description: 'Soft out-of-focus light orbs',
        format: 'shadertoy',
        code: `float hash21(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;

    vec3 col = vec3(0.0);
    float t = iTime * 0.4;

    // Background ambient glow
    float bg = 1.0 - length(uv) * 0.6;
    col += vec3(0.02, 0.01, 0.05) * bg;

    // Bokeh circles (out of focus lights)
    for (float i = 0.0; i < 20.0; i++) {
        vec2 bokehPos = vec2(
            sin(t * 0.5 + i) * 0.8,
            cos(t * 0.3 + i * 0.7) * 0.7
        );

        float d = length(uv - bokehPos);
        float radius = 0.1 + hash21(vec2(i)) * 0.15;

        // Soft bokeh circle
        float bokeh = smoothstep(radius, radius * 0.7, d);
        bokeh -= smoothstep(radius * 0.3, 0.0, d);

        // Brightness varies
        float brightness = 0.3 + hash21(vec2(i + 50.0)) * 0.7;
        brightness *= (1.0 + iAudioMid * 0.4);

        // Soft pastel colors
        vec3 bokehColor = 0.5 + 0.5 * sin(vec3(0.0, 1.0, 2.0) + i * 0.3 + t * 0.5);
        bokehColor = mix(bokehColor, vec3(1.0), 0.3);

        col += bokehColor * bokeh * brightness;
    }

    fragColor = vec4(col, 0.85);
}`
    },

    // NEW SHADERS - MORE OSMOS/ETHCAPIA STYLE
    nebula_clouds: {
        name: 'Nebula Clouds',
        description: 'Swirling cosmic nebula gas',
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

float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 6; i++) {
        value += amplitude * noise(p);
        p = p * 2.0 + vec2(0.1);
        amplitude *= 0.5;
    }
    return value;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;

    float t = u_time * 0.1;

    // Layered nebula clouds
    vec2 warp = vec2(
        fbm(p * 2.0 + t),
        fbm(p * 2.0 + t + 5.2)
    );

    vec2 q = p + warp * 0.5;
    float clouds = fbm(q * 3.0 + t * 0.5);

    // Multiple color layers
    vec3 col1 = vec3(0.1, 0.2, 0.6);
    vec3 col2 = vec3(0.6, 0.1, 0.4);
    vec3 col3 = vec3(0.2, 0.6, 0.5);

    vec3 col = mix(col1, col2, clouds);
    col = mix(col, col3, fbm(q * 2.0 - t * 0.3));

    // Audio reactivity
    col *= (0.8 + (u_audioLow + u_audioMid + u_audioHigh) * 0.4);

    // Stars
    float stars = noise(p * 100.0);
    stars = smoothstep(0.98, 1.0, stars);
    col += vec3(1.0) * stars * (0.5 + u_audioHigh);

    fragColor = vec4(col, 1.0);
}`
    },

    liquid_light: {
        name: 'Liquid Light',
        description: 'Flowing liquid light streams',
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
    vec3 col = vec3(0.0);

    // Multiple flowing streams
    for (float i = 0.0; i < 5.0; i++) {
        float offset = i * 1.2;

        // Flowing paths
        float x = uv.x + sin(uv.y * 3.0 + t + offset) * 0.3;
        float y = uv.y + cos(uv.x * 2.0 + t * 0.7 + offset) * 0.3;

        vec2 flowUV = vec2(x, y);
        float flow = sin(flowUV.x * 5.0 + t) * cos(flowUV.y * 4.0 - t * 0.8);
        flow = smoothstep(0.0, 0.5, flow);

        // Gradient colors
        vec3 streamColor = 0.5 + 0.5 * sin(vec3(0.0, 2.0, 4.0) + i + t);
        streamColor = mix(streamColor, vec3(0.8, 0.9, 1.0), 0.3);

        col += streamColor * flow * 0.3 * (1.0 + u_audioMid * 0.5);
    }

    // Glow
    float glow = 1.0 - length(uv) * 0.8;
    col += vec3(0.1, 0.15, 0.3) * glow * (1.0 + u_audioLow);

    fragColor = vec4(col, 1.0);
}`
    },

    zen_ripples: {
        name: 'Zen Ripples',
        description: 'Peaceful water ripples',
        format: 'shadertoy',
        code: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;

    vec3 col = vec3(0.0);
    float t = iTime * 0.4;
    float audio = (iAudioLow + iAudioMid + iAudioHigh) / 3.0;

    // Create ripple centers
    vec2 centers[5];
    centers[0] = vec2(sin(t * 0.5) * 0.4, cos(t * 0.3) * 0.4);
    centers[1] = vec2(sin(t * 0.7 + 1.0) * 0.5, cos(t * 0.4 + 2.0) * 0.3);
    centers[2] = vec2(sin(t * 0.3 + 3.0) * 0.3, cos(t * 0.6 + 1.5) * 0.5);
    centers[3] = vec2(sin(t * 0.6 + 4.0) * 0.4, cos(t * 0.5 + 3.0) * 0.4);
    centers[4] = vec2(sin(t * 0.4 + 2.0) * 0.5, cos(t * 0.7 + 4.0) * 0.3);

    // Ripples from each center
    for (int i = 0; i < 5; i++) {
        float d = length(uv - centers[i]);
        float ripple = sin(d * 15.0 - t * 3.0) * exp(-d * 2.0);

        vec3 rippleColor = 0.5 + 0.5 * sin(vec3(0.0, 1.5, 3.0) + float(i) * 0.5);
        col += rippleColor * ripple * 0.2 * (1.0 + audio * 0.3);
    }

    // Soft background
    float bg = 1.0 - length(uv) * 0.5;
    col += vec3(0.05, 0.08, 0.15) * bg;

    fragColor = vec4(col, 0.8);
}`
    },

    crystal_lattice: {
        name: 'Crystal Lattice',
        description: 'Geometric crystal patterns',
        format: 'glsl',
        code: `#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_audioLow;
uniform float u_audioMid;
uniform float u_audioHigh;

out vec4 fragColor;

float hexDist(vec2 p) {
    p = abs(p);
    float c = dot(p, normalize(vec2(1.0, 1.732)));
    c = max(c, p.x);
    return c;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y * 8.0;

    float t = u_time * 0.2;

    // Hexagonal tiling
    vec2 grid = vec2(p.x + p.y * 0.577, p.y * 1.155);
    vec2 id = floor(grid);
    vec2 gv = fract(grid) - 0.5;

    float hex = hexDist(gv);
    float cell = smoothstep(0.52, 0.48, hex);

    // Crystal glow
    float glow = exp(-hex * 3.0) * 0.5;

    // Color based on position and time
    vec3 col = vec3(0.0);
    float hash = fract(sin(dot(id, vec2(127.1, 311.7))) * 43758.5453);
    vec3 cellColor = 0.5 + 0.5 * sin(vec3(0.0, 2.0, 4.0) + hash * 6.28 + t);

    col += cellColor * cell * (0.5 + u_audioHigh * 0.5);
    col += cellColor * glow * (1.0 + u_audioMid * 0.5);

    // Pulsing
    float pulse = sin(t * 2.0 + hash * 6.28) * 0.5 + 0.5;
    col *= (0.8 + pulse * 0.2 * (1.0 + u_audioLow));

    fragColor = vec4(col, 1.0);
}`
    },

    bioluminescence: {
        name: 'Bioluminescence',
        description: 'Glowing organic particles',
        format: 'shadertoy',
        code: `float hash21(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;

    vec3 col = vec3(0.0);
    float t = iTime * 0.3;

    // Background ocean depth
    float depth = length(uv) * 0.4;
    col += vec3(0.0, 0.05, 0.1) * (1.0 - depth);

    // Bioluminescent organisms
    for (float i = 0.0; i < 30.0; i++) {
        vec2 orgPos = vec2(
            hash21(vec2(i, 0.0)) * 2.0 - 1.0,
            hash21(vec2(i, 1.0)) * 2.0 - 1.0
        );

        // Drift motion
        orgPos.x += sin(t + i * 0.5) * 0.2;
        orgPos.y += cos(t * 0.7 + i * 0.3) * 0.15;

        float d = length(uv - orgPos);
        float size = 0.02 + hash21(vec2(i, 2.0)) * 0.03;

        // Pulsing glow
        float pulse = sin(t * 2.0 + i) * 0.5 + 0.5;
        pulse *= (1.0 + iAudioLow * 0.5);

        float organism = size / (d + size * 2.0);
        organism *= pulse;

        // Cyan/green bioluminescent color
        vec3 bioColor = mix(
            vec3(0.0, 0.8, 0.6),
            vec3(0.2, 1.0, 0.8),
            hash21(vec2(i, 3.0))
        );

        col += bioColor * organism * 0.5;

        // Soft halo
        float halo = exp(-d * 1.5) * 0.1;
        col += bioColor * halo * pulse;
    }

    fragColor = vec4(col, 0.9);
}`
    },

    star_field: {
        name: 'Star Field',
        description: 'Deep space starfield',
        format: 'glsl',
        code: `#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_audioLow;
uniform float u_audioMid;
uniform float u_audioHigh;

out vec4 fragColor;

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;

    vec3 col = vec3(0.0);
    float t = u_time * 0.1;

    // Multiple star layers (parallax)
    for (float layer = 0.0; layer < 5.0; layer++) {
        float depth = 1.0 + layer * 0.5;
        vec2 layerUV = uv * depth + vec2(t * (0.1 + layer * 0.05), 0.0);

        vec2 starGrid = floor(layerUV * 20.0 / depth);
        vec2 starFract = fract(layerUV * 20.0 / depth);

        for (float i = -1.0; i <= 1.0; i++) {
            for (float j = -1.0; j <= 1.0; j++) {
                vec2 neighbor = vec2(i, j);
                vec2 cellId = starGrid + neighbor;

                float starChance = hash(cellId + layer * 100.0);
                if (starChance > 0.95) {
                    vec2 starPos = neighbor + vec2(
                        hash(cellId + 50.0),
                        hash(cellId + 150.0)
                    );

                    float d = length(starFract - starPos);
                    float star = 0.002 / (d + 0.001);

                    // Twinkling
                    float twinkle = sin(t * 5.0 + starChance * 6.28) * 0.5 + 0.5;
                    twinkle *= (1.0 + u_audioHigh * 0.3);

                    // Star color variation
                    vec3 starColor = mix(
                        vec3(0.8, 0.9, 1.0),
                        vec3(1.0, 0.9, 0.7),
                        hash(cellId + 200.0)
                    );

                    col += starColor * star * twinkle / depth;
                }
            }
        }
    }

    // Nebula background
    float nebula = sin(uv.x * 2.0 + t) * cos(uv.y * 1.5 - t * 0.5);
    col += vec3(0.1, 0.05, 0.2) * nebula * 0.1 * (1.0 + u_audioLow);

    fragColor = vec4(col, 1.0);
}`
    },

    plasma_membrane: {
        name: 'Plasma Membrane',
        description: 'Organic cell membrane patterns',
        format: 'shadertoy',
        code: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;

    float t = iTime * 0.2;
    vec3 col = vec3(0.0);

    // Membrane oscillations
    for (float i = 0.0; i < 4.0; i++) {
        vec2 p = uv * (2.0 + i * 0.5);

        float membrane = sin(p.x * 4.0 + t + i);
        membrane += cos(p.y * 3.0 - t * 0.7 + i * 0.5);
        membrane += sin(length(p) * 5.0 + t * 1.2);
        membrane /= 3.0;

        // Cellular colors
        vec3 cellColor = vec3(
            0.5 + 0.5 * sin(membrane + iAudioLow * 2.0),
            0.5 + 0.5 * cos(membrane * 1.3 + iAudioMid * 2.0),
            0.5 + 0.5 * sin(membrane * 0.7 + iAudioHigh * 2.0)
        );

        float intensity = smoothstep(-0.2, 0.2, membrane);
        col += cellColor * intensity * (0.3 / (i + 1.0));
    }

    // Soft vignette
    float vignette = 1.0 - length(uv) * 0.6;
    col *= vignette;

    fragColor = vec4(col, 0.85);
}`
    },

    fractal_flowers: {
        name: 'Fractal Flowers',
        description: 'Blooming fractal patterns',
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
    float angle = atan(uv.y, uv.x);
    float radius = length(uv);

    vec3 col = vec3(0.0);

    // Petals
    float petals = 8.0 + floor(u_audioMid * 8.0);
    float petalAngle = mod(angle, 6.28318 / petals) - 3.14159 / petals;

    // Fractal iterations
    for (float i = 0.0; i < 3.0; i++) {
        float scale = 1.0 + i * 0.5;
        float petal = abs(sin(petalAngle * petals * scale + t + i));
        petal = pow(petal, 2.0 - radius * 0.5);

        float bloom = smoothstep(0.8, 0.2, radius) * petal;

        vec3 petalColor = 0.5 + 0.5 * sin(vec3(0.0, 2.0, 4.0) + i + t + u_audioLow);
        col += petalColor * bloom * (0.5 / (i + 1.0));
    }

    // Center glow
    float center = exp(-radius * 5.0);
    col += vec3(1.0, 0.9, 0.6) * center * (1.0 + u_audioHigh);

    fragColor = vec4(col, 1.0);
}`
    }
};
