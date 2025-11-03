/**
 * Hand Tracking Module
 * Uses MediaPipe Hands to detect and track hands in webcam video
 */

class HandTracking {
    constructor(gestureRecognizer, musicMapper) {
        this.gestureRecognizer = gestureRecognizer;
        this.musicMapper = musicMapper;

        // Video and canvas elements
        this.video = null;
        this.canvas = null;
        this.ctx = null;

        // MediaPipe Hand Landmarker
        this.handLandmarker = null;
        this.runningMode = 'VIDEO';

        // State
        this.isInitialized = false;
        this.isRunning = false;
        this.lastVideoTime = -1;
        this.results = null;

        // Settings
        this.drawLandmarks = true;
        this.showVideo = true;

        // Hand audio settings
        this.handVolume = 0.7; // 70% default
        this.currentEngine = 'tonejs'; // tonejs, wad, dirt
        this.currentPreset = 'sine'; // Current sound preset
        this.playbackMode = 'note'; // note, legato, arpeggio, chord
        this.handInteractionMode = 'layer'; // layer (additional) or control (generative)

        // Theremin mode settings
        this.thereminMode = false; // Theremin mode toggle
        this.thereminHand = 'right'; // Which hand controls theremin (right or left)
        this.thereminSound = 'sine'; // Theremin oscillator type (legacy - kept for backwards compat)
        this.thereminQuantize = false; // Quantize theremin to scale notes
        this.thereminOtherHand = 'volume'; // What the other hand controls (none, volume, filter, octave)
        this.thereminPlaybackMode = 'continuous'; // continuous or arpeggio
        this.thereminEngine = 'tonejs'; // tonejs, wad, dirt
        this.thereminPreset = 'sine'; // Current theremin preset

        // Piano mode settings
        this.pianoMode = false; // Piano mode toggle
        this.pianoEngine = 'tonejs'; // tonejs, wad, dirt
        this.pianoPreset = 'piano'; // Current piano preset
        this.pianoOctaveRange = 3; // Number of octaves to spread across screen
        this.pianoTapSensitivity = 0.015; // Tap detection threshold

        // Drum mode settings
        this.drumMode = false; // Drum mode toggle
        this.drumKit = 'acoustic'; // Current drum kit from Dirt library
        this.drumStrikeSensitivity = 0.02; // Strike detection threshold
        this.drumZoneLayout = 'standard'; // standard, compact, custom

        // Motion tracking for tap/strike detection
        this.previousHandPositions = {
            left: null,
            right: null
        };
        this.handVelocities = {
            left: { x: 0, y: 0, z: 0 },
            right: { x: 0, y: 0, z: 0 }
        };
        this.lastTapTime = {
            left: 0,
            right: 0
        };
        this.tapDebounceMs = 100; // Minimum time between taps

        // Drumstick mode: Track index fingertip positions for more accurate drum hitting
        this.previousDrumstickPositions = {
            left: null,
            right: null
        };
        this.drumstickVelocities = {
            left: { x: 0, y: 0, z: 0 },
            right: { x: 0, y: 0, z: 0 }
        };

        // Visual indicators for played notes/drums
        this.lastPlayedNotes = {
            left: null,
            right: null
        };
        this.lastPlayedNotesTime = {
            left: 0,
            right: 0
        };
        this.lastDrumHits = {
            left: null,
            right: null
        };
        this.lastDrumHitsTime = {
            left: 0,
            right: 0
        };
        this.noteDisplayDuration = 1000; // ms to display played notes

        // Fingertip zone tracking for piano mode
        this.fingertipStates = {
            left: {}, // Track each finger: { thumb: { inZone: false, lastNote: null, lastTriggerTime: 0 }, ... }
            right: {}
        };
        this.fingerDebounceMs = 150; // Debounce time for each finger

        // Performance
        this.frameCount = 0;
        this.fps = 0;
        this.lastFpsUpdate = Date.now();

        // Setup UI controls
        this.setupHandAudioControls();

        console.log('👋 Hand Tracking initialized');
    }

