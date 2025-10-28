/**
 * Main GLSL Shader Engine
 * Handles raymarching, SDF, and organic motion shaders
 */

class MainShader {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl2', { alpha: false, antialias: true });

        if (!this.gl) {
            throw new Error('WebGL2 not supported');
        }

        this.shaders = [];
        this.currentShaderIndex = 5; // Default to Liquid Metal
        this.startTime = Date.now();

        // Color controls
        this.colorHue = 0.0;        // 0.0 to 1.0 (hue shift)
        this.colorSaturation = 1.0; // 0.0 to 1.0
        this.colorBrightness = 1.0; // 0.0 to 2.0

        this.initShaders();
        this.setupQuad();
    }

    setupQuad() {
        const gl = this.gl;
        const vertices = new Float32Array([
            -1, -1,
             1, -1,
            -1,  1,
             1,  1
        ]);

        this.quadBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    }

    initShaders() {
        // Shader 0: Organic Raymarcher
        this.shaders.push({
            name: 'Organic Raymarcher',
            vertex: this.getVertexShader(),
            fragment: this.getOrganicRaymarcherShader()
        });

        // Shader 1: Fractal Tunnel
        this.shaders.push({
            name: 'Fractal Tunnel',
            vertex: this.getVertexShader(),
            fragment: this.getFractalTunnelShader()
        });

        // Shader 2: Plasma Field
        this.shaders.push({
            name: 'Plasma Field',
            vertex: this.getVertexShader(),
            fragment: this.getPlasmaFieldShader()
        });

        // Add presets from shader library WITH COLOR FILTER
        if (typeof ShaderPresets !== 'undefined') {
            ShaderPresets.glsl.forEach(preset => {
                this.shaders.push({
                    name: preset.name,
                    vertex: this.getVertexShader(),
                    fragment: this.injectColorFilter(preset.code)
                });
            });
        }

        // Add OSMOS shaders WITH COLOR FILTER
        if (typeof OsmosShaders !== 'undefined') {
            for (let key in OsmosShaders) {
                const shader = OsmosShaders[key];
                if (shader.format === 'glsl') {
                    this.shaders.push({
                        name: shader.name,
                        vertex: this.getVertexShader(),
                        fragment: this.injectColorFilter(shader.code)
                    });
                }
            }
        }

        // Add TRON shaders WITH COLOR FILTER
        if (typeof TronShaders !== 'undefined') {
            for (let key in TronShaders) {
                const shader = TronShaders[key];
                if (shader.format === 'glsl') {
                    this.shaders.push({
                        name: shader.name,
                        vertex: this.getVertexShader(),
                        fragment: this.injectColorFilter(shader.code)
                    });
                }
            }
        }

        // Compile all shaders
        console.log('🔧 Compiling shaders with color filter support...');
        this.shaders.forEach((shader, index) => {
            shader.program = this.createProgram(shader.vertex, shader.fragment);
            if (shader.program) {
                console.log(`✓ Compiled shader ${index}: ${shader.name}`);
            } else {
                console.error(`❌ Failed to compile shader ${index}: ${shader.name}`);
            }
        });
    }

    // Inject color filter code into any shader
    injectColorFilter(shaderCode) {
        // Add color uniforms after version and precision
        const colorUniforms = `
uniform float u_colorHue;
uniform float u_colorSaturation;
uniform float u_colorBrightness;

// HSB color transformation helpers
vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec3 applyColorFilter(vec3 color) {
    vec3 hsv = rgb2hsv(color);
    hsv.x = fract(hsv.x + u_colorHue);
    hsv.y *= u_colorSaturation;
    hsv.z *= u_colorBrightness;
    return hsv2rgb(hsv);
}
`;

        // Find where to inject (after precision statement, before first uniform/function)
        let modifiedCode = shaderCode;

        // Find the position after "precision" statement
        const precisionMatch = modifiedCode.match(/(precision\s+\w+\s+float\s*;)/);
        if (precisionMatch) {
            const insertPos = precisionMatch.index + precisionMatch[0].length;
            modifiedCode = modifiedCode.slice(0, insertPos) + '\n' + colorUniforms + '\n' + modifiedCode.slice(insertPos);
        }

        // Now find all fragColor assignments and wrap them with color filter
        // Match patterns like: fragColor = vec4(xxx, 1.0);
        modifiedCode = modifiedCode.replace(
            /fragColor\s*=\s*vec4\(([^,]+),\s*([^)]+)\)\s*;/g,
            'fragColor = vec4(applyColorFilter($1), $2);'
        );

        return modifiedCode;
    }

    getVertexShader() {
        return `#version 300 es
            in vec2 a_position;
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `;
    }

    getOrganicRaymarcherShader() {
        return `#version 300 es
            precision highp float;

            uniform vec2 u_resolution;
            uniform float u_time;
            uniform float u_audioLow;
            uniform float u_audioMid;
            uniform float u_audioHigh;
            uniform float u_colorHue;
            uniform float u_colorSaturation;
            uniform float u_colorBrightness;

            out vec4 fragColor;

            // HSB color transformation helpers
            vec3 rgb2hsv(vec3 c) {
                vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
                vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
                vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
                float d = q.x - min(q.w, q.y);
                float e = 1.0e-10;
                return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
            }

            vec3 hsv2rgb(vec3 c) {
                vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
                vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
                return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
            }

            // Apply color filters (hue, saturation, brightness)
            vec3 applyColorFilter(vec3 color) {
                vec3 hsv = rgb2hsv(color);
                hsv.x = fract(hsv.x + u_colorHue); // Hue shift
                hsv.y *= u_colorSaturation;         // Saturation
                hsv.z *= u_colorBrightness;         // Brightness
                return hsv2rgb(hsv);
            }

            // Smooth minimum for blending SDFs
            float smin(float a, float b, float k) {
                float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
                return mix(b, a, h) - k * h * (1.0 - h);
            }

            // SDF for sphere
            float sdSphere(vec3 p, float r) {
                return length(p) - r;
            }

            // SDF for box
            float sdBox(vec3 p, vec3 b) {
                vec3 d = abs(p) - b;
                return min(max(d.x, max(d.y, d.z)), 0.0) + length(max(d, 0.0));
            }

            // Organic distortion function
            vec3 distort(vec3 p) {
                float bass = u_audioLow * 2.0;
                float t = u_time * 0.5;

                p.x += sin(p.y * 2.0 + t) * 0.2 * (1.0 + bass);
                p.y += sin(p.z * 2.0 + t * 0.8) * 0.2 * (1.0 + u_audioMid);
                p.z += sin(p.x * 2.0 + t * 1.2) * 0.2 * (1.0 + u_audioHigh);

                return p;
            }

            // Scene SDF
            float map(vec3 p) {
                vec3 pd = distort(p);

                // Multiple morphing spheres
                float sphere1 = sdSphere(pd - vec3(sin(u_time * 0.7) * 1.5, 0.0, 0.0), 0.8 + u_audioLow * 0.5);
                float sphere2 = sdSphere(pd - vec3(0.0, cos(u_time * 0.5) * 1.5, 0.0), 0.7 + u_audioMid * 0.4);
                float sphere3 = sdSphere(pd - vec3(cos(u_time * 0.9) * 1.2, sin(u_time * 0.6) * 1.2, 0.0), 0.6 + u_audioHigh * 0.3);

                // Blend spheres
                float d = smin(sphere1, sphere2, 0.8);
                d = smin(d, sphere3, 0.6);

                return d;
            }

            // Calculate normal
            vec3 calcNormal(vec3 p) {
                vec2 e = vec2(0.001, 0.0);
                return normalize(vec3(
                    map(p + e.xyy) - map(p - e.xyy),
                    map(p + e.yxy) - map(p - e.yxy),
                    map(p + e.yyx) - map(p - e.yyx)
                ));
            }

            void main() {
                vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;

                // Camera setup
                vec3 ro = vec3(0.0, 0.0, 3.0 + sin(u_time * 0.3) * 0.5);
                vec3 rd = normalize(vec3(uv, -1.5));

                // Raymarching
                float t = 0.0;
                vec3 col = vec3(0.0);

                for (int i = 0; i < 80; i++) {
                    vec3 p = ro + rd * t;
                    float d = map(p);

                    if (d < 0.001) {
                        // Hit - calculate lighting
                        vec3 n = calcNormal(p);
                        vec3 lightPos = vec3(2.0, 2.0, 3.0);
                        vec3 lightDir = normalize(lightPos - p);

                        float diff = max(dot(n, lightDir), 0.0);
                        float spec = pow(max(dot(reflect(-lightDir, n), -rd), 0.0), 32.0);

                        // Audio-reactive colors
                        vec3 baseColor = vec3(
                            0.5 + 0.5 * sin(u_time + u_audioLow * 3.14),
                            0.5 + 0.5 * cos(u_time * 0.7 + u_audioMid * 3.14),
                            0.5 + 0.5 * sin(u_time * 0.5 + u_audioHigh * 3.14)
                        );

                        col = baseColor * diff + vec3(1.0) * spec * 0.5;
                        col += baseColor * 0.2; // Ambient

                        break;
                    }

                    if (t > 20.0) break;

                    t += d;
                }

                // Glow effect
                float glow = 0.02 / (0.01 + t * 0.1);
                col += vec3(0.4, 0.2, 0.8) * glow * (u_audioLow + u_audioMid + u_audioHigh);

                // Apply color filters
                col = applyColorFilter(col);

                fragColor = vec4(col, 1.0);
            }
        `;
    }

    getFractalTunnelShader() {
        return `#version 300 es
            precision highp float;

            uniform vec2 u_resolution;
            uniform float u_time;
            uniform float u_audioLow;
            uniform float u_audioMid;
            uniform float u_audioHigh;
            uniform float u_colorHue;
            uniform float u_colorSaturation;
            uniform float u_colorBrightness;

            out vec4 fragColor;

            // HSB color transformation helpers
            vec3 rgb2hsv(vec3 c) {
                vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
                vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
                vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
                float d = q.x - min(q.w, q.y);
                float e = 1.0e-10;
                return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
            }

            vec3 hsv2rgb(vec3 c) {
                vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
                vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
                return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
            }

            vec3 applyColorFilter(vec3 color) {
                vec3 hsv = rgb2hsv(color);
                hsv.x = fract(hsv.x + u_colorHue);
                hsv.y *= u_colorSaturation;
                hsv.z *= u_colorBrightness;
                return hsv2rgb(hsv);
            }

            void main() {
                vec2 uv = gl_FragCoord.xy / u_resolution;
                vec2 p = (2.0 * gl_FragCoord.xy - u_resolution) / u_resolution.y;

                float a = atan(p.y, p.x);
                float r = length(p);

                // Tunnel effect
                float z = u_time * 0.5 + u_audioLow * 2.0;
                float tunnel = mod(1.0 / r + z, 1.0);

                // Fractal rotation
                float rotation = a + u_time * 0.3;
                float segments = 8.0 + floor(u_audioMid * 8.0);
                float pattern = abs(sin(rotation * segments + z * 3.0));

                // Combine
                vec3 col = vec3(
                    tunnel * pattern * (1.0 + u_audioHigh),
                    tunnel * (1.0 - pattern) * (1.0 + u_audioMid),
                    (1.0 - tunnel) * pattern * (1.0 + u_audioLow)
                );

                // Brightness boost
                col *= 1.5;
                col = pow(col, vec3(0.8));

                // Apply color filters
                col = applyColorFilter(col);

                fragColor = vec4(col, 1.0);
            }
        `;
    }

    getPlasmaFieldShader() {
        return `#version 300 es
            precision highp float;

            uniform vec2 u_resolution;
            uniform float u_time;
            uniform float u_audioLow;
            uniform float u_audioMid;
            uniform float u_audioHigh;
            uniform float u_colorHue;
            uniform float u_colorSaturation;
            uniform float u_colorBrightness;

            out vec4 fragColor;

            // HSB color transformation helpers
            vec3 rgb2hsv(vec3 c) {
                vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
                vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
                vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
                float d = q.x - min(q.w, q.y);
                float e = 1.0e-10;
                return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
            }

            vec3 hsv2rgb(vec3 c) {
                vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
                vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
                return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
            }

            vec3 applyColorFilter(vec3 color) {
                vec3 hsv = rgb2hsv(color);
                hsv.x = fract(hsv.x + u_colorHue);
                hsv.y *= u_colorSaturation;
                hsv.z *= u_colorBrightness;
                return hsv2rgb(hsv);
            }

            void main() {
                vec2 uv = gl_FragCoord.xy / u_resolution;
                vec2 p = (2.0 * gl_FragCoord.xy - u_resolution) / u_resolution.y;

                float t = u_time * 0.5;

                // Multi-layered plasma
                float c = 0.0;
                c += sin(p.x * 10.0 + t + u_audioLow * 3.0);
                c += sin(p.y * 10.0 + t * 0.7 + u_audioMid * 2.0);
                c += sin((p.x + p.y) * 8.0 + t * 1.3 + u_audioHigh * 2.5);
                c += sin(length(p) * 15.0 - t * 2.0 + (u_audioLow + u_audioMid) * 1.5);

                c = c / 4.0;

                // Color mapping
                vec3 col = vec3(
                    0.5 + 0.5 * sin(c * 3.14159 + 0.0 + u_audioLow),
                    0.5 + 0.5 * sin(c * 3.14159 + 2.0 + u_audioMid),
                    0.5 + 0.5 * sin(c * 3.14159 + 4.0 + u_audioHigh)
                );

                // Add some shimmer
                float shimmer = sin(t * 3.0 + c * 10.0) * 0.1;
                col += shimmer;

                // Apply color filters
                col = applyColorFilter(col);

                fragColor = vec4(col, 1.0);
            }
        `;
    }

    createProgram(vertexSource, fragmentSource) {
        const gl = this.gl;

        const vertexShader = this.compileShader(vertexSource, gl.VERTEX_SHADER);
        const fragmentShader = this.compileShader(fragmentSource, gl.FRAGMENT_SHADER);

        if (!vertexShader || !fragmentShader) return null;

        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Program link error:', gl.getProgramInfoLog(program));
            return null;
        }

        return program;
    }

    compileShader(source, type) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    setShader(index) {
        if (index >= 0 && index < this.shaders.length) {
            this.currentShaderIndex = index;
        }
    }

    render(audioData = {}) {
        const shader = this.shaders[this.currentShaderIndex];
        if (!shader || !shader.program) return;

        const gl = this.gl;
        const program = shader.program;

        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(program);

        // Bind quad
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
        const positionLoc = gl.getAttribLocation(program, 'a_position');
        gl.enableVertexAttribArray(positionLoc);
        gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

        // Set uniforms
        const time = (Date.now() - this.startTime) / 1000.0;
        gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), this.canvas.width, this.canvas.height);
        gl.uniform1f(gl.getUniformLocation(program, 'u_time'), time);
        gl.uniform1f(gl.getUniformLocation(program, 'u_audioLow'), audioData.low || 0.0);
        gl.uniform1f(gl.getUniformLocation(program, 'u_audioMid'), audioData.mid || 0.0);
        gl.uniform1f(gl.getUniformLocation(program, 'u_audioHigh'), audioData.high || 0.0);

        // Color controls
        gl.uniform1f(gl.getUniformLocation(program, 'u_colorHue'), this.colorHue);
        gl.uniform1f(gl.getUniformLocation(program, 'u_colorSaturation'), this.colorSaturation);
        gl.uniform1f(gl.getUniformLocation(program, 'u_colorBrightness'), this.colorBrightness);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    setColorHue(value) {
        this.colorHue = value;
        console.log('🎨 Color Hue set to:', value);
    }

    setColorSaturation(value) {
        this.colorSaturation = value;
        console.log('🎨 Color Saturation set to:', value);
    }

    setColorBrightness(value) {
        this.colorBrightness = value;
        console.log('🎨 Color Brightness set to:', value);
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
    }
}
