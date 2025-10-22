/**
 * Gesture Music Mapper
 * Maps hand gestures to musical actions
 */

class GestureMusicMapper {
    constructor(musicEngine, chordEngine) {
        this.musicEngine = musicEngine;
        this.chordEngine = chordEngine;

        // State tracking
        this.currentGestures = {
            left: null,
            right: null
        };

        this.previousGestures = {
            left: null,
            right: null
        };

        this.activeNotes = [];
        this.currentSynthVoice = 0;
        this.autoFilterEnabled = false;
        this.currentDrumPattern = 0;

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
     * Process gestures and trigger musical actions
     * @param {Object} leftGesture - Gesture from left hand
     * @param {Object} rightGesture - Gesture from right hand
     * @param {Object} velocities - Hand velocities
     */
    processGestures(leftGesture, rightGesture, velocities) {
        const now = Date.now();

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

        // Check for two-hand gestures
        if (leftGesture && rightGesture) {
            this.handleTwoHandGesture(leftGesture, rightGesture);
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
        // Octave change: Open Palm (left) + Index (right)
        if (leftGesture.type === 'OPEN_PALM' && rightGesture.type === 'INDEX') {
            this.chordEngine.changeOctave(1);
            console.log('🎵 Octave up!');
        }

        // Triangle: Both hands open (cycle drum patterns)
        if (leftGesture.type === 'OPEN_PALM' && rightGesture.type === 'OPEN_PALM') {
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
        console.log(`  🎹 Playing ${romanNumeral} chord (${chordData.mode}):`,
                    chordData.notes.map(n => n.name).join(', '));

        // Use Tone.js to play the notes
        if (window.Tone && this.musicEngine.instruments) {
            const synth = this.getCurrentSynth();

            if (chordData.arpeggio) {
                // Play as arpeggio
                chordData.notes.forEach((note, i) => {
                    const time = Tone.now() + i * 0.1;
                    synth.triggerAttackRelease(note.frequency, '8n', time);
                });
            } else {
                // Play as chord
                const frequencies = chordData.notes.map(n => n.frequency);
                if (synth.triggerAttackRelease) {
                    synth.triggerAttackRelease(frequencies, '2n');
                }
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
            if (synth.triggerRelease) {
                synth.triggerRelease();
            }
            this.activeNotes = [];
        }
    }

    /**
     * Get current synth instrument
     */
    getCurrentSynth() {
        // Try to get from music engine
        if (this.musicEngine.instruments?.pad) {
            return this.musicEngine.instruments.pad;
        }

        // Fallback: create a simple synth
        if (!this.fallbackSynth && window.Tone) {
            this.fallbackSynth = new Tone.PolySynth(Tone.Synth).toDestination();
            this.fallbackSynth.volume.value = -10;
        }

        return this.fallbackSynth;
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
     * Reset mapper state
     */
    reset() {
        this.stopAllNotes();
        this.currentGestures = { left: null, right: null };
        this.previousGestures = { left: null, right: null };
        this.activeNotes = [];
    }
}
