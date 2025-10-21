/**
 * ShaderToyLite - A lightweight ShaderToy-compatible renderer
 * Supports mainImage() format with iTime, iResolution, and custom uniforms
 */

class ShaderToyLite {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl2', {
            alpha: true,
            premultipliedAlpha: false,
            antialias: true
        });

        if (!this.gl) {
            throw new Error('WebGL2 not supported');
        }

        this.buffers = {};
        this.currentShader = null;
        this.startTime = Date.now();
        this.frame = 0;
        this.uniforms = {};
        this.mouseX = 0;
        this.mouseY = 0;

        // Texture channels (iChannel0-3)
        this.channels = [null, null, null, null];

        this.setupQuad();
        this.createDefaultTextures();
    }

    setupQuad() {
        const gl = this.gl;

        // Full-screen quad
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

    /**
     * Create default procedural noise textures for iChannel0-3
     */
    createDefaultTextures() {
        const gl = this.gl;

        // Create 4 default noise textures
        for (let i = 0; i < 4; i++) {
            this.channels[i] = this.createNoiseTexture(256, 256, i);
        }
    }

    /**
     * Generate procedural noise texture
     */
    createNoiseTexture(width, height, seed = 0) {
        const gl = this.gl;
        const texture = gl.createTexture();

        // Generate noise data
        const size = width * height * 4;
        const data = new Uint8Array(size);

        for (let i = 0; i < size; i += 4) {
            const noise = this.seededRandom(i + seed * 10000);
            data[i] = noise * 255;     // R
            data[i + 1] = noise * 255; // G
            data[i + 2] = noise * 255; // B
            data[i + 3] = 255;         // A
        }

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);

        // Set texture parameters for noise
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.generateMipmap(gl.TEXTURE_2D);

        return texture;
    }

    /**
     * Simple seeded random for noise generation
     */
    seededRandom(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }

    /**
     * Set a custom texture for a channel (0-3)
     */
    setChannelTexture(channelIndex, imageOrCanvas) {
        if (channelIndex < 0 || channelIndex > 3) return;

        const gl = this.gl;
        const texture = gl.createTexture();

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageOrCanvas);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        this.channels[channelIndex] = texture;
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

    createProgram(vertexSource, fragmentSource) {
        const gl = this.gl;

        const vertexShader = this.compileShader(vertexSource, gl.VERTEX_SHADER);
        const fragmentShader = this.compileShader(fragmentSource, gl.FRAGMENT_SHADER);

        if (!vertexShader || !fragmentShader) {
            return null;
        }

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

    /**
     * Load a ShaderToy-style fragment shader with mainImage()
     */
    loadShader(fragmentCode) {
        const vertexSource = `#version 300 es
            in vec2 a_position;
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `;

        // Wrap ShaderToy-style code with proper WebGL2 wrapper
        const fragmentSource = `#version 300 es
            precision highp float;

            uniform vec2 iResolution;
            uniform float iTime;
            uniform vec4 iMouse;
            uniform float iAudioLow;
            uniform float iAudioMid;
            uniform float iAudioHigh;
            uniform sampler2D iChannel0;
            uniform sampler2D iChannel1;
            uniform sampler2D iChannel2;
            uniform sampler2D iChannel3;

            out vec4 fragColor;

            ${fragmentCode}

            void main() {
                mainImage(fragColor, gl_FragCoord.xy);
            }
        `;

        const program = this.createProgram(vertexSource, fragmentSource);

        if (!program) {
            console.error('Failed to create shader program');
            return false;
        }

        this.currentShader = {
            program: program,
            attributes: {
                position: this.gl.getAttribLocation(program, 'a_position')
            },
            uniforms: {
                iResolution: this.gl.getUniformLocation(program, 'iResolution'),
                iTime: this.gl.getUniformLocation(program, 'iTime'),
                iMouse: this.gl.getUniformLocation(program, 'iMouse'),
                iAudioLow: this.gl.getUniformLocation(program, 'iAudioLow'),
                iAudioMid: this.gl.getUniformLocation(program, 'iAudioMid'),
                iAudioHigh: this.gl.getUniformLocation(program, 'iAudioHigh'),
                iChannel0: this.gl.getUniformLocation(program, 'iChannel0'),
                iChannel1: this.gl.getUniformLocation(program, 'iChannel1'),
                iChannel2: this.gl.getUniformLocation(program, 'iChannel2'),
                iChannel3: this.gl.getUniformLocation(program, 'iChannel3')
            }
        };

        return true;
    }

    setUniforms(uniforms) {
        this.uniforms = { ...this.uniforms, ...uniforms };
    }

    render() {
        if (!this.currentShader) return;

        const gl = this.gl;
        const shader = this.currentShader;

        // Clear
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Use program
        gl.useProgram(shader.program);

        // Bind quad
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
        gl.enableVertexAttribArray(shader.attributes.position);
        gl.vertexAttribPointer(shader.attributes.position, 2, gl.FLOAT, false, 0, 0);

        // Set uniforms
        const time = (Date.now() - this.startTime) / 1000.0;
        gl.uniform2f(shader.uniforms.iResolution, this.canvas.width, this.canvas.height);
        gl.uniform1f(shader.uniforms.iTime, time);
        gl.uniform4f(shader.uniforms.iMouse, this.mouseX, this.mouseY, 0, 0);

        // Audio uniforms
        gl.uniform1f(shader.uniforms.iAudioLow, this.uniforms.audioLow || 0.0);
        gl.uniform1f(shader.uniforms.iAudioMid, this.uniforms.audioMid || 0.0);
        gl.uniform1f(shader.uniforms.iAudioHigh, this.uniforms.audioHigh || 0.0);

        // Bind texture channels
        for (let i = 0; i < 4; i++) {
            if (this.channels[i]) {
                gl.activeTexture(gl.TEXTURE0 + i);
                gl.bindTexture(gl.TEXTURE_2D, this.channels[i]);
                gl.uniform1i(shader.uniforms[`iChannel${i}`], i);
            }
        }

        // Draw
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        this.frame++;
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.gl.viewport(0, 0, width, height);
    }

    setMouse(x, y) {
        this.mouseX = x;
        this.mouseY = y;
    }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShaderToyLite;
}
