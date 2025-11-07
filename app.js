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

        // Hand tracking engines
        this.chordEngine = null;
        this.gestureRecognizer = null;
        this.musicMapper = null;
        this.handTracking = null;

        // Face tracking engines
        this.emotionMusicMapper = null;
        this.faceTracking = null;

        // Voice control engine
        this.voiceControl = null;

        // Voice input & effects
        this.vocalEffects = null;

        // Guitar input & effects
        this.guitarEffects = null;

        // DJ Mode engines
        this.djEngine = null;
        this.djFXRack = null;
        this.djBPMAnalyzer = null;
        this.djControlPanel = null;
        this.djFileLoader = null;
        this.djGestureController = null;
        this.djAudioViz = null;

        // State
        this.isPlaying = false;
        this.mainLayerEnabled = true;
        this.toyLayerEnabled = true;
        this.djAnimationRunning = false;

        // FPS tracking
        this.fps = 60;
        this.frameCount = 0;
        this.lastFpsUpdate = Date.now();

        // Audio recording
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.recordingDestination = null;

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

            // Initialize projector manager
            console.log('🎬 Initializing projector manager...');
            this.projectorManager = new ProjectorManager(this.mainCanvas);
            console.log('✓ Projector manager initialized');

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

            // Initialize hand tracking engines
            console.log('👋 Setting up hand tracking...');
            if (window.DEBUG) DEBUG.info('Setting up hand tracking...');
            this.chordEngine = new ChordEngine();
            this.gestureRecognizer = new GestureRecognizer();
            this.musicMapper = new GestureMusicMapper(this.musicEngine, this.chordEngine);
            this.handTracking = new HandTracking(this.gestureRecognizer, this.musicMapper);
            console.log('✓ Hand tracking modules ready');
            if (window.DEBUG) DEBUG.success('Hand tracking modules ready');

            // Initialize face tracking engines
            console.log('🎭 Setting up face tracking...');
            if (window.DEBUG) DEBUG.info('Setting up face tracking...');
            this.emotionMusicMapper = new EmotionMusicMapper(this.musicEngine, this.chordEngine);
            this.faceTracking = new FaceTracking(this.emotionMusicMapper);
            console.log('✓ Face tracking modules ready');
            if (window.DEBUG) DEBUG.success('Face tracking modules ready');

            // Initialize voice control
            console.log('🎤 Setting up voice control...');
            if (window.DEBUG) DEBUG.info('Setting up voice control...');
            this.voiceControl = new VoiceControl(this);
            console.log('✓ Voice control ready');
            if (window.DEBUG) DEBUG.success('Voice control ready');

            // Initialize vocal effects chain
            console.log('🎤 Setting up vocal effects chain...');
            if (window.DEBUG) DEBUG.info('Setting up vocal effects...');
            this.vocalEffects = new VocalEffectsChain();
            console.log('✓ Vocal effects chain ready');
            if (window.DEBUG) DEBUG.success('Vocal effects ready');

            // Initialize guitar effects chain
            console.log('🎸 Setting up guitar effects chain...');
            if (window.DEBUG) DEBUG.info('Setting up guitar effects...');
            this.guitarEffects = new GuitarEffectsChain();
            console.log('✓ Guitar effects chain ready');
            if (window.DEBUG) DEBUG.success('Guitar effects ready');

            // Initialize DJ Mode
            console.log('🎧 Setting up DJ mode...');
            if (window.DEBUG) DEBUG.info('Setting up DJ mode...');
            this.djEngine = new DJEngine();
            this.djFXRack = new DJFXRack();
            this.djBPMAnalyzer = new DJBPMAnalyzer();

            const djControlCanvas = document.getElementById('djControlCanvas');
            const djVizCanvas = document.getElementById('djVizCanvas');
            this.djControlPanel = new DJControlPanel(djControlCanvas);
            this.djAudioViz = new DJAudioVisualizer(djVizCanvas);

            this.djEngine.connectFXRack(this.djFXRack);
            this.djFileLoader = new DJFileLoader(this.djEngine, this.djBPMAnalyzer);
            this.djGestureController = new DJGestureController(this.djEngine, this.djFXRack);

            console.log('✓ DJ mode ready');
            if (window.DEBUG) DEBUG.success('DJ mode ready');

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

        // Chaos Mode button
        const chaosModeBtn = document.getElementById('chaosModeBtn');
        chaosModeBtn.addEventListener('click', () => {
            const isActive = chaosModeBtn.getAttribute('data-active') === 'true';
            const newState = !isActive;

            chaosModeBtn.setAttribute('data-active', newState.toString());
            chaosModeBtn.querySelector('.chaos-status').textContent = newState ? 'ON' : 'OFF';

            this.musicEngine.setChaosMode(newState);
            this.setChaosMode(newState); // For visual randomization
        });

        // Magick Mode Drums Toggle
        const magickDrumsToggle = document.getElementById('magickDrumsToggle');
        magickDrumsToggle.addEventListener('change', (e) => {
            this.musicEngine.drumsMagickEnabled = e.target.checked;
            console.log('🔥 Magick Mode drums:', e.target.checked ? 'ENABLED' : 'DISABLED (synths only)');

            // If unchecked, immediately disable and stop drums
            if (!e.target.checked && this.musicEngine.drumsEnabled) {
                this.musicEngine.drumsEnabled = false;
                this.musicEngine.stopDrums();

                // Update drums toggle UI
                const drumsToggle = document.getElementById('drumsToggle');
                if (drumsToggle) {
                    drumsToggle.setAttribute('data-active', 'false');
                    const statusSpan = drumsToggle.querySelector('.status');
                    if (statusSpan) {
                        statusSpan.textContent = 'OFF';
                    }
                }
                console.log('🔥 Drums disabled and stopped');
            }
        });

        // Recording mode toggle
        const recordingModeSelect = document.getElementById('recordingMode');
        const videoQualityContainer = document.getElementById('videoQualityContainer');
        const audioQualityContainer = document.getElementById('audioQualityContainer');

        recordingModeSelect.addEventListener('change', (e) => {
            const isVideoMode = e.target.value === 'video';
            videoQualityContainer.style.display = isVideoMode ? 'block' : 'none';
            audioQualityContainer.style.display = isVideoMode ? 'none' : 'block';
        });

        // Audio Recording buttons
        const recordBtn = document.getElementById('recordBtn');
        const stopRecordBtn = document.getElementById('stopRecordBtn');
        const recordingStatus = document.getElementById('recordingStatus');

        recordBtn.addEventListener('click', () => {
            this.startRecording();
            recordBtn.disabled = true;
            stopRecordBtn.disabled = false;
            recordingStatus.textContent = '🔴 Recording...';
            recordingStatus.style.color = '#f06';
        });

        stopRecordBtn.addEventListener('click', () => {
            this.stopRecording();
            recordBtn.disabled = false;
            stopRecordBtn.disabled = true;
            recordingStatus.textContent = '💾 Recording saved!';
            recordingStatus.style.color = '#0f6';
            setTimeout(() => {
                recordingStatus.textContent = '';
            }, 3000);
        });

        // Master Volume slider (controls Tone.Destination.volume)
        const volumeSlider = document.getElementById('volumeSlider');

        // Initialize master volume to match slider default (70%)
        const initValue = parseInt(volumeSlider.value);
        const initDb = (initValue / 100) * 60 - 60;
        Tone.Destination.volume.value = initDb;
        console.log(`🔊 Master volume initialized to ${initValue}% (${initDb.toFixed(1)}dB)`);

        volumeSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            // Convert 0-100 to dB (-60 to 0)
            const db = (value / 100) * 60 - 60;
            Tone.Destination.volume.rampTo(db, 0.1);
            document.querySelector('#volumeSlider + .value').textContent = `${value}%`;
        });

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

            // Show/hide Tone.js controls
            const tonejsControls = document.querySelectorAll('.tonejs-controls');
            tonejsControls.forEach(control => {
                control.style.display = engineType === 'tonejs' ? 'block' : 'none';
            });

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

        // Tone.js Pad preset selector
        const tonejsPadPreset = document.getElementById('tonejsPadPreset');
        if (tonejsPadPreset) {
            tonejsPadPreset.addEventListener('change', (e) => {
                this.musicEngine.changeTonejsPreset('pad', e.target.value);
            });
        }

        // Tone.js Lead preset selector
        const tonejsLeadPreset = document.getElementById('tonejsLeadPreset');
        if (tonejsLeadPreset) {
            tonejsLeadPreset.addEventListener('change', (e) => {
                this.musicEngine.changeTonejsPreset('lead', e.target.value);
            });
        }

        // Tone.js Bass preset selector
        const tonejsBassPreset = document.getElementById('tonejsBassPreset');
        if (tonejsBassPreset) {
            tonejsBassPreset.addEventListener('change', (e) => {
                this.musicEngine.changeTonejsPreset('bass', e.target.value);
            });
        }

        // Tone.js Arp preset selector
        const tonejsArpPreset = document.getElementById('tonejsArpPreset');
        if (tonejsArpPreset) {
            tonejsArpPreset.addEventListener('change', (e) => {
                this.musicEngine.changeTonejsPreset('arp', e.target.value);
            });
        }

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
            const oldScale = this.musicEngine.currentScaleName;
            const newScale = e.target.value;

            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('🎵 SCALE CHANGE EVENT FIRED!');
            console.log(`📋 Old scale: "${oldScale}" → New scale: "${newScale}"`);
            console.log(`📋 ChordEngine exists: ${!!this.chordEngine}`);

            // Update BOTH engines (musicEngine for generative music, chordEngine for hand tracking)
            this.musicEngine.setScale(newScale);
            console.log('✅ MusicEngine scale updated to:', newScale);

            if (this.chordEngine) {
                const beforeUpdate = this.chordEngine.getCurrentScale();
                console.log(`📋 ChordEngine BEFORE update: "${beforeUpdate}"`);

                this.chordEngine.setScale(newScale);

                const afterUpdate = this.chordEngine.getCurrentScale();
                console.log(`✅ ChordEngine AFTER update: "${afterUpdate}"`);
            } else {
                console.error('❌ ChordEngine does NOT exist!');
            }

            // Transpose synth sequencer notes if active
            if (this.synthSeqState && oldScale) {
                this.transposeNotesToNewScale(oldScale, newScale);
                this.renderPianoRoll();
                this.updateKeyDisplay();
            }

            // Update hand tracking overlay to show new scale
            console.log(`📋 HandTracking exists: ${!!this.handTracking}`);
            if (this.handTracking) {
                console.log('🔄 Calling updateActivePresetDisplay()...');
                this.handTracking.updateActivePresetDisplay();
                console.log('✅ updateActivePresetDisplay() call completed');
            } else {
                console.error('❌ HandTracking does NOT exist!');
            }

            console.log('🎹 Global scale changed from', oldScale, 'to', newScale);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        });

        // Key selector (root note)
        const keySelect = document.getElementById('keySelect');
        keySelect.addEventListener('change', (e) => {
            const newKey = e.target.value;

            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('🎵 KEY CHANGE EVENT FIRED!');
            console.log(`📋 New key: "${newKey}"`);
            console.log(`📋 ChordEngine exists: ${!!this.chordEngine}`);

            // Update BOTH engines (musicEngine for generative music, chordEngine for hand tracking)
            this.musicEngine.setKey(newKey);
            console.log('✅ MusicEngine key updated to:', newKey);

            if (this.chordEngine) {
                const beforeUpdate = this.chordEngine.getCurrentRoot();
                console.log(`📋 ChordEngine BEFORE update: "${beforeUpdate}"`);

                this.chordEngine.setRoot(newKey);

                const afterUpdate = this.chordEngine.getCurrentRoot();
                console.log(`✅ ChordEngine AFTER update: "${afterUpdate}"`);
            } else {
                console.error('❌ ChordEngine does NOT exist!');
            }

            // Always update piano roll and key display
            if (this.synthSeqState) {
                this.transposeNotesToNewKey();
                this.renderPianoRoll();
                this.updateKeyDisplay();
            }

            // Update hand tracking overlay to show new key
            console.log(`📋 HandTracking exists: ${!!this.handTracking}`);
            if (this.handTracking) {
                console.log('🔄 Calling updateActivePresetDisplay()...');
                this.handTracking.updateActivePresetDisplay();
                console.log('✅ updateActivePresetDisplay() call completed');
            } else {
                console.error('❌ HandTracking does NOT exist!');
            }

            console.log('🎹 Key changed, piano roll and display updated');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
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
        drumsToggle.addEventListener('click', () => {
            const isActive = drumsToggle.getAttribute('data-active') === 'true';
            const newState = !isActive;
            drumsToggle.setAttribute('data-active', newState.toString());
            const statusSpan = drumsToggle.querySelector('.status');
            if (statusSpan) {
                statusSpan.textContent = newState ? 'ON' : 'OFF';
            }
            this.musicEngine.setDrums(newState);
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

        // Color control sliders
        const colorHueSlider = document.getElementById('colorHue');
        const colorHueValue = document.getElementById('colorHueValue');
        colorHueSlider.addEventListener('input', (e) => {
            const hue = e.target.value / 360; // Convert 0-360 to 0.0-1.0
            colorHueValue.textContent = e.target.value;
            this.mainShader.setColorHue(hue);
            this.toyRenderer.setColorHue(hue);
        });

        const colorSaturationSlider = document.getElementById('colorSaturation');
        const colorSaturationValue = document.getElementById('colorSaturationValue');
        colorSaturationSlider.addEventListener('input', (e) => {
            const saturation = e.target.value / 100; // Convert 0-100 to 0.0-1.0
            colorSaturationValue.textContent = e.target.value + '%';
            this.mainShader.setColorSaturation(saturation);
            this.toyRenderer.setColorSaturation(saturation);
        });

        const colorBrightnessSlider = document.getElementById('colorBrightness');
        const colorBrightnessValue = document.getElementById('colorBrightnessValue');
        colorBrightnessSlider.addEventListener('input', (e) => {
            const brightness = e.target.value / 100; // Convert 0-200 to 0.0-2.0
            colorBrightnessValue.textContent = e.target.value;
            this.mainShader.setColorBrightness(brightness);
            this.toyRenderer.setColorBrightness(brightness);
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

        // Set dropdown values to current shader indices
        mainShaderSelect.value = this.mainShader.currentShaderIndex;
        toyShaderSelect.value = this.toyRenderer.currentShaderIndex;
        console.log(`  ✓ Set main shader dropdown to: ${this.mainShader.shaders[this.mainShader.currentShaderIndex].name} (index ${this.mainShader.currentShaderIndex})`);
        console.log(`  ✓ Set toy shader dropdown to: ${this.toyRenderer.shaders[this.toyRenderer.currentShaderIndex].name} (index ${this.toyRenderer.currentShaderIndex})`);

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
            const shaderEditorLeft = document.getElementById('shaderEditorLeft');

            console.log('📍 Elements found:', {
                controls: !!controls,
                debugOverlay: !!debugOverlay,
                shaderEditorLeft: !!shaderEditorLeft
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
                if (shaderEditorLeft) {
                    shaderEditorLeft.style.display = 'none';
                    console.log('  ↳ Shader editor hidden');
                }
            } else {
                // Exiting fullscreen - show controls (but NOT shader editor - user can toggle it)
                console.log('🖥️ ✅ EXITING FULLSCREEN - showing controls');
                if (controls) {
                    controls.style.display = 'block';
                    console.log('  ↳ Controls shown');
                }
                if (debugOverlay) {
                    debugOverlay.style.display = 'block';
                    console.log('  ↳ Debug overlay shown');
                }
                // Don't auto-show shader editor - let user toggle it manually
            }
        };

        // Add event listeners for all browser prefixes
        console.log('📝 Registering fullscreen event listeners...');
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);
        console.log('✅ Fullscreen event listeners registered');

        // Shader Editor Toggle Button (in right menu)
        const shaderEditorToggleBtn = document.getElementById('shaderEditorToggleBtn');
        const shaderEditorLeft = document.getElementById('shaderEditorLeft');
        const closeShaderEditor = document.getElementById('closeShaderEditor');

        if (shaderEditorToggleBtn && shaderEditorLeft) {
            shaderEditorToggleBtn.addEventListener('click', () => {
                const isHidden = shaderEditorLeft.style.display === 'none';
                if (isHidden) {
                    shaderEditorLeft.style.display = 'block';
                    console.log('📝 Shader editor opened');
                } else {
                    shaderEditorLeft.style.display = 'none';
                    console.log('📝 Shader editor closed');
                }
            });
            console.log('✅ Shader editor toggle button initialized');
        }

        // Shader Editor Close Button (X in upper corner)
        if (closeShaderEditor && shaderEditorLeft) {
            closeShaderEditor.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent drag from triggering
                shaderEditorLeft.style.display = 'none';
                console.log('📝 Shader editor closed via X button');
            });
            console.log('✅ Shader editor close button initialized');
        }

        // Make shader editor draggable
        const shaderEditorHeader = shaderEditorLeft?.querySelector('.editor-header');
        let shaderEditorDragging = false;
        let shaderEditorDragOffset = { x: 0, y: 0 };

        if (shaderEditorHeader && shaderEditorLeft) {
            // Change cursor to move on header (but not on buttons)
            shaderEditorHeader.style.cursor = 'move';

            // Prevent buttons from having move cursor
            const headerButtons = shaderEditorHeader.querySelectorAll('button');
            headerButtons.forEach(btn => {
                btn.style.cursor = 'pointer';
            });

            shaderEditorHeader.addEventListener('mousedown', (e) => {
                // Don't drag if clicking on buttons
                if (e.target.closest('button')) return;
                if (e.target.closest('svg')) return;

                shaderEditorDragging = true;
                const rect = shaderEditorLeft.getBoundingClientRect();
                shaderEditorDragOffset = {
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                };

                e.preventDefault();
                console.log('🖱️ Shader Editor drag started');
            });

            document.addEventListener('mousemove', (e) => {
                if (!shaderEditorDragging) return;

                requestAnimationFrame(() => {
                    const x = e.clientX - shaderEditorDragOffset.x;
                    const y = e.clientY - shaderEditorDragOffset.y;

                    const maxX = window.innerWidth - shaderEditorLeft.offsetWidth;
                    const maxY = window.innerHeight - shaderEditorLeft.offsetHeight;

                    shaderEditorLeft.style.left = `${Math.max(0, Math.min(x, maxX))}px`;
                    shaderEditorLeft.style.top = `${Math.max(0, Math.min(y, maxY))}px`;
                });
            });

            document.addEventListener('mouseup', () => {
                if (shaderEditorDragging) {
                    shaderEditorDragging = false;
                    console.log('🖱️ Shader Editor drag ended');
                }
            });

            console.log('✅ Shader editor draggable initialized');
        }

        // MPC Pad Controller
        this.setupMPCPads();

        // Synth Sequencer
        this.setupSynthSequencer();

        // Mode Toggle
        this.setupModeToggle();

        // Hand Tracking
        this.setupHandTracking();

        // Voice Control
        this.setupVoiceControl();

        // Voice Input & Effects
        this.setupVoiceInput();

        // Guitar Input & Effects
        this.setupGuitar();
    }

    setupVoiceControl() {
        console.log('🎤 Setting up Voice Control UI...');

        const openVoiceControlBtn = document.getElementById('openVoiceControl');
        const voiceControlPanel = document.getElementById('voiceControlPanel');
        const audioModeButtons = document.getElementById('audioModeButtons');
        const closeVoicePanel = document.getElementById('closeVoicePanel');
        const startVoiceControlBtn = document.getElementById('startVoiceControl');
        const stopVoiceControlBtn = document.getElementById('stopVoiceControl');
        const toggleVoiceFeedbackBtn = document.getElementById('toggleVoiceFeedback');
        const toggleAudioModesBtn = document.getElementById('toggleAudioModes');
        const toggleBeatboxModeBtn = document.getElementById('toggleBeatboxMode');
        const togglePitchModeBtn = document.getElementById('togglePitchMode');

        // Open voice control panel
        openVoiceControlBtn.addEventListener('click', () => {
            voiceControlPanel.style.display = 'block';
            audioModeButtons.style.display = 'block';
            console.log('🎤 Voice control panel opened');
        });

        // Close voice control panel
        closeVoicePanel.addEventListener('click', () => {
            voiceControlPanel.style.display = 'none';
            audioModeButtons.style.display = 'none';
            if (this.voiceControl && this.voiceControl.isListening) {
                this.voiceControl.stop();
                startVoiceControlBtn.style.display = 'flex';
                stopVoiceControlBtn.style.display = 'none';
            }
            console.log('🎤 Voice control panel closed');
        });

        // Start voice control
        startVoiceControlBtn.addEventListener('click', () => {
            if (this.voiceControl) {
                this.voiceControl.start();
                startVoiceControlBtn.style.display = 'none';
                stopVoiceControlBtn.style.display = 'flex';
                console.log('🎤 Voice control started');
            }
        });

        // Stop voice control
        stopVoiceControlBtn.addEventListener('click', () => {
            if (this.voiceControl) {
                this.voiceControl.stop();
                startVoiceControlBtn.style.display = 'flex';
                stopVoiceControlBtn.style.display = 'none';
                console.log('🎤 Voice control stopped');
            }
        });

        // Toggle voice feedback
        toggleVoiceFeedbackBtn.addEventListener('click', () => {
            if (this.voiceControl) {
                this.voiceControl.toggleVoiceFeedback();
                const icon = '<svg style="width: 14px; height: 14px; fill: currentColor;" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>';
                toggleVoiceFeedbackBtn.innerHTML = icon + (this.voiceControl.voiceFeedbackEnabled ? 'TTS On' : 'TTS Off');
            }
        });

        // Toggle audio modes panel
        toggleAudioModesBtn.addEventListener('click', () => {
            const isVisible = audioModeButtons.style.display === 'block';
            audioModeButtons.style.display = isVisible ? 'none' : 'block';
            console.log(`🎵 Audio modes panel ${isVisible ? 'hidden' : 'shown'}`);
        });

        // Toggle beatbox mode
        toggleBeatboxModeBtn.addEventListener('click', async () => {
            if (!this.voiceControl) return;

            if (!this.voiceControl.beatboxMode) {
                // Start beatbox mode
                await this.voiceControl.commands.simple['START BEATBOX MODE']();
                toggleBeatboxModeBtn.setAttribute('data-active', 'true');
                toggleBeatboxModeBtn.querySelector('.mode-label').textContent = '🥁 Beatbox Mode';
                toggleBeatboxModeBtn.querySelector('.mode-status').textContent = 'ON';
                console.log('🥁 Beatbox mode enabled via button');
            } else {
                // Stop beatbox mode
                this.voiceControl.commands.simple['STOP BEATBOX MODE']();
                toggleBeatboxModeBtn.setAttribute('data-active', 'false');
                toggleBeatboxModeBtn.querySelector('.mode-label').textContent = 'Beatbox Mode';
                toggleBeatboxModeBtn.querySelector('.mode-status').textContent = 'OFF';
                console.log('🥁 Beatbox mode disabled via button');
            }
        });

        // Toggle pitch mode
        togglePitchModeBtn.addEventListener('click', async () => {
            if (!this.voiceControl) return;

            if (!this.voiceControl.pitchMode) {
                // Start pitch mode
                await this.voiceControl.commands.simple['START PITCH MODE']();
                togglePitchModeBtn.setAttribute('data-active', 'true');
                togglePitchModeBtn.querySelector('.mode-label').textContent = '🎶 Pitch Mode';
                togglePitchModeBtn.querySelector('.mode-status').textContent = 'ON';
                console.log('🎶 Pitch mode enabled via button');
            } else {
                // Stop pitch mode
                this.voiceControl.commands.simple['STOP PITCH MODE']();
                togglePitchModeBtn.setAttribute('data-active', 'false');
                togglePitchModeBtn.querySelector('.mode-label').textContent = 'Pitch Mode';
                togglePitchModeBtn.querySelector('.mode-status').textContent = 'OFF';
                console.log('🎶 Pitch mode disabled via button');
            }
        });

        // Make voice control panel draggable
        const voicePanelHeader = voiceControlPanel.querySelector('div'); // First div is the header
        let voicePanelDragging = false;
        let voicePanelDragOffset = { x: 0, y: 0 };

        voicePanelHeader.style.cursor = 'move';

        voicePanelHeader.addEventListener('mousedown', (e) => {
            if (e.target.closest('button')) return; // Don't drag when clicking close button

            voicePanelDragging = true;
            const rect = voiceControlPanel.getBoundingClientRect();
            voicePanelDragOffset = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };

            e.preventDefault();
            console.log('🖱️ Voice Control Panel drag started');
        });

        document.addEventListener('mousemove', (e) => {
            if (!voicePanelDragging) return;

            requestAnimationFrame(() => {
                const x = e.clientX - voicePanelDragOffset.x;
                const y = e.clientY - voicePanelDragOffset.y;

                const maxX = window.innerWidth - voiceControlPanel.offsetWidth;
                const maxY = window.innerHeight - voiceControlPanel.offsetHeight;

                voiceControlPanel.style.left = `${Math.max(0, Math.min(x, maxX))}px`;
                voiceControlPanel.style.top = `${Math.max(0, Math.min(y, maxY))}px`;
            });
        });

        document.addEventListener('mouseup', () => {
            if (voicePanelDragging) {
                voicePanelDragging = false;
                console.log('🖱️ Voice Control Panel drag ended');
            }
        });

        // Make audio modes panel draggable
        const audioModesPanel = audioModeButtons;
        const audioModesPanelHeader = audioModesPanel.querySelector('div > h4'); // The header with "Audio Modes"
        let audioModesDragging = false;
        let audioModesDragOffset = { x: 0, y: 0 };

        if (audioModesPanelHeader) {
            audioModesPanelHeader.style.cursor = 'move';
            audioModesPanelHeader.parentElement.style.cursor = 'move'; // Make the whole header div draggable

            audioModesPanelHeader.parentElement.addEventListener('mousedown', (e) => {
                if (e.target.closest('button')) return; // Don't drag when clicking buttons

                audioModesDragging = true;
                const rect = audioModesPanel.getBoundingClientRect();
                audioModesDragOffset = {
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                };

                e.preventDefault();
                console.log('🖱️ Audio Modes Panel drag started');
            });

            document.addEventListener('mousemove', (e) => {
                if (!audioModesDragging) return;

                requestAnimationFrame(() => {
                    const x = e.clientX - audioModesDragOffset.x;
                    const y = e.clientY - audioModesDragOffset.y;

                    const maxX = window.innerWidth - audioModesPanel.offsetWidth;
                    const maxY = window.innerHeight - audioModesPanel.offsetHeight;

                    audioModesPanel.style.left = `${Math.max(0, Math.min(x, maxX))}px`;
                    audioModesPanel.style.top = `${Math.max(0, Math.min(y, maxY))}px`;
                });
            });

            document.addEventListener('mouseup', () => {
                if (audioModesDragging) {
                    audioModesDragging = false;
                    console.log('🖱️ Audio Modes Panel drag ended');
                }
            });
        }
    }

    setupVoiceInput() {
        console.log('🎤 Setting up Voice Input & Effects UI...');

        const openVoiceInputBtn = document.getElementById('openVoiceInput');
        const voiceInputPanel = document.getElementById('voiceInputPanel');
        const closeVoiceInputBtn = document.getElementById('closeVoiceInput');
        const startVoiceInputBtn = document.getElementById('startVoiceInput');
        const stopVoiceInputBtn = document.getElementById('stopVoiceInput');
        const recordVoiceBtn = document.getElementById('recordVoice');
        const voiceInputStatus = document.getElementById('voiceInputStatus');
        const voiceInputLevel = document.getElementById('voiceInputLevel');

        // Open voice input panel
        openVoiceInputBtn.addEventListener('click', () => {
            voiceInputPanel.style.display = 'block';
            console.log('🎤 Voice input panel opened');
        });

        // Close voice input panel
        closeVoiceInputBtn.addEventListener('click', () => {
            voiceInputPanel.style.display = 'none';
            if (this.vocalEffects && this.vocalEffects.mic && this.vocalEffects.mic.state === 'started') {
                this.vocalEffects.stop();
                startVoiceInputBtn.style.display = 'block';
                stopVoiceInputBtn.style.display = 'none';
                recordVoiceBtn.style.display = 'none';
            }
            console.log('🎤 Voice input panel closed');
        });

        // Start microphone
        startVoiceInputBtn.addEventListener('click', async () => {
            try {
                // Initialize effects chain if not already done
                if (!this.vocalEffects.isInitialized) {
                    voiceInputStatus.textContent = '⏳ Initializing audio effects...';
                    voiceInputStatus.style.background = 'rgba(251, 191, 36, 0.1)';
                    voiceInputStatus.style.borderColor = 'rgba(251, 191, 36, 0.3)';
                    voiceInputStatus.style.color = 'rgba(252, 211, 77, 0.8)';

                    await this.vocalEffects.init();
                }

                // Start microphone
                voiceInputStatus.textContent = '⏳ Opening microphone...';
                await this.vocalEffects.start();

                // Update UI
                voiceInputStatus.innerHTML = '<div style="color: #10b981;">✅ Microphone Active</div>';
                voiceInputStatus.style.background = 'rgba(16, 185, 129, 0.1)';
                voiceInputStatus.style.borderColor = 'rgba(16, 185, 129, 0.3)';
                startVoiceInputBtn.style.display = 'none';
                stopVoiceInputBtn.style.display = 'block';
                recordVoiceBtn.style.display = 'block';

                // Start monitoring input level
                this.startVoiceInputMonitoring();

                console.log('✅ Voice input started');
            } catch (error) {
                console.error('❌ Failed to start voice input:', error);
                voiceInputStatus.innerHTML = '<div style="color: #ef4444;">❌ Microphone access denied</div>';
                voiceInputStatus.style.background = 'rgba(239, 68, 68, 0.1)';
                voiceInputStatus.style.borderColor = 'rgba(239, 68, 68, 0.3)';
            }
        });

        // Stop microphone
        stopVoiceInputBtn.addEventListener('click', () => {
            this.vocalEffects.stop();
            this.stopVoiceInputMonitoring();

            voiceInputStatus.innerHTML = '🎤 Microphone Off';
            voiceInputStatus.style.background = 'rgba(239, 68, 68, 0.1)';
            voiceInputStatus.style.borderColor = 'rgba(239, 68, 68, 0.3)';
            voiceInputStatus.style.color = 'rgba(248, 113, 113, 0.8)';
            startVoiceInputBtn.style.display = 'block';
            stopVoiceInputBtn.style.display = 'none';
            recordVoiceBtn.style.display = 'none';
            voiceInputLevel.style.width = '0%';

            console.log('⏹️ Voice input stopped');
        });

        // Record button
        recordVoiceBtn.addEventListener('click', async () => {
            if (!this.vocalEffects.isRecording) {
                // Start recording
                await this.vocalEffects.startRecording();
                recordVoiceBtn.textContent = '⏹️ Stop Recording';
                recordVoiceBtn.style.background = 'rgba(99, 102, 241, 0.6)';
                console.log('🔴 Voice recording started');
            } else {
                // Stop recording
                const blob = await this.vocalEffects.stopRecording();
                recordVoiceBtn.textContent = '🔴 Record';
                recordVoiceBtn.style.background = 'rgba(239, 68, 68, 0.6)';

                // Download recording
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `mesmer-vocal-${Date.now()}.webm`;
                a.click();
                URL.revokeObjectURL(url);

                console.log('💾 Voice recording saved');
            }
        });

        // Preset selector
        const voicePresetSelect = document.getElementById('voicePresetSelect');
        voicePresetSelect.addEventListener('change', (e) => {
            this.vocalEffects.loadPreset(e.target.value);
            console.log(`🎹 Vocal preset changed to: ${e.target.value}`);
        });

        // Auto-tune enable
        const autoTuneEnable = document.getElementById('autoTuneEnable');
        autoTuneEnable.addEventListener('change', (e) => {
            this.vocalEffects.setAutoTuneEnabled(e.target.checked);
        });

        // Auto-tune strength
        const autoTuneStrength = document.getElementById('autoTuneStrength');
        const autoTuneStrengthValue = document.getElementById('autoTuneStrengthValue');
        autoTuneStrength.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.vocalEffects.setAutoTuneStrength(value / 100);
            autoTuneStrengthValue.textContent = `${value}%`;
        });

        // Auto-tune scale
        const autoTuneRoot = document.getElementById('autoTuneRoot');
        const autoTuneScale = document.getElementById('autoTuneScale');
        autoTuneRoot.addEventListener('change', () => {
            this.vocalEffects.setScale(autoTuneRoot.value, autoTuneScale.value);
        });
        autoTuneScale.addEventListener('change', () => {
            this.vocalEffects.setScale(autoTuneRoot.value, autoTuneScale.value);
        });

        // Distortion enable
        const distortionEnable = document.getElementById('distortionEnable');
        distortionEnable.addEventListener('change', (e) => {
            this.vocalEffects.setDistortionEnabled(e.target.checked);
        });

        // Distortion amount
        const distortionAmount = document.getElementById('distortionAmount');
        const distortionValue = document.getElementById('distortionValue');
        distortionAmount.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.vocalEffects.setDistortionAmount(value / 100);
            distortionValue.textContent = `${value}%`;
        });

        // Chorus enable
        const chorusEnable = document.getElementById('chorusEnable');
        chorusEnable.addEventListener('change', (e) => {
            this.vocalEffects.setChorusEnabled(e.target.checked);
        });

        // Chorus depth
        const chorusDepth = document.getElementById('chorusDepth');
        const chorusValue = document.getElementById('chorusValue');
        chorusDepth.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.vocalEffects.setChorusDepth(value / 100);
            chorusValue.textContent = `${value}%`;
        });

        // Reverb mix
        const voiceReverbMix = document.getElementById('voiceReverbMix');
        const voiceReverbValue = document.getElementById('voiceReverbValue');
        voiceReverbMix.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.vocalEffects.setReverbMix(value);
            voiceReverbValue.textContent = `${value}%`;
        });

        // Delay mix
        const voiceDelayMix = document.getElementById('voiceDelayMix');
        const voiceDelayValue = document.getElementById('voiceDelayValue');
        voiceDelayMix.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.vocalEffects.setDelayMix(value);
            voiceDelayValue.textContent = `${value}%`;
        });

        // Compression enable
        const compressionEnable = document.getElementById('compressionEnable');
        compressionEnable.addEventListener('change', (e) => {
            this.vocalEffects.setCompressionEnabled(e.target.checked);
        });

        // Input gain
        const voiceInputGain = document.getElementById('voiceInputGain');
        const inputGainValue = document.getElementById('inputGainValue');
        voiceInputGain.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.vocalEffects.setInputGain(value / 100);
            inputGainValue.textContent = `${value}%`;
        });

        // Output gain
        const voiceOutputGain = document.getElementById('voiceOutputGain');
        const outputGainValue = document.getElementById('outputGainValue');
        voiceOutputGain.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.vocalEffects.setOutputGain(value / 100);
            outputGainValue.textContent = `${value}%`;
        });

        console.log('✅ Voice Input & Effects UI ready');
    }

    // Monitor voice input level
    startVoiceInputMonitoring() {
        if (this.voiceInputMonitorInterval) return;

        const voiceInputLevel = document.getElementById('voiceInputLevel');

        this.voiceInputMonitorInterval = setInterval(() => {
            if (!this.vocalEffects || !this.vocalEffects.mic || this.vocalEffects.mic.state !== 'started') {
                return;
            }

            const level = this.vocalEffects.getInputLevel();
            const percentage = Math.min(100, level * 200); // Scale up for visibility
            voiceInputLevel.style.width = `${percentage}%`;
        }, 50); // Update every 50ms
    }

    stopVoiceInputMonitoring() {
        if (this.voiceInputMonitorInterval) {
            clearInterval(this.voiceInputMonitorInterval);
            this.voiceInputMonitorInterval = null;
        }
    }

    setupGuitar() {
        console.log('🎸 Setting up Guitar Pedalboard UI...');

        const openGuitarBtn = document.getElementById('openGuitar');
        const guitarPanel = document.getElementById('guitarPedalboardPanel');
        const closeGuitarBtn = document.getElementById('closeGuitarPedalboard');
        const startGuitarBtn = document.getElementById('startGuitar');
        const stopGuitarBtn = document.getElementById('stopGuitar');
        const recordGuitarBtn = document.getElementById('recordGuitar');
        const toggleTunerBtn = document.getElementById('toggleTuner');
        const guitarInputStatus = document.getElementById('guitarInputStatus');
        const guitarInputLevel = document.getElementById('guitarInputLevel');
        const guitarTuner = document.getElementById('guitarTuner');

        // Open guitar panel
        openGuitarBtn.addEventListener('click', () => {
            guitarPanel.style.display = 'block';
            console.log('🎸 Guitar pedalboard panel opened');
        });

        // Close guitar panel
        closeGuitarBtn.addEventListener('click', () => {
            guitarPanel.style.display = 'none';
            if (this.guitarEffects && this.guitarEffects.audioInput && this.guitarEffects.audioInput.state === 'started') {
                this.guitarEffects.stop();
                startGuitarBtn.style.display = 'block';
                stopGuitarBtn.style.display = 'none';
                recordGuitarBtn.style.display = 'none';
                toggleTunerBtn.style.display = 'none';
            }
            console.log('🎸 Guitar pedalboard panel closed');
        });

        // Start guitar input
        startGuitarBtn.addEventListener('click', async () => {
            try {
                // Initialize effects chain if not already done
                if (!this.guitarEffects.isInitialized) {
                    guitarInputStatus.textContent = '⏳ Initializing guitar effects...';
                    guitarInputStatus.style.background = 'rgba(251, 191, 36, 0.1)';
                    guitarInputStatus.style.borderColor = 'rgba(251, 191, 36, 0.3)';
                    guitarInputStatus.style.color = 'rgba(252, 211, 77, 0.8)';

                    await this.guitarEffects.init();
                }

                // Start guitar input
                guitarInputStatus.textContent = '⏳ Opening guitar input...';
                await this.guitarEffects.start();

                // Update UI
                guitarInputStatus.innerHTML = '<div style="color: #10b981;">✅ Guitar Input Active</div>';
                guitarInputStatus.style.background = 'rgba(16, 185, 129, 0.1)';
                guitarInputStatus.style.borderColor = 'rgba(16, 185, 129, 0.3)';
                startGuitarBtn.style.display = 'none';
                stopGuitarBtn.style.display = 'block';
                recordGuitarBtn.style.display = 'block';
                toggleTunerBtn.style.display = 'block';

                // Start monitoring input level
                this.startGuitarInputMonitoring();

                console.log('✅ Guitar input started');
            } catch (error) {
                console.error('❌ Failed to start guitar input:', error);
                guitarInputStatus.innerHTML = '<div style="color: #ef4444;">❌ Guitar input access denied</div>';
                guitarInputStatus.style.background = 'rgba(239, 68, 68, 0.1)';
                guitarInputStatus.style.borderColor = 'rgba(239, 68, 68, 0.3)';
            }
        });

        // Stop guitar input
        stopGuitarBtn.addEventListener('click', () => {
            this.guitarEffects.stop();
            this.stopGuitarInputMonitoring();
            this.stopGuitarTuner();

            guitarInputStatus.innerHTML = '🎸 Guitar Input Off';
            guitarInputStatus.style.background = 'rgba(239, 68, 68, 0.1)';
            guitarInputStatus.style.borderColor = 'rgba(239, 68, 68, 0.3)';
            guitarInputStatus.style.color = 'rgba(248, 113, 113, 0.8)';
            startGuitarBtn.style.display = 'block';
            stopGuitarBtn.style.display = 'none';
            recordGuitarBtn.style.display = 'none';
            toggleTunerBtn.style.display = 'none';
            guitarInputLevel.style.width = '0%';
            guitarTuner.style.display = 'none';

            console.log('⏹️ Guitar input stopped');
        });

        // Record button
        recordGuitarBtn.addEventListener('click', async () => {
            if (!this.guitarEffects.isRecording) {
                // Start recording
                await this.guitarEffects.startRecording();
                recordGuitarBtn.textContent = '⏹️ Stop Recording';
                recordGuitarBtn.style.background = 'rgba(99, 102, 241, 0.6)';
                console.log('🔴 Guitar recording started');
            } else {
                // Stop recording
                const blob = await this.guitarEffects.stopRecording();
                recordGuitarBtn.textContent = '🔴 Record';
                recordGuitarBtn.style.background = 'rgba(239, 68, 68, 0.6)';

                // Download recording
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `mesmer-guitar-${Date.now()}.webm`;
                a.click();
                URL.revokeObjectURL(url);

                console.log('💾 Guitar recording saved');
            }
        });

        // Toggle tuner
        toggleTunerBtn.addEventListener('click', () => {
            if (guitarTuner.style.display === 'none') {
                guitarTuner.style.display = 'block';
                this.startGuitarTuner();
                toggleTunerBtn.style.background = 'rgba(99, 102, 241, 0.6)';
                console.log('🎵 Guitar tuner enabled');
            } else {
                guitarTuner.style.display = 'none';
                this.stopGuitarTuner();
                toggleTunerBtn.style.background = 'rgba(255, 87, 34, 0.6)';
                console.log('🎵 Guitar tuner disabled');
            }
        });

        // Preset selector
        const presetSelect = document.getElementById('guitarPresetSelect');
        presetSelect.addEventListener('change', (e) => {
            this.guitarEffects.loadPreset(e.target.value);
            console.log(`🎸 Guitar preset changed to: ${e.target.value}`);
        });

        // Compressor
        const compressorEnable = document.getElementById('compressorEnable');
        const compressorThreshold = document.getElementById('compressorThreshold');
        compressorEnable.addEventListener('change', (e) => {
            this.guitarEffects.setCompressorEnabled(e.target.checked);
        });
        compressorThreshold.addEventListener('input', (e) => {
            this.guitarEffects.setCompressorThreshold(parseFloat(e.target.value));
        });

        // Wah
        const wahEnable = document.getElementById('wahEnable');
        const wahFrequency = document.getElementById('wahFrequency');
        wahEnable.addEventListener('change', (e) => {
            this.guitarEffects.setWahEnabled(e.target.checked);
        });
        wahFrequency.addEventListener('input', (e) => {
            this.guitarEffects.setWahFrequency(parseFloat(e.target.value));
        });

        // Overdrive
        const overdriveEnable = document.getElementById('overdriveEnable');
        const overdriveAmount = document.getElementById('overdriveAmount');
        overdriveEnable.addEventListener('change', (e) => {
            this.guitarEffects.setOverdriveEnabled(e.target.checked);
        });
        overdriveAmount.addEventListener('input', (e) => {
            this.guitarEffects.setOverdriveAmount(parseInt(e.target.value) / 100);
        });

        // Distortion
        const distortionEnable = document.getElementById('distortionEnable');
        const guitarDistortionAmount = document.getElementById('guitarDistortionAmount');
        distortionEnable.addEventListener('change', (e) => {
            this.guitarEffects.setDistortionEnabled(e.target.checked);
        });
        guitarDistortionAmount.addEventListener('input', (e) => {
            this.guitarEffects.setDistortionAmount(parseInt(e.target.value) / 100);
        });

        // Fuzz
        const fuzzEnable = document.getElementById('fuzzEnable');
        const fuzzAmount = document.getElementById('fuzzAmount');
        fuzzEnable.addEventListener('change', (e) => {
            this.guitarEffects.setFuzzEnabled(e.target.checked);
        });
        fuzzAmount.addEventListener('input', (e) => {
            this.guitarEffects.setFuzzAmount(parseInt(e.target.value) / 100);
        });

        // Chorus
        const guitarChorusEnable = document.getElementById('guitarChorusEnable');
        const guitarChorusDepth = document.getElementById('guitarChorusDepth');
        guitarChorusEnable.addEventListener('change', (e) => {
            this.guitarEffects.setChorusEnabled(e.target.checked);
        });
        guitarChorusDepth.addEventListener('input', (e) => {
            this.guitarEffects.setChorusDepth(parseInt(e.target.value) / 100);
        });

        // Phaser
        const phaserEnable = document.getElementById('phaserEnable');
        const phaserFrequency = document.getElementById('phaserFrequency');
        phaserEnable.addEventListener('change', (e) => {
            this.guitarEffects.setPhaserEnabled(e.target.checked);
        });
        phaserFrequency.addEventListener('input', (e) => {
            this.guitarEffects.setPhaserRate(parseFloat(e.target.value) / 100);
        });

        // Delay
        const guitarDelayMix = document.getElementById('guitarDelayMix');
        const delayFeedback = document.getElementById('delayFeedback');
        guitarDelayMix.addEventListener('input', (e) => {
            this.guitarEffects.setDelayMix(parseInt(e.target.value));
        });
        delayFeedback.addEventListener('input', (e) => {
            this.guitarEffects.setDelayFeedback(parseInt(e.target.value) / 100);
        });

        // Reverb
        const guitarReverbMix = document.getElementById('guitarReverbMix');
        guitarReverbMix.addEventListener('input', (e) => {
            this.guitarEffects.setReverbMix(parseInt(e.target.value));
        });

        // EQ
        const eqEnable = document.getElementById('eqEnable');
        const eqBass = document.getElementById('eqBass');
        const eqMid = document.getElementById('eqMid');
        const eqTreble = document.getElementById('eqTreble');
        eqEnable.addEventListener('change', (e) => {
            this.guitarEffects.setEQEnabled(e.target.checked);
        });
        eqBass.addEventListener('input', (e) => {
            this.guitarEffects.setEQBass(parseInt(e.target.value));
        });
        eqMid.addEventListener('input', (e) => {
            this.guitarEffects.setEQMid(parseInt(e.target.value));
        });
        eqTreble.addEventListener('input', (e) => {
            this.guitarEffects.setEQTreble(parseInt(e.target.value));
        });

        // Output volume
        const guitarOutputGain = document.getElementById('guitarOutputGain');
        guitarOutputGain.addEventListener('input', (e) => {
            this.guitarEffects.setOutputVolume(parseInt(e.target.value) / 100);
        });

        console.log('✅ Guitar Pedalboard UI ready');
    }

    // Monitor guitar input level
    startGuitarInputMonitoring() {
        if (this.guitarInputMonitorInterval) return;

        const guitarInputLevel = document.getElementById('guitarInputLevel');

        this.guitarInputMonitorInterval = setInterval(() => {
            if (!this.guitarEffects || !this.guitarEffects.audioInput || this.guitarEffects.audioInput.state !== 'started') {
                return;
            }

            const level = this.guitarEffects.getInputLevel();
            const percentage = Math.min(100, level * 200); // Scale up for visibility
            guitarInputLevel.style.width = `${percentage}%`;
        }, 50); // Update every 50ms
    }

    stopGuitarInputMonitoring() {
        if (this.guitarInputMonitorInterval) {
            clearInterval(this.guitarInputMonitorInterval);
            this.guitarInputMonitorInterval = null;
        }
    }

    // Guitar tuner
    startGuitarTuner() {
        if (this.guitarTunerInterval) return;

        const tunerNote = document.getElementById('tunerNote');
        const tunerFreq = document.getElementById('tunerFreq');
        const tunerCents = document.getElementById('tunerCents');

        this.guitarTunerInterval = setInterval(() => {
            if (!this.guitarEffects || !this.guitarEffects.audioInput || this.guitarEffects.audioInput.state !== 'started') {
                return;
            }

            const pitch = this.guitarEffects.detectPitch();
            if (pitch) {
                tunerNote.textContent = pitch.note;
                tunerFreq.textContent = `${pitch.frequency.toFixed(1)} Hz`;
                tunerCents.textContent = `${pitch.cents >= 0 ? '+' : ''}${pitch.cents} cents`;

                // Color code based on accuracy
                if (Math.abs(pitch.cents) < 5) {
                    tunerCents.style.color = '#10b981'; // Green - in tune
                } else if (Math.abs(pitch.cents) < 15) {
                    tunerCents.style.color = '#fbbf24'; // Yellow - close
                } else {
                    tunerCents.style.color = '#ef4444'; // Red - out of tune
                }
            }
        }, 100); // Update every 100ms
    }

    stopGuitarTuner() {
        if (this.guitarTunerInterval) {
            clearInterval(this.guitarTunerInterval);
            this.guitarTunerInterval = null;
        }
    }

    setupHandTracking() {
        console.log('👋 Setting up Hand Tracking UI...');

        const openHandTrackingBtn = document.getElementById('openHandTracking');
        const handTrackingPanel = document.getElementById('handTrackingPanel');
        const closeHandTrackingBtn = document.getElementById('closeHandTracking');
        const startHandTrackingBtn = document.getElementById('startHandTracking');
        const stopHandTrackingBtn = document.getElementById('stopHandTracking');
        const toggleVideoBtn = document.getElementById('toggleVideo');
        const toggleSkeletonBtn = document.getElementById('toggleSkeleton');
        const videoElement = document.getElementById('handTrackingVideo');
        const canvasElement = document.getElementById('handTrackingCanvas');
        const statusElement = document.getElementById('gestureStatus');

        // Open hand tracking panel
        openHandTrackingBtn.addEventListener('click', () => {
            handTrackingPanel.style.display = 'block';
            console.log('👋 Hand tracking panel opened');
        });

        // Projector Mode button
        const projectorModeBtn = document.getElementById('projectorModeBtn');
        if (projectorModeBtn) {
            projectorModeBtn.addEventListener('click', () => {
                this.projectorManager.toggle();

                // Update button appearance
                if (this.projectorManager.isProjectorActive()) {
                    projectorModeBtn.style.background = 'rgba(139, 92, 246, 0.8)';
                    projectorModeBtn.style.borderColor = 'rgba(167, 139, 250, 1)';
                    console.log('🎬 Projector mode activated');
                } else {
                    projectorModeBtn.style.background = '';
                    projectorModeBtn.style.borderColor = '';
                    console.log('🎬 Projector mode deactivated');
                }
            });
        }

        // Face Emotion Tracking button
        const faceTrackingBtn = document.getElementById('faceTrackingBtn');
        console.log('🎭 Face tracking button element:', faceTrackingBtn);
        if (faceTrackingBtn) {
            console.log('✅ Face tracking button found, adding event listener');
            let faceInitialized = false;
            let emotionUpdateInterval = null;

            // Emotion emoji mapping
            const emotionEmojis = {
                happy: '😊',
                sad: '😢',
                angry: '😠',
                surprised: '😲',
                neutral: '😐'
            };

            faceTrackingBtn.addEventListener('click', async () => {
                console.log('🎭 Face tracking button clicked!');
                try {
                    // Get video and canvas elements
                    const video = document.getElementById('handTrackingVideo');
                    const canvas = document.getElementById('handTrackingCanvas');

                    // Auto-start camera if needed
                    if (!video || video.readyState < 2 || video.videoWidth === 0) {
                        console.log('📹 Camera not active, auto-starting...');

                        // Open hand tracking panel if closed
                        if (handTrackingPanel.style.display === 'none') {
                            handTrackingPanel.style.display = 'block';
                            console.log('✅ Hand tracking panel opened');
                        }

                        // Start camera if not started
                        if (!video || video.readyState < 2) {
                            statusElement.textContent = 'Starting camera for face tracking...';

                            // Initialize hand tracking if needed (for camera access)
                            if (!this.handTracking.isInitialized) {
                                await this.handTracking.init();
                            }

                            // Setup video
                            await this.handTracking.setupVideo(videoElement, canvasElement);

                            // Update UI to show camera is active
                            startHandTrackingBtn.style.display = 'none';
                            stopHandTrackingBtn.style.display = 'block';
                            statusElement.innerHTML = '<div style="color: #00ff00;">✅ Camera active for face tracking!</div>';

                            console.log('✅ Camera started for face tracking');

                            // Wait a moment for video to stabilize
                            await new Promise(resolve => setTimeout(resolve, 500));
                        }
                    }

                    // Initialize face tracking on first click
                    if (!faceInitialized) {
                        console.log('🎭 Initializing face tracking...');
                        await this.faceTracking.init();
                        this.faceTracking.setupVideo(video, canvas);
                        faceInitialized = true;
                        console.log('✅ Face tracking initialized');
                    }

                    // Toggle face tracking
                    const wasEnabled = this.faceTracking.enabled;
                    const isActive = this.faceTracking.toggle();

                    // If toggle failed (e.g., video not ready), don't update UI
                    if (!wasEnabled && !isActive) {
                        console.log('⚠️ Face tracking failed to start');
                        return;
                    }

                    // Update button appearance and emotion overlay
                    const emotionOverlay = document.getElementById('emotionOverlay');
                    const emotionEmoji = document.getElementById('emotionEmoji');
                    const emotionText = document.getElementById('emotionText');
                    const emotionConfidence = document.getElementById('emotionConfidence');

                    if (isActive) {
                        faceTrackingBtn.style.background = 'rgba(139, 92, 246, 0.8)';
                        faceTrackingBtn.style.borderColor = 'rgba(167, 139, 250, 1)';
                        console.log('🎭 Face emotion tracking activated');

                        // Show emotion overlay
                        if (emotionOverlay) emotionOverlay.style.display = 'block';

                        // Start emotion display update loop
                        emotionUpdateInterval = setInterval(() => {
                            if (this.faceTracking && this.faceTracking.enabled) {
                                const emotionData = this.faceTracking.getCurrentEmotion();
                                const emotion = emotionData.emotion;
                                const confidence = emotionData.confidence;

                                // Update overlay
                                if (emotionEmoji) emotionEmoji.textContent = emotionEmojis[emotion] || '😐';
                                if (emotionText) emotionText.textContent = emotion.charAt(0).toUpperCase() + emotion.slice(1);
                                if (emotionConfidence) emotionConfidence.textContent = Math.round(confidence * 100) + '%';
                            }
                        }, 200);  // Update 5x per second
                    } else {
                        faceTrackingBtn.style.background = '';
                        faceTrackingBtn.style.borderColor = '';
                        console.log('🎭 Face emotion tracking deactivated');

                        // Hide emotion overlay
                        if (emotionOverlay) emotionOverlay.style.display = 'none';

                        // Stop emotion display update loop
                        if (emotionUpdateInterval) {
                            clearInterval(emotionUpdateInterval);
                            emotionUpdateInterval = null;
                        }
                    }
                } catch (error) {
                    console.error('❌ Face tracking error:', error);
                    alert('Failed to initialize face tracking: ' + error.message);
                }
            });
        }

        // Close hand tracking panel
        closeHandTrackingBtn.addEventListener('click', () => {
            handTrackingPanel.style.display = 'none';
            console.log('👋 Hand tracking panel closed');
        });

        // Start hand tracking
        startHandTrackingBtn.addEventListener('click', async () => {
            try {
                startHandTrackingBtn.disabled = true;
                statusElement.textContent = 'Initializing MediaPipe...';

                // Initialize MediaPipe if not already done
                if (!this.handTracking.isInitialized) {
                    await this.handTracking.init();
                }

                statusElement.textContent = 'Requesting camera access...';

                // Setup video and start tracking
                await this.handTracking.setupVideo(videoElement, canvasElement);
                this.handTracking.start();

                // Update UI
                startHandTrackingBtn.style.display = 'none';
                stopHandTrackingBtn.style.display = 'block';
                statusElement.innerHTML = '<div style="color: #00ff00;">✅ Hand tracking active!</div>';

                // Update active preset display
                if (this.handTracking && this.handTracking.updateActivePresetDisplay) {
                    this.handTracking.updateActivePresetDisplay();
                }

                console.log('✅ Hand tracking started');
            } catch (error) {
                console.error('❌ Failed to start hand tracking:', error);
                statusElement.innerHTML = `<div style="color: #ff0000;">❌ Error: ${error.message}</div>`;
                startHandTrackingBtn.disabled = false;
            }
        });

        // Stop hand tracking
        stopHandTrackingBtn.addEventListener('click', () => {
            this.handTracking.stop();

            // Update UI
            stopHandTrackingBtn.style.display = 'none';
            startHandTrackingBtn.style.display = 'block';
            startHandTrackingBtn.disabled = false;
            statusElement.innerHTML = '<div style="color: #ffff00;">⏸️ Hand tracking stopped</div>';

            console.log('⏸️ Hand tracking stopped');
        });

        // Toggle video visibility
        toggleVideoBtn.addEventListener('click', () => {
            this.handTracking.toggleVideo();
            const status = this.handTracking.getStatus();
            toggleVideoBtn.style.opacity = status.showVideo ? '1' : '0.5';
            console.log(`📹 Video ${status.showVideo ? 'shown' : 'hidden'}`);
        });

        // Toggle skeleton visibility
        toggleSkeletonBtn.addEventListener('click', () => {
            this.handTracking.toggleLandmarks();
            const status = this.handTracking.getStatus();
            toggleSkeletonBtn.style.opacity = status.drawLandmarks ? '1' : '0.5';
            console.log(`✋ Skeleton ${status.drawLandmarks ? 'shown' : 'hidden'}`);
        });

        // Gesture Guide Panel controls
        const toggleGestureGuideBtn = document.getElementById('toggleGestureGuide');
        const gestureGuidePanel = document.getElementById('gestureGuidePanel');
        const closeGestureGuideBtn = document.getElementById('closeGestureGuide');

        // Toggle gesture guide panel
        toggleGestureGuideBtn.addEventListener('click', () => {
            const isVisible = gestureGuidePanel.style.display === 'block';
            gestureGuidePanel.style.display = isVisible ? 'none' : 'block';
            console.log(`📖 Gesture guide ${isVisible ? 'closed' : 'opened'}`);
        });

        // Close gesture guide panel
        closeGestureGuideBtn.addEventListener('click', () => {
            gestureGuidePanel.style.display = 'none';
            console.log('📖 Gesture guide closed');
        });

        // Hold Toggle for looping notes/arpeggios
        const holdToggle = document.getElementById('holdToggle');
        const holdIcon = document.getElementById('holdIcon');
        const holdLabel = document.getElementById('holdLabel');
        let holdEnabled = false;

        holdToggle.addEventListener('click', () => {
            holdEnabled = !holdEnabled;

            if (holdEnabled) {
                holdToggle.style.background = 'rgba(139, 92, 246, 0.8)';
                holdIcon.textContent = '🔄';
                holdLabel.textContent = 'Hold: ON (Notes loop)';
                console.log('🔄 Hold mode enabled - notes/arpeggios will loop');
            } else {
                holdToggle.style.background = 'rgba(139, 92, 246, 0.3)';
                holdIcon.textContent = '🔁';
                holdLabel.textContent = 'Hold: OFF (Notes play once)';
                console.log('🔁 Hold mode disabled - notes/arpeggios play once');
            }

            // Update the chord engine if it exists
            if (this.chordEngine) {
                this.chordEngine.setHoldMode(holdEnabled);
            }

            // Stop all active loops when disabling hold mode
            if (!holdEnabled && this.gestureMusicMapper) {
                this.gestureMusicMapper.stopAllLoops();
            }
        });

        // Make hand tracking panel draggable
        const handPanelHeader = handTrackingPanel.querySelector('div'); // First div is the header
        let handPanelDragging = false;
        let handPanelDragOffset = { x: 0, y: 0 };

        handPanelHeader.style.cursor = 'move';

        handPanelHeader.addEventListener('mousedown', (e) => {
            if (e.target.closest('button')) return; // Don't drag when clicking close button

            handPanelDragging = true;
            const rect = handTrackingPanel.getBoundingClientRect();
            handPanelDragOffset = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };

            e.preventDefault();
            console.log('🖱️ Hand Tracking Panel drag started');
        });

        document.addEventListener('mousemove', (e) => {
            if (!handPanelDragging) return;

            requestAnimationFrame(() => {
                const x = e.clientX - handPanelDragOffset.x;
                const y = e.clientY - handPanelDragOffset.y;

                const maxX = window.innerWidth - handTrackingPanel.offsetWidth;
                const maxY = window.innerHeight - handTrackingPanel.offsetHeight;

                handTrackingPanel.style.left = `${Math.max(0, Math.min(x, maxX))}px`;
                handTrackingPanel.style.top = `${Math.max(0, Math.min(y, maxY))}px`;
            });
        });

        document.addEventListener('mouseup', () => {
            if (handPanelDragging) {
                handPanelDragging = false;
                console.log('🖱️ Hand Tracking Panel drag ended');
            }
        });

        // DJ Mode Setup
        const djToggle = document.getElementById('djToggle');
        const djModeSelect = document.getElementById('djModeSelect');
        const djControlPanel = document.getElementById('djControlPanel');
        const djVizCanvas = document.getElementById('djVizCanvas');
        const loadTrackButton = document.getElementById('loadTrackButton');
        const closeDJPanel = document.getElementById('closeDJPanel');
        const djFileInput = document.getElementById('djFileInput');
        const djDropZone = document.getElementById('djDropZone');

        if (djToggle) {
            djToggle.addEventListener('change', (e) => {
                this.handTracking.djMode = e.target.checked;
                this.djGestureController.setMode(this.handTracking.djModeType);

                if (e.target.checked) {
                    console.log('🎧 DJ Mode enabled');
                    djControlPanel.style.display = 'block';
                    djVizCanvas.style.display = 'block';
                    this.djFileLoader.createLoadingIndicator();
                } else {
                    console.log('🎧 DJ Mode disabled');
                    djControlPanel.style.display = 'none';
                    djVizCanvas.style.display = 'none';
                }
            });
        }

        if (djModeSelect) {
            djModeSelect.addEventListener('change', (e) => {
                const modeType = e.target.value;
                this.handTracking.djModeType = modeType;
                this.djGestureController.setMode(modeType);
                console.log(`🎧 DJ Mode type: ${modeType}`);
            });
        }

        if (loadTrackButton) {
            loadTrackButton.addEventListener('click', () => {
                this.djFileLoader.openFileBrowser();
            });
        }

        if (closeDJPanel) {
            closeDJPanel.addEventListener('click', () => {
                djControlPanel.style.display = 'none';
                djVizCanvas.style.display = 'none';
                if (djToggle) djToggle.checked = false;
                this.handTracking.djMode = false;
            });
        }

        if (djDropZone && djFileInput) {
            this.djFileLoader.setupDropZone(djDropZone);
            this.djFileLoader.setupFileInput(djFileInput);

            // Track loaded callback
            this.djFileLoader.onLoad((trackInfo) => {
                console.log('📀 Track loaded:', trackInfo);
                // Update UI with track info
                this.updateDJUI(trackInfo);
            });
        }

        console.log('✅ Hand tracking UI setup complete');
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
            rootNote: 'C3', // Root note of the key (with octave)
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
            dorian: ['C', 'D', 'Eb', 'F', 'G', 'A', 'Bb'],
            phrygian: ['C', 'Db', 'Eb', 'F', 'G', 'Ab', 'Bb'],
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
            // Left click: switch track
            btn.addEventListener('click', (e) => {
                if (e.button === 0) { // Left click only
                    trackBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.synthSeqState.currentTrack = btn.dataset.track;
                    this.renderPianoRoll();
                    console.log('🎹 Switched to track:', this.synthSeqState.currentTrack);
                }
            });

            // Right click: open preset selector
            btn.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.showPresetMenu(btn.dataset.track, e.clientX, e.clientY);
            });
        });

        // Control buttons
        document.getElementById('synthSeqPlay').addEventListener('click', () => {
            this.toggleSequencerPlayback();
        });

        document.getElementById('synthSeqClear').addEventListener('click', async () => {
            const wasPlaying = this.synthSeqState.isPlaying;

            // Stop playback if currently playing
            if (wasPlaying) {
                await this.toggleSequencerPlayback(); // Stop
            }

            // Clear the pattern
            this.synthSeqState.patterns[this.synthSeqState.currentTrack] = [];
            this.renderPianoRoll();
            console.log('🗑️ Cleared pattern for', this.synthSeqState.currentTrack);

            // Restart playback if it was playing (will be empty now)
            if (wasPlaying) {
                // Check if any other tracks have notes
                const hasNotes = ['pad', 'lead', 'bass', 'arp'].some(track =>
                    this.synthSeqState.patterns[track].length > 0
                );

                // Only restart if other tracks still have notes
                if (hasNotes) {
                    await this.toggleSequencerPlayback(); // Play
                }
            }
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

            // Toggle instrument group visibility
            this.toggleSequencerInstruments(this.synthSeqState.engine);

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
            const oldScale = this.synthSeqState.scale;
            const newScale = e.target.value;

            // Transpose notes to new scale
            this.transposeNotesToNewScale(oldScale, newScale);

            this.synthSeqState.scale = newScale;
            this.updateKeyDisplay();
            this.renderPianoRoll();
            console.log('🎼 Scale changed from', oldScale, 'to', newScale);
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

        // Import/Export buttons
        document.getElementById('synthSeqImportMidi').addEventListener('click', () => {
            document.getElementById('synthSeqMidiFileInput').click();
        });

        document.getElementById('synthSeqMidiFileInput').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.importMidiFile(file);
                // Reset input so same file can be selected again
                e.target.value = '';
            }
        });

        document.getElementById('synthSeqExportMidi').addEventListener('click', () => {
            this.exportPatternMidi();
        });

        document.getElementById('synthSeqExportWav').addEventListener('click', () => {
            this.exportPatternWav();
        });

        // Instrument preset changes - WAD Engine
        document.getElementById('seqWadPadPreset').addEventListener('change', (e) => {
            if (this.musicEngine.wadEngine) {
                this.musicEngine.wadEngine.changePreset('pad', e.target.value);
                console.log('🎹 WAD Pad preset changed to:', e.target.value);
            }
        });

        document.getElementById('seqWadLeadPreset').addEventListener('change', (e) => {
            if (this.musicEngine.wadEngine) {
                this.musicEngine.wadEngine.changePreset('lead', e.target.value);
                console.log('⚡ WAD Lead preset changed to:', e.target.value);
            }
        });

        document.getElementById('seqWadBassPreset').addEventListener('change', (e) => {
            if (this.musicEngine.wadEngine) {
                this.musicEngine.wadEngine.changePreset('bass', e.target.value);
                console.log('🔊 WAD Bass preset changed to:', e.target.value);
            }
        });

        document.getElementById('seqWadArpPreset').addEventListener('change', (e) => {
            if (this.musicEngine.wadEngine) {
                this.musicEngine.wadEngine.changePreset('arp', e.target.value);
                console.log('🎵 WAD Arp preset changed to:', e.target.value);
            }
        });

        // Instrument preset changes - Tone.js Engine
        // Note: Tone.js synths are created dynamically during playback
        // These settings will be used when creating synths
        document.getElementById('seqTonejsPadPreset').addEventListener('change', (e) => {
            this.synthSeqState.tonejsPresets = this.synthSeqState.tonejsPresets || {};
            this.synthSeqState.tonejsPresets.pad = e.target.value;
            console.log('🎹 Tone.js Pad waveform changed to:', e.target.value);

            // Update the actual instrument in the music engine
            if (this.musicEngine && this.musicEngine.instruments && this.musicEngine.instruments.pad) {
                const oldInstrument = this.musicEngine.instruments.pad;
                oldInstrument.dispose();

                // Create new synth with new waveform
                this.musicEngine.instruments.pad = new Tone.PolySynth(Tone.Synth, {
                    oscillator: { type: e.target.value },
                    envelope: { attack: 2, decay: 1, sustain: 0.7, release: 4 }
                }).connect(this.musicEngine.masterVolume);

                console.log('✅ Pad synth recreated with', e.target.value, 'waveform');
            }

            // Update preview synth with new waveform
            if (this.previewSynths && this.synthSeqState.engine === 'tonejs') {
                if (this.previewSynths.pad) this.previewSynths.pad.dispose();
                this.previewSynths.pad = new Tone.PolySynth(Tone.Synth, {
                    oscillator: { type: e.target.value },
                    envelope: { attack: 0.8, decay: 0.2, sustain: 0.5, release: 1.5 },
                    volume: -6
                }).toDestination();
                console.log('✅ Pad preview synth recreated with', e.target.value, 'waveform');
            }
        });

        document.getElementById('seqTonejsLeadPreset').addEventListener('change', (e) => {
            this.synthSeqState.tonejsPresets = this.synthSeqState.tonejsPresets || {};
            this.synthSeqState.tonejsPresets.lead = e.target.value;
            console.log('⚡ Tone.js Lead waveform changed to:', e.target.value);

            // Update the actual instrument in the music engine
            if (this.musicEngine && this.musicEngine.instruments && this.musicEngine.instruments.lead) {
                const oldInstrument = this.musicEngine.instruments.lead;
                oldInstrument.dispose();

                // Create new synth with new waveform
                this.musicEngine.instruments.lead = new Tone.Synth({
                    oscillator: { type: e.target.value },
                    envelope: { attack: 0.05, decay: 0.2, sustain: 0.3, release: 1 }
                }).connect(this.musicEngine.masterVolume);

                console.log('✅ Lead synth recreated with', e.target.value, 'waveform');
            }

            // Update preview synth with new waveform
            if (this.previewSynths && this.synthSeqState.engine === 'tonejs') {
                if (this.previewSynths.lead) this.previewSynths.lead.dispose();
                this.previewSynths.lead = new Tone.PolySynth(Tone.Synth, {
                    oscillator: { type: e.target.value },
                    envelope: { attack: 0.05, decay: 0.2, sustain: 0.4, release: 0.4 },
                    volume: -8
                }).toDestination();
                console.log('✅ Lead preview synth recreated with', e.target.value, 'waveform');
            }
        });

        document.getElementById('seqTonejsBassPreset').addEventListener('change', (e) => {
            this.synthSeqState.tonejsPresets = this.synthSeqState.tonejsPresets || {};
            this.synthSeqState.tonejsPresets.bass = e.target.value;
            console.log('🔊 Tone.js Bass waveform changed to:', e.target.value);

            // Update the actual instrument in the music engine
            if (this.musicEngine && this.musicEngine.instruments && this.musicEngine.instruments.bass) {
                const oldInstrument = this.musicEngine.instruments.bass;
                oldInstrument.dispose();

                // Create new synth with new waveform (MonoSynth for bass)
                this.musicEngine.instruments.bass = new Tone.MonoSynth({
                    oscillator: { type: e.target.value },
                    envelope: { attack: 0.1, decay: 0.3, sustain: 0.4, release: 0.8 },
                    filterEnvelope: {
                        attack: 0.05,
                        decay: 0.2,
                        sustain: 0.5,
                        release: 0.5,
                        baseFrequency: 100,
                        octaves: 2
                    }
                }).connect(this.musicEngine.masterVolume);

                console.log('✅ Bass synth recreated with', e.target.value, 'waveform');
            }

            // Update preview synth with new waveform
            if (this.previewSynths && this.synthSeqState.engine === 'tonejs') {
                if (this.previewSynths.bass) this.previewSynths.bass.dispose();
                this.previewSynths.bass = new Tone.PolySynth(Tone.Synth, {
                    oscillator: { type: e.target.value },
                    envelope: { attack: 0.02, decay: 0.3, sustain: 0.6, release: 0.5 },
                    volume: -3
                }).toDestination();
                console.log('✅ Bass preview synth recreated with', e.target.value, 'waveform');
            }
        });

        document.getElementById('seqTonejsArpPreset').addEventListener('change', (e) => {
            this.synthSeqState.tonejsPresets = this.synthSeqState.tonejsPresets || {};
            this.synthSeqState.tonejsPresets.arp = e.target.value;
            console.log('🎵 Tone.js Arp waveform changed to:', e.target.value);

            // Update the actual instrument in the music engine
            if (this.musicEngine && this.musicEngine.instruments && this.musicEngine.instruments.arp) {
                const oldInstrument = this.musicEngine.instruments.arp;
                oldInstrument.dispose();

                // Create new synth with new waveform
                this.musicEngine.instruments.arp = new Tone.Synth({
                    oscillator: { type: e.target.value },
                    envelope: { attack: 0.01, decay: 0.1, sustain: 0.05, release: 0.2 }
                }).connect(this.musicEngine.masterVolume);

                console.log('✅ Arp synth recreated with', e.target.value, 'waveform');
            }

            // Update preview synth with new waveform
            if (this.previewSynths && this.synthSeqState.engine === 'tonejs') {
                if (this.previewSynths.arp) this.previewSynths.arp.dispose();
                this.previewSynths.arp = new Tone.PolySynth(Tone.Synth, {
                    oscillator: { type: e.target.value },
                    envelope: { attack: 0.01, decay: 0.1, sustain: 0.2, release: 0.2 },
                    volume: -10
                }).toDestination();
                console.log('✅ Arp preview synth recreated with', e.target.value, 'waveform');
            }
        });

        // Instrument preset changes - Dirt Engine
        document.getElementById('seqDirtPadBank').addEventListener('change', (e) => {
            this.synthSeqState.dirtBanks = this.synthSeqState.dirtBanks || {};
            this.synthSeqState.dirtBanks.pad = e.target.value;
            console.log('🎹 Dirt Pad sample bank changed to:', e.target.value);
        });

        document.getElementById('seqDirtLeadBank').addEventListener('change', (e) => {
            this.synthSeqState.dirtBanks = this.synthSeqState.dirtBanks || {};
            this.synthSeqState.dirtBanks.lead = e.target.value;
            console.log('⚡ Dirt Lead sample bank changed to:', e.target.value);
        });

        document.getElementById('seqDirtBassBank').addEventListener('change', (e) => {
            this.synthSeqState.dirtBanks = this.synthSeqState.dirtBanks || {};
            this.synthSeqState.dirtBanks.bass = e.target.value;
            console.log('🔊 Dirt Bass sample bank changed to:', e.target.value);
        });

        document.getElementById('seqDirtArpBank').addEventListener('change', (e) => {
            this.synthSeqState.dirtBanks = this.synthSeqState.dirtBanks || {};
            this.synthSeqState.dirtBanks.arp = e.target.value;
            console.log('🎵 Dirt Arp sample bank changed to:', e.target.value);
        });

        // Set initial instrument visibility
        this.toggleSequencerInstruments(this.synthSeqState.engine);

        console.log('✅ Synth Sequencer initialized');
    }

    /**
     * Toggle synth sequencer instrument group visibility based on engine
     */
    toggleSequencerInstruments(engine) {
        const tonejsControls = document.querySelector('.tonejs-seq-controls');
        const wadControls = document.querySelector('.wad-seq-controls');
        const dirtControls = document.querySelector('.dirt-seq-controls');

        if (!tonejsControls || !wadControls || !dirtControls) {
            console.warn('⚠️ Sequencer instrument controls not found');
            return;
        }

        // Hide all
        tonejsControls.style.display = 'none';
        wadControls.style.display = 'none';
        dirtControls.style.display = 'none';

        // Show the selected engine's controls
        switch (engine) {
            case 'tonejs':
                tonejsControls.style.display = 'block';
                console.log('🎹 Showing Tone.js (Celestial) instruments');
                break;
            case 'wad':
                wadControls.style.display = 'block';
                console.log('🔥 Showing WAD (Magma) instruments');
                break;
            case 'dirt':
                dirtControls.style.display = 'block';
                console.log('💥 Showing Dirt (Chaos) instruments');
                break;
            default:
                tonejsControls.style.display = 'block';
                console.warn('⚠️ Unknown engine:', engine, '- defaulting to Tone.js');
        }
    }

    /**
     * Transpose existing notes when scale changes (Smart Transposition)
     * Maps notes based on scale degree position, preserving octave
     */
    transposeNotesToNewScale(oldScaleName, newScaleName) {
        if (!oldScaleName || !newScaleName || oldScaleName === newScaleName) {
            return;
        }

        const oldScale = this.scales[oldScaleName];
        const newScale = this.scales[newScaleName];

        if (!oldScale || !newScale) {
            console.warn('⚠️ Scale not found:', oldScaleName, newScaleName);
            return;
        }

        console.log('🎼 Smart transposition:', oldScaleName, '→', newScaleName);
        console.log('   Old scale:', oldScale);
        console.log('   New scale:', newScale);

        // Get root note from music engine
        const rootNote = this.musicEngine?.rootNote || 'C';
        const rootNoteClean = rootNote.replace(/[0-9]/g, ''); // Remove octave

        // Helper: Build scale notes for a specific octave
        const buildScaleNotesForOctave = (scale, octave) => {
            return scale.map(note => {
                const semitone = this.getNoteInterval(note);
                const freq = Tone.Frequency(rootNoteClean + '0').transpose(semitone).transpose(octave * 12);
                return freq.toNote();
            });
        };

        // Transpose all patterns
        let transposedCount = 0;
        Object.keys(this.synthSeqState.patterns).forEach(track => {
            const pattern = this.synthSeqState.patterns[track];
            pattern.forEach(step => {
                step.notes = step.notes.map(noteData => {
                    try {
                        const originalNote = noteData.note;

                        // Extract note letter and octave (e.g., "C#5" → "C#", 5)
                        const noteMatch = originalNote.match(/^([A-G][#b]?)(\d+)$/);
                        if (!noteMatch) {
                            console.warn('⚠️ Invalid note format:', originalNote);
                            return noteData;
                        }

                        const [, noteLetter, octaveStr] = noteMatch;
                        const octave = parseInt(octaveStr);

                        // Build scale notes for this specific octave
                        const oldScaleNotes = buildScaleNotesForOctave(oldScale, octave);
                        const newScaleNotes = buildScaleNotesForOctave(newScale, octave);

                        // Find which scale degree this note is
                        let scaleDegree = oldScaleNotes.indexOf(originalNote);

                        if (scaleDegree === -1) {
                            // Note not in old scale - find nearest by semitone distance
                            const noteMidi = Tone.Frequency(originalNote).toMidi();
                            const distances = oldScaleNotes.map(scaleNote => {
                                return Math.abs(Tone.Frequency(scaleNote).toMidi() - noteMidi);
                            });
                            scaleDegree = distances.indexOf(Math.min(...distances));
                            console.log('   ⚠️ Note not in scale:', originalNote, '→ nearest degree:', scaleDegree);
                        }

                        // Map to same scale degree in new scale (handle different scale lengths)
                        const newScaleDegree = Math.min(scaleDegree, newScaleNotes.length - 1);
                        const transposedNote = newScaleNotes[newScaleDegree];

                        if (transposedNote !== originalNote) {
                            console.log('   ✓', originalNote, '→', transposedNote, `(degree ${scaleDegree} in octave ${octave})`);
                            transposedCount++;
                        }

                        return { ...noteData, note: transposedNote };
                    } catch (error) {
                        console.error('❌ Error transposing note:', noteData.note, error);
                        return noteData; // Keep original on error
                    }
                });
            });
        });

        console.log(`✅ Smart transposition complete: ${transposedCount} notes changed`);
    }

    /**
     * Helper: Get semitone interval for a note (relative to C)
     */
    getNoteInterval(note) {
        const intervals = {
            'C': 0, 'C#': 1, 'Db': 1,
            'D': 2, 'D#': 3, 'Eb': 3,
            'E': 4,
            'F': 5, 'F#': 6, 'Gb': 6,
            'G': 7, 'G#': 8, 'Ab': 8,
            'A': 9, 'A#': 10, 'Bb': 10,
            'B': 11
        };
        return intervals[note] || 0;
    }

    /**
     * Transpose existing notes when key (root note) changes
     */
    transposeNotesToNewKey() {
        if (!this.musicEngine || !this.musicEngine.rootNote || !this.musicEngine.previousRootNote) {
            console.log('⚠️ Cannot transpose - missing key information');
            return;
        }

        const oldRoot = this.musicEngine.previousRootNote;
        const newRoot = this.musicEngine.rootNote;

        // Calculate semitone difference
        const oldFreq = Tone.Frequency(oldRoot);
        const newFreq = Tone.Frequency(newRoot);
        const semitoneShift = Math.round(newFreq.toMidi() - oldFreq.toMidi());

        if (semitoneShift === 0) return;

        // Transpose all patterns
        Object.keys(this.synthSeqState.patterns).forEach(track => {
            const pattern = this.synthSeqState.patterns[track];
            pattern.forEach(step => {
                step.notes = step.notes.map(noteData => {
                    try {
                        const transposedNote = Tone.Frequency(noteData.note).transpose(semitoneShift).toNote();
                        return { ...noteData, note: transposedNote };
                    } catch (e) {
                        console.warn('Failed to transpose note:', noteData.note);
                        return noteData;
                    }
                });
            });
        });

        console.log(`🎹 Transposed notes by ${semitoneShift} semitones (${oldRoot} → ${newRoot})`);
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

    /**
     * Show preset selection menu for track
     */
    showPresetMenu(track, x, y) {
        // Remove any existing menu
        const existingMenu = document.getElementById('preset-context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }

        // Get preset options for this track
        const presetMap = {
            pad: 'tonejsPadPreset',
            lead: 'tonejsLeadPreset',
            bass: 'tonejsBassPreset',
            arp: 'tonejsArpPreset'
        };

        const selectId = presetMap[track];
        if (!selectId) return;

        const select = document.getElementById(selectId);
        if (!select) return;

        // Create context menu
        const menu = document.createElement('div');
        menu.id = 'preset-context-menu';
        menu.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            background: rgba(20, 20, 30, 0.98);
            border: 2px solid rgba(139, 92, 246, 0.5);
            border-radius: 8px;
            padding: 8px;
            z-index: 10000;
            min-width: 180px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        `;

        // Add title
        const title = document.createElement('div');
        title.textContent = `${track.toUpperCase()} Preset`;
        title.style.cssText = `
            color: rgba(139, 92, 246, 1);
            font-weight: 600;
            padding: 8px 12px;
            border-bottom: 1px solid rgba(139, 92, 246, 0.3);
            margin-bottom: 4px;
            font-size: 12px;
            text-transform: uppercase;
        `;
        menu.appendChild(title);

        // Add preset options
        Array.from(select.options).forEach(option => {
            const item = document.createElement('div');
            item.textContent = option.textContent;
            item.style.cssText = `
                padding: 10px 12px;
                cursor: pointer;
                color: rgba(255, 255, 255, 0.8);
                font-size: 14px;
                border-radius: 4px;
                transition: all 0.2s;
            `;

            if (option.value === select.value) {
                item.style.background = 'rgba(139, 92, 246, 0.3)';
                item.style.color = '#ffffff';
                item.textContent = '✓ ' + item.textContent;
            }

            item.addEventListener('mouseenter', () => {
                item.style.background = 'rgba(139, 92, 246, 0.4)';
                item.style.color = '#ffffff';
            });

            item.addEventListener('mouseleave', () => {
                if (option.value !== select.value) {
                    item.style.background = 'transparent';
                    item.style.color = 'rgba(255, 255, 255, 0.8)';
                }
            });

            item.addEventListener('click', () => {
                select.value = option.value;
                select.dispatchEvent(new Event('change'));
                menu.remove();
                console.log(`🎹 Changed ${track} preset to:`, option.textContent);
            });

            menu.appendChild(item);
        });

        document.body.appendChild(menu);

        // Close on click outside
        const closeMenu = (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        setTimeout(() => document.addEventListener('click', closeMenu), 100);
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

        // Add built-in default patterns
        const defaultsGroup = document.createElement('optgroup');
        defaultsGroup.label = '📦 Built-in Examples';

        const defaults = [
            { value: 'default_pad_simple', name: '🎹 Simple Pad Chords' },
            { value: 'default_lead_melody', name: '⚡ Lead Melody' },
            { value: 'default_bass_groove', name: '🔊 Bass Groove' },
            { value: 'default_arp_pattern', name: '🎵 Arp Pattern' }
        ];

        defaults.forEach(({ value, name }) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = name;
            defaultsGroup.appendChild(option);
        });

        select.appendChild(defaultsGroup);

        // Add game music patterns
        const gameGroup = document.createElement('optgroup');
        gameGroup.label = '🎮 Game Music';

        const gamePatterns = [
            // 🎵 CLASSIC LEADS
            { value: 'game_hero_theme', name: '🗡️ Hero Theme' },
            { value: 'game_dungeon', name: '🏰 Dungeon' },
            { value: 'game_overworld', name: '🌍 Overworld' },
            { value: 'game_boss_battle', name: '👾 Boss Battle' },
            { value: 'game_zelda_theme', name: '🗡️ Zelda Theme' },
            { value: 'game_mario_underground', name: '🍄 Underground' },
            { value: 'game_tetris', name: '🧱 Tetris' },
            { value: 'game_megaman', name: '🤖 Mega Man' },
            { value: 'game_sonic', name: '💨 Sonic Zone' },
            { value: 'game_castlevania', name: '🧛 Castlevania' },
            { value: 'game_pokemon', name: '⚡ Pokémon' },
            { value: 'game_streets_rage', name: '🥋 Streets of Rage' },
            { value: 'game_outrun', name: '🏎️ OutRun' },
            { value: 'game_minecraft', name: '⛏️ Minecraft' },
            { value: 'game_doom', name: '😈 DOOM' },
            { value: 'game_undertale', name: '❤️ Undertale' },
            { value: 'game_secret_mana', name: '✨ Secret of Mana (32)' },
            { value: 'game_kingdom_hearts', name: '👑 Kingdom Hearts (32)' },
            // 🎸 BASS PATTERNS
            { value: 'game_earthbound_bass', name: '🌍 EarthBound Groove' },
            { value: 'game_chrono_bass', name: '⏰ Chrono Trigger (32)' },
            { value: 'game_donkey_bass', name: '🍌 DK Country Bass' },
            { value: 'game_halo_bass', name: '🎖️ Halo Theme (32)' },
            { value: 'game_golden_axe', name: '⚔️ Golden Axe' },
            { value: 'game_hotline_miami', name: '🔪 Hotline Miami' },
            // 🎹 ARPEGGIO PATTERNS
            { value: 'game_ff7_arp', name: '⚔️ Final Fantasy VII' },
            { value: 'game_kirby_arp', name: '⭐ Kirby Dreamland' },
            { value: 'game_portal', name: '🔵 Portal' },
            { value: 'game_zelda_fairy', name: '🧚 Zelda Fairy' },
            { value: 'game_celeste', name: '🏔️ Celeste' },
            // 🎼 PAD PATTERNS
            { value: 'game_metroid', name: '👾 Metroid' },
            { value: 'game_hollow_knight', name: '🦋 Hollow Knight (32)' },
            { value: 'game_skyrim', name: '🐉 Skyrim (32)' }
        ];

        gamePatterns.forEach(({ value, name }) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = name;
            gameGroup.appendChild(option);
        });

        select.appendChild(gameGroup);

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
                optgroup.label = '💾 ' + track.charAt(0).toUpperCase() + track.slice(1) + ' (Saved)';

                grouped[track].forEach(({ key, name }) => {
                    const option = document.createElement('option');
                    option.value = key;
                    option.textContent = name;
                    optgroup.appendChild(option);
                });

                select.appendChild(optgroup);
            }
        });

        console.log('📋 Populated', defaults.length, 'default +', patterns.length, 'saved pattern presets');
    }

    loadPattern(key) {
        try {
            let saved;

            // Check if it's a built-in default or game pattern
            if (key.startsWith('default_') || key.startsWith('game_')) {
                saved = this.getDefaultPattern(key);
                if (!saved) {
                    alert('⚠️ Default pattern not found');
                    return;
                }
            } else {
                // Load from localStorage
                saved = JSON.parse(localStorage.getItem(key));
                if (!saved) {
                    alert('⚠️ Pattern not found');
                    return;
                }
            }

            // 🔧 FIX: Clear ALL other tracks first to prevent pattern overlap!
            // When loading a new pattern, we want ONLY that pattern to play
            const otherTracks = ['pad', 'lead', 'bass', 'arp'].filter(t => t !== saved.track);
            otherTracks.forEach(track => {
                this.synthSeqState.patterns[track] = [];
            });
            console.log('🧹 Cleared other tracks:', otherTracks.join(', '));

            // Load pattern data into the target track
            this.synthSeqState.patterns[saved.track] = saved.pattern;
            this.synthSeqState.length = saved.length || 16;
            this.synthSeqState.scale = saved.scale || 'major';
            this.synthSeqState.octave = saved.octave || 3;
            this.synthSeqState.rootNote = saved.rootNote || 'C3'; // 🔧 FIX: Default with octave

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

            // 🔧 FIX: Also update GLOBAL scale/key to match the preset
            // This ensures the piano roll displays notes in the correct key/octave
            const globalScaleSelect = document.getElementById('scaleSelect');
            const globalKeySelect = document.getElementById('keySelect');

            console.log('🔍 DEBUG - Preset rootNote:', saved.rootNote, 'scale:', saved.scale);
            console.log('🔍 DEBUG - Found scaleSelect:', !!globalScaleSelect);
            console.log('🔍 DEBUG - Found keySelect:', !!globalKeySelect);

            if (globalScaleSelect && saved.scale) {
                const oldScale = globalScaleSelect.value;
                globalScaleSelect.value = saved.scale;
                this.musicEngine.setScale(saved.scale);
                console.log('✅ Musical Scale: Changed from', oldScale, '→', saved.scale);
            } else {
                console.warn('⚠️ Cannot update scale - element:', !!globalScaleSelect, 'value:', saved.scale);
            }

            if (globalKeySelect && saved.rootNote) {
                const oldKey = globalKeySelect.value;
                console.log('🎹 BEFORE: keySelect.value =', oldKey);

                // Method 1: Set value directly
                globalKeySelect.value = saved.rootNote;
                console.log('🎹 AFTER (method 1):  keySelect.value =', globalKeySelect.value);

                // Method 2: Find and set selectedIndex (more reliable for UI update)
                const targetIndex = Array.from(globalKeySelect.options).findIndex(opt => opt.value === saved.rootNote);
                if (targetIndex !== -1) {
                    globalKeySelect.selectedIndex = targetIndex;
                    console.log('🎹 AFTER (method 2): selectedIndex =', targetIndex, 'value =', globalKeySelect.value);

                    // Method 3: Force UI repaint
                    globalKeySelect.blur();
                    globalKeySelect.focus();
                    globalKeySelect.blur();

                    this.musicEngine.setKey(saved.rootNote);
                    console.log('✅ Song Key (Root Note): Changed from', oldKey, '→', saved.rootNote);
                    console.log('   Dropdown text:', globalKeySelect.options[globalKeySelect.selectedIndex]?.text);
                    console.log('   Visual update forced via focus/blur');
                } else {
                    console.error('❌ Option value "' + saved.rootNote + '" does not exist in keySelect dropdown!');
                    console.log('   Available options:', Array.from(globalKeySelect.options).map(o => o.value).join(', '));
                }
            } else {
                console.error('❌ Cannot update Song Key - element exists?', !!globalKeySelect, 'rootNote:', saved.rootNote);
            }

            this.updateKeyDisplay();
            this.renderPianoRoll();

            // 🔧 FIX: Restart sequencer if it's currently playing!
            // This ensures the Tone.Sequence closures pick up the new pattern data
            if (this.synthSeqState.isPlaying && this.sequencerPlaybacks) {
                console.log('🔄 Sequencer is playing - restarting to apply pattern changes...');

                // Stop old sequences
                Object.values(this.sequencerPlaybacks).forEach(seq => {
                    if (seq) {
                        seq.stop();
                        seq.dispose();
                    }
                });
                this.sequencerPlaybacks = null;

                // Restart with new patterns (by toggling twice)
                this.synthSeqState.isPlaying = false;
                this.toggleSequencerPlayback(); // Start

                console.log('✅ Sequencer restarted with new patterns!');
            }

            console.log('📂 Loaded pattern:', saved.name);
            console.log('   Track:', saved.track);
            console.log('   Key:', saved.rootNote, saved.scale);
            console.log('   Length:', saved.length, 'steps');
            console.log('   ✅ All other tracks cleared!');
        } catch (e) {
            console.error('Failed to load pattern:', e);
            alert('❌ Failed to load pattern');
        }
    }

    getDefaultPattern(key) {
        const defaults = {
            'default_pad_simple': {
                name: 'Simple Pad Chords',
                track: 'pad',
                scale: 'major',
                octave: 3,
                rootNote: 'C3', // 🔧 FIX: Add explicit root note with octave
                length: 16,
                pattern: [
                    { step: 0, notes: [{ note: 'C4', duration: 4, velocity: 0.7 }] },
                    { step: 4, notes: [{ note: 'F4', duration: 4, velocity: 0.7 }] },
                    { step: 8, notes: [{ note: 'G4', duration: 4, velocity: 0.7 }] },
                    { step: 12, notes: [{ note: 'E4', duration: 4, velocity: 0.7 }] }
                ]
            },
            'default_lead_melody': {
                name: 'Lead Melody',
                track: 'lead',
                scale: 'minor',
                octave: 4,
                rootNote: 'C3', // 🔧 FIX: Add explicit root note with octave
                length: 16,
                pattern: [
                    { step: 0, notes: [{ note: 'C5', duration: 1, velocity: 0.8 }] },
                    { step: 2, notes: [{ note: 'D5', duration: 1, velocity: 0.8 }] },
                    { step: 4, notes: [{ note: 'Eb5', duration: 2, velocity: 0.9 }] },
                    { step: 7, notes: [{ note: 'D5', duration: 1, velocity: 0.7 }] },
                    { step: 8, notes: [{ note: 'C5', duration: 2, velocity: 0.8 }] },
                    { step: 12, notes: [{ note: 'G4', duration: 3, velocity: 0.8 }] }
                ]
            },
            'default_bass_groove': {
                name: 'Bass Groove',
                track: 'bass',
                scale: 'minor',
                octave: 2,
                rootNote: 'C3', // 🔧 FIX: Add explicit root note with octave
                length: 16,
                pattern: [
                    { step: 0, notes: [{ note: 'C3', duration: 1, velocity: 0.9 }] },
                    { step: 4, notes: [{ note: 'C3', duration: 1, velocity: 0.8 }] },
                    { step: 6, notes: [{ note: 'G2', duration: 1, velocity: 0.7 }] },
                    { step: 8, notes: [{ note: 'C3', duration: 1, velocity: 0.9 }] },
                    { step: 12, notes: [{ note: 'Ab2', duration: 2, velocity: 0.8 }] }
                ]
            },
            'default_arp_pattern': {
                name: 'Arp Pattern',
                track: 'arp',
                scale: 'pentatonic',
                octave: 4,
                rootNote: 'C3', // 🔧 FIX: Add explicit root note with octave
                length: 16,
                pattern: [
                    { step: 0, notes: [{ note: 'C5', duration: 1, velocity: 0.7 }] },
                    { step: 1, notes: [{ note: 'D5', duration: 1, velocity: 0.7 }] },
                    { step: 2, notes: [{ note: 'E5', duration: 1, velocity: 0.7 }] },
                    { step: 3, notes: [{ note: 'G5', duration: 1, velocity: 0.7 }] },
                    { step: 4, notes: [{ note: 'A5', duration: 1, velocity: 0.8 }] },
                    { step: 5, notes: [{ note: 'G5', duration: 1, velocity: 0.7 }] },
                    { step: 6, notes: [{ note: 'E5', duration: 1, velocity: 0.7 }] },
                    { step: 7, notes: [{ note: 'D5', duration: 1, velocity: 0.7 }] },
                    { step: 8, notes: [{ note: 'C5', duration: 1, velocity: 0.7 }] },
                    { step: 9, notes: [{ note: 'D5', duration: 1, velocity: 0.7 }] },
                    { step: 10, notes: [{ note: 'E5', duration: 1, velocity: 0.7 }] },
                    { step: 11, notes: [{ note: 'G5', duration: 1, velocity: 0.7 }] },
                    { step: 12, notes: [{ note: 'A5', duration: 2, velocity: 0.8 }] }
                ]
            },
            // Game Music Patterns
            'game_hero_theme': {
                name: 'Hero Theme',
                track: 'lead',
                scale: 'major',
                octave: 4,
                rootNote: 'C3', // 🔧 FIX: Add explicit root note with octave
                length: 16,
                pattern: [
                    { step: 0, notes: [{ note: 'E5', duration: 1, velocity: 0.9 }] },
                    { step: 1, notes: [{ note: 'E5', duration: 1, velocity: 0.7 }] },
                    { step: 3, notes: [{ note: 'E5', duration: 1, velocity: 0.8 }] },
                    { step: 4, notes: [{ note: 'C5', duration: 1, velocity: 0.7 }] },
                    { step: 5, notes: [{ note: 'E5', duration: 2, velocity: 0.9 }] },
                    { step: 8, notes: [{ note: 'G5', duration: 3, velocity: 0.9 }] },
                    { step: 12, notes: [{ note: 'G4', duration: 3, velocity: 0.8 }] }
                ]
            },
            'game_dungeon': {
                name: 'Dungeon',
                track: 'lead',
                scale: 'minor',
                octave: 4,
                rootNote: 'C3', // 🔧 FIX: Add explicit root note with octave
                length: 16,
                pattern: [
                    { step: 0, notes: [{ note: 'D5', duration: 2, velocity: 0.8 }] },
                    { step: 3, notes: [{ note: 'D5', duration: 1, velocity: 0.6 }] },
                    { step: 4, notes: [{ note: 'Eb5', duration: 2, velocity: 0.7 }] },
                    { step: 7, notes: [{ note: 'D5', duration: 1, velocity: 0.6 }] },
                    { step: 8, notes: [{ note: 'C5', duration: 2, velocity: 0.8 }] },
                    { step: 11, notes: [{ note: 'A4', duration: 1, velocity: 0.6 }] },
                    { step: 12, notes: [{ note: 'C5', duration: 3, velocity: 0.7 }] }
                ]
            },
            'game_overworld': {
                name: 'Overworld',
                track: 'lead',
                scale: 'major',
                octave: 5,
                rootNote: 'C3', // 🔧 FIX: Add explicit root note with octave
                length: 16,
                pattern: [
                    { step: 0, notes: [{ note: 'C5', duration: 1, velocity: 0.8 }] },
                    { step: 2, notes: [{ note: 'E5', duration: 1, velocity: 0.7 }] },
                    { step: 4, notes: [{ note: 'G5', duration: 1, velocity: 0.9 }] },
                    { step: 5, notes: [{ note: 'E5', duration: 1, velocity: 0.7 }] },
                    { step: 6, notes: [{ note: 'C5', duration: 1, velocity: 0.8 }] },
                    { step: 8, notes: [{ note: 'A5', duration: 2, velocity: 0.9 }] },
                    { step: 11, notes: [{ note: 'G5', duration: 1, velocity: 0.7 }] },
                    { step: 12, notes: [{ note: 'F5', duration: 2, velocity: 0.8 }] },
                    { step: 15, notes: [{ note: 'D5', duration: 1, velocity: 0.7 }] }
                ]
            },
            'game_boss_battle': {
                name: 'Boss Battle',
                track: 'lead',
                scale: 'minor',
                octave: 4,
                rootNote: 'C3', // 🔧 FIX: Add explicit root note with octave
                length: 16,
                pattern: [
                    { step: 0, notes: [{ note: 'E5', duration: 1, velocity: 1.0 }] },
                    { step: 1, notes: [{ note: 'E5', duration: 1, velocity: 0.9 }] },
                    { step: 2, notes: [{ note: 'E5', duration: 1, velocity: 1.0 }] },
                    { step: 4, notes: [{ note: 'C5', duration: 1, velocity: 0.9 }] },
                    { step: 5, notes: [{ note: 'D5', duration: 1, velocity: 0.9 }] },
                    { step: 6, notes: [{ note: 'E5', duration: 2, velocity: 1.0 }] },
                    { step: 8, notes: [{ note: 'D5', duration: 1, velocity: 0.9 }] },
                    { step: 9, notes: [{ note: 'C5', duration: 1, velocity: 0.8 }] },
                    { step: 10, notes: [{ note: 'B4', duration: 2, velocity: 0.9 }] },
                    { step: 12, notes: [{ note: 'E5', duration: 3, velocity: 1.0 }] }
                ]
            },
            // 🎮 NEW GAME PATTERNS - Different Keys for Variety!
            'game_zelda_theme': {
                name: 'Zelda Theme',
                track: 'lead',
                scale: 'major',
                octave: 4,
                rootNote: 'F3', // F Major - adventurous!
                length: 16,
                pattern: [
                    { step: 0, notes: [{ note: 'F5', duration: 1, velocity: 0.8 }] },
                    { step: 2, notes: [{ note: 'F5', duration: 1, velocity: 0.8 }] },
                    { step: 4, notes: [{ note: 'F5', duration: 1, velocity: 0.8 }] },
                    { step: 5, notes: [{ note: 'G5', duration: 1, velocity: 0.7 }] },
                    { step: 6, notes: [{ note: 'A5', duration: 2, velocity: 0.9 }] },
                    { step: 9, notes: [{ note: 'A5', duration: 1, velocity: 0.8 }] },
                    { step: 11, notes: [{ note: 'A5', duration: 1, velocity: 0.8 }] },
                    { step: 13, notes: [{ note: 'A5', duration: 1, velocity: 0.8 }] },
                    { step: 14, notes: [{ note: 'Bb5', duration: 1, velocity: 0.7 }] },
                    { step: 15, notes: [{ note: 'C6', duration: 1, velocity: 0.9 }] }
                ]
            },
            'game_mario_underground': {
                name: 'Underground',
                track: 'lead',
                scale: 'minor',
                octave: 4,
                rootNote: 'D3', // D Minor - mysterious!
                length: 16,
                pattern: [
                    { step: 0, notes: [{ note: 'D5', duration: 1, velocity: 0.8 }] },
                    { step: 1, notes: [{ note: 'D5', duration: 1, velocity: 0.6 }] },
                    { step: 2, notes: [{ note: 'D5', duration: 1, velocity: 0.8 }] },
                    { step: 4, notes: [{ note: 'A4', duration: 1, velocity: 0.9 }] },
                    { step: 5, notes: [{ note: 'Bb4', duration: 1, velocity: 0.7 }] },
                    { step: 6, notes: [{ note: 'A4', duration: 1, velocity: 0.8 }] },
                    { step: 8, notes: [{ note: 'G4', duration: 1, velocity: 0.8 }] },
                    { step: 9, notes: [{ note: 'F4', duration: 1, velocity: 0.6 }] },
                    { step: 10, notes: [{ note: 'G4', duration: 2, velocity: 0.7 }] }
                ]
            },
            'game_tetris': {
                name: 'Tetris',
                track: 'lead',
                scale: 'minor',
                octave: 4,
                rootNote: 'E3', // E Minor - energetic!
                length: 16,
                pattern: [
                    { step: 0, notes: [{ note: 'E5', duration: 1, velocity: 0.8 }] },
                    { step: 1, notes: [{ note: 'B4', duration: 0.5, velocity: 0.7 }] },
                    { step: 2, notes: [{ note: 'C5', duration: 1, velocity: 0.8 }] },
                    { step: 3, notes: [{ note: 'D5', duration: 1, velocity: 0.8 }] },
                    { step: 4, notes: [{ note: 'C5', duration: 0.5, velocity: 0.7 }] },
                    { step: 5, notes: [{ note: 'B4', duration: 1, velocity: 0.8 }] },
                    { step: 6, notes: [{ note: 'A4', duration: 1, velocity: 0.8 }] },
                    { step: 8, notes: [{ note: 'A4', duration: 1, velocity: 0.7 }] },
                    { step: 9, notes: [{ note: 'C5', duration: 0.5, velocity: 0.7 }] },
                    { step: 10, notes: [{ note: 'E5', duration: 1, velocity: 0.9 }] },
                    { step: 11, notes: [{ note: 'D5', duration: 1, velocity: 0.7 }] },
                    { step: 12, notes: [{ note: 'C5', duration: 1, velocity: 0.8 }] },
                    { step: 13, notes: [{ note: 'B4', duration: 2, velocity: 0.8 }] }
                ]
            },
            'game_megaman': {
                name: 'Mega Man',
                track: 'lead',
                scale: 'minor',
                octave: 4,
                rootNote: 'A3', // A Minor - heroic!
                length: 16,
                pattern: [
                    { step: 0, notes: [{ note: 'A5', duration: 1, velocity: 0.9 }] },
                    { step: 2, notes: [{ note: 'G5', duration: 1, velocity: 0.8 }] },
                    { step: 3, notes: [{ note: 'F5', duration: 1, velocity: 0.7 }] },
                    { step: 4, notes: [{ note: 'E5', duration: 2, velocity: 0.9 }] },
                    { step: 6, notes: [{ note: 'A5', duration: 1, velocity: 0.9 }] },
                    { step: 8, notes: [{ note: 'C6', duration: 1, velocity: 1.0 }] },
                    { step: 10, notes: [{ note: 'B5', duration: 1, velocity: 0.8 }] },
                    { step: 11, notes: [{ note: 'A5', duration: 1, velocity: 0.7 }] },
                    { step: 12, notes: [{ note: 'G5', duration: 2, velocity: 0.9 }] },
                    { step: 14, notes: [{ note: 'E5', duration: 2, velocity: 0.8 }] }
                ]
            },
            'game_sonic': {
                name: 'Sonic Zone',
                track: 'lead',
                scale: 'major',
                octave: 4,
                rootNote: 'G3', // G Major - speedy!
                length: 16,
                pattern: [
                    { step: 0, notes: [{ note: 'G5', duration: 0.5, velocity: 0.9 }] },
                    { step: 1, notes: [{ note: 'A5', duration: 0.5, velocity: 0.8 }] },
                    { step: 2, notes: [{ note: 'B5', duration: 1, velocity: 0.9 }] },
                    { step: 3, notes: [{ note: 'D6', duration: 1, velocity: 1.0 }] },
                    { step: 5, notes: [{ note: 'C6', duration: 0.5, velocity: 0.8 }] },
                    { step: 6, notes: [{ note: 'B5', duration: 1, velocity: 0.9 }] },
                    { step: 8, notes: [{ note: 'G5', duration: 1, velocity: 0.8 }] },
                    { step: 10, notes: [{ note: 'A5', duration: 1, velocity: 0.8 }] },
                    { step: 12, notes: [{ note: 'B5', duration: 2, velocity: 0.9 }] },
                    { step: 15, notes: [{ note: 'G5', duration: 1, velocity: 0.7 }] }
                ]
            },
            'game_metroid': {
                name: 'Metroid',
                track: 'pad',
                scale: 'minor',
                octave: 3,
                rootNote: 'B2', // B Minor - atmospheric!
                length: 16,
                pattern: [
                    { step: 0, notes: [{ note: 'B3', duration: 4, velocity: 0.6 }] },
                    { step: 4, notes: [{ note: 'A3', duration: 4, velocity: 0.5 }] },
                    { step: 8, notes: [{ note: 'G3', duration: 4, velocity: 0.6 }] },
                    { step: 12, notes: [{ note: 'F#3', duration: 4, velocity: 0.5 }] }
                ]
            },
            'game_castlevania': {
                name: 'Castlevania',
                track: 'lead',
                scale: 'minor',
                octave: 4,
                rootNote: 'D3', // D Minor - gothic!
                length: 16,
                pattern: [
                    { step: 0, notes: [{ note: 'D5', duration: 1, velocity: 0.9 }] },
                    { step: 1, notes: [{ note: 'F5', duration: 1, velocity: 0.8 }] },
                    { step: 2, notes: [{ note: 'A5', duration: 2, velocity: 1.0 }] },
                    { step: 4, notes: [{ note: 'G5', duration: 1, velocity: 0.8 }] },
                    { step: 5, notes: [{ note: 'F5', duration: 1, velocity: 0.7 }] },
                    { step: 6, notes: [{ note: 'E5', duration: 2, velocity: 0.9 }] },
                    { step: 8, notes: [{ note: 'D5', duration: 1, velocity: 0.9 }] },
                    { step: 10, notes: [{ note: 'C5', duration: 1, velocity: 0.8 }] },
                    { step: 12, notes: [{ note: 'D5', duration: 3, velocity: 0.9 }] }
                ]
            },
            'game_pokemon': {
                name: 'Pokémon',
                track: 'lead',
                scale: 'major',
                octave: 4,
                rootNote: 'D3', // D Major - upbeat!
                length: 16,
                pattern: [
                    { step: 0, notes: [{ note: 'D5', duration: 1, velocity: 0.8 }] },
                    { step: 2, notes: [{ note: 'F#5', duration: 1, velocity: 0.8 }] },
                    { step: 4, notes: [{ note: 'A5', duration: 2, velocity: 0.9 }] },
                    { step: 7, notes: [{ note: 'G5', duration: 1, velocity: 0.7 }] },
                    { step: 8, notes: [{ note: 'F#5', duration: 1, velocity: 0.8 }] },
                    { step: 10, notes: [{ note: 'E5', duration: 1, velocity: 0.7 }] },
                    { step: 12, notes: [{ note: 'D5', duration: 3, velocity: 0.8 }] }
                ]
            },
            // 🎸 BASS PATTERNS - Groovy low-end!
            'game_earthbound_bass': {
                name: 'EarthBound Groove',
                track: 'bass',
                scale: 'major',
                octave: 2,
                rootNote: 'F3', // F Major - funky!
                length: 16,
                pattern: [
                    { step: 0, notes: [{ note: 'F2', duration: 2, velocity: 0.9 }] },
                    { step: 2, notes: [{ note: 'C2', duration: 1, velocity: 0.7 }] },
                    { step: 4, notes: [{ note: 'F2', duration: 2, velocity: 0.9 }] },
                    { step: 6, notes: [{ note: 'C2', duration: 1, velocity: 0.7 }] },
                    { step: 8, notes: [{ note: 'Bb2', duration: 2, velocity: 0.9 }] },
                    { step: 10, notes: [{ note: 'F2', duration: 1, velocity: 0.7 }] },
                    { step: 12, notes: [{ note: 'C3', duration: 2, velocity: 0.8 }] },
                    { step: 14, notes: [{ note: 'A2', duration: 1, velocity: 0.7 }] }
                ]
            },
            'game_chrono_bass': {
                name: 'Chrono Trigger',
                track: 'bass',
                scale: 'minor',
                octave: 2,
                rootNote: 'E3', // E Minor - epic!
                length: 32,
                pattern: [
                    { step: 0, notes: [{ note: 'E2', duration: 4, velocity: 0.9 }] },
                    { step: 4, notes: [{ note: 'D2', duration: 4, velocity: 0.8 }] },
                    { step: 8, notes: [{ note: 'C2', duration: 4, velocity: 0.9 }] },
                    { step: 12, notes: [{ note: 'B1', duration: 4, velocity: 0.8 }] },
                    { step: 16, notes: [{ note: 'E2', duration: 2, velocity: 0.9 }] },
                    { step: 18, notes: [{ note: 'G2', duration: 2, velocity: 0.7 }] },
                    { step: 20, notes: [{ note: 'A2', duration: 2, velocity: 0.8 }] },
                    { step: 22, notes: [{ note: 'B2', duration: 2, velocity: 0.8 }] },
                    { step: 24, notes: [{ note: 'C3', duration: 4, velocity: 0.9 }] },
                    { step: 28, notes: [{ note: 'B2', duration: 4, velocity: 0.8 }] }
                ]
            },
            'game_donkey_bass': {
                name: 'DK Country Bass',
                track: 'bass',
                scale: 'minor',
                octave: 2,
                rootNote: 'Bb2', // Bb Minor - deep jungle!
                length: 16,
                pattern: [
                    { step: 0, notes: [{ note: 'Bb1', duration: 1, velocity: 1.0 }] },
                    { step: 2, notes: [{ note: 'Bb1', duration: 1, velocity: 0.7 }] },
                    { step: 3, notes: [{ note: 'Db2', duration: 1, velocity: 0.6 }] },
                    { step: 4, notes: [{ note: 'F2', duration: 2, velocity: 0.9 }] },
                    { step: 6, notes: [{ note: 'Eb2', duration: 1, velocity: 0.7 }] },
                    { step: 8, notes: [{ note: 'Bb1', duration: 1, velocity: 1.0 }] },
                    { step: 10, notes: [{ note: 'Ab1', duration: 1, velocity: 0.8 }] },
                    { step: 12, notes: [{ note: 'Gb2', duration: 2, velocity: 0.9 }] },
                    { step: 14, notes: [{ note: 'F2', duration: 1, velocity: 0.7 }] }
                ]
            },
            // 🎹 ARPEGGIO PATTERNS - Fast rhythmic patterns!
            'game_ff7_arp': {
                name: 'Final Fantasy VII',
                track: 'arp',
                scale: 'minor',
                octave: 4,
                rootNote: 'Ab3', // Ab Minor - emotional!
                length: 16,
                pattern: [
                    { step: 0, notes: [{ note: 'Ab4', duration: 0.5, velocity: 0.7 }] },
                    { step: 1, notes: [{ note: 'Eb5', duration: 0.5, velocity: 0.6 }] },
                    { step: 2, notes: [{ note: 'Ab5', duration: 0.5, velocity: 0.8 }] },
                    { step: 3, notes: [{ note: 'Cb5', duration: 0.5, velocity: 0.6 }] },
                    { step: 4, notes: [{ note: 'Eb5', duration: 0.5, velocity: 0.7 }] },
                    { step: 5, notes: [{ note: 'Ab4', duration: 0.5, velocity: 0.6 }] },
                    { step: 6, notes: [{ note: 'Cb5', duration: 0.5, velocity: 0.8 }] },
                    { step: 7, notes: [{ note: 'Eb5', duration: 0.5, velocity: 0.6 }] },
                    { step: 8, notes: [{ note: 'Ab4', duration: 0.5, velocity: 0.7 }] },
                    { step: 9, notes: [{ note: 'Db5', duration: 0.5, velocity: 0.6 }] },
                    { step: 10, notes: [{ note: 'Gb5', duration: 0.5, velocity: 0.8 }] },
                    { step: 11, notes: [{ note: 'Db5', duration: 0.5, velocity: 0.6 }] },
                    { step: 12, notes: [{ note: 'Gb5', duration: 0.5, velocity: 0.7 }] },
                    { step: 13, notes: [{ note: 'Db5', duration: 0.5, velocity: 0.6 }] },
                    { step: 14, notes: [{ note: 'Ab4', duration: 0.5, velocity: 0.8 }] },
                    { step: 15, notes: [{ note: 'Eb5', duration: 0.5, velocity: 0.6 }] }
                ]
            },
            'game_kirby_arp': {
                name: 'Kirby Dreamland',
                track: 'arp',
                scale: 'major',
                octave: 5,
                rootNote: 'Bb3', // Bb Major - cheerful!
                length: 16,
                pattern: [
                    { step: 0, notes: [{ note: 'Bb5', duration: 0.5, velocity: 0.8 }] },
                    { step: 1, notes: [{ note: 'D6', duration: 0.5, velocity: 0.7 }] },
                    { step: 2, notes: [{ note: 'F6', duration: 0.5, velocity: 0.9 }] },
                    { step: 3, notes: [{ note: 'D6', duration: 0.5, velocity: 0.6 }] },
                    { step: 4, notes: [{ note: 'Bb5', duration: 0.5, velocity: 0.8 }] },
                    { step: 5, notes: [{ note: 'F6', duration: 0.5, velocity: 0.7 }] },
                    { step: 6, notes: [{ note: 'D6', duration: 0.5, velocity: 0.9 }] },
                    { step: 7, notes: [{ note: 'Bb5', duration: 0.5, velocity: 0.6 }] },
                    { step: 8, notes: [{ note: 'C6', duration: 0.5, velocity: 0.8 }] },
                    { step: 9, notes: [{ note: 'Eb6', duration: 0.5, velocity: 0.7 }] },
                    { step: 10, notes: [{ note: 'G6', duration: 0.5, velocity: 0.9 }] },
                    { step: 11, notes: [{ note: 'Eb6', duration: 0.5, velocity: 0.6 }] },
                    { step: 12, notes: [{ note: 'C6', duration: 0.5, velocity: 0.8 }] },
                    { step: 13, notes: [{ note: 'Bb5', duration: 0.5, velocity: 0.7 }] },
                    { step: 14, notes: [{ note: 'A5', duration: 1, velocity: 0.9 }] }
                ]
            },
            // 🎼 MORE EPIC LEAD PATTERNS - 32 steps!
            'game_secret_mana': {
                name: 'Secret of Mana',
                track: 'lead',
                scale: 'major',
                octave: 5,
                rootNote: 'Eb3', // Eb Major - magical!
                length: 32,
                pattern: [
                    { step: 0, notes: [{ note: 'Eb5', duration: 2, velocity: 0.8 }] },
                    { step: 2, notes: [{ note: 'F5', duration: 1, velocity: 0.7 }] },
                    { step: 3, notes: [{ note: 'G5', duration: 1, velocity: 0.8 }] },
                    { step: 4, notes: [{ note: 'Bb5', duration: 3, velocity: 0.9 }] },
                    { step: 8, notes: [{ note: 'Ab5', duration: 2, velocity: 0.8 }] },
                    { step: 10, notes: [{ note: 'G5', duration: 1, velocity: 0.7 }] },
                    { step: 11, notes: [{ note: 'F5', duration: 1, velocity: 0.7 }] },
                    { step: 12, notes: [{ note: 'Eb5', duration: 4, velocity: 0.9 }] },
                    { step: 16, notes: [{ note: 'Bb5', duration: 2, velocity: 0.8 }] },
                    { step: 18, notes: [{ note: 'C6', duration: 1, velocity: 0.8 }] },
                    { step: 19, notes: [{ note: 'D6', duration: 1, velocity: 0.7 }] },
                    { step: 20, notes: [{ note: 'Eb6', duration: 3, velocity: 1.0 }] },
                    { step: 24, notes: [{ note: 'D6', duration: 2, velocity: 0.8 }] },
                    { step: 26, notes: [{ note: 'C6', duration: 2, velocity: 0.7 }] },
                    { step: 28, notes: [{ note: 'Bb5', duration: 4, velocity: 0.9 }] }
                ]
            },
            'game_kingdom_hearts': {
                name: 'Kingdom Hearts',
                track: 'lead',
                scale: 'minor',
                octave: 4,
                rootNote: 'F#3', // F# Minor - dramatic!
                length: 32,
                pattern: [
                    { step: 0, notes: [{ note: 'F#5', duration: 1, velocity: 0.8 }] },
                    { step: 1, notes: [{ note: 'G#5', duration: 1, velocity: 0.7 }] },
                    { step: 2, notes: [{ note: 'A5', duration: 2, velocity: 0.9 }] },
                    { step: 4, notes: [{ note: 'C#6', duration: 3, velocity: 1.0 }] },
                    { step: 8, notes: [{ note: 'B5', duration: 2, velocity: 0.8 }] },
                    { step: 10, notes: [{ note: 'A5', duration: 1, velocity: 0.7 }] },
                    { step: 11, notes: [{ note: 'G#5', duration: 1, velocity: 0.7 }] },
                    { step: 12, notes: [{ note: 'F#5', duration: 4, velocity: 0.9 }] },
                    { step: 16, notes: [{ note: 'E5', duration: 2, velocity: 0.8 }] },
                    { step: 18, notes: [{ note: 'F#5', duration: 1, velocity: 0.7 }] },
                    { step: 19, notes: [{ note: 'G#5', duration: 1, velocity: 0.8 }] },
                    { step: 20, notes: [{ note: 'A5', duration: 4, velocity: 0.9 }] },
                    { step: 24, notes: [{ note: 'G#5', duration: 2, velocity: 0.8 }] },
                    { step: 26, notes: [{ note: 'F#5', duration: 2, velocity: 0.7 }] },
                    { step: 28, notes: [{ note: 'E5', duration: 4, velocity: 0.9 }] }
                ]
            },
            'game_undertale': {
                name: 'Undertale',
                track: 'lead',
                scale: 'minor',
                octave: 4,
                rootNote: 'C#3', // C# Minor - quirky!
                length: 16,
                pattern: [
                    { step: 0, notes: [{ note: 'C#5', duration: 1, velocity: 0.8 }] },
                    { step: 1, notes: [{ note: 'D#5', duration: 1, velocity: 0.7 }] },
                    { step: 2, notes: [{ note: 'E5', duration: 1, velocity: 0.8 }] },
                    { step: 4, notes: [{ note: 'B4', duration: 1, velocity: 0.9 }] },
                    { step: 5, notes: [{ note: 'C#5', duration: 1, velocity: 0.7 }] },
                    { step: 6, notes: [{ note: 'G#4', duration: 2, velocity: 0.8 }] },
                    { step: 8, notes: [{ note: 'F#4', duration: 1, velocity: 0.8 }] },
                    { step: 9, notes: [{ note: 'G#4', duration: 1, velocity: 0.7 }] },
                    { step: 10, notes: [{ note: 'A4', duration: 2, velocity: 0.9 }] },
                    { step: 12, notes: [{ note: 'C#5', duration: 3, velocity: 0.9 }] }
                ]
            },
            // 🔥 MORE LEGENDARY PATTERNS - Maximum Variety!
            'game_streets_rage': {
                name: 'Streets of Rage',
                track: 'lead',
                scale: 'minor',
                octave: 4,
                rootNote: 'Gb3', // Gb Minor - synth wave!
                length: 16,
                pattern: [
                    { step: 0, notes: [{ note: 'Gb5', duration: 1, velocity: 0.9 }] },
                    { step: 2, notes: [{ note: 'Ab5', duration: 1, velocity: 0.8 }] },
                    { step: 4, notes: [{ note: 'Bb5', duration: 2, velocity: 1.0 }] },
                    { step: 6, notes: [{ note: 'Db6', duration: 1, velocity: 0.9 }] },
                    { step: 8, notes: [{ note: 'Bb5', duration: 1, velocity: 0.8 }] },
                    { step: 10, notes: [{ note: 'Ab5', duration: 1, velocity: 0.7 }] },
                    { step: 12, notes: [{ note: 'Gb5', duration: 3, velocity: 0.9 }] }
                ]
            },
            'game_halo_bass': {
                name: 'Halo Theme',
                track: 'bass',
                scale: 'minor',
                octave: 2,
                rootNote: 'Ab2', // Ab Minor - epic!
                length: 32,
                pattern: [
                    { step: 0, notes: [{ note: 'Ab1', duration: 4, velocity: 1.0 }] },
                    { step: 4, notes: [{ note: 'Eb2', duration: 4, velocity: 0.9 }] },
                    { step: 8, notes: [{ note: 'Gb2', duration: 4, velocity: 0.9 }] },
                    { step: 12, notes: [{ note: 'Db2', duration: 4, velocity: 0.8 }] },
                    { step: 16, notes: [{ note: 'Ab1', duration: 2, velocity: 1.0 }] },
                    { step: 18, notes: [{ note: 'Bb1', duration: 2, velocity: 0.8 }] },
                    { step: 20, notes: [{ note: 'Cb2', duration: 2, velocity: 0.9 }] },
                    { step: 22, notes: [{ note: 'Db2', duration: 2, velocity: 0.8 }] },
                    { step: 24, notes: [{ note: 'Eb2', duration: 4, velocity: 0.9 }] },
                    { step: 28, notes: [{ note: 'Db2', duration: 4, velocity: 0.8 }] }
                ]
            },
            'game_portal': {
                name: 'Portal',
                track: 'arp',
                scale: 'major',
                octave: 5,
                rootNote: 'Db3', // Db Major - mysterious tech!
                length: 16,
                pattern: [
                    { step: 0, notes: [{ note: 'Db5', duration: 0.5, velocity: 0.7 }] },
                    { step: 1, notes: [{ note: 'F5', duration: 0.5, velocity: 0.6 }] },
                    { step: 2, notes: [{ note: 'Ab5', duration: 0.5, velocity: 0.8 }] },
                    { step: 3, notes: [{ note: 'Db6', duration: 0.5, velocity: 0.7 }] },
                    { step: 4, notes: [{ note: 'Ab5', duration: 0.5, velocity: 0.6 }] },
                    { step: 5, notes: [{ note: 'F5', duration: 0.5, velocity: 0.7 }] },
                    { step: 6, notes: [{ note: 'Db5', duration: 0.5, velocity: 0.8 }] },
                    { step: 7, notes: [{ note: 'Ab5', duration: 0.5, velocity: 0.6 }] },
                    { step: 8, notes: [{ note: 'Eb5', duration: 0.5, velocity: 0.7 }] },
                    { step: 9, notes: [{ note: 'Gb5', duration: 0.5, velocity: 0.6 }] },
                    { step: 10, notes: [{ note: 'Bb5', duration: 0.5, velocity: 0.8 }] },
                    { step: 11, notes: [{ note: 'Eb6', duration: 0.5, velocity: 0.7 }] },
                    { step: 12, notes: [{ note: 'Bb5', duration: 0.5, velocity: 0.6 }] },
                    { step: 13, notes: [{ note: 'Gb5', duration: 0.5, velocity: 0.7 }] },
                    { step: 14, notes: [{ note: 'Eb5', duration: 1, velocity: 0.8 }] }
                ]
            },
            'game_hollow_knight': {
                name: 'Hollow Knight',
                track: 'pad',
                scale: 'minor',
                octave: 3,
                rootNote: 'Db3', // Db Minor - haunting!
                length: 32,
                pattern: [
                    { step: 0, notes: [{ note: 'Db3', duration: 8, velocity: 0.5 }] },
                    { step: 8, notes: [{ note: 'Ab2', duration: 8, velocity: 0.4 }] },
                    { step: 16, notes: [{ note: 'Gb3', duration: 8, velocity: 0.5 }] },
                    { step: 24, notes: [{ note: 'Eb3', duration: 8, velocity: 0.4 }] }
                ]
            },
            'game_outrun': {
                name: 'OutRun',
                track: 'lead',
                scale: 'major',
                octave: 5,
                rootNote: 'Ab3', // Ab Major - retro wave!
                length: 16,
                pattern: [
                    { step: 0, notes: [{ note: 'Ab5', duration: 1, velocity: 0.9 }] },
                    { step: 1, notes: [{ note: 'Bb5', duration: 1, velocity: 0.8 }] },
                    { step: 2, notes: [{ note: 'C6', duration: 2, velocity: 1.0 }] },
                    { step: 4, notes: [{ note: 'Eb6', duration: 1, velocity: 0.9 }] },
                    { step: 6, notes: [{ note: 'C6', duration: 1, velocity: 0.7 }] },
                    { step: 8, notes: [{ note: 'Bb5', duration: 2, velocity: 0.9 }] },
                    { step: 10, notes: [{ note: 'Ab5', duration: 1, velocity: 0.8 }] },
                    { step: 12, notes: [{ note: 'Bb5', duration: 3, velocity: 0.9 }] }
                ]
            },
            'game_minecraft': {
                name: 'Minecraft',
                track: 'lead',
                scale: 'major',
                octave: 4,
                rootNote: 'Gb3', // Gb Major - calm, peaceful!
                length: 16,
                pattern: [
                    { step: 0, notes: [{ note: 'Gb4', duration: 2, velocity: 0.6 }] },
                    { step: 3, notes: [{ note: 'Ab4', duration: 1, velocity: 0.5 }] },
                    { step: 4, notes: [{ note: 'Bb4', duration: 2, velocity: 0.7 }] },
                    { step: 7, notes: [{ note: 'Db5', duration: 1, velocity: 0.6 }] },
                    { step: 8, notes: [{ note: 'Eb5', duration: 3, velocity: 0.7 }] },
                    { step: 12, notes: [{ note: 'Db5', duration: 2, velocity: 0.6 }] },
                    { step: 14, notes: [{ note: 'Bb4', duration: 2, velocity: 0.5 }] }
                ]
            },
            'game_golden_axe': {
                name: 'Golden Axe',
                track: 'bass',
                scale: 'minor',
                octave: 2,
                rootNote: 'Gb2', // Gb Minor - powerful!
                length: 16,
                pattern: [
                    { step: 0, notes: [{ note: 'Gb1', duration: 2, velocity: 1.0 }] },
                    { step: 2, notes: [{ note: 'Gb1', duration: 1, velocity: 0.8 }] },
                    { step: 4, notes: [{ note: 'Db2', duration: 2, velocity: 0.9 }] },
                    { step: 6, notes: [{ note: 'Bb1', duration: 1, velocity: 0.7 }] },
                    { step: 8, notes: [{ note: 'Ab1', duration: 2, velocity: 1.0 }] },
                    { step: 10, notes: [{ note: 'Gb1', duration: 1, velocity: 0.8 }] },
                    { step: 12, notes: [{ note: 'Eb2', duration: 3, velocity: 0.9 }] }
                ]
            },
            'game_zelda_fairy': {
                name: 'Zelda Fairy',
                track: 'arp',
                scale: 'major',
                octave: 6,
                rootNote: 'Eb3', // Eb Major - magical sparkle!
                length: 16,
                pattern: [
                    { step: 0, notes: [{ note: 'Eb6', duration: 0.5, velocity: 0.6 }] },
                    { step: 1, notes: [{ note: 'G6', duration: 0.5, velocity: 0.7 }] },
                    { step: 2, notes: [{ note: 'Bb6', duration: 0.5, velocity: 0.8 }] },
                    { step: 3, notes: [{ note: 'Eb7', duration: 0.5, velocity: 0.9 }] },
                    { step: 4, notes: [{ note: 'D7', duration: 0.5, velocity: 0.7 }] },
                    { step: 5, notes: [{ note: 'Bb6', duration: 0.5, velocity: 0.6 }] },
                    { step: 6, notes: [{ note: 'G6', duration: 0.5, velocity: 0.7 }] },
                    { step: 7, notes: [{ note: 'Eb6', duration: 0.5, velocity: 0.5 }] },
                    { step: 8, notes: [{ note: 'F6', duration: 0.5, velocity: 0.6 }] },
                    { step: 9, notes: [{ note: 'Ab6', duration: 0.5, velocity: 0.7 }] },
                    { step: 10, notes: [{ note: 'C7', duration: 0.5, velocity: 0.8 }] },
                    { step: 11, notes: [{ note: 'Eb7', duration: 0.5, velocity: 0.9 }] },
                    { step: 12, notes: [{ note: 'Bb6', duration: 1, velocity: 0.7 }] }
                ]
            },
            'game_skyrim': {
                name: 'Skyrim',
                track: 'pad',
                scale: 'minor',
                octave: 2,
                rootNote: 'A2', // A Minor - epic nord!
                length: 32,
                pattern: [
                    { step: 0, notes: [{ note: 'A2', duration: 8, velocity: 0.6 }] },
                    { step: 8, notes: [{ note: 'G2', duration: 8, velocity: 0.5 }] },
                    { step: 16, notes: [{ note: 'F2', duration: 8, velocity: 0.6 }] },
                    { step: 24, notes: [{ note: 'E2', duration: 8, velocity: 0.5 }] }
                ]
            },
            'game_hotline_miami': {
                name: 'Hotline Miami',
                track: 'bass',
                scale: 'minor',
                octave: 2,
                rootNote: 'C#3', // C# Minor - synthwave aggression!
                length: 16,
                pattern: [
                    { step: 0, notes: [{ note: 'C#2', duration: 1, velocity: 1.0 }] },
                    { step: 1, notes: [{ note: 'C#2', duration: 1, velocity: 0.7 }] },
                    { step: 2, notes: [{ note: 'C#2', duration: 1, velocity: 0.9 }] },
                    { step: 4, notes: [{ note: 'E2', duration: 1, velocity: 0.9 }] },
                    { step: 5, notes: [{ note: 'F#2', duration: 1, velocity: 0.7 }] },
                    { step: 6, notes: [{ note: 'G#2', duration: 1, velocity: 0.8 }] },
                    { step: 8, notes: [{ note: 'A2', duration: 1, velocity: 1.0 }] },
                    { step: 9, notes: [{ note: 'A2', duration: 1, velocity: 0.7 }] },
                    { step: 10, notes: [{ note: 'G#2', duration: 1, velocity: 0.8 }] },
                    { step: 12, notes: [{ note: 'F#2', duration: 3, velocity: 0.9 }] }
                ]
            },
            'game_celeste': {
                name: 'Celeste',
                track: 'arp',
                scale: 'major',
                octave: 5,
                rootNote: 'B3', // B Major - pixel perfect!
                length: 16,
                pattern: [
                    { step: 0, notes: [{ note: 'B5', duration: 0.5, velocity: 0.8 }] },
                    { step: 1, notes: [{ note: 'D#6', duration: 0.5, velocity: 0.7 }] },
                    { step: 2, notes: [{ note: 'F#6', duration: 0.5, velocity: 0.9 }] },
                    { step: 3, notes: [{ note: 'B6', duration: 0.5, velocity: 0.8 }] },
                    { step: 4, notes: [{ note: 'A#6', duration: 0.5, velocity: 0.7 }] },
                    { step: 5, notes: [{ note: 'F#6', duration: 0.5, velocity: 0.8 }] },
                    { step: 6, notes: [{ note: 'D#6', duration: 0.5, velocity: 0.7 }] },
                    { step: 7, notes: [{ note: 'B5', duration: 0.5, velocity: 0.6 }] },
                    { step: 8, notes: [{ note: 'C#6', duration: 0.5, velocity: 0.8 }] },
                    { step: 9, notes: [{ note: 'E6', duration: 0.5, velocity: 0.7 }] },
                    { step: 10, notes: [{ note: 'G#6', duration: 0.5, velocity: 0.9 }] },
                    { step: 11, notes: [{ note: 'B6', duration: 0.5, velocity: 0.8 }] },
                    { step: 12, notes: [{ note: 'F#6', duration: 1, velocity: 0.9 }] },
                    { step: 14, notes: [{ note: 'D#6', duration: 1, velocity: 0.7 }] }
                ]
            },
            'game_doom': {
                name: 'DOOM',
                track: 'lead',
                scale: 'minor',
                octave: 3,
                rootNote: 'E3', // E Minor - heavy metal!
                length: 16,
                pattern: [
                    { step: 0, notes: [{ note: 'E3', duration: 1, velocity: 1.0 }] },
                    { step: 1, notes: [{ note: 'E3', duration: 1, velocity: 0.8 }] },
                    { step: 2, notes: [{ note: 'E4', duration: 1, velocity: 0.9 }] },
                    { step: 3, notes: [{ note: 'E3', duration: 1, velocity: 0.8 }] },
                    { step: 4, notes: [{ note: 'D4', duration: 1, velocity: 0.9 }] },
                    { step: 5, notes: [{ note: 'E3', duration: 1, velocity: 0.8 }] },
                    { step: 6, notes: [{ note: 'C4', duration: 1, velocity: 0.9 }] },
                    { step: 7, notes: [{ note: 'E3', duration: 1, velocity: 0.8 }] },
                    { step: 8, notes: [{ note: 'B3', duration: 2, velocity: 1.0 }] },
                    { step: 10, notes: [{ note: 'E3', duration: 1, velocity: 0.8 }] },
                    { step: 12, notes: [{ note: 'E4', duration: 3, velocity: 1.0 }] }
                ]
            }
        };

        return defaults[key] || null;
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
            octave: this.synthSeqState.octave,
            rootNote: this.synthSeqState.rootNote // 🔧 FIX: Also save rootNote
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
        if (confirm('Apply copied pattern settings (length, scale, octave, key)?')) {
            this.synthSeqState.length = this.patternClipboard.length;
            this.synthSeqState.scale = this.patternClipboard.scale;
            this.synthSeqState.octave = this.patternClipboard.octave;
            this.synthSeqState.rootNote = this.patternClipboard.rootNote || 'C3'; // 🔧 FIX: Restore rootNote with octave

            document.getElementById('synthSeqLength').value = this.synthSeqState.length;
            document.getElementById('synthSeqScale').value = this.synthSeqState.scale;
            document.getElementById('synthSeqOctave').value = this.synthSeqState.octave;

            // 🔧 FIX: Also update GLOBAL scale/key to match the pasted pattern
            const globalScaleSelect = document.getElementById('scaleSelect');
            const globalKeySelect = document.getElementById('keySelect');

            if (globalScaleSelect && this.patternClipboard.scale) {
                globalScaleSelect.value = this.patternClipboard.scale;
                this.musicEngine.setScale(this.patternClipboard.scale);
                console.log('🎼 Global scale dropdown updated to:', this.patternClipboard.scale);
            }

            if (globalKeySelect && this.patternClipboard.rootNote) {
                // Set both value and selectedIndex for reliable UI update
                globalKeySelect.value = this.patternClipboard.rootNote;
                const targetIndex = Array.from(globalKeySelect.options).findIndex(opt => opt.value === this.patternClipboard.rootNote);
                if (targetIndex !== -1) {
                    globalKeySelect.selectedIndex = targetIndex;
                    // Force UI refresh
                    globalKeySelect.blur();
                    globalKeySelect.focus();
                    globalKeySelect.blur();
                }
                this.musicEngine.setKey(this.patternClipboard.rootNote);
                console.log('🎹 Global key dropdown updated to:', this.patternClipboard.rootNote);
            }

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
                    // Get stored presets or use defaults
                    const presets = this.synthSeqState.tonejsPresets || {};
                    const padType = presets.pad || 'sine';
                    const leadType = presets.lead || 'sawtooth';
                    const bassType = presets.bass || 'triangle';
                    const arpType = presets.arp || 'square';

                    this.previewSynths = {
                        pad: new Tone.PolySynth(Tone.Synth, {
                            oscillator: { type: padType },
                            envelope: { attack: 0.8, decay: 0.2, sustain: 0.5, release: 1.5 },
                            volume: -6
                        }).toDestination(),
                        lead: new Tone.PolySynth(Tone.Synth, {
                            oscillator: { type: leadType },
                            envelope: { attack: 0.05, decay: 0.2, sustain: 0.4, release: 0.4 },
                            volume: -8
                        }).toDestination(),
                        bass: new Tone.PolySynth(Tone.Synth, {
                            oscillator: { type: bassType },
                            envelope: { attack: 0.02, decay: 0.3, sustain: 0.6, release: 0.5 },
                            volume: -3
                        }).toDestination(),
                        arp: new Tone.PolySynth(Tone.Synth, {
                            oscillator: { type: arpType },
                            envelope: { attack: 0.01, decay: 0.1, sustain: 0.2, release: 0.2 },
                            volume: -10
                        }).toDestination()
                    };
                    console.log('🎹 Created Tone.js preview synths with presets:', { padType, leadType, bassType, arpType });
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

    /**
     * Import MIDI file and intelligently distribute notes to 4 tracks
     */
    async importMidiFile(file) {
        try {
            console.log('📂 Importing MIDI file:', file.name);

            const arrayBuffer = await file.arrayBuffer();
            const dataView = new DataView(arrayBuffer);

            // Parse MIDI file
            const midiData = this.parseMidiFile(dataView);

            if (!midiData || midiData.tracks.length === 0) {
                alert('❌ Failed to parse MIDI file or no tracks found!');
                return;
            }

            console.log(`🎵 Parsed MIDI: ${midiData.tracks.length} tracks, ${midiData.allNotes.length} total notes`);

            // Intelligently distribute notes to our 4 tracks
            const distributedTracks = this.distributeNotesToTracks(midiData);

            // Show distribution summary
            const summary = Object.entries(distributedTracks).map(([track, notes]) =>
                `${track}: ${notes.length} notes`
            ).join('\n');

            const proceed = confirm(
                `📊 MIDI Distribution Analysis:\n\n${summary}\n\n` +
                `Total: ${midiData.allNotes.length} notes\n\n` +
                `This will replace current patterns. Continue?`
            );

            if (!proceed) {
                console.log('❌ Import cancelled by user');
                return;
            }

            // Apply to sequencer
            this.applyImportedTracks(distributedTracks);

            alert(`✅ MIDI imported successfully!\n\n${summary}`);
            console.log('✅ MIDI import complete');

        } catch (error) {
            console.error('❌ MIDI import error:', error);
            alert('❌ Error importing MIDI file: ' + error.message);
        }
    }

    /**
     * Parse MIDI file binary data
     */
    parseMidiFile(dataView) {
        let offset = 0;

        // Read header chunk
        const headerChunk = this.readString(dataView, offset, 4);
        if (headerChunk !== 'MThd') {
            throw new Error('Invalid MIDI file: Missing MThd header');
        }
        offset += 4;

        const headerLength = dataView.getUint32(offset);
        offset += 4;

        const format = dataView.getUint16(offset);
        offset += 2;

        const trackCount = dataView.getUint16(offset);
        offset += 2;

        const division = dataView.getUint16(offset);
        offset += 2;

        console.log(`📊 MIDI Format: ${format}, Tracks: ${trackCount}, Division: ${division}`);

        // Parse all tracks
        const tracks = [];
        const allNotes = [];

        for (let i = 0; i < trackCount; i++) {
            const trackData = this.parseMidiTrack(dataView, offset);
            offset = trackData.offset;

            if (trackData.notes.length > 0) {
                tracks.push(trackData.notes);
                allNotes.push(...trackData.notes);
            }
        }

        return {
            format,
            trackCount,
            division,
            tracks,
            allNotes
        };
    }

    /**
     * Parse a single MIDI track
     */
    parseMidiTrack(dataView, offset) {
        const trackHeader = this.readString(dataView, offset, 4);
        offset += 4;

        if (trackHeader !== 'MTrk') {
            throw new Error('Invalid track header');
        }

        const trackLength = dataView.getUint32(offset);
        offset += 4;

        const trackEnd = offset + trackLength;
        const notes = [];
        let time = 0;
        let runningStatus = 0;
        const activeNotes = {}; // Track note-on events

        while (offset < trackEnd) {
            // Read delta time
            const deltaResult = this.readVariableLength(dataView, offset);
            time += deltaResult.value;
            offset = deltaResult.offset;

            if (offset >= trackEnd) break;

            // Read event
            let status = dataView.getUint8(offset);

            if (status < 0x80) {
                // Running status
                status = runningStatus;
            } else {
                offset++;
                runningStatus = status;
            }

            const eventType = status & 0xF0;
            const channel = status & 0x0F;

            if (eventType === 0x90 || eventType === 0x80) {
                // Note On / Note Off
                const noteNumber = dataView.getUint8(offset++);
                const velocity = dataView.getUint8(offset++);

                if (eventType === 0x90 && velocity > 0) {
                    // Note On
                    activeNotes[noteNumber] = { time, velocity };
                } else {
                    // Note Off
                    if (activeNotes[noteNumber]) {
                        const noteOn = activeNotes[noteNumber];
                        const duration = time - noteOn.time;

                        notes.push({
                            note: this.midiNumberToNote(noteNumber),
                            midiNumber: noteNumber,
                            time: noteOn.time,
                            duration: duration,
                            velocity: noteOn.velocity / 127
                        });

                        delete activeNotes[noteNumber];
                    }
                }
            } else if (eventType === 0xB0 || eventType === 0xE0) {
                // Control Change / Pitch Bend - 2 data bytes
                offset += 2;
            } else if (eventType === 0xC0 || eventType === 0xD0) {
                // Program Change / Channel Pressure - 1 data byte
                offset += 1;
            } else if (status === 0xFF) {
                // Meta event
                const metaType = dataView.getUint8(offset++);
                const lengthResult = this.readVariableLength(dataView, offset);
                offset = lengthResult.offset + lengthResult.value;
            } else if (status === 0xF0 || status === 0xF7) {
                // SysEx event
                const lengthResult = this.readVariableLength(dataView, offset);
                offset = lengthResult.offset + lengthResult.value;
            }
        }

        return { notes, offset };
    }

    /**
     * Intelligently distribute MIDI notes to 4 tracks (pad, lead, bass, arp)
     */
    distributeNotesToTracks(midiData) {
        const distributed = {
            pad: [],
            lead: [],
            bass: [],
            arp: []
        };

        const allNotes = midiData.allNotes;

        if (allNotes.length === 0) {
            return distributed;
        }

        // Sort notes by time
        allNotes.sort((a, b) => a.time - b.time);

        // Analyze note ranges
        const midiNumbers = allNotes.map(n => n.midiNumber);
        const minNote = Math.min(...midiNumbers);
        const maxNote = Math.max(...midiNumbers);
        const range = maxNote - minNote;

        console.log(`🎼 Note range: ${this.midiNumberToNote(minNote)} to ${this.midiNumberToNote(maxNote)} (${range} semitones)`);

        // Strategy: Distribute by note range and pattern analysis
        // Bass: < C3 (MIDI 48)
        // Pad: C3-C4 (48-60) - sustained chords
        // Lead: > C4 (60) - melodic lines
        // Arp: Detected arpeggiated patterns

        // First pass: Detect arpeggios (fast sequential notes)
        const arpNotes = [];
        for (let i = 0; i < allNotes.length - 2; i++) {
            const note1 = allNotes[i];
            const note2 = allNotes[i + 1];
            const note3 = allNotes[i + 2];

            const timeDiff1 = note2.time - note1.time;
            const timeDiff2 = note3.time - note2.time;

            // If notes are < 120 ticks apart and within 1 octave, it's likely an arp
            if (timeDiff1 < 120 && timeDiff2 < 120 &&
                Math.abs(note2.midiNumber - note1.midiNumber) <= 12 &&
                Math.abs(note3.midiNumber - note2.midiNumber) <= 12) {
                arpNotes.push(note1, note2, note3);
                i += 2; // Skip next notes
            }
        }

        const arpSet = new Set(arpNotes);

        // Second pass: Distribute remaining notes
        for (const note of allNotes) {
            if (arpSet.has(note)) {
                distributed.arp.push(note);
            } else if (note.midiNumber < 48) {
                // Bass range
                distributed.bass.push(note);
            } else if (note.midiNumber < 60) {
                // Mid range - check if chord or melody
                // If multiple notes at same time, it's a chord (pad)
                const simultaneousNotes = allNotes.filter(n =>
                    Math.abs(n.time - note.time) < 10 && n !== note
                );

                if (simultaneousNotes.length >= 2) {
                    distributed.pad.push(note);
                } else if (note.duration > 240) {
                    // Long sustained notes → pad
                    distributed.pad.push(note);
                } else {
                    // Short single notes → lead
                    distributed.lead.push(note);
                }
            } else {
                // High range - lead melody
                distributed.lead.push(note);
            }
        }

        // Fallback: If a track has no notes, distribute evenly
        const emptyTracks = Object.entries(distributed).filter(([_, notes]) => notes.length === 0);
        if (emptyTracks.length > 0 && allNotes.length > 0) {
            console.log(`⚠️ Some tracks empty, redistributing...`);

            // Split notes evenly across all tracks
            allNotes.forEach((note, i) => {
                const trackNames = ['pad', 'lead', 'bass', 'arp'];
                const trackIndex = i % trackNames.length;
                distributed[trackNames[trackIndex]].push(note);
            });
        }

        return distributed;
    }

    /**
     * Apply imported MIDI tracks to sequencer
     */
    applyImportedTracks(distributedTracks) {
        // Find the time range
        let maxTime = 0;
        Object.values(distributedTracks).forEach(notes => {
            notes.forEach(note => {
                maxTime = Math.max(maxTime, note.time + note.duration);
            });
        });

        // Calculate pattern length (round up to nearest multiple of 4 steps)
        const timePerStep = 120; // Assume 480 PPQ, 16th notes = 120 ticks
        const requiredSteps = Math.ceil(maxTime / timePerStep);
        const patternLength = Math.max(16, Math.min(64, Math.ceil(requiredSteps / 4) * 4));

        console.log(`📏 Pattern length: ${patternLength} steps (${maxTime} ticks, ${requiredSteps} required)`);

        // Update pattern length
        this.synthSeqState.length = patternLength;
        document.getElementById('synthSeqLength').value = patternLength;

        // Convert and apply to each track
        ['pad', 'lead', 'bass', 'arp'].forEach(track => {
            const notes = distributedTracks[track];
            const pattern = [];

            notes.forEach(note => {
                const step = Math.floor(note.time / timePerStep);
                const duration = Math.max(1, Math.round(note.duration / timePerStep));

                // Find or create step
                let stepData = pattern.find(s => s.step === step);
                if (!stepData) {
                    stepData = { step, notes: [] };
                    pattern.push(stepData);
                }

                stepData.notes.push({
                    note: note.note,
                    duration,
                    velocity: note.velocity
                });
            });

            this.synthSeqState.patterns[track] = pattern;
        });

        // Refresh display
        this.renderPianoRoll();
    }

    /**
     * Helper: Read variable length value from MIDI
     */
    readVariableLength(dataView, offset) {
        let value = 0;
        let byte;

        do {
            byte = dataView.getUint8(offset++);
            value = (value << 7) | (byte & 0x7F);
        } while (byte & 0x80);

        return { value, offset };
    }

    /**
     * Helper: Read string from DataView
     */
    readString(dataView, offset, length) {
        let str = '';
        for (let i = 0; i < length; i++) {
            str += String.fromCharCode(dataView.getUint8(offset + i));
        }
        return str;
    }

    /**
     * Helper: Convert MIDI number to note name
     */
    midiNumberToNote(midiNumber) {
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = Math.floor(midiNumber / 12) - 1;
        const note = noteNames[midiNumber % 12];
        return note + octave;
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

            // Hide PROD mode status
            const prodStatus = document.getElementById('prodModeStatus');
            if (prodStatus) prodStatus.style.display = 'none';

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

            // Show PROD mode status
            const prodStatus = document.getElementById('prodModeStatus');
            if (prodStatus) prodStatus.style.display = 'block';

            console.log('🎹 Switched to PROD/DAW mode');

            // Load custom patterns from sequencer if playing
            if (this.isPlaying && this.musicEngine) {
                this.loadSequencerPatternsToEngine();
            }
        });

        console.log('✅ Mode Toggle initialized');
    }

    loadDemoPattern() {
        if (!this.musicEngine) return;

        // Get demo patterns from music engine
        const demoPatterns = this.musicEngine.getDefaultProdPatterns();

        // Load them into the sequencer state
        this.synthSeqState.patterns = demoPatterns;

        // Render the current track
        this.renderPianoRoll();

        console.log('🎵 Demo pattern loaded!');

        // If playing, reload patterns into engine
        if (this.isPlaying) {
            this.loadSequencerPatternsToEngine();
        }
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

    /**
     * Enable/Disable Chaos Mode for visuals
     */
    setChaosMode(enabled) {
        this.chaosMode = enabled;

        if (enabled) {
            console.log('🎲 CHAOS MODE (Visuals) ACTIVATED');
            this.startVisualChaos();
        } else {
            console.log('🛑 Chaos Mode (Visuals) deactivated');
            this.stopVisualChaos();
        }
    }

    /**
     * Start visual chaos - randomly change shaders
     */
    startVisualChaos() {
        if (this.visualChaosInterval) {
            clearInterval(this.visualChaosInterval);
        }

        // Change visuals every 12-20 seconds
        this.visualChaosInterval = setInterval(() => {
            if (!this.chaosMode) return;

            const actions = [
                () => this.randomizeMainShader(),
                () => this.randomizeToyShader(),
                () => this.randomizeBothShaders(),
                () => this.randomizeColors()
            ];

            const action = actions[Math.floor(Math.random() * actions.length)];
            action();
        }, 12000 + Math.random() * 8000); // 12-20 seconds
    }

    /**
     * Stop visual chaos
     */
    stopVisualChaos() {
        if (this.visualChaosInterval) {
            clearInterval(this.visualChaosInterval);
            this.visualChaosInterval = null;
        }
    }

    /**
     * Randomize main shader
     */
    randomizeMainShader() {
        if (!this.mainShader || !this.mainShader.shaders) return;

        const randomIndex = Math.floor(Math.random() * this.mainShader.shaders.length);
        this.mainShader.setShader(randomIndex);

        const select = document.getElementById('mainShaderSelect');
        if (select) select.value = randomIndex;

        console.log('🎲 Chaos: Main shader →', this.mainShader.shaders[randomIndex].name);
    }

    /**
     * Randomize toy shader
     */
    randomizeToyShader() {
        if (!this.toyRenderer || !this.toyRenderer.shaders) return;

        const randomIndex = Math.floor(Math.random() * this.toyRenderer.shaders.length);
        this.toyRenderer.setShader(randomIndex);

        const select = document.getElementById('toyShaderSelect');
        if (select) select.value = randomIndex;

        console.log('🎲 Chaos: Toy shader →', this.toyRenderer.shaders[randomIndex].name);
    }

    /**
     * Randomize both shaders at once
     */
    randomizeBothShaders() {
        this.randomizeMainShader();
        this.randomizeToyShader();
    }

    /**
     * Randomize colors (hue, saturation, brightness)
     */
    randomizeColors() {
        // Random target values
        const targetHue = Math.floor(Math.random() * 360);
        const targetSaturation = Math.floor(50 + Math.random() * 50);
        const targetBrightness = Math.floor(80 + Math.random() * 40);

        // Get current values from sliders
        const hueSlider = document.getElementById('colorHue');
        const satSlider = document.getElementById('colorSaturation');
        const brightSlider = document.getElementById('colorBrightness');

        const startHue = hueSlider ? parseInt(hueSlider.value) : 180;
        const startSaturation = satSlider ? parseInt(satSlider.value) : 75;
        const startBrightness = brightSlider ? parseInt(brightSlider.value) : 100;

        // Gradual transition over 3 seconds
        const duration = 3000;
        const startTime = Date.now();

        // Ease in-out function for smooth transitions
        const easeInOut = (t) => {
            return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        };

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeInOut(progress);

            // Calculate current values with easing
            const currentHue = Math.round(startHue + (targetHue - startHue) * easedProgress);
            const currentSaturation = Math.round(startSaturation + (targetSaturation - startSaturation) * easedProgress);
            const currentBrightness = Math.round(startBrightness + (targetBrightness - startBrightness) * easedProgress);

            // Normalize for shaders
            const hueNormalized = currentHue / 360;
            const saturationNormalized = currentSaturation / 100;
            const brightnessNormalized = currentBrightness / 100;

            // Apply to shaders
            if (this.mainShader) {
                this.mainShader.setColorHue(hueNormalized);
                this.mainShader.setColorSaturation(saturationNormalized);
                this.mainShader.setColorBrightness(brightnessNormalized);
            }

            if (this.toyRenderer) {
                this.toyRenderer.setColorHue(hueNormalized);
                this.toyRenderer.setColorSaturation(saturationNormalized);
                this.toyRenderer.setColorBrightness(brightnessNormalized);
            }

            // Update UI sliders
            const hueValue = document.getElementById('colorHueValue');
            const satValue = document.getElementById('colorSaturationValue');
            const brightValue = document.getElementById('colorBrightnessValue');

            if (hueSlider) hueSlider.value = currentHue;
            if (hueValue) hueValue.textContent = currentHue + '°';
            if (satSlider) satSlider.value = currentSaturation;
            if (satValue) satValue.textContent = currentSaturation + '%';
            if (brightSlider) brightSlider.value = currentBrightness;
            if (brightValue) brightValue.textContent = currentBrightness + '%';

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                console.log(`🎲 Chaos: Colors → Hue: ${targetHue}°, Sat: ${targetSaturation}%, Bright: ${targetBrightness}%`);
            }
        };

        animate();
    }

    /**
     * Get quality preset settings
     */
    getRecordingQuality() {
        const qualitySelect = document.getElementById('recordingQuality');
        const quality = qualitySelect ? qualitySelect.value : 'medium';

        const presets = {
            low: {
                fps: 24,
                videoBitrate: 1000000,      // 1 Mbps
                audioBitrate: 64000,        // 64 kbps
                name: 'Low Quality'
            },
            medium: {
                fps: 30,
                videoBitrate: 2500000,      // 2.5 Mbps
                audioBitrate: 256000,       // 256 kbps
                name: 'Medium Quality'
            },
            high: {
                fps: 30,
                videoBitrate: 5000000,      // 5 Mbps
                audioBitrate: 320000,       // 320 kbps
                name: 'High Quality'
            },
            ultra: {
                fps: 60,
                videoBitrate: 8000000,      // 8 Mbps
                audioBitrate: 320000,       // 320 kbps
                name: 'Ultra Quality'
            },
            '4k': {
                fps: 60,
                videoBitrate: 20000000,     // 20 Mbps
                audioBitrate: 320000,       // 320 kbps
                name: '4K Quality'
            }
        };

        return presets[quality] || presets.medium;
    }

    /**
     * Start recording (audio-only or video + audio)
     */
    async startRecording() {
        try {
            // Check recording mode
            const recordingModeSelect = document.getElementById('recordingMode');
            const isVideoMode = recordingModeSelect.value === 'video';

            // Create audio stream from Tone.js
            this.recordingDestination = Tone.context.createMediaStreamDestination();
            Tone.getDestination().connect(this.recordingDestination);
            const audioStream = this.recordingDestination.stream;

            let combinedStream;
            let mimeType;
            let audioBitrate;

            if (isVideoMode) {
                // VIDEO MODE: Canvas + Audio
                const qualitySettings = this.getRecordingQuality();
                console.log(`🎥 Starting video + audio recording (${qualitySettings.name}, ${qualitySettings.fps} FPS)...`);

                // Get canvas stream with selected FPS
                const canvas = document.getElementById('mainCanvas');
                if (!canvas) {
                    throw new Error('Canvas not found');
                }

                const videoStream = canvas.captureStream(qualitySettings.fps);

                // Combine video and audio tracks
                combinedStream = new MediaStream([
                    ...videoStream.getVideoTracks(),
                    ...audioStream.getAudioTracks()
                ]);

                // Video codec
                mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
                    ? 'video/webm;codecs=vp9'
                    : 'video/webm';

                audioBitrate = qualitySettings.audioBitrate;

                this.mediaRecorder = new MediaRecorder(combinedStream, {
                    mimeType: mimeType,
                    videoBitsPerSecond: qualitySettings.videoBitrate,
                    audioBitsPerSecond: audioBitrate
                });

                const videoBitrateMbps = (qualitySettings.videoBitrate / 1000000).toFixed(1);
                console.log(`✅ Recording started: ${qualitySettings.name}`);
                console.log(`   Video: ${videoBitrateMbps} Mbps @ ${qualitySettings.fps} FPS`);
                console.log(`   Audio: ${audioBitrate / 1000} kbps`);
                console.log(`   Codec: ${mimeType}`);

            } else {
                // AUDIO-ONLY MODE
                const audioQualitySelect = document.getElementById('audioQuality');
                audioBitrate = parseInt(audioQualitySelect.value) * 1000; // Convert kbps to bps

                console.log(`🎵 Starting audio-only recording (${audioBitrate / 1000} kbps)...`);

                // Use audio stream directly
                combinedStream = audioStream;

                // Audio codec - try to use high quality formats
                if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                    mimeType = 'audio/webm;codecs=opus';
                } else if (MediaRecorder.isTypeSupported('audio/webm')) {
                    mimeType = 'audio/webm';
                } else {
                    mimeType = 'audio/ogg;codecs=opus';
                }

                this.mediaRecorder = new MediaRecorder(combinedStream, {
                    mimeType: mimeType,
                    audioBitsPerSecond: audioBitrate
                });

                console.log(`✅ Audio recording started`);
                console.log(`   Bitrate: ${audioBitrate / 1000} kbps`);
                console.log(`   Codec: ${mimeType}`);
            }

            // Reset chunks
            this.audioChunks = [];

            // Collect data
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            // Handle recording stop
            this.mediaRecorder.onstop = () => {
                console.log('✅ Recording stopped, processing...');
            };

            // Start recording
            this.mediaRecorder.start();

        } catch (error) {
            console.error('❌ Error starting recording:', error);
            alert('Failed to start recording: ' + error.message);
        }
    }

    /**
     * Stop recording and download the file
     */
    stopRecording() {
        if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
            console.warn('⚠️ No active recording to stop');
            return;
        }

        console.log('🛑 Stopping recording...');

        // Check recording mode
        const recordingModeSelect = document.getElementById('recordingMode');
        const isVideoMode = recordingModeSelect.value === 'video';

        // Stop the recorder
        this.mediaRecorder.stop();

        // Wait for final data and create download
        this.mediaRecorder.onstop = () => {
            console.log(`📦 Creating ${isVideoMode ? 'video' : 'audio'} file...`);

            // Create blob from chunks
            const mimeType = this.mediaRecorder.mimeType;
            const blob = new Blob(this.audioChunks, { type: mimeType });

            // Create download link
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            // Generate filename with timestamp and correct extension
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            let extension;
            let prefix;

            if (isVideoMode) {
                extension = 'webm';
                prefix = 'mesmer-video';
            } else {
                // Determine audio extension from mime type
                if (mimeType.includes('webm')) {
                    extension = 'webm';
                } else if (mimeType.includes('ogg')) {
                    extension = 'ogg';
                } else {
                    extension = 'webm'; // fallback
                }
                prefix = 'mesmer-audio';
            }

            link.download = `${prefix}-${timestamp}.${extension}`;

            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Cleanup
            URL.revokeObjectURL(url);

            // Disconnect recording destination
            if (this.recordingDestination) {
                Tone.getDestination().disconnect(this.recordingDestination);
                this.recordingDestination = null;
            }

            const fileSizeMB = (blob.size / 1024 / 1024).toFixed(2);
            console.log(`💾 Recording saved! (${fileSizeMB} MB)`);
        };
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

    /**
     * Update DJ UI with track info
     */
    updateDJUI(trackInfo) {
        if (!this.djEngine || !this.djControlPanel || !this.djAudioViz) return;

        const activeDeck = this.djEngine.getActiveDeck();
        const playbackState = this.djEngine.getPlaybackState(activeDeck);
        const fxState = this.djFXRack.getActiveEffects();

        // Draw control panel
        this.djControlPanel.draw(trackInfo, playbackState, fxState);

        // Start DJ visualizer animation loop if not running
        if (!this.djAnimationRunning) {
            this.djAnimationRunning = true;
            this.animateDJMode();
        }
    }

    /**
     * DJ Mode animation loop
     */
    animateDJMode() {
        if (!this.handTracking.djMode || !this.djEngine) {
            this.djAnimationRunning = false;
            return;
        }

        const activeDeck = this.djEngine.getActiveDeck();
        const trackInfo = this.djEngine.getTrackInfo(activeDeck);
        const playbackState = this.djEngine.getPlaybackState(activeDeck);
        const fxState = this.djFXRack.getActiveEffects();

        // Draw control panel
        if (this.djControlPanel && trackInfo) {
            this.djControlPanel.draw(trackInfo, playbackState, fxState);
        }

        // Draw audio visualizer
        if (this.djAudioViz && this.djEngine.analyser) {
            this.djAudioViz.draw(fxState);
        }

        requestAnimationFrame(() => this.animateDJMode());
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
