/**
 * Mesmer - Main Application
 * Orchestrates audio, visuals, and UI
 */

class Mesmer {
    constructor() {
        // Canvas elements
        this.mainCanvas = document.getElementById('mainCanvas');
        this.toyCanvas = document.getElementById('toyCanvas');
        this.waveformCanvas = document.getElementById('waveformCanvas');

        // Visual engines
        this.mainShader = null;
        this.toyRenderer = null;
        this.shaderEditor = null;

        // Audio engines
        this.audioEngine = null;
        this.musicEngine = null;

        // State
        this.isPlaying = false;
        this.mainLayerEnabled = true;
        this.toyLayerEnabled = true;

        // FPS tracking
        this.fps = 60;
        this.frameCount = 0;
        this.lastFpsUpdate = Date.now();

        this.init();
    }

    async init() {
        console.log('🚀 Initializing Mesmer...');
        if (window.DEBUG) DEBUG.info('Initializing Mesmer...');

        try {
            // Initialize visual engines
            console.log('📊 Creating main shader engine...');
            if (window.DEBUG) DEBUG.info('Creating main shader...');
            this.mainShader = new MainShader(this.mainCanvas);
            console.log('✓ Main shader created with', this.mainShader.shaders.length, 'shaders');
            if (window.DEBUG) DEBUG.success(`Main shader OK (${this.mainShader.shaders.length} shaders)`);

            console.log('📊 Creating toy renderer...');
            if (window.DEBUG) DEBUG.info('Creating toy renderer...');
            this.toyRenderer = new ToyRenderer(this.toyCanvas);
            console.log('✓ Toy renderer created with', this.toyRenderer.shaders.length, 'shaders');
            if (window.DEBUG) DEBUG.success(`Toy renderer OK (${this.toyRenderer.shaders.length} shaders)`);

            // Initialize shader editor
            console.log('💻 Initializing shader editor...');
            if (window.DEBUG) DEBUG.info('Initializing editor...');
            this.shaderEditor = new ShaderEditor(this.mainShader, this.toyRenderer);
            console.log('✓ Shader editor initialized');
            if (window.DEBUG) DEBUG.success('Shader editor OK');

            // Initialize audio engines (but DON'T start AudioContext yet)
            console.log('🎧 Setting up audio engine...');
            if (window.DEBUG) DEBUG.info('Setting up audio...');
            this.audioEngine = new AudioEngine();
            await this.audioEngine.init();
            console.log('✓ Audio engine ready');
            if (window.DEBUG) DEBUG.success('Audio engine ready');

            console.log('🎵 Setting up music engine...');
            if (window.DEBUG) DEBUG.info('Setting up music...');
            this.musicEngine = new GenerativeMusic();
            await this.musicEngine.init();
            console.log('✓ Music engine ready');
            if (window.DEBUG) DEBUG.success('Music engine ready');

            // Connect audio for analysis
            this.connectAudio();

            // Setup UI
            this.setupUI();

            // Setup resize handler
            this.setupResize();
            this.resize();

            // Start render loop
            console.log('🎬 Starting render loop...');
            if (window.DEBUG) DEBUG.info('Starting render loop...');
            this.render();

            console.log('✅ Mesmer initialized successfully!');
            console.log('📌 Ready to play! Click the Play button to start.');
            if (window.DEBUG) {
                DEBUG.success('MESMER READY!');
                DEBUG.info('Click PLAY to start music');
            }
        } catch (error) {
            console.error('FATAL: Mesmer initialization failed:', error);
            if (window.DEBUG) DEBUG.error('INIT FAILED: ' + error.message);
            throw error;
        }
    }

    connectAudio() {
        // IMPORTANT: This needs to be called AFTER Tone.start()
        // because Tone contexts must match
        console.log('Attempting to connect audio...');

        // We'll connect after user clicks play
        // For now, just log that we're ready
        console.log('Audio connection will be established when music starts');
    }

    connectAudioActual() {
        console.log('🔌 Setting up audio routing...');

        // Step 1: Initialize analyser with Tone's context
        const success = this.audioEngine.initializeAnalyser();
        if (!success) {
            console.error('❌ Failed to initialize analyser!');
            return;
        }

        // Step 2: Get the analyser
        const analyser = this.audioEngine.getAnalyser();
        if (!analyser) {
            console.error('❌ No analyser available!');
            return;
        }

        console.log('✅ Analyser ready:', analyser);

        // Step 3: Connect Tone.Destination → Analyser
        try {
            Tone.Destination.connect(analyser);
            console.log('✅ Tone.Destination connected to analyser!');
            console.log('   Audio will now flow: Instruments → Destination → Analyser → Frequency Data');
        } catch (error) {
            console.error('❌ Failed to connect audio routing:', error);
        }
    }

