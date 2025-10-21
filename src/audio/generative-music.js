/**
 * Generative Music Engine
 * Creates algorithmic, evolving musical compositions using Tone.js
 */

class GenerativeMusic {
    constructor() {
        this.isPlaying = false;
        this.instruments = {};
        this.sequences = {};
        this.effects = {};
        this.currentScale = null;
        this.currentChord = null;
        this.masterVolume = null;
        this.currentGenre = 'ambient'; // ambient, techno, jazz, drone
    }

    async init() {
        console.log('Initializing generative music engine...');

        // DON'T call Tone.start() here - it requires user gesture
        // It will be called when user clicks Play button

        // Create master effects chain
        this.setupEffects();

        // Create instruments
        this.setupInstruments();

        // Initialize musical parameters
        this.setupScales();

        console.log('Generative music engine initialized');
    }

    setupEffects() {
        // Master reverb
        this.effects.reverb = new Tone.Reverb({
            decay: 4,
            wet: 0.3
        }).toDestination();

        // Master delay
        this.effects.delay = new Tone.FeedbackDelay({
            delayTime: '8n',
            feedback: 0.3,
            wet: 0.2
        }).connect(this.effects.reverb);

        // Master volume
        this.masterVolume = new Tone.Volume(-6).connect(this.effects.delay);

        console.log('Effects chain created');
    }

    setupInstruments() {
        // Pad synth (atmospheric background)
        this.instruments.pad = new Tone.PolySynth(Tone.Synth, {
            oscillator: {
                type: 'sine'
            },
            envelope: {
                attack: 2,
                decay: 1,
                sustain: 0.7,
                release: 4
            }
        }).connect(this.masterVolume);

        // Bass synth (low-end foundation)
        this.instruments.bass = new Tone.MonoSynth({
            oscillator: {
                type: 'sine'
            },
            envelope: {
                attack: 0.1,
                decay: 0.3,
                sustain: 0.4,
                release: 0.8
            },
            filterEnvelope: {
                attack: 0.05,
                decay: 0.2,
                sustain: 0.5,
                release: 0.5,
                baseFrequency: 100,
                octaves: 2
            }
        }).connect(this.masterVolume);

        // Lead synth (melodic elements)
        this.instruments.lead = new Tone.Synth({
            oscillator: {
                type: 'triangle'
            },
            envelope: {
                attack: 0.05,
                decay: 0.2,
                sustain: 0.3,
                release: 1
            }
        }).connect(this.masterVolume);

        // Arp synth (rhythmic patterns)
        this.instruments.arp = new Tone.Synth({
            oscillator: {
                type: 'square'
            },
            envelope: {
                attack: 0.01,
                decay: 0.1,
                sustain: 0.05,
                release: 0.2
            }
        }).connect(this.masterVolume);

        console.log('Instruments created');
    }

    setupScales() {
        // Musical scales for generation
        this.scales = {
            minor: [0, 2, 3, 5, 7, 8, 10], // Natural minor
            major: [0, 2, 4, 5, 7, 9, 11],
            pentatonic: [0, 2, 4, 7, 9],
            dorian: [0, 2, 3, 5, 7, 9, 10],
            phrygian: [0, 1, 3, 5, 7, 8, 10]
        };

        // Chord progressions
        this.progressions = [
            ['i', 'VI', 'III', 'VII'], // Minor
            ['i', 'iv', 'VII', 'III'],
            ['i', 'VII', 'VI', 'VII'],
            ['I', 'V', 'vi', 'IV']  // Major
        ];

        this.currentScale = this.scales.minor;
        this.rootNote = 'C3';
    }

    /**
     * Generate a note from the current scale
     */
    generateNote(octave = 3, index = null) {
        if (index === null) {
            index = Math.floor(Math.random() * this.currentScale.length);
        }

        const semitone = this.currentScale[index];
        const note = Tone.Frequency(this.rootNote).transpose(semitone).transpose((octave - 3) * 12);

        return note.toNote();
    }

    /**
     * Generate a chord
     */
    generateChord(root, octave = 3) {
        const notes = [
            this.generateNote(octave, 0),
            this.generateNote(octave, 2),
            this.generateNote(octave, 4)
        ];

        return notes;
    }

