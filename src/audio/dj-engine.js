/**
 * DJ Engine - Core DJ Playback System
 * Supports single deck (casual) and dual deck (pro) modes
 * Professional quality audio routing and playback
 */

class DJEngine {
    constructor() {
        this.isInitialized = false;
        this.mode = 'casual'; // 'casual' or 'pro'

        // Deck state
        this.activeDeck = 'A';
        this.deckA = null;
        this.deckB = null;

        // Playback state
        this.isPlaying = false;
        this.currentPosition = 0;
        this.trackDuration = 0;

        // Track metadata
        this.trackInfo = {
            deckA: { name: '', bpm: 0, duration: 0, waveform: null },
            deckB: { name: '', bpm: 0, duration: 0, waveform: null }
        };

        // Crossfader (pro mode)
        this.crossfaderPosition = 0.5; // 0 = 100% Deck A, 1 = 100% Deck B

        // Cue points (up to 8 per deck)
        this.cuePoints = {
            deckA: {},
            deckB: {}
        };

        // Loop state
        this.loop = {
            enabled: false,
            start: 0,
            end: 0,
            bars: 4
        };

        // Output routing
        this.masterGain = null;
        this.limiter = null;

        console.log('🎧 DJ Engine initialized');
    }

    /**
     * Initialize DJ Engine
     */
    async init() {
        if (!window.Tone) {
            console.error('❌ Tone.js not loaded');
            return false;
        }

        try {
            console.log('🎧 Initializing DJ Engine...');

            // Create master output chain
            this.masterGain = new Tone.Gain(0.8);
            this.limiter = new Tone.Limiter(-3); // Safety limiter at -3dB

            // Connect master chain: masterGain → limiter → destination
            this.masterGain.connect(this.limiter);
            this.limiter.toDestination();

            this.isInitialized = true;
            console.log('✅ DJ Engine ready');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize DJ Engine:', error);
            return false;
        }
    }

