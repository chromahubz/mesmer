/**
 * DJ FX Rack - Professional Quality Effects
 * Serato/Pioneer-level audio processing
 * 4 essential FX (casual) + 4 advanced FX (pro)
 */

class DJFXRack {
    constructor() {
        this.isInitialized = false;

        // Essential FX (always available)
        this.filter = null;
        this.echo = null;
        this.reverb = null;
        this.phaser = null;

        // Advanced FX (pro mode only)
        this.flanger = null;
        this.bitcrusher = null;
        this.transformer = null;
        this.roll = null;

        // FX state
        this.activeEffects = {
            filter: false,
            echo: false,
            reverb: false,
            phaser: false,
            flanger: false,
            bitcrusher: false,
            transformer: false,
            roll: false
        };

        // FX parameters
        this.params = {
            filter: { cutoff: 1000, resonance: 1, type: 'lowpass' },
            echo: { feedback: 0.3, time: 0.25, wet: 0 },
            reverb: { decay: 2.5, wet: 0 },
            phaser: { frequency: 0.5, depth: 0.7, wet: 0 }
        };

        // Input/output routing
        this.input = null;
        this.output = null;

        console.log('🎛️ DJ FX Rack initialized');
    }

    /**
     * Initialize all effects
     */
    async init() {
        if (!window.Tone) {
            console.error('❌ Tone.js not loaded');
            return false;
        }

        try {
            console.log('🎛️ Creating professional FX chain...');

            // Create input/output nodes
            this.input = new Tone.Gain(1);
            this.output = new Tone.Gain(1);

            // === ESSENTIAL FX (Casual Mode) ===

            // 1. FILTER - Resonant high-pass/low-pass (Pioneer DJM-900 style)
            this.filter = new Tone.Filter({
                type: 'lowpass',
                frequency: 20000, // Start fully open
                Q: 1,
                rolloff: -24
            });

            // 2. ECHO - Beat-synced delay (Serato style)
            this.echo = new Tone.PingPongDelay({
                delayTime: '8n', // 1/8 note
                feedback: 0.3,
                wet: 0
            });

            // Add filter to echo feedback path (classic DJ delay)
            this.echoFilter = new Tone.Filter({
                type: 'highpass',
                frequency: 500,
                Q: 0.5
            });
            this.echo.connect(this.echoFilter);
            this.echoFilter.connect(this.echo);

            // 3. REVERB - Hall reverb with shimmer
            this.reverb = new Tone.Reverb({
                decay: 2.5,
                preDelay: 0.01,
                wet: 0
            });
            await this.reverb.generate(); // Generate impulse response

            // 4. PHASER - Sweeping phase effect
            this.phaser = new Tone.Phaser({
                frequency: 0.5,
                octaves: 3,
                stages: 10,
                Q: 10,
                baseFrequency: 350,
                wet: 0
            });

            // === ADVANCED FX (Pro Mode) ===

            // 5. FLANGER - Metallic sweep
            this.flanger = new Tone.Chorus({
                frequency: 0.5,
                delayTime: 3,
                depth: 0.7,
                type: 'sine',
                spread: 0,
                wet: 0
            }).start();

            // 6. BITCRUSHER - Lo-fi/retro effect
            this.bitcrusher = new Tone.BitCrusher({
                bits: 4,
                wet: 0
            });

            // 7. TRANSFORMER - Rhythmic gate (stutter effect)
            this.transformer = new Tone.Gate({
                threshold: -50,
                smoothing: 0.001,
                wet: 0
            });

            // Create LFO for transformer rhythmic gating
            this.transformerLFO = new Tone.LFO({
                frequency: '4n',
                min: -60,
                max: 0
            });
            this.transformerLFO.connect(this.transformer.threshold);

            // 8. ROLL - Instant loop repeat (Serato Roll)
            // This is implemented in DJ Engine as it requires buffer manipulation

            // === SIGNAL CHAIN ===
            // Input → Filter → Echo → Reverb → Phaser → Flanger → Bitcrusher → Transformer → Output
            this.input.connect(this.filter);
            this.filter.connect(this.echo);
            this.echo.connect(this.reverb);
            this.reverb.connect(this.phaser);
            this.phaser.connect(this.flanger);
            this.flanger.connect(this.bitcrusher);
            this.bitcrusher.connect(this.transformer);
            this.transformer.connect(this.output);

            this.isInitialized = true;
            console.log('✅ DJ FX Rack ready (8 effects)');
            return true;

        } catch (error) {
            console.error('❌ Failed to initialize FX Rack:', error);
            return false;
        }
    }

