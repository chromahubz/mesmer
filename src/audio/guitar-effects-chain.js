/**
 * Guitar Effects Chain (Pedalboard)
 * Complete guitar processing system with classic pedal effects
 * Overdrive, Distortion, Fuzz, Chorus, Delay, Reverb, Wah, Compressor, EQ
 */

class GuitarEffectsChain {
    constructor() {
        this.isInitialized = false;

        // Audio input
        this.audioInput = null;

        // Effects (in typical pedalboard order)
        this.tuner = null;
        this.compressor = null;
        this.wah = null;
        this.overdrive = null;
        this.distortion = null;
        this.fuzz = null;
        this.eq = null;
        this.chorus = null;
        this.phaser = null;
        this.delay = null;
        this.reverb = null;
        this.outputGain = null;

        // Effect states
        this.compressorEnabled = false;
        this.wahEnabled = false;
        this.overdriveEnabled = false;
        this.distortionEnabled = false;
        this.fuzzEnabled = false;
        this.eqEnabled = false;
        this.chorusEnabled = false;
        this.phaserEnabled = false;
        this.delayEnabled = true;
        this.reverbEnabled = true;

        // Tuner state
        this.tunerActive = false;
        this.detectedNote = '--';
        this.detectedFrequency = 0;
        this.pitchOffset = 0;

        // Recording
        this.isRecording = false;
        this.recorder = null;
        this.recordedChunks = [];

        // Presets
        this.currentPreset = 'clean';
        this.presets = {
            clean: {
                description: 'Clean natural guitar tone',
                compressor: true,
                compressorThreshold: -24,
                overdrive: false,
                distortion: false,
                fuzz: false,
                eq: true,
                eqBass: 0,
                eqMid: 2,
                eqTreble: 3,
                chorus: false,
                phaser: false,
                delay: 20,
                reverb: 15
            },
            blues: {
                description: 'Smooth blues overdrive',
                compressor: true,
                compressorThreshold: -20,
                overdrive: true,
                overdriveAmount: 0.3,
                distortion: false,
                fuzz: false,
                eq: true,
                eqBass: 3,
                eqMid: 0,
                eqTreble: -2,
                chorus: false,
                phaser: false,
                delay: 25,
                reverb: 30
            },
            rock: {
                description: 'Classic rock crunch',
                compressor: true,
                compressorThreshold: -18,
                overdrive: true,
                overdriveAmount: 0.5,
                distortion: true,
                distortionAmount: 0.4,
                fuzz: false,
                eq: true,
                eqBass: 2,
                eqMid: 4,
                eqTreble: 3,
                chorus: false,
                phaser: false,
                delay: 20,
                reverb: 20
            },
            metal: {
                description: 'Heavy high-gain metal',
                compressor: true,
                compressorThreshold: -30,
                overdrive: false,
                distortion: true,
                distortionAmount: 0.8,
                fuzz: false,
                eq: true,
                eqBass: 5,
                eqMid: -3,
                eqTreble: 6,
                chorus: false,
                phaser: false,
                delay: 10,
                reverb: 10
            },
            fuzz: {
                description: 'Psychedelic fuzz face',
                compressor: false,
                overdrive: false,
                distortion: false,
                fuzz: true,
                fuzzAmount: 0.7,
                eq: true,
                eqBass: 0,
                eqMid: 5,
                eqTreble: 0,
                chorus: false,
                phaser: true,
                phaserFreq: 0.5,
                delay: 30,
                reverb: 40
            },
            ambient: {
                description: 'Ethereal ambient soundscape',
                compressor: true,
                compressorThreshold: -24,
                overdrive: false,
                distortion: false,
                fuzz: false,
                eq: true,
                eqBass: -2,
                eqMid: 0,
                eqTreble: 4,
                chorus: true,
                chorusDepth: 0.8,
                phaser: false,
                delay: 60,
                delayFeedback: 0.5,
                reverb: 70
            },
            funk: {
                description: 'Funky wah and compression',
                compressor: true,
                compressorThreshold: -18,
                overdrive: false,
                distortion: false,
                fuzz: false,
                wah: true,
                wahFreq: 1000,
                eq: true,
                eqBass: 4,
                eqMid: -2,
                eqTreble: 2,
                chorus: false,
                phaser: true,
                phaserFreq: 0.8,
                delay: 15,
                reverb: 20
            }
        };

        console.log('🎸 Guitar Effects Chain initialized');
    }

