/**
 * Vocal Effects Chain
 * Complete voice processing system with auto-tune, distortion, chorus, compression, reverb, delay
 * Designed for real-time vocal performance and recording
 */

class VocalEffectsChain {
    constructor() {
        this.isInitialized = false;

        // Microphone input
        this.mic = null;

        // Effects (in signal order)
        this.inputGain = null;
        this.compressor = null;
        this.autoTune = null;
        this.distortion = null;
        this.chorus = null;
        this.delay = null;
        this.reverb = null;
        this.outputGain = null;

        // Effect states
        this.autoTuneEnabled = false;
        this.autoTuneStrength = 0.8; // 0.0-1.0
        this.distortionEnabled = false;
        this.chorusEnabled = false;
        this.compressionEnabled = true; // Usually ON for vocals

        // Auto-tune settings
        this.currentScale = ['C', 'D', 'E', 'F', 'G', 'A', 'B']; // Major scale
        this.rootNote = 'C';
        this.scaleType = 'major';
        this.lastDetectedPitch = 0;

        // Recording
        this.isRecording = false;
        this.recorder = null;
        this.recordedChunks = [];

        // Presets
        this.currentPreset = 'clean';
        this.presets = {
            clean: {
                description: 'Natural vocal sound',
                autoTune: false,
                autoTuneStrength: 0,
                distortion: false,
                distortionAmount: 0,
                chorus: false,
                chorusDepth: 0.7,
                compression: true,
                compressionThreshold: -24,
                reverb: 20,
                delay: 10
            },
            robotic: {
                description: 'Hard auto-tune T-Pain effect',
                autoTune: true,
                autoTuneStrength: 1.0,
                distortion: false,
                distortionAmount: 0,
                chorus: false,
                chorusDepth: 0,
                compression: true,
                compressionThreshold: -30,
                reverb: 15,
                delay: 5
            },
            ethereal: {
                description: 'Dreamy atmospheric vocal',
                autoTune: true,
                autoTuneStrength: 0.6,
                distortion: false,
                distortionAmount: 0,
                chorus: true,
                chorusDepth: 0.8,
                compression: true,
                compressionThreshold: -20,
                reverb: 60,
                delay: 40
            },
            underwater: {
                description: 'Submerged muffled sound',
                autoTune: false,
                autoTuneStrength: 0,
                distortion: true,
                distortionAmount: 0.3,
                chorus: true,
                chorusDepth: 0.9,
                compression: true,
                compressionThreshold: -18,
                reverb: 45,
                delay: 30
            },
            radio: {
                description: 'Lo-fi radio transmission',
                autoTune: false,
                autoTuneStrength: 0,
                distortion: true,
                distortionAmount: 0.6,
                chorus: false,
                chorusDepth: 0,
                compression: true,
                compressionThreshold: -12,
                reverb: 10,
                delay: 5
            },
            warm: {
                description: 'Warm analog vocal',
                autoTune: false,
                autoTuneStrength: 0,
                distortion: true,
                distortionAmount: 0.2,
                chorus: true,
                chorusDepth: 0.5,
                compression: true,
                compressionThreshold: -18,
                reverb: 25,
                delay: 15
            }
        };

        console.log('🎤 Vocal Effects Chain initialized');
    }

    /**
     * Initialize all effects and microphone
     */
    async init() {
        try {
            console.log('🎤 Initializing vocal effects chain...');

            if (!window.Tone) {
                throw new Error('Tone.js not loaded');
            }

            // Create microphone input
            this.mic = new Tone.UserMedia();

            // Input gain (pre-effects)
            this.inputGain = new Tone.Gain(1.0).toDestination();

            // Compressor (first in chain for dynamics control)
            this.compressor = new Tone.Compressor({
                threshold: -24,
                ratio: 4,
                attack: 0.003,
                release: 0.25
            });

            // Auto-tune (Pitch correction)
            this.autoTune = new Tone.PitchShift({
                pitch: 0, // semitones
                windowSize: 0.1, // 100ms analysis window
                delayTime: 0,
                feedback: 0
            });

            // Distortion (warmth/grit)
            this.distortion = new Tone.Distortion({
                distortion: 0.4,
                oversample: '4x'
            });

            // Chorus (width/shimmer)
            this.chorus = new Tone.Chorus({
                frequency: 1.5,
                delayTime: 3.5,
                depth: 0.7,
                type: 'sine',
                spread: 180
            }).start();

            // Delay (echo)
            this.delay = new Tone.FeedbackDelay({
                delayTime: '8n',
                feedback: 0.3,
                wet: 0.1
            });

            // Reverb (space)
            this.reverb = new Tone.Reverb({
                decay: 2.5,
                preDelay: 0.01,
                wet: 0.2
            });

            // Output gain (master vocal volume)
            this.outputGain = new Tone.Gain(0.8).toDestination();

            // Build signal chain
            // mic → inputGain → compressor → autoTune → distortion → chorus → delay → reverb → outputGain → destination
            this.mic.connect(this.inputGain);
            this.inputGain.connect(this.compressor);
            this.compressor.connect(this.autoTune);
            this.autoTune.connect(this.distortion);
            this.distortion.connect(this.chorus);
            this.chorus.connect(this.delay);
            this.delay.connect(this.reverb);
            this.reverb.connect(this.outputGain);

            // Initially bypass non-essential effects
            this.setAutoTuneEnabled(false);
            this.setDistortionEnabled(false);
            this.setChorusEnabled(false);

            this.isInitialized = true;
            console.log('✅ Vocal effects chain initialized');
            console.log('   - Input Gain → Compressor → Auto-Tune → Distortion → Chorus → Delay → Reverb → Output');

            return true;
        } catch (error) {
            console.error('❌ Failed to initialize vocal effects:', error);
            return false;
        }
    }