    /**
     * Setup hand audio control UI elements
     */
    setupHandAudioControls() {
        // Hand Volume Slider
        const handVolumeSlider = document.getElementById('handVolumeSlider');
        const handVolumeValue = document.getElementById('handVolumeValue');

        if (handVolumeSlider && handVolumeValue) {
            handVolumeSlider.addEventListener('input', (e) => {
                this.handVolume = parseInt(e.target.value) / 100;
                handVolumeValue.textContent = `${e.target.value}%`;
                console.log('🎚️ Hand volume:', this.handVolume);
            });
        }

        // Synth Engine Selector & Sound Preset Selector
        const handEngineSelect = document.getElementById('handEngineSelect');
        const handPresetSelect = document.getElementById('handPresetSelect');
        const activePreset = document.getElementById('activePreset');

        if (handEngineSelect && handPresetSelect) {
            handEngineSelect.addEventListener('change', (e) => {
                this.currentEngine = e.target.value;
                console.log('🎛️ Switched engine to:', this.currentEngine);

                // Update preset dropdown based on engine
                this.updatePresetOptions(handPresetSelect);

                // Update active preset display
                this.updateActivePresetDisplay();
            });
        }

        if (handPresetSelect && activePreset) {
            handPresetSelect.addEventListener('change', (e) => {
                this.currentPreset = e.target.value;

                // Update visual indicator
                this.updateActivePresetDisplay();

                console.log('🎹 Changed preset to:', this.currentPreset);
            });
        }

        // Playback Mode Selector
        const handModeSelect = document.getElementById('handModeSelect');

        if (handModeSelect) {
            handModeSelect.addEventListener('change', (e) => {
                this.playbackMode = e.target.value;
                this.updateActivePresetDisplay();
                console.log('🎵 Changed playback mode to:', this.playbackMode);
            });
        }

        // Hand Mode Toggle Buttons
        const handModeLayer = document.getElementById('handModeLayer');
        const handModeControl = document.getElementById('handModeControl');

        console.log('🔍 DEBUG: handModeLayer found?', !!handModeLayer);
        console.log('🔍 DEBUG: handModeControl found?', !!handModeControl);

        if (handModeLayer && handModeControl) {
            console.log('✅ Hand mode toggle buttons found, adding event listeners');

            // Layer Mode Handler
            const activateLayerMode = (e) => {
                console.log('🔵 Layer button clicked!', e);
                e.preventDefault();
                e.stopPropagation();
                this.handInteractionMode = 'layer';
                handModeLayer.classList.add('active');
                handModeControl.classList.remove('active');
                console.log('🎵 Hand Mode: Additional Layer (plays alongside generative music)');

                // Resume generative music if it was paused
                if (this.musicMapper && this.musicMapper.musicEngine) {
                    this.musicMapper.musicEngine.resume();
                }
            };

            // Control Mode Handler
            const activateControlMode = (e) => {
                console.log('🔵 Control button clicked!', e);
                e.preventDefault();
                e.stopPropagation();
                this.handInteractionMode = 'control';
                handModeControl.classList.add('active');
                handModeLayer.classList.remove('active');
                console.log('🎛️ Hand Mode: Control Generative (controls/pauses generative music)');
            };

            // Add multiple event types for better compatibility
            handModeLayer.addEventListener('click', activateLayerMode, true);
            handModeLayer.addEventListener('mousedown', activateLayerMode, true);
            handModeLayer.addEventListener('touchstart', activateLayerMode, true);

            handModeControl.addEventListener('click', activateControlMode, true);
            handModeControl.addEventListener('mousedown', activateControlMode, true);
            handModeControl.addEventListener('touchstart', activateControlMode, true);

            console.log('✅ Event listeners attached with capture phase');
        } else {
            console.error('❌ Hand mode toggle buttons not found in DOM!');
        }

        // Theremin Mode Controls
        const thereminToggle = document.getElementById('thereminToggle');
        const thereminHandSelect = document.getElementById('thereminHandSelect');
        const thereminSoundSelect = document.getElementById('thereminSoundSelect');
        const thereminQuantize = document.getElementById('thereminQuantize');

        console.log('🔍 DEBUG: thereminToggle found?', !!thereminToggle);
        console.log('🔍 DEBUG: thereminHandSelect found?', !!thereminHandSelect);
        console.log('🔍 DEBUG: thereminSoundSelect found?', !!thereminSoundSelect);
        console.log('🔍 DEBUG: thereminQuantize found?', !!thereminQuantize);

        if (thereminToggle) {
            console.log('✅ Adding theremin toggle event listener');
            thereminToggle.addEventListener('change', (e) => {
                this.thereminMode = e.target.checked;
                console.log('🎵 Theremin mode:', this.thereminMode ? 'ON' : 'OFF');
            });

            // Also add click handler for extra safety
            thereminToggle.addEventListener('click', (e) => {
                console.log('🎵 Theremin toggle clicked!', e.target.checked);
            });
        } else {
            console.error('❌ Theremin toggle not found in DOM!');
        }

        if (thereminHandSelect) {
            console.log('✅ Adding theremin hand select event listener');
            thereminHandSelect.addEventListener('change', (e) => {
                this.thereminHand = e.target.value;
                console.log('✋ Theremin pitch hand:', this.thereminHand);
            });
        } else {
            console.error('❌ Theremin hand select not found in DOM!');
        }

        // Theremin other hand control selector
        const thereminOtherHandSelect = document.getElementById('thereminOtherHandSelect');
        const otherHandHint = document.getElementById('otherHandHint');

        if (thereminOtherHandSelect) {
            console.log('✅ Adding theremin other hand select event listener');

            // Function to update hint text
            const updateHint = (value) => {
                if (!otherHandHint) return;
                const hints = {
                    'none': '💡 Other hand is disabled',
                    'volume': '💡 Move other hand LEFT/RIGHT for volume',
                    'filter': '💡 Move other hand UP/DOWN for filter brightness',
                    'octave': '💡 Move other hand UP/DOWN to shift octaves',
                    'reverb': '💡 Move other hand LEFT/RIGHT for reverb amount',
                    'delay': '💡 Move other hand LEFT/RIGHT for delay time'
                };
                otherHandHint.textContent = hints[value] || hints['none'];
            };

            // Set initial hint
            updateHint(this.thereminOtherHand);

            thereminOtherHandSelect.addEventListener('change', (e) => {
                const oldValue = this.thereminOtherHand;
                this.thereminOtherHand = e.target.value;
                updateHint(this.thereminOtherHand);
                console.log(`🔄 Other hand control: "${oldValue}" → "${this.thereminOtherHand}"`);
            });
        } else {
            console.error('❌ thereminOtherHandSelect NOT FOUND IN DOM!');
        }

        if (thereminSoundSelect) {
            console.log('✅ Adding theremin sound select event listener');
            thereminSoundSelect.addEventListener('change', (e) => {
                this.thereminSound = e.target.value;
                console.log('🔊 Theremin sound:', this.thereminSound);

                // Notify music mapper to update theremin synth
                if (this.musicMapper && this.musicMapper.updateThereminSound) {
                    this.musicMapper.updateThereminSound(this.thereminSound);
                }
            });
        } else {
            console.error('❌ Theremin sound select not found in DOM!');
        }

        if (thereminQuantize) {
            console.log('✅ Adding theremin quantize event listener');
            thereminQuantize.addEventListener('change', (e) => {
                this.thereminQuantize = e.target.checked;
                console.log('🎹 Theremin quantize:', this.thereminQuantize ? 'ON (Snapping to scale notes)' : 'OFF (Continuous pitch)');
            });

            // Also add click handler for extra safety
            thereminQuantize.addEventListener('click', (e) => {
                console.log('🎹 Theremin quantize clicked!', e.target.checked);
            });
        } else {
            console.error('❌ Theremin quantize checkbox not found in DOM!');
        }

        // NEW: Theremin Mode selector (Continuous/Arpeggio)
        const thereminModeSelect = document.getElementById('thereminModeSelect');
        if (thereminModeSelect) {
            console.log('✅ Adding theremin mode select event listener');
            thereminModeSelect.addEventListener('change', (e) => {
                this.thereminPlaybackMode = e.target.value;
                console.log('🎵 Theremin playback mode:', this.thereminPlaybackMode);
            });
        } else {
            console.warn('⚠️ Theremin mode select not found in DOM');
        }

        // NEW: Theremin Engine selector (Tone.js/WAD/Dirt)
        const thereminEngineSelect = document.getElementById('thereminEngineSelect');
        if (thereminEngineSelect) {
            console.log('✅ Adding theremin engine select event listener');
            thereminEngineSelect.addEventListener('change', (e) => {
                const oldEngine = this.thereminEngine;
                this.thereminEngine = e.target.value;
                console.log(`🔧 [HAND-TRACKING] Engine changed: ${oldEngine} → ${this.thereminEngine}`);

                // Update preset dropdown options based on engine
                this.updateThereminPresetOptions();
            });
        } else {
            console.warn('⚠️ Theremin engine select not found in DOM');
        }

        // NEW: Theremin Preset selector
        const thereminPresetSelect = document.getElementById('thereminPresetSelect');
        if (thereminPresetSelect) {
            console.log('✅ Adding theremin preset select event listener');
            thereminPresetSelect.addEventListener('change', (e) => {
                const oldPreset = this.thereminPreset;
                this.thereminPreset = e.target.value;
                console.log(`[HAND-TRACKING] Preset changed: ${oldPreset} → ${this.thereminPreset}`);
            });
        } else {
            console.warn('Theremin preset select not found in DOM');
        }

        // Piano Mode Controls
        const pianoToggle = document.getElementById('pianoToggle');
        const pianoEngineSelect = document.getElementById('pianoEngineSelect');
        const pianoPresetSelect = document.getElementById('pianoPresetSelect');
        const pianoOctaveRange = document.getElementById('pianoOctaveRange');

        if (pianoToggle) {
            pianoToggle.addEventListener('change', (e) => {
                this.pianoMode = e.target.checked;
                // Turn off other modes when piano is enabled
                if (this.pianoMode) {
                    this.thereminMode = false;
                    this.drumMode = false;
                    const thereminToggle = document.getElementById('thereminToggle');
                    const drumToggle = document.getElementById('drumToggle');
                    if (thereminToggle) thereminToggle.checked = false;
                    if (drumToggle) drumToggle.checked = false;
                }
                console.log(`[PIANO] Mode ${this.pianoMode ? 'enabled' : 'disabled'}`);
            });
        }

        if (pianoEngineSelect) {
            pianoEngineSelect.addEventListener('change', (e) => {
                this.pianoEngine = e.target.value;
                console.log(`[PIANO] Engine changed: ${this.pianoEngine}`);
            });
        }

        if (pianoPresetSelect) {
            pianoPresetSelect.addEventListener('change', (e) => {
                this.pianoPreset = e.target.value;
                console.log(`[PIANO] Preset changed: ${this.pianoPreset}`);
            });
        }

        if (pianoOctaveRange) {
            pianoOctaveRange.addEventListener('change', (e) => {
                this.pianoOctaveRange = parseInt(e.target.value);
                console.log(`[PIANO] Octave range changed: ${this.pianoOctaveRange}`);
            });
        }

        // Drum Mode Controls
        const drumToggle = document.getElementById('drumToggle');
        const drumKitSelect = document.getElementById('drumKitSelect');

        if (drumToggle) {
            drumToggle.addEventListener('change', (e) => {
                this.drumMode = e.target.checked;
                // Turn off other modes when drum is enabled
                if (this.drumMode) {
                    this.thereminMode = false;
                    this.pianoMode = false;
                    const thereminToggle = document.getElementById('thereminToggle');
                    const pianoToggle = document.getElementById('pianoToggle');
                    if (thereminToggle) thereminToggle.checked = false;
                    if (pianoToggle) pianoToggle.checked = false;
                }
                console.log(`[DRUM] Mode ${this.drumMode ? 'enabled' : 'disabled'}`);
            });
        }

        if (drumKitSelect) {
            drumKitSelect.addEventListener('change', (e) => {
                this.drumKit = e.target.value;
                console.log(`[DRUM] Kit changed: ${this.drumKit}`);
            });
        }
    }

    /**
     * Update theremin preset options based on selected engine
     */
    updateThereminPresetOptions() {
        const thereminPresetSelect = document.getElementById('thereminPresetSelect');
        if (!thereminPresetSelect) return;

        const presetsByEngine = {
            tonejs: [
                { value: 'sine', label: '🎵 Classic Sine' },
                { value: 'triangle', label: '🔺 Warm Triangle' },
                { value: 'sawtooth', label: '🔶 Bright Sawtooth' },
                { value: 'square', label: '⬜ Square Wave' },
                { value: 'fatsine', label: '🎶 Fat Sine' },
                { value: 'fatsawtooth', label: '🔸 Fat Sawtooth' },
                { value: 'amsine', label: '✨ AM Sine' },
                { value: 'fmsine', label: '🌀 FM Sine' }
            ],
            wad: [
                { value: 'sine', label: '🌊 Pure Sine' },
                { value: 'sawtooth', label: '🔪 Sharp Sawtooth' },
                { value: 'square', label: '📦 Pulse Square' },
                { value: 'triangle', label: '🔺 Soft Triangle' }
            ],
            dirt: [
                { value: 'pad', label: '🌌 Ethereal Pad' },
                { value: 'pluck', label: '🎸 Plucked String' },
                { value: 'bass', label: '🔊 Deep Bass' },
                { value: 'arpy', label: '🎹 Arpeggio Synth' }
            ]
        };

        const presets = presetsByEngine[this.thereminEngine] || presetsByEngine.tonejs;

        // Clear existing options
        thereminPresetSelect.innerHTML = '';

        // Add new options
        presets.forEach(preset => {
            const option = document.createElement('option');
            option.value = preset.value;
            option.textContent = preset.label;
            thereminPresetSelect.appendChild(option);
        });

        // Set to first preset
        this.thereminPreset = presets[0].value;
        thereminPresetSelect.value = this.thereminPreset;

        console.log(`🎨 Theremin presets updated for ${this.thereminEngine} engine`);
    }

