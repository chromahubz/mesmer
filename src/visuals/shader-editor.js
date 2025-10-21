/**
 * Shader Editor Controller
 * Handles live shader editing, compilation, and preset loading
 */

class ShaderEditor {
    constructor(mainShader, toyRenderer) {
        this.mainShader = mainShader;
        this.toyRenderer = toyRenderer;

        this.currentFormat = 'glsl'; // 'glsl' or 'shadertoy'
        this.currentTarget = 'main'; // 'main' or 'toy'

        this.initUI();
    }

    initUI() {
        // Toggle editor (left-side)
        const toggleBtn = document.getElementById('toggleEditorLeft');
        const editorPanel = document.getElementById('shaderEditorLeft');
        if (toggleBtn && editorPanel) {
            toggleBtn.addEventListener('click', () => {
                editorPanel.classList.toggle('collapsed');
            });
        }

        // Format toggle
        const formatGLSL = document.getElementById('formatGLSL');
        const formatShaderToy = document.getElementById('formatShaderToy');

        formatGLSL.addEventListener('click', () => {
            this.currentFormat = 'glsl';
            formatGLSL.classList.add('active');
            formatShaderToy.classList.remove('active');
            this.updatePlaceholder();
        });

        formatShaderToy.addEventListener('click', () => {
            this.currentFormat = 'shadertoy';
            formatShaderToy.classList.add('active');
            formatGLSL.classList.remove('active');
            this.updatePlaceholder();
        });

        // Target layer
        const targetLayer = document.getElementById('targetLayer');
        targetLayer.addEventListener('change', (e) => {
            this.currentTarget = e.target.value;
        });

        // Compile button
        const compileBtn = document.getElementById('compileBtn');
        compileBtn.addEventListener('click', () => this.compile());

        // Load preset button
        const loadPresetBtn = document.getElementById('loadPresetBtn');
        loadPresetBtn.addEventListener('click', () => this.showPresets());

        // Clear button
        const clearBtn = document.getElementById('clearBtn');
        clearBtn.addEventListener('click', () => this.clear());

        // Copy button
        const copyBtn = document.getElementById('copyCodeBtn');
        copyBtn.addEventListener('click', () => this.copyCode());

        // Paste button
        const pasteBtn = document.getElementById('pasteCodeBtn');
        pasteBtn.addEventListener('click', () => this.pasteCode());

        // Preset modal
        const closeModal = document.getElementById('closePresetModal');
        closeModal.addEventListener('click', () => this.hidePresets());

        // Line numbers
        const shaderCode = document.getElementById('shaderCode');
        shaderCode.addEventListener('input', () => this.updateLineNumbers());
        shaderCode.addEventListener('scroll', () => this.syncLineNumbers());

        this.updateLineNumbers();
        this.updatePlaceholder();
    }

    updatePlaceholder() {
        const textarea = document.getElementById('shaderCode');
        if (this.currentFormat === 'glsl') {
            textarea.placeholder = `// GLSL Fragment Shader
// Available uniforms:
// uniform vec2 u_resolution;
// uniform float u_time;
// uniform float u_audioLow;
// uniform float u_audioMid;
// uniform float u_audioHigh;

#version 300 es
precision highp float;

out vec4 fragColor;

void main() {
    fragColor = vec4(1.0, 0.0, 1.0, 1.0);
}`;
        } else {
            textarea.placeholder = `// ShaderToy Format
// Available uniforms:
// vec2 iResolution;
// float iTime;
// float iAudioLow;
// float iAudioMid;
// float iAudioHigh;

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    fragColor = vec4(uv, 0.5, 1.0);
}`;
        }
    }

    updateLineNumbers() {
        const textarea = document.getElementById('shaderCode');
        const lineNumbers = document.getElementById('lineNumbers');
        const lines = textarea.value.split('\n').length;

        let numbersHTML = '';
        for (let i = 1; i <= Math.max(lines, 20); i++) {
            numbersHTML += i + '\n';
        }
        lineNumbers.textContent = numbersHTML;
    }

    syncLineNumbers() {
        const textarea = document.getElementById('shaderCode');
        const lineNumbers = document.getElementById('lineNumbers');
        lineNumbers.scrollTop = textarea.scrollTop;
    }

    compile() {
        const code = document.getElementById('shaderCode').value.trim();

        if (!code) {
            this.setStatus('Please enter shader code', 'error');
            return;
        }

        this.setStatus('Compiling...', '');

        try {
            if (this.currentTarget === 'main') {
                // Compile for main layer (GLSL format required)
                if (this.currentFormat !== 'glsl') {
                    this.setStatus('Main layer requires GLSL format', 'error');
                    return;
                }
                this.compileMainShader(code);
            } else {
                // Compile for toy layer (ShaderToy format)
                if (this.currentFormat !== 'shadertoy') {
                    this.setStatus('Toy layer requires ShaderToy format', 'error');
                    return;
                }
                this.compileToyShader(code);
            }

            this.setStatus('✓ Compiled successfully!', 'success');
        } catch (error) {
            this.setStatus(`✗ Compilation error: ${error.message}`, 'error');
            console.error('Shader compilation error:', error);
        }
    }