    setupUI() {
        console.log('🔧 Setting up UI and event listeners...');

        // Play/Pause button
        const playBtn = document.getElementById('playBtn');
        playBtn.addEventListener('click', () => this.togglePlay());

        // Synth Volume slider
        const synthVolumeSlider = document.getElementById('synthVolumeSlider');
        synthVolumeSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.musicEngine.setVolume(value);
            document.querySelector('#synthVolumeSlider + .value').textContent = `${value}%`;
        });

        // Drum Volume slider
        const drumVolumeSlider = document.getElementById('drumVolumeSlider');
        drumVolumeSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.musicEngine.setDrumMasterVolume(value);
            document.querySelector('#drumVolumeSlider + .value').textContent = `${value}%`;
        });

        // Reverb slider
        const reverbSlider = document.getElementById('reverbSlider');
        reverbSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.musicEngine.setReverb(value);
            document.querySelector('#reverbSlider + .value').textContent = `${value}%`;
        });

        // Delay slider
        const delaySlider = document.getElementById('delaySlider');
        delaySlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.musicEngine.setDelay(value);
            document.querySelector('#delaySlider + .value').textContent = `${value}%`;
        });

        // BPM slider
        const bpmSlider = document.getElementById('bpmSlider');
        bpmSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.musicEngine.setBPM(value);
            document.querySelector('#bpmSlider + .value').textContent = `${value}`;
        });

        // Genre selector
        const genreSelect = document.getElementById('genreSelect');
        genreSelect.addEventListener('change', (e) => {
            this.musicEngine.setGenre(e.target.value);
        });

        // Synth engine selector
        const synthEngineSelect = document.getElementById('synthEngineSelect');
        synthEngineSelect.addEventListener('change', (e) => {
            const engineType = e.target.value;
            this.musicEngine.setSynthEngine(engineType);

            // Show/hide WAD controls
            const wadControls = document.querySelectorAll('.wad-controls');
            wadControls.forEach(control => {
                control.style.display = engineType === 'wad' ? 'block' : 'none';
            });

            // Show/hide Dirt controls
            const dirtControls = document.querySelectorAll('.dirt-controls');
            dirtControls.forEach(control => {
                control.style.display = engineType === 'dirt' ? 'block' : 'none';
            });
        });

        // WAD Pad preset selector
        const wadPadPreset = document.getElementById('wadPadPreset');
        if (wadPadPreset) {
            wadPadPreset.addEventListener('change', (e) => {
                this.musicEngine.changeWadPreset('pad', e.target.value);
            });
        }

        // WAD Lead preset selector
        const wadLeadPreset = document.getElementById('wadLeadPreset');
        if (wadLeadPreset) {
            wadLeadPreset.addEventListener('change', (e) => {
                this.musicEngine.changeWadPreset('lead', e.target.value);
            });
        }

        // WAD Bass preset selector
        const wadBassPreset = document.getElementById('wadBassPreset');
        if (wadBassPreset) {
            wadBassPreset.addEventListener('change', (e) => {
                this.musicEngine.changeWadPreset('bass', e.target.value);
            });
        }

        // Dirt Pad bank selector
        const dirtPadBank = document.getElementById('dirtPadBank');
        if (dirtPadBank) {
            dirtPadBank.addEventListener('change', (e) => {
                this.musicEngine.changeDirtBank('pad', e.target.value);
            });
        }

        // Dirt Lead bank selector
        const dirtLeadBank = document.getElementById('dirtLeadBank');
        if (dirtLeadBank) {
            dirtLeadBank.addEventListener('change', (e) => {
                this.musicEngine.changeDirtBank('lead', e.target.value);
            });
        }

        // Dirt Bass bank selector
        const dirtBassBank = document.getElementById('dirtBassBank');
        if (dirtBassBank) {
            dirtBassBank.addEventListener('change', (e) => {
                this.musicEngine.changeDirtBank('bass', e.target.value);
            });
        }

        // Dirt Arp bank selector
        const dirtArpBank = document.getElementById('dirtArpBank');
        if (dirtArpBank) {
            dirtArpBank.addEventListener('change', (e) => {
                this.musicEngine.changeDirtBank('arp', e.target.value);
            });
        }

        // Scale selector
        const scaleSelect = document.getElementById('scaleSelect');
        scaleSelect.addEventListener('change', (e) => {
            this.musicEngine.setScale(e.target.value);
        });

        // Key selector (root note)
        const keySelect = document.getElementById('keySelect');
        keySelect.addEventListener('change', (e) => {
            this.musicEngine.setKey(e.target.value);
        });

        // Reverb type selector
        const reverbTypeSelect = document.getElementById('reverbTypeSelect');
        reverbTypeSelect.addEventListener('change', (e) => {
            this.musicEngine.setReverbType(e.target.value);
        });

        // Delay type selector
        const delayTypeSelect = document.getElementById('delayTypeSelect');
        delayTypeSelect.addEventListener('change', (e) => {
            this.musicEngine.setDelayType(e.target.value);
        });

        // Drum machine toggle
        const drumsToggle = document.getElementById('drumsToggle');
        drumsToggle.addEventListener('change', (e) => {
            this.musicEngine.setDrums(e.target.checked);
        });

        // Populate drum machine dropdown
        const drumMachineSelect = document.getElementById('drumMachineSelect');
        const drumMachines = this.musicEngine.getDrumMachines();
        drumMachines.forEach(machine => {
            const option = document.createElement('option');
            option.value = machine.value;
            option.textContent = machine.label;
            if (machine.value === this.musicEngine.currentDrumMachine) {
                option.selected = true;
            }
            drumMachineSelect.appendChild(option);
        });

        // Drum machine selector
        drumMachineSelect.addEventListener('change', (e) => {
            this.musicEngine.changeDrumMachine(e.target.value);
        });

        // Populate drum pattern dropdown with categories
        const drumPatternSelect = document.getElementById('drumPatternSelect');
        const drumPatterns = this.musicEngine.getDrumPatterns();

        // Group patterns by category
        const patternsByCategory = {};
        drumPatterns.forEach(pattern => {
            if (!patternsByCategory[pattern.category]) {
                patternsByCategory[pattern.category] = [];
            }
            patternsByCategory[pattern.category].push(pattern);
        });

        // Add patterns organized by category
        Object.entries(patternsByCategory).forEach(([category, patterns]) => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = category;

            patterns.forEach(pattern => {
                const option = document.createElement('option');
                option.value = pattern.value;
                option.textContent = pattern.label;
                if (pattern.value === this.musicEngine.currentPattern) {
                    option.selected = true;
                }
                optgroup.appendChild(option);
            });

            drumPatternSelect.appendChild(optgroup);
        });

        // Drum pattern selector
        drumPatternSelect.addEventListener('change', (e) => {
            this.musicEngine.changeDrumPattern(e.target.value);
            this.updateSequencerDisplay();
        });

        // Open sequencer button
        const openSequencerBtn = document.getElementById('openSequencerBtn');
        openSequencerBtn.addEventListener('click', () => {
            document.getElementById('drumSequencer').style.display = 'block';
            this.initializeSequencer();
        });

        // Close sequencer button
        const closeSequencerBtn = document.getElementById('closeDrumSequencer');
        closeSequencerBtn.addEventListener('click', () => {
            document.getElementById('drumSequencer').style.display = 'none';
        });

        // Toggle sequencer expand/collapse
        const toggleSequencerBtn = document.getElementById('toggleSequencerBtn');
        const drumSequencer = document.getElementById('drumSequencer');
        toggleSequencerBtn.addEventListener('click', () => {
            drumSequencer.classList.toggle('collapsed');
            const icon = toggleSequencerBtn.querySelector('path');
            if (drumSequencer.classList.contains('collapsed')) {
                // Change to expand icon (chevron up)
                icon.setAttribute('d', 'M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6 1.41 1.41z');
            } else {
                // Change to collapse icon (chevron down)
                icon.setAttribute('d', 'M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z');
            }
        });

        // Make drum sequencer draggable
        this.setupDraggable();

        // Layer opacity sliders
        this.mainOpacity = 1.0;
        this.toyOpacity = 0.8;

        const mainOpacitySlider = document.getElementById('mainOpacity');
        const mainOpacityValue = document.getElementById('mainOpacityValue');
        mainOpacitySlider.addEventListener('input', (e) => {
            this.mainOpacity = e.target.value / 100;
            mainOpacityValue.textContent = e.target.value;
            if (this.mainLayerEnabled) {
                this.mainCanvas.style.opacity = this.mainOpacity;
            }
        });

        const toyOpacitySlider = document.getElementById('toyOpacity');
        const toyOpacityValue = document.getElementById('toyOpacityValue');
        toyOpacitySlider.addEventListener('input', (e) => {
            this.toyOpacity = e.target.value / 100;
            toyOpacityValue.textContent = e.target.value;
            if (this.toyLayerEnabled) {
                this.toyCanvas.style.opacity = this.toyOpacity;
            }
        });

        // Layer toggles
        const mainToggle = document.getElementById('mainToggle');
        mainToggle.addEventListener('change', (e) => {
            this.mainLayerEnabled = e.target.checked;
            this.mainCanvas.style.opacity = e.target.checked ? this.mainOpacity : '0';
        });

        const toyToggle = document.getElementById('toyToggle');
        toyToggle.addEventListener('change', (e) => {
            this.toyLayerEnabled = e.target.checked;
            this.toyCanvas.style.opacity = e.target.checked ? this.toyOpacity : '0';
        });

        // Populate shader dropdowns dynamically
        console.log('🎨 Populating shader dropdowns...');
        const mainShaderSelect = document.getElementById('mainShaderSelect');
        const toyShaderSelect = document.getElementById('toyShaderSelect');

        // Clear existing options (except first 3 original shaders)
        mainShaderSelect.innerHTML = '';
        toyShaderSelect.innerHTML = '';

        // Add main shader options
        this.mainShader.shaders.forEach((shader, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = shader.name;
            mainShaderSelect.appendChild(option);
        });
        console.log(`  ✓ Added ${this.mainShader.shaders.length} main shaders to dropdown`);

        // Add toy shader options
        this.toyRenderer.shaders.forEach((shader, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = shader.name;
            toyShaderSelect.appendChild(option);
        });
        console.log(`  ✓ Added ${this.toyRenderer.shaders.length} toy shaders to dropdown`);

        // Shader selector event listeners
        mainShaderSelect.addEventListener('change', (e) => {
            this.mainShader.setShader(parseInt(e.target.value));
        });

        toyShaderSelect.addEventListener('change', (e) => {
            this.toyRenderer.setShader(parseInt(e.target.value));
        });

        // Fullscreen button
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        console.log('📍 Fullscreen button found:', !!fullscreenBtn);
        fullscreenBtn.addEventListener('click', () => {
            console.log('🖱️ Fullscreen button clicked!');
            this.toggleFullscreen();
        });

        // Listen for fullscreen changes (including ESC key exit)
        // Support all browser prefixes
        const handleFullscreenChange = () => {
            console.log('🔄 Fullscreen change event fired!');

            const controls = document.getElementById('controls');
            const debugOverlay = document.getElementById('debugOverlay');
            const shaderEditor = document.getElementById('shaderEditor');

            console.log('📍 Elements found:', {
                controls: !!controls,
                debugOverlay: !!debugOverlay,
                shaderEditor: !!shaderEditor
            });

            // Check if we're in fullscreen (works across browsers)
            const isFullscreen = !!(document.fullscreenElement ||
                                    document.webkitFullscreenElement ||
                                    document.mozFullScreenElement ||
                                    document.msFullscreenElement);

            console.log('📊 Fullscreen state:', {
                isFullscreen: isFullscreen,
                fullscreenElement: document.fullscreenElement,
                webkitFullscreenElement: document.webkitFullscreenElement
            });

            if (isFullscreen) {
                // Entering fullscreen - hide controls and shader editor
                console.log('🖥️ ✅ ENTERING FULLSCREEN - hiding controls and shader editor');
                if (controls) {
                    controls.style.display = 'none';
                    console.log('  ↳ Controls hidden');
                }
                if (debugOverlay) {
                    debugOverlay.style.display = 'none';
                    console.log('  ↳ Debug overlay hidden');
                }
                if (shaderEditor) {
                    shaderEditor.style.display = 'none';
                    console.log('  ↳ Shader editor hidden');
                }
            } else {
                // Exiting fullscreen - show controls and shader editor
                console.log('🖥️ ✅ EXITING FULLSCREEN - showing controls and shader editor');
                if (controls) {
                    controls.style.display = 'block';
                    console.log('  ↳ Controls shown');
                }
                if (debugOverlay) {
                    debugOverlay.style.display = 'block';
                    console.log('  ↳ Debug overlay shown');
                }
                if (shaderEditor) {
                    shaderEditor.style.display = 'block';
                    console.log('  ↳ Shader editor shown');
                }
            }
        };

        // Add event listeners for all browser prefixes
        console.log('📝 Registering fullscreen event listeners...');
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);
        console.log('✅ Fullscreen event listeners registered');

        // MPC Pad Controller
        this.setupMPCPads();
    }

    setupMPCPads() {
        console.log('🎹 Setting up MPC Pad Controller...');

        this.mpcState = {
            assignMode: false,
            selectedPad: null,
            pads: {}, // Store pad assignments: { padIndex: { type: 'drum'|'synth', pattern: 'patternName' } }
            isDragging: false,
            dragOffset: { x: 0, y: 0 }
        };

        const mpcPanel = document.getElementById('mpcPanel');
        const mpcToggleBtn = document.getElementById('mpcToggleBtn');
        const mpcCloseBtn = document.getElementById('mpcCloseBtn');
        const mpcHeader = document.getElementById('mpcHeader');
        const assignModeBtn = document.getElementById('mpcAssignMode');
        const assignHint = document.getElementById('mpcAssignHint');
        const allPads = document.querySelectorAll('.mpc-pad');
        const drumPatternSelect = document.getElementById('drumPatternSelect');
        const genreSelect = document.getElementById('genreSelect');

        console.log('🔍 MPC Panel elements found:', {
            mpcPanel: !!mpcPanel,
            mpcToggleBtn: !!mpcToggleBtn,
            mpcCloseBtn: !!mpcCloseBtn,
            mpcHeader: !!mpcHeader,
            allPads: allPads.length
        });

        if (!mpcPanel) {
            console.error('❌ MPC Panel not found in DOM!');
            return;
        }

        // Ensure panel starts hidden with correct initial styles
        mpcPanel.style.display = 'none';
        mpcPanel.style.position = 'fixed';
        mpcPanel.style.zIndex = '9999';
        console.log('✓ MPC Panel initialized in hidden state');

        // Toggle panel visibility
        mpcToggleBtn.addEventListener('click', () => {
            const isHidden = mpcPanel.style.display === 'none' || !mpcPanel.style.display;

            console.log('🔍 Current panel state:', {
                display: mpcPanel.style.display,
                isHidden: isHidden,
                boundingRect: mpcPanel.getBoundingClientRect(),
                computedStyle: {
                    display: window.getComputedStyle(mpcPanel).display,
                    visibility: window.getComputedStyle(mpcPanel).visibility,
                    opacity: window.getComputedStyle(mpcPanel).opacity,
                    zIndex: window.getComputedStyle(mpcPanel).zIndex
                }
            });

            if (isHidden) {
                // Show panel - reset to center position with all properties
                mpcPanel.style.display = 'block';
                mpcPanel.style.position = 'fixed';
                mpcPanel.style.left = '50%';
                mpcPanel.style.top = '50%';
                mpcPanel.style.transform = 'translate(-50%, -50%)';
                mpcPanel.style.zIndex = '99999';
                mpcPanel.style.opacity = '1';
                mpcPanel.style.visibility = 'visible';
                mpcPanel.style.pointerEvents = 'auto';

                mpcToggleBtn.innerHTML = `
                    <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M4 6h4v4H4V6zm0 8h4v4H4v-4zm6-8h4v4h-4V6zm0 8h4v4h-4v-4zm6-8h4v4h-4V6zm0 8h4v4h-4v-4z"/>
                    </svg>
                    Hide MPC Pads
                `;

                setTimeout(() => {
                    console.log('🎹 ✅ MPC Panel SHOWN - Position:', {
                        display: mpcPanel.style.display,
                        left: mpcPanel.style.left,
                        top: mpcPanel.style.top,
                        transform: mpcPanel.style.transform,
                        zIndex: mpcPanel.style.zIndex,
                        boundingRect: mpcPanel.getBoundingClientRect()
                    });
                }, 100);
            } else {
                mpcPanel.style.display = 'none';
                mpcToggleBtn.innerHTML = `
                    <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M4 6h4v4H4V6zm0 8h4v4H4v-4zm6-8h4v4h-4V6zm0 8h4v4h-4v-4zm6-8h4v4h-4V6zm0 8h4v4h-4v-4z"/>
                    </svg>
                    Show MPC Pads
                `;
                console.log('🎹 ❌ MPC Panel HIDDEN');
            }
        });

        // Close button
        mpcCloseBtn.addEventListener('click', () => {
            mpcPanel.style.display = 'none';
            mpcToggleBtn.innerHTML = `
                <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 6h4v4H4V6zm0 8h4v4H4v-4zm6-8h4v4h-4V6zm0 8h4v4h-4v-4zm6-8h4v4h-4V6zm0 8h4v4h-4v-4z"/>
                </svg>
                Show MPC Pads
            `;
        });

        // Make panel draggable by header
        mpcHeader.addEventListener('mousedown', (e) => {
            if (e.target.closest('.mpc-close')) return; // Don't drag when clicking close button

            this.mpcState.isDragging = true;
            const rect = mpcPanel.getBoundingClientRect();
            this.mpcState.dragOffset = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
            mpcPanel.style.transform = 'none';
            console.log('🖱️ MPC Panel drag started');
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.mpcState.isDragging) return;

            const x = e.clientX - this.mpcState.dragOffset.x;
            const y = e.clientY - this.mpcState.dragOffset.y;

            mpcPanel.style.left = `${x}px`;
            mpcPanel.style.top = `${y}px`;
        });

        document.addEventListener('mouseup', () => {
            if (this.mpcState.isDragging) {
                this.mpcState.isDragging = false;
                console.log('🖱️ MPC Panel drag ended');
            }
        });

        // Assign Mode button
        assignModeBtn.addEventListener('click', () => {
            this.mpcState.assignMode = !this.mpcState.assignMode;

            if (this.mpcState.assignMode) {
                console.log('🎛️ MPC Assign Mode: ON');
                document.body.classList.add('mpc-assign-mode');
                assignModeBtn.classList.add('active');
                assignModeBtn.innerHTML = `
                    <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                    </svg>
                    Exit Assign Mode
                `;
                assignHint.style.display = 'block';
                this.mpcState.selectedPad = null;
            } else {
                console.log('🎛️ MPC Assign Mode: OFF');
                document.body.classList.remove('mpc-assign-mode');
                assignModeBtn.classList.remove('active');
                assignModeBtn.innerHTML = `
                    <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                    </svg>
                    Assign Mode
                `;
                assignHint.style.display = 'none';
                allPads.forEach(pad => pad.classList.remove('selected'));
                this.mpcState.selectedPad = null;
            }
        });

        // Pad click handlers
        allPads.forEach(pad => {
            pad.addEventListener('click', async () => {
                const padIndex = parseInt(pad.dataset.pad);
                const padType = pad.dataset.type;

                if (this.mpcState.assignMode) {
                    // Assignment mode - select pad for assignment
                    if (this.mpcState.selectedPad === padIndex) {
                        // Deselect
                        this.mpcState.selectedPad = null;
                        pad.classList.remove('selected');
                        console.log('🎹 Pad deselected:', padIndex);
                    } else {
                        // Select pad
                        allPads.forEach(p => p.classList.remove('selected'));
                        this.mpcState.selectedPad = padIndex;
                        pad.classList.add('selected');
                        console.log('🎹 Pad selected for assignment:', padIndex, padType);

                        // Auto-assign current pattern
                        if (padType === 'drum') {
                            const currentPattern = drumPatternSelect.value;
                            this.assignPadPattern(padIndex, 'drum', currentPattern);
                        } else if (padType === 'synth') {
                            const currentGenre = genreSelect.value;
                            this.assignPadPattern(padIndex, 'synth', currentGenre);
                        }
                    }
                } else {
                    // Play mode - trigger assigned pattern
                    const assignment = this.mpcState.pads[padIndex];
                    if (assignment && assignment.pattern) {
                        console.log('🎹 Triggering pad:', padIndex, assignment);
                        await this.triggerPad(padIndex, assignment);

                        // Visual feedback
                        pad.classList.add('playing');
                        setTimeout(() => {
                            pad.classList.remove('playing');
                        }, 600);
                    } else {
                        console.log('⚠️ Pad not assigned:', padIndex);
                    }
                }
            });
        });

        // Listen for pattern/genre changes to update selected pad assignment
        drumPatternSelect.addEventListener('change', () => {
            if (this.mpcState.assignMode && this.mpcState.selectedPad !== null) {
                const pad = document.querySelector(`.mpc-pad[data-pad="${this.mpcState.selectedPad}"]`);
                if (pad && pad.dataset.type === 'drum') {
                    this.assignPadPattern(this.mpcState.selectedPad, 'drum', drumPatternSelect.value);
                }
            }
        });

        genreSelect.addEventListener('change', () => {
            if (this.mpcState.assignMode && this.mpcState.selectedPad !== null) {
                const pad = document.querySelector(`.mpc-pad[data-pad="${this.mpcState.selectedPad}"]`);
                if (pad && pad.dataset.type === 'synth') {
                    this.assignPadPattern(this.mpcState.selectedPad, 'synth', genreSelect.value);
                }
            }
        });

        console.log('✅ MPC Pad Controller initialized');
    }

    assignPadPattern(padIndex, type, pattern) {
        this.mpcState.pads[padIndex] = { type, pattern };

        const pad = document.querySelector(`.mpc-pad[data-pad="${padIndex}"]`);
        if (pad) {
            pad.dataset.pattern = pattern;
            const label = pad.querySelector('.pad-label');
            label.textContent = this.getPatternDisplayName(pattern);
        }

        console.log(`✓ Assigned ${type} pattern "${pattern}" to pad ${padIndex}`);
    }

    async triggerPad(padIndex, assignment) {
        // Check if music is playing - if not, auto-start it
        if (!this.isPlaying) {
            console.log('⚠️ Music not playing - auto-starting...');
            await this.togglePlay(); // Start playback
            // Wait a moment for audio to initialize
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (assignment.type === 'drum') {
            // Switch drum pattern
            console.log('🥁 Switching to drum pattern:', assignment.pattern);
            const drumPatternSelect = document.getElementById('drumPatternSelect');
            drumPatternSelect.value = assignment.pattern;
            this.musicEngine.changeDrumPattern(assignment.pattern);
        } else if (assignment.type === 'synth') {
            // Switch genre (which changes synth patterns)
            console.log('🎹 Switching to genre:', assignment.pattern);
            const genreSelect = document.getElementById('genreSelect');
            genreSelect.value = assignment.pattern;
            this.musicEngine.setGenre(assignment.pattern);
        }
    }

    getPatternDisplayName(pattern) {
        // Convert pattern name to display-friendly format
        return pattern
            .split(/[-_]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    async togglePlay() {
        console.log('🎵 Play button clicked');
        if (window.DEBUG) DEBUG.info('Play button clicked');

        const playBtn = document.getElementById('playBtn');
        const btnText = playBtn.querySelector('span');
        const btnIcon = playBtn.querySelector('path');

        if (!this.isPlaying) {
            try {
                console.log('🎵 Starting audio...');
                if (window.DEBUG) DEBUG.info('Starting Tone.js...');

                // CRITICAL: Start Tone.js first (requires user gesture)
                await Tone.start();
                console.log('✓ Tone.js started, AudioContext state:', Tone.context.state);
                if (window.DEBUG) DEBUG.success('Tone.js started: ' + Tone.context.state);

                // Resume our audio engine
                await this.audioEngine.resume();
                console.log('✓ Audio engine resumed');
                if (window.DEBUG) DEBUG.success('Audio engine resumed');

                // Connect audio routing (AFTER Tone.start())
                this.connectAudioActual();

                // Start music
                this.musicEngine.start();
                console.log('✓ Music started');
                if (window.DEBUG) DEBUG.success('Music PLAYING!');

                this.isPlaying = true;
                playBtn.classList.add('playing');
                btnText.textContent = 'Pause';
                btnIcon.setAttribute('d', 'M6 4h4v16H6V4zm8 0h4v16h-4V4z'); // Pause icon

                console.log('✓ Playback started successfully');
            } catch (error) {
                console.error('✗ Failed to start playback:', error);
                if (window.DEBUG) DEBUG.error('Playback failed: ' + error.message);
                alert('Failed to start audio: ' + error.message);
            }
        } else {
            console.log('🎵 Stopping music...');
            if (window.DEBUG) DEBUG.info('Stopping music...');

            // Stop music
            this.musicEngine.stop();

            this.isPlaying = false;
            playBtn.classList.remove('playing');
            btnText.textContent = 'Play';
            btnIcon.setAttribute('d', 'M8 5v14l11-7z'); // Play icon

            console.log('✓ Music stopped');
            if (window.DEBUG) DEBUG.success('Music stopped');
        }
    }

    toggleFullscreen() {
        console.log('🎬 toggleFullscreen() called');

        // Check if we're currently in fullscreen (cross-browser)
        const isFullscreen = !!(document.fullscreenElement ||
                                document.webkitFullscreenElement ||
                                document.mozFullScreenElement ||
                                document.msFullscreenElement);

        console.log('📊 Current fullscreen state:', {
            isFullscreen: isFullscreen,
            fullscreenElement: document.fullscreenElement,
            webkitFullscreenElement: document.webkitFullscreenElement
        });

        if (!isFullscreen) {
            // Enter fullscreen (try all browser prefixes)
            const elem = document.documentElement;
            console.log('🔍 Attempting to enter fullscreen...');

            if (elem.requestFullscreen) {
                console.log('  ↳ Using standard requestFullscreen()');
                elem.requestFullscreen().then(() => {
                    console.log('  ✅ requestFullscreen() promise resolved');
                }).catch(err => {
                    console.error('  ❌ requestFullscreen() failed:', err);
                });
            } else if (elem.webkitRequestFullscreen) {
                console.log('  ↳ Using webkit prefixed requestFullscreen()');
                elem.webkitRequestFullscreen();
            } else if (elem.mozRequestFullScreen) {
                console.log('  ↳ Using moz prefixed requestFullScreen()');
                elem.mozRequestFullScreen();
            } else if (elem.msRequestFullscreen) {
                console.log('  ↳ Using ms prefixed requestFullscreen()');
                elem.msRequestFullscreen();
            } else {
                console.error('❌ No fullscreen API available!');
            }
        } else {
            // Exit fullscreen (try all browser prefixes)
            console.log('🔍 Attempting to exit fullscreen...');

            if (document.exitFullscreen) {
                console.log('  ↳ Using standard exitFullscreen()');
                document.exitFullscreen().then(() => {
                    console.log('  ✅ exitFullscreen() promise resolved');
                }).catch(err => {
                    console.error('  ❌ exitFullscreen() failed:', err);
                });
            } else if (document.webkitExitFullscreen) {
                console.log('  ↳ Using webkit prefixed exitFullscreen()');
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                console.log('  ↳ Using moz prefixed cancelFullScreen()');
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                console.log('  ↳ Using ms prefixed exitFullscreen()');
                document.msExitFullscreen();
            } else {
                console.error('❌ No fullscreen exit API available!');
            }
        }
        console.log('⏳ Waiting for fullscreenchange event...');
        // Note: fullscreenchange event listener handles showing/hiding controls
    }

    setupResize() {
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Update main shader
        this.mainShader.resize(width, height);

        // Update toy renderer
        this.toyRenderer.resize(width, height);

        // Update waveform canvas
        const rect = this.waveformCanvas.getBoundingClientRect();
        this.waveformCanvas.width = rect.width;
        this.waveformCanvas.height = rect.height;
    }

    render() {
        requestAnimationFrame(() => this.render());

        // Analyze audio
        const audioData = this.audioEngine.analyze();

        // Debug: Log audio data once per second
        if (this.frameCount % 60 === 0 && this.isPlaying) {
            console.log('🎵 Audio Data:', {
                low: audioData.low.toFixed(3),
                mid: audioData.mid.toFixed(3),
                high: audioData.high.toFixed(3)
            });
        }

        // Render main shader
        if (this.mainLayerEnabled) {
            this.mainShader.render(audioData);
        }

        // Render toy layer
        if (this.toyLayerEnabled) {
            this.toyRenderer.render(audioData);
        }

        // Update audio visualizations
        this.updateAudioViz(audioData);

        // Update FPS
        this.updateFPS();
    }

    updateAudioViz(audioData) {
        // Update frequency bars
        const barLow = document.querySelector('#barLow .bar-fill');
        const barMid = document.querySelector('#barMid .bar-fill');
        const barHigh = document.querySelector('#barHigh .bar-fill');

        barLow.style.height = `${audioData.low * 100}%`;
        barMid.style.height = `${audioData.mid * 100}%`;
        barHigh.style.height = `${audioData.high * 100}%`;

        // Draw waveform
        this.drawWaveform();
    }

    drawWaveform() {
        const canvas = this.waveformCanvas;
        const ctx = canvas.getContext('2d');
        const waveform = this.audioEngine.getWaveform();

        if (!waveform) return;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.lineWidth = 2;
        ctx.strokeStyle = '#6366f1';
        ctx.beginPath();

        const sliceWidth = canvas.width / waveform.length;
        let x = 0;

        for (let i = 0; i < waveform.length; i++) {
            const v = waveform[i] / 128.0;
            const y = v * canvas.height / 2;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
    }

    updateFPS() {
        this.frameCount++;
        const now = Date.now();
        const elapsed = now - this.lastFpsUpdate;

        if (elapsed >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / elapsed);
            this.frameCount = 0;
            this.lastFpsUpdate = now;

            document.getElementById('fpsValue').textContent = this.fps;
        }
    }

    initializeSequencer() {
        // Create step buttons for each drum channel
        const channels = ['kick', 'snare', 'hihat', 'openhat'];
        channels.forEach(drumType => {
            const channel = document.querySelector(`[data-drum="${drumType}"]`);
            const stepGrid = channel.querySelector('.step-grid');
            stepGrid.innerHTML = ''; // Clear existing

            for (let i = 0; i < 16; i++) {
                const button = document.createElement('button');
                button.className = 'step-button';
                button.dataset.drum = drumType;
                button.dataset.step = i;

                // Mark every 4th step (beat markers)
                if (i % 4 === 0) {
                    button.classList.add('beat-marker');
                }

                button.addEventListener('click', () => {
                    const pattern = this.musicEngine.getCurrentPattern();
                    const currentValue = pattern[drumType][i];
                    this.musicEngine.updatePatternStep(drumType, i, !currentValue);
                    button.classList.toggle('active');
                });

                stepGrid.appendChild(button);
            }
        });

        // Setup volume sliders
        document.querySelectorAll('.drum-volume').forEach(slider => {
            const channel = slider.dataset.channel;
            const valueDisplay = slider.nextElementSibling;

            slider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value) / 100;
                this.musicEngine.setDrumVolume(channel, value);
                valueDisplay.textContent = e.target.value;
            });
        });

        // Setup master drum volume
        const masterVolume = document.getElementById('drumMasterVolume');
        const masterValue = document.getElementById('drumMasterValue');
        masterVolume.addEventListener('input', (e) => {
            const value = parseInt(e.target.value) / 100;
            this.musicEngine.setDrumVolume('master', value);
            masterValue.textContent = `${e.target.value}%`;
        });

        // Update display with current pattern
        this.updateSequencerDisplay();
    }

    updateSequencerDisplay() {
        const pattern = this.musicEngine.getCurrentPattern();
        if (!pattern) return;

        ['kick', 'snare', 'hihat', 'openhat'].forEach(drumType => {
            const buttons = document.querySelectorAll(`[data-drum="${drumType}"][data-step]`);
            buttons.forEach((button, index) => {
                if (pattern[drumType] && pattern[drumType][index] === 1) {
                    button.classList.add('active');
                } else {
                    button.classList.remove('active');
                }
            });
        });
    }

    setupDraggable() {
        const sequencer = document.getElementById('drumSequencer');
        const header = document.getElementById('sequencerHeader');

        let isDragging = false;
        let startX;
        let startY;
        let startLeft;
        let startTop;

        header.addEventListener('mousedown', (e) => {
            // Don't start drag if clicking on buttons
            if (e.target.closest('button')) return;

            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;

            // Get current position
            const rect = sequencer.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;

            // Convert from bottom/right to top/left positioning
            sequencer.style.bottom = 'auto';
            sequencer.style.right = 'auto';
            sequencer.style.left = `${startLeft}px`;
            sequencer.style.top = `${startTop}px`;
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                e.preventDefault();

                // Calculate new position
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;

                let newLeft = startLeft + deltaX;
                let newTop = startTop + deltaY;

                // Constrain to window bounds
                const rect = sequencer.getBoundingClientRect();
                const maxX = window.innerWidth - rect.width;
                const maxY = window.innerHeight - rect.height;

                newLeft = Math.max(0, Math.min(newLeft, maxX));
                newTop = Math.max(0, Math.min(newTop, maxY));

                sequencer.style.left = `${newLeft}px`;
                sequencer.style.top = `${newTop}px`;
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }
}

// Wait for all dependencies before initializing
async function waitForDependencies() {
    // Wait for Tone.js to load
    let attempts = 0;
    while (typeof Tone === 'undefined' && attempts < 50) {
        console.log('⏳ Waiting for Tone.js to load...');
        if (window.DEBUG) DEBUG.warn(`Waiting for Tone.js (attempt ${attempts + 1})`);
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }

    if (typeof Tone === 'undefined') {
        console.error('❌ FATAL: Tone.js failed to load from CDN');
        if (window.DEBUG) DEBUG.error('Tone.js FAILED TO LOAD');
        alert('Failed to load audio library. Please refresh the page.');
        return false;
    }

    console.log('✅ All dependencies loaded');
    if (window.DEBUG) DEBUG.success('Dependencies ready');
    return true;
}

// Initialize app when DOM and dependencies are ready
async function initApp() {
    console.log('🚀 Starting Mesmer initialization...');
    if (window.DEBUG) DEBUG.info('Checking dependencies...');

    const depsReady = await waitForDependencies();
    if (!depsReady) return;

    window.mesmer = new Mesmer();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