    /**
     * Open microphone and start processing
     */
    async start() {
        if (!this.isInitialized) {
            console.error('❌ Vocal effects not initialized');
            return false;
        }

        try {
            console.log('🎤 Opening microphone...');
            await this.mic.open();
            console.log('✅ Microphone active');
            return true;
        } catch (error) {
            console.error('❌ Failed to open microphone:', error);
            throw error;
        }
    }

    /**
     * Stop microphone
     */
    stop() {
        if (this.mic && this.mic.state === 'started') {
            this.mic.close();
            console.log('⏹️ Microphone stopped');
        }
    }

    /**
     * Enable/disable auto-tune
     */
    setAutoTuneEnabled(enabled) {
        this.autoTuneEnabled = enabled;

        if (enabled) {
            // Connect auto-tune into chain
            this.compressor.disconnect();
            this.compressor.connect(this.autoTune);
            this.autoTune.connect(this.distortion);
            console.log('✅ Auto-tune enabled');
        } else {
            // Bypass auto-tune
            this.compressor.disconnect();
            this.autoTune.disconnect();
            this.compressor.connect(this.distortion);
            console.log('⏹️ Auto-tune bypassed');
        }
    }

    /**
     * Set auto-tune strength (0.0 = subtle, 1.0 = robotic)
     */
    setAutoTuneStrength(strength) {
        this.autoTuneStrength = Math.max(0, Math.min(1, strength));
        console.log(`🎚️ Auto-tune strength: ${Math.round(this.autoTuneStrength * 100)}%`);
    }

    /**
     * Set musical scale for auto-tune
     */
    setScale(rootNote, scaleType) {
        this.rootNote = rootNote;
        this.scaleType = scaleType;

        // Generate scale notes
        const scaleIntervals = {
            major: [0, 2, 4, 5, 7, 9, 11],
            minor: [0, 2, 3, 5, 7, 8, 10],
            pentatonic: [0, 2, 4, 7, 9],
            blues: [0, 3, 5, 6, 7, 10],
            chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
        };

        const intervals = scaleIntervals[scaleType] || scaleIntervals.major;
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const rootIndex = notes.indexOf(rootNote);

        this.currentScale = intervals.map(interval => {
            return notes[(rootIndex + interval) % 12];
        });

        console.log(`🎹 Scale set: ${rootNote} ${scaleType}`, this.currentScale);
    }

    /**
     * Process pitch and apply auto-tune
     */
    applyAutoTune(detectedFreq) {
        if (!this.autoTuneEnabled || !detectedFreq) return;

        // Find closest note in scale
        const targetFreq = this.quantizeToScale(detectedFreq);

        // Calculate pitch shift in semitones
        const pitchShift = 12 * Math.log2(targetFreq / detectedFreq);

        // Apply with strength (0 = no correction, 1 = full snap)
        const correctedShift = pitchShift * this.autoTuneStrength;

        // Update pitch shifter
        this.autoTune.pitch = correctedShift;

        this.lastDetectedPitch = detectedFreq;
    }

    /**
     * Quantize frequency to nearest scale note
     */
    quantizeToScale(freq) {
        // A4 = 440 Hz reference
        const A4 = 440;

        // Convert freq to semitones from A4
        const semitonesFromA4 = 12 * Math.log2(freq / A4);

        // Round to nearest semitone
        const nearestSemitone = Math.round(semitonesFromA4);

        // Convert back to frequency
        const quantizedFreq = A4 * Math.pow(2, nearestSemitone / 12);

        return quantizedFreq;
    }

    /**
     * Enable/disable distortion
     */
    setDistortionEnabled(enabled) {
        this.distortionEnabled = enabled;
        this.distortion.wet.value = enabled ? 1 : 0;
        console.log(enabled ? '✅ Distortion enabled' : '⏹️ Distortion bypassed');
    }

