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

        // Theremin mode synth (continuous pitch/volume control)
        this.thereminSynth = null;
        this.thereminActive = false;
        this.thereminOctaveShift = 0; // Track current octave shift for display
        this.initializeThereminSynth();

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
     * Initialize Theremin Synth (continuous tone)
     */
    initializeThereminSynth() {
        if (typeof Tone === 'undefined') {
            console.warn('⚠️ Tone.js not available for theremin');
            return;
        }

        // Create reverb and delay effects
        this.thereminReverb = new Tone.Reverb({
            decay: 2,
            wet: 0
        });

        this.thereminDelay = new Tone.FeedbackDelay({
            delayTime: 0.25,
            feedback: 0.3,
            wet: 0
        });

        // Create a MonoSynth with filter for theremin (more features than basic Synth)
        this.thereminSynth = new Tone.MonoSynth({
            oscillator: {
                type: 'sine'
            },
            filter: {
                type: 'lowpass',
                Q: 1,
                rolloff: -24
            },
            filterEnvelope: {
                attack: 0.01,
                decay: 0.1,
                sustain: 1.0,
                release: 0.2,
                baseFrequency: 200,
                octaves: 6
            },
            envelope: {
                attack: 0.05,   // Very quick attack
                decay: 0.1,
                sustain: 1.0,   // Hold at full volume
                release: 0.2    // Quick release
            }
        });

        // Connect signal chain: synth → delay → reverb → destination
        this.thereminSynth.chain(this.thereminDelay, this.thereminReverb, Tone.Destination);

        // Set initial volume to 0
        this.thereminSynth.volume.value = -Infinity;

        console.log('🎵 Theremin synth initialized with reverb & delay effects');
    }

    /**
     * Update theremin synth sound/oscillator type
     */
    updateThereminSound(soundType) {
        if (!this.thereminSynth) {
            console.warn('⚠️ Theremin synth not initialized');
            return;
        }

        try {
            // Stop theremin if active before changing sound
            const wasActive = this.thereminActive;
            if (wasActive) {
                this.stopTheremin();
            }

            // Dispose old synth
            this.thereminSynth.dispose();

            // Map sound types to oscillator configurations
            const soundConfigs = {
                'sine': { type: 'sine' },
                'triangle': { type: 'triangle' },
                'sawtooth': { type: 'sawtooth' },
                'square': { type: 'square' },
                'fatsine': { type: 'fatsine' },
                'fatsawtooth': { type: 'fatsawtooth' },
                'amsine': { type: 'sine' }, // Use simple sine for AM
                'fmsine': { type: 'sine' }  // Use simple sine for FM
            };

            const config = soundConfigs[soundType] || soundConfigs['sine'];

            // Create new MonoSynth with updated oscillator and filter
            this.thereminSynth = new Tone.MonoSynth({
                oscillator: {
                    type: config.type
                },
                filter: {
                    type: 'lowpass',
                    Q: 1,
                    rolloff: -24
                },
                filterEnvelope: {
                    attack: 0.01,
                    decay: 0.1,
                    sustain: 1.0,
                    release: 0.2,
                    baseFrequency: 200,
                    octaves: 6
                },
                envelope: {
                    attack: 0.05,
                    decay: 0.1,
                    sustain: 1.0,
                    release: 0.2
                }
            });

            // Reconnect effects chain: synth → delay → reverb → destination
            this.thereminSynth.chain(this.thereminDelay, this.thereminReverb, Tone.Destination);

            // Set initial volume
            this.thereminSynth.volume.value = -Infinity;

            console.log(`🔊 Theremin sound updated to: ${soundType} with reverb & delay`);

            // Restart if it was playing
            // (Will restart on next processGestures call)
        } catch (error) {
            console.error('❌ Error updating theremin sound:', error);
        }
    }

    /**
     * Quantize frequency to nearest note in current scale
     * @param {number} frequency - Continuous frequency in Hz
     * @returns {number} - Quantized frequency snapped to scale
     */
    quantizeFrequency(frequency) {
        if (!this.chordEngine) {
            console.warn('⚠️ ChordEngine not available for quantization');
            return frequency;
        }

        try {
            // Get current scale and root from chord engine
            const scaleName = this.chordEngine.currentScale;
            const scaleIntervals = this.chordEngine.scales[scaleName];
            const rootNote = this.chordEngine.currentRoot;

            if (!scaleIntervals) {
                console.warn(`⚠️ Scale "${scaleName}" not found`);
                return frequency;
            }

            // Get root note index (C=0, C#=1, D=2, etc.)
            // rootNote might be "C3", "D3", etc., so extract just the note name
            const noteNameOnly = rootNote.replace(/[0-9]/g, ''); // Remove octave numbers
            const rootIndex = this.chordEngine.noteNames.indexOf(noteNameOnly);

            if (rootIndex === -1) {
                console.warn(`⚠️ Root note "${rootNote}" not found`);
                return frequency;
            }

            // Throttle logging (only log occasionally to avoid spam)
            if (!this._lastQuantizeLog || Date.now() - this._lastQuantizeLog > 500) {
                console.log(`🎹 Quantizing to: ${noteNameOnly} ${scaleName} (rootIndex: ${rootIndex})`);
                this._lastQuantizeLog = Date.now();
            }

            // Convert frequency to MIDI note number
            // MIDI 69 = A4 = 440Hz
            // Formula: midi = 69 + 12 * log2(freq / 440)
            const midiNote = 69 + 12 * Math.log2(frequency / 440);

            // Get octave and note within octave (0-11)
            const octave = Math.floor(midiNote / 12) - 1;
            let noteInOctave = Math.round(midiNote) % 12;

            // Transpose scale intervals to the selected key
            // Example: C minor (0,2,3,5,7,8,10) transposed to D = (2,4,5,7,9,10,0)
            const transposedIntervals = scaleIntervals.map(interval => (interval + rootIndex) % 12);

            // Find nearest scale degree in the transposed scale
            let closestInterval = transposedIntervals[0];
            let minDistance = Math.abs(noteInOctave - closestInterval);

            for (let interval of transposedIntervals) {
                // Check both current octave and wrapping
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
            // Formula: freq = 440 * 2^((midi - 69) / 12)
            const quantizedFreq = 440 * Math.pow(2, (quantizedMidi - 69) / 12);

            // Log what note we quantized to (throttled)
            const quantizedNoteName = this.chordEngine.noteNames[adjustedInterval % 12];
            if (!this._lastQuantizeNoteLog || Date.now() - this._lastQuantizeNoteLog > 500) {
                console.log(`   🎯 ${Math.round(frequency)}Hz → ${Math.round(quantizedFreq)}Hz (${quantizedNoteName})`);
                this._lastQuantizeNoteLog = Date.now();
            }

            return quantizedFreq;
        } catch (error) {
            console.error('❌ Error in quantizeFrequency:', error);
            return frequency; // Return original on error
        }
    }

    /**
     * Convert frequency to note name (for Dirt sample engine)
     */
    frequencyToNote(frequency) {
        const A4 = 440;
        const C0 = A4 * Math.pow(2, -4.75);
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

        const halfSteps = 12 * Math.log2(frequency / C0);
        const noteIndex = Math.round(halfSteps);
        const octave = Math.floor(noteIndex / 12);
        const note = noteNames[noteIndex % 12];

        return `${note}${octave}`;
    }

    /**
     * Process Theremin Mode - continuous pitch or arpeggio playback with multi-engine support
     */
    processThereminMode(leftGesture, rightGesture) {
        if (!this.thereminSynth) {
            console.warn('⚠️ Theremin synth not initialized');
            return;
        }

        // Get playback mode and engine
        const playbackMode = this.audioSettings.thereminPlaybackMode || 'continuous';
        const thereminEngine = this.audioSettings.thereminEngine || 'tonejs';

        // DEBUG: Log routing (throttled)
        if (!this._lastRoutingLog || Date.now() - this._lastRoutingLog > 2000) {
            console.log(`🎯 [MAPPER-ROUTING] Theremin mode active, routing to: ${playbackMode} mode with ${thereminEngine} engine`);
            this._lastRoutingLog = Date.now();
        }

        // Route to appropriate playback method
        if (playbackMode === 'arpeggio') {
            this.processThereminArpeggio(leftGesture, rightGesture);
        } else {
            this.processThereminContinuous(leftGesture, rightGesture);
        }
    }

    /**
     * Process Theremin in continuous mode (classic theremin behavior)
     */
    processThereminContinuous(leftGesture, rightGesture) {
        // Get the position of the pitch hand
        const thereminHand = this.audioSettings.thereminHand;
        const pitchPosition = thereminHand === 'right'
            ? this.audioSettings.rightPosition
            : this.audioSettings.leftPosition;

        // Get the position of the other hand
        const otherHand = thereminHand === 'right' ? 'left' : 'right';
        const otherPosition = otherHand === 'right'
            ? this.audioSettings.rightPosition
            : this.audioSettings.leftPosition;

        // Check if pitch hand is detected
        const pitchHandDetected = thereminHand === 'right' ? rightGesture : leftGesture;

        if (!pitchHandDetected || !pitchPosition) {
            // No pitch hand detected - stop theremin
            this.stopTheremin();
            return;
        }

        // Map Y position to frequency
        const normalizedY = 1 - pitchPosition.y;

        // Base frequency range
        let minFreq = 100;
        let maxFreq = 2000;

        // Other hand control
        const otherHandControl = this.audioSettings.thereminOtherHand || 'volume';

        // Handle octave shift (-4 to +4 octaves)
        if (otherHandControl === 'octave' && otherPosition) {
            const otherY = otherPosition.y;
            // Map Y position (0 to 1) to octave shift (-4 to +4)
            // Y=0 (top) = +4 octaves, Y=1 (bottom) = -4 octaves
            const octaveShift = Math.round(4 - (otherY * 8)); // 4 to -4

            // Store for display
            this.thereminOctaveShift = octaveShift;

            const multiplier = Math.pow(2, octaveShift);
            minFreq *= multiplier;
            maxFreq *= multiplier;

            // Clamp to audible range (20Hz to 20kHz)
            minFreq = Math.max(20, Math.min(20000, minFreq));
            maxFreq = Math.max(20, Math.min(20000, maxFreq));
        } else if (otherHandControl === 'octave') {
            // Reset to 0 when other hand not detected
            this.thereminOctaveShift = 0;
        }

        let frequency = minFreq + (normalizedY * (maxFreq - minFreq));

        // Apply quantization if enabled
        const quantizeEnabled = this.audioSettings.thereminQuantize || false;
        if (quantizeEnabled) {
            frequency = this.quantizeFrequency(frequency);
        }

        // Determine volume
        let volume = 0.5;
        let volumeDb;
        if (otherHandControl === 'volume' && otherPosition) {
            const otherX = otherPosition.x;
            volumeDb = -60 + (otherX * 60);
            volume = otherX; // 0 to 1
        } else {
            volumeDb = -6; // Fixed volume
            volume = 0.5;
        }

        // Get engine and preset settings
        const thereminEngine = this.audioSettings.thereminEngine || 'tonejs';
        const thereminPreset = this.audioSettings.thereminPreset || 'sine';

        // DEBUG: Log received settings (throttled)
        if (!this._lastSettingsLog || Date.now() - this._lastSettingsLog > 2000) {
            console.log(`📥 [MAPPER-CONTINUOUS] Received: engine="${thereminEngine}", preset="${thereminPreset}" (from audioSettings)`);
            console.log(`📥 [MAPPER-CONTINUOUS] Current tracking: _lastEngine="${this._lastThereminEngine}", _lastPreset="${this._lastThereminPreset}"`);
            this._lastSettingsLog = Date.now();
        }

        // Check if engine or preset changed - if so, restart theremin
        if (this._lastThereminEngine !== thereminEngine || this._lastThereminPreset !== thereminPreset) {
            console.log(`🔄 [MAPPER-CONTINUOUS] Theremin settings changed: ${this._lastThereminEngine}/${this._lastThereminPreset} → ${thereminEngine}/${thereminPreset}`);
            this.stopTheremin();
            this._lastThereminEngine = thereminEngine;
            this._lastThereminPreset = thereminPreset;

            // For Tone.js, also update the synth oscillator type
            if (thereminEngine === 'tonejs') {
                console.log(`🎛️ [MAPPER-CONTINUOUS] Calling updateThereminSound("${thereminPreset}")`);
                this.updateThereminSound(thereminPreset);
            }
        }

        // Route to appropriate engine
        if (thereminEngine === 'tonejs') {
            // Tone.js - continuous pitch control
            if (!this.thereminActive) {
                this.thereminSynth.triggerAttack(frequency);
                this.thereminActive = true;
                console.log(`🎵 Theremin CONTINUOUS started [Tone.js/${thereminPreset}]`);
            } else {
                const rampTime = quantizeEnabled ? 0.08 : 0.05;
                this.thereminSynth.frequency.rampTo(frequency, rampTime);
            }

            // Update volume
            this.thereminSynth.volume.rampTo(volumeDb, 0.05);

            // Handle other hand controls
            if (otherPosition) {
                try {
                    if (otherHandControl === 'filter') {
                        // Filter sweep: Y-axis controls cutoff frequency
                        const filterY = 1 - otherPosition.y;
                        const cutoff = Math.max(100, 200 + (filterY * 7800)); // Min 100Hz to avoid Tone.js error
                        if (this.thereminSynth.filter && this.thereminSynth.filter.frequency) {
                            this.thereminSynth.filter.frequency.rampTo(cutoff, 0.05);
                        }
                    } else if (otherHandControl === 'reverb') {
                        // Reverb: X-axis controls wet/dry mix
                        const reverbAmount = Math.max(0, Math.min(1, otherPosition.x));
                        if (this.thereminReverb) {
                            this.thereminReverb.wet.rampTo(reverbAmount, 0.1);
                        }
                    } else if (otherHandControl === 'delay') {
                        // Delay: X-axis controls delay time
                        const delayTime = 0.05 + (otherPosition.x * 0.95); // 50ms to 1000ms
                        const delayWet = Math.min(0.7, otherPosition.x); // Max 70% wet
                        if (this.thereminDelay) {
                            this.thereminDelay.delayTime.rampTo(delayTime, 0.1);
                            this.thereminDelay.wet.rampTo(delayWet, 0.1);
                        }
                    }
                } catch (error) {
                    console.error('❌ Other hand control error:', error);
                }
            }

            // Reset octave shift when not using octave control
            if (otherHandControl !== 'octave') {
                this.thereminOctaveShift = 0;
            }

        } else if (thereminEngine === 'wad' && window.Wad) {
            // WAD - continuous pitch control
            // Note: WAD doesn't support live pitch/volume changes on playing voices
            // So we need to retrigger on significant changes
            const frequencyChanged = !this._lastWadFrequency || Math.abs(frequency - this._lastWadFrequency) > 20;

            if (!this.thereminActive || !this.wadThereminVoice || frequencyChanged) {
                // Stop previous voice if exists
                if (this.wadThereminVoice && this.wadThereminVoice.stop) {
                    this.wadThereminVoice.stop();
                }

                // Create new WAD voice
                this.wadThereminVoice = new Wad({
                    source: thereminPreset || 'sine',
                    pitch: frequency,
                    env: { attack: 0.01, decay: 0.1, sustain: 1.0, release: 0.2 },
                    volume: volume,
                    filter: { type: 'lowpass', frequency: 2000, q: 1 }
                });
                this.wadThereminVoice.play();
                this.thereminActive = true;
                this._lastWadFrequency = frequency;

                if (!this.thereminActive) {
                    console.log(`🎵 Theremin CONTINUOUS started [WAD/${thereminPreset}] @ ${Math.round(frequency)}Hz`);
                }
            }

        } else if (thereminEngine === 'dirt' && this.dirtEngine) {
            // Dirt - quantized notes (samples can't do continuous pitch)
            // Convert frequency to closest note
            const note = this.frequencyToNote(frequency);

            // Only trigger new note if it changed
            if (!this.thereminActive || this._lastDirtNote !== note) {
                this.dirtEngine.playSample(thereminPreset || 'arpy', note, volume);
                this._lastDirtNote = note;
                this.thereminActive = true;
                console.log(`🎵 Theremin CONTINUOUS: ${note} [Dirt/${thereminPreset}]`);
            }
        }
    }

    /**
     * Process Theremin in arpeggio mode (quantized note triggering)
     */
    processThereminArpeggio(leftGesture, rightGesture) {
        // Get the position of the pitch hand
        const thereminHand = this.audioSettings.thereminHand;
        const pitchPosition = thereminHand === 'right'
            ? this.audioSettings.rightPosition
            : this.audioSettings.leftPosition;

        // Check if pitch hand is detected
        const pitchHandDetected = thereminHand === 'right' ? rightGesture : leftGesture;

        if (!pitchHandDetected || !pitchPosition) {
            // No pitch hand detected - stop previous note if any
            if (this.thereminActive) {
                this.thereminSynth.triggerRelease();
                this.thereminActive = false;
                this._lastThereminNote = null;
            }
            return;
        }

        // Map Y position to note (0.0 to 1.0 → high to low)
        const normalizedY = 1 - pitchPosition.y;

        // Use chromatic scale (all 12 notes)
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

        // Map Y position to note (3 octaves: C2 to B4)
        const octaveRange = 3;
        const totalNotes = notes.length * octaveRange;
        const noteIndex = Math.floor(normalizedY * totalNotes);

        // Calculate note and octave
        const baseOctave = 2;
        const note = notes[noteIndex % notes.length];
        const octave = baseOctave + Math.floor(noteIndex / notes.length);
        const fullNote = `${note}${octave}`;

        // Get engine and preset settings
        const thereminEngine = this.audioSettings.thereminEngine || 'tonejs';
        const thereminPreset = this.audioSettings.thereminPreset || 'sine';

        // DEBUG: Log received settings (throttled)
        if (!this._lastArpeggioLog || Date.now() - this._lastArpeggioLog > 2000) {
            console.log(`📥 [MAPPER-ARPEGGIO] Received: engine="${thereminEngine}", preset="${thereminPreset}"`);
            console.log(`📥 [MAPPER-ARPEGGIO] Current tracking: _lastEngine="${this._lastThereminEngine}", _lastPreset="${this._lastThereminPreset}"`);
            this._lastArpeggioLog = Date.now();
        }

        // Check if engine or preset changed
        if (this._lastThereminEngine !== thereminEngine || this._lastThereminPreset !== thereminPreset) {
            console.log(`🔄 [MAPPER-ARPEGGIO] Theremin ARPEGGIO settings changed: ${this._lastThereminEngine}/${this._lastThereminPreset} → ${thereminEngine}/${thereminPreset}`);

            // Stop any active sound
            if (this.thereminActive) {
                if (this.thereminSynth) {
                    this.thereminSynth.triggerRelease();
                }
                if (this.wadThereminVoice && this.wadThereminVoice.stop) {
                    this.wadThereminVoice.stop();
                    this.wadThereminVoice = null;
                }
                this.thereminActive = false;
            }

            this._lastThereminEngine = thereminEngine;
            this._lastThereminPreset = thereminPreset;
            this._lastThereminNote = null;

            // For Tone.js, also update the synth oscillator type
            if (thereminEngine === 'tonejs') {
                console.log(`🎛️ [MAPPER-ARPEGGIO] Calling updateThereminSound("${thereminPreset}")`);
                this.updateThereminSound(thereminPreset);
            }
        }

        // Only trigger new note if it changed
        if (this._lastThereminNote !== fullNote) {
            // Release previous note
            if (this.thereminActive) {
                if (this.thereminSynth) {
                    this.thereminSynth.triggerRelease();
                }
                if (this.wadThereminVoice && this.wadThereminVoice.stop) {
                    this.wadThereminVoice.stop();
                    this.wadThereminVoice = null;
                }
            }

            // Trigger new note
            if (thereminEngine === 'tonejs') {
                // Tone.js - use theremin synth
                this.thereminSynth.triggerAttack(fullNote);
            } else if (thereminEngine === 'wad' && window.Wad) {
                // WAD engine
                if (this.wadThereminVoice) {
                    this.wadThereminVoice.stop();
                }
                this.wadThereminVoice = new Wad({
                    source: thereminPreset || 'sine',
                    env: { attack: 0.01, decay: 0.1, sustain: 0.8, release: 0.3 },
                    volume: 0.5
                });
                this.wadThereminVoice.play({ pitch: fullNote });
            } else if (thereminEngine === 'dirt' && this.dirtEngine) {
                // Dirt sample engine
                this.dirtEngine.playSample(thereminPreset || 'arpy', fullNote, 0.7);
            }

            this.thereminActive = true;
            this._lastThereminNote = fullNote;

            console.log(`🎹 Theremin ARPEGGIO: ${fullNote} [${thereminEngine}/${thereminPreset}]`);
        }
    }

    /**
     * Stop theremin playback
     */
    stopTheremin() {
        if (this.thereminActive) {
            // Stop Tone.js synth
            if (this.thereminSynth) {
                this.thereminSynth.triggerRelease();
            }

            // Stop WAD voice
            if (this.wadThereminVoice && this.wadThereminVoice.stop) {
                this.wadThereminVoice.stop();
                this.wadThereminVoice = null;
            }

            this.thereminActive = false;
            this._lastDirtNote = null;
            console.log('🔇 Theremin stopped');
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

        // Store previous theremin sound to detect changes
        const prevThereminSound = this.audioSettings?.thereminSound;

        // Store audio settings (MUST include ALL theremin settings!)
        this.audioSettings = {
            volume: audioSettings.volume || 0.7,
            engine: audioSettings.engine || 'tonejs',
            preset: audioSettings.preset || 'sine',
            mode: audioSettings.mode || 'note',
            interactionMode: audioSettings.interactionMode || 'layer',
            thereminMode: audioSettings.thereminMode || false,
            thereminHand: audioSettings.thereminHand || 'right',
            thereminSound: audioSettings.thereminSound || 'sine',
            thereminQuantize: audioSettings.thereminQuantize || false,
            thereminOtherHand: audioSettings.thereminOtherHand || 'volume',
            thereminPlaybackMode: audioSettings.thereminPlaybackMode || 'continuous',  // FIX: Was missing!
            thereminEngine: audioSettings.thereminEngine || 'tonejs',  // FIX: THIS WAS MISSING!!!
            thereminPreset: audioSettings.thereminPreset || 'sine',  // FIX: THIS WAS MISSING!!!
            leftPosition: audioSettings.leftPosition || null,
            rightPosition: audioSettings.rightPosition || null
        };

        // Debug log to verify values are stored
        console.log(`📥 STORED audioSettings: engine="${this.audioSettings.thereminEngine}", preset="${this.audioSettings.thereminPreset}", mode="${this.audioSettings.thereminPlaybackMode}"`);

        // Update theremin sound if it changed
        if (this.audioSettings.thereminSound !== prevThereminSound && this.audioSettings.thereminMode) {
            this.updateThereminSound(this.audioSettings.thereminSound);
        }

        // Handle Theremin Mode - ONLY if hand tracking is providing data
        // If theremin mode is on but no gesture/position data, it means hand tracking isn't running
        const hasPositionData = this.audioSettings.leftPosition || this.audioSettings.rightPosition;

        if (this.audioSettings.thereminMode && hasPositionData) {
            console.log('🎵 Theremin mode active - processing theremin');
            this.processThereminMode(leftGesture, rightGesture);
            return; // Skip normal gesture processing in theremin mode
        } else {
            // Stop theremin if it was active
            if (this.thereminActive) {
                console.log('🔇 Stopping theremin - mode off or no position data');
                this.stopTheremin();
            }
            // If theremin mode is on but no position data, log it
            if (this.audioSettings.thereminMode && !hasPositionData) {
                console.log('⚠️ Theremin mode ON but no position data - hand tracking not running?');
            }
        }

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
        // In theremin mode with octave control, show theremin octave shift instead
        const inThereminMode = this.audioSettings && this.audioSettings.thereminMode;
        const usingOctaveControl = this.audioSettings && this.audioSettings.thereminOtherHand === 'octave';
        const displayOctave = (inThereminMode && usingOctaveControl)
            ? this.thereminOctaveShift
            : this.chordEngine.getCurrentOctave();

        return {
            scale: this.chordEngine.getCurrentScale(),
            root: this.chordEngine.getCurrentRoot(),
            octave: displayOctave,
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
