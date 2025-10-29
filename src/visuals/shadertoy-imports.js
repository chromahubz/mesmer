/**
 * ShaderToy Import Library
 * Popular ShaderToy-style shaders ready to use
 */

const ShaderToyImports = {
    // Seascape-inspired ocean waves
    ocean_waves: {
        name: 'Ocean Waves',
        description: 'Realistic ocean water simulation (ShaderToy style)',
        format: 'shadertoy',
        code: `// Ocean waves with audio reactivity
const int NUM_STEPS = 8;
const float PI = 3.141592;
const float EPSILON = 1e-3;

float hash(vec2 p) {
    float h = dot(p, vec2(127.1, 311.7));
    return fract(sin(h) * 43758.5453123);
}

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

float sea_octave(vec2 uv, float choppy) {
    uv += noise(uv);
    vec2 wv = 1.0 - abs(sin(uv));
    vec2 swv = abs(cos(uv));
    wv = mix(wv, swv, wv);
    return pow(1.0 - pow(wv.x * wv.y, 0.65), choppy);
}

float map(vec3 p, float time) {
    float freq = 0.16;
    float amp = 0.6;
    float choppy = 4.0;
    vec2 uv = p.xz;

    float d, h = 0.0;
    for(int i = 0; i < 3; i++) {
        d = sea_octave((uv + time) * freq, choppy);
        d += sea_octave((uv - time) * freq, choppy);
        h += d * amp;
        uv *= mat2(1.6, 1.2, -1.2, 1.6);
        freq *= 1.9;
        amp *= 0.22;
        choppy = mix(choppy, 1.0, 0.2);
    }
    return p.y - h;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    uv = uv * 2.0 - 1.0;
    uv.x *= iResolution.x / iResolution.y;

    float time = iTime * 0.3 + iAudioLow * 2.0;

    // Ray direction
    vec3 ro = vec3(0.0, 3.5, time * 5.0);
    vec3 rd = normalize(vec3(uv, -2.0));

    // Raymarch
    float t = 0.0;
    for(int i = 0; i < NUM_STEPS; i++) {
        vec3 p = ro + rd * t;
        float d = map(p, time);
        if(abs(d) < EPSILON) break;
        t += d * 0.5;
    }

    vec3 p = ro + rd * t;
    float h = map(p, time);

    // Color
    vec3 seaColor = vec3(0.0, 0.3, 0.5);
    vec3 skyColor = vec3(0.5, 0.7, 0.9);
    vec3 col = mix(seaColor, skyColor, smoothstep(-2.0, 2.0, h));

    // Foam
    float foam = smoothstep(0.0, 0.3, h) * (1.0 + iAudioHigh);
    col += vec3(foam);

    // Audio reactive brightness
    col *= 0.8 + iAudioMid * 0.3;

    fragColor = vec4(col, 0.9);
}`
    },

    // Plasma ball
    plasma_ball: {
        name: 'Plasma Ball',
        description: 'Electric plasma sphere effect',
        format: 'shadertoy',
        code: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;

    vec3 col = vec3(0.0);
    float time = iTime + iAudioLow * 3.0;

    // Multiple plasma tendrils
    for(float i = 0.0; i < 8.0; i++) {
        float angle = i * 0.785 + time * 0.5;
        vec2 center = vec2(cos(angle), sin(angle)) * 0.3;

        float d = length(uv - center);
        float bolt = 0.02 / d;
        bolt *= sin(d * 20.0 - time * 5.0 + i) * 0.5 + 0.5;
        bolt *= (1.0 + iAudioHigh * 0.5);

        vec3 boltColor = vec3(
            0.5 + 0.5 * sin(i + time),
            0.5 + 0.5 * cos(i * 1.5),
            1.0
        );

        col += boltColor * bolt;
    }

    // Core glow
    float core = 0.1 / length(uv);
    col += vec3(0.5, 0.7, 1.0) * core * 0.5 * (1.0 + iAudioMid);

    fragColor = vec4(col, 0.8);
}`
    },

    // Tunnel shader
    tunnel: {
        name: 'Infinite Tunnel',
        description: 'Hypnotic infinite tunnel effect',
        format: 'shadertoy',
        code: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;

    // Polar coordinates
    float a = atan(uv.y, uv.x);
    float r = length(uv);

    // Tunnel depth
    float z = 0.5 / r - iTime * 0.5 - iAudioLow;

    // UV for tunnel
    vec2 tuv = vec2(a / 3.14159, z);

    // Patterns
    vec2 id = floor(tuv * vec2(12.0, 4.0));
    vec2 gv = fract(tuv * vec2(12.0, 4.0)) - 0.5;

    // Stripes
    float stripes = step(0.4, abs(gv.x)) + step(0.4, abs(gv.y));
    stripes = min(stripes, 1.0);

    // Color based on depth
    vec3 col = vec3(
        0.5 + 0.5 * sin(z + iAudioLow * 2.0),
        0.5 + 0.5 * cos(z * 0.7 + iAudioMid * 2.0),
        0.7 + 0.3 * sin(z * 0.5)
    );

    col *= stripes;
    col *= 1.0 - r * 0.5; // Vignette
    col *= (1.0 + iAudioHigh * 0.5);

    fragColor = vec4(col, 0.85);
}`
    },

    // Star field
    star_field: {
        name: 'Star Field',
        description: 'Parallax star field with depth',
        format: 'shadertoy',
        code: `float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

vec3 starLayer(vec2 uv, float speed, float density) {
    vec2 gv = fract(uv) - 0.5;
    vec2 id = floor(uv);

    vec3 col = vec3(0.0);

    for(float y = -1.0; y <= 1.0; y++) {
        for(float x = -1.0; x <= 1.0; x++) {
            vec2 offs = vec2(x, y);
            float n = hash21(id + offs);

            vec2 p = gv - offs - vec2(n, fract(n * 34.0)) + 0.5;
            float d = length(p);

            float star = smoothstep(0.05, 0.01, d);
            float twinkle = sin(iTime * 3.0 + n * 6.28) * 0.5 + 0.5;

            star *= twinkle * (0.5 + iAudioHigh * 0.5);

            col += star * vec3(0.8 + n * 0.2, 0.8, 1.0);
        }
    }

    return col;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;

    vec3 col = vec3(0.0);

    float t = iTime * 0.1;

    // Multiple star layers with parallax
    col += starLayer(uv * 3.0 + t * 0.1, 0.1, 50.0) * 0.5;
    col += starLayer(uv * 5.0 + t * 0.3, 0.3, 30.0) * 0.7;
    col += starLayer(uv * 8.0 + t * 0.5 + iAudioLow, 0.5, 20.0);

    // Nebula background
    float nebula = 0.0;
    for(float i = 0.0; i < 3.0; i++) {
        vec2 nuv = uv * (2.0 + i) + t * (0.1 + i * 0.05);
        nebula += sin(nuv.x * 2.0) * cos(nuv.y * 2.0) * (1.0 / (i + 1.0));
    }
    nebula = abs(nebula) * 0.1;
    col += vec3(0.2, 0.1, 0.3) * nebula * (1.0 + iAudioMid * 0.3);

    fragColor = vec4(col, 0.9);
}`
    },

    // Fractal
    mandelbrot: {
        name: 'Mandelbrot Explorer',
        description: 'Interactive Mandelbrot fractal',
        format: 'shadertoy',
        code: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;

    // Zoom and pan
    float zoom = 0.5 + sin(iTime * 0.2) * 0.3 + iAudioLow * 0.5;
    vec2 c = uv / zoom + vec2(-0.5, 0.0);

    // Mandelbrot iteration
    vec2 z = vec2(0.0);
    int iter = 0;
    const int maxIter = 100;

    for(int i = 0; i < maxIter; i++) {
        if(length(z) > 2.0) break;

        // z = z^2 + c
        z = vec2(
            z.x * z.x - z.y * z.y,
            2.0 * z.x * z.y
        ) + c;

        iter++;
    }

    // Color
    float t = float(iter) / float(maxIter);

    vec3 col = vec3(
        0.5 + 0.5 * sin(t * 10.0 + iTime + iAudioLow * 2.0),
        0.5 + 0.5 * cos(t * 8.0 + iAudioMid * 2.0),
        0.5 + 0.5 * sin(t * 12.0 + iAudioHigh * 2.0)
    );

    // Darken if in set
    if(iter == maxIter) {
        col *= 0.1;
    }

    fragColor = vec4(col, 0.9);
}`
    },

    // Warp tunnel
    warp_speed: {
        name: 'Warp Speed',
        description: 'Star Trek-style warp speed effect',
        format: 'shadertoy',
        code: `float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;

    float a = atan(uv.y, uv.x);
    float r = length(uv);

    vec3 col = vec3(0.0);

    float speed = 5.0 + iAudioLow * 10.0;

    // Star streaks
    for(float i = 0.0; i < 50.0; i++) {
        float angle = hash(vec2(i)) * 6.28;
        float dist = 0.5 + hash(vec2(i + 10.0)) * 0.5;

        vec2 pos = vec2(cos(angle), sin(angle)) * dist;
        vec2 toStar = uv - pos;

        float streak = length(toStar);
        float trail = abs(atan(toStar.y, toStar.x) - angle);

        trail = smoothstep(0.05, 0.0, trail);

        float z = mod(iTime * speed + hash(vec2(i + 20.0)) * 10.0, 10.0);
        streak = smoothstep(z, z - 0.1, streak);

        float brightness = trail * streak;
        col += vec3(0.7, 0.8, 1.0) * brightness * (1.0 + iAudioHigh);
    }

    // Center glow
    col += vec3(0.3, 0.5, 1.0) * (0.1 / r) * 0.2 * (1.0 + iAudioMid);

    fragColor = vec4(col, 0.85);
}`
    },

    // Fractal tunnel (modified from ShaderToy user submission)
    fractal_tunnel: {
        name: 'Fractal Tunnel',
        description: 'Raymarched fractal tunnel with colors',
        format: 'shadertoy',
        code: `const float pi = 3.14159;

