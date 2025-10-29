/**
 * WAD Synth Engine - Advanced sound bank system
 * Uses Web Audio DAW for rich synth sounds
 */

class WadSynthEngine {
    constructor() {
        this.synths = {};
        this.currentPreset = 'warmPad';
        this.isInitialized = false;

        // Sound bank presets
        this.presets = {
            // Pad Sounds
            'warmPad': {
                source: 'sine',
                volume: 0.5,
                env: {
                    attack: 0.8,
                    decay: 0.2,
                    sustain: 0.5,
                    hold: 2,
                    release: 1.5
                },
                filter: {
                    type: 'lowpass',
                    frequency: 800,
                    q: 3
                },
                vibrato: {
                    shape: 'sine',
                    magnitude: 0.5,
                    speed: 5,
                    attack: 1
                }
            },

            'spacePad': {
                source: 'triangle',
                volume: 0.4,
                env: {
                    attack: 1.2,
                    decay: 0.3,
                    sustain: 0.6,
                    hold: 2,
                    release: 2
                },
                filter: {
                    type: 'highpass',
                    frequency: 300,
                    q: 2
                },
                reverb: {
                    wet: 0.6,
                    impulse: 'lib/impulses/hall.wav'
                }
            },

            'dreamPad': {
                source: 'sawtooth',
                volume: 0.3,
                env: {
                    attack: 1.5,
                    decay: 0.4,
                    sustain: 0.7,
                    hold: 2.5,
                    release: 2.5
                },
                filter: {
                    type: 'bandpass',
                    frequency: 600,
                    q: 5
                },
                panning: {
                    location: 0,
                    type: 'stereo'
                }
            },

            // Lead Sounds
            'brightLead': {
                source: 'square',
                volume: 0.6,
                env: {
                    attack: 0.05,
                    decay: 0.2,
                    sustain: 0.4,
                    hold: 0.8,
                    release: 0.3
                },
                filter: {
                    type: 'lowpass',
                    frequency: 2000,
                    q: 5,
                    env: {
                        attack: 0.2,
                        frequency: 4000
                    }
                }
            },

            'analogLead': {
                source: 'sawtooth',
                volume: 0.5,
                env: {
                    attack: 0.03,
                    decay: 0.15,
                    sustain: 0.5,
                    hold: 0.5,
                    release: 0.4
                },
                filter: {
                    type: 'lowpass',
                    frequency: 1500,
                    q: 8
                },
                vibrato: {
                    shape: 'sine',
                    magnitude: 1,
                    speed: 7,
                    attack: 0.5
                }
            },

            // Bass Sounds
            'deepBass': {
                source: 'sine',
                volume: 0.8,
                env: {
                    attack: 0.01,
                    decay: 0.1,
                    sustain: 0.6,
                    hold: 0.5,
                    release: 0.2
                },
                filter: {
                    type: 'lowpass',
                    frequency: 200,
                    q: 2
                }
            },

            'subBass': {
                source: 'sine',
                volume: 0.9,
                env: {
                    attack: 0.005,
                    decay: 0.05,
                    sustain: 0.8,
                    hold: 0.4,
                    release: 0.15
                },
                filter: {
                    type: 'lowpass',
                    frequency: 100,
                    q: 1
                }
            },

            'acidBass': {
                source: 'sawtooth',
                volume: 0.6,
                env: {
                    attack: 0.02,
                    decay: 0.3,
                    sustain: 0.2,
                    hold: 0.3,
                    release: 0.2
                },
                filter: {
                    type: 'lowpass',
                    frequency: 400,
                    q: 15,
                    env: {
                        attack: 0.1,
                        frequency: 1200
                    }
                }
            },

            // Pluck Sounds
            'electricPiano': {
                source: 'triangle',
                volume: 0.5,
                env: {
                    attack: 0.01,
                    decay: 0.5,
                    sustain: 0.1,
                    hold: 0.2,
                    release: 0.3
                },
                filter: {
                    type: 'lowpass',
                    frequency: 3000,
                    q: 2
                }
            },

            'pluck': {
                source: 'sine',
                volume: 0.6,
                env: {
                    attack: 0.005,
                    decay: 0.2,
                    sustain: 0.05,
                    hold: 0.1,
                    release: 0.2
                },
                filter: {
                    type: 'lowpass',
                    frequency: 2500,
                    q: 3
                }
            },

            // Arp Sounds
            'digitalArp': {
                source: 'square',
                volume: 0.4,
                env: {
                    attack: 0.01,
                    decay: 0.1,
                    sustain: 0.1,
                    hold: 0.1,
                    release: 0.1
                },
                filter: {
                    type: 'bandpass',
                    frequency: 1000,
                    q: 10
                }
            },

            'classicArp': {
                source: 'sawtooth',
                volume: 0.5,
                env: {
                    attack: 0.02,
                    decay: 0.15,
                    sustain: 0.2,
                    hold: 0.15,
                    release: 0.15
                },
                filter: {
                    type: 'lowpass',
                    frequency: 1800,
                    q: 6
                }
            },

            // Ambient Sounds
            'atmosphericPad': {
                source: 'sine',
                volume: 0.3,
                env: {
                    attack: 2,
                    decay: 0.5,
                    sustain: 0.8,
                    hold: 3,
                    release: 3
                },
                filter: {
                    type: 'lowpass',
                    frequency: 600,
                    q: 2
                },
                reverb: {
                    wet: 0.8
                }
            },

            'drone': {
                source: 'triangle',
                volume: 0.25,
                env: {
                    attack: 3,
                    decay: 1,
                    sustain: 0.9,
                    hold: 4,
                    release: 4
                },
                filter: {
                    type: 'lowpass',
                    frequency: 400,
                    q: 1
                }
            },

            'ghost': {
                source: 'square',
                volume: 0.3,
                env: {
                    attack: 0.01,
                    decay: 0.002,
                    sustain: 0.5,
                    hold: 2.5,
                    release: 0.3
                },
                filter: {
                    type: 'lowpass',
                    frequency: 600,
                    q: 7,
                    env: {
                        attack: 0.7,
                        frequency: 1600
                    }
                },
                vibrato: {
                    attack: 8,
                    speed: 8,
                    magnitude: 100
                }
            },

            // Percussion Sounds
            'hiHatClosed': {
                source: 'noise',
                volume: 0.5,
                env: {
                    attack: 0.001,
                    decay: 0.008,
                    sustain: 0.2,
                    hold: 0.03,
                    release: 0.01
                },
                filter: {
                    type: 'highpass',
                    frequency: 400,
                    q: 1
                }
            },

            'hiHatOpen': {
                source: 'noise',
                volume: 0.5,
                env: {
                    attack: 0.001,
                    decay: 0.008,
                    sustain: 0.2,
                    hold: 0.43,
                    release: 0.01
                },
                filter: {
                    type: 'highpass',
                    frequency: 100,
                    q: 0.2
                }
            },

            'snare': {
                source: 'noise',
                volume: 0.6,
                env: {
                    attack: 0.001,
                    decay: 0.01,
                    sustain: 0.2,
                    hold: 0.03,
                    release: 0.02
                },
                filter: {
                    type: 'bandpass',
                    frequency: 300,
                    q: 0.180
                }
            },

            'piano': {
                source: 'square',
                volume: 0.7,
                env: {
                    attack: 0.01,
                    decay: 0.005,
                    sustain: 0.2,
                    hold: 0.015,
                    release: 0.3
                },
                filter: {
                    type: 'lowpass',
                    frequency: 1200,
                    q: 8.5,
                    env: {
                        attack: 0.2,
                        frequency: 600
                    }
                }
            }
        };

        // Preset categories for UI
        this.categories = {
            pads: ['warmPad', 'spacePad', 'dreamPad', 'atmosphericPad', 'drone', 'ghost'],
            leads: ['brightLead', 'analogLead'],
            bass: ['deepBass', 'subBass', 'acidBass'],
            plucks: ['electricPiano', 'pluck', 'piano'],
            arps: ['digitalArp', 'classicArp'],
            percussion: ['hiHatClosed', 'hiHatOpen', 'snare']
        };
    }