    /**
     * Update Active Preset Display with sound preset name
     */
    updateActivePresetDisplay() {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📺 updateActivePresetDisplay() CALLED');

        const activePresetText = document.getElementById('activePresetText');
        const activePreset = document.getElementById('activePreset');
        const handScaleOverlay = document.getElementById('handScaleOverlay');

        console.log(`📋 handScaleOverlay element exists: ${!!handScaleOverlay}`);
        console.log(`📋 musicMapper exists: ${!!this.musicMapper}`);
        console.log(`📋 chordEngine exists: ${!!(this.musicMapper && this.musicMapper.chordEngine)}`);

        // Update scale/key/mode overlay on video
        if (handScaleOverlay) {
            // Check if chord engine is available
            if (this.musicMapper && this.musicMapper.chordEngine) {
                const scale = this.musicMapper.chordEngine.getCurrentScale();
                const key = this.musicMapper.chordEngine.getCurrentRoot();
                const scaleName = scale.charAt(0).toUpperCase() + scale.slice(1);
                const modeNames = {
                    'note': 'Note',
                    'legato': 'Legato',
                    'arpeggio': 'Arpeggio',
                    'chord': 'Chord'
                };
                const modeName = modeNames[this.playbackMode] || 'Note';

                console.log(`📋 Read from ChordEngine:`);
                console.log(`   - scale: "${scale}"`);
                console.log(`   - key: "${key}"`);
                console.log(`   - scaleName: "${scaleName}"`);
                console.log(`   - modeName: "${modeName}"`);

                const newText = `${key} ${scaleName} • ${modeName}`;
                console.log(`📋 Setting overlay text to: "${newText}"`);
                handScaleOverlay.textContent = newText;

                console.log(`✅ Overlay updated successfully: ${key} ${scaleName} • ${modeName}`);
            } else {
                // Fallback to defaults if chord engine not ready yet
                console.warn('⚠️ Chord engine not ready, using defaults');
                console.log(`📋 this.musicMapper = ${this.musicMapper}`);
                if (this.musicMapper) {
                    console.log(`📋 this.musicMapper.chordEngine = ${this.musicMapper.chordEngine}`);
                }
                handScaleOverlay.textContent = 'C3 Minor • Note';
            }
        } else {
            console.error('❌ handScaleOverlay element NOT FOUND in DOM!');
        }

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // Update active preset with sound preset name
        if (activePresetText && activePreset) {
            const handPresetSelect = document.getElementById('handPresetSelect');
            if (handPresetSelect) {
                const selectedOption = handPresetSelect.options[handPresetSelect.selectedIndex];
                const presetName = selectedOption.text;
                const groupLabel = selectedOption.parentElement.label;

                // Update preset name
                activePresetText.textContent = presetName;

                // Update icon and color based on category
                let icon, color;
                if (groupLabel.includes('Pad')) {
                    icon = '🎹'; color = '#8b5cf6';
                } else if (groupLabel.includes('Lead')) {
                    icon = '⚡'; color = '#3b82f6';
                } else if (groupLabel.includes('Bass')) {
                    icon = '🔊'; color = '#ef4444';
                } else {
                    icon = '✨'; color = '#10b981';
                }

                activePreset.querySelector('span').textContent = icon;
                activePreset.style.borderLeftColor = color;
            }
        }
    }

    /**
     * Update preset dropdown options based on selected engine
     */
    updatePresetOptions(handPresetSelect) {
        if (!handPresetSelect) return;

        // Clear existing options
        handPresetSelect.innerHTML = '';

        if (this.currentEngine === 'tonejs') {
            // Tone.js oscillator presets (Celestial)
            handPresetSelect.innerHTML = `
                <optgroup label="🎹 Pad Synth">
                    <option value="sine" selected>Smooth Sine</option>
                    <option value="triangle">Warm Triangle</option>
                    <option value="sawtooth">Rich Sawtooth</option>
                    <option value="square">Hollow Square</option>
                    <option value="fatsine">Fat Sine</option>
                    <option value="fatsawtooth">Fat Sawtooth</option>
                </optgroup>
                <optgroup label="⚡ Lead Synth">
                    <option value="sine">Pure Sine</option>
                    <option value="triangle">Soft Triangle</option>
                    <option value="sawtooth">Bright Sawtooth</option>
                    <option value="square">Digital Square</option>
                    <option value="fatsawtooth">Fat Sawtooth</option>
                </optgroup>
                <optgroup label="🔊 Bass Synth">
                    <option value="sine">Deep Sine</option>
                    <option value="fatsine">Fat Sine</option>
                    <option value="triangle">Round Triangle</option>
                    <option value="sawtooth">Aggressive Saw</option>
                    <option value="square">Sub Square</option>
                </optgroup>
                <optgroup label="🎵 Arp Synth">
                    <option value="sine">Smooth Sine</option>
                    <option value="triangle">Soft Triangle</option>
                    <option value="sawtooth">Sharp Sawtooth</option>
                    <option value="square">Classic Square</option>
                </optgroup>
            `;
            this.currentPreset = 'sine';
        } else if (this.currentEngine === 'wad') {
            // WAD synth presets (Magma)
            handPresetSelect.innerHTML = `
                <optgroup label="🎹 Pad Sound">
                    <option value="warmPad" selected>Warm Pad</option>
                    <option value="spacePad">Space Pad</option>
                    <option value="dreamPad">Dream Pad</option>
                    <option value="atmosphericPad">Atmospheric</option>
                    <option value="drone">Drone</option>
                    <option value="ghost">Ghost</option>
                </optgroup>
                <optgroup label="⚡ Lead Sound">
                    <option value="brightLead">Bright Lead</option>
                    <option value="analogLead">Analog Lead</option>
                </optgroup>
                <optgroup label="🔊 Bass Sound">
                    <option value="deepBass">Deep Bass</option>
                    <option value="subBass">Sub Bass</option>
                    <option value="acidBass">Acid Bass</option>
                </optgroup>
                <optgroup label="🎵 Arp Sound">
                    <option value="digitalArp">Digital Arp</option>
                    <option value="classicArp">Classic Arp</option>
                    <option value="electricPiano">Electric Piano</option>
                    <option value="pluck">Pluck</option>
                </optgroup>
            `;
            this.currentPreset = 'warmPad';
        } else if (this.currentEngine === 'dirt') {
            // Dirt sample banks (Chaos)
            handPresetSelect.innerHTML = `
                <optgroup label="🎹 Pad Samples">
                    <option value="pad" selected>Pad</option>
                    <option value="breath">Breath</option>
                    <option value="cosmicg">Cosmicg</option>
                    <option value="feel">Feel</option>
                    <option value="moog">Moog</option>
                    <option value="space">Space</option>
                    <option value="wind">Wind</option>
                </optgroup>
                <optgroup label="⚡ Lead Samples">
                    <option value="arpy">Arpy</option>
                    <option value="bleep">Bleep</option>
                    <option value="hoover">Hoover</option>
                    <option value="sax">Sax</option>
                    <option value="trump">Trumpet</option>
                </optgroup>
                <optgroup label="🔊 Bass Samples">
                    <option value="bass">Bass</option>
                    <option value="bass3">Bass 3</option>
                    <option value="jungbass">Jungle Bass</option>
                    <option value="wobble">Wobble</option>
                </optgroup>
                <optgroup label="🎵 Arp Samples">
                    <option value="arp">Arp</option>
                    <option value="blip">Blip</option>
                    <option value="click">Click</option>
                    <option value="glitch">Glitch</option>
                </optgroup>
            `;
            this.currentPreset = 'pad';
        }

        console.log(`✅ Updated presets for ${this.currentEngine} engine`);
    }

