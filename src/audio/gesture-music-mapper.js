/**
 * Gesture Music Mapper
 * Maps hand gestures to musical actions
 */

class GestureMusicMapper {
    constructor(musicEngine, chordEngine) {
        this.musicEngine = musicEngine;
        this.chordEngine = chordEngine;

        // Initialize WAD and Dirt engines for hand tracking
        this.wadEngine = null;
        this.dirtEngine = null;
        this.initializeEngines();

        // State tracking
        this.currentGestures = {
            left: null,
            right: null
        };

        this.previousGestures = {
            left: null,
            right: null
        };

        this.previousTwoHandGesture = null; // Track last two-hand gesture combo

        this.activeNotes = [];
        this.currentSynthVoice = 0;
        this.autoFilterEnabled = false;
        this.currentDrumPattern = 0;
        this.generativePaused = false; // Track if generative music is paused by hand control
        this.legatoActive = false; // Track if notes are being held in legato mode
        this.currentLegatoFrequencies = null; // Track current legato chord frequencies
        this.arpeggioLoop = null; // Track active arpeggio loop
        this.noteLoop = null; // Track active note loop (for hold mode)

        // Available scales to cycle through
        this.scales = ['phrygian', 'dorian', 'lydian', 'mixolydian', 'major', 'minor'];
        this.currentScaleIndex = 0;

        // Available synth voices
        this.synthVoices = [
            { name: 'pad', type: 'FMSynth', settings: { harmonicity: 3, modulationIndex: 10 } },
            { name: 'lead', type: 'MonoSynth', settings: { oscillator: { type: 'sawtooth' } } },
            { name: 'pluck', type: 'PluckSynth', settings: { attackNoise: 1, dampening: 4000 } },
            { name: 'texture', type: 'AMSynth', settings: { harmonicity: 2 } }
        ];

        // Drum patterns
        this.drumPatterns = ['basic', 'techno', 'breakbeat', 'hiphop'];

        // Gesture debounce timing
        this.lastGestureChange = {
            left: 0,
            right: 0
        };
        this.gestureDebounceTime = 150; // ms

        console.log('🎮 Gesture Music Mapper initialized');
    }

    /**
     * Initialize WAD and Dirt engines
     */
    initializeEngines() {
        // Initialize WAD Synth Engine
        if (typeof WadSynthEngine !== 'undefined') {
            this.wadEngine = new WadSynthEngine();
            this.wadEngine.init();
            console.log('✅ WAD Synth Engine initialized for hand tracking');
        } else {
            console.warn('⚠️ WadSynthEngine not available');
        }

        // Initialize Dirt Sample Engine
        if (typeof DirtSampleEngine !== 'undefined') {
            this.dirtEngine = new DirtSampleEngine();
            this.dirtEngine.init();
            console.log('✅ Dirt Sample Engine initialized for hand tracking');
        } else {
            console.warn('⚠️ DirtSampleEngine not available');
        }
    }

    /**
     * Process gestures and trigger musical actions
     * @param {Object} leftGesture - Gesture from left hand
     * @param {Object} rightGesture - Gesture from right hand
     * @param {Object} velocities - Hand velocities
     * @param {Object} audioSettings - Audio settings (volume, preset, mode, engine)
     */
    processGestures(leftGesture, rightGesture, velocities, audioSettings = {}) {
        const now = Date.now();

        // Store audio settings
        this.audioSettings = {
            volume: audioSettings.volume || 0.7,
            engine: audioSettings.engine || 'tonejs',
            preset: audioSettings.preset || 'sine',
            mode: audioSettings.mode || 'note',
            interactionMode: audioSettings.interactionMode || 'layer'
        };

        // Handle generative music control based on interaction mode
        if (this.audioSettings.interactionMode === 'control') {
            // Control mode: Sway/modulate generative music with hand gestures
            // Music keeps playing, but hand gestures influence scale/key/style
            // The actual swaying happens in handleLeftHandGesture via setGenerativeParams()
            if (this.generativePaused) {
                this.musicEngine.resume();
                this.generativePaused = false;
                console.log('▶️ Generative music active (control mode - swaying)');
            }
        } else {
            // Layer mode: Always keep generative music playing
            if (this.generativePaused) {
                this.musicEngine.resume();
                this.generativePaused = false;
                console.log('▶️ Generative music active (layer mode)');
            }
        }

        // Update current gestures
        this.currentGestures.left = leftGesture;
        this.currentGestures.right = rightGesture;

        // Process left hand (chord/melody control)
        if (leftGesture && this.hasGestureChanged('left', leftGesture, now)) {
            this.handleLeftHandGesture(leftGesture);
            this.previousGestures.left = leftGesture;
            this.lastGestureChange.left = now;
        }

        // Stop notes if left hand gesture is released
        if (!leftGesture && this.previousGestures.left) {
            this.stopAllNotes();
            this.previousGestures.left = null;
        }

        // Process right hand (rhythm/modifiers)
        if (rightGesture && this.hasGestureChanged('right', rightGesture, now)) {
            this.handleRightHandGesture(rightGesture, velocities?.right || 0);
            this.previousGestures.right = rightGesture;
            this.lastGestureChange.right = now;
        }

        // Check for two-hand gestures (with debouncing)
        if (leftGesture && rightGesture) {
            const currentCombo = `${leftGesture.type}+${rightGesture.type}`;
            if (currentCombo !== this.previousTwoHandGesture) {
                this.handleTwoHandGesture(leftGesture, rightGesture);
                this.previousTwoHandGesture = currentCombo;
            }
        } else {
            // Reset two-hand gesture tracking when hands released
            this.previousTwoHandGesture = null;
        }
    }

