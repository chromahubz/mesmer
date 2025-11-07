/**
 * Emotion Music Mapper
 * Maps facial emotions to music parameters
 * Controls scale, tempo, drum patterns, effects based on detected emotion
 */

class EmotionMusicMapper {
    constructor(musicEngine, chordEngine) {
        this.musicEngine = musicEngine;
        this.chordEngine = chordEngine;

        this.currentEmotion = 'neutral';
        this.emotionConfidence = 0;
        this.lastUpdate = 0;
        this.updateInterval = 500;  // Update music every 500ms

        // Transition state
        this.isTransitioning = false;
        this.transitionStart = 0;
        this.transitionDuration = 2000;  // 2 second transitions
        this.fromParams = null;
        this.toParams = null;

        // Emotion to music parameter mappings
        this.emotionMappings = {
            happy: {
                scale: 'major',
                tempo: 140,
                mode: 'arpeggio',
                drumPattern: 'techno',
                volume: 0.8,
                reverb: 30,
                delay: 25,
                description: 'Bright, energetic'
            },
            sad: {
                scale: 'minor',
                tempo: 60,
                mode: 'legato',
                drumPattern: 'basic',
                volume: 0.5,
                reverb: 50,
                delay: 40,
                description: 'Melancholic, slow'
            },
            angry: {
                scale: 'phrygian',
                tempo: 160,
                mode: 'chord',
                drumPattern: 'breakbeat',
                volume: 0.9,
                reverb: 20,
                delay: 10,
                description: 'Intense, aggressive'
            },
            surprised: {
                scale: 'lydian',
                tempo: 120,
                mode: 'arpeggio',
                drumPattern: 'hiphop',
                volume: 0.7,
                reverb: 40,
                delay: 35,
                description: 'Ethereal, unexpected'
            },
            neutral: {
                scale: 'dorian',
                tempo: 100,
                mode: 'note',
                drumPattern: 'basic',
                volume: 0.6,
                reverb: 30,
                delay: 20,
                description: 'Balanced, ambient'
            }
        };

        // Head position controls
        this.headPosition = { x: 0.5, y: 0.5, z: 0 };
        this.lastHeadUpdate = 0;
        this.headUpdateInterval = 100;  // Update head params every 100ms
    }

    /**
     * Update music from detected emotion
     * @param {String} emotion - Detected emotion
     * @param {Number} confidence - Confidence score (0-1)
     * @param {Object} headPosition - {x, y, z} head position
     */
    updateFromEmotion(emotion, confidence, headPosition) {
        const now = Date.now();

        // Store head position
        this.headPosition = headPosition;

        // Apply head-based modulations more frequently
        if (now - this.lastHeadUpdate > this.headUpdateInterval) {
            this.applyHeadModulations();
            this.lastHeadUpdate = now;
        }

        // Only update emotion-based params if enough time has passed
        if (now - this.lastUpdate < this.updateInterval) {
            return;
        }

        // Only update if emotion changed and confidence is high enough
        if (emotion === this.currentEmotion || confidence < 0.5) {
            return;
        }

        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`🎭 EMOTION CHANGED: ${this.currentEmotion.toUpperCase()} → ${emotion.toUpperCase()}`);
        console.log(`   Confidence: ${Math.round(confidence * 100)}%`);