mat3 zrot(float t) {
    return mat3(cos(t), -sin(t), 0.0,
                sin(t), cos(t), 0.0,
                0.0, 0.0, 1.0);
}

mat3 yrot(float t) {
    return mat3(cos(t), 0.0, -sin(t),
                0.0, 1.0, 0.0,
                sin(t), 0.0, cos(t));
}

// Procedural noise instead of texture
float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float n = dot(i, vec3(1.0, 57.0, 113.0));
    return mix(mix(mix(fract(sin(n) * 43758.5),
                       fract(sin(n + 1.0) * 43758.5), f.x),
                   mix(fract(sin(n + 57.0) * 43758.5),
                       fract(sin(n + 58.0) * 43758.5), f.x), f.y),
               mix(mix(fract(sin(n + 113.0) * 43758.5),
                       fract(sin(n + 114.0) * 43758.5), f.x),
                   mix(fract(sin(n + 170.0) * 43758.5),
                       fract(sin(n + 171.0) * 43758.5), f.x), f.y), f.z);
}

vec2 map(vec3 p) {
    p.x += sin(p.z);
    p *= zrot(p.z);
    float d = 1000.0;
    vec3 q = fract(p) * 2.0 - 1.0;
    float idx = 0.0;

    for (int i = 0; i < 3; ++i) {
        q = sign(q) * (1.0 - 1.0 / (1.0 + abs(q) * 0.8));

        float md = length(q) - 0.5;
        float ss = 0.5 + 0.5 * sin(p.z + md * float(i) * 6.0 + iAudioMid * 3.0);
        float cyl = length(p.xy) - 0.5 - ss;

        md = max(md, -cyl);

        if (md < d) {
            d = md;
            idx = float(i);
        }
    }
    return vec2(d, idx);
}

vec3 normal(vec3 p) {
    vec3 o = vec3(0.1, 0.0, 0.0);
    return normalize(vec3(map(p+o.xyy).x - map(p-o.xyy).x,
                          map(p+o.yxy).x - map(p-o.yxy).x,
                          map(p+o.yyx).x - map(p-o.yyx).x));
}

float trace(vec3 o, vec3 r) {
    float t = 0.0;
    for (int i = 0; i < 64; ++i) {
        vec3 p = o + r * t;
        float d = map(p).x;
        t += d * 0.3;
    }
    return t;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord.xy / iResolution.xy;
    uv = uv * 2.0 - 1.0;
    uv.x *= iResolution.x / iResolution.y;

    vec3 r = normalize(vec3(uv, 1.0 - dot(uv,uv) * 0.33));
    r *= zrot(iTime * 0.25 + iAudioLow) * yrot(-sin(iTime));

    vec3 o = vec3(0.0, 0.0, 0.0);
    o.z += iTime;
    o.x += -sin(o.z);

    float t = trace(o, r);
    vec3 w = o + r * t;
    vec3 sn = normal(w);
    vec2 fd = map(w);
    vec3 ref = reflect(r, sn);

    // Color based on object index
    vec3 diff = vec3(0.0);
    if (fd.y == 0.0) {
        diff = vec3(1.0, 0.0, 0.0);
    } else if (fd.y == 1.0) {
        diff = vec3(0.0, 1.0, 0.0);
    } else if (fd.y == 2.0) {
        diff = vec3(0.0, 0.0, 1.0);
    } else {
        diff = vec3(1.0, 1.0, 1.0);
    }

    // Add procedural texture
    diff += vec3(noise(w * 2.0)) * 0.5;

    // Add reflection using procedural pattern
    vec3 refCol = vec3(noise(ref * 3.0), noise(ref * 3.0 + 1.0), noise(ref * 3.0 + 2.0));
    diff += refCol * 0.3;

    diff = mix(diff, vec3(1.0), abs(sn.y));
    diff = mix(vec3(0.8, 0.0, 0.0), diff, abs(sn.y));

    float prod = max(dot(sn, -r), 0.0);
    diff *= prod;

    // Audio reactive brightness
    diff *= (1.0 + iAudioHigh * 0.3);

    float fog = 1.0 / (1.0 + t * t * 0.1 + fd.x * 100.0);
    vec3 fc = diff * fog;

    fragColor = vec4(sqrt(fc), 0.9);
}`
    },

    // Synthwave sunset with Mt. Fuji (ENHANCED AUDIO REACTIVE VERSION)
    synthwave_sunset: {
        name: 'Synthwave Sunset',
        description: 'Retro synthwave sunset with mountains - Fully audio reactive',
        format: 'shadertoy',
        code: `float sun(vec2 uv, float battery, float audioPulse) {
    // Audio-reactive sun size
    float sunSize = 0.3 + audioPulse * 0.1;
    float val = smoothstep(sunSize, sunSize - 0.01, length(uv));
    float bloom = smoothstep(0.7, 0.0, length(uv));

    // Audio-reactive scan lines
    float cut = 3.0 * sin((uv.y + iTime * 0.2 * (battery + 0.02)) * 100.0)
                + clamp(uv.y * 14.0 + 1.0, -6.0, 6.0);
    cut = clamp(cut, 0.0, 1.0);

    // Enhanced bloom with audio
    return clamp(val * cut, 0.0, 1.0) + bloom * (0.6 + audioPulse * 0.4);
}

float grid(vec2 uv, float battery, float bassKick) {
    vec2 size = vec2(uv.y, uv.y * uv.y * 0.2) * 0.01;
    // Bass-driven grid speed
    uv += vec2(0.0, iTime * (4.0 + bassKick * 8.0) * (battery + 0.05));
    uv = abs(fract(uv) - 0.5);
    vec2 lines = smoothstep(size, vec2(0.0), uv);
    // Audio-reactive grid brightness
    lines += smoothstep(size * 5.0, vec2(0.0), uv) * (0.4 + bassKick * 0.6) * battery;
    return clamp(lines.x + lines.y, 0.0, 3.0);
}

float dot2(in vec2 v) { return dot(v,v); }