    /**
     * Initialize WAD synth engine
     * @param {Tone.Volume} destination - Optional Tone.js node to connect to (for effects chain)
     */
    init(destination = null) {
        if (typeof Wad === 'undefined') {
            console.error('❌ WAD library not loaded!');
            return false;
        }

        // Store destination for effects routing
        this.destination = destination;
        console.log('🎹 Initializing WAD Synth Engine' + (destination ? ' with effects chain routing' : '') + '...');

        // Create default synths
        this.createSynth('pad', this.presets.warmPad);
        this.createSynth('lead', this.presets.brightLead);
        this.createSynth('bass', this.presets.deepBass);
        this.createSynth('arp', this.presets.digitalArp);

        this.isInitialized = true;
        console.log('✅ WAD Synth Engine initialized with', Object.keys(this.presets).length, 'presets');
        return true;
    }

    /**
     * Create a new synth with preset
     */
    createSynth(name, preset) {
        try {
            // Note: WAD uses native Web Audio API and has its own effects system
            // We don't route it through Tone.js effects to avoid compatibility issues
            const config = { ...preset };

            // WAD will connect directly to audio output
            // (Attempting to connect WAD to Tone.js nodes causes AudioNode connection errors)

            this.synths[name] = new Wad(config);
            console.log(`✓ Created ${name} synth with preset`);
            return this.synths[name];
        } catch (error) {
            console.error(`❌ Error creating ${name} synth:`, error);
            return null;
        }
    }