    /**
     * Initialize all effects
     */
    async init() {
        try {
            console.log('🎸 Initializing guitar effects chain...');

            if (!window.Tone) {
                throw new Error('Tone.js not loaded');
            }

            // Create audio input (for external audio interface)
            this.audioInput = new Tone.UserMedia();

            // Compressor (dynamics control)
            this.compressor = new Tone.Compressor({
                threshold: -24,
                ratio: 4,
                attack: 0.003,
                release: 0.25
            });

            // Wah filter (auto-wah effect)
            this.wah = new Tone.AutoWah({
                baseFrequency: 100,
                octaves: 6,
                sensitivity: 0,
                Q: 2,
                gain: 2,
                follower: {
                    attack: 0.3,
                    release: 0.5
                }
            });

            // Overdrive (warm tube-like saturation)
            this.overdrive = new Tone.Distortion({
                distortion: 0.3,
                oversample: '4x'
            });

            // Distortion (hard clipping)
            this.distortion = new Tone.Distortion({
                distortion: 0.6,
                oversample: '4x'
            });

            // Fuzz (extreme clipping)
            this.fuzz = new Tone.Distortion({
                distortion: 0.9,
                oversample: '4x'
            });

            // 3-band EQ
            this.eqBass = new Tone.Filter({
                type: 'lowshelf',
                frequency: 250,
                gain: 0
            });
            this.eqMid = new Tone.Filter({
                type: 'peaking',
                frequency: 1000,
                Q: 1,
                gain: 0
            });
            this.eqTreble = new Tone.Filter({
                type: 'highshelf',
                frequency: 3000,
                gain: 0
            });

            // Chorus (modulation)
            this.chorus = new Tone.Chorus({
                frequency: 1.5,
                delayTime: 3.5,
                depth: 0.7,
                type: 'sine',
                spread: 180
            }).start();

            // Phaser (sweeping notch filter)
            this.phaser = new Tone.Phaser({
                frequency: 0.5,
                octaves: 3,
                stages: 10,
                Q: 10,
                baseFrequency: 350
            });

            // Delay (echo)
            this.delay = new Tone.FeedbackDelay({
                delayTime: '8n',
                feedback: 0.3,
                wet: 0.2
            });

            // Reverb (space)
            this.reverb = new Tone.Reverb({
                decay: 3.0,
                preDelay: 0.01,
                wet: 0.15
            });

            // Output gain
            this.outputGain = new Tone.Gain(0.7).toDestination();

            // Build signal chain (typical pedalboard order)
            // Input → Compressor → Wah → Overdrive → Distortion → Fuzz → EQ → Chorus → Phaser → Delay → Reverb → Output
            this.audioInput.connect(this.compressor);
            this.compressor.connect(this.wah);
            this.wah.connect(this.overdrive);
            this.overdrive.connect(this.distortion);
            this.distortion.connect(this.fuzz);
            this.fuzz.connect(this.eqBass);
            this.eqBass.connect(this.eqMid);
            this.eqMid.connect(this.eqTreble);
            this.eqTreble.connect(this.chorus);
            this.chorus.connect(this.phaser);
            this.phaser.connect(this.delay);
            this.delay.connect(this.reverb);
            this.reverb.connect(this.outputGain);

            // Create analyzer for tuner
            this.analyzer = new Tone.Analyser('waveform', 2048);
            this.audioInput.connect(this.analyzer);

            // Initially bypass most effects
            this.setCompressorEnabled(false);
            this.setWahEnabled(false);
            this.setOverdriveEnabled(false);
            this.setDistortionEnabled(false);
            this.setFuzzEnabled(false);
            this.setChorusEnabled(false);
            this.setPhaserEnabled(false);

            this.isInitialized = true;
            console.log('✅ Guitar effects chain initialized');
            console.log('   - Signal chain ready: 11 effects');

            return true;
        } catch (error) {
            console.error('❌ Failed to initialize guitar effects:', error);
            return false;
        }
    }

    /**
     * Get list of available audio input devices
     */
    async getAudioDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioInputs = devices.filter(device => device.kind === 'audioinput');

            console.log('🎤 Available audio input devices:');
            audioInputs.forEach((device, index) => {
                console.log(`   ${index + 1}. ${device.label || 'Unknown Device'} (${device.deviceId})`);
            });