    /**
     * Check if gesture has actually changed (debounce)
     */
    hasGestureChanged(hand, newGesture, now) {
        const prevGesture = this.previousGestures[hand];
        const timeSinceLastChange = now - this.lastGestureChange[hand];

        // If enough time has passed and gesture is different
        return timeSinceLastChange > this.gestureDebounceTime &&
               (!prevGesture || prevGesture.type !== newGesture.type);
    }

    /**
     * Handle left hand gestures (chords)
     */
    handleLeftHandGesture(gesture) {
        console.log(`👈 Left hand: ${gesture.name} (${gesture.type})`);

        // In Control mode, sway the generative music instead of just playing hand notes
        if (this.audioSettings.interactionMode === 'control') {
            // Map gestures to scale changes for swaying generative music
            const gestureToScale = {
                'THUMBS_UP': 'major',      // I - bright, happy
                'INDEX': 'dorian',         // II - jazzy, modal
                'PEACE': 'phrygian',       // III - dark, spanish
                'THREE': 'lydian',         // IV - dreamy, ethereal
                'OPEN_PALM': 'mixolydian', // V - dominant, bluesy
                'SHAKA': 'minor',          // VI - sad, melancholic
                'HORN': 'phrygian'         // VII - exotic, middle eastern
            };

            if (gestureToScale[gesture.type] && this.musicEngine && this.musicEngine.setScale) {
                this.musicEngine.setScale(gestureToScale[gesture.type]);
                console.log(`  🎵 Swaying generative music to ${gestureToScale[gesture.type]} scale`);
            }
        }

        // Stop previous notes
        this.stopAllNotes();

        switch(gesture.type) {
            case 'THUMBS_UP':  // I chord
            case 'INDEX':      // II chord
            case 'PEACE':      // III chord
            case 'THREE':      // IV chord
            case 'OPEN_PALM':  // V chord
            case 'SHAKA':      // VI chord
            case 'HORN':       // VII chord
                this.playChord(gesture.chord);
                break;

            case 'PINCH':      // Cycle synth sound
                this.cycleSynthVoice();
                break;

            case 'FIST':       // Cycle scales
                this.cycleScale();
                break;

            case 'OK_SIGN':    // Toggle playback mode
                this.togglePlaybackMode();
                break;

            default:
                console.log('  (No musical action)');
        }
    }

    /**
     * Handle right hand gestures (drums/modifiers)
     */
    handleRightHandGesture(gesture, velocity) {
        console.log(`👉 Right hand: ${gesture.name} (${gesture.type}), velocity: ${velocity.toFixed(3)}`);

        switch(gesture.type) {
            case 'THUMBS_UP':
                this.triggerDrumPattern('basic');
                break;

            case 'PEACE':
                this.triggerDrumPattern('techno');
                break;

            case 'FIST':
                this.triggerDrumPattern('breakbeat');
                break;

            case 'SHAKA':
                this.toggleAutoFilter();
                break;

            case 'PINCH':
                this.triggerHiHat();
                break;

            case 'OPEN_PALM':
                // Movement-based drum trigger
                if (velocity > 0.02) {
                    this.triggerDrumHit(velocity);
                }
                break;

            case 'HORN':
                this.triggerCowbell();
                break;

            default:
                console.log('  (No musical action)');
        }
    }

