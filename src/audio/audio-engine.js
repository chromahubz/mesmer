/**
 * Audio Analysis Engine
 * Handles frequency analysis and audio-reactive data extraction
 */

class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.bufferLength = 0;
        this.frequencyData = {
            low: 0,
            mid: 0,
            high: 0,
            rawFrequencies: null
        };

        this.smoothing = 0.8;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;

        try {
            // DON'T create our own context - we'll use Tone's context later
            // Just mark as ready to initialize analyser
            console.log('Audio engine ready (analyser will be created after Tone.start)');
            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize audio engine:', error);
        }
    }

    initializeAnalyser() {
        // Use Tone's audio context (must be called AFTER Tone.start())
        if (typeof Tone === 'undefined' || !Tone.context) {
            console.error('Tone.js not ready yet!');
            return false;
        }

        console.log('Creating analyser using Tone.context...');

        // Use Tone's context (not our own!)
        this.audioContext = Tone.context.rawContext || Tone.context;

        // Create analyser from Tone's context
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;
        this.analyser.smoothingTimeConstant = this.smoothing;

        this.bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(this.bufferLength);

        console.log('✅ Analyser created with Tone.context!');
        console.log('   Context:', this.audioContext);
        console.log('   Sample Rate:', this.audioContext.sampleRate);

        return true;
    }

    connectSource(source) {
        if (!this.initialized) {
            console.error('Audio engine not initialized');
            return;
        }

        // Connect source to analyser
        source.connect(this.analyser);
        console.log('Audio source connected to analyser');
    }

    getAnalyser() {
        return this.analyser;
    }

    getContext() {
        return this.audioContext;
    }

    /**
     * Analyze audio and extract frequency bands
     */
    analyze() {
        if (!this.analyser || !this.dataArray) {
            return this.frequencyData;
        }

        // Get frequency data
        this.analyser.getByteFrequencyData(this.dataArray);
        this.frequencyData.rawFrequencies = this.dataArray;

        // Split into frequency bands
        const binSize = Math.floor(this.bufferLength / 3);

        // Low frequencies (bass): 0 - binSize
        let lowSum = 0;
        for (let i = 0; i < binSize; i++) {
            lowSum += this.dataArray[i];
        }
        this.frequencyData.low = (lowSum / binSize) / 255.0;

        // Mid frequencies: binSize - binSize*2
        let midSum = 0;
        for (let i = binSize; i < binSize * 2; i++) {
            midSum += this.dataArray[i];
        }
        this.frequencyData.mid = (midSum / binSize) / 255.0;

        // High frequencies (treble): binSize*2 - end
        let highSum = 0;
        const highBinSize = this.bufferLength - (binSize * 2);
        for (let i = binSize * 2; i < this.bufferLength; i++) {
            highSum += this.dataArray[i];
        }
        this.frequencyData.high = (highSum / highBinSize) / 255.0;

        // Apply additional smoothing for more stable visuals
        this.frequencyData.low = this.smooth(this.frequencyData.low, this.prevLow || 0, 0.7);
        this.frequencyData.mid = this.smooth(this.frequencyData.mid, this.prevMid || 0, 0.7);
        this.frequencyData.high = this.smooth(this.frequencyData.high, this.prevHigh || 0, 0.7);

        this.prevLow = this.frequencyData.low;
        this.prevMid = this.frequencyData.mid;
        this.prevHigh = this.frequencyData.high;

        return this.frequencyData;
    }

    smooth(current, previous, factor) {
        return previous * factor + current * (1.0 - factor);
    }

    /**
     * Get waveform data for visualization
     */
    getWaveform() {
        if (!this.analyser) return null;

        const waveform = new Uint8Array(this.analyser.fftSize);
        this.analyser.getByteTimeDomainData(waveform);
        return waveform;
    }

    /**
     * Get full frequency spectrum
     */
    getFrequencySpectrum() {
        return this.frequencyData.rawFrequencies;
    }

    /**
     * Resume audio context (needed for user interaction)
     */
    async resume() {
        // We're using Tone's context, so Tone.start() handles this
        // Just log that we're ready
        console.log('Audio engine resume called (using Tone.context)');
    }

    /**
     * Set smoothing factor
     */
    setSmoothing(value) {
        if (this.analyser) {
            this.analyser.smoothingTimeConstant = value;
            this.smoothing = value;
        }
    }
}