    /**
     * Initialize MediaPipe Hands
     */
    async init() {
        try {
            console.log('📦 Loading MediaPipe Hands model...');
            console.log('🔍 DEBUG: window.mpVision initially:', typeof window.mpVision);
            console.log('🔍 DEBUG: Checking all window properties...');

            // Check what's available in window
            const visionKeys = Object.keys(window).filter(k =>
                k.toLowerCase().includes('vision') ||
                k.toLowerCase().includes('mediapipe') ||
                k.toLowerCase().includes('hand')
            );
            console.log('🔍 DEBUG: Window keys related to vision/mediapipe/hand:', visionKeys);

            // Wait for MediaPipe library to load
            let attempts = 0;
            while (typeof window.mpVision === 'undefined' && attempts < 50) {
                if (attempts % 10 === 0) {
                    console.log(`🔍 DEBUG: Waiting for MediaPipe... attempt ${attempts}/50`);
                }
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }

            console.log(`🔍 DEBUG: After waiting ${attempts} attempts, window.mpVision is:`, typeof window.mpVision);

            // Check if MediaPipe is available
            if (typeof window.mpVision === 'undefined') {
                console.error('❌ MediaPipe not found after waiting');
                console.log('🔍 DEBUG: Final check - all window keys:', Object.keys(window).filter(k => !k.startsWith('webkit')).slice(0, 100));
                throw new Error('MediaPipe vision library not loaded. Please refresh the page.');
            }

            console.log('✅ window.mpVision found:', window.mpVision);
            const { HandLandmarker, FilesetResolver } = window.mpVision;
            console.log('🔍 DEBUG: HandLandmarker:', typeof HandLandmarker);
            console.log('🔍 DEBUG: FilesetResolver:', typeof FilesetResolver);

            console.log('📦 Loading vision tasks WASM...');

            // Load the MediaPipe vision module
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
            );

            console.log('📦 Creating hand landmarker...');

            // Create hand landmarker with LOCAL model
            this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: 'models/hand_landmarker.task',
                    delegate: 'GPU'
                },
                runningMode: this.runningMode,
                numHands: 2,
                minHandDetectionConfidence: 0.5,
                minHandPresenceConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            console.log('✅ MediaPipe Hands model loaded');
            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize MediaPipe Hands:', error);
            throw error;
        }
    }

    /**
     * Setup video and canvas elements
     */
    async setupVideo(videoElement, canvasElement) {
        this.video = videoElement;
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext('2d');

        try {
            console.log('📹 Requesting camera access...');

            // Request webcam access
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                }
            });

            this.video.srcObject = stream;

            // Wait for video to be ready
            await new Promise((resolve) => {
                this.video.onloadedmetadata = () => {
                    resolve();
                };
            });

            await this.video.play();

            // Set canvas size to match video
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;

            console.log(`✅ Camera active: ${this.video.videoWidth}x${this.video.videoHeight}`);
            return true;
        } catch (error) {
            console.error('❌ Camera access failed:', error);
            throw error;
        }
    }

    /**
     * Start hand tracking
     */
    start() {
        if (!this.isInitialized) {
            console.error('❌ Hand tracking not initialized');
            return;
        }

        if (this.isRunning) {
            console.warn('⚠️ Hand tracking already running');
            return;
        }

        this.isRunning = true;
        console.log('▶️ Hand tracking started');

        // Update overlay display to show current scale/key
        setTimeout(() => {
            this.updateActivePresetDisplay();
        }, 100); // Small delay to ensure chord engine is ready

        this.detectHands();
    }

    /**
     * Stop hand tracking
     */
    stop() {
        this.isRunning = false;
        console.log('⏸️ Hand tracking stopped');

        // Stop video stream
        if (this.video && this.video.srcObject) {
            const tracks = this.video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
        }
    }

    /**
     * Main detection loop
     */
    async detectHands() {
        if (!this.isRunning) return;

        const now = performance.now();

        // Only process if video has new frame
        if (this.video.currentTime !== this.lastVideoTime) {
            this.lastVideoTime = this.video.currentTime;

            // Detect hands in video frame
            this.results = this.handLandmarker.detectForVideo(this.video, now);

            // Process results
            this.processResults(this.results);

            // Update FPS
            this.updateFPS();
        }

        // Draw visualization
        this.draw();

        // Continue loop
        requestAnimationFrame(() => this.detectHands());
    }

    /**
     * Process hand detection results
     */
    processResults(results) {
        if (!results || !results.landmarks || results.landmarks.length === 0) {
            // No hands detected - release all notes
            this.musicMapper.processGestures(null, null, null);
            return;
        }

        let leftGesture = null;
        let rightGesture = null;
        let leftPosition = null;
        let rightPosition = null;
        let leftDrumstickPosition = null;
        let rightDrumstickPosition = null;

        // Process each detected hand
        for (let i = 0; i < results.landmarks.length; i++) {
            const landmarks = results.landmarks[i];
            const handedness = results.handednesses[i][0].categoryName.toLowerCase(); // 'left' or 'right'

            // Recognize gesture
            const gesture = this.gestureRecognizer.recognize(landmarks, handedness);

            // Extract hand position (using palm center - landmark 9 is middle finger base)
            const palmCenter = landmarks[9];
            const position = {
                x: palmCenter.x, // 0.0 to 1.0 (left to right)
                y: palmCenter.y, // 0.0 to 1.0 (top to bottom)
                z: palmCenter.z  // depth (negative is closer to camera)
            };

            // Extract drumstick position (using index fingertip - landmark 8)
            const indexFingertip = landmarks[8];
            const drumstickPosition = {
                x: indexFingertip.x,
                y: indexFingertip.y,
                z: indexFingertip.z
            };

            if (handedness === 'left') {
                leftGesture = gesture;
                leftPosition = position;
                leftDrumstickPosition = drumstickPosition;
                console.log(`👈 LEFT hand detected: X=${position.x.toFixed(2)}, Y=${position.y.toFixed(2)}`);
            } else {
                rightGesture = gesture;
                rightPosition = position;
                rightDrumstickPosition = drumstickPosition;
                console.log(`👉 RIGHT hand detected: X=${position.x.toFixed(2)}, Y=${position.y.toFixed(2)}`);
            }
        }

        // Calculate hand velocities for motion detection (for piano/drum modes)
        this.updateHandVelocities(leftPosition, rightPosition);

        // Calculate drumstick velocities for drum mode
        this.updateDrumstickVelocities(leftDrumstickPosition, rightDrumstickPosition);

        // Get hand velocities
        const velocities = {
            left: this.gestureRecognizer.getVelocity('left'),
            right: this.gestureRecognizer.getVelocity('right')
        };

        // Send to music mapper with volume, preset, playback mode, interaction mode, and theremin settings
        // Debug log to verify thereminOtherHand value before passing
        if (this.thereminMode) {
            console.log(`🚀 PASSING to processGestures: thereminOtherHand="${this.thereminOtherHand}"`);
        }

        // DEBUG: Log settings being passed (only when theremin is active)
        if (this.thereminMode && !this._lastDebugLog || Date.now() - this._lastDebugLog > 2000) {
            console.log(`📤 [HAND-TRACKING] Passing to mapper: engine="${this.thereminEngine}", preset="${this.thereminPreset}", mode="${this.thereminPlaybackMode}"`);
            this._lastDebugLog = Date.now();
        }

        // Detect taps and strikes for piano/drum modes
        const leftTap = this.pianoMode ? this.detectTap('left') : false;
        const rightTap = this.pianoMode ? this.detectTap('right') : false;
        const leftStrike = this.drumMode ? this.detectStrike('left') : null;
        const rightStrike = this.drumMode ? this.detectStrike('right') : null;

        // Detect fingertips in piano zone
        const fingertipTriggers = this.pianoMode ? this.detectFingertipsInPianoZone() : [];

        this.musicMapper.processGestures(leftGesture, rightGesture, velocities, {
            volume: this.handVolume,
            engine: this.currentEngine,
            preset: this.currentPreset,
            mode: this.playbackMode,
            interactionMode: this.handInteractionMode,
            thereminMode: this.thereminMode,
            thereminHand: this.thereminHand,
            thereminSound: this.thereminSound,
            thereminQuantize: this.thereminQuantize,
            thereminOtherHand: this.thereminOtherHand,
            thereminPlaybackMode: this.thereminPlaybackMode,
            thereminEngine: this.thereminEngine,
            thereminPreset: this.thereminPreset,
            pianoMode: this.pianoMode,
            pianoEngine: this.pianoEngine,
            pianoPreset: this.pianoPreset,
            pianoOctaveRange: this.pianoOctaveRange,
            drumMode: this.drumMode,
            drumKit: this.drumKit,
            leftPosition: leftPosition,
            rightPosition: rightPosition,
            leftTap: leftTap,
            rightTap: rightTap,
            leftStrike: leftStrike,
            rightStrike: rightStrike,
            fingertipTriggers: fingertipTriggers
        });
    }

    /**
     * Draw video and hand landmarks
     */
    draw() {
        if (!this.canvas || !this.ctx) return;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw video frame (if enabled)
        if (this.showVideo && this.video) {
            // Draw video naturally without mirror flip
            this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
        }

        // Draw hand landmarks (if enabled)
        if (this.drawLandmarks && this.results && this.results.landmarks) {
            for (let i = 0; i < this.results.landmarks.length; i++) {
                const landmarks = this.results.landmarks[i];
                const handedness = this.results.handednesses[i][0].categoryName;

                // Draw connections
                this.drawConnections(landmarks, handedness);

                // Draw points
                this.drawLandmarkPoints(landmarks, handedness);
            }
        }

        // Draw FPS
        this.drawFPS();

        // Draw gesture labels
        this.drawGestureLabels();

        // Draw theremin visualization if enabled
        if (this.thereminMode) {
            this.drawThereminOverlay();
        }

        // Draw piano roll if enabled
        if (this.pianoMode) {
            this.drawPianoRollOverlay();
        }

        // Draw drum grid if enabled
        if (this.drumMode) {
            this.drawDrumGridOverlay();
        }
    }

    /**
     * Draw hand skeleton connections
     */
    drawConnections(landmarks, handedness) {
        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4],           // Thumb
            [0, 5], [5, 6], [6, 7], [7, 8],           // Index
            [0, 9], [9, 10], [10, 11], [11, 12],      // Middle
            [0, 13], [13, 14], [14, 15], [15, 16],    // Ring
            [0, 17], [17, 18], [18, 19], [19, 20],    // Pinky
            [5, 9], [9, 13], [13, 17]                 // Palm
        ];

        this.ctx.strokeStyle = handedness === 'Left' ? '#00ff00' : '#ff00ff';
        this.ctx.lineWidth = 2;

        connections.forEach(([start, end]) => {
            const startPoint = this.landmarkToCanvas(landmarks[start]);
            const endPoint = this.landmarkToCanvas(landmarks[end]);

            this.ctx.beginPath();
            this.ctx.moveTo(startPoint.x, startPoint.y);
            this.ctx.lineTo(endPoint.x, endPoint.y);
            this.ctx.stroke();
        });
    }

    /**
     * Draw landmark points
     */
    drawLandmarkPoints(landmarks, handedness) {
        this.ctx.fillStyle = handedness === 'Left' ? '#00ff00' : '#ff00ff';

        landmarks.forEach(landmark => {
            const point = this.landmarkToCanvas(landmark);
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
            this.ctx.fill();
        });
    }

    /**
     * Convert normalized landmark to canvas coordinates
     */
    landmarkToCanvas(landmark) {
        return {
            x: landmark.x * this.canvas.width, // Natural coordinates (no flip)
            y: landmark.y * this.canvas.height
        };
    }

    /**
     * Draw FPS counter
     */
    drawFPS() {
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = 'bold 16px monospace';
        this.ctx.fillText(`FPS: ${this.fps}`, 10, 30);
    }

    /**
     * Draw gesture labels
     */
    drawGestureLabels() {
        const state = this.musicMapper.getState();

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 18px monospace';
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 3;

        // Left hand gesture
        const leftText = `👈 ${state.leftGesture.toUpperCase()}`;
        this.ctx.strokeText(leftText, 10, this.canvas.height - 80);
        this.ctx.fillStyle = '#00ff00';
        this.ctx.fillText(leftText, 10, this.canvas.height - 80);

        // Right hand gesture
        const rightText = `👉 ${state.rightGesture.toUpperCase()}`;
        this.ctx.strokeText(rightText, 10, this.canvas.height - 50);
        this.ctx.fillStyle = '#ff00ff';
        this.ctx.fillText(rightText, 10, this.canvas.height - 50);

        // Music state
        this.ctx.fillStyle = '#ffff00';
        const stateText = `${state.scale.toUpperCase()} | ${state.playbackMode.toUpperCase()}`;
        this.ctx.strokeText(stateText, 10, this.canvas.height - 20);
        this.ctx.fillText(stateText, 10, this.canvas.height - 20);

        // Octave display (large, prominent)
        this.ctx.fillStyle = '#00ffff';
        this.ctx.font = 'bold 32px monospace';
        // Format octave with + sign for positive values
        const octaveValue = state.octave > 0 ? `+${state.octave}` : state.octave;
        const octaveText = `OCT ${octaveValue}`;
        const octaveWidth = this.ctx.measureText(octaveText).width;
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 4;
        this.ctx.strokeText(octaveText, this.canvas.width - octaveWidth - 15, this.canvas.height - 15);
        this.ctx.fillText(octaveText, this.canvas.width - octaveWidth - 15, this.canvas.height - 15);

        // Hand interaction mode (top right)
        const modeIcon = this.handInteractionMode === 'layer' ? '🎵' : '🎛️';
        const modeText = this.handInteractionMode === 'layer' ? 'LAYER' : 'CONTROL';
        const modeColor = this.handInteractionMode === 'layer' ? '#00ff00' : '#ff8800';

        this.ctx.fillStyle = modeColor;
        this.ctx.font = 'bold 14px monospace';
        const modeString = `${modeIcon} ${modeText}`;
        const modeWidth = this.ctx.measureText(modeString).width;
        this.ctx.strokeText(modeString, this.canvas.width - modeWidth - 10, 30);
        this.ctx.fillText(modeString, this.canvas.width - modeWidth - 10, 30);
    }

    /**
     * Draw theremin overlay visualization
     */
    drawThereminOverlay() {
        if (!this.results || !this.results.landmarks || this.results.landmarks.length === 0) {
            // No hand detected - just show the grid
            this.drawThereminGrid();
            return;
        }

        // Find the theremin hand
        let thereminHandIndex = -1;
        for (let i = 0; i < this.results.landmarks.length; i++) {
            const handedness = this.results.handednesses[i][0].categoryName.toLowerCase();
            if (handedness === this.thereminHand) {
                thereminHandIndex = i;
                break;
            }
        }

        // Draw the grid first (underneath)
        this.drawThereminGrid();

        // If hand is found, draw the interactive elements
        if (thereminHandIndex !== -1) {
            const landmarks = this.results.landmarks[thereminHandIndex];
            const palmCenter = landmarks[9];
            const canvasPos = this.landmarkToCanvas(palmCenter);

            // Draw crosshairs at hand position (brighter when hand detected)
            this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([10, 5]); // Dashed line

            // Horizontal line
            this.ctx.beginPath();
            this.ctx.moveTo(0, canvasPos.y);
            this.ctx.lineTo(this.canvas.width, canvasPos.y);
            this.ctx.stroke();

            // Vertical line
            this.ctx.strokeStyle = 'rgba(255, 0, 255, 0.8)';
            this.ctx.beginPath();
            this.ctx.moveTo(canvasPos.x, 0);
            this.ctx.lineTo(canvasPos.x, this.canvas.height);
            this.ctx.stroke();

            this.ctx.setLineDash([]); // Reset to solid line

            // Draw hand position indicator (glowing circle)
            const gradient = this.ctx.createRadialGradient(canvasPos.x, canvasPos.y, 0, canvasPos.x, canvasPos.y, 30);
            gradient.addColorStop(0, 'rgba(255, 255, 0, 0.8)');
            gradient.addColorStop(0.5, 'rgba(255, 255, 0, 0.4)');
            gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(canvasPos.x, canvasPos.y, 30, 0, 2 * Math.PI);
            this.ctx.fill();

            // Inner bright dot
            this.ctx.fillStyle = 'rgba(255, 255, 255, 1)';
            this.ctx.beginPath();
            this.ctx.arc(canvasPos.x, canvasPos.y, 5, 0, 2 * Math.PI);
            this.ctx.fill();

            // Calculate frequency from Y position
            const normalizedY = 1 - palmCenter.y;
            const minFreq = 100;
            const maxFreq = 2000;
            let frequency = minFreq + (normalizedY * (maxFreq - minFreq));

            // Get quantized frequency and note name if quantize is enabled
            let displayFreq = frequency;
            let noteName = '';
            if (this.thereminQuantize && this.musicMapper && this.musicMapper.chordEngine) {
                displayFreq = this.frequencyToQuantized(frequency);
                noteName = this.frequencyToNoteName(displayFreq);
            }

            const volPercent = Math.round(palmCenter.x * 100);

            this.ctx.font = 'bold 20px monospace';

            // Frequency display (top-left)
            let freqText = '';
            if (this.thereminQuantize && noteName) {
                // Show note name in quantized mode
                freqText = `♪ ${noteName} (${Math.round(displayFreq)}Hz)`;
            } else {
                // Show frequency in continuous mode
                freqText = `FREQ: ${Math.round(displayFreq)}Hz`;
            }

            const freqWidth = this.ctx.measureText(freqText).width;
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            this.ctx.fillRect(5, 65, freqWidth + 10, 30);
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 3;
            this.ctx.strokeText(freqText, 10, 85);
            // Use yellow color for quantized mode
            this.ctx.fillStyle = this.thereminQuantize ? '#ffff00' : '#00ffff';
            this.ctx.fillText(freqText, 10, 85);

            // Volume display (top-left, below freq)
            const volText = `VOL: ${volPercent}%`;
            const volWidth = this.ctx.measureText(volText).width;
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            this.ctx.fillRect(5, 100, volWidth + 10, 30);
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 3;
            this.ctx.strokeText(volText, 10, 120);
            this.ctx.fillStyle = '#ff00ff';
            this.ctx.fillText(volText, 10, 120);
        }

        // Draw "THEREMIN MODE" label at top
        let label = '🎵 THEREMIN MODE';
        let labelColor = '#00ffff';

        // Add quantized indicator if enabled
        if (this.thereminQuantize) {
            label = '🎹 THEREMIN - QUANTIZED';
            labelColor = '#ffff00'; // Yellow for quantized

            // Also show scale name if available
            if (this.musicMapper && this.musicMapper.chordEngine) {
                const scaleName = this.musicMapper.chordEngine.currentScale;
                const scaleDisplayName = scaleName.charAt(0).toUpperCase() + scaleName.slice(1);
                label = `🎹 THEREMIN - ${scaleDisplayName} Scale`;
            }
        }

        this.ctx.font = 'bold 20px monospace';
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 4;
        const labelWidth = this.ctx.measureText(label).width;
        const labelX = (this.canvas.width - labelWidth) / 2;

        // Semi-transparent background for label
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.ctx.fillRect(labelX - 10, 25, labelWidth + 20, 35);

        this.ctx.fillStyle = labelColor;
        this.ctx.strokeText(label, labelX, 50);
        this.ctx.fillText(label, labelX, 50);
    }

    /**
     * Convert frequency to quantized frequency using current scale
     * (Duplicates logic from gesture-music-mapper for visualization)
     */
    frequencyToQuantized(frequency) {
        if (!this.musicMapper || !this.musicMapper.chordEngine) {
            return frequency;
        }

        try {
            const chordEngine = this.musicMapper.chordEngine;
            const scaleName = chordEngine.currentScale;
            const scaleIntervals = chordEngine.scales[scaleName];

            if (!scaleIntervals) {
                return frequency;
            }

            // Convert frequency to MIDI note number
            const midiNote = 69 + 12 * Math.log2(frequency / 440);

            // Get octave and note within octave (0-11)
            const octave = Math.floor(midiNote / 12) - 1;
            const noteInOctave = Math.round(midiNote) % 12;

            // Find nearest scale degree
            let closestInterval = scaleIntervals[0];
            let minDistance = Math.abs(noteInOctave - closestInterval);

            for (let interval of scaleIntervals) {
                const distance = Math.abs(noteInOctave - interval);
                const wrappedDistance = Math.abs(noteInOctave - (interval + 12));
                const wrappedDistanceDown = Math.abs(noteInOctave - (interval - 12));

                const actualDistance = Math.min(distance, wrappedDistance, wrappedDistanceDown);

                if (actualDistance < minDistance) {
                    minDistance = actualDistance;
                    closestInterval = interval;
                }
            }

            // Adjust for wrapping
            let adjustedInterval = closestInterval;
            if (noteInOctave - closestInterval > 6) {
                adjustedInterval = closestInterval + 12;
            } else if (noteInOctave - closestInterval < -6) {
                adjustedInterval = closestInterval - 12;
            }

            // Convert back to MIDI
            const quantizedMidi = (octave + 1) * 12 + adjustedInterval;

            // Convert MIDI back to frequency
            const quantizedFreq = 440 * Math.pow(2, (quantizedMidi - 69) / 12);

            return quantizedFreq;
        } catch (error) {
            return frequency;
        }
    }

    /**
     * Convert frequency to note name (e.g., "A4", "C#3")
     */
    frequencyToNoteName(frequency) {
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

        // Convert frequency to MIDI note number
        const midiNote = 69 + 12 * Math.log2(frequency / 440);
        const roundedMidi = Math.round(midiNote);

        // Get octave and note name
        const octave = Math.floor(roundedMidi / 12) - 1;
        const noteIndex = roundedMidi % 12;

        return `${noteNames[noteIndex]}${octave}`;
    }

    /**
     * Draw theremin grid (frequency and volume zones)
     */
    drawThereminGrid() {
        // Draw frequency grid (horizontal lines) - very subtle
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.15)';
        this.ctx.lineWidth = 1;
        for (let i = 1; i < 10; i++) { // Skip edges for cleaner look
            const y = (this.canvas.height / 10) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }

        // Draw volume grid (vertical lines) - very subtle
        this.ctx.strokeStyle = 'rgba(255, 0, 255, 0.15)';
        for (let i = 1; i < 10; i++) { // Skip edges for cleaner look
            const x = (this.canvas.width / 10) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        // Draw zone labels in corners (very subtle)
        this.ctx.font = 'bold 10px monospace';
        this.ctx.fillStyle = 'rgba(0, 255, 255, 0.4)';
        this.ctx.fillText('HIGH ↑', 10, 20);
        this.ctx.fillText('LOW ↓', 10, this.canvas.height - 10);

        this.ctx.fillStyle = 'rgba(255, 0, 255, 0.4)';
        const quietText = 'QUIET ←';
        const loudText = 'LOUD →';
        this.ctx.fillText(quietText, 10, this.canvas.height / 2);
        this.ctx.fillText(loudText, this.canvas.width - this.ctx.measureText(loudText).width - 10, this.canvas.height / 2);
    }

    /**
     * Update FPS counter
     */
    updateFPS() {
        this.frameCount++;
        const now = Date.now();
        const elapsed = now - this.lastFpsUpdate;

        if (elapsed >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / elapsed);
            this.frameCount = 0;
            this.lastFpsUpdate = now;
        }
    }

    /**
     * Toggle video visibility
     */
    toggleVideo() {
        this.showVideo = !this.showVideo;
        console.log(`📹 Video ${this.showVideo ? 'visible' : 'hidden'}`);
    }

    /**
     * Toggle landmark drawing
     */
    toggleLandmarks() {
        this.drawLandmarks = !this.drawLandmarks;
        console.log(`✋ Landmarks ${this.drawLandmarks ? 'visible' : 'hidden'}`);
    }

    /**
     * Get tracking status
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            running: this.isRunning,
            fps: this.fps,
            showVideo: this.showVideo,
            drawLandmarks: this.drawLandmarks
        };
    }

    /**
     * Update hand velocities for motion detection
     */
    updateHandVelocities(leftPosition, rightPosition) {
        const now = performance.now();

        // Update left hand velocity
        if (leftPosition && this.previousHandPositions.left) {
            this.handVelocities.left = {
                x: leftPosition.x - this.previousHandPositions.left.x,
                y: leftPosition.y - this.previousHandPositions.left.y,
                z: leftPosition.z - this.previousHandPositions.left.z
            };
        } else if (!leftPosition) {
            // Reset velocity when hand not detected
            this.handVelocities.left = { x: 0, y: 0, z: 0 };
        }

        // Update right hand velocity
        if (rightPosition && this.previousHandPositions.right) {
            this.handVelocities.right = {
                x: rightPosition.x - this.previousHandPositions.right.x,
                y: rightPosition.y - this.previousHandPositions.right.y,
                z: rightPosition.z - this.previousHandPositions.right.z
            };
        } else if (!rightPosition) {
            // Reset velocity when hand not detected
            this.handVelocities.right = { x: 0, y: 0, z: 0 };
        }

        // Store current positions for next frame
        this.previousHandPositions.left = leftPosition ? { ...leftPosition } : null;
        this.previousHandPositions.right = rightPosition ? { ...rightPosition } : null;
    }

    /**
     * Update drumstick (index fingertip) velocities for drum strike detection
     */
    updateDrumstickVelocities(leftDrumstickPosition, rightDrumstickPosition) {
        const now = performance.now();

        // Update left drumstick velocity
        if (leftDrumstickPosition && this.previousDrumstickPositions.left) {
            this.drumstickVelocities.left = {
                x: leftDrumstickPosition.x - this.previousDrumstickPositions.left.x,
                y: leftDrumstickPosition.y - this.previousDrumstickPositions.left.y,
                z: leftDrumstickPosition.z - this.previousDrumstickPositions.left.z
            };
        } else if (!leftDrumstickPosition) {
            this.drumstickVelocities.left = { x: 0, y: 0, z: 0 };
        }

        // Update right drumstick velocity
        if (rightDrumstickPosition && this.previousDrumstickPositions.right) {
            this.drumstickVelocities.right = {
                x: rightDrumstickPosition.x - this.previousDrumstickPositions.right.x,
                y: rightDrumstickPosition.y - this.previousDrumstickPositions.right.y,
                z: rightDrumstickPosition.z - this.previousDrumstickPositions.right.z
            };
        } else if (!rightDrumstickPosition) {
            this.drumstickVelocities.right = { x: 0, y: 0, z: 0 };
        }

        // Store current drumstick positions for next frame
        this.previousDrumstickPositions.left = leftDrumstickPosition ? { ...leftDrumstickPosition } : null;
        this.previousDrumstickPositions.right = rightDrumstickPosition ? { ...rightDrumstickPosition } : null;
    }

    /**
     * Detect tap motion (for piano mode)
     * Returns true if a downward tap is detected
     */
    detectTap(handedness) {
        const velocity = this.handVelocities[handedness];
        if (!velocity) return false;

        const now = performance.now();
        const timeSinceLastTap = now - this.lastTapTime[handedness];

        // Check if enough time has passed (debounce)
        if (timeSinceLastTap < this.tapDebounceMs) {
            return false;
        }

        // Detect downward motion (Y velocity positive, since Y increases downward)
        const isDownwardMotion = velocity.y > this.pianoTapSensitivity;

        if (isDownwardMotion) {
            this.lastTapTime[handedness] = now;
            // Store which note was played for visual feedback
            const position = this.previousHandPositions[handedness];
            if (position) {
                const note = this.getPianoNote(position);
                this.lastPlayedNotes[handedness] = note;
                this.lastPlayedNotesTime[handedness] = now;
            }
            console.log(`[TAP DETECTED] ${handedness} hand: Y-velocity = ${velocity.y.toFixed(4)}`);
            return true;
        }

        return false;
    }

    /**
     * Detect strike motion (for drum mode) - DRUMSTICK MODE
     * Uses index fingertip position/velocity instead of palm center
     * Returns true if a strong downward strike is detected
     */
    detectStrike(handedness) {
        // USE DRUMSTICK VELOCITY (index fingertip) instead of palm
        const velocity = this.drumstickVelocities[handedness];
        if (!velocity) return { detected: false, velocity: 0 };

        const now = performance.now();
        const timeSinceLastTap = now - this.lastTapTime[handedness];

        // Check if enough time has passed (debounce)
        if (timeSinceLastTap < this.tapDebounceMs) {
            return { detected: false, velocity: 0 };
        }

        // Detect strong downward motion (higher threshold than tap)
        const isStrikeMotion = velocity.y > this.drumStrikeSensitivity;

        if (isStrikeMotion) {
            this.lastTapTime[handedness] = now;
            // Calculate velocity magnitude for velocity-sensitive playback
            const velocityMagnitude = Math.abs(velocity.y);

            // USE DRUMSTICK POSITION (index fingertip) for zone detection
            const drumstickPosition = this.previousDrumstickPositions[handedness];
            if (drumstickPosition) {
                const zone = this.getDrumZone(drumstickPosition);
                this.lastDrumHits[handedness] = zone;
                this.lastDrumHitsTime[handedness] = now;
                console.log(`[DRUMSTICK STRIKE] ${handedness} fingertip: zone=${zone}, Y-vel=${velocity.y.toFixed(4)}, pos=(${drumstickPosition.x.toFixed(2)}, ${drumstickPosition.y.toFixed(2)})`);
            }
            return { detected: true, velocity: velocityMagnitude };
        }

        return { detected: false, velocity: 0 };
    }

    /**
     * Detect fingertips in piano zone and trigger notes
     * Returns array of triggered notes
     */
    detectFingertipsInPianoZone() {
        if (!this.latestHands || !this.pianoMode) {
            return [];
        }

        const triggeredNotes = [];
        const now = performance.now();

        // Calculate piano zone boundaries (same as drawPianoRollOverlay)
        const keyHeight = 120;
        const pianoZoneTop = (this.canvas.height - keyHeight) / 2;
        const pianoZoneBottom = pianoZoneTop + keyHeight;

        const fingerTips = [
            { name: 'thumb', index: 4 },
            { name: 'index', index: 8 },
            { name: 'middle', index: 12 },
            { name: 'ring', index: 16 },
            { name: 'pinky', index: 20 }
        ];

        this.latestHands.forEach((hand) => {
            const handedness = hand.handedness.toLowerCase();

            // Initialize finger states for this hand if needed
            if (!this.fingertipStates[handedness]) {
                this.fingertipStates[handedness] = {};
            }

            fingerTips.forEach(finger => {
                const landmark = hand.landmarks[finger.index];
                if (!landmark) return;

                // Initialize finger state if needed
                if (!this.fingertipStates[handedness][finger.name]) {
                    this.fingertipStates[handedness][finger.name] = {
                        inZone: false,
                        lastNote: null,
                        lastTriggerTime: 0
                    };
                }

                const state = this.fingertipStates[handedness][finger.name];
                const y_canvas = landmark.y * this.canvas.height;
                const x_canvas = landmark.x * this.canvas.width;

                // Check if fingertip is in piano zone
                const inZone = y_canvas >= pianoZoneTop && y_canvas <= pianoZoneBottom;

                // Detect zone entry (trigger on entering the zone)
                if (inZone && !state.inZone) {
                    // Check debounce
                    if (now - state.lastTriggerTime >= this.fingerDebounceMs) {
                        // Get note at this X position
                        const note = this.getPianoNote({ x: landmark.x, y: landmark.y });

                        // Trigger the note
                        triggeredNotes.push({
                            handedness,
                            finger: finger.name,
                            note,
                            position: { x: landmark.x, y: landmark.y }
                        });

                        // Update state
                        state.lastNote = note;
                        state.lastTriggerTime = now;

                        // Update visual tracking
                        this.lastPlayedNotes[handedness] = note;
                        this.lastPlayedNotesTime[handedness] = now;

                        console.log(`[FINGERTIP ZONE] ${handedness} ${finger.name} entered zone - note: ${note}`);
                    }
                }

                // Update zone state
                state.inZone = inZone;
            });
        });

        return triggeredNotes;
    }

    /**
     * Get drum zone based on hand position
     * Returns the drum zone name based on 3x3 grid
     */
    getDrumZone(position) {
        if (!position) return null;

        const x = position.x;
        const y = position.y;

        // 3x3 grid layout
        let zone = '';

        // Determine row (Y-axis)
        if (y < 0.33) {
            // Top row
            if (x < 0.33) zone = 'hihat';
            else if (x < 0.66) zone = 'crash';
            else zone = 'ride';
        } else if (y < 0.66) {
            // Middle row
            if (x < 0.33) zone = 'tom1';
            else if (x < 0.66) zone = 'snare';
            else zone = 'tom2';
        } else {
            // Bottom row
            if (x < 0.33) zone = 'kick';
            else if (x < 0.66) zone = 'floortom';
            else zone = 'kick'; // Right kick for double bass
        }

        return zone;
    }

    /**
     * Map X position to piano note
     * Returns note name based on current scale and octave range
     */
    getPianoNote(position) {
        if (!position) return null;

        const x = position.x;

        // Get current scale from music engine
        const scale = this.musicMapper?.chordEngine?.getCurrentScale() || 'major';
        const rootNote = this.musicMapper?.chordEngine?.getCurrentRoot() || 'C';

        // Define scale intervals (semitones from root)
        const scaleIntervals = {
            'major': [0, 2, 4, 5, 7, 9, 11],
            'minor': [0, 2, 3, 5, 7, 8, 10],
            'dorian': [0, 2, 3, 5, 7, 9, 10],
            'phrygian': [0, 1, 3, 5, 7, 8, 10],
            'lydian': [0, 2, 4, 6, 7, 9, 11],
            'mixolydian': [0, 2, 4, 5, 7, 9, 10],
            'chromatic': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
        };

        const intervals = scaleIntervals[scale] || scaleIntervals['major'];
        const notesPerOctave = intervals.length;
        const totalNotes = notesPerOctave * this.pianoOctaveRange;

        // Map X position to note index
        const noteIndex = Math.floor(x * totalNotes);
        const octave = Math.floor(noteIndex / notesPerOctave) + 3; // Start from octave 3
        const scaleStep = noteIndex % notesPerOctave;
        const semitone = intervals[scaleStep];

        // Calculate MIDI note number
        const rootMidi = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].indexOf(rootNote);
        const midiNote = 12 + rootMidi + (octave * 12) + semitone;

        // Convert back to note name
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const noteName = noteNames[midiNote % 12];
        const finalOctave = Math.floor(midiNote / 12) - 1;

        return `${noteName}${finalOctave}`;
    }

    /**
     * Draw piano roll overlay with note indicators (CENTERED)
     */
    drawPianoRollOverlay() {
        const noteCount = 7 * this.pianoOctaveRange; // 7 notes per octave in scale
        const keyWidth = this.canvas.width / noteCount;
        const keyHeight = 120; // Increased height for better visibility

        // CENTER the piano on the canvas
        const y = (this.canvas.height - keyHeight) / 2;

        // Draw semi-transparent background for piano zone
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(0, y, this.canvas.width, keyHeight);

        // Draw piano keys with grid
        this.ctx.strokeStyle = 'rgba(0, 255, 100, 0.7)';
        this.ctx.lineWidth = 2;

        for (let i = 0; i < noteCount; i++) {
            const x = i * keyWidth;
            // Draw key outline
            this.ctx.strokeRect(x, y, keyWidth, keyHeight);

            // Draw note number/position indicator
            this.ctx.font = 'bold 10px monospace';
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(i + 1, x + keyWidth / 2, y + keyHeight - 10);
        }

        // Draw fingertip indicators for current hand positions
        if (this.latestHands) {
            this.latestHands.forEach((hand) => {
                const handedness = hand.handedness.toLowerCase();

                // Draw indicators for each fingertip
                const fingerTips = [
                    { name: 'thumb', index: 4 },
                    { name: 'index', index: 8 },
                    { name: 'middle', index: 12 },
                    { name: 'ring', index: 16 },
                    { name: 'pinky', index: 20 }
                ];

                fingerTips.forEach(finger => {
                    const landmark = hand.landmarks[finger.index];
                    if (landmark) {
                        const x = landmark.x * this.canvas.width;
                        const y_pos = landmark.y * this.canvas.height;

                        // Check if fingertip is in piano zone
                        const inPianoZone = y_pos >= y && y_pos <= (y + keyHeight);

                        if (inPianoZone) {
                            // Draw larger indicator when in zone
                            this.ctx.fillStyle = handedness === 'left' ? 'rgba(0, 255, 100, 0.8)' : 'rgba(100, 255, 255, 0.8)';
                            this.ctx.beginPath();
                            this.ctx.arc(x, y_pos, 15, 0, Math.PI * 2);
                            this.ctx.fill();

                            // Draw fingertip label
                            this.ctx.font = 'bold 10px monospace';
                            this.ctx.fillStyle = 'rgba(255, 255, 255, 1)';
                            this.ctx.textAlign = 'center';
                            this.ctx.fillText(finger.name[0].toUpperCase(), x, y_pos + 4);
                        } else {
                            // Draw smaller indicator when not in zone
                            this.ctx.strokeStyle = handedness === 'left' ? 'rgba(0, 255, 100, 0.4)' : 'rgba(100, 255, 255, 0.4)';
                            this.ctx.lineWidth = 2;
                            this.ctx.beginPath();
                            this.ctx.arc(x, y_pos, 8, 0, Math.PI * 2);
                            this.ctx.stroke();
                        }
                    }
                });
            });
        }

        // Draw played notes indicators
        const now = performance.now();

        ['left', 'right'].forEach((hand, handIndex) => {
            const note = this.lastPlayedNotes[hand];
            const noteTime = this.lastPlayedNotesTime[hand];

            if (note && (now - noteTime < this.noteDisplayDuration)) {
                // Calculate opacity based on time elapsed
                const elapsed = now - noteTime;
                const opacity = 1 - (elapsed / this.noteDisplayDuration);

                // Get position where note was played
                const position = this.previousHandPositions[hand];
                if (position) {
                    const x = position.x * this.canvas.width;
                    const noteY = y + keyHeight / 2;

                    // Draw note indicator on piano roll
                    this.ctx.fillStyle = hand === 'left' ? `rgba(0, 255, 100, ${opacity})` : `rgba(100, 255, 255, ${opacity})`;
                    this.ctx.beginPath();
                    this.ctx.arc(x, noteY, 25, 0, Math.PI * 2);
                    this.ctx.fill();

                    // Draw note name on piano roll
                    this.ctx.font = 'bold 18px monospace';
                    this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText(note, x, noteY + 6);
                }
            }
        });

        // Draw scale/key info at top of piano zone
        const scale = this.musicMapper?.chordEngine?.getCurrentScale() || 'major';
        const root = this.musicMapper?.chordEngine?.getCurrentRoot() || 'C';
        this.ctx.font = 'bold 16px monospace';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${root} ${scale}`, this.canvas.width / 2, y - 15);
    }

    /**
     * Draw drum grid overlay with zone indicators
     */
    drawDrumGridOverlay() {
        const gridSize = 3;
        const cellWidth = this.canvas.width / gridSize;
        const cellHeight = this.canvas.height / gridSize;

        // Drum zone labels
        const zoneLabels = [
            ['HI-HAT', 'CRASH', 'RIDE'],
            ['TOM 1', 'SNARE', 'TOM 2'],
            ['KICK', 'FLOOR', 'KICK']
        ];

        // Draw grid and labels
        this.ctx.strokeStyle = 'rgba(255, 100, 0, 0.6)';
        this.ctx.lineWidth = 2;
        this.ctx.font = 'bold 16px monospace';
        this.ctx.textAlign = 'center';

        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const x = col * cellWidth;
                const y = row * cellHeight;

                // Draw cell outline
                this.ctx.strokeRect(x, y, cellWidth, cellHeight);

                // Draw label
                this.ctx.fillStyle = 'rgba(255, 100, 0, 0.7)';
                this.ctx.fillText(zoneLabels[row][col], x + cellWidth / 2, y + cellHeight / 2);
            }
        }

        // Draw DRUMSTICK indicators (index fingertips)
        if (this.latestHands) {
            this.latestHands.forEach((hand) => {
                const handedness = hand.handedness.toLowerCase();

                // Get index fingertip (landmark 8)
                const indexFingertip = hand.landmarks[8];
                if (indexFingertip) {
                    const x = indexFingertip.x * this.canvas.width;
                    const y = indexFingertip.y * this.canvas.height;

                    // Draw drumstick crosshair
                    this.ctx.strokeStyle = handedness === 'left' ? 'rgba(255, 100, 0, 0.8)' : 'rgba(255, 200, 0, 0.8)';
                    this.ctx.lineWidth = 3;

                    // Vertical line
                    this.ctx.beginPath();
                    this.ctx.moveTo(x, y - 15);
                    this.ctx.lineTo(x, y + 15);
                    this.ctx.stroke();

                    // Horizontal line
                    this.ctx.beginPath();
                    this.ctx.moveTo(x - 15, y);
                    this.ctx.lineTo(x + 15, y);
                    this.ctx.stroke();

                    // Circle around crosshair
                    this.ctx.beginPath();
                    this.ctx.arc(x, y, 10, 0, Math.PI * 2);
                    this.ctx.stroke();

                    // Label "STICK"
                    this.ctx.font = 'bold 10px monospace';
                    this.ctx.fillStyle = handedness === 'left' ? 'rgba(255, 100, 0, 1)' : 'rgba(255, 200, 0, 1)';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText(handedness === 'left' ? 'L-STICK' : 'R-STICK', x, y - 25);
                }
            });
        }

        // Draw hit indicators
        const now = performance.now();

        ['left', 'right'].forEach((hand) => {
            const zone = this.lastDrumHits[hand];
            const hitTime = this.lastDrumHitsTime[hand];

            if (zone && (now - hitTime < this.noteDisplayDuration)) {
                // Calculate opacity based on time elapsed
                const elapsed = now - hitTime;
                const opacity = 1 - (elapsed / this.noteDisplayDuration);

                // USE DRUMSTICK POSITION for hit indicator
                const drumstickPosition = this.previousDrumstickPositions[hand];
                if (drumstickPosition) {
                    const x = drumstickPosition.x * this.canvas.width;
                    const y = drumstickPosition.y * this.canvas.height;

                    // Draw hit indicator
                    this.ctx.fillStyle = hand === 'left' ? `rgba(255, 100, 0, ${opacity * 0.5})` : `rgba(255, 200, 0, ${opacity * 0.5})`;
                    this.ctx.beginPath();
                    this.ctx.arc(x, y, 50, 0, Math.PI * 2);
                    this.ctx.fill();

                    // Draw zone label
                    this.ctx.font = 'bold 24px monospace';
                    this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText(zone.toUpperCase(), x, y + 8);

                    // Draw hand label
                    this.ctx.font = 'bold 16px monospace';
                    this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.8})`;
                    this.ctx.fillText(hand === 'left' ? 'L' : 'R', x, y - 50);
                }
            }
        });

        // Draw drum kit info
        this.ctx.font = 'bold 14px monospace';
        this.ctx.fillStyle = 'rgba(255, 100, 0, 0.8)';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Kit: ${this.drumKit} (Drumstick Mode)`, 10, 30);
    }
}
