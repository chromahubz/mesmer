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
        this.drumsEnabled = false; // Toggle for drum machine
        this.currentDrumMachine = 'RolandTR808'; // Current drum machine
        this.currentPattern = 'basic'; // Current drum pattern
        this.drumSamples = null; // Loaded drum samples
        this.drumMachinesAvailable = [
            'AJKPercusyn',
            'AkaiLinn',
            'AkaiMPC60',
            'AkaiXR10',
            'AlesisHR16',
            'AlesisSR16',
            'BossDR110',
            'BossDR220',
            'BossDR55',
            'BossDR550',
            'BossDR660',
            'CasioRZ1',
            'CasioSK1',
            'DoepferMS404',
            'EmuDrumulator',
            'EmuSP12',
            'KorgDDM110',
            'KorgKPR77',
            'KorgKR55',
            'KorgKRZ',
            'KorgM1',
            'KorgMinipops',
            'KorgT3',
            'Linn9000',
            'LinnDrum',
            'LinnLM1',
            'LinnLM2',
            'MFB512',
            'MPC1000',
            'OberheimDMX',
            'RhythmAce',
            'RolandCompurhythm1000',
            'RolandCompurhythm78',
            'RolandCompurhythm8000',
            'RolandD110',
            'RolandD70',
            'RolandDDR30',
            'RolandJD990',
            'RolandMC303',
            'RolandMT32',
            'RolandR8',
            'RolandS50',
            'RolandSystem100',
            'RolandTR505',
            'RolandTR606',
            'RolandTR626',
            'RolandTR707',
            'RolandTR808',
            'RolandTR909',
            'SakataDPM48',
            'SequentialCircuitsDrumtracks',
            'SequentialCircuitsTom',
            'SimmonsSDS5',
            'SoundmastersR88',
            'UnivoxMicroRhythmer12',
            'ViscoSpaceDrum',
            'XdrumLM8953',
            'YamahaRM50',
            'YamahaRX21',
            'YamahaRX5',
            'YamahaRY30',
            'YamahaTG33'
        ];
        this.drumVolumes = {
            kick: 1.0,
            snare: 0.8,
            hihat: 0.6,
            openhat: 0.5,
            clap: 0.7,
            rim: 0.6,
            cowbell: 0.5,
            crash: 0.4,
            tom1: 0.7,
            tom2: 0.7,
            tom3: 0.7,
            master: 1.0
        };
        this.drumPatterns = {
            'basic': {
                name: 'Basic Rock',
                kick: [1, 0, 0, 0, 1, 0, 0, 0],
                snare: [0, 0, 1, 0, 0, 0, 1, 0],
                hihat: [1, 1, 1, 1, 1, 1, 1, 1],
                openhat: [0, 0, 0, 0, 0, 0, 1, 0],
                clap: [0, 0, 0, 0, 0, 0, 0, 0],
                rim: [0, 0, 0, 0, 0, 0, 0, 0],
                cowbell: [0, 0, 0, 0, 0, 0, 0, 0],
                crash: [1, 0, 0, 0, 0, 0, 0, 0],
                tom1: [0, 0, 0, 0, 0, 0, 0, 0],
                tom2: [0, 0, 0, 0, 0, 0, 0, 0],
                tom3: [0, 0, 0, 1, 0, 0, 0, 0]
            },
            'techno': {
                name: 'Techno 4/4',
                kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
                snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
                hihat: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
                openhat: [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
                clap: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
                rim: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                cowbell: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
                crash: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                tom1: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                tom2: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                tom3: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            },
            'breakbeat': {
                name: 'Breakbeat',
                kick: [1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0],
                snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1],
                hihat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
                openhat: [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
                clap: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                rim: [0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],
                cowbell: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                crash: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                tom1: [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
                tom2: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
                tom3: [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            },
            'hiphop': {
                name: 'Hip-Hop',
                kick: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0],
                snare: [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0],
                hihat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
                openhat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
                clap: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
                rim: [0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0],
                cowbell: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                crash: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                tom1: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                tom2: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                tom3: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            },
            'ambient': {
                name: 'Ambient',
                kick: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                snare: [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
                hihat: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0],
                openhat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
                clap: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                rim: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                cowbell: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                crash: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                tom1: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                tom2: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                tom3: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            },
            'jungle': {
                name: 'Jungle/DnB',
                kick: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0],
                snare: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0],
                hihat: [1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1],
                openhat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
                clap: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                rim: [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
                cowbell: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                crash: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                tom1: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                tom2: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                tom3: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            }
        };
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

        // Load default drum machine
        await this.loadDrumMachine(this.currentDrumMachine);

        // Initialize WAD Synth Engine
        this.wadEngine = new WadSynthEngine();
        this.wadEngine.init();

        // Initialize Dirt Sample Engine
        this.dirtEngine = new DirtSampleEngine();
        await this.dirtEngine.init();

        this.synthEngine = 'tonejs'; // 'tonejs', 'wad', or 'dirt'
        this.useWadSynths = false; // Backward compatibility

        // Load MIDI drum patterns
        await this.loadMidiPatterns();

        console.log('Generative music engine initialized');
    }

    /**
     * Load MIDI drum patterns from JSON
     */
    async loadMidiPatterns() {
        try {
            const response = await fetch('samples/midi-drum-patterns.json');
            const data = await response.json();

            this.midiPatterns = data.patterns;
            this.midiCategories = data.categories;

            console.log('✅ Loaded', Object.keys(this.midiPatterns).length, 'MIDI patterns');
            console.log('📁 Categories:', Object.keys(this.midiCategories).length);
        } catch (error) {
            console.error('❌ Failed to load MIDI patterns:', error);
            this.midiPatterns = {};
            this.midiCategories = {};
        }
    }

    setupEffects() {
        // Reverb presets
        this.reverbPresets = {
            hall: { decay: 4, wet: 0.3, preDelay: 0.01, name: 'Hall' },
            room: { decay: 1.5, wet: 0.25, preDelay: 0.005, name: 'Room' },
            plate: { decay: 2.5, wet: 0.35, preDelay: 0, name: 'Plate' },
            spring: { decay: 1, wet: 0.4, preDelay: 0.01, name: 'Spring' },
            chamber: { decay: 3, wet: 0.28, preDelay: 0.015, name: 'Chamber' },
            cathedral: { decay: 8, wet: 0.4, preDelay: 0.02, name: 'Cathedral' },
            none: { decay: 0.1, wet: 0, preDelay: 0, name: 'None' }
        };
        this.currentReverbType = 'hall';

        // Delay presets
        this.delayPresets = {
            eighth: { delayTime: '8n', feedback: 0.3, wet: 0.2, name: '1/8 Note' },
            quarter: { delayTime: '4n', feedback: 0.35, wet: 0.25, name: '1/4 Note' },
            dotted: { delayTime: '8n.', feedback: 0.4, wet: 0.22, name: 'Dotted 1/8' },
            slapback: { delayTime: '16n', feedback: 0.1, wet: 0.3, name: 'Slapback' },
            pingpong: { delayTime: '8n', feedback: 0.4, wet: 0.25, name: 'Ping-Pong' },
            tape: { delayTime: '4n', feedback: 0.5, wet: 0.3, name: 'Tape Echo' },
            long: { delayTime: '2n', feedback: 0.6, wet: 0.2, name: 'Long Delay' },
            none: { delayTime: '8n', feedback: 0, wet: 0, name: 'None' }
        };
        this.currentDelayType = 'eighth';

        // Master reverb
        const reverbConfig = this.reverbPresets[this.currentReverbType];
        this.effects.reverb = new Tone.Reverb({
            decay: reverbConfig.decay,
            wet: reverbConfig.wet,
            preDelay: reverbConfig.preDelay
        }).toDestination();

        // Master delay
        const delayConfig = this.delayPresets[this.currentDelayType];
        this.effects.delay = new Tone.FeedbackDelay({
            delayTime: delayConfig.delayTime,
            feedback: delayConfig.feedback,
            wet: delayConfig.wet
        }).connect(this.effects.reverb);

        // Separate volume controls for synth and drums
        this.synthVolume = new Tone.Volume(-6).connect(this.effects.delay);
        this.drumVolume = new Tone.Volume(-6).connect(this.effects.delay);

        // Master volume (kept for backwards compatibility)
        this.masterVolume = this.synthVolume;

        console.log('Effects chain created with separate synth/drum volumes');
        console.log(`Reverb: ${reverbConfig.name}, Delay: ${delayConfig.name}`);
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

    /**
     * Load drum machine samples
     */
    async loadDrumMachine(machineName) {
        console.log(`🥁 Loading drum machine: ${machineName}...`);

        // Dispose of old drum samples if they exist
        if (this.drumSamples) {
            this.drumSamples.dispose();
        }

        const machinePrefix = machineName.toLowerCase();

        try {
            // Load sample URLs - different machines have different file naming conventions
            const drumFileMap = {
                'AJKPercusyn': { kick: 'Bassdrum.wav', snare: 'Noise.wav', hihat: 'Cowbell.wav', openhat: 'Cowbell.wav', cowbell: 'Cowbell.wav' },
                'AkaiLinn': { kick: 'Bassdrum.wav', snare: 'SD.wav', hihat: 'Closed Hat.wav', openhat: 'Open Hat.wav', clap: 'Clap.wav', cowbell: 'Cowbell.wav' },
                'AkaiMPC60': { kick: '0 Bassdrum.wav', snare: 'Snare 1.wav', hihat: 'Closed Hat.wav', openhat: 'Open Hat.wav', clap: 'Clap.wav', rim: 'Rim Gated.wav' },
                'AkaiXR10': { kick: 'Bassdrum-01.wav', snare: 'Snaredrum-01.wav', hihat: 'Hat Closed.wav', openhat: 'Hat Open.wav', clap: 'Clap.wav', cowbell: 'Cowbell.wav' },
                'AlesisHR16': { kick: 'Bassdrum.wav', snare: 'Snaredrum.wav', hihat: 'Closed Hat.wav', openhat: 'Open Hat.wav', clap: 'Clap.wav', rim: 'Rim.wav' },
                'AlesisSR16': { kick: 'Bassdrum-01.wav', snare: 'Snaredrum-01.wav', hihat: 'Hat Closed-01.wav', openhat: 'Hat Open-01.wav', clap: 'Clap.wav', cowbell: 'Cowbell.wav' },
                'BossDR110': { kick: 'Bassdrum.wav', snare: 'Snaredrum.wav', hihat: 'Hat Closed.wav', openhat: 'Hat Open.wav', clap: 'Clap.wav' },
                'BossDR220': { kick: 'Bassdrum.wav', snare: 'Snaredrum.wav', hihat: 'Hat Closed.wav', openhat: 'Hat Open.wav', clap: 'Clap.wav' },
                'BossDR55': { kick: 'Bassdrum-01.wav', snare: 'Snaredrum-01.wav', hihat: 'Hihat1.wav', openhat: 'Hihat1.wav', rim: 'Rimshot.wav' },
                'BossDR550': { kick: 'Bassdrum-01.wav', snare: 'Snaredrum-01.wav', hihat: 'Hat Closed-01.wav', openhat: 'Hat Open-01.wav', clap: 'Clap.wav', cowbell: 'Cowbell-01.wav' },
                'BossDR660': { kick: '808AcK.wav', snare: '909LtS.wav', hihat: '78CHH.wav', openhat: '78OHH.wav', clap: '808Clap.wav', cowbell: '78Cow.wav' },
                'CasioRZ1': { kick: 'Bassdrum.wav', snare: '0Snaredrum.wav', hihat: 'Hat Closed.wav', openhat: 'Hat Open.wav', clap: 'Clap.wav', cowbell: 'Cowbell.wav' },
                'CasioSK1': { kick: 'Bassdrum.wav', snare: 'Snaredrum.wav', hihat: 'Hat Closed.wav', openhat: 'Hat Open.wav' },
                'DoepferMS404': { kick: '0Bassdrum.wav', snare: 'Snaredrum.wav', hihat: 'Hat Closed.wav', openhat: 'Hat Open.wav' },
                'EmuDrumulator': { kick: 'Bassdrum.wav', snare: '0Snaredrum.wav', hihat: 'Hat Closed.wav', openhat: 'Hat Open.wav', clap: 'Clap.wav', cowbell: 'Cowbell.wav' },
                'EmuSP12': { kick: 'Bassdrum-01.wav', snare: 'Snaredrum-01.wav', hihat: 'Hat Closed-01.wav', openhat: 'Hhopen1.wav', clap: 'Clap.wav', cowbell: 'Cowbell.wav' },
                'KorgDDM110': { kick: 'Bassdrum.wav', snare: '0Snaredrum.wav', hihat: 'Hat Closed.wav', openhat: 'Hat Open.wav', clap: 'Clap.wav' },
                'KorgKPR77': { kick: 'Bassdrum.wav', snare: 'Snaredrum.wav', hihat: 'Hat Closed.wav', openhat: 'Hat Open.wav', clap: 'Clap.wav' },
                'KorgKR55': { kick: 'Bassdrum.wav', snare: '0Snaredrum.wav', hihat: 'Hat Closed.wav', openhat: 'Hat Open.wav', cowbell: 'Cowbell.wav' },
                'KorgKRZ': { kick: 'Bassdrum.wav', snare: 'Snaredrum-01.wav', hihat: 'Hat Closed.wav', openhat: 'Hat Open.wav' },
                'KorgM1': { kick: 'Bassdrum-01.wav', snare: 'Snaredrum-01.wav', hihat: 'Hat Closed-01.wav', openhat: 'Hat Open-01.wav', clap: 'Clap.wav', cowbell: 'Cowbel.wav' },
                'KorgMinipops': { kick: 'Bassdrum-01.wav', snare: 'Snaredrum-01.wav', hihat: 'Hat Closed-01.wav', openhat: 'Hat Open-01.wav' },
                'KorgT3': { kick: 'Bassdrum-01.wav', snare: 'Snaredrum-01.wav', hihat: 'Hat Closed-01.wav', openhat: 'Hat Open-01.wav', clap: 'Clap.wav' },
                'Linn9000': { kick: 'BAssdrum.wav', snare: '0Snaredrum.wav', hihat: 'Hat Closed.wav', openhat: 'Hat Open.wav', cowbell: 'Cowbell-01.wav' },
                'LinnDrum': { kick: 'Bassdrum.wav', snare: '0Snarderum-01.wav', hihat: 'Hat Closed-01.wav', openhat: 'Hat Open.wav', clap: 'Clap.wav', cowbell: 'Cowbell.wav' },
                'LinnLM1': { kick: 'LM-1_BD_1_TL.wav', snare: 'LM-1_SD_1_TL.wav', hihat: 'LM-1_HH_1_TL.wav', openhat: 'LM-1_HH_2_TL.wav', clap: 'LM-1_CLAP_1_TL.wav', cowbell: 'LM-1_COWBELL_TL.wav' },
                'LinnLM2': { kick: 'LM-2_BD_1_TL.wav', snare: 'LM-2_SD_1_TL.wav', hihat: 'LM-2_HH_1_TL.wav', openhat: 'LM-2_OPEN_HH_2_TL.wav', clap: 'LM-2_CLAP_1_TL.wav', cowbell: 'LM-2_COWBELL_1_TL.wav' },
                'MFB512': { kick: 'Bassdrum.wav', snare: 'Snaredrum.wav', hihat: 'Hat Closed.wav', openhat: 'Hat Open.wav', clap: 'Clap.wav' },
                'MPC1000': { kick: 'MPC1000_808BD_TL.wav', snare: 'MPC1000_808SD_TL.wav', hihat: 'MPC1000_808HH1_TL.wav', openhat: 'MPC1000_909OHH_TL.wav', clap: 'MPC1000_CLAP_TL.wav' },
                'OberheimDMX': { kick: 'Bassdrum-01.wav', snare: 'Snaredrum-01.wav', hihat: 'Hat Closed.wav', openhat: 'Hat Open.wav', clap: 'Clap.wav' },
                'RhythmAce': { kick: 'Bassdrum-01.wav', snare: 'Snaredrum-01.wav', hihat: 'Hat Closed.wav', openhat: 'Hat Open.wav' },
                'RolandCompurhythm1000': { kick: 'Bassdrum.wav', snare: 'Snaredrum.wav', hihat: 'Hat Closed.wav', openhat: 'Hat Open.wav', clap: 'Clap.wav', cowbell: 'Cowbell.wav' },
                'RolandCompurhythm78': { kick: 'Bassdrum.wav', snare: 'Snaredrum.wav', hihat: 'Hat Closed-01.wav', openhat: 'Hat Open-01.wav', cowbell: 'Cowbell.wav' },
                'RolandCompurhythm8000': { kick: 'Bassdrum.wav', snare: 'Snarderum.wav', hihat: 'Hat Closed.wav', openhat: 'Hat Open.wav', clap: 'Clap.wav', cowbell: 'Cowbell.wav' },
                'RolandD110': { kick: 'Bassdrum.wav', snare: 'Snaredrum-01.wav', hihat: 'Hat Closed.wav', openhat: 'Hat Open.wav', cowbell: 'Cowbell H.wav' },
                'RolandD70': { kick: 'Bassdrum-01.wav', snare: 'Snaredrum-01.wav', hihat: 'Hat Closed.wav', openhat: 'Hat Open.wav', clap: 'Clap.wav', cowbell: 'Cowbell.wav' },
                'RolandDDR30': { kick: 'Bassdrum-01.wav', snare: 'Snaredrum-01.wav', hihat: 'Bassdrum-01.wav', openhat: 'Bassdrum-01.wav' },
                'RolandJD990': { kick: 'Bryt-kck.wav', snare: '90\'s-sd.wav', hihat: 'Chh_1.wav', openhat: 'Lite-ohh.wav', clap: 'Dance-cl.wav', cowbell: 'Cowbell.wav' },
                'RolandMC303': { kick: '606bd1.wav', snare: '606sd1.wav', hihat: '606ch.wav', openhat: '707oh.wav', clap: '707clap.wav', cowbell: '78cowbel.wav' },
                'RolandMT32': { kick: 'Bassdrum.wav', snare: 'Snaredrum-01.wav', hihat: 'Hat Closed.wav', openhat: 'Hat Open-01.wav', clap: 'Clap.wav', cowbell: 'Cowbell.wav' },
                'RolandR8': { kick: 'Bassdrum-01.wav', snare: 'Snaredrum-01.wav', hihat: 'Hat Closed.wav', openhat: 'Hat Open.wav', clap: 'Clap.wav', cowbell: 'Cowbell.wav' },
                'RolandS50': { kick: 'Bassdrum-01.wav', snare: 'Snaredrum-01.wav', hihat: 'Hihat.wav', openhat: 'Hihat.wav', clap: 'Clap.wav', cowbell: 'Cowbell.wav' },
                'RolandSystem100': { kick: 'Bassdrum-01.wav', snare: 'Snaredrum-01.wav', hihat: 'Hat Closed-01.wav', openhat: 'Hat Open-01.wav' },
                'RolandTR505': { kick: 'Bassdrum.wav', snare: 'Snaredrum.wav', hihat: 'Hat Closed.wav', openhat: 'Hat Open.wav', clap: 'Clap.wav', cowbell: 'Cowbell H.wav' },
                'RolandTR606': { kick: 'Bassdrum.wav', snare: 'Snaredrum.wav', hihat: 'Hat Closed.wav', openhat: 'Hat Open.wav' },
                'RolandTR626': { kick: 'Bassdrum-01.wav', snare: 'Snaredrum-01.wav', hihat: 'Hat Closed.wav', openhat: 'Hat Open.wav', clap: 'Clap.wav', cowbell: 'Cowbell.wav' },
                'RolandTR707': { kick: 'Bassdrum-01.wav', snare: 'Snaredrum-01.wav', hihat: 'Hat Closed.wav', openhat: 'Hat Open.wav', clap: 'Clap.wav', cowbell: 'Cowbell.wav' },
                'RolandTR808': { kick: 'BD0000.WAV', snare: 'SD0000.WAV', hihat: 'CH.WAV', openhat: 'OH00.WAV', clap: 'cp0.wav', cowbell: 'CB.WAV' },
                'RolandTR909': { kick: 'Bassdrum-01.wav', snare: 'naredrum.wav', hihat: 'hh01.wav', openhat: 'Hat Open.wav', clap: 'Clap.wav', rim: 'Rimhot.wav' },
                'SakataDPM48': { kick: 'Bassdrum-01.wav', snare: 'Snaredrum-01.wav', hihat: 'Hat Closed-01.wav', openhat: 'Hat Open.wav', clap: 'Clap.wav' },
                'SequentialCircuitsDrumtracks': { kick: 'Bassdrum.wav', snare: 'Snaredrum.wav', hihat: 'Hat Closed.wav', openhat: 'Hat Open.wav', clap: 'Clap.wav', cowbell: 'Cowbell.wav' },
                'SequentialCircuitsTom': { kick: 'Bassdrum.wav', snare: 'Snaredrum.wav', hihat: 'Hat Closed.wav', openhat: 'Hat Open.wav', clap: 'Clap.wav' },
                'SimmonsSDS5': { kick: 'Bassdrum-01.wav', snare: 'Snaredrum-01.wav', hihat: 'Hat Closed-01.wav', openhat: 'Hat Open-01.wav' },
                'SoundmastersR88': { kick: 'Bassdrum.wav', snare: 'Snare-1.wav', hihat: 'Closed Hat.wav', openhat: 'Open Hat.wav' },
                'UnivoxMicroRhythmer12': { kick: 'Bassdrum.wav', snare: 'Snaredrum.wav', hihat: 'Closed Hat.wav', openhat: 'Open Hat.wav' },
                'ViscoSpaceDrum': { kick: 'Bassdrum-01.wav', snare: 'Snaredrum-01.wav', hihat: 'Hat Closed-01.wav', openhat: 'Hat Open-01.wav', cowbell: 'Cowbell.wav' },
                'XdrumLM8953': { kick: 'Bassdrum-01.wav', snare: 'Snaredrum-01.wav', hihat: 'Hat Closed.wav', openhat: 'Hat Open.wav' },
                'YamahaRM50': { kick: 'BD-001.wav', snare: 'SNAREDRUM_001.wav', hihat: 'CYMBAL_001.wav', openhat: 'CYMBAL_003.wav', clap: 'FX_059.wav', cowbell: 'FX_001.wav' },
                'YamahaRX21': { kick: 'Bassdrum.wav', snare: 'Snaredrum.wav', hihat: 'Closed Hat.wav', openhat: 'Open hat.wav', clap: 'Clap.wav' },
                'YamahaRX5': { kick: 'Bassdrum-02.wav', snare: 'Snaredrum-02.wav', hihat: 'Hat Closed.wav', openhat: 'Hat Open.wav', cowbell: 'Cowbell.wav' },
                'YamahaRY30': { kick: 'Bassdrum-01.wav', snare: 'Snare1.wav', hihat: 'Hat Closed-01.wav', openhat: 'Hat Open-01.wav', clap: 'Clap.wav', cowbell: 'Cowbell-01.wav' },
                'YamahaTG33': { kick: 'Bassdrum-01.wav', snare: 'Snaredrum-01.wav', hihat: 'Hat Open.wav', openhat: 'Hat Open.wav', clap: 'Clap.wav', cowbell: 'Cowbell H.wav' }
            };

            const files = drumFileMap[machineName];
            if (!files) {
                console.error(`❌ No drum file mapping for ${machineName}`);
                return false;
            }

            // Drum type abbreviations for folder names
            const drumTypeAbbrevs = {
                kick: 'bd',
                snare: 'sd',
                hihat: 'hh',
                openhat: 'oh',
                clap: 'cp',
                rim: 'rim',
                cowbell: 'cb',
                crash: 'cr',
                tom1: 'ht',
                tom2: 'mt',
                tom3: 'lt'
            };

            // Dynamically build drum URLs based on available samples
            const drumUrls = {};
            for (const [drumType, filename] of Object.entries(files)) {
                const abbrev = drumTypeAbbrevs[drumType] || drumType;
                drumUrls[drumType] = `samples/drums/${machineName}/${machinePrefix}-${abbrev}/${filename}`;
            }

            // Create Tone.Players for the drum samples
            this.drumSamples = new Tone.Players({
                urls: drumUrls,
                onload: () => {
                    console.log(`✓ ${machineName} samples loaded!`);
                },
                onerror: (error) => {
                    console.error(`✗ Error loading ${machineName}:`, error);
                }
            }).connect(this.drumVolume);

            this.currentDrumMachine = machineName;
            return true;
        } catch (error) {
            console.error('Failed to load drum machine:', error);
            return false;
        }
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

            if (this.synthEngine === 'wad' && this.wadEngine) {
                // Use WAD synth
                chord.forEach((note, i) => {
                    setTimeout(() => {
                        this.wadEngine.play('pad', note, 2, 0.3);
                    }, i * 50);
                });
            } else if (this.synthEngine === 'dirt' && this.dirtEngine) {
                // Use Dirt samples
                chord.forEach((note, i) => {
                    setTimeout(() => {
                        this.dirtEngine.play('pad', note, 2, 0.3);
                    }, i * 50);
                });
            } else {
                // Use Tone.js synth
                this.instruments.pad.triggerAttackRelease(chord, '2n', time, 0.3);
            }
        }, [0, 1, 2, 3], '2m').start(0);

        // Bass sequence (root notes)
        this.sequences.bass = new Tone.Sequence((time, note) => {
            const bassNote = this.generateNote(2, 0);

            if (this.synthEngine === 'wad' && this.wadEngine) {
                // Use WAD synth
                this.wadEngine.play('bass', bassNote, 0.25, 0.6);
            } else if (this.synthEngine === 'dirt' && this.dirtEngine) {
                // Use Dirt samples
                this.dirtEngine.play('bass', bassNote, 0.25, 0.6);
            } else {
                // Use Tone.js synth
                this.instruments.bass.triggerAttackRelease(bassNote, '4n', time, 0.6);
            }
        }, [0, null, 1, null], '2n').start(0);

        // Lead melody (random melodic patterns)
        this.sequences.lead = new Tone.Loop((time) => {
            if (Math.random() > 0.3) {
                const note = this.generateNote(4 + Math.floor(Math.random() * 2));
                const duration = Math.random() > 0.5 ? 0.125 : 0.0625; // 8n or 16n in seconds

                if (this.synthEngine === 'wad' && this.wadEngine) {
                    // Use WAD synth
                    this.wadEngine.play('lead', note, duration, 0.4);
                } else if (this.synthEngine === 'dirt' && this.dirtEngine) {
                    // Use Dirt samples
                    this.dirtEngine.play('lead', note, duration, 0.4);
                } else {
                    // Use Tone.js synth
                    const toneDuration = Math.random() > 0.5 ? '8n' : '16n';
                    this.instruments.lead.triggerAttackRelease(note, toneDuration, time, 0.4);
                }
            }
        }, '8n').start(0);

        // Arpeggio pattern
        this.sequences.arp = new Tone.Pattern((time, note) => {
            if (Math.random() > 0.4) {
                const arpNote = this.generateNote(3 + Math.floor(Math.random() * 2));

                if (this.synthEngine === 'wad' && this.wadEngine) {
                    // Use WAD synth
                    this.wadEngine.play('arp', arpNote, 0.0625, 0.3);
                } else if (this.synthEngine === 'dirt' && this.dirtEngine) {
                    // Use Dirt samples
                    this.dirtEngine.play('arp', arpNote, 0.0625, 0.3);
                } else {
                    // Use Tone.js synth
                    this.instruments.arp.triggerAttackRelease(arpNote, '16n', time, 0.3);
                }
            }
        }, [0, 1, 2, 3, 4, 5, 6], 'upDown').start(0);
        this.sequences.arp.interval = '16n';

        // === DRUM MACHINE PATTERNS ===
        // Only play drums if enabled
        if (this.drumsEnabled) {
            this.startDrums();
        }

        // Evolve the music over time
        this.startEvolution();

        console.log('Music started' + (this.drumsEnabled ? ' (with drums)' : ''));
    }

    /**
     * Start drum patterns
     */
    startDrums() {
        if (!this.drumSamples) {
            console.warn('⚠️ Drum samples not loaded yet!');
            return;
        }

        // Get pattern - either MIDI or built-in
        let pattern;
        if (this.currentMidiPattern) {
            pattern = this.currentMidiPattern;
            console.log(`🥁 Starting MIDI drum pattern`);
        } else {
            pattern = this.drumPatterns[this.currentPattern];
            console.log(`🥁 Starting drum pattern: ${pattern.name}`);
        }

        // Kick drum pattern
        this.sequences.kick = new Tone.Sequence((time, step) => {
            if (step === 1 && this.drumSamples.has('kick')) {
                const player = this.drumSamples.player('kick');
                player.volume.value = Tone.gainToDb(this.drumVolumes.kick * this.drumVolumes.master);
                player.start(time);
            }
        }, pattern.kick, '16n').start(0);

        // Snare drum pattern
        this.sequences.snare = new Tone.Sequence((time, step) => {
            if (step === 1 && this.drumSamples.has('snare')) {
                const player = this.drumSamples.player('snare');
                player.volume.value = Tone.gainToDb(this.drumVolumes.snare * this.drumVolumes.master);
                player.start(time);
            }
        }, pattern.snare, '16n').start(0);

        // Hi-hat pattern
        this.sequences.hihat = new Tone.Sequence((time, step) => {
            if (step === 1 && this.drumSamples.has('hihat')) {
                const player = this.drumSamples.player('hihat');
                player.volume.value = Tone.gainToDb(this.drumVolumes.hihat * this.drumVolumes.master);
                player.start(time);
            }
        }, pattern.hihat, '16n').start(0);

        // Open hi-hat pattern
        this.sequences.openhat = new Tone.Sequence((time, step) => {
            if (step === 1 && this.drumSamples.has('openhat')) {
                const player = this.drumSamples.player('openhat');
                player.volume.value = Tone.gainToDb(this.drumVolumes.openhat * this.drumVolumes.master);
                player.start(time);
            }
        }, pattern.openhat, '16n').start(0);
    }

    /**
     * Stop drum patterns
     */
    stopDrums() {
        console.log('🥁 Stopping drum machine...');
        const drumSequences = ['kick', 'snare', 'hihat', 'openhat'];
        drumSequences.forEach(drum => {
            if (this.sequences[drum]) {
                this.sequences[drum].stop();
                this.sequences[drum] = null;
            }
        });
    }

    /**
     * Change drum machine
     */
    async changeDrumMachine(machineName) {
        const wasPlaying = this.isPlaying && this.drumsEnabled;

        // Stop drums if playing
        if (wasPlaying) {
            this.stopDrums();
        }

        // Load new drum machine
        await this.loadDrumMachine(machineName);

        // Restart drums if they were playing
        if (wasPlaying) {
            // Wait a bit for samples to load
            setTimeout(() => {
                this.startDrums();
            }, 100);
        }
    }

    /**
     * Change drum pattern
     */
    changeDrumPattern(patternName) {
        if (!this.drumPatterns[patternName]) {
            console.error(`Pattern "${patternName}" not found!`);
            return;
        }

        this.currentPattern = patternName;
        console.log(`🥁 Pattern changed to: ${this.drumPatterns[patternName].name}`);

        // If drums are currently playing, restart with new pattern
        if (this.isPlaying && this.drumsEnabled) {
            this.stopDrums();
            setTimeout(() => {
                this.startDrums();
            }, 10);
        }
    }

    /**
     * Get available drum machines
     */
    getDrumMachines() {
        return this.drumMachinesAvailable.map(name => ({
            value: name,
            label: name.replace(/([A-Z])/g, ' $1').trim()
        }));
    }

    /**
     * Get available drum patterns
     */
    getDrumPatterns() {
        const builtInPatterns = Object.keys(this.drumPatterns).map(key => ({
            value: key,
            label: this.drumPatterns[key].name,
            category: 'Built-in',
            type: 'builtin'
        }));

        const midiPatterns = [];
        if (this.midiPatterns && this.midiCategories) {
            for (const [category, patternNames] of Object.entries(this.midiCategories)) {
                for (const patternName of patternNames) {
                    midiPatterns.push({
                        value: 'midi:' + patternName,
                        label: patternName.replace(/([A-Z])/g, ' $1').trim(),
                        category: category,
                        type: 'midi'
                    });
                }
            }
        }

        return [...builtInPatterns, ...midiPatterns];
    }

    /**
     * Get MIDI pattern categories
     */
    getMidiCategories() {
        return this.midiCategories || {};
    }

    /**
     * Change drum pattern (supports both built-in and MIDI patterns)
     */
    changeDrumPattern(patternKey) {
        if (patternKey.startsWith('midi:')) {
            // Load MIDI pattern
            const midiPatternName = patternKey.replace('midi:', '');
            const pattern = this.midiPatterns[midiPatternName];

            if (pattern) {
                this.currentDrumPattern = patternKey;
                this.currentMidiPattern = pattern;
                console.log('Loaded MIDI pattern:', midiPatternName);
            } else {
                console.warn('MIDI pattern not found:', midiPatternName);
            }
        } else {
            // Use built-in pattern
            if (this.drumPatterns[patternKey]) {
                this.currentDrumPattern = patternKey;
                this.currentMidiPattern = null;
                console.log('Loaded built-in pattern:', patternKey);
            }
        }
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
     * Set master volume (now controls synth volume)
     */
    setVolume(value) {
        if (this.synthVolume) {
            // Convert 0-100 to dB (-60 to 0)
            const db = (value / 100) * 60 - 60;
            this.synthVolume.volume.rampTo(db, 0.5);
        }
    }

    /**
     * Set drum master volume
     */
    setDrumMasterVolume(value) {
        if (this.drumVolume) {
            // Convert 0-100 to dB (-60 to 0)
            const db = (value / 100) * 60 - 60;
            this.drumVolume.volume.rampTo(db, 0.5);
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
     * Set delay amount
     */
    setDelay(value) {
        if (this.effects.delay) {
            const wet = value / 100;
            this.effects.delay.wet.rampTo(wet, 0.5);
        }
    }

    /**
     * Set BPM (tempo)
     */
    setBPM(value) {
        Tone.Transport.bpm.rampTo(value, 2);
        console.log('BPM changed to:', value);
    }

    /**
     * Set musical scale
     */
    setScale(scaleName) {
        if (this.scales[scaleName]) {
            this.currentScale = this.scales[scaleName];
            console.log('Scale changed to:', scaleName);
        }
    }

    /**
     * Set root note/key
     */
    setKey(key) {
        this.rootNote = key;
        console.log('Key (root note) changed to:', key);
    }

    /**
     * Get available scales
     */
    getScales() {
        return Object.keys(this.scales);
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

        // Update musical parameters based on genre (BPM stays at user-selected value)
        switch(genre) {
            case 'ambient':
                this.currentScale = this.scales.minor;
                this.rootNote = 'C3';
                break;
            case 'techno':
                this.currentScale = this.scales.phrygian;
                this.rootNote = 'E3';
                break;
            case 'house':
                this.currentScale = this.scales.major;
                this.rootNote = 'G3';
                break;
            case 'trance':
                this.currentScale = this.scales.minor;
                this.rootNote = 'A3';
                break;
            case 'dnb':
                this.currentScale = this.scales.minor;
                this.rootNote = 'D3';
                break;
            case 'dubstep':
                this.currentScale = this.scales.phrygian;
                this.rootNote = 'F#2';
                break;
            case 'jazz':
                this.currentScale = this.scales.dorian;
                this.rootNote = 'D3';
                break;
            case 'funk':
                this.currentScale = this.scales.dorian;
                this.rootNote = 'E3';
                break;
            case 'soul':
                this.currentScale = this.scales.minor;
                this.rootNote = 'C3';
                break;
            case 'hiphop':
                this.currentScale = this.scales.minor;
                this.rootNote = 'A2';
                break;
            case 'trap':
                this.currentScale = this.scales.minor;
                this.rootNote = 'F#2';
                break;
            case 'lofi':
                this.currentScale = this.scales.pentatonic;
                this.rootNote = 'F3';
                break;
            case 'chillwave':
                this.currentScale = this.scales.major;
                this.rootNote = 'D3';
                break;
            case 'vaporwave':
                this.currentScale = this.scales.major;
                this.rootNote = 'F3';
                break;
            case 'synthwave':
                this.currentScale = this.scales.minor;
                this.rootNote = 'E3';
                break;
            case 'industrial':
                this.currentScale = this.scales.phrygian;
                this.rootNote = 'C3';
                break;
            case 'drone':
                this.currentScale = this.scales.pentatonic;
                this.rootNote = 'A2';
                break;
            case 'psychedelic':
                this.currentScale = this.scales.minor;
                this.rootNote = 'B2';
                break;
            case 'experimental':
                this.currentScale = this.scales.phrygian;
                this.rootNote = 'G#2';
                break;
            case 'minimal':
                this.currentScale = this.scales.pentatonic;
                this.rootNote = 'C3';
                break;
            case 'idm':
                this.currentScale = this.scales.dorian;
                this.rootNote = 'F#3';
                break;
            case 'breakbeat':
                this.currentScale = this.scales.minor;
                this.rootNote = 'E3';
                break;
            case 'jungle':
                this.currentScale = this.scales.pentatonic;
                this.rootNote = 'D3';
                break;
            case 'downtempo':
                this.currentScale = this.scales.minor;
                this.rootNote = 'G3';
                break;
            case 'chillout':
                this.currentScale = this.scales.major;
                this.rootNote = 'C3';
                break;
            case 'trip':
                this.currentScale = this.scales.minor;
                this.rootNote = 'E2';
                break;
            case 'garage':
                this.currentScale = this.scales.minor;
                this.rootNote = 'G3';
                break;
            case 'bassline':
                this.currentScale = this.scales.minor;
                this.rootNote = 'F2';
                break;
            case 'grime':
                this.currentScale = this.scales.phrygian;
                this.rootNote = 'E2';
                break;
            case 'footwork':
                this.currentScale = this.scales.minor;
                this.rootNote = 'C3';
                break;
            default:
                this.currentScale = this.scales.minor;
                this.rootNote = 'C3';
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
            ambient: 'Ambient',
            techno: 'Techno',
            house: 'House',
            trance: 'Trance',
            dnb: 'Drum & Bass',
            dubstep: 'Dubstep',
            jazz: 'Jazz',
            funk: 'Funk',
            soul: 'Soul',
            hiphop: 'Hip-Hop',
            trap: 'Trap',
            lofi: 'Lo-Fi Hip-Hop',
            chillwave: 'Chillwave',
            vaporwave: 'Vaporwave',
            synthwave: 'Synthwave',
            industrial: 'Industrial',
            drone: 'Drone',
            psychedelic: 'Psychedelic',
            experimental: 'Experimental',
            minimal: 'Minimal',
            idm: 'IDM',
            breakbeat: 'Breakbeat',
            jungle: 'Jungle',
            downtempo: 'Downtempo',
            chillout: 'Chillout',
            triphop: 'Trip-Hop',
            garage: 'UK Garage',
            bassline: 'Bassline',
            grime: 'Grime',
            footwork: 'Footwork/Juke'
        };
    }

    /**
     * Toggle drum machine on/off
     */
    setDrums(enabled) {
        this.drumsEnabled = enabled;
        console.log('🥁 Drums', enabled ? 'enabled' : 'disabled');

        if (this.isPlaying) {
            if (enabled) {
                // Start drums if music is playing
                this.startDrums();
            } else {
                // Stop drums if music is playing
                this.stopDrums();
            }
        }
    }

    /**
     * Set individual drum volume
     */
    setDrumVolume(channel, volume) {
        if (this.drumVolumes[channel] !== undefined) {
            this.drumVolumes[channel] = volume;
            console.log(`🔊 ${channel} volume: ${(volume * 100).toFixed(0)}%`);
        }
    }

    /**
     * Update drum pattern step
     */
    updatePatternStep(drumType, stepIndex, value) {
        if (this.drumPatterns[this.currentPattern] && this.drumPatterns[this.currentPattern][drumType]) {
            this.drumPatterns[this.currentPattern][drumType][stepIndex] = value ? 1 : 0;
            console.log(`🎛️ Pattern updated: ${drumType} step ${stepIndex} = ${value}`);

            // Restart drums if playing
            if (this.isPlaying && this.drumsEnabled) {
                this.stopDrums();
                setTimeout(() => this.startDrums(), 10);
            }
        }
    }

    /**
     * Get current pattern data
     */
    getCurrentPattern() {
        return this.drumPatterns[this.currentPattern];
    }

    /**
     * WAD Synth Methods
     */

    /**
     * Set synth engine (tonejs, wad, or dirt)
     */
    setSynthEngine(engineType) {
        this.synthEngine = engineType;
        console.log('Switched to ' + engineType + ' synths');

        // If music is playing, restart with new engine
        if (this.isPlaying) {
            this.stop();
            setTimeout(() => this.play(), 100);
        }
    }

    /**
     * Toggle between Tone.js and WAD synths (backward compatibility)
     */
    toggleSynthEngine(useWad = true) {
        this.setSynthEngine(useWad ? 'wad' : 'tonejs');
    }

    /**
     * Change WAD synth preset
     */
    changeWadPreset(synthType, presetName) {
        if (!this.wadEngine) {
            console.warn('WAD engine not initialized');
            return;
        }

        if (!this.wadEngine.presets[presetName]) {
            console.warn('Preset ' + presetName + ' not found');
            return;
        }

        console.log('Changing ' + synthType + ' to ' + presetName);
        this.wadEngine.changePreset(synthType, presetName);
    }

    /**
     * Change Dirt sample bank
     */
    changeDirtBank(synthType, bankName) {
        if (!this.dirtEngine) {
            console.warn('Dirt engine not initialized');
            return;
        }

        console.log('Changing ' + synthType + ' to ' + bankName + ' bank');
        this.dirtEngine.changeBank(synthType, bankName);
    }

    /**
     * Get all WAD presets
     */
    getWadPresets() {
        return this.wadEngine ? this.wadEngine.getAllPresets() : [];
    }

    /**
     * Get WAD presets by category
     */
    getWadPresetsByCategory(category) {
        return this.wadEngine ? this.wadEngine.getPresetsByCategory(category) : [];
    }

    /**
     * Get current synth engine
     */
    getCurrentEngine() {
        return this.synthEngine;
    }

    /**
     * Change reverb type
     */
    setReverbType(type) {
        if (!this.reverbPresets[type]) {
            console.warn('Unknown reverb type:', type);
            return;
        }

        this.currentReverbType = type;
        const config = this.reverbPresets[type];

        // Update reverb parameters
        this.effects.reverb.decay = config.decay;
        this.effects.reverb.wet.value = config.wet;
        this.effects.reverb.preDelay = config.preDelay;

        console.log(`🎚️ Reverb changed to: ${config.name}`);
    }

    /**
     * Change delay type
     */
    setDelayType(type) {
        if (!this.delayPresets[type]) {
            console.warn('Unknown delay type:', type);
            return;
        }

        this.currentDelayType = type;
        const config = this.delayPresets[type];

        // Update delay parameters
        this.effects.delay.delayTime.value = config.delayTime;
        this.effects.delay.feedback.value = config.feedback;
        this.effects.delay.wet.value = config.wet;

        console.log(`🎚️ Delay changed to: ${config.name}`);
    }

    /**
     * Get available reverb types
     */
    getReverbTypes() {
        return Object.keys(this.reverbPresets).map(key => ({
            value: key,
            label: this.reverbPresets[key].name
        }));
    }

    /**
     * Get available delay types
     */
    getDelayTypes() {
        return Object.keys(this.delayPresets).map(key => ({
            value: key,
            label: this.delayPresets[key].name
        }));
    }
}