    /**
     * Handle two-hand combinations
     */
    handleTwoHandGesture(leftGesture, rightGesture) {
        // Octave up: Open Palm (left) + Thumbs Up (right)
        if (leftGesture.type === 'OPEN_PALM' && rightGesture.type === 'THUMBS_UP') {
            this.chordEngine.changeOctave(1);
            const currentOctave = this.chordEngine.getCurrentOctave();
            console.log(`🎵 Octave UP → ${currentOctave}`);
        }

        // Octave down: Open Palm (left) + Peace (right)
        if (leftGesture.type === 'OPEN_PALM' && rightGesture.type === 'PEACE') {
            this.chordEngine.changeOctave(-1);
            const currentOctave = this.chordEngine.getCurrentOctave();
            console.log(`🎵 Octave DOWN → ${currentOctave}`);
        }

        // Reset to middle octave: Open Palm (left) + OK Sign (right)
        if (leftGesture.type === 'OPEN_PALM' && rightGesture.type === 'OK_SIGN') {
            this.chordEngine.setOctave(4); // Middle octave
            console.log('🎵 Octave RESET → 4');
        }

        // Cycle drum patterns: Both hands Shaka
        if (leftGesture.type === 'SHAKA' && rightGesture.type === 'SHAKA') {
            this.cycleDrumPattern();
            console.log('🥁 Drum pattern cycled');
        }
    }

    /**
     * Play a chord based on Roman numeral
     */
    playChord(romanNumeral) {
        if (!romanNumeral || !this.musicEngine) return;

        const chordData = this.chordEngine.getChordForPlayback(romanNumeral);
        const settings = this.audioSettings || { mode: 'chord', engine: 'tonejs' };

        console.log(`  🎹 Playing ${romanNumeral} chord (${chordData.mode}) - Engine: ${settings.engine} - Mode: ${settings.mode}:`,
                    chordData.notes.map(n => n.name).join(', '));

        // Route to appropriate engine
        if (settings.engine === 'wad' && this.wadEngine) {
            this.playChordWAD(chordData, settings);
            return;
        } else if (settings.engine === 'dirt' && this.dirtEngine) {
            this.playChordDirt(chordData, settings);
            return;
        }

        // Default: Use Tone.js to play the notes
        if (window.Tone && this.musicEngine.instruments) {
            let synth = this.getCurrentSynth();
            const frequencies = chordData.notes.map(n => n.frequency);

            switch(settings.mode) {
                case 'note':
                    // Check if hold mode is enabled
                    const holdEnabled = this.chordEngine.getHoldMode();

                    if (holdEnabled) {
                        // HOLD MODE: Loop the note continuously
                        // Stop any existing note loop
                        if (this.noteLoop) {
                            this.noteLoop.stop();
                            this.noteLoop.dispose();
                            this.noteLoop = null;
                        }

                        // Start Transport if not running
                        if (Tone.Transport.state !== 'started') {
                            Tone.Transport.bpm.value = 120;
                            Tone.Transport.start();
                        }

                        // Create continuous note loop
                        this.noteLoop = new Tone.Loop((time) => {
                            synth.triggerAttackRelease(frequencies[0], '8n', time);
                        }, '4n'); // Play every quarter note

                        // Start the loop immediately
                        this.noteLoop.start(0);
                        console.log('  🔄 Note LOOPING continuously (Hold mode ON)');
                    } else {
                        // NORMAL MODE: Play short staccato note (root only, very short)
                        if (synth.triggerAttackRelease) {
                            synth.triggerAttackRelease(frequencies[0], '16n'); // Very short staccato
                        }
                    }
                    break;

                case 'legato':
                    // REBUILT: Simple sustained chord that plays while gesture is held
                    // Stop any currently playing legato notes
                    if (this.legatoActive && this.currentLegatoFrequencies) {
                        synth.triggerRelease(this.currentLegatoFrequencies, Tone.now());
                        console.log('  🔇 Stopped previous legato chord');
                    }

                    // Play new chord with infinite sustain
                    if (synth.triggerAttack) {
                        synth.triggerAttack(frequencies, Tone.now());
                        this.legatoActive = true;
                        this.currentLegatoFrequencies = frequencies;
                        console.log('  🎶 Playing legato chord:', frequencies.map(f => Tone.Frequency(f).toNote()).join(', '));
                    }
                    break;

                case 'arpeggio':
                    // Check if hold mode is enabled
                    const holdEnabledArp = this.chordEngine.getHoldMode();

                    // Stop any existing arpeggio
                    if (this.arpeggioLoop) {
                        this.arpeggioLoop.stop();
                        this.arpeggioLoop.dispose();
                        this.arpeggioLoop = null;
                    }

                    // Start Transport if not running
                    if (Tone.Transport.state !== 'started') {
                        Tone.Transport.bpm.value = 120;
                        Tone.Transport.start();
                    }

                    if (holdEnabledArp) {
                        // HOLD MODE: Loop arpeggio continuously
                        let noteIndex = 0;
                        this.arpeggioLoop = new Tone.Loop((time) => {
                            // Play current note
                            synth.triggerAttackRelease(frequencies[noteIndex], '8n', time);

                            // Move to next note (cycle through)
                            noteIndex = (noteIndex + 1) % frequencies.length;
                        }, '8n'); // Play every 8th note

                        // Start the loop immediately
                        this.arpeggioLoop.start(0);
                        console.log('  🔄 Arpeggio LOOPING continuously (Hold mode ON)', frequencies.length, 'notes');
                    } else {
                        // NORMAL MODE: Play arpeggio once through
                        let noteIndex = 0;
                        const playOnce = () => {
                            if (noteIndex < frequencies.length) {
                                synth.triggerAttackRelease(frequencies[noteIndex], '8n');
                                noteIndex++;
                                setTimeout(playOnce, 125); // 8th note at 120 BPM = 125ms
                            }
                        };
                        playOnce();
                        console.log('  🎹 Arpeggio playing once (Hold mode OFF)', frequencies.length, 'notes');
                    }
                    break;

                case 'chord':
                default:
                    // Play full chord with normal duration
                    if (synth.triggerAttackRelease) {
                        synth.triggerAttackRelease(frequencies, '4n'); // Quarter note duration
                    }
                    break;
            }

            this.activeNotes = chordData.notes;
        }
    }

