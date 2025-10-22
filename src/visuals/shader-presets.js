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