float sdTrapezoid(in vec2 p, in float r1, float r2, float he) {
    vec2 k1 = vec2(r2,he);
    vec2 k2 = vec2(r2-r1,2.0*he);
    p.x = abs(p.x);
    vec2 ca = vec2(p.x-min(p.x,(p.y<0.0)?r1:r2), abs(p.y)-he);
    vec2 cb = p - k1 + k2*clamp(dot(k1-p,k2)/dot2(k2), 0.0, 1.0);
    float s = (cb.x<0.0 && ca.y<0.0) ? -1.0 : 1.0;
    return s*sqrt(min(dot2(ca),dot2(cb)));
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (2.0 * fragCoord.xy - iResolution.xy)/iResolution.y;

    // Enhanced audio reactivity
    float bassKick = iAudioLow * 1.5;
    float midPulse = iAudioMid * 1.2;
    float highShimmer = iAudioHigh * 1.0;
    float battery = 0.7 + midPulse * 0.3;

    // Grid
    float fog = smoothstep(0.1, -0.02, abs(uv.y + 0.2));
    // Audio-reactive background color
    vec3 col = vec3(0.0, 0.1 + bassKick * 0.1, 0.2 + bassKick * 0.1);

    if (uv.y < -0.2) {
        uv.y = 3.0 / (abs(uv.y + 0.2) + 0.05);
        uv.x *= uv.y * 1.0;
        float gridVal = grid(uv, battery, bassKick);
        // Pulsing grid colors with audio
        vec3 gridColor = vec3(
            1.0,
            0.5 + midPulse * 0.3,
            1.0 - highShimmer * 0.2
        );
        col = mix(col, gridColor, gridVal);
    } else {
        float fujiD = min(uv.y * 4.5 - 0.5, 1.0);
        uv.y -= battery * 1.1 - 0.51;

        vec2 sunUV = uv;

        // Sun with audio pulsing
        sunUV += vec2(0.75, 0.2 + sin(iTime * 2.0) * midPulse * 0.05);
        col = vec3(1.0, 0.2 + midPulse * 0.3, 1.0);
        float sunVal = sun(sunUV, battery, midPulse);

        // Audio-reactive sun colors
        col = mix(col, vec3(1.0, 0.4 + highShimmer * 0.3, 0.1), sunUV.y * 2.0 + 0.2);
        col = mix(vec3(0.0), col, sunVal);

        // Mountain with audio-reactive glow
        float fujiVal = sdTrapezoid(uv + vec2(-0.75+sunUV.y * 0.0, 0.5),
                                    1.75 + pow(uv.y * uv.y, 2.1), 0.2, 0.5);

        vec3 mountainDark = vec3(0.0, 0.0, 0.25 + bassKick * 0.1);
        vec3 mountainBright = vec3(1.0, 0.0 + midPulse * 0.2, 0.5 + highShimmer * 0.3);
        col = mix(col, mix(mountainDark, mountainBright, fujiD), step(fujiVal, 0.0));

        // Glowing mountain edges with audio
        vec3 edgeGlow = vec3(1.0, 0.5 + midPulse * 0.5, 1.0);
        col = mix(col, edgeGlow, (1.0-smoothstep(0.0,0.01,abs(fujiVal))) * (1.0 + highShimmer));

        vec3 skyTop = vec3(1.0, 0.12 + bassKick * 0.2, 0.8 + midPulse * 0.2);
        vec3 skyBottom = vec3(0.0, 0.0, 0.2 + bassKick * 0.15);
        col += mix(col, mix(skyTop, skyBottom, clamp(uv.y * 3.5 + 3.0, 0.0, 1.0)),
                   step(0.0, fujiVal));
    }

    // Enhanced fog with audio pulse
    col += (fog * fog * fog) * (1.0 + midPulse * 0.3);
    col = mix(vec3(col.r) * 0.5, col, battery * 0.7);

    // Strong overall audio reactivity boost
    col *= (1.0 + highShimmer * 0.4 + bassKick * 0.2);

    fragColor = vec4(col, 0.9);
}`
    },

    // Simple colorful swirl
    colorful_swirl: {
        name: 'Colorful Swirl',
        description: 'Hypnotic colorful swirling effect',
        format: 'shadertoy',
        code: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec3 c;
    float l, z = iTime;
    vec2 r = iResolution.xy;

    for(int i=0; i<3; i++) {
        vec2 uv, p = fragCoord.xy/r;
        uv = p;
        p -= .5;
        p.x *= r.x/r.y;
        z += .07;
        l = length(p);
        uv += p/l*(sin(z)+1.)*abs(sin(l*9.-z-z));
        c[i] = .01/length(mod(uv,1.)-.5);
    }

    c *= (1.0 + iAudioMid * 0.5);
    fragColor = vec4(c/l, 1.0);
}`
    },

    // Seascape - by Alexander Alekseev aka TDM - 2014
    // License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
    seascape: {
        name: 'Seascape',
        description: 'Realistic ocean water with procedural waves',
        format: 'shadertoy',
        code: `/*
 * "Seascape" by Alexander Alekseev aka TDM - 2014
 * License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
 * Contact: tdmaav@gmail.com
 */

const int NUM_STEPS = 5;
const float PI	 	= 3.141592;
const float EPSILON	= 1e-3;
#define EPSILON_NRM (0.1 / iResolution.x)
// #define AA  // DISABLED for performance

// sea
const int ITER_GEOMETRY = 2;
const int ITER_FRAGMENT = 3;
const float SEA_HEIGHT = 0.6;
const float SEA_CHOPPY = 4.0;
const float SEA_SPEED = 0.8;
const float SEA_FREQ = 0.16;
const vec3 SEA_BASE = vec3(0.0,0.09,0.18);
const vec3 SEA_WATER_COLOR = vec3(0.8,0.9,0.6)*0.6;
#define SEA_TIME (1.0 + iTime * SEA_SPEED)
const mat2 octave_m = mat2(1.6,1.2,-1.2,1.6);

// math
mat3 fromEuler(vec3 ang) {
	vec2 a1 = vec2(sin(ang.x),cos(ang.x));
    vec2 a2 = vec2(sin(ang.y),cos(ang.y));
    vec2 a3 = vec2(sin(ang.z),cos(ang.z));
    mat3 m;
    m[0] = vec3(a1.y*a3.y+a1.x*a2.x*a3.x,a1.y*a2.x*a3.x+a3.y*a1.x,-a2.y*a3.x);
	m[1] = vec3(-a2.y*a1.x,a1.y*a2.y,a2.x);
	m[2] = vec3(a3.y*a1.x*a2.x+a1.y*a3.x,a1.x*a3.x-a1.y*a3.y*a2.x,a2.y*a3.y);
	return m;
}
float hash( vec2 p ) {
	float h = dot(p,vec2(127.1,311.7));
    return fract(sin(h)*43758.5453123);
}
float noise( in vec2 p ) {
    vec2 i = floor( p );
    vec2 f = fract( p );
	vec2 u = f*f*(3.0-2.0*f);
    return -1.0+2.0*mix( mix( hash( i + vec2(0.0,0.0) ),
                     hash( i + vec2(1.0,0.0) ), u.x),
                mix( hash( i + vec2(0.0,1.0) ),
                     hash( i + vec2(1.0,1.0) ), u.x), u.y);
}

// lighting
float diffuse(vec3 n,vec3 l,float p) {
    return pow(dot(n,l) * 0.4 + 0.6,p);
}
float specular(vec3 n,vec3 l,vec3 e,float s) {
    float nrm = (s + 8.0) / (PI * 8.0);
    return pow(max(dot(reflect(e,n),l),0.0),s) * nrm;
}

// sky
vec3 getSkyColor(vec3 e) {
    e.y = (max(e.y,0.0)*0.8+0.2)*0.8;
    return vec3(pow(1.0-e.y,2.0), 1.0-e.y, 0.6+(1.0-e.y)*0.4) * 1.1;
}

// sea
float sea_octave(vec2 uv, float choppy) {
    uv += noise(uv);
    vec2 wv = 1.0-abs(sin(uv));
    vec2 swv = abs(cos(uv));
    wv = mix(wv,swv,wv);
    return pow(1.0-pow(wv.x * wv.y,0.65),choppy);
}

float map(vec3 p) {
    float freq = SEA_FREQ;
    float amp = SEA_HEIGHT;
    float choppy = SEA_CHOPPY;
    vec2 uv = p.xz; uv.x *= 0.75;

    float d, h = 0.0;
    for(int i = 0; i < ITER_GEOMETRY; i++) {
    	d = sea_octave((uv+SEA_TIME)*freq,choppy);
    	d += sea_octave((uv-SEA_TIME)*freq,choppy);
        h += d * amp;
    	uv *= octave_m; freq *= 1.9; amp *= 0.22;
        choppy = mix(choppy,1.0,0.2);
    }
    return p.y - h;
}

float map_detailed(vec3 p) {
    float freq = SEA_FREQ;
    float amp = SEA_HEIGHT;
    float choppy = SEA_CHOPPY;
    vec2 uv = p.xz; uv.x *= 0.75;

    float d, h = 0.0;
    for(int i = 0; i < ITER_FRAGMENT; i++) {
    	d = sea_octave((uv+SEA_TIME)*freq,choppy);
    	d += sea_octave((uv-SEA_TIME)*freq,choppy);
        h += d * amp;
    	uv *= octave_m; freq *= 1.9; amp *= 0.22;
        choppy = mix(choppy,1.0,0.2);
    }
    return p.y - h;
}

vec3 getSeaColor(vec3 p, vec3 n, vec3 l, vec3 eye, vec3 dist) {
    float fresnel = clamp(1.0 - dot(n,-eye), 0.0, 1.0);
    fresnel = pow(fresnel,3.0) * 0.5;

    vec3 reflected = getSkyColor(reflect(eye,n));
    vec3 refracted = SEA_BASE + diffuse(n,l,80.0) * SEA_WATER_COLOR * 0.12;

    vec3 color = mix(refracted,reflected,fresnel);

    float atten = max(1.0 - dot(dist,dist) * 0.001, 0.0);
    color += SEA_WATER_COLOR * (p.y - SEA_HEIGHT) * 0.18 * atten;

    color += vec3(specular(n,l,eye,60.0));

    return color;
}

// tracing
vec3 getNormal(vec3 p, float eps) {
    vec3 n;
    n.y = map_detailed(p);
    n.x = map_detailed(vec3(p.x+eps,p.y,p.z)) - n.y;
    n.z = map_detailed(vec3(p.x,p.y,p.z+eps)) - n.y;
    n.y = eps;
    return normalize(n);
}

float heightMapTracing(vec3 ori, vec3 dir, out vec3 p) {
    float tm = 0.0;
    float tx = 1000.0;
    float hx = map(ori + dir * tx);
    if(hx > 0.0) return tx;
    float hm = map(ori + dir * tm);
    float tmid = 0.0;
    for(int i = 0; i < NUM_STEPS; i++) {
        tmid = mix(tm,tx, hm/(hm-hx));
        p = ori + dir * tmid;
    	float hmid = map(p);
		if(hmid < 0.0) {
        	tx = tmid;
            hx = hmid;
        } else {
            tm = tmid;
            hm = hmid;
        }
    }
    return tmid;
}

vec3 getPixel(in vec2 coord, float time) {
    vec2 uv = coord / iResolution.xy;
    uv = uv * 2.0 - 1.0;
    uv.x *= iResolution.x / iResolution.y;

    // ray
    vec3 ang = vec3(sin(time*3.0)*0.1,sin(time)*0.2+0.3,time);
    vec3 ori = vec3(0.0,3.5,time*5.0);
    vec3 dir = normalize(vec3(uv.xy,-2.0)); dir.z += length(uv) * 0.14;
    dir = normalize(dir) * fromEuler(ang);

    // tracing
    vec3 p;
    heightMapTracing(ori,dir,p);
    vec3 dist = p - ori;
    vec3 n = getNormal(p, dot(dist,dist) * EPSILON_NRM);
    vec3 light = normalize(vec3(0.0,1.0,0.8));

    // color
    return mix(
        getSkyColor(dir),
        getSeaColor(p,n,light,dir,dist),
    	pow(smoothstep(0.0,-0.02,dir.y),0.2));
}

// main
void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    float time = iTime * 0.3 + texture(iChannel0, fragCoord.xy / iResolution.xy).x * 0.1;

#ifdef AA
    vec3 color = vec3(0.0);
    for(int i = -1; i <= 1; i++) {
        for(int j = -1; j <= 1; j++) {
        	vec2 uv = fragCoord+vec2(i,j)/3.0;
    		color += getPixel(uv, time);
        }
    }
    color /= 9.0;
#else
    vec3 color = getPixel(fragCoord, time);
#endif

    // Audio reactive brightness
    color *= (0.9 + iAudioLow * 0.3);

    // post
	fragColor = vec4(pow(color,vec3(0.65)), 1.0);
}`
    },

    // Trippy rotating raymarch
    trippy_swirl: {
        name: 'Trippy Swirl',
        description: 'Psychedelic rotating pattern',
        format: 'shadertoy',
        code: `void mainImage( out vec4 O, vec2 I )
{
    float i,d,s;
    vec3 p, r = vec3(iResolution.xy, 0);
    mat2 R = mat2(cos(iTime/2.+vec4(0,33,11,0)));

    for(O*=i; i++<1e2; O+=max(1.3*sin(vec4(3,2,1,1)+i*.3)/s,-length(p*p)))

        p = vec3((I+I - r.xy)/r.y*d*R, d-8.), p.xz*=R,
        d+=s=.012+.08*abs(max(sin(dot(p.yzx,p)/.7),length(p)-4.)-i/1e2);

    O=tanh(O*O/8e5);

    // Audio reactivity
    O *= (0.8 + iAudioMid * 0.4);
}`
    },

    // Volumetric fractal with hue shifting
    volumetric_fractal: {
        name: 'Volumetric Fractal',
        description: 'Complex 3D fractal with color shifting',
        format: 'shadertoy',
        code: `#define MAXDIST 50.

struct Ray {
    vec3 ro;
    vec3 rd;
};

// from netgrind
vec3 hue(vec3 color, float shift) {

    const vec3  kRGBToYPrime = vec3 (0.299, 0.587, 0.114);
    const vec3  kRGBToI     = vec3 (0.596, -0.275, -0.321);
    const vec3  kRGBToQ     = vec3 (0.212, -0.523, 0.311);

    const vec3  kYIQToR   = vec3 (1.0, 0.956, 0.621);
    const vec3  kYIQToG   = vec3 (1.0, -0.272, -0.647);
    const vec3  kYIQToB   = vec3 (1.0, -1.107, 1.704);

    float   YPrime  = dot (color, kRGBToYPrime);
    float   I      = dot (color, kRGBToI);
    float   Q      = dot (color, kRGBToQ);

    float   hue_val     = atan (Q, I);
    float   chroma  = sqrt (I * I + Q * Q);

    hue_val += shift;

    Q = chroma * sin (hue_val);
    I = chroma * cos (hue_val);

    vec3    yIQ   = vec3 (YPrime, I, Q);
    color.r = dot (yIQ, kYIQToR);
    color.g = dot (yIQ, kYIQToG);
    color.b = dot (yIQ, kYIQToB);

    return color;
}

float opU( float d1, float d2 )
{
    return min(d1,d2);
}

float smin( float a, float b, float k ){
    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
}

float length6( vec3 p )
{
    p = p*p*p; p = p*p;
    return pow( p.x + p.y + p.z, 1.0/6.0 );
}

float fPlane(vec3 p, vec3 n, float distanceFromOrigin) {
    return dot(p, n) + distanceFromOrigin;
}

void pR(inout vec2 p, float a) {
    p = cos(a)*p + sin(a)*vec2(p.y, -p.x);
}

float fractal(vec3 p)
{
    const int iterations = 12; // Reduced from 20 for better performance

    float d = iTime*5. - p.z;
       p=p.yxz;
    pR(p.yz, 1.570795);
    p.x += 6.5;

    p.yz = mod(abs(p.yz)-.0, 20.) - 10.;
    float scale = 1.25;

    p.xy /= (1.+d*d*0.0005);

    float l = 0.;

    for (int i=0; i<iterations; i++) {
        p.xy = abs(p.xy);
        p = p*scale + vec3(-3. + d*0.0095,-1.5,-.5);

        pR(p.xy,0.35-d*0.015);
        pR(p.yz,0.5+d*0.02);

        l =length6(p);
    }
    return l*pow(scale, -float(iterations))-.15;
}

vec2 map(vec3 pos)
{
    float dist = 10.;
    dist = opU(dist, fractal(pos));
    dist = smin(dist, fPlane(pos,vec3(0.0,1.0,0.0),10.), 4.6);
    return vec2(dist, 0.);
}

vec3 vmarch(Ray ray, float dist)
{
    vec3 p = ray.ro;
    vec2 r = vec2(0.);
    vec3 sum = vec3(0);
    vec3 c = hue(vec3(0.,0.,1.),5.5 + iAudioMid * 2.0);
    for( int i=0; i<12; i++ ) // Reduced from 20 for better performance
    {
        r = map(p);
        if (r.x > .01) break;
        p += ray.rd*.02; // Increased step size for faster traversal
        vec3 col = c;
        col.rgb *= smoothstep(.0,0.15,-r.x);
        sum += abs(col)*.5;
    }
    return sum;
}

vec2 march(Ray ray)
{
    const int steps = 35; // Reduced from 50 for better performance
    const float prec = 0.002; // Slightly increased tolerance
    vec2 res = vec2(0.);

    for (int i = 0; i < steps; i++)
    {
        vec2 s = map(ray.ro + ray.rd * res.x);

        if (res.x > MAXDIST || s.x < prec)
        {
            break;
        }

        res.x += s.x * 1.2; // Slightly larger steps
        res.y = s.y;

    }

    return res;
}

vec3 calcNormal(vec3 pos)
{
    const vec3 eps = vec3(0.005, 0.0, 0.0);

    return normalize(
        vec3(map(pos + eps).x - map(pos - eps).x,
             map(pos + eps.yxz).x - map(pos - eps.yxz).x,
             map(pos + eps.yzx).x - map(pos - eps.yzx).x )
    );
}

vec4 render(Ray ray)
{
    vec3 col = vec3(0.);
    vec2 res = march(ray);

    if (res.x > MAXDIST)
    {
        return vec4(col, 50.);
    }

    vec3 pos = ray.ro+res.x*ray.rd;
    ray.ro = pos;
       col = vmarch(ray, res.x);

    col = mix(col, vec3(0.), clamp(res.x/50., 0., 1.));
       return vec4(col, res.x);
}

mat3 camera(in vec3 ro, in vec3 rd, float rot)
{
    vec3 forward = normalize(rd - ro);
    vec3 worldUp = vec3(sin(rot), cos(rot), 0.0);
    vec3 x = normalize(cross(forward, worldUp));
    vec3 y = normalize(cross(x, forward));
    return mat3(x, y, forward);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord.xy / iResolution.xy;
    uv = uv * 2.0 - 1.0;
    uv.x *= iResolution.x / iResolution.y;
    uv.y -= uv.x*uv.x*0.15;
    vec3 camPos = vec3(3., -1.5, iTime*5.);
    vec3 camDir = camPos+vec3(-1.25,0.1, 1.);
    mat3 cam = camera(camPos, camDir, 0.);
    vec3 rayDir = cam * normalize( vec3(uv, .8));

    Ray ray;
    ray.ro = camPos;
    ray.rd = rayDir;

    vec4 col = render(ray);
    col.rgb *= (0.8 + iAudioLow * 0.4);

    fragColor = vec4(1.-col.xyz,clamp(1.-col.w/MAXDIST, 0., 1.));
}`
    },

    // Volumetric cloud raymarching (simplified version to avoid performance issues)
    volumetric_clouds: {
        name: 'Volumetric Clouds',
        description: 'Soft volumetric cloud rendering',
        format: 'shadertoy',
        code: `mat3 m = mat3( 0.00,  0.80,  0.60,
              -0.80,  0.36, -0.48,
              -0.60, -0.48,  0.64);

float hash(float n)
{
    return fract(sin(n) * 43758.5453);
}

float noise(in vec3 x)
{
    vec3 p = floor(x);
    vec3 f = fract(x);

    f = f * f * (3.0 - 2.0 * f);

    float n = p.x + p.y * 57.0 + 113.0 * p.z;

    float res = mix(mix(mix(hash(n +   0.0), hash(n +   1.0), f.x),
                        mix(hash(n +  57.0), hash(n +  58.0), f.x), f.y),
                    mix(mix(hash(n + 113.0), hash(n + 114.0), f.x),
                        mix(hash(n + 170.0), hash(n + 171.0), f.x), f.y), f.z);
    return res;
}

float fbm(vec3 p)
{
    float f;
    f  = 0.5000 * noise(p); p = m * p * 2.02;
    f += 0.2500 * noise(p); p = m * p * 2.03;
    f += 0.1250 * noise(p);
    return f;
}

float scene(in vec3 pos)
{
    return 0.1 - length(pos) * 0.05 + fbm(pos * 0.3);
}

mat3 camera(vec3 ro, vec3 ta)
{
    vec3 cw = normalize(ta - ro);
    vec3 cp = vec3(0.0, 1.0, 0.0);
    vec3 cu = cross(cw, cp);
    vec3 cv = cross(cu, cw);
    return mat3(cu, cv, cw);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = (fragCoord.xy * 2.0 - iResolution.xy) / min(iResolution.x, iResolution.y);

    vec2 mo = vec2(iTime * 0.1, cos(iTime * 0.25) * 3.0);

    float camDist = 25.0;
    vec3 ta = vec3(0.0, 1.0, 0.0);
    vec3 ro = camDist * normalize(vec3(cos(2.75 - 3.0 * mo.x), 0.7 - 1.0 * (mo.y - 1.0), sin(2.75 - 3.0 * mo.x)));

    float targetDepth = 1.3;
    mat3 c = camera(ro, ta);
    vec3 dir = c * normalize(vec3(uv, targetDepth));

    const int sampleCount = 32; // Reduced from 64 for performance
    float zMax = 40.0;
    float zstep = zMax / float(sampleCount);

    vec3 p = ro;
    float T = 1.0;
    float absorption = 100.0;
    vec4 color = vec4(0.0);

    for (int i = 0; i < sampleCount; i++)
    {
        float density = scene(p);

        if (density > 0.0)
        {
            float tmp = density / float(sampleCount);
            T *= 1.0 - (tmp * absorption);

            if (T <= 0.01)
            {
                break;
            }

            float opaity = 50.0;
            float k = opaity * tmp * T;
            vec4 cloudColor = vec4(1.0);
            vec4 col1 = cloudColor * k;

            color += col1;
        }

        p += dir * zstep;
    }

    vec3 bg = mix(vec3(0.3, 0.1, 0.8), vec3(0.7, 0.7, 1.0), 1.0 - (uv.y + 1.0) * 0.5);
    color.rgb += bg;

    // Audio reactivity
    color.rgb *= (0.85 + iAudioLow * 0.3);

    fragColor = color;
}`
    },

    // Mandelbulb 3D fractal
    mandelbulb: {
        name: 'Mandelbulb',
        description: '3D Mandelbrot set fractal',
        format: 'shadertoy',
        code: `float stime, ctime;
void ry(inout vec3 p, float a){
    float c,s;vec3 q=p;
    c = cos(a); s = sin(a);
    p.x = c * q.x + s * q.z;
    p.z = -s * q.x + c * q.z;
}

float pixel_size = 0.0;

vec3 mb(vec3 p) {
    p.xyz = p.xzy;
    vec3 z = p;
    vec3 dz=vec3(0.0);
    float power = 8.0;
    float r, theta, phi;
    float dr = 1.0;

    float t0 = 1.0;
    for(int i = 0; i < 7; ++i) {
        r = length(z);
        if(r > 2.0) continue;
        theta = atan(z.y / z.x);
        phi = asin(z.z / r);

        dr = pow(r, power - 1.0) * dr * power + 1.0;

        r = pow(r, power);
        theta = theta * power;
        phi = phi * power;

        z = r * vec3(cos(theta)*cos(phi), sin(theta)*cos(phi), sin(phi)) + p;

        t0 = min(t0, r);
    }
    return vec3(0.5 * log(r) * r / dr, t0, 0.0);
}

vec3 f(vec3 p){
    ry(p, iTime*0.2);
    return mb(p);
}

float softshadow(vec3 ro, vec3 rd, float k ){
    float akuma=1.0,h=0.0;
    float t = 0.01;
    for(int i=0; i < 30; ++i){ // Reduced from 50 for better performance
        h=f(ro+rd*t).x;
        if(h<0.001)return 0.02;
        akuma=min(akuma, k*h/t);
        t+=clamp(h,0.02,2.5); // Slightly larger step sizes
    }
    return akuma;
}

vec3 nor( in vec3 pos )
{
    vec3 eps = vec3(0.002,0.0,0.0); // Slightly larger epsilon for faster calculation
    return normalize( vec3(
           f(pos+eps.xyy).x - f(pos-eps.xyy).x,
           f(pos+eps.yxy).x - f(pos-eps.yxy).x,
           f(pos+eps.yyx).x - f(pos-eps.yyx).x ) );
}

vec3 intersect( in vec3 ro, in vec3 rd )
{
    float t = 1.0;
    float res_t = 0.0;
    float res_d = 1000.0;
    vec3 c, res_c;
    float max_error = 1000.0;
    float d = 1.0;
    float pd = 100.0;
    float os = 0.0;
    float step = 0.0;
    float error = 1000.0;

    for( int i=0; i<32; i++ ) // Reduced from 48 for better performance
    {
        if( error < pixel_size*0.7 || t > 20.0 ) // Slightly relaxed error tolerance
        {
        }
        else{
            c = f(ro + rd*t);
            d = c.x;

            if(d > os)
            {
                os = 0.45 * d*d/pd; // Slightly larger overstep
                step = d + os;
                pd = d;
            }
            else
            {
                step =-os; os = 0.0; pd = 100.0; d = 1.0;
            }

            error = d / t;

            if(error < max_error)
            {
                max_error = error;
                res_t = t;
                res_c = c;
            }

            t += step;
        }
    }
    if( t>20.0 ) res_t=-1.0;
    return vec3(res_t, res_c.y, res_c.z);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 q=fragCoord.xy/iResolution.xy;
    vec2 uv = -1.0 + 2.0*q;
    uv.x*=iResolution.x/iResolution.y;

    pixel_size = 1.0/(iResolution.x * 3.0);

    stime=0.7+0.3*sin(iTime*0.4);
    ctime=0.7+0.3*cos(iTime*0.4);

    vec3 ta=vec3(0.0,0.0,0.0);
    vec3 ro = vec3(0.0, 3.*stime*ctime, 3.*(1.-stime*ctime));

    vec3 cf = normalize(ta-ro);
    vec3 cs = normalize(cross(cf,vec3(0.0,1.0,0.0)));
    vec3 cu = normalize(cross(cs,cf));
    vec3 rd = normalize(uv.x*cs + uv.y*cu + 3.0*cf);

    vec3 sundir = normalize(vec3(0.1, 0.8, 0.6));
    vec3 sun = vec3(1.64, 1.27, 0.99);
    vec3 skycolor = vec3(0.6, 1.5, 1.0);

    vec3 bg = exp(uv.y-2.0)*vec3(0.4, 1.6, 1.0);

    float halo=clamp(dot(normalize(vec3(-ro.x, -ro.y, -ro.z)), rd), 0.0, 1.0);
    vec3 col=bg+vec3(1.0,0.8,0.4)*pow(halo,17.0);

    vec3 res = intersect(ro, rd);
    if(res.x > 0.0){
       vec3 p = ro + res.x * rd;
       vec3 n=nor(p);
       float shadow = softshadow(p, sundir, 10.0 );

       float dif = max(0.0, dot(n, sundir));
       float sky = 0.6 + 0.4 * max(0.0, dot(n, vec3(0.0, 1.0, 0.0)));
       float bac = max(0.3 + 0.7 * dot(vec3(-sundir.x, -1.0, -sundir.z), n), 0.0);
       float spe = max(0.0, pow(clamp(dot(sundir, reflect(rd, n)), 0.0, 1.0), 10.0));

       vec3 lin = 4.5 * sun * dif * shadow;
       lin += 0.8 * bac * sun;
       lin += 0.6 * sky * skycolor*shadow;
       lin += 3.0 * spe * shadow;

       res.y = pow(clamp(res.y, 0.0, 1.0), 0.55);
       vec3 tc0 = 0.5 + 0.5 * sin(3.0 + 4.2 * res.y + vec3(0.0, 0.5, 1.0));
       col = lin *vec3(0.9, 0.8, 0.6) *  0.2 * tc0;
       col=mix(col,bg, 1.0-exp(-0.001*res.x*res.x));
    }

    // Audio reactivity
    col *= (0.8 + iAudioHigh * 0.4);

    // post
    col=pow(clamp(col,0.0,1.0),vec3(0.45));
    col=col*0.6+0.4*col*col*(3.0-2.0*col);
    col=mix(col, vec3(dot(col, vec3(0.33))), -0.5);
    col*=0.5+0.5*pow(16.0*q.x*q.y*(1.0-q.x)*(1.0-q.y),0.7);
    fragColor = vec4(col.xyz, smoothstep(0.55, .76, 1.-res.x/5.));
}`
    },

    // Mondrian-style geometric pattern
    mondrian_art: {
        name: 'Mondrian Art',
        description: 'Dynamic geometric art with audio-reactive colors',
        format: 'shadertoy',
        code: `// Mondrian-style pattern with audio reactivity
#define HOLES
#define BUMP_MAP
#define DIST_TYPE 0
#define TAU 6.28318530718

// Helper functions
float hash21(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float distLineS(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h);
}

float lineIntersect(vec2 ro, vec2 rd, vec2 p0, vec2 p1) {
    vec2 v1 = ro - p0;
    vec2 v2 = p1 - p0;
    vec2 v3 = vec2(-rd.y, rd.x);
    float t = dot(v2, v3);
    if(abs(t) < 0.001) return -1.0;
    return dot(cross(vec3(v2, 0), vec3(v1, 0)), vec3(0, 0, 1)) / t;
}

float sdPoly(vec2 p, vec2[16] v, int num) {
    float d = dot(p - v[0], p - v[0]);
    float s = 1.0;
    for(int i = 0, j = num - 1; i < num; j = i, i++) {
        vec2 e = v[j] - v[i];
        vec2 w = p - v[i];
        vec2 b = w - e * clamp(dot(w, e) / dot(e, e), 0.0, 1.0);
        d = min(d, dot(b, b));
        bvec3 c = bvec3(p.y >= v[i].y, p.y < v[j].y, e.x * w.y > e.y * w.x);
        if(all(c) || all(not(c))) s *= -1.0;
    }
    return s * sqrt(d);
}

float sBox(vec2 p, vec2 b) {
    vec2 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

// Global scale with audio reactivity
vec2 gSc = vec2(1.0) / 5.0;
vec2 cntr;
float cir;
int polyID;
int pID;

mat4x2 vID = mat4x2(vec2(-0.5, -0.5), vec2(-0.5, 0.5), vec2(0.5, 0.5), vec2(0.5, -0.5));
mat4x2 eID = mat4x2(vec2(-0.5, 0), vec2(0, 0.5), vec2(0.5, 0), vec2(0, -0.5));
vec2 vP[16];

mat4x2 getEdges(vec2 ip) {
    const float rF = 0.95;
    vec2 eR = vec2(0, 0.5 * rF);
    mat4x2 eM;

    for(int i = 0; i < 4; i++) {
        vec2 edID = ip + eID[i];
        float rndI = mod(dot(edID, vec2(41, 53)), 4.0) / 4.0;
        float rndD = hash21(edID + 0.06) < 0.5 ? -1.0 : 1.0;
        rndI = sin(TAU * rndI * rndD + iTime * fract(rndD * 77.77 + 0.5)) * 0.5 + 0.5;
        eM[i] = eID[i] * gSc - rndI * rndD * gSc * rF * eR;
        eR = eR.yx;
    }

    return eM;
}

vec4 distField(vec2 p) {
    vec2 ip = floor(p / gSc);
    p -= (ip + 0.5) * gSc;
    vec2 svIP = ip;

    mat4x2 eM = getEdges(ip);
    vec2 minE = min(vec2(eM[1].x, eM[0].y), vec2(eM[3].x, eM[2].y));
    vec2 maxE = max(vec2(eM[1].x, eM[0].y), vec2(eM[3].x, eM[2].y));
    mat4x2 p4 = mat4x2(minE, vec2(minE.x, maxE.y), maxE, vec2(maxE.x, minE.y));

    vec2 rDim = (vec2(maxE.x - minE.x, maxE.y - minE.y));
    vec2 rP = mix(minE, maxE, 0.5);
    vec2 ap = abs(p - rP) - rDim / 2.0;
    float cPoly = max(ap.x, ap.y);

    float d;

    if(cPoly < 0.0) {
        d = cPoly;
        polyID = 4;
        pID = 4;
        vP[0] = p4[0]; vP[1] = p4[1]; vP[2] = p4[2]; vP[3] = p4[3];
        cntr = rP;
    } else {
        d = -cPoly;
        vec4 ln;
        for(int i = 0; i < 4; i++) {
            ln[i] = distLineS(p, eM[i], eM[i] - eID[i]);
        }

        ln = max(ln, -ln.wxyz);
        for(int i = 0; i < 4; i++) {
            if(ln[i] < 0.0) {
                polyID = i;
                break;
            }
        }

        int i = polyID;
        vec2 ro = eM[i];
        vec2 rd = -normalize(eID[i]);
        float t = lineIntersect(ro, rd, eM[(i + 3) % 4], eM[(i + 3) % 4] - eID[(i + 3) % 4] * 8.0);
        vec2 p0 = ro + rd * t;

        mat4x2 eMD = getEdges(ip + vID[i] * 2.0);
        int k = (i + 1) % 4;
        ro = eMD[k];
        rd = -normalize(eID[k]);
        t = lineIntersect(ro, rd, eMD[(k + 1) % 4], eMD[(k + 1) % 4] - eID[(k + 1) % 4] * 8.0);
        vec2 p1 = ro + rd * t + vID[i] * 2.0 * gSc;
        cntr = mix(p0, p1, 0.5);

        d = max(d, ln[i]);
        vec2 q = p - p1;
        vec2 ln2 = q * sign(vID[i]);
        d = max(d, max(ln2.x, ln2.y));

        #if DIST_TYPE == 0
        vP[0] = p0;
        vP[1] = vec2(p0.x, p1.y);
        vP[2] = p1;
        vP[3] = vec2(p1.x, p0.y);
        if(i % 2 == 1) {
            vec2 tmp = vP[1]; vP[1] = vP[3]; vP[3] = tmp;
        }
        #endif

        pID = 4;
        ip += vID[i];
    }

    #if DIST_TYPE == 0
    d = sdPoly(p, vP, pID);
    #endif

    cir = length(p - cntr);

    #ifdef HOLES
    if(hash21(ip + 0.23) < 0.4 && gSc.x > 1.0 / 5.0 - 0.001) {
        d = abs(d + 0.09 * gSc.x) - 0.09 * gSc.x;
        d = max(d, -abs(d + 0.0125) - 0.01);
        cir = 1e5;
    }
    #endif

    float lN = 80.0;
    float pat = abs(fract(d * lN + 0.5) - 0.5) / lN;
    d = mix(d * 1.055, d * 0.9, smoothstep(0.0, 0.02, pat));

    return vec4(d, ip, float(polyID));
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - iResolution.xy * 0.5) / iResolution.y;

    // Audio-reactive scale and movement
    gSc = vec2(1.0) / (5.0 - iAudioLow * 2.0);
    vec2 p = uv - vec2(0, iTime / 12.0 + iAudioMid * 0.5);

    // Background layer
    #ifdef HOLES
    gSc /= 1.5;
    vec4 d4B = distField(p + 0.5 - vec2(iTime / 12.0, 0));
    gSc *= 1.5;

    float dB = d4B.x;
    vec2 idB = d4B.yz;
    float rndB = hash21(idB + 0.1);
    vec3 rColB = 0.5 + 0.45 * cos(TAU * rndB / 3.5 + vec3(0, 1, 2) * 1.5 - 0.3 + iAudioHigh);
    float grB = dot(rColB, vec3(0.299, 0.587, 0.114));
    vec3 pColB = polyID == 4 ? vec3(grB * 0.5 + 0.5) * vec3(0.97, 1, 1.03) : rColB.zyx * 1.2;
    #endif

    // Main layer
    #ifdef BUMP_MAP
    vec2 ld = normalize(vec2(-2.5, -1));
    vec4 d4Hi = distField(p - ld * 0.003);
    #endif

    vec4 d4 = distField(p);
    float d = d4.x;
    vec2 id = d4.yz;

    float sf = 1.0 / iResolution.y;
    float shF = iResolution.y / 450.0;
    float ew = 0.006;

    vec3 col = vec3(0.25);

    #ifdef HOLES
    col = mix(col, vec3(0), 1.0 - smoothstep(0.0, sf * shF * 16.0, dB));
    col = mix(col, vec3(0), 1.0 - smoothstep(0.0, sf, dB));
    col = mix(col, pColB, 1.0 - smoothstep(0.0, sf, dB + ew * 0.8));
    #endif

    // Audio-reactive colors
    float rnd = hash21(id + 0.1);
    vec3 rCol = 0.5 + 0.45 * cos(TAU * rnd / 3.5 + vec3(0, 1, 2) * 1.5 - 0.3 + iAudioMid * 2.0);
    float gr = dot(rCol, vec3(0.299, 0.587, 0.114));
    vec3 pCol = polyID < 4 ? vec3(gr * 0.5 + 0.5) * vec3(0.97, 1, 1.03) : rCol * 1.2;

    #ifdef BUMP_MAP
    float b = max(0.5 + (d4Hi.x - d) / 0.003, 0.0);
    float b2 = max(0.5 + (max(d4Hi.x, -0.0125) - max(d, -0.0125)) / 0.003, 0.0);
    pCol *= 0.5 + b * b * 0.5 + b2 * b2 * 0.5;
    #else
    pCol *= 1.1;
    #endif

    // Audio-reactive brightness pulsing
    pCol *= (0.9 + iAudioHigh * 0.4);

    col = mix(col, col * 0.4, 1.0 - smoothstep(0.0, sf * shF * 24.0, d));
    col = mix(col, vec3(0), 1.0 - smoothstep(0.0, sf, d - ew / 2.0));
    col = mix(col, pCol, 1.0 - smoothstep(0.0, sf, d + ew));

    // Vignette
    uv = fragCoord / iResolution.xy;
    col *= pow(16.0 * uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y), 1.0 / 16.0);

    fragColor = vec4(sqrt(max(col, 0.0)), 0.95);
}`
    },

    // Perlin noise field with rotation
    perlin_field: {
        name: 'Perlin Field',
        description: 'Rotating Perlin noise field with audio reactivity',
        format: 'shadertoy',
        code: `#define R iResolution
#define T (iTime/3.+5.)

void mainImage( out vec4 k, vec2 p )
{
    #define rot(p,a) vec2 sc=sin(vec2(a,a+1.6)); p*=mat2(sc.y,-sc.x,sc);

    #define A vec3(0,1,157)
    #define B {vec2 m=fract(p),l=dot(p-m,A.yz)+A.xz,r=mix(fract(57.*sin(l++)),fract(57.*sin(l)),(m*=m*(3.-m-m)).x);k+=mix(r.x,r.y,m.y)/(s+=s);p*=mat2(1,1,1,-1);}

    // Audio-reactive scaling and translation
    p *= log(T + iAudioLow * 0.5)/R.y;
    p.x += T + iAudioMid * 0.3;

    // Audio-reactive rotation
    rot(p, T/22. + iAudioHigh * 0.5);

    float s = 1.; k = vec4(0);
    B B B B // unrolled perlin noise

    // Audio-reactive color transform
    k += sin(2.*sin(k*22.+T*2.+iAudioMid*3.)+p.yxyy-p.yyxy*.5)/12.;

    // Brightness modulation
    k *= (0.85 + iAudioHigh * 0.3);
}`
    },

    // Flower mandala animation
    flower_mandala: {
        name: 'Flower Mandala',
        description: 'Animated flower mandalas with audio-reactive colors',
        format: 'shadertoy',
        code: `#define C_PI 3.14159265359

vec3 hash13(float p)
{
   vec3 p3 = fract(vec3(p) * vec3(.1031, .1030, .0973));
   p3 += dot(p3, p3.yzx+33.33);
   return fract((p3.xxy+p3.yzz)*p3.zyx);
}

vec3 flower(vec2 p, float t, float id){
    vec3 r = hash13(id+floor(t)*13.);

    float lT = fract(-t);
    float ilT = 1.-lT;

    lT*=lT;

    float fade = sin(lT*C_PI);
    fade = smoothstep(0.0,0.1,fade);
    fade*=fract(t);

    // Audio-reactive position jitter
    p+=vec2(r.xy-0.5)*pow(lT,.25) + vec2(iAudioHigh * 0.1);

    // Audio-reactive scale
    p*=lT*(5. + iAudioLow * 2.);

    float l = length(p);
    float m = smoothstep(.4,0.,l);

    float a = atan(p.y,p.x);

    // Audio-reactive rotation
    a = sin(a*r.x*1.23  + iTime*0.123 + iAudioMid) *
        sin(a*r.y*2.321 + iTime*0.456 + iAudioMid) *
        sin(a*r.z*1.123 + iTime*0.589 + iAudioMid) *
        sin(a);

    l = mix(l,a*(r.x-0.5)*3.*ilT,r.z*0.5+0.2);

    float s1  = smoothstep(.5,0.,l);
    float s2  = smoothstep(0.01,0.,l);
    float s = (s1-s2)*m;

    // Audio-reactive colors
    vec3 c1 =  vec3(sin(s *vec3(0.987,0.765,0.543)*C_PI*1.4 + iAudioHigh));
    vec3 c2 =  vec3(sin(s2*vec3(0.13*r.x,0.865*r.y,0.943*r.z)*6.664 + iAudioMid));

    vec3 sOut = (c1*mix(c2,vec3(1.),r.y*0.5+0.5)*c1)*fade;

    return sOut*l;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = (fragCoord*2.-iResolution.xy)/iResolution.y;

    vec3 s = vec3(0.);

    // Audio-reactive layer count
    const float amount = 20.;
    float del = 1./amount;

    for(float i = 1.; i <= amount; i++){
        // Audio-reactive animation speed
        s+=flower(uv, iTime*0.05 + del*i + iAudioLow * 0.02, i);
    }

    // Audio-reactive brightness boost
    fragColor = vec4(pow(s*(3. + iAudioHigh * 1.5), vec3(0.4545)), 0.95);
}`
    },

    // Voronoi hexagonal cells with lighting
    voronoi_hex: {
        name: 'Voronoi Hex',
        description: 'Hexagonal Voronoi cells with dual lighting and audio reactivity',
        format: 'shadertoy',
        code: `// Base code from shane
const float _threshold = 0.0;
const vec3 _cellColor = vec3(0.2,0.6,0.7);
const float _zoom = 1.0;

float objID;
vec2 cellID;

mat2 r2(in float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

float smin2(float a, float b, float r)
{
   float f = max(0., 1. - abs(b - a)/r);
   return min(a, b) - r*.25*f*f;
}

vec2 hash22H(vec2 p)
{
    float n = sin(dot(p, vec2(41, 289)));
    p = fract(vec2(262144, 32768)*n);
    return sin( p*6.2831853 + iTime + iAudioMid )*.3660254 + .5;
}

vec2 pixToHex(vec2 p)
{
    return floor(vec2(p.x + .57735*p.y, 1.1547*p.y));
}

vec2 hexPt(vec2 p)
{
    return vec2(p.x - p.y*.5, .866025*p.y) + (hash22H(p) - .5)*.866025/2.;
}

vec3 Voronoi(vec2 p)
{
    vec2 pH = pixToHex(p);
    const vec2 hp[7] = vec2[7](vec2(-1), vec2(0, -1), vec2(-1, 0), vec2(0), vec2(1), vec2(1, 0), vec2(0, 1));
    vec2 minCellID = vec2(0);
    vec2 mo, o;
    float md = 8., lMd = 8., lMd2 = 8., lnDist, d;
    for (int i=0; i<7; i++)
    {
        vec2 h = hexPt(pH + hp[i]) - p;
        d = dot(h, h);
        if( d<md )
        {
            md = d;
            mo = h;
            minCellID = hp[i];
        }
    }

    // Audio-reactive roundness
    float r = mix(0.0, 0.4, sin(iTime * 0.5 + iAudioLow * 2.0)*0.5+0.5);

    for (int i=0; i<7; i++)
    {
        vec2 h = hexPt(pH + hp[i] + minCellID) - p - mo;
        if(dot(h, h)>.00001){
            lnDist = dot(mo + h*.5, normalize(h));
            lMd = smin2(lMd, lnDist, (lnDist*.5 + .5)*r);
            lMd2 = min(lMd2, lnDist);
            cellID = vec2(lMd);
        }
    }

    float t = iTime * 5.;
    d = lMd * 25.;
    mo -= vec2(cos(d + t),sin(d + t)) / d;
    lMd2 = length(mo);

    return max(vec3(lMd, lMd2, md), 0.);
}

float bumpFunc(vec2 p)
{
    vec3 v = Voronoi(p);
    float c = v.x;
    float ew = _threshold;
    if(c<ew)
    {
        objID = 1.;
        c = abs(c - ew)/ew;
        c = smoothstep(0., .25, c)/4. + clamp(-cos(c*6.283*1.5) - .5, 0., 1.);
    }
    else
    {
        objID = 0.;
        c = mix(v.x,  v.y, .75);
        c = (c - ew)/(1. - ew);
        c = clamp(c + cos(c*6.283*24.)*.002, 0., 1.);
    }
    return c;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    cellID = vec2(0);
    vec2 uv = (fragCoord - iResolution.xy*.5)/min(iResolution.y, 800.) * _zoom;
    vec2 aspect = vec2(iResolution.y/iResolution.x, 1);
    uv *= 1. + dot(uv*aspect, uv*aspect)*.05;
    vec3 r = normalize(vec3(uv.xy, 1.));

    // Audio-reactive movement
    vec2 p = uv*3.5 + vec2(0, iTime*.5 + iAudioLow * 0.3);

    float c = bumpFunc(p);
    float svObjID = objID;
    vec3 sp = vec3(p, 0.);

    // Audio-reactive light positions
    vec3 lp = sp + vec3(-1.3*sin(iTime/2. + iAudioMid), .8*cos(iTime/2.), -.5);
    vec3 lp2 = sp + vec3(1.3*sin(iTime/2. + iAudioMid), -.8*cos(iTime/2.), -.5);

    sp.z -= c*.1;
    vec2 e = vec2(8./iResolution.y, 0);
    float bf = .4;
    if (svObjID>.5) { e.x = 2./iResolution.y; }
    float fx = (bumpFunc(p - e) - bumpFunc(p + e));
    float fy = (bumpFunc(p - e.yx) - bumpFunc(p + e.yx));
    vec3 n = normalize(vec3(fx, fy, -e.x/bf));
    float edge = abs(c*2. - fx) + abs(c*2. - fy);

    vec3 oCol = vec3(0.5);
    if(svObjID>.5)
    {
        oCol *= 1.-_cellColor;
    }
    else
    {
        oCol *= _cellColor;
    }

    // Audio-reactive color modulation
    oCol.xy *= cellID * (10. + iAudioHigh * 5.);

    float lDist = length(lp - sp);
    float atten = 1./(1. + lDist*lDist*.5);
    vec3 l = (lp - sp)/max(lDist, .001);
    float diff = max(max(dot(l, n), 0.), 0.);
    float spec = pow(max(dot(reflect(l, n), r), 0.), 64.);

    float lDist2 = length(lp2 - sp);
    float atten2 = 1./(1. + lDist2*lDist2*.5);
    vec3 l2 = (lp2 - sp)/max(lDist2, .001);
    float diff2 = max(max(dot(l2, n), 0.), 0.);
    float spec2 = pow(max(dot(reflect(l2, n), r), 0.), 64.);

    diff = pow(diff, 4.)*2.;
    diff2 = pow(diff2, 4.)*2.;

    // Audio-reactive lighting colors
    vec3 col = oCol*(diff*vec3(.5 + iAudioHigh * 0.3, .7, 1) + .25 + vec3(.25, .5, 1)*spec*32.)*atten*.5;
    col += oCol*(diff2*vec3(1, .7 + iAudioMid * 0.3, .5) + .25 + vec3(1, .3, .1)*spec2*32.)*atten2*.5;

    if(svObjID>.5)
    {
        col *= edge;
    }
    else
    {
        col /= edge;
    }

    vec2 u = fragCoord/iResolution.xy;
    col *= pow(16.*u.x*u.y*(1. - u.x)*(1. - u.y) , .125);

    // Audio-reactive brightness
    col *= (0.9 + iAudioHigh * 0.3);

    fragColor = vec4(sqrt(max(col, 0.)), 0.95);
}`
    },

    cosmic_nebula: {
        name: 'Cosmic Nebula',
        description: '3D volumetric nebula with raymarching and audio reactivity',
        format: 'shadertoy',
        code: `// 3D Simplex Noise (by Inigo Quilez)
vec3 hash( vec3 p ) {
    p = vec3( dot(p,vec3(127.1,311.7, 74.7)),
              dot(p,vec3(269.5,183.3,246.1)),
              dot(p,vec3(113.5,271.9,124.6)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float noise( in vec3 p ) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    float n = dot(i, vec3(1.0, 57.0, 113.0));
    vec3 u = f*f*(3.0-2.0*f);
    return mix(
        mix(
            mix( dot( hash(i+vec3(0,0,0)), f-vec3(0,0,0) ),
                  dot( hash(i+vec3(1,0,0)), f-vec3(1,0,0) ), u.x),
            mix( dot( hash(i+vec3(0,1,0)), f-vec3(0,1,0) ),
                  dot( hash(i+vec3(1,1,0)), f-vec3(1,1,0) ), u.x), u.y),
        mix(
            mix( dot( hash(i+vec3(0,0,1)), f-vec3(0,0,1) ),
                  dot( hash(i+vec3(1,0,1)), f-vec3(1,0,1) ), u.x),
            mix( dot( hash(i+vec3(0,1,1)), f-vec3(0,1,1) ),
                  dot( hash(i+vec3(1,1,1)), f-vec3(1,1,1) ), u.x), u.y), u.z );
}

float fbm(vec3 p) {
    float f = 0.0;
    mat3 m = mat3( 0.00,  0.80,  0.60,
                  -0.80,  0.36, -0.48,
                  -0.60, -0.48,  0.64 );
    float a = 0.5;
    // Reduced from 6 to 4 octaves for better performance
    for (int i = 0; i < 4; i++) {
        f += a * noise(p);
        p = m * p * 2.0;
        a *= 0.5;
    }
    return f;
}

float map(vec3 p) {
    float universe_sdf = length(p) - 4.0;
    vec3 q = p * 0.8;
    q.z += iTime * 0.1;
    q = q + 0.5 * sin(q.yzx * 2.0 + iTime * 0.3);
    q = q + 0.25 * sin(q.zxy * 4.0 + iTime * 0.5);

    // Audio-reactive density
    float density = fbm(q) * (1.0 + iAudioMid * 0.3);
    float density_shape = density - 0.2;
    return max(universe_sdf, density_shape);
}

vec3 render(vec3 ro, vec3 rd) {
    float t = 1.0;
    vec3 col = vec3(0.0);
    float alpha = 0.0;
    // Reduced from 90 to 50 steps for much better performance
    const int steps = 50;
    float step_size = 10.0 / float(steps);

    for (int i = 0; i < steps; i++) {
        vec3 p = ro + rd * t;
        float density = map(p);

        if (density < 0.0) {
            float d = abs(density);

            // Audio-reactive colors
            vec3 color = 0.5 + 0.5 * cos(vec3(0.5, 0.2, 0.8) * 5.0 + d * 8.0 + p.z * 2.0 + iAudioLow);
            color *= vec3(1.2, 0.8 + iAudioHigh * 0.4, 0.6);

            float a = (0.1 * d) * (1.0 - alpha);
            col += color * a;
            alpha += a;
        }

        t += step_size;
        // Early exit optimization
        if (alpha > 0.98 || length(p) > 5.0) break;
    }

    return col;
}

void setupCamera(vec2 uv, vec2 mouse, out vec3 ro, out vec3 rd) {
    float phi = (mouse.x / iResolution.x - 0.5) * -6.28 + iTime * 0.1;
    float theta = (mouse.y / iResolution.y - 0.5) * 3.14;

    if (iMouse.z < 0.1) {
        theta = 0.6;
        phi = iTime * 0.1;
    }

    float dist = 3.5;
    ro = vec3(
        dist * sin(theta) * cos(phi),
        dist * cos(theta),
        dist * sin(theta) * sin(phi)
    );

    vec3 target = vec3(0.0, 0.0, 0.0);
    vec3 f = normalize(target - ro);
    vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
    vec3 u = cross(f, r);
    rd = normalize(f + uv.x * r + uv.y * u);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    vec2 uv = (2.0 * fragCoord.xy - iResolution.xy) / iResolution.y;
    vec2 mouse = iMouse.xy;
    vec3 ro, rd;
    setupCamera(uv, mouse, ro, rd);
    vec3 col = render(ro, rd);

    // Audio-reactive brightness boost
    col *= (0.9 + iAudioHigh * 0.4);

    fragColor = vec4(pow(col, vec3(0.4545)), 1.0);
}`
    }
};