    /**
     * Apply filter effect (hand Y-axis control)
     * @param {Number} amount - 0 to 1 (0.5 = neutral/off)
     * @param {String} type - 'lowpass' or 'highpass'
     */
    applyFilter(amount, type = null) {
        if (!this.filter) return;

        // amount 0-0.5 = high-pass filter (removes bass)
        // amount 0.5-1 = low-pass filter (removes treble)

        if (amount < 0.45 || amount > 0.55) {
            this.activeEffects.filter = true;

            if (amount < 0.5) {
                // High-pass mode (hand up = remove bass)
                this.filter.type = 'highpass';
                // Map 0-0.45 to 20Hz-1500Hz
                const cutoff = 20 + ((0.5 - amount) / 0.5) * 1480;
                this.filter.frequency.linearRampTo(cutoff, 0.05);
                this.params.filter.type = 'highpass';
            } else {
                // Low-pass mode (hand down = remove treble)
                this.filter.type = 'lowpass';
                // Map 0.55-1 to 20000Hz-500Hz
                const cutoff = 20000 - ((amount - 0.5) / 0.5) * 19500;
                this.filter.frequency.linearRampTo(cutoff, 0.05);
                this.params.filter.type = 'lowpass';
            }

            this.params.filter.cutoff = this.filter.frequency.value;
            console.log(`🎚️ Filter: ${this.params.filter.type} ${Math.round(this.params.filter.cutoff)}Hz`);
        } else {
            // Neutral zone - filter fully open
            this.activeEffects.filter = false;
            this.filter.frequency.linearRampTo(20000, 0.05);
        }
    }

    /**
     * Apply echo/delay effect
     * @param {Number} feedback - 0 to 1 (amount of repeats)
     * @param {String} time - Note value ('4n', '8n', '16n') or time in seconds
     */
    applyEcho(feedback, time = '8n') {
        if (!this.echo) return;

        this.activeEffects.echo = feedback > 0;

        if (feedback > 0) {
            this.echo.feedback.linearRampTo(Math.min(0.95, feedback), 0.1);
            this.echo.wet.linearRampTo(Math.min(0.7, feedback * 0.7), 0.1);

            if (typeof time === 'string') {
                this.echo.delayTime.value = time;
            } else {
                this.echo.delayTime.value = time;
            }

            this.params.echo.feedback = feedback;
            this.params.echo.wet = this.echo.wet.value;
            console.log(`🔊 Echo: ${Math.round(feedback * 100)}%`);
        } else {
            this.echo.wet.linearRampTo(0, 0.1);
        }
    }

    /**
     * Apply reverb effect
     * @param {Number} wetness - 0 to 1 (dry to wet)
     * @param {Number} decay - 0.5 to 10 seconds
     */
    applyReverb(wetness, decay = 2.5) {
        if (!this.reverb) return;

        this.activeEffects.reverb = wetness > 0;

        if (wetness > 0) {
            this.reverb.wet.linearRampTo(Math.min(0.8, wetness), 0.1);

            // Update decay if changed
            if (Math.abs(decay - this.params.reverb.decay) > 0.1) {
                this.reverb.decay = decay;
                this.params.reverb.decay = decay;
            }

            this.params.reverb.wet = wetness;
            console.log(`🌊 Reverb: ${Math.round(wetness * 100)}%`);
        } else {
            this.reverb.wet.linearRampTo(0, 0.1);
        }
    }

    /**
     * Apply phaser effect
     * @param {Number} rate - LFO speed (0.1 to 5 Hz)
     * @param {Number} depth - Effect depth (0 to 1)
     */
    applyPhaser(rate, depth) {
        if (!this.phaser) return;

        this.activeEffects.phaser = depth > 0;

        if (depth > 0) {
            this.phaser.frequency.value = rate;
            this.phaser.wet.linearRampTo(depth, 0.1);

            this.params.phaser.frequency = rate;
            this.params.phaser.depth = depth;
            console.log(`🌀 Phaser: ${Math.round(depth * 100)}%`);
        } else {
            this.phaser.wet.linearRampTo(0, 0.1);
        }
    }

    /**
     * Apply flanger effect (pro mode)
     * @param {Number} rate - LFO speed
     * @param {Number} depth - Effect depth
     */
    applyFlanger(rate, depth) {
        if (!this.flanger) return;

        this.activeEffects.flanger = depth > 0;

        if (depth > 0) {
            this.flanger.frequency.value = rate;
            this.flanger.wet.linearRampTo(depth, 0.1);
            console.log(`🎸 Flanger: ${Math.round(depth * 100)}%`);
        } else {
            this.flanger.wet.linearRampTo(0, 0.1);
        }
    }

