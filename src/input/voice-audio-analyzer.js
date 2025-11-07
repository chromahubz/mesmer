/**
 * Voice Audio Analyzer
 * Analyzes microphone input for beatboxing and pitch detection
 */

class VoiceAudioAnalyzer {
    constructor() {
        this.audioContext = null;
        this.microphone = null;
        this.analyser = null;
        this.scriptProcessor = null;
        this.isListening = false;

        // Audio analysis
        this.bufferLength = 2048;
        this.dataArray = null;
        this.frequencyData = null;

        // Beatbox detection
        this.beatboxPatterns = {
            'KICK': { name: 'Kick', phonemes: ['B', 'BOOT', 'BOOM', 'DUM'], frequencies: [60, 120] },
            'SNARE': { name: 'Snare', phonemes: ['K', 'CAT', 'TSS', 'PSH'], frequencies: [200, 400] },
            'HIHAT': { name: 'HiHat', phonemes: ['T', 'TSS', 'CH', 'TS'], frequencies: [8000, 16000] },
            'CRASH': { name: 'Crash', phonemes: ['PSH', 'CRASH'], frequencies: [4000, 8000] }
        };

        // Rhythm tracking
        this.beatTimes = [];
        this.maxBeats = 32;
        this.rhythm = [];

        // Pitch detection
        this.pitchHistory = [];
        this.maxPitchHistory = 100;
        this.melody = [];

        console.log('🎤 Voice Audio Analyzer initialized');
    }