    /**
     * Play a note on a synth
     */
    play(synthName, note, duration = 1, velocity = 1) {
        if (!this.synths[synthName]) {
            console.warn(`⚠️ Synth ${synthName} not found`);
            return;
        }

        try {
            // Apply volume scaling to match Tone.js sensitivity (WAD is louder)
            // Scale down by 40% and add minimum threshold to prevent 0 volume bug
            const scaledVolume = velocity <= 0.01 ? 0 : Math.max(0.01, velocity * 0.4);

            this.synths[synthName].play({
                pitch: note,
                volume: scaledVolume,
                wait: 0,
                env: {
                    hold: duration
                }
            });
        } catch (error) {
            console.warn(`⚠️ Error playing note on ${synthName}:`, error);
        }
    }

    /**
     * Stop a synth
     */
    stop(synthName) {
        if (this.synths[synthName]) {
            this.synths[synthName].stop();
        }
    }

    /**
     * Change synth preset
     */
    changePreset(synthName, presetName) {
        if (!this.presets[presetName]) {
            console.warn(`⚠️ Preset ${presetName} not found`);
            return;
        }

        console.log(`🎛️ Changing ${synthName} to ${presetName} preset`);

        // Stop and cleanup old synth before creating new one
        if (this.synths[synthName]) {
            try {
                // Stop any playing notes
                this.synths[synthName].stop();
            } catch (error) {
                console.warn(`⚠️ Error stopping old ${synthName} synth:`, error);
            }

            // Clear the old synth reference
            delete this.synths[synthName];
        }

        // Create new synth with new preset (synchronously)
        this.createSynth(synthName, this.presets[presetName]);
        console.log(`✓ ${synthName} preset changed to ${presetName}`);
    }

    /**
     * Get available presets by category
     */
    getPresetsByCategory(category) {
        return this.categories[category] || [];
    }

    /**
     * Get all presets
     */
    getAllPresets() {
        return Object.keys(this.presets);
    }

    /**
     * Get preset info
     */
    getPresetInfo(presetName) {
        return this.presets[presetName] || null;
    }
}