    /**
     * Apply bitcrusher effect (pro mode)
     * @param {Number} amount - 0 to 1 (clean to crushed)
     */
    applyBitcrusher(amount) {
        if (!this.bitcrusher) return;

        this.activeEffects.bitcrusher = amount > 0;

        if (amount > 0) {
            // Map amount to bit depth (16 bits down to 1 bit)
            const bits = Math.max(1, Math.round(16 - (amount * 15)));
            this.bitcrusher.bits = bits;
            this.bitcrusher.wet.value = amount;
            console.log(`🎮 Bitcrusher: ${bits}-bit`);
        } else {
            this.bitcrusher.wet.value = 0;
        }
    }

    /**
     * Apply transformer (stutter/gate) effect (pro mode)
     * @param {Boolean} active - On/off
     * @param {String} pattern - Gate pattern ('4n', '8n', '16n')
     */
    applyTransformer(active, pattern = '16n') {
        if (!this.transformer || !this.transformerLFO) return;

        this.activeEffects.transformer = active;

        if (active) {
            this.transformerLFO.frequency.value = pattern;
            this.transformerLFO.start();
            this.transformer.wet.value = 1;
            console.log(`⚡ Transformer: ${pattern} pattern`);
        } else {
            this.transformerLFO.stop();
            this.transformer.wet.value = 0;
        }
    }

    /**
     * Toggle effect on/off
     * @param {String} effectName - Name of effect
     */
    toggleEffect(effectName) {
        switch (effectName) {
            case 'filter':
                this.activeEffects.filter = !this.activeEffects.filter;
                if (!this.activeEffects.filter) {
                    this.filter.frequency.linearRampTo(20000, 0.1);
                }
                break;
            case 'echo':
                this.activeEffects.echo = !this.activeEffects.echo;
                if (!this.activeEffects.echo) {
                    this.echo.wet.linearRampTo(0, 0.1);
                }
                break;
            case 'reverb':
                this.activeEffects.reverb = !this.activeEffects.reverb;
                if (!this.activeEffects.reverb) {
                    this.reverb.wet.linearRampTo(0, 0.1);
                }
                break;
            case 'phaser':
                this.activeEffects.phaser = !this.activeEffects.phaser;
                if (!this.activeEffects.phaser) {
                    this.phaser.wet.linearRampTo(0, 0.1);
                }
                break;
        }

        console.log(`${this.activeEffects[effectName] ? '✅' : '⏹️'} ${effectName.toUpperCase()}`);
    }

    /**
     * Reset all effects to neutral/off
     */
    resetAllEffects() {
        this.applyFilter(0.5); // Neutral
        this.applyEcho(0);
        this.applyReverb(0);
        this.applyPhaser(0, 0);

        if (this.flanger) this.applyFlanger(0, 0);
        if (this.bitcrusher) this.applyBitcrusher(0);
        if (this.transformer) this.applyTransformer(false);

        console.log('🔄 All effects reset');
    }

    /**
     * Get active effects list
     */
    getActiveEffects() {
        return Object.keys(this.activeEffects).filter(fx => this.activeEffects[fx]);
    }

    /**
     * Sync effects to BPM
     * @param {Number} bpm - Beats per minute
     */
    syncToBPM(bpm) {
        if (!Tone.Transport) return;

        Tone.Transport.bpm.value = bpm;

        // Echo time syncs to beat divisions only if echo exists
        // Default to 1/8 note at detected BPM
        if (this.echo && this.echo.delayTime) {
            this.echo.delayTime.value = '8n';
        }

        console.log(`🎵 Effects synced to ${bpm} BPM`);
    }

    /**
     * Cleanup
     */
    dispose() {
        if (this.filter) this.filter.dispose();
        if (this.echo) this.echo.dispose();
        if (this.reverb) this.reverb.dispose();
        if (this.phaser) this.phaser.dispose();
        if (this.flanger) this.flanger.dispose();
        if (this.bitcrusher) this.bitcrusher.dispose();
        if (this.transformer) this.transformer.dispose();
        if (this.transformerLFO) this.transformerLFO.dispose();
        if (this.input) this.input.dispose();
        if (this.output) this.output.dispose();

        console.log('🎛️ FX Rack disposed');
    }
}
