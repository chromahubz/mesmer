/**
 * Dirt Sample Engine - TidalCycles Sample Library Integration
 * Plays musical samples from the Dirt-Samples collection
 */

class DirtSampleEngine {
    constructor() {
        this.samplePlayers = {};
        this.currentBanks = {
            pad: 'pad',
            lead: 'arpy',
            bass: 'bass',
            arp: 'pluck'
        };
        this.isInitialized = false;
        this.manifest = null;

        // Musical sample banks - organized by type
        this.musicalBanks = {
            pads: [
                'pad', 'psr', 'space', 'breath', 'wind', 'feel', 'gretsch',
                'jvbass', 'lighter', 'moog', 'newnotes', 'notes', 'sugar'
            ],
            leads: [
                'arpy', 'sine', 'square', 'saw', 'supersquare', 'supersaw',
                'trump', 'sax', 'monsterb', 'ul', 'popkick', 'gtr'
            ],
            bass: [
                'bass', 'bass0', 'bass1', 'bass2', 'bass3', 'bassdm', 'bassfoo',
                'db', 'dorkbot', 'jvbass', 'subroc3d', 'wobble'
            ],
            plucks: [
                'pluck', 'click', 'jazz', 'juno', 'blip', 'bottle', 'stab'
            ],
            atmospheric: [
                'space', 'cosmicg', 'crow', 'wind', 'breath', 'gretsch',
                'seawolf', 'sid', 'noise', 'outdoor'
            ],
            percussive: [
                'tabla', 'tabla2', 'tablex', 'jazz', 'jvbass', 'lighter',
                'outdoor', 'industrial', 'metal', 'uxay'
            ],
            melodic: [
                'piano', 'kalimba', 'arp', 'arpy', 'voodoo', 'sitar',
                'peri', 'print', 'realclaps'
            ],
            electronic: [
                'alphabet', 'auto', 'bin', 'cpu', 'diphone', 'diphone2',
                'em2', 'oc', 'sid', 'speakspell'
            ]
        };

        // Flatten all banks for quick access
        this.allBanks = new Set();
        Object.values(this.musicalBanks).forEach(banks => {
            banks.forEach(bank => this.allBanks.add(bank));
        });
    }

    /**
     * Initialize Dirt Sample Engine
     * @param {Tone.Volume} destination - Optional Tone.js node to connect to (for effects chain)
     */
    async init(destination = null) {
        if (typeof Tone === 'undefined') {
            console.error('❌ Tone.js not loaded!');
            return false;
        }

        this.destination = destination; // Store destination for effects routing
        console.log('🎵 Initializing Dirt Sample Engine' + (destination ? ' with effects chain routing' : ''));

        // Load manifest
        try {
            const response = await fetch('samples/dirt-manifest.json');
            this.manifest = await response.json();
            console.log('📦 Loaded manifest with', Object.keys(this.manifest).length, 'banks');
        } catch (error) {
            console.error('❌ Failed to load manifest:', error);
            return false;
        }

        // Preload essential sample banks
        await this.loadBank('pad', 'pad');
        await this.loadBank('lead', 'arpy');
        await this.loadBank('bass', 'bass');
        await this.loadBank('arp', 'pluck');

        this.isInitialized = true;
        console.log('✅ Dirt Sample Engine initialized');
        return true;
    }

    /**
     * Load a sample bank
     */
    async loadBank(synthType, bankName) {
        if (!this.manifest) {
            console.error('❌ Manifest not loaded');
            return false;
        }

        if (!this.manifest[bankName]) {
            console.warn(`⚠️ Bank ${bankName} not found in manifest`);
            return false;
        }

        console.log(`📂 Loading ${bankName} bank...`);

        try {
            const sampleFiles = this.manifest[bankName];

            if (sampleFiles.length === 0) {
                console.warn(`⚠️ No samples found in ${bankName}`);
                return false;
            }

            // Create Tone.Players for this bank
            const urls = {};
            const basePath = `samples/dirt/${bankName}/`;

            // Limit to 12 samples per bank for performance
            const maxSamples = Math.min(sampleFiles.length, 12);

            for (let i = 0; i < maxSamples; i++) {
                // URL encode filename to handle spaces and special characters (#, etc.)
                urls[i] = basePath + encodeURIComponent(sampleFiles[i]);
            }

            // Dispose old player if exists
            if (this.samplePlayers[synthType]) {
                this.samplePlayers[synthType].dispose();
            }

            // Connect to effects chain if available, otherwise to destination
            const players = new Tone.Players({
                urls: urls,
                onload: () => {
                    console.log(`✅ Loaded ${bankName} (${maxSamples} samples)` + (this.destination ? ' [routed through effects]' : ''));
                },
                onerror: (error) => {
                    console.error(`❌ Error loading ${bankName}:`, error);
                }
            });

            // Connect to effects chain or directly to destination
            if (this.destination) {
                players.connect(this.destination);
            } else {
                players.toDestination();
            }

            this.samplePlayers[synthType] = players;

            this.currentBanks[synthType] = bankName;
            return true;

        } catch (error) {
            console.error(`❌ Error loading bank ${bankName}:`, error);
            return false;
        }
    }

    /**
     * Play a sample at a specific pitch
     */
    play(synthType, note, duration = 1, velocity = 1) {
        const player = this.samplePlayers[synthType];

        if (!player) {
            console.warn(`⚠️ No player loaded for ${synthType}`);
            return;
        }

        // Get number of available samples
        const bankName = this.currentBanks[synthType];
        const sampleCount = this.manifest[bankName] ? Math.min(this.manifest[bankName].length, 12) : 12;

        // Get a random sample from the bank
        const sampleIndex = Math.floor(Math.random() * sampleCount);

        if (!player.has(sampleIndex)) {
            console.warn(`⚠️ Sample ${sampleIndex} not found in ${synthType}`);
            return;
        }

        const sample = player.player(sampleIndex);

        // Calculate playback rate based on note
        const playbackRate = this.noteToPlaybackRate(note);

        sample.playbackRate = playbackRate;
        sample.volume.value = Tone.gainToDb(velocity);
        sample.start();
    }

    /**
     * Convert note to playback rate for pitch shifting
     */
    noteToPlaybackRate(note) {
        // Base note is C3
        const baseFreq = 130.81; // C3
        const noteFreq = Tone.Frequency(note).toFrequency();
        return noteFreq / baseFreq;
    }

    /**
     * Change sample bank for a synth type
     */
    async changeBank(synthType, bankName) {
        console.log(`🎛️ Changing ${synthType} to ${bankName} bank`);

        // Dispose old player
        if (this.samplePlayers[synthType]) {
            this.samplePlayers[synthType].dispose();
        }

        await this.loadBank(synthType, bankName);
    }

    /**
     * Get available banks by category
     */
    getBanksByCategory(category) {
        return this.musicalBanks[category] || [];
    }

    /**
     * Get all categories
     */
    getCategories() {
        return Object.keys(this.musicalBanks);
    }

    /**
     * Get current bank for synth type
     */
    getCurrentBank(synthType) {
        return this.currentBanks[synthType];
    }
}