        // Start transition to new emotion
        this.transitionToEmotion(emotion);
        this.lastUpdate = now;
    }

    /**
     * Transition to new emotion
     * @param {String} emotion - Target emotion
     */
    transitionToEmotion(emotion) {
        const targetParams = this.emotionMappings[emotion];

        if (!targetParams) {
            console.warn(`⚠️ Unknown emotion: ${emotion}`);
            return;
        }

        // Store from/to for smooth interpolation
        this.fromParams = this.emotionMappings[this.currentEmotion];
        this.toParams = targetParams;
        this.isTransitioning = true;
        this.transitionStart = Date.now();
        this.currentEmotion = emotion;

        console.log(`🎵 Transitioning to: ${targetParams.description}`);
        console.log(`   Scale: ${targetParams.scale}`);
        console.log(`   Tempo: ${targetParams.tempo} BPM`);
        console.log(`   Pattern: ${targetParams.drumPattern}`);

        // Start the transition
        this.performTransition();
    }

    /**
     * Perform smooth transition between emotions
     */
    performTransition() {
        if (!this.isTransitioning) return;

        const now = Date.now();
        const elapsed = now - this.transitionStart;
        const progress = Math.min(elapsed / this.transitionDuration, 1);

        // Easing function (ease-in-out)
        const eased = progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        // Interpolate parameters
        const tempo = this.lerp(this.fromParams.tempo, this.toParams.tempo, eased);
        const volume = this.lerp(this.fromParams.volume, this.toParams.volume, eased);
        const reverb = this.lerp(this.fromParams.reverb, this.toParams.reverb, eased);
        const delay = this.lerp(this.fromParams.delay, this.toParams.delay, eased);

        // Apply interpolated params
        if (this.musicEngine) {
            this.musicEngine.setBPM(Math.round(tempo));
        }

        // Switch scale/mode at 50% transition point
        if (progress >= 0.5 && this.chordEngine) {
            this.chordEngine.setScale(this.toParams.scale);
        }

        // Continue transition
        if (progress < 1) {
            requestAnimationFrame(() => this.performTransition());
        } else {
            // Transition complete
            this.isTransitioning = false;
            console.log(`✅ Transition complete: ${this.toParams.description}`);

            // Apply final params
            if (this.chordEngine) {
                this.chordEngine.setScale(this.toParams.scale);
            }
        }
    }

    /**
     * Apply head position modulations
     */
    applyHeadModulations() {
        if (!this.headPosition) return;

        const { x, y, z } = this.headPosition;

        // X-axis (tilt left/right) → Reverb depth
        // Center (0.5) = baseline, left (0.0) = less reverb, right (1.0) = more reverb
        const reverbMod = (x - 0.5) * 40;  // ±20% around baseline
        const baseReverb = this.emotionMappings[this.currentEmotion].reverb;
        const targetReverb = Math.max(0, Math.min(100, baseReverb + reverbMod));

        // Y-axis (look up/down) → Octave shift
        // Top (0.0) = higher octave, middle (0.5) = normal, bottom (1.0) = lower octave
        let octaveShift = 0;
        if (y < 0.3) octaveShift = 1;      // Looking up = +1 octave
        else if (y > 0.7) octaveShift = -1; // Looking down = -1 octave

        if (octaveShift !== 0 && this.chordEngine) {
            const currentOctave = this.chordEngine.getCurrentOctave();
            const targetOctave = Math.max(2, Math.min(6, currentOctave + octaveShift));
            if (currentOctave !== targetOctave) {
                this.chordEngine.setOctave(targetOctave);
            }
        }

        // Z-axis (move forward/back) → Volume
        // Further back = quieter, closer = louder
        // Note: z is typically negative for depth, closer to 0 = closer to camera
        const volumeMod = Math.abs(z) * 0.2;  // Modest volume adjustment

        // Throttled logging for head modulations
        if (!this._lastHeadLog || Date.now() - this._lastHeadLog > 2000) {
            console.log(`👤 Head modulation: Reverb ${Math.round(targetReverb)}% | Octave ${octaveShift >= 0 ? '+' : ''}${octaveShift}`);
            this._lastHeadLog = Date.now();
        }
    }

    /**
     * Linear interpolation helper
     */
    lerp(from, to, progress) {
        return from + (to - from) * progress;
    }

    /**
     * Get current emotion and parameters
     */
    getCurrentState() {
        return {
            emotion: this.currentEmotion,
            confidence: this.emotionConfidence,
            params: this.emotionMappings[this.currentEmotion],
            headPosition: this.headPosition,
            isTransitioning: this.isTransitioning
        };
    }

    /**
     * Manually set emotion (for testing)
     */
    setEmotion(emotion) {
        if (this.emotionMappings[emotion]) {
            this.transitionToEmotion(emotion);
        }
    }

    /**
     * Get all emotion mappings (for UI display)
     */
    getEmotionMappings() {
        return this.emotionMappings;
    }

    /**
     * Update emotion mapping (for customization)
     */
    updateEmotionMapping(emotion, params) {
        if (this.emotionMappings[emotion]) {
            this.emotionMappings[emotion] = {
                ...this.emotionMappings[emotion],
                ...params
            };
            console.log(`✅ Updated ${emotion} mapping:`, params);
        }
    }
}