            return audioInputs;
        } catch (error) {
            console.error('❌ Failed to enumerate devices:', error);
            return [];
        }
    }

    /**
     * Open audio input and start processing
     * @param {String} deviceId - Optional specific device ID (for Scarlett or other interfaces)
     */
    async start(deviceId = null) {
        if (!this.isInitialized) {
            console.error('❌ Guitar effects not initialized');
            return false;
        }

        try {
            console.log('🎸 Opening audio input...');

            // If deviceId provided, use specific device
            if (deviceId) {
                const constraints = {
                    audio: {
                        deviceId: { exact: deviceId },
                        echoCancellation: false,
                        noiseSuppression: false,
                        autoGainControl: false
                    }
                };

                // Get user media with specific device
                const stream = await navigator.mediaDevices.getUserMedia(constraints);

                // Close existing audio input if open
                if (this.audioInput.state === 'started') {
                    this.audioInput.close();
                }

                // Reconnect with new stream
                this.audioInput = new Tone.UserMedia();
                this.audioInput.connect(this.compressor);
                this.audioInput.connect(this.analyzer);

                // Open with the specific stream
                await this.audioInput.open();

                console.log(`✅ Audio input active (Device: ${deviceId})`);
            } else {
                // Use default device
                await this.audioInput.open();
                console.log('✅ Audio input active (default device)');
            }

            return true;
        } catch (error) {
            console.error('❌ Failed to open audio input:', error);
            console.error('   Make sure your Scarlett (or audio interface) is connected and selected');
            throw error;
        }
    }

    /**
     * Stop audio input
     */
    stop() {
        if (this.audioInput && this.audioInput.state === 'started') {
            this.audioInput.close();
            console.log('⏹️ Audio input stopped');
        }
    }

    // Effect enable/disable methods

    setCompressorEnabled(enabled) {
        this.compressorEnabled = enabled;
        this.compressor.wet.value = enabled ? 1 : 0;
        console.log(enabled ? '✅ Compressor ON' : '⏹️ Compressor OFF');
    }

    setWahEnabled(enabled) {
        this.wahEnabled = enabled;
        this.wah.wet.value = enabled ? 1 : 0;
        console.log(enabled ? '✅ Wah ON' : '⏹️ Wah OFF');
    }

    setOverdriveEnabled(enabled) {
        this.overdriveEnabled = enabled;
        this.overdrive.wet.value = enabled ? 1 : 0;
        console.log(enabled ? '✅ Overdrive ON' : '⏹️ Overdrive OFF');
    }

    setDistortionEnabled(enabled) {
        this.distortionEnabled = enabled;
        this.distortion.wet.value = enabled ? 1 : 0;
        console.log(enabled ? '✅ Distortion ON' : '⏹️ Distortion OFF');
    }

    setFuzzEnabled(enabled) {
        this.fuzzEnabled = enabled;
        this.fuzz.wet.value = enabled ? 1 : 0;
        console.log(enabled ? '✅ Fuzz ON' : '⏹️ Fuzz OFF');
    }

    setEQEnabled(enabled) {
        this.eqEnabled = enabled;
        const wetValue = enabled ? 1 : 0;
        this.eqBass.wet.value = wetValue;
        this.eqMid.wet.value = wetValue;
        this.eqTreble.wet.value = wetValue;
        console.log(enabled ? '✅ EQ ON' : '⏹️ EQ OFF');
    }

    setChorusEnabled(enabled) {
        this.chorusEnabled = enabled;
        this.chorus.wet.value = enabled ? 1 : 0;
        console.log(enabled ? '✅ Chorus ON' : '⏹️ Chorus OFF');
    }

    setPhaserEnabled(enabled) {
        this.phaserEnabled = enabled;
        this.phaser.wet.value = enabled ? 1 : 0;
        console.log(enabled ? '✅ Phaser ON' : '⏹️ Phaser OFF');
    }

    // Effect parameter methods

    setCompressorThreshold(threshold) {
        this.compressor.threshold.value = threshold;
        console.log(`🎚️ Compressor threshold: ${threshold}dB`);
    }

    setWahFrequency(freq) {
        this.wah.baseFrequency = freq;
        console.log(`🎚️ Wah frequency: ${freq}Hz`);
    }

    setOverdriveAmount(amount) {
        this.overdrive.distortion = Math.max(0, Math.min(1, amount));
        console.log(`🎚️ Overdrive: ${Math.round(amount * 100)}%`);
    }

    setDistortionAmount(amount) {
        this.distortion.distortion = Math.max(0, Math.min(1, amount));
        console.log(`🎚️ Distortion: ${Math.round(amount * 100)}%`);
    }

    setFuzzAmount(amount) {
        this.fuzz.distortion = Math.max(0, Math.min(1, amount));
        console.log(`🎚️ Fuzz: ${Math.round(amount * 100)}%`);
    }

    setEQBass(gain) {
        this.eqBass.gain.value = gain;
        console.log(`🎚️ EQ Bass: ${gain > 0 ? '+' : ''}${gain}dB`);
    }

    setEQMid(gain) {
        this.eqMid.gain.value = gain;
        console.log(`🎚️ EQ Mid: ${gain > 0 ? '+' : ''}${gain}dB`);
    }

    setEQTreble(gain) {
        this.eqTreble.gain.value = gain;
        console.log(`🎚️ EQ Treble: ${gain > 0 ? '+' : ''}${gain}dB`);
    }

    setChorusDepth(depth) {
        this.chorus.depth = Math.max(0, Math.min(1, depth));
        console.log(`🎚️ Chorus depth: ${Math.round(depth * 100)}%`);
    }

    setPhaserFrequency(freq) {
        this.phaser.frequency.value = freq;
        console.log(`🎚️ Phaser rate: ${freq.toFixed(2)}Hz`);
    }

    setDelayMix(mix) {
        this.delay.wet.value = Math.max(0, Math.min(1, mix / 100));
        console.log(`🎚️ Delay: ${mix}%`);
    }

    setDelayFeedback(feedback) {
        this.delay.feedback.value = Math.max(0, Math.min(0.95, feedback));
        console.log(`🎚️ Delay feedback: ${Math.round(feedback * 100)}%`);
    }

    setReverbMix(mix) {
        this.reverb.wet.value = Math.max(0, Math.min(1, mix / 100));
        console.log(`🎚️ Reverb: ${mix}%`);
    }

    setOutputGain(gain) {
        this.outputGain.gain.value = gain;
        console.log(`🎚️ Output: ${Math.round(gain * 100)}%`);
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

        console.log(`🎸 Loading preset: ${presetName} - ${preset.description}`);

        // Apply all settings
        this.setCompressorEnabled(preset.compressor || false);
        if (preset.compressorThreshold) this.setCompressorThreshold(preset.compressorThreshold);

        this.setWahEnabled(preset.wah || false);
        if (preset.wahFreq) this.setWahFrequency(preset.wahFreq);

        this.setOverdriveEnabled(preset.overdrive || false);
        if (preset.overdriveAmount) this.setOverdriveAmount(preset.overdriveAmount);

        this.setDistortionEnabled(preset.distortion || false);
        if (preset.distortionAmount) this.setDistortionAmount(preset.distortionAmount);

        this.setFuzzEnabled(preset.fuzz || false);
        if (preset.fuzzAmount) this.setFuzzAmount(preset.fuzzAmount);

        this.setEQEnabled(preset.eq || false);
        if (preset.eqBass !== undefined) this.setEQBass(preset.eqBass);
        if (preset.eqMid !== undefined) this.setEQMid(preset.eqMid);
        if (preset.eqTreble !== undefined) this.setEQTreble(preset.eqTreble);

        this.setChorusEnabled(preset.chorus || false);
        if (preset.chorusDepth) this.setChorusDepth(preset.chorusDepth);

        this.setPhaserEnabled(preset.phaser || false);
        if (preset.phaserFreq) this.setPhaserFrequency(preset.phaserFreq);

        if (preset.delay !== undefined) this.setDelayMix(preset.delay);
        if (preset.delayFeedback) this.setDelayFeedback(preset.delayFeedback);

        if (preset.reverb !== undefined) this.setReverbMix(preset.reverb);

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

            this.recorder.start(100);
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
     * Get audio input level (0-1)
     */
    getInputLevel() {
        if (!this.audioInput || this.audioInput.state !== 'started') return 0;
        if (!this.analyzer) return 0;

        const waveform = this.analyzer.getValue();
        let sum = 0;
        for (let i = 0; i < waveform.length; i++) {
            sum += Math.abs(waveform[i]);
        }

        return sum / waveform.length;
    }

    /**
     * Detect pitch for tuner (using autocorrelation)
     */
    detectPitch() {
        if (!this.analyzer) return null;

        const waveform = this.analyzer.getValue();
        const sampleRate = Tone.context.sampleRate;

        // Autocorrelation
        const correlations = new Array(waveform.length).fill(0);
        for (let lag = 0; lag < waveform.length; lag++) {
            for (let i = 0; i < waveform.length - lag; i++) {
                correlations[lag] += waveform[i] * waveform[i + lag];
            }
        }

        // Find first peak after zero crossing
        let peakIndex = -1;
        let peakValue = -Infinity;
        for (let i = 1; i < correlations.length; i++) {
            if (correlations[i] > peakValue && correlations[i] > correlations[i - 1] && correlations[i] > correlations[i + 1]) {
                peakValue = correlations[i];
                peakIndex = i;
                break;
            }
        }

        if (peakIndex === -1) return null;

        const frequency = sampleRate / peakIndex;

        // Only return if in guitar range (80Hz - 1200Hz)
        if (frequency < 80 || frequency > 1200) return null;

        // Convert to note
        const noteData = this.frequencyToNote(frequency);

        return {
            frequency: frequency,
            note: noteData.note,
            octave: noteData.octave,
            cents: noteData.cents
        };
    }

    /**
     * Convert frequency to note name
     */
    frequencyToNote(frequency) {
        const A4 = 440;
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

        const semitones = 12 * Math.log2(frequency / A4);
        const nearestNote = Math.round(semitones);
        const cents = Math.round((semitones - nearestNote) * 100);

        const noteIndex = (nearestNote + 9) % 12;
        const octave = Math.floor((nearestNote + 9) / 12) + 4;

        return {
            note: noteNames[noteIndex < 0 ? noteIndex + 12 : noteIndex],
            octave: octave,
            cents: cents
        };
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