    /**
     * Stop all currently playing notes
     */
    stopAllNotes() {
        if (this.activeNotes.length > 0 && window.Tone) {
            const synth = this.getCurrentSynth();

            // Stop arpeggio loop if active
            if (this.arpeggioLoop) {
                this.arpeggioLoop.stop();
                this.arpeggioLoop.dispose();
                this.arpeggioLoop = null;
                console.log('  🎹 Arpeggio stopped');
            }

            // For legato mode, we need to manually release the specific notes
            if (this.legatoActive && this.currentLegatoFrequencies && synth.triggerRelease) {
                // Release the specific legato chord that's playing
                synth.triggerRelease(this.currentLegatoFrequencies, Tone.now());
                this.legatoActive = false;
                this.currentLegatoFrequencies = null;
                console.log('  🎵 Legato notes released');
            } else if (synth.releaseAll) {
                synth.releaseAll();
            }

            this.activeNotes = [];
        }
    }

    /**
     * Get current synth instrument
     */
    getCurrentSynth() {
        const settings = this.audioSettings || { preset: 'sine', volume: 0.7, mode: 'note' };

        // Check if we need to recreate the synth due to preset change
        if (!this.handSynth || this.lastPreset !== settings.preset) {
            if (this.handSynth && window.Tone) {
                this.handSynth.dispose();
            }

            // Create synth based on preset
            if (window.Tone) {
                const oscillatorType = this.getOscillatorType(settings.preset);

                // AGGRESSIVE envelope for ZERO decay, pure sustain, instant release
                const envelope = {
                    attack: 0.001,    // Instant attack
                    decay: 0.001,     // Minimal decay
                    sustain: 1.0,     // FULL sustain
                    release: 0.01     // INSTANT release (10ms) for legato mode
                };

                this.handSynth = new Tone.PolySynth(Tone.Synth, {
                    oscillator: {
                        type: oscillatorType
                    },
                    envelope: envelope
                }).toDestination();

                this.lastPreset = settings.preset;
                console.log(`🎹 Created hand synth with preset: ${settings.preset} (${oscillatorType}) - PURE SUSTAIN`);
            }
        }

        // Update volume
        if (this.handSynth && window.Tone) {
            const volumeDb = Tone.gainToDb(settings.volume);
            this.handSynth.volume.value = volumeDb;
        }

        return this.handSynth;
    }

