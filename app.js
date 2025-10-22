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

        // Note Density slider (Generative Music)
        const noteDensitySlider = document.getElementById('noteDensitySlider');
        noteDensitySlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.musicEngine.setNoteDensity(value);
            document.querySelector('#noteDensitySlider + .value').textContent = `${value}%`;
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

        // Synth Reverb slider
        const synthReverbSlider = document.getElementById('synthReverbSlider');
        synthReverbSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.musicEngine.setSynthReverb(value);
            document.querySelector('#synthReverbSlider + .value').textContent = `${value}%`;
        });

        // Synth Delay slider
        const synthDelaySlider = document.getElementById('synthDelaySlider');
        synthDelaySlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.musicEngine.setSynthDelay(value);
            document.querySelector('#synthDelaySlider + .value').textContent = `${value}%`;
        });

        // Drum Reverb slider
        const drumReverbSlider = document.getElementById('drumReverbSlider');
        drumReverbSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.musicEngine.setDrumReverb(value);
            document.querySelector('#drumReverbSlider + .value').textContent = `${value}%`;
        });

        // Drum Delay slider
        const drumDelaySlider = document.getElementById('drumDelaySlider');
        drumDelaySlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.musicEngine.setDrumDelay(value);
            document.querySelector('#drumDelaySlider + .value').textContent = `${value}%`;
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
            // Update piano roll if synth sequencer is visible
            const synthSeqPanel = document.getElementById('synthSequencerPanel');
            if (synthSeqPanel && synthSeqPanel.style.display !== 'none') {
                this.renderPianoRoll();
                console.log('🎹 Piano roll updated to reflect new scale');
            }
        });

        // Key selector (root note)
        const keySelect = document.getElementById('keySelect');
        keySelect.addEventListener('change', (e) => {
            this.musicEngine.setKey(e.target.value);
            // Update piano roll if synth sequencer is visible
            const synthSeqPanel = document.getElementById('synthSequencerPanel');
            if (synthSeqPanel && synthSeqPanel.style.display !== 'none') {
                this.renderPianoRoll();
                console.log('🎹 Piano roll updated to reflect new key');
            }
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
            this.mainCanvas.style.opacity = this.mainOpacity;
        });

        const toyOpacitySlider = document.getElementById('toyOpacity');
        const toyOpacityValue = document.getElementById('toyOpacityValue');
        toyOpacitySlider.addEventListener('input', (e) => {
            this.toyOpacity = e.target.value / 100;
            toyOpacityValue.textContent = e.target.value;
            this.toyCanvas.style.opacity = this.toyOpacity;
        });

        // Layer toggles removed - now controlled only by opacity sliders
        // Layers are always enabled, use opacity sliders to control visibility
        this.mainLayerEnabled = true;
        this.toyLayerEnabled = true;

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

        // Synth Sequencer
        this.setupSynthSequencer();

        // Mode Toggle
        this.setupModeToggle();
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

        // Bring MPC panel to front when clicked
        mpcPanel.addEventListener('mousedown', () => {
            this.bringPanelToFront(mpcPanel);
        });

        // Make panel draggable by header
        mpcHeader.addEventListener('mousedown', (e) => {
            if (e.target.closest('.mpc-close')) return; // Don't drag when clicking close button

            // Convert from percentage/transform positioning to pixel positioning
            if (mpcPanel.style.transform !== 'none') {
                const rect = mpcPanel.getBoundingClientRect();
                mpcPanel.style.left = `${rect.left}px`;
                mpcPanel.style.top = `${rect.top}px`;
                mpcPanel.style.transform = 'none';
            }

            this.mpcState.isDragging = true;

            // Now get offset AFTER transform is removed
            const rect = mpcPanel.getBoundingClientRect();
            this.mpcState.dragOffset = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };

            // Prevent text selection during drag
            e.preventDefault();
            console.log('🖱️ MPC Panel drag started');
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.mpcState.isDragging) return;

            // Use requestAnimationFrame for smooth dragging
            requestAnimationFrame(() => {
                const x = e.clientX - this.mpcState.dragOffset.x;
                const y = e.clientY - this.mpcState.dragOffset.y;

                // Clamp to viewport bounds
                const maxX = window.innerWidth - mpcPanel.offsetWidth;
                const maxY = window.innerHeight - mpcPanel.offsetHeight;

                mpcPanel.style.left = `${Math.max(0, Math.min(x, maxX))}px`;
                mpcPanel.style.top = `${Math.max(0, Math.min(y, maxY))}px`;
            });
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
            // Update drum sequencer if it's open
            if (this.updateSequencerDisplay) {
                this.updateSequencerDisplay();
            }
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

    setupSynthSequencer() {
        console.log('🎹 Setting up Synth Sequencer...');

        const panel = document.getElementById('synthSequencer');
        const toggleBtn = document.getElementById('synthSeqToggleBtn');
        const closeBtn = document.getElementById('synthSeqCloseBtn');
        const header = document.getElementById('synthSeqHeader');

        // Synth sequencer state
        this.synthSeqState = {
            currentTrack: 'pad', // pad, lead, bass, arp
            patterns: {
                // Each pattern: [{ step: 0, notes: [{ note: 'C3', duration: 1, velocity: 0.7 }] }]
                pad: [],
                lead: [],
                bass: [],
                arp: []
            },
            length: 16,
            scale: 'major',
            octave: 3,
            rootNote: 'C', // Root note of the key
            velocity: 0.7,
            engine: 'tonejs', // tonejs, wad, dirt
            isDragging: false,
            dragOffset: { x: 0, y: 0 },
            isPlaying: false,
            currentStep: 0,
            // Note length dragging
            isDraggingNote: false,
            dragStartCell: null,
            dragCurrentNote: null
        };

        // Scale definitions
        this.scales = {
            chromatic: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
            major: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
            minor: ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb'],
            pentatonic: ['C', 'D', 'E', 'G', 'A'],
            blues: ['C', 'Eb', 'F', 'Gb', 'G', 'Bb']
        };

        // Toggle panel visibility
        toggleBtn.addEventListener('click', () => {
            const isHidden = panel.style.display === 'none' || !panel.style.display;
            if (isHidden) {
                panel.style.display = 'block';
                panel.style.left = '50%';
                panel.style.top = '50%';
                panel.style.transform = 'translate(-50%, -50%)';
                panel.style.zIndex = '9998';
                this.bringPanelToFront(panel);
                this.updateKeyDisplay();
                this.renderPianoRoll();
                console.log('🎹 Synth Sequencer shown');
            } else {
                panel.style.display = 'none';
                console.log('🎹 Synth Sequencer hidden');
            }
        });

        // Close button
        closeBtn.addEventListener('click', () => {
            panel.style.display = 'none';
            console.log('🎹 Synth Sequencer closed');
        });

        // Bring to front when clicked
        panel.addEventListener('mousedown', () => {
            this.bringPanelToFront(panel);
        });

        // Make panel draggable
        header.addEventListener('mousedown', (e) => {
            if (e.target.closest('.synth-seq-close')) return;

            // Convert transform to pixels if needed
            if (panel.style.transform.includes('translate')) {
                const rect = panel.getBoundingClientRect();
                panel.style.left = `${rect.left}px`;
                panel.style.top = `${rect.top}px`;
                panel.style.transform = 'none';
            }

            this.synthSeqState.isDragging = true;
            const rect = panel.getBoundingClientRect();
            this.synthSeqState.dragOffset = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };

            e.preventDefault();
            console.log('🖱️ Synth Sequencer drag started');
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.synthSeqState.isDragging) return;

            requestAnimationFrame(() => {
                const x = e.clientX - this.synthSeqState.dragOffset.x;
                const y = e.clientY - this.synthSeqState.dragOffset.y;

                const maxX = window.innerWidth - panel.offsetWidth;
                const maxY = window.innerHeight - panel.offsetHeight;

                panel.style.left = `${Math.max(0, Math.min(x, maxX))}px`;
                panel.style.top = `${Math.max(0, Math.min(y, maxY))}px`;
            });
        });

        document.addEventListener('mouseup', () => {
            if (this.synthSeqState.isDragging) {
                this.synthSeqState.isDragging = false;
                console.log('🖱️ Synth Sequencer drag ended');
            }
            if (this.synthSeqState.isDraggingNote) {
                this.synthSeqState.isDraggingNote = false;
                this.synthSeqState.dragStartCell = null;
                console.log('🎵 Note duration drag ended');
            }
        });

        // Track selector buttons
        const trackBtns = document.querySelectorAll('.synth-track-btn');
        trackBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                trackBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.synthSeqState.currentTrack = btn.dataset.track;
                this.renderPianoRoll();
                console.log('🎹 Switched to track:', this.synthSeqState.currentTrack);
            });
        });

        // Control buttons
        document.getElementById('synthSeqPlay').addEventListener('click', () => {
            this.toggleSequencerPlayback();
        });

        document.getElementById('synthSeqClear').addEventListener('click', () => {
            this.synthSeqState.patterns[this.synthSeqState.currentTrack] = [];
            this.renderPianoRoll();
            console.log('🗑️ Cleared pattern for', this.synthSeqState.currentTrack);
        });

        document.getElementById('synthSeqRandomize').addEventListener('click', () => {
            this.randomizePattern();
            console.log('🎲 Randomized pattern for', this.synthSeqState.currentTrack);
        });

        document.getElementById('synthSeqSave').addEventListener('click', () => {
            this.saveCurrentPattern();
        });

        document.getElementById('synthSeqCopy').addEventListener('click', () => {
            this.copyPattern();
        });

        document.getElementById('synthSeqPaste').addEventListener('click', () => {
            this.pastePattern();
        });

        // Load preset dropdown
        const presetLoadSelect = document.getElementById('synthSeqPresetLoad');
        presetLoadSelect.addEventListener('change', (e) => {
            if (e.target.value) {
                this.loadPattern(e.target.value);
            }
        });

        // Delete pattern button
        document.getElementById('synthSeqDelete').addEventListener('click', () => {
            const selectedPreset = presetLoadSelect.value;
            if (selectedPreset) {
                this.deletePattern(selectedPreset);
            } else {
                alert('⚠️ Select a pattern to delete first');
            }
        });

        // Populate presets on init
        this.populatePatternPresets();

        // Settings
        document.getElementById('synthSeqEngine').addEventListener('change', (e) => {
            this.synthSeqState.engine = e.target.value;
            console.log('🎛️ Sequencer engine changed to', this.synthSeqState.engine);
            // Reset synths when engine changes
            if (this.previewSynths) {
                Object.values(this.previewSynths).forEach(synth => {
                    if (synth && synth.dispose) synth.dispose();
                });
                this.previewSynths = null;
            }
        });

        document.getElementById('synthSeqLength').addEventListener('change', (e) => {
            this.synthSeqState.length = parseInt(e.target.value);
            this.renderPianoRoll();
            console.log('📏 Pattern length changed to', this.synthSeqState.length);
        });

        document.getElementById('synthSeqScale').addEventListener('change', (e) => {
            this.synthSeqState.scale = e.target.value;
            this.updateKeyDisplay();
            this.renderPianoRoll();
            console.log('🎼 Scale changed to', this.synthSeqState.scale);
        });

        document.getElementById('synthSeqOctave').addEventListener('change', (e) => {
            this.synthSeqState.octave = parseInt(e.target.value);
            this.renderPianoRoll();
            console.log('🎵 Octave changed to', this.synthSeqState.octave);
        });

        const velocitySlider = document.getElementById('synthSeqVelocity');
        const velocityValue = document.getElementById('synthSeqVelocityValue');
        velocitySlider.addEventListener('input', (e) => {
            this.synthSeqState.velocity = parseInt(e.target.value) / 100;
            velocityValue.textContent = `${e.target.value}%`;
        });

        // Export buttons
        document.getElementById('synthSeqExportMidi').addEventListener('click', () => {
            this.exportPatternMidi();
        });

        document.getElementById('synthSeqExportWav').addEventListener('click', () => {
            this.exportPatternWav();
        });

        console.log('✅ Synth Sequencer initialized');
    }

    renderPianoRoll() {
        const pianoKeys = document.getElementById('pianoKeys');
        const pianoGrid = document.getElementById('pianoRollGrid');

        // Get current scale notes from music engine (semitone intervals)
        const scaleIntervals = this.musicEngine && this.musicEngine.currentScale ?
            this.musicEngine.currentScale : [0, 2, 4, 5, 7, 9, 11];
        const rootNoteWithOctave = this.musicEngine && this.musicEngine.rootNote ?
            this.musicEngine.rootNote : 'C3';
        const octave = this.synthSeqState.octave;

        // Extract root note without octave (e.g., "C3" -> "C")
        const rootNote = rootNoteWithOctave.replace(/[0-9]/g, '');

        // Build full note array (2 octaves) - convert intervals to note names
        const notes = [];
        for (let o = octave + 1; o >= octave; o--) {
            for (let i = scaleIntervals.length - 1; i >= 0; i--) {
                // Convert semitone interval to actual note name
                const semitone = scaleIntervals[i];
                const noteFreq = Tone.Frequency(rootNote + '0').transpose(semitone).transpose(o * 12);
                const noteName = noteFreq.toNote();
                notes.push(noteName);
            }
        }

        console.log('🎹 Rendering piano roll with', notes.length, 'notes:', notes.slice(0, 5), '...');

        // Render piano keys
        pianoKeys.innerHTML = notes.map(note => {
            const isSharp = note.includes('#') || note.includes('b');
            return `<div class="piano-key ${isSharp ? 'sharp' : 'natural'}">${note}</div>`;
        }).join('');

        // Render grid
        pianoGrid.innerHTML = '';
        const pattern = this.synthSeqState.patterns[this.synthSeqState.currentTrack] || [];

        for (let step = 0; step < this.synthSeqState.length; step++) {
            const column = document.createElement('div');
            column.className = 'note-column';

            notes.forEach((note, noteIndex) => {
                const cell = document.createElement('div');
                cell.className = 'note-cell';
                cell.dataset.step = step;
                cell.dataset.note = note;

                // Check if this note is active in the pattern
                const stepPattern = pattern.find(p => p.step === step);
                if (stepPattern) {
                    const noteData = stepPattern.notes.find(n => n.note === note);
                    if (noteData) {
                        cell.classList.add('active');
                        // Show duration visually if > 1
                        if (noteData.duration > 1) {
                            cell.style.background = `linear-gradient(90deg,
                                rgba(139, 92, 246, 0.9) 0%,
                                rgba(139, 92, 246, 0.9) ${(noteData.duration / 4) * 100}%,
                                rgba(139, 92, 246, 0.4) ${(noteData.duration / 4) * 100}%,
                                rgba(139, 92, 246, 0.4) 100%)`;
                        }
                        // Store note data for dragging
                        cell.dataset.duration = noteData.duration;
                        cell.dataset.velocity = noteData.velocity;
                    }
                }

                // Toggle note on click (or start dragging to extend)
                cell.addEventListener('mousedown', (e) => {
                    if (e.button !== 0) return; // Only left click

                    const isActive = cell.classList.contains('active');

                    if (isActive && e.shiftKey) {
                        // Shift+drag to extend duration
                        this.synthSeqState.isDraggingNote = true;
                        this.synthSeqState.dragStartCell = { step, note };
                        cell.style.cursor = 'ew-resize';
                        e.preventDefault();
                    } else {
                        // Regular click toggles note
                        this.toggleNote(step, note);
                    }
                });

                // Hover effect for extending
                cell.addEventListener('mouseenter', () => {
                    if (this.synthSeqState.isDraggingNote) {
                        const startStep = this.synthSeqState.dragStartCell.step;
                        const startNote = this.synthSeqState.dragStartCell.note;

                        if (note === startNote && step >= startStep) {
                            // Update duration
                            const duration = step - startStep + 1;
                            this.updateNoteDuration(startNote, startStep, duration);
                        }
                    }
                });

                column.appendChild(cell);
            });

            pianoGrid.appendChild(column);
        }

        console.log('🎹 Piano roll rendered:', notes.length, 'notes ×', this.synthSeqState.length, 'steps');
    }

    toggleNote(step, note) {
        const track = this.synthSeqState.currentTrack;
        let pattern = this.synthSeqState.patterns[track];

        // Find step in pattern
        let stepIndex = pattern.findIndex(p => p.step === step);

        if (stepIndex === -1) {
            // Step doesn't exist, create it with this note
            pattern.push({
                step,
                notes: [{
                    note: note,
                    duration: 1,
                    velocity: this.synthSeqState.velocity
                }]
            });
        } else {
            // Step exists, find note
            const noteIndex = pattern[stepIndex].notes.findIndex(n => n.note === note);
            if (noteIndex === -1) {
                // Add note (polyphonic)
                pattern[stepIndex].notes.push({
                    note: note,
                    duration: 1,
                    velocity: this.synthSeqState.velocity
                });
            } else {
                // Remove note
                pattern[stepIndex].notes.splice(noteIndex, 1);
                // Remove step if no notes left
                if (pattern[stepIndex].notes.length === 0) {
                    pattern.splice(stepIndex, 1);
                }
            }
        }

        // Update display
        this.renderPianoRoll();
        console.log('🎵 Toggled note', note, 'at step', step);
    }

    updateNoteDuration(note, step, duration) {
        const track = this.synthSeqState.currentTrack;
        let pattern = this.synthSeqState.patterns[track];

        // Find step in pattern
        const stepData = pattern.find(p => p.step === step);
        if (!stepData) return;

        // Find note
        const noteData = stepData.notes.find(n => n.note === note);
        if (!noteData) return;

        // Update duration (max 4 steps)
        noteData.duration = Math.min(duration, 4);

        // Re-render to show new duration
        this.renderPianoRoll();
    }

    randomizePattern() {
        const track = this.synthSeqState.currentTrack;
        const scaleNotes = this.scales[this.synthSeqState.scale];
        const octave = this.synthSeqState.octave;

        // Build note array
        const notes = [];
        for (let o = octave + 1; o >= octave; o--) {
            scaleNotes.forEach(note => {
                notes.push(`${note}${o}`);
            });
        }

        // Generate random pattern (30% chance per step, 1-3 notes)
        const pattern = [];
        for (let step = 0; step < this.synthSeqState.length; step++) {
            if (Math.random() < 0.3) {
                const noteCount = Math.floor(Math.random() * 3) + 1; // 1-3 notes
                const stepNotes = [];
                for (let i = 0; i < noteCount; i++) {
                    const randomNote = notes[Math.floor(Math.random() * notes.length)];
                    if (!stepNotes.find(n => n.note === randomNote)) {
                        stepNotes.push({
                            note: randomNote,
                            duration: Math.random() > 0.7 ? 2 : 1, // 30% chance of longer notes
                            velocity: 0.5 + Math.random() * 0.5 // Random velocity 0.5-1.0
                        });
                    }
                }
                pattern.push({ step, notes: stepNotes });
            }
        }

        this.synthSeqState.patterns[track] = pattern;
        this.renderPianoRoll();
    }

    saveCurrentPattern() {
        const track = this.synthSeqState.currentTrack;
        const pattern = this.synthSeqState.patterns[track];

        // Prompt for pattern name
        const name = prompt(`Save ${track} pattern as:`, `Custom ${track.charAt(0).toUpperCase() + track.slice(1)}`);
        if (!name) return;

        // Save to localStorage
        const saved = {
            name,
            track,
            pattern,
            length: this.synthSeqState.length,
            scale: this.synthSeqState.scale,
            octave: this.synthSeqState.octave,
            rootNote: this.synthSeqState.rootNote
        };

        const key = `synthPattern_${track}_${name}`;
        localStorage.setItem(key, JSON.stringify(saved));
        document.getElementById('synthSeqPatternName').innerHTML = `Current Pattern: <strong>${name}</strong>`;

        // Refresh presets dropdown
        this.populatePatternPresets();

        console.log('💾 Saved pattern:', name);
        alert(`✅ Pattern "${name}" saved!`);
    }

    populatePatternPresets() {
        const select = document.getElementById('synthSeqPresetLoad');
        if (!select) return;

        // Clear current options except first
        select.innerHTML = '<option value="">-- Select Pattern --</option>';

        // Get all saved patterns from localStorage
        const patterns = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('synthPattern_')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    patterns.push({ key, data });
                } catch (e) {
                    console.warn('Failed to parse pattern:', key);
                }
            }
        }

        // Group by track
        const grouped = {
            pad: [],
            lead: [],
            bass: [],
            arp: []
        };

        patterns.forEach(({ key, data }) => {
            if (grouped[data.track]) {
                grouped[data.track].push({ key, name: data.name });
            }
        });

        // Add options grouped by track
        ['pad', 'lead', 'bass', 'arp'].forEach(track => {
            if (grouped[track].length > 0) {
                const optgroup = document.createElement('optgroup');
                optgroup.label = track.charAt(0).toUpperCase() + track.slice(1);

                grouped[track].forEach(({ key, name }) => {
                    const option = document.createElement('option');
                    option.value = key;
                    option.textContent = name;
                    optgroup.appendChild(option);
                });

                select.appendChild(optgroup);
            }
        });

        console.log('📋 Populated', patterns.length, 'pattern presets');
    }

    loadPattern(key) {
        try {
            const saved = JSON.parse(localStorage.getItem(key));
            if (!saved) {
                alert('⚠️ Pattern not found');
                return;
            }

            // Load pattern data
            this.synthSeqState.patterns[saved.track] = saved.pattern;
            this.synthSeqState.length = saved.length || 16;
            this.synthSeqState.scale = saved.scale || 'major';
            this.synthSeqState.octave = saved.octave || 3;
            this.synthSeqState.rootNote = saved.rootNote || 'C';

            // Switch to the pattern's track
            this.synthSeqState.currentTrack = saved.track;

            // Update UI
            document.querySelectorAll('.synth-track-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.track === saved.track);
            });

            document.getElementById('synthSeqLength').value = this.synthSeqState.length;
            document.getElementById('synthSeqScale').value = this.synthSeqState.scale;
            document.getElementById('synthSeqOctave').value = this.synthSeqState.octave;
            document.getElementById('synthSeqPatternName').innerHTML = `Current Pattern: <strong>${saved.name}</strong>`;

            this.updateKeyDisplay();
            this.renderPianoRoll();

            console.log('📂 Loaded pattern:', saved.name);
        } catch (e) {
            console.error('Failed to load pattern:', e);
            alert('❌ Failed to load pattern');
        }
    }

    deletePattern(key) {
        const saved = JSON.parse(localStorage.getItem(key));
        if (!saved) return;

        if (confirm(`Delete pattern "${saved.name}"?`)) {
            localStorage.removeItem(key);
            this.populatePatternPresets();
            document.getElementById('synthSeqPresetLoad').value = '';
            console.log('🗑️ Deleted pattern:', saved.name);
            alert(`✅ Pattern "${saved.name}" deleted`);
        }
    }

    copyPattern() {
        const track = this.synthSeqState.currentTrack;
        const pattern = this.synthSeqState.patterns[track];

        if (pattern.length === 0) {
            alert('⚠️ Pattern is empty! Nothing to copy.');
            return;
        }

        // Deep clone the pattern to clipboard
        this.patternClipboard = {
            track,
            pattern: JSON.parse(JSON.stringify(pattern)),
            length: this.synthSeqState.length,
            scale: this.synthSeqState.scale,
            octave: this.synthSeqState.octave
        };

        console.log('📋 Copied pattern from', track, '(' + pattern.length + ' steps)');
        alert(`✅ Copied ${track} pattern to clipboard!`);
    }

    pastePattern() {
        if (!this.patternClipboard) {
            alert('⚠️ Clipboard is empty! Copy a pattern first.');
            return;
        }

        const track = this.synthSeqState.currentTrack;

        // Deep clone from clipboard
        this.synthSeqState.patterns[track] = JSON.parse(JSON.stringify(this.patternClipboard.pattern));

        // Optionally update settings
        if (confirm('Apply copied pattern settings (length, scale, octave)?')) {
            this.synthSeqState.length = this.patternClipboard.length;
            this.synthSeqState.scale = this.patternClipboard.scale;
            this.synthSeqState.octave = this.patternClipboard.octave;

            document.getElementById('synthSeqLength').value = this.synthSeqState.length;
            document.getElementById('synthSeqScale').value = this.synthSeqState.scale;
            document.getElementById('synthSeqOctave').value = this.synthSeqState.octave;

            this.updateKeyDisplay();
        }

        this.renderPianoRoll();

        console.log('📋 Pasted pattern to', track);
        alert(`✅ Pasted pattern from ${this.patternClipboard.track} to ${track}!`);
    }

    updateKeyDisplay() {
        const keyDisplay = document.getElementById('synthSeqKeyDisplay');
        if (!keyDisplay) return;

        // Get key and scale from music engine
        const rootNote = this.musicEngine ? this.musicEngine.rootNote : 'C3';
        const scaleIntervals = this.musicEngine ? this.musicEngine.currentScale : [0, 2, 4, 5, 7, 9, 11];

        // Extract just the note name without octave
        const root = rootNote.replace(/[0-9]/g, '');

        // Determine scale name from intervals
        const scaleIntervalsStr = JSON.stringify(scaleIntervals);
        const scaleMap = {
            '[0,2,4,5,7,9,11]': 'Major',
            '[0,2,3,5,7,8,10]': 'Minor',
            '[0,2,4,7,9]': 'Pentatonic',
            '[0,2,3,5,7,9,10]': 'Dorian',
            '[0,1,3,5,7,8,10]': 'Phrygian'
        };

        const scaleName = scaleMap[scaleIntervalsStr] || 'Scale';

        keyDisplay.innerHTML = `Key: <strong>${root} ${scaleName}</strong>`;
    }

    async toggleSequencerPlayback() {
        const playBtn = document.getElementById('synthSeqPlay');

        if (this.synthSeqState.isPlaying) {
            // Stop playback
            if (this.sequencerPlaybacks) {
                Object.values(this.sequencerPlaybacks).forEach(seq => {
                    if (seq) {
                        seq.stop();
                        seq.dispose();
                    }
                });
                this.sequencerPlaybacks = null;
            }

            if (typeof Tone !== 'undefined') {
                Tone.Transport.stop();
            }

            this.synthSeqState.isPlaying = false;
            playBtn.innerHTML = `
                <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                </svg>
                Play
            `;
            console.log('⏹️ Stopped sequencer playback');
        } else {
            // Check if at least one track has notes
            const hasNotes = ['pad', 'lead', 'bass', 'arp'].some(track =>
                this.synthSeqState.patterns[track].length > 0
            );

            if (!hasNotes) {
                alert('⚠️ All patterns are empty! Add some notes first or click Random.');
                return;
            }

            // Ensure Tone.js is started
            if (typeof Tone !== 'undefined' && Tone.context.state !== 'running') {
                await Tone.start();
                console.log('🎵 Started Tone.js context');
            }

            // Create synths for each track type if they don't exist
            const engine = this.synthSeqState.engine;

            if (!this.previewSynths || this.previewEngine !== engine) {
                // Dispose old synths if changing engine
                if (this.previewSynths) {
                    Object.values(this.previewSynths).forEach(synth => {
                        if (synth && synth.dispose) synth.dispose();
                    });
                }

                if (engine === 'tonejs') {
                    this.previewSynths = {
                        pad: new Tone.PolySynth(Tone.Synth, {
                            oscillator: { type: 'sine' },
                            envelope: { attack: 0.8, decay: 0.2, sustain: 0.5, release: 1.5 },
                            volume: -6
                        }).toDestination(),
                        lead: new Tone.PolySynth(Tone.Synth, {
                            oscillator: { type: 'sawtooth' },
                            envelope: { attack: 0.05, decay: 0.2, sustain: 0.4, release: 0.4 },
                            volume: -8
                        }).toDestination(),
                        bass: new Tone.PolySynth(Tone.Synth, {
                            oscillator: { type: 'triangle' },
                            envelope: { attack: 0.02, decay: 0.3, sustain: 0.6, release: 0.5 },
                            volume: -3
                        }).toDestination(),
                        arp: new Tone.PolySynth(Tone.Synth, {
                            oscillator: { type: 'square' },
                            envelope: { attack: 0.01, decay: 0.1, sustain: 0.2, release: 0.2 },
                            volume: -10
                        }).toDestination()
                    };
                    console.log('🎹 Created Tone.js preview synths');
                } else if (engine === 'wad') {
                    // WAD synths - use the already initialized WAD engine
                    this.previewSynths = { pad: 'wad', lead: 'wad', bass: 'wad', arp: 'wad' };
                    console.log('🎹 Using WAD synth engine');
                } else if (engine === 'dirt') {
                    // Dirt samples - use the already initialized Dirt engine
                    this.previewSynths = { pad: 'dirt', lead: 'dirt', bass: 'dirt', arp: 'dirt' };
                    console.log('🎹 Using Dirt sample engine');
                }

                this.previewEngine = engine;
            }

            // Create sequences for ALL tracks
            const steps = Array.from({ length: this.synthSeqState.length }, (_, i) => i);
            this.sequencerPlaybacks = {};

            ['pad', 'lead', 'bass', 'arp'].forEach(track => {
                const pattern = this.synthSeqState.patterns[track];

                this.sequencerPlaybacks[track] = new Tone.Sequence((time, step) => {
                    // Find notes for this step
                    const stepData = pattern.find(p => p.step === step);

                    if (stepData && stepData.notes.length > 0) {
                        stepData.notes.forEach(noteData => {
                            const duration = `${noteData.duration * 0.25}n`;
                            const durationSeconds = noteData.duration * 0.25; // For WAD/Dirt

                            // Play using selected engine
                            if (engine === 'tonejs') {
                                this.previewSynths[track].triggerAttackRelease(
                                    noteData.note,
                                    duration,
                                    time,
                                    noteData.velocity
                                );
                            } else if (engine === 'wad' && this.musicEngine && this.musicEngine.wadEngine) {
                                // Use WAD engine from music engine
                                this.musicEngine.wadEngine.play(track, noteData.note, durationSeconds, noteData.velocity);
                            } else if (engine === 'dirt' && this.musicEngine && this.musicEngine.dirtEngine) {
                                // Use Dirt samples from music engine
                                this.musicEngine.dirtEngine.play(track, noteData.note, durationSeconds, noteData.velocity);
                            }
                        });
                    }

                    // Visual feedback (only from one track to avoid conflicts)
                    if (track === this.synthSeqState.currentTrack) {
                        this.synthSeqState.currentStep = step;
                        this.highlightCurrentStep(step);
                    }
                }, steps, '16n');

                this.sequencerPlaybacks[track].start(0);
            });

            Tone.Transport.start();

            this.synthSeqState.isPlaying = true;
            playBtn.innerHTML = `
                <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
                Stop
            `;
            console.log('▶️ Started ALL 4 tracks playback (Pad + Lead + Bass + Arp)');
        }
    }

    highlightCurrentStep(step) {
        // Highlight the current step column
        const columns = document.querySelectorAll('.note-column');
        columns.forEach((col, index) => {
            if (index === step) {
                col.style.background = 'rgba(139, 92, 246, 0.2)';
            } else {
                col.style.background = '';
            }
        });
    }

    async exportPatternMidi() {
        const track = this.synthSeqState.currentTrack;
        const pattern = this.synthSeqState.patterns[track];

        if (!pattern || pattern.length === 0) {
            alert('⚠️ No notes in current pattern to export!');
            return;
        }

        console.log('🎵 Exporting MIDI for track:', track);

        // Create basic MIDI file structure
        const midiEvents = [];
        const ppq = 480; // Pulses per quarter note
        const stepDuration = ppq / 4; // 16th note

        // Convert pattern to MIDI events
        pattern.forEach(stepData => {
            stepData.notes.forEach(noteData => {
                const noteNumber = this.noteToMidiNumber(noteData.note);
                const startTime = stepData.step * stepDuration;
                const duration = noteData.duration * stepDuration;
                const velocity = Math.round(noteData.velocity * 127);

                midiEvents.push({
                    time: startTime,
                    type: 'noteOn',
                    note: noteNumber,
                    velocity: velocity
                });

                midiEvents.push({
                    time: startTime + duration,
                    type: 'noteOff',
                    note: noteNumber,
                    velocity: 0
                });
            });
        });

        // Sort events by time
        midiEvents.sort((a, b) => a.time - b.time);

        // Create MIDI file using simple format
        const midiData = this.createMidiFile(midiEvents, ppq);

        // Download
        const blob = new Blob([midiData], { type: 'audio/midi' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mesmer-${track}-pattern.mid`;
        a.click();
        URL.revokeObjectURL(url);

        console.log('✅ MIDI exported:', midiEvents.length, 'events');
        alert(`✅ MIDI file exported!\n${pattern.length} steps, ${midiEvents.length / 2} notes`);
    }

    noteToMidiNumber(note) {
        // Convert note name (e.g. "C4") to MIDI number (e.g. 60)
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const noteName = note.replace(/[0-9]/g, '');
        const octave = parseInt(note.match(/[0-9]/)[0]);
        const noteIndex = noteNames.indexOf(noteName);
        return (octave + 1) * 12 + noteIndex;
    }

    createMidiFile(events, ppq) {
        // Simple MIDI file format (Format 0, 1 track)
        const header = new Uint8Array([
            0x4D, 0x54, 0x68, 0x64, // "MThd"
            0x00, 0x00, 0x00, 0x06, // Header length
            0x00, 0x00, // Format 0
            0x00, 0x01, // 1 track
            (ppq >> 8) & 0xFF, ppq & 0xFF // Ticks per quarter note
        ]);

        // Track data
        const trackEvents = [];
        let lastTime = 0;

        events.forEach(event => {
            const deltaTime = event.time - lastTime;
            lastTime = event.time;

            // Variable length delta time
            const deltaBytes = this.encodeVariableLength(deltaTime);

            if (event.type === 'noteOn') {
                trackEvents.push(...deltaBytes, 0x90, event.note, event.velocity);
            } else if (event.type === 'noteOff') {
                trackEvents.push(...deltaBytes, 0x80, event.note, 0);
            }
        });

        // End of track
        trackEvents.push(0x00, 0xFF, 0x2F, 0x00);

        const trackLength = trackEvents.length;
        const trackHeader = new Uint8Array([
            0x4D, 0x54, 0x72, 0x6B, // "MTrk"
            (trackLength >> 24) & 0xFF,
            (trackLength >> 16) & 0xFF,
            (trackLength >> 8) & 0xFF,
            trackLength & 0xFF
        ]);

        // Combine header + track
        const midiFile = new Uint8Array(header.length + trackHeader.length + trackEvents.length);
        midiFile.set(header, 0);
        midiFile.set(trackHeader, header.length);
        midiFile.set(trackEvents, header.length + trackHeader.length);

        return midiFile;
    }

    encodeVariableLength(value) {
        const bytes = [];
        bytes.push(value & 0x7F);
        value >>= 7;
        while (value > 0) {
            bytes.unshift((value & 0x7F) | 0x80);
            value >>= 7;
        }
        return bytes;
    }

    async exportPatternWav() {
        const track = this.synthSeqState.currentTrack;
        const pattern = this.synthSeqState.patterns[track];

        if (!pattern || pattern.length === 0) {
            alert('⚠️ No notes in current pattern to export!');
            return;
        }

        console.log('🎵 Exporting WAV for track:', track);
        alert('🎵 Rendering audio... This may take a moment.');

        try {
            // Calculate total duration (steps * 16th note duration)
            const maxStep = Math.max(...pattern.map(p => p.step));
            const duration = ((maxStep + 4) / 4) * (60 / Tone.Transport.bpm.value);

            // Render offline
            const buffer = await Tone.Offline(({ transport }) => {
                // Create synth for offline rendering
                const synth = new Tone.PolySynth(Tone.Synth).toDestination();

                // Schedule all notes
                pattern.forEach(stepData => {
                    const time = (stepData.step / 4) * (60 / Tone.Transport.bpm.value);

                    stepData.notes.forEach(noteData => {
                        const noteDuration = (noteData.duration / 4) * (60 / Tone.Transport.bpm.value);
                        synth.triggerAttackRelease(
                            noteData.note,
                            noteDuration,
                            time,
                            noteData.velocity
                        );
                    });
                });
            }, duration);

            // Convert to WAV
            const wavBlob = await this.bufferToWav(buffer);

            // Download
            const url = URL.createObjectURL(wavBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mesmer-${track}-pattern.wav`;
            a.click();
            URL.revokeObjectURL(url);

            console.log('✅ WAV exported:', duration, 'seconds');
            alert(`✅ WAV file exported!\n${pattern.length} steps, ${duration.toFixed(2)}s duration`);
        } catch (error) {
            console.error('❌ WAV export error:', error);
            alert('❌ Error exporting WAV: ' + error.message);
        }
    }

    async bufferToWav(audioBuffer) {
        // Convert Tone.js buffer to WAV file
        const numberOfChannels = audioBuffer.numberOfChannels;
        const sampleRate = audioBuffer.sampleRate;
        const format = 1; // PCM
        const bitDepth = 16;

        const bytesPerSample = bitDepth / 8;
        const blockAlign = numberOfChannels * bytesPerSample;

        const data = [];
        for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
            data.push(audioBuffer.getChannelData(i));
        }

        const dataLength = data[0].length * numberOfChannels * bytesPerSample;
        const buffer = new ArrayBuffer(44 + dataLength);
        const view = new DataView(buffer);

        // WAV header
        this.writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + dataLength, true);
        this.writeString(view, 8, 'WAVE');
        this.writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, format, true);
        view.setUint16(22, numberOfChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * blockAlign, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bitDepth, true);
        this.writeString(view, 36, 'data');
        view.setUint32(40, dataLength, true);

        // Write audio data
        let offset = 44;
        for (let i = 0; i < data[0].length; i++) {
            for (let channel = 0; channel < numberOfChannels; channel++) {
                const sample = Math.max(-1, Math.min(1, data[channel][i]));
                view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
                offset += 2;
            }
        }

        return new Blob([buffer], { type: 'audio/wav' });
    }

    writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    setupModeToggle() {
        console.log('🎛️ Setting up Mode Toggle...');

        const generativeBtn = document.getElementById('generativeModeBtn');
        const prodBtn = document.getElementById('prodModeBtn');

        // Initialize music mode state
        this.musicMode = 'generative'; // 'generative' or 'prod'

        generativeBtn.addEventListener('click', () => {
            if (this.musicMode === 'generative') return;

            this.musicMode = 'generative';
            generativeBtn.classList.add('active');
            prodBtn.classList.remove('active');

            console.log('🎹 Switched to GENERATIVE mode');

            // Restart music with generative patterns if playing
            if (this.isPlaying && this.musicEngine) {
                this.musicEngine.switchToGenerativeMode();
            }
        });

        prodBtn.addEventListener('click', () => {
            if (this.musicMode === 'prod') return;

            this.musicMode = 'prod';
            prodBtn.classList.add('active');
            generativeBtn.classList.remove('active');

            console.log('🎹 Switched to PROD/DAW mode');

            // Load custom patterns from sequencer if playing
            if (this.isPlaying && this.musicEngine) {
                this.loadSequencerPatternsToEngine();
            }
        });

        console.log('✅ Mode Toggle initialized');
    }

    loadSequencerPatternsToEngine() {
        // Load patterns from synth sequencer into music engine
        const patterns = this.synthSeqState.patterns;

        console.log('🎵 Loading custom patterns to engine:', patterns);

        // Pass patterns to music engine
        if (this.musicEngine) {
            this.musicEngine.useCustomPatterns(patterns);
        }
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

        // Render main shader (always render, opacity controlled by CSS)
        this.mainShader.render(audioData);

        // Render toy layer (always render, opacity controlled by CSS)
        this.toyRenderer.render(audioData);

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

    bringPanelToFront(panel) {
        // Reset all panels to base z-index
        const drumSequencer = document.getElementById('drumSequencer');
        const mpcPanel = document.getElementById('mpcPanel');
        const synthSequencer = document.getElementById('synthSequencer');

        if (drumSequencer) drumSequencer.style.zIndex = '9998';
        if (mpcPanel) mpcPanel.style.zIndex = '9998';
        if (synthSequencer) synthSequencer.style.zIndex = '9998';

        // Bring clicked panel to front
        panel.style.zIndex = '99999';
    }

    setupDraggable() {
        const sequencer = document.getElementById('drumSequencer');
        const header = document.getElementById('sequencerHeader');

        let isDragging = false;
        let startX;
        let startY;
        let startLeft;
        let startTop;

        // Bring to front when clicked anywhere on sequencer
        sequencer.addEventListener('mousedown', () => {
            this.bringPanelToFront(sequencer);
        });

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

            // Prevent text selection
            e.preventDefault();
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