    /**
     * Start generative music
     */
    start() {
        if (this.isPlaying) return;

        this.isPlaying = true;
        Tone.Transport.start();

        // Pad sequence (slow atmospheric chords)
        this.sequences.pad = new Tone.Sequence((time, index) => {
            const chord = this.generateChord(this.rootNote, 3);
            this.instruments.pad.triggerAttackRelease(chord, '2n', time, 0.3);
        }, [0, 1, 2, 3], '2m').start(0);

        // Bass sequence (root notes)
        this.sequences.bass = new Tone.Sequence((time, note) => {
            const bassNote = this.generateNote(2, 0);
            this.instruments.bass.triggerAttackRelease(bassNote, '4n', time, 0.6);
        }, [0, null, 1, null], '2n').start(0);

        // Lead melody (random melodic patterns)
        this.sequences.lead = new Tone.Loop((time) => {
            if (Math.random() > 0.3) {
                const note = this.generateNote(4 + Math.floor(Math.random() * 2));
                const duration = Math.random() > 0.5 ? '8n' : '16n';
                this.instruments.lead.triggerAttackRelease(note, duration, time, 0.4);
            }
        }, '8n').start(0);

        // Arpeggio pattern
        this.sequences.arp = new Tone.Pattern((time, note) => {
            if (Math.random() > 0.4) {
                const arpNote = this.generateNote(3 + Math.floor(Math.random() * 2));
                this.instruments.arp.triggerAttackRelease(arpNote, '16n', time, 0.3);
            }
        }, [0, 1, 2, 3, 4, 5, 6], 'upDown').start(0);
        this.sequences.arp.interval = '16n';

        // Evolve the music over time
        this.startEvolution();

        console.log('Music started');
    }

    /**
     * Stop music
     */
    stop() {
        if (!this.isPlaying) return;

        this.isPlaying = false;

        // Stop all sequences
        Object.values(this.sequences).forEach(seq => {
            if (seq) seq.stop();
        });

        Tone.Transport.stop();

        console.log('Music stopped');
    }

    /**
     * Evolve musical parameters over time
     */
    startEvolution() {
        // Change scale periodically
        setInterval(() => {
            if (!this.isPlaying) return;

            const scaleKeys = Object.keys(this.scales);
            const randomScale = scaleKeys[Math.floor(Math.random() * scaleKeys.length)];
            this.currentScale = this.scales[randomScale];

            console.log('Scale changed to:', randomScale);
        }, 16000); // Change every 16 seconds

        // Modulate effects
        setInterval(() => {
            if (!this.isPlaying) return;

            const newReverb = 0.2 + Math.random() * 0.3;
            this.effects.reverb.wet.rampTo(newReverb, 4);
        }, 12000);
    }

    /**
     * Set master volume
     */
    setVolume(value) {
        if (this.masterVolume) {
            // Convert 0-100 to dB (-60 to 0)
            const db = (value / 100) * 60 - 60;
            this.masterVolume.volume.rampTo(db, 0.5);
        }
    }

    /**
     * Set reverb amount
     */
    setReverb(value) {
        if (this.effects.reverb) {
            const wet = value / 100;
            this.effects.reverb.wet.rampTo(wet, 0.5);
        }
    }

    /**
     * Get the audio destination node for analysis
     */
    getDestination() {
        return Tone.Destination;
    }

    /**
     * Change musical genre/style
     */
    setGenre(genre) {
        this.currentGenre = genre;
        console.log('Genre changed to:', genre);

        // Update musical parameters based on genre
        switch(genre) {
            case 'ambient':
                this.currentScale = this.scales.minor;
                this.rootNote = 'C3';
                Tone.Transport.bpm.value = 60;
                break;

            case 'techno':
                this.currentScale = this.scales.phrygian;
                this.rootNote = 'E3';
                Tone.Transport.bpm.value = 128;
                break;

            case 'jazz':
                this.currentScale = this.scales.dorian;
                this.rootNote = 'D3';
                Tone.Transport.bpm.value = 120;
                break;

            case 'drone':
                this.currentScale = this.scales.pentatonic;
                this.rootNote = 'A2';
                Tone.Transport.bpm.value = 40;
                break;

            default:
                this.currentScale = this.scales.minor;
                this.rootNote = 'C3';
                Tone.Transport.bpm.value = 80;
        }

        // If music is playing, restart with new settings
        if (this.isPlaying) {
            this.stop();
            setTimeout(() => this.start(), 100);
        }
    }

    /**
     * Get available genres
     */
    getGenres() {
        return {
            ambient: 'Ambient (slow, atmospheric)',
            techno: 'Techno (fast, rhythmic)',
            jazz: 'Jazz (complex, improvised)',
            drone: 'Drone (minimal, meditative)'
        };
    }
}