    /**
     * Map preset name to Tone.js oscillator type
     */
    getOscillatorType(preset) {
        const presetMap = {
            // Pad sounds
            'sine': 'sine',
            'triangle': 'triangle',
            'fatsine': 'fatsine',
            'fattriangle': 'fattriangle',
            // Lead sounds
            'sawtooth': 'sawtooth',
            'square': 'square',
            'fatsawtooth': 'fatsawtooth',
            'fatsquare': 'fatsquare',
            // Bass sounds
            'deepsine': 'sine',
            'subsine': 'sine',
            'fatbass': 'fatsawtooth',
            'pulse': 'pulse',
            // Pluck/Arp sounds
            'pluck': 'sawtooth',
            'bell': 'triangle',
            'marimba': 'square',
            'metallic': 'fmsquare'
        };

        return presetMap[preset] || 'sine';
    }

    /**
     * Cycle through synth voices
     */
    cycleSynthVoice() {
        this.currentSynthVoice = (this.currentSynthVoice + 1) % this.synthVoices.length;
        const voice = this.synthVoices[this.currentSynthVoice];
        console.log(`  🎛️ Synth voice changed to: ${voice.name}`);

        // TODO: Actually switch the synth in the music engine
    }

    /**
     * Cycle through scales
     */
    cycleScale() {
        this.currentScaleIndex = (this.currentScaleIndex + 1) % this.scales.length;
        const scale = this.scales[this.currentScaleIndex];
        this.chordEngine.setScale(scale);
        console.log(`  🎼 Scale changed to: ${scale}`);
    }

    /**
     * Toggle playback mode (Arpeggio/Sustain/Bass)
     */
    togglePlaybackMode() {
        const mode = this.chordEngine.cyclePlaybackMode();
        console.log(`  🎵 Playback mode: ${mode}`);
    }

    /**
     * Toggle auto-filter effect
     */
    toggleAutoFilter() {
        this.autoFilterEnabled = !this.autoFilterEnabled;
        console.log(`  🎚️ Auto-filter: ${this.autoFilterEnabled ? 'ON' : 'OFF'}`);

        // TODO: Actually toggle filter in music engine
    }

    /**
     * Trigger drum pattern
     */
    triggerDrumPattern(patternName) {
        if (this.musicEngine.drumPatterns && this.musicEngine.drumPatterns[patternName]) {
            this.musicEngine.currentPattern = patternName;
            console.log(`  🥁 Drum pattern: ${patternName}`);
        }
    }

    /**
     * Cycle drum patterns
     */
    cycleDrumPattern() {
        this.currentDrumPattern = (this.currentDrumPattern + 1) % this.drumPatterns.length;
        const pattern = this.drumPatterns[this.currentDrumPattern];
        this.triggerDrumPattern(pattern);
    }

    /**
     * Trigger specific drum sounds
     */
    triggerDrumHit(velocity) {
        if (this.musicEngine.drumSamples && window.Tone) {
            const vol = Math.min(0, -20 + (velocity * 1000));
            // TODO: Trigger drum sample with velocity
            console.log(`  🥁 Drum hit! Velocity: ${velocity.toFixed(3)}, Volume: ${vol.toFixed(1)}dB`);
        }
    }

    triggerHiHat() {
        console.log('  🎵 Hi-hat triggered');
        // TODO: Trigger hi-hat sample
    }

    triggerCowbell() {
        console.log('  🔔 Cowbell triggered');
        // TODO: Trigger cowbell sample
    }

    /**
     * Get current state (for UI display)
     */
    getState() {
        return {
            scale: this.chordEngine.getCurrentScale(),
            root: this.chordEngine.getCurrentRoot(),
            octave: this.chordEngine.getCurrentOctave(),
            playbackMode: this.chordEngine.getPlaybackMode(),
            synthVoice: this.synthVoices[this.currentSynthVoice].name,
            autoFilter: this.autoFilterEnabled,
            drumPattern: this.drumPatterns[this.currentDrumPattern],
            leftGesture: this.currentGestures.left?.name || 'none',
            rightGesture: this.currentGestures.right?.name || 'none'
        };
    }

