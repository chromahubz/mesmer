/**
 * ShaderToy Layer Renderer
 * Manages ShaderToy-compatible shaders for the secondary visual layer
 */

class ToyRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.toyEngine = new ShaderToyLite(canvas);
        this.shaders = [];
        this.currentShaderIndex = 22; // Star Field

        // Color controls
        this.colorHue = 0.0;
        this.colorSaturation = 1.0;
        this.colorBrightness = 1.0;

        this.initShaders();
        this.loadShader(22); // Star Field
    }

    initShaders() {
        // Shader 0: Audio Waves
        this.shaders.push({
            name: 'Audio Waves',
            code: `
                void mainImage(out vec4 fragColor, in vec2 fragCoord) {
                    vec2 uv = fragCoord / iResolution.xy;
                    vec2 p = (2.0 * fragCoord - iResolution.xy) / iResolution.y;

                    float audio = (iAudioLow + iAudioMid + iAudioHigh) / 3.0;

                    // Create flowing wave lines
                    vec3 col = vec3(0.0);
                    for (float i = 0.0; i < 5.0; i++) {
                        float offset = i * 0.2;
                        float y = sin(p.x * 3.0 + iTime * 2.0 + offset + audio * 2.0) * 0.3;
                        y += sin(p.x * 5.0 - iTime * 1.5 + offset) * 0.1 * (1.0 + iAudioHigh);

                        float wave = smoothstep(0.02, 0.0, abs(p.y - y));

                        vec3 waveColor = vec3(
                            0.5 + 0.5 * sin(iTime + offset + iAudioLow * 3.0),
                            0.5 + 0.5 * cos(iTime * 0.7 + offset + iAudioMid * 2.0),
                            0.7 + 0.3 * sin(iTime * 0.5 + offset + iAudioHigh * 2.5)
                        );

                        col += wave * waveColor * (0.8 + audio * 0.5);
                    }

                    fragColor = vec4(col, 0.7);
                }
            `
        });

        // Shader 1: Particle Storm
        this.shaders.push({
            name: 'Particle Storm',
            code: `
                float hash(vec2 p) {
                    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
                }

                void mainImage(out vec4 fragColor, in vec2 fragCoord) {
                    vec2 uv = fragCoord / iResolution.xy;
                    vec2 p = (2.0 * fragCoord - iResolution.xy) / iResolution.y;

                    vec3 col = vec3(0.0);

                    // Generate particles
                    float layers = 20.0;
                    for (float i = 0.0; i < layers; i++) {
                        vec2 id = floor(p * 3.0 + i * 0.5);
                        vec2 offset = vec2(
                            hash(id + i),
                            hash(id + i + 100.0)
                        ) - 0.5;

                        offset.x += sin(iTime * 2.0 + i * 0.5 + iAudioLow * 3.0) * 0.5;
                        offset.y += cos(iTime * 1.5 + i * 0.7 + iAudioMid * 2.0) * 0.5;

                        vec2 particlePos = fract(p * 3.0 + offset + iTime * 0.3 * (1.0 + iAudioHigh));

                        float d = length(particlePos - 0.5);
                        float size = 0.02 + 0.03 * hash(id + i * 10.0);
                        size *= (1.0 + (iAudioLow + iAudioMid + iAudioHigh) * 0.3);

                        float particle = smoothstep(size, 0.0, d);

                        vec3 particleColor = vec3(
                            0.5 + 0.5 * sin(i * 0.5 + iAudioLow * 2.0),
                            0.5 + 0.5 * cos(i * 0.3 + iAudioMid * 2.0),
                            0.7 + 0.3 * sin(i * 0.7 + iAudioHigh * 2.0)
                        );

                        col += particle * particleColor;
                    }

                    fragColor = vec4(col * 0.8, 0.6);
                }
            `
        });

        // Shader 2: Kaleidoscope
        this.shaders.push({
            name: 'Kaleidoscope',
            code: `
                vec2 kaleidoscope(vec2 p, float segments) {
                    float a = atan(p.y, p.x);
                    float r = length(p);

                    float segAngle = 6.28318 / segments;
                    a = mod(a, segAngle);

                    if (mod(floor(atan(p.y, p.x) / segAngle), 2.0) == 0.0) {
                        a = segAngle - a;
                    }

                    return vec2(cos(a), sin(a)) * r;
                }

                void mainImage(out vec4 fragColor, in vec2 fragCoord) {
                    vec2 uv = fragCoord / iResolution.xy;
                    vec2 p = (2.0 * fragCoord - iResolution.xy) / iResolution.y;

                    float segments = 6.0 + floor(iAudioMid * 8.0);
                    vec2 kp = kaleidoscope(p, segments);

                    // Animated pattern
                    float t = iTime * 0.5;
                    vec3 col = vec3(0.0);

                    for (float i = 0.0; i < 3.0; i++) {
                        vec2 q = kp;
                        q.x += sin(t + i * 2.0 + iAudioLow * 2.0) * 0.5;
                        q.y += cos(t * 0.7 + i * 1.5 + iAudioHigh * 1.5) * 0.5;

                        float d = length(q);
                        float pattern = sin(d * 10.0 - t * 2.0 + i);

                        vec3 layerCol = vec3(
                            0.5 + 0.5 * sin(i + iAudioLow * 2.0),
                            0.5 + 0.5 * cos(i * 1.5 + iAudioMid * 2.0),
                            0.7 + 0.3 * sin(i * 2.0 + iAudioHigh * 2.0)
                        );

                        col += layerCol * pattern * (0.3 + (iAudioLow + iAudioMid + iAudioHigh) * 0.2);
                    }

                    col = abs(col);
                    fragColor = vec4(col, 0.75);
                }
            `
        });

        // Add presets from shader library
        if (typeof ShaderPresets !== 'undefined') {
            ShaderPresets.shadertoy.forEach(preset => {
                this.shaders.push({
                    name: preset.name,
                    code: preset.code
                });
            });
        }

        // Add OSMOS shaders
        if (typeof OsmosShaders !== 'undefined') {
            for (let key in OsmosShaders) {
                const shader = OsmosShaders[key];
                if (shader.format === 'shadertoy') {
                    this.shaders.push({
                        name: shader.name,
                        code: shader.code
                    });
                }
            }
        }

        // Add TRON shaders
        if (typeof TronShaders !== 'undefined') {
            for (let key in TronShaders) {
                const shader = TronShaders[key];
                if (shader.format === 'shadertoy') {
                    this.shaders.push({
                        name: shader.name,
                        code: shader.code
                    });
                }
            }
        }

        // Add ShaderToy imports
        if (typeof ShaderToyImports !== 'undefined') {
            for (let key in ShaderToyImports) {
                const shader = ShaderToyImports[key];
                if (shader.format === 'shadertoy') {
                    this.shaders.push({
                        name: shader.name,
                        code: shader.code
                    });
                }
            }
        }
    }

    loadShader(index) {
        if (index >= 0 && index < this.shaders.length) {
            this.currentShaderIndex = index;
            const shader = this.shaders[index];
            this.toyEngine.loadShader(shader.code);
        }
    }

    render(audioData = {}) {
        this.toyEngine.setUniforms({
            audioLow: audioData.low || 0.0,
            audioMid: audioData.mid || 0.0,
            audioHigh: audioData.high || 0.0,
            colorHue: this.colorHue,
            colorSaturation: this.colorSaturation,
            colorBrightness: this.colorBrightness
        });

        this.toyEngine.render();
    }

    setColorHue(value) {
        this.colorHue = value;
    }

    setColorSaturation(value) {
        this.colorSaturation = value;
    }

    setColorBrightness(value) {
        this.colorBrightness = value;
    }

    resize(width, height) {
        this.toyEngine.resize(width, height);
    }

    setShader(index) {
        this.loadShader(index);
    }
}