    /**
     * Set distortion amount
     */
    setDistortionAmount(amount) {
        this.distortion.distortion = Math.max(0, Math.min(1, amount));
        console.log(`🎚️ Distortion: ${Math.round(amount * 100)}%`);
    }

    /**
     * Enable/disable chorus
     */
    setChorusEnabled(enabled) {
        this.chorusEnabled = enabled;
        this.chorus.wet.value = enabled ? 1 : 0;
        console.log(enabled ? '✅ Chorus enabled' : '⏹️ Chorus bypassed');
    }

    /**
     * Set chorus depth
     */
    setChorusDepth(depth) {
        this.chorus.depth = Math.max(0, Math.min(1, depth));
        console.log(`🎚️ Chorus depth: ${Math.round(depth * 100)}%`);
    }

    /**
     * Set compression
     */
    setCompressionEnabled(enabled) {
        this.compressionEnabled = enabled;
        if (!enabled) {
            this.compressor.ratio.value = 1; // No compression
        } else {
            this.compressor.ratio.value = 4; // Standard vocal compression
        }
    }

    /**
     * Set reverb mix
     */
    setReverbMix(mix) {
        this.reverb.wet.value = Math.max(0, Math.min(1, mix / 100));
        console.log(`🎚️ Reverb: ${mix}%`);
    }

    /**
     * Set delay mix
     */
    setDelayMix(mix) {
        this.delay.wet.value = Math.max(0, Math.min(1, mix / 100));
        console.log(`🎚️ Delay: ${mix}%`);
    }

    /**
     * Set input gain
     */
    setInputGain(gain) {
        this.inputGain.gain.value = gain;
        console.log(`🎚️ Input gain: ${Math.round(gain * 100)}%`);
    }

    /**
     * Set output gain
     */
    setOutputGain(gain) {
        this.outputGain.gain.value = gain;
        console.log(`🎚️ Output gain: ${Math.round(gain * 100)}%`);
    }

    /**
     * Load preset
     */
    loadPreset(presetName) {
        const preset = this.presets[presetName];
        if (!preset) {
            console.error(`❌ Preset not found: ${presetName}`);
            return;
        }

        console.log(`🎹 Loading preset: ${presetName} - ${preset.description}`);

        // Apply all settings
        this.setAutoTuneEnabled(preset.autoTune);
        this.setAutoTuneStrength(preset.autoTuneStrength);
        this.setDistortionEnabled(preset.distortion);
        this.setDistortionAmount(preset.distortionAmount);
        this.setChorusEnabled(preset.chorus);
        this.setChorusDepth(preset.chorusDepth);
        this.setCompressionEnabled(preset.compression);
        this.compressor.threshold.value = preset.compressionThreshold;
        this.setReverbMix(preset.reverb);
        this.setDelayMix(preset.delay);

        this.currentPreset = presetName;
        console.log(`✅ Preset loaded: ${presetName}`);
    }

    /**
     * Start recording
     */
    async startRecording() {
        if (this.isRecording) {
            console.warn('⚠️ Already recording');
            return;
        }

        try {
            // Create MediaRecorder from output
            const dest = Tone.Destination;
            const mediaStreamDest = Tone.context.createMediaStreamDestination();
            dest.connect(mediaStreamDest);

            this.recorder = new MediaRecorder(mediaStreamDest.stream, {
                mimeType: 'audio/webm;codecs=opus'
            });

            this.recordedChunks = [];

            this.recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    this.recordedChunks.push(e.data);
                }
            };

            this.recorder.start(100); // Collect data every 100ms
            this.isRecording = true;
            console.log('🔴 Recording started');
        } catch (error) {
            console.error('❌ Failed to start recording:', error);
        }
    }

    /**
     * Stop recording and get blob
     */
    stopRecording() {
        return new Promise((resolve) => {
            if (!this.isRecording || !this.recorder) {
                resolve(null);
                return;
            }

            this.recorder.onstop = () => {
                const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
                this.isRecording = false;
                console.log('⏹️ Recording stopped');
                resolve(blob);
            };

            this.recorder.stop();
        });
    }

    /**
     * Get microphone input level (0-1)
     */
    getInputLevel() {
        if (!this.mic || !this.mic.state === 'started') return 0;

        // Analyze input signal
        const analyser = new Tone.Analyser('waveform', 256);
        this.mic.connect(analyser);

        const waveform = analyser.getValue();
        let sum = 0;
        for (let i = 0; i < waveform.length; i++) {
            sum += Math.abs(waveform[i]);
        }

        return sum / waveform.length;
    }

    /**
     * Get list of available presets
     */
    getPresetList() {
        return Object.keys(this.presets).map(key => ({
            id: key,
            name: key.charAt(0).toUpperCase() + key.slice(1),
            description: this.presets[key].description
        }));
    }
}