    /**
     * Initialize microphone and audio context
     */
    async init() {
        try {
            // Get microphone access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: false
                }
            });

            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.microphone = this.audioContext.createMediaStreamSource(stream);

            // Create analyser
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = this.bufferLength;
            this.analyser.smoothingTimeConstant = 0.3;

            // Create script processor for real-time analysis
            this.scriptProcessor = this.audioContext.createScriptProcessor(this.bufferLength, 1, 1);

            // Create gain node to control input level (prevent feedback)
            this.inputGain = this.audioContext.createGain();
            this.inputGain.gain.value = 0.3; // Lower gain to 30% to prevent feedback

            // Connect nodes (NO connection to destination to prevent feedback loop)
            this.microphone.connect(this.inputGain);
            this.inputGain.connect(this.analyser);
            this.analyser.connect(this.scriptProcessor);
            // DO NOT connect scriptProcessor to destination - this causes feedback!

            // Create data arrays
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);

            console.log('✅ Microphone initialized for audio analysis');
            return true;
        } catch (error) {
            console.error('Error initializing microphone:', error);
            return false;
        }
    }

    /**
     * Start analyzing audio
     */
    startAnalysis(onBeatDetected, onPitchDetected) {
        if (!this.scriptProcessor) return;

        this.isListening = true;
        let lastBeatTime = 0;

        this.scriptProcessor.onaudioprocess = () => {
            if (!this.isListening) return;

            // Get frequency data
            this.analyser.getByteFrequencyData(this.frequencyData);
            this.analyser.getByteTimeDomainData(this.dataArray);

            // Detect beats
            const beatDetected = this.detectBeat();
            if (beatDetected && onBeatDetected) {
                const now = Date.now();
                if (now - lastBeatTime > 100) { // Debounce 100ms
                    onBeatDetected(beatDetected);
                    lastBeatTime = now;
                }
            }

            // Detect pitch
            const pitch = this.detectPitch();
            if (pitch && onPitchDetected) {
                onPitchDetected(pitch);
            }
        };

        console.log('🎤 Audio analysis started');
    }

    /**
     * Stop analyzing audio
     */
    stopAnalysis() {
        this.isListening = false;
        if (this.scriptProcessor) {
            this.scriptProcessor.onaudioprocess = null;
        }
        console.log('🎤 Audio analysis stopped');
    }

    /**
     * Detect beatbox sounds from frequency analysis
     */
    detectBeat() {
        // Calculate energy in different frequency bands
        const lowEnergy = this.getEnergyInRange(0, 8);      // ~0-400Hz (kick - WIDER range)
        const midEnergy = this.getEnergyInRange(8, 24);     // ~400-1200Hz (snare)
        const highEnergy = this.getEnergyInRange(100, 250); // ~5kHz-12kHz (hihat)

        // Lower thresholds for better detection
        const lowThreshold = 140;   // LOWER for easier kick detection
        const midThreshold = 130;   // LOWER for easier snare detection
        const highThreshold = 100;  // LOWER for easier hihat detection

        // Detect which drum - prioritize kick for "BOOTS" sounds
        if (lowEnergy > lowThreshold) {
            return { type: 'KICK', energy: lowEnergy, timestamp: Date.now() };
        } else if (highEnergy > highThreshold) {
            return { type: 'HIHAT', energy: highEnergy, timestamp: Date.now() };
        } else if (midEnergy > midThreshold) {
            return { type: 'SNARE', energy: midEnergy, timestamp: Date.now() };
        }

        return null;
    }

    /**
     * Get energy in frequency range
     */
    getEnergyInRange(startBin, endBin) {
        let sum = 0;
        for (let i = startBin; i < endBin; i++) {
            sum += this.frequencyData[i];
        }
        return sum / (endBin - startBin);
    }

    /**
     * Detect pitch using autocorrelation
     */
    detectPitch() {
        const buffer = this.dataArray;
        const sampleRate = this.audioContext.sampleRate;

        // Autocorrelation
        let rms = 0;
        for (let i = 0; i < buffer.length; i++) {
            const val = (buffer[i] - 128) / 128;
            rms += val * val;
        }
        rms = Math.sqrt(rms / buffer.length);

        // Silence threshold
        if (rms < 0.01) return null;

        // Find fundamental frequency
        let maxCorrelation = 0;
        let fundamentalPeriod = -1;

        for (let period = 20; period < buffer.length / 2; period++) {
            let correlation = 0;
            for (let i = 0; i < buffer.length - period; i++) {
                const val1 = (buffer[i] - 128) / 128;
                const val2 = (buffer[i + period] - 128) / 128;
                correlation += val1 * val2;
            }

            if (correlation > maxCorrelation) {
                maxCorrelation = correlation;
                fundamentalPeriod = period;
            }
        }

        if (fundamentalPeriod > 0) {
            const frequency = sampleRate / fundamentalPeriod;

            // Only return if in vocal range (80Hz - 1000Hz)
            if (frequency >= 80 && frequency <= 1000) {
                const note = this.frequencyToNote(frequency);
                return {
                    frequency,
                    note,
                    timestamp: Date.now()
                };
            }
        }

        return null;
    }

    /**
     * Convert frequency to musical note
     */
    frequencyToNote(frequency) {
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const a4 = 440;
        const c0 = a4 * Math.pow(2, -4.75);

        if (frequency === 0) return null;

        const halfSteps = Math.round(12 * Math.log2(frequency / c0));
        const octave = Math.floor(halfSteps / 12);
        const noteIndex = halfSteps % 12;

        return {
            name: noteNames[noteIndex],
            octave: octave,
            fullName: `${noteNames[noteIndex]}${octave}`,
            frequency: frequency
        };
    }

    /**
     * Record beat pattern from beatboxing
     */
    recordBeatPattern(beat) {
        this.beatTimes.push(beat);

        if (this.beatTimes.length > this.maxBeats) {
            this.beatTimes.shift();
        }

        // Calculate rhythm pattern
        if (this.beatTimes.length >= 4) {
            this.rhythm = this.analyzeRhythm();
        }
    }

    /**
     * Analyze rhythm from beat times
     */
    analyzeRhythm() {
        const intervals = [];
        for (let i = 1; i < this.beatTimes.length; i++) {
            const interval = this.beatTimes[i].timestamp - this.beatTimes[i - 1].timestamp;
            intervals.push(interval);
        }

        // Quantize to 16th notes (assuming ~120 BPM)
        const sixteenthNote = (60000 / 120) / 4; // ~125ms
        const pattern = intervals.map(interval => {
            return Math.round(interval / sixteenthNote);
        });

        return pattern;
    }

    /**
     * Record melody from humming
     */
    recordPitch(pitch) {
        this.pitchHistory.push(pitch);

        if (this.pitchHistory.length > this.maxPitchHistory) {
            this.pitchHistory.shift();
        }

        // Extract melody when we have enough data
        if (this.pitchHistory.length >= 10) {
            this.melody = this.extractMelody();
        }
    }

    /**
     * Extract melody from pitch history
     */
    extractMelody() {
        // Smooth pitch data
        const smoothed = [];
        const windowSize = 5;

        for (let i = 0; i < this.pitchHistory.length - windowSize; i++) {
            let sum = 0;
            for (let j = 0; j < windowSize; j++) {
                sum += this.pitchHistory[i + j].frequency;
            }
            smoothed.push({
                frequency: sum / windowSize,
                note: this.frequencyToNote(sum / windowSize)
            });
        }

        // Detect note changes
        const melody = [];
        let currentNote = null;
        let noteStart = 0;

        for (let i = 0; i < smoothed.length; i++) {
            const note = smoothed[i].note;

            if (!currentNote || note.fullName !== currentNote.fullName) {
                if (currentNote) {
                    melody.push({
                        note: currentNote.fullName,
                        duration: i - noteStart,
                        frequency: currentNote.frequency
                    });
                }
                currentNote = note;
                noteStart = i;
            }
        }

        return melody;
    }

    /**
     * Convert beat pattern to MIDI-style drum pattern
     */
    convertToMIDIPattern() {
        if (this.beatTimes.length < 4) return null;

        // Create 16-step pattern
        const pattern = {
            kick: Array(16).fill(0),
            snare: Array(16).fill(0),
            hihat: Array(16).fill(0)
        };

        // Map beats to steps
        this.beatTimes.forEach((beat, index) => {
            const step = Math.floor((index / this.beatTimes.length) * 16);

            if (beat.type === 'KICK') {
                pattern.kick[step] = 1;
            } else if (beat.type === 'SNARE') {
                pattern.snare[step] = 1;
            } else if (beat.type === 'HIHAT') {
                pattern.hihat[step] = 1;
            }
        });

        return pattern;
    }

    /**
     * Convert melody to MIDI notes
     */
    convertToMIDINotes() {
        if (!this.melody || this.melody.length === 0) return null;

        return this.melody.map(note => ({
            note: note.note,
            duration: note.duration * 0.1, // Convert to seconds
            frequency: note.frequency
        }));
    }

    /**
     * Get current beat pattern
     */
    getBeatPattern() {
        return this.convertToMIDIPattern();
    }

    /**
     * Get current melody
     */
    getMelody() {
        return this.convertToMIDINotes();
    }

    /**
     * Clear recorded data
     */
    clear() {
        this.beatTimes = [];
        this.rhythm = [];
        this.pitchHistory = [];
        this.melody = [];
    }

    /**
     * Cleanup
     */
    dispose() {
        this.stopAnalysis();

        if (this.microphone) {
            this.microphone.disconnect();
        }

        if (this.inputGain) {
            this.inputGain.disconnect();
        }

        if (this.analyser) {
            this.analyser.disconnect();
        }

        if (this.scriptProcessor) {
            this.scriptProcessor.disconnect();
        }

        if (this.audioContext) {
            this.audioContext.close();
        }

        console.log('🎤 Voice Audio Analyzer disposed');
    }
}