    /**
     * Load track to deck
     * @param {File} file - Audio file (MP3/WAV/OGG)
     * @param {String} deck - 'A' or 'B' (defaults to active deck)
     */
    async loadTrack(file, deck = null) {
        const targetDeck = deck || this.activeDeck;

        console.log(`🎵 Loading track to Deck ${targetDeck}:`, file.name);

        try {
            // Create FileReader to load audio
            const arrayBuffer = await file.arrayBuffer();

            // Decode audio data
            const audioBuffer = await Tone.context.decodeAudioData(arrayBuffer);

            // Dispose old player if exists
            if (targetDeck === 'A' && this.deckA) {
                this.deckA.dispose();
            } else if (targetDeck === 'B' && this.deckB) {
                this.deckB.dispose();
            }

            // Create new Tone.Player
            const player = new Tone.Player({
                url: audioBuffer,
                loop: false,
                autostart: false
            });

            // Connect player to master output
            player.connect(this.masterGain);

            // Store player reference
            if (targetDeck === 'A') {
                this.deckA = player;
            } else {
                this.deckB = player;
            }

            // Extract track metadata
            const duration = audioBuffer.duration;
            const trackName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension

            // Generate waveform data for visualization
            const waveform = this.generateWaveformData(audioBuffer);

            // Store track info
            this.trackInfo[`deck${targetDeck}`] = {
                name: trackName,
                bpm: 0, // Will be detected by BPM analyzer
                duration: duration,
                waveform: waveform,
                audioBuffer: audioBuffer
            };

            this.trackDuration = duration;

            console.log(`✅ Track loaded to Deck ${targetDeck}:`, trackName);
            console.log(`   Duration: ${this.formatTime(duration)}`);

            return {
                success: true,
                deck: targetDeck,
                name: trackName,
                duration: duration
            };

        } catch (error) {
            console.error(`❌ Failed to load track to Deck ${targetDeck}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Generate waveform data for visualization
     */
    generateWaveformData(audioBuffer) {
        const samples = 1000; // Number of waveform points
        const rawData = audioBuffer.getChannelData(0); // Get mono/left channel
        const blockSize = Math.floor(rawData.length / samples);
        const waveformData = [];

        for (let i = 0; i < samples; i++) {
            let sum = 0;
            for (let j = 0; j < blockSize; j++) {
                sum += Math.abs(rawData[i * blockSize + j]);
            }
            waveformData.push(sum / blockSize);
        }

        return waveformData;
    }

    /**
     * Play active deck
     */
    play() {
        const player = this.getActivePlayer();
        if (!player) {
            console.warn('⚠️ No track loaded');
            return;
        }

        if (!this.isPlaying) {
            player.start();
            this.isPlaying = true;
            console.log('▶️ Playing');
        }
    }

    /**
     * Pause active deck
     */
    pause() {
        const player = this.getActivePlayer();
        if (!player) return;

        if (this.isPlaying) {
            player.stop();
            this.isPlaying = false;
            console.log('⏸️ Paused');
        }
    }

    /**
     * Toggle play/pause
     */
    togglePlayPause() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    /**
     * Seek to position in track
     * @param {Number} position - Position in seconds
     */
    seek(position) {
        const player = this.getActivePlayer();
        if (!player) return;

        const wasPlaying = this.isPlaying;

        if (wasPlaying) {
            player.stop();
        }

        this.currentPosition = Math.max(0, Math.min(position, this.trackDuration));
        player.seek(this.currentPosition);

        if (wasPlaying) {
            player.start('+0', this.currentPosition);
        }

        console.log(`⏩ Seek to ${this.formatTime(this.currentPosition)}`);
    }

    /**
     * Get current playback position
     */
    getCurrentPosition() {
        const player = this.getActivePlayer();
        if (!player || !this.isPlaying) {
            return this.currentPosition;
        }

        // Calculate position based on Tone.Transport time
        return this.currentPosition + (Tone.now() - player._startTime);
    }

    /**
     * Set cue point
     * @param {String} cueId - 'A', 'B', 'C', etc.
     * @param {Number} position - Position in seconds (defaults to current position)
     */
    setCuePoint(cueId, position = null) {
        const pos = position !== null ? position : this.getCurrentPosition();
        const deckKey = `deck${this.activeDeck}`;

        this.cuePoints[deckKey][cueId] = pos;
        console.log(`📍 Cue ${cueId} set at ${this.formatTime(pos)} on Deck ${this.activeDeck}`);
    }

    /**
     * Jump to cue point
     * @param {String} cueId - 'A', 'B', 'C', etc.
     */
    jumpToCue(cueId) {
        const deckKey = `deck${this.activeDeck}`;
        const cuePosition = this.cuePoints[deckKey][cueId];

        if (cuePosition !== undefined) {
            this.seek(cuePosition);
            console.log(`🎯 Jumped to Cue ${cueId}`);
        } else {
            console.warn(`⚠️ Cue ${cueId} not set`);
        }
    }

    /**
     * Set loop region
     * @param {Number} start - Loop start in seconds
     * @param {Number} end - Loop end in seconds
     */
    setLoop(start, end) {
        this.loop.start = start;
        this.loop.end = end;
        console.log(`🔁 Loop set: ${this.formatTime(start)} → ${this.formatTime(end)}`);
    }

    /**
     * Toggle loop on/off
     */
    toggleLoop() {
        this.loop.enabled = !this.loop.enabled;
        const player = this.getActivePlayer();

        if (player) {
            if (this.loop.enabled) {
                player.loop = true;
                player.loopStart = this.loop.start;
                player.loopEnd = this.loop.end;
                console.log('🔁 Loop ON');
            } else {
                player.loop = false;
                console.log('🔁 Loop OFF');
            }
        }
    }

    /**
     * Set crossfader position (pro mode)
     * @param {Number} position - 0 (100% Deck A) to 1 (100% Deck B)
     */
    setCrossfader(position) {
        if (this.mode !== 'pro') {
            console.warn('⚠️ Crossfader only available in Pro mode');
            return;
        }

        this.crossfaderPosition = Math.max(0, Math.min(1, position));

        // Apply constant power crossfade curve
        const fadeA = Math.cos(this.crossfaderPosition * Math.PI / 2);
        const fadeB = Math.sin(this.crossfaderPosition * Math.PI / 2);

        if (this.deckA) {
            this.deckA.volume.value = Tone.gainToDb(fadeA);
        }
        if (this.deckB) {
            this.deckB.volume.value = Tone.gainToDb(fadeB);
        }

        console.log(`🎚️ Crossfader: ${Math.round(this.crossfaderPosition * 100)}%`);
    }

    /**
     * Set master volume
     * @param {Number} volume - 0 to 1
     */
    setVolume(volume) {
        const vol = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.value = vol;
            console.log(`🔊 Volume: ${Math.round(vol * 100)}%`);
        }
    }

    /**
     * Get active player based on mode
     */
    getActivePlayer() {
        if (this.mode === 'casual') {
            return this.deckA; // Casual mode uses Deck A only
        } else {
            // Pro mode: return deck with higher crossfader position
            return this.crossfaderPosition < 0.5 ? this.deckA : this.deckB;
        }
    }

    /**
     * Get track info for deck
     */
    getTrackInfo(deck = null) {
        const targetDeck = deck || this.activeDeck;
        return this.trackInfo[`deck${targetDeck}`];
    }

    /**
     * Format time in MM:SS
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Switch between casual and pro mode
     */
    setMode(mode) {
        if (mode !== 'casual' && mode !== 'pro') {
            console.warn('⚠️ Invalid mode. Use "casual" or "pro"');
            return;
        }

        this.mode = mode;
        console.log(`🎧 DJ Mode: ${mode.toUpperCase()}`);

        if (mode === 'casual') {
            this.activeDeck = 'A';
            this.crossfaderPosition = 0; // Full Deck A
        }
    }

    /**
     * Cleanup
     */
    dispose() {
        if (this.deckA) this.deckA.dispose();
        if (this.deckB) this.deckB.dispose();
        if (this.masterGain) this.masterGain.dispose();
        if (this.limiter) this.limiter.dispose();

        console.log('🎧 DJ Engine disposed');
    }
}