    /**
     * Stop all active loops (note loop and arpeggio loop)
     */
    stopAllLoops() {
        // Stop note loop
        if (this.noteLoop) {
            this.noteLoop.stop();
            this.noteLoop.dispose();
            this.noteLoop = null;
            console.log('🔁 Note loop stopped');
        }

        // Stop arpeggio loop
        if (this.arpeggioLoop) {
            this.arpeggioLoop.stop();
            this.arpeggioLoop.dispose();
            this.arpeggioLoop = null;
            console.log('🔁 Arpeggio loop stopped');
        }
    }

    /**
     * Play chord using WAD Synth Engine
     */
    playChordWAD(chordData, settings) {
        if (!this.wadEngine) return;

        const notes = chordData.notes;
        const preset = settings.preset || 'warmPad';

        // Change WAD preset for hand synth
        if (!this.wadHandSynth || this.lastWadPreset !== preset) {
            this.wadEngine.changePreset('hand', preset);
            this.wadHandSynth = true;
            this.lastWadPreset = preset;
        }

        // Play based on mode
        switch(settings.mode) {
            case 'note':
                // Play single root note
                this.wadEngine.play('hand', notes[0].name, 0.5, settings.volume);
                break;

            case 'legato':
            case 'chord':
                // Play all notes
                notes.forEach(note => {
                    this.wadEngine.play('hand', note.name, 1.5, settings.volume);
                });
                break;

            case 'arpeggio':
                // Play arpeggio sequence
                notes.forEach((note, i) => {
                    setTimeout(() => {
                        this.wadEngine.play('hand', note.name, 0.3, settings.volume);
                    }, i * 150);
                });
                break;
        }
    }

    /**
     * Play chord using Dirt Sample Engine
     */
    async playChordDirt(chordData, settings) {
        if (!this.dirtEngine) {
            console.warn('⚠️ Dirt engine not available');
            return;
        }

        // Check if engine is initialized
        if (!this.dirtEngine.isInitialized) {
            console.warn('⚠️ Dirt engine not initialized');
            return;
        }

        const notes = chordData.notes;
        const sampleBank = settings.preset || 'pad';

        // Use 'pad' synthType as the default hand tracking channel
        const synthType = 'pad';

        // Check if this bank is currently loading
        if (this.dirtEngine.isBankLoading(synthType, sampleBank)) {
            // Silently skip playback while loading
            return;
        }

        // Load the selected sample bank if not already loaded
        if (this.dirtEngine.currentBanks[synthType] !== sampleBank) {
            console.log(`🎵 Loading Dirt sample bank: ${sampleBank}`);
            await this.dirtEngine.loadBank(synthType, sampleBank);
        }

        // Ensure samples are fully loaded before playing
        const player = this.dirtEngine.samplePlayers[synthType];
        if (!player || !player.loaded) {
            return; // Silently skip if not loaded
        }

        try {
            // Play based on mode
            // Note: play() signature is (synthType, note, velocity)
            switch(settings.mode) {
                case 'note':
                    // Play single root note sample
                    this.dirtEngine.play(synthType, notes[0].name, settings.volume);
                    break;

                case 'legato':
                case 'chord':
                    // Play all notes as samples
                    notes.forEach((note, i) => {
                        this.dirtEngine.play(synthType, note.name, settings.volume);
                    });
                    break;

                case 'arpeggio':
                    // Play arpeggio sequence with timing
                    notes.forEach((note, i) => {
                        setTimeout(() => {
                            try {
                                this.dirtEngine.play(synthType, note.name, settings.volume);
                            } catch (error) {
                                console.warn('⚠️ Dirt arpeggio play error:', error.message);
                            }
                        }, i * 150);
                    });
                    break;
            }
        } catch (error) {
            console.error('❌ Dirt engine playback error:', error);
        }
    }

    /**
     * Reset mapper state
     */
    reset() {
        this.stopAllNotes();
        this.stopAllLoops();
        this.currentGestures = { left: null, right: null };
        this.previousGestures = { left: null, right: null };
        this.activeNotes = [];
    }
}