    compileMainShader(fragmentCode) {
        // Create new shader object
        const vertexCode = `#version 300 es
            in vec2 a_position;
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `;

        const gl = this.mainShader.gl;

        // Compile shaders
        const vertexShader = this.mainShader.compileShader(vertexCode, gl.VERTEX_SHADER);
        const fragmentShader = this.mainShader.compileShader(fragmentCode, gl.FRAGMENT_SHADER);

        if (!vertexShader || !fragmentShader) {
            throw new Error('Shader compilation failed - check console for details');
        }

        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error(gl.getProgramInfoLog(program));
        }

        // Add as new shader to main shader engine
        this.mainShader.shaders.push({
            name: 'Custom Shader',
            vertex: vertexCode,
            fragment: fragmentCode,
            program: program
        });

        // Switch to the new shader
        const newIndex = this.mainShader.shaders.length - 1;
        this.mainShader.setShader(newIndex);

        // Update dropdown
        const select = document.getElementById('mainShaderSelect');
        const option = document.createElement('option');
        option.value = newIndex;
        option.textContent = `Custom #${newIndex - 2}`;
        select.appendChild(option);
        select.value = newIndex;
    }

    compileToyShader(fragmentCode) {
        // Load directly into toy renderer
        const success = this.toyRenderer.toyEngine.loadShader(fragmentCode);

        if (!success) {
            throw new Error('Shader compilation failed - check console for details');
        }

        // Update dropdown
        this.toyRenderer.shaders.push({
            name: 'Custom Shader',
            code: fragmentCode
        });

        const newIndex = this.toyRenderer.shaders.length - 1;
        const select = document.getElementById('toyShaderSelect');
        const option = document.createElement('option');
        option.value = newIndex;
        option.textContent = `Custom #${newIndex - 2}`;
        select.appendChild(option);
        select.value = newIndex;
    }

    showPresets() {
        const modal = document.getElementById('presetModal');
        const grid = document.getElementById('presetGrid');

        // Clear grid
        grid.innerHTML = '';

        // Get presets based on current format
        const presets = this.currentFormat === 'glsl'
            ? ShaderPresets.glsl
            : ShaderPresets.shadertoy;

        // Create preset cards
        presets.forEach((preset, index) => {
            const card = document.createElement('div');
            card.className = 'preset-card';
            card.innerHTML = `
                <h4>${preset.name}</h4>
                <p>${preset.description}</p>
                <span class="preset-tag">${preset.format.toUpperCase()}</span>
            `;
            card.addEventListener('click', () => {
                this.loadPreset(preset);
                this.hidePresets();
            });
            grid.appendChild(card);
        });

        modal.style.display = 'flex';
    }

    hidePresets() {
        const modal = document.getElementById('presetModal');
        modal.style.display = 'none';
    }

    loadPreset(preset) {
        const textarea = document.getElementById('shaderCode');
        textarea.value = preset.code;

        // Set format
        if (preset.format === 'glsl') {
            this.currentFormat = 'glsl';
            document.getElementById('formatGLSL').classList.add('active');
            document.getElementById('formatShaderToy').classList.remove('active');
        } else {
            this.currentFormat = 'shadertoy';
            document.getElementById('formatShaderToy').classList.add('active');
            document.getElementById('formatGLSL').classList.remove('active');
        }

        // Set target
        const targetLayer = document.getElementById('targetLayer');
        targetLayer.value = preset.format === 'glsl' ? 'main' : 'toy';
        this.currentTarget = targetLayer.value;

        this.updateLineNumbers();
        this.setStatus(`Loaded preset: ${preset.name}`, 'success');
    }

    clear() {
        document.getElementById('shaderCode').value = '';
        this.updateLineNumbers();
        this.setStatus('Editor cleared', '');
    }

    setStatus(message, type) {
        const status = document.querySelector('.status-text');
        status.textContent = message;
        status.className = 'status-text';
        if (type) {
            status.classList.add(type);
        }
    }

    async copyCode() {
        const code = document.getElementById('shaderCode').value;
        if (!code) {
            this.setStatus('No code to copy', 'error');
            return;
        }

        try {
            await navigator.clipboard.writeText(code);
            this.setStatus('✓ Code copied to clipboard!', 'success');
        } catch (error) {
            this.setStatus('✗ Failed to copy', 'error');
            console.error('Copy failed:', error);
        }
    }

    async pasteCode() {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                document.getElementById('shaderCode').value = text;
                this.updateLineNumbers();
                this.setStatus('✓ Code pasted from clipboard!', 'success');
            }
        } catch (error) {
            this.setStatus('✗ Failed to paste (allow clipboard access)', 'error');
            console.error('Paste failed:', error);
        }
    }
}
