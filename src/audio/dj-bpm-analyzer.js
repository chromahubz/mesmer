/**
 * DJ BPM Analyzer - Automatic Tempo Detection
 * Detects BPM from audio files for beat-synced effects
 * Based on beat detection and autocorrelation algorithms
 */

class DJBPMAnalyzer {
    constructor() {
        this.sampleRate = 44100;
        this.minBPM = 60;
        this.maxBPM = 200;

        console.log('🎵 BPM Analyzer initialized');
    }

    /**
     * Detect BPM from audio buffer
     * @param {AudioBuffer} audioBuffer - Decoded audio data
     * @returns {Object} - {bpm: number, confidence: number, beatGrid: array}
     */
    async detectBPM(audioBuffer) {
        console.log('🎵 Analyzing BPM...');

        try {
            this.sampleRate = audioBuffer.sampleRate;

            // Get mono channel data
            const channelData = this.getMonoData(audioBuffer);

            // Step 1: Apply low-pass filter to focus on bass/kick drum
            const filtered = this.lowPassFilter(channelData);

            // Step 2: Detect energy peaks (potential beats)
            const peaks = this.detectPeaks(filtered);

            // Step 3: Calculate intervals between peaks
            const intervals = this.calculateIntervals(peaks);

            // Step 4: Find most common interval (tempo)
            const bpm = this.findBPM(intervals);

            // Step 5: Generate beat grid
            const beatGrid = this.generateBeatGrid(peaks, bpm);

            // Step 6: Calculate confidence
            const confidence = this.calculateConfidence(intervals, bpm);

            console.log(`✅ BPM detected: ${bpm} (confidence: ${Math.round(confidence * 100)}%)`);

            return {
                bpm: Math.round(bpm),
                confidence: confidence,
                beatGrid: beatGrid
            };

        } catch (error) {
            console.error('❌ BPM detection failed:', error);
            // Return default BPM if detection fails
            return {
                bpm: 120,
                confidence: 0,
                beatGrid: []
            };
        }
    }

    /**
     * Convert stereo to mono
     */
    getMonoData(audioBuffer) {
        const left = audioBuffer.getChannelData(0);

        // If stereo, average with right channel
        if (audioBuffer.numberOfChannels > 1) {
            const right = audioBuffer.getChannelData(1);
            const mono = new Float32Array(left.length);
            for (let i = 0; i < left.length; i++) {
                mono[i] = (left[i] + right[i]) / 2;
            }
            return mono;
        }

        return left;
    }

    /**
     * Apply low-pass filter to focus on bass frequencies
     */
    lowPassFilter(data) {
        const filtered = new Float32Array(data.length);
        const cutoff = 0.1; // Simple low-pass coefficient

        filtered[0] = data[0];
        for (let i = 1; i < data.length; i++) {
            filtered[i] = cutoff * data[i] + (1 - cutoff) * filtered[i - 1];
        }

        return filtered;
    }

    /**
     * Detect energy peaks (potential beats)
     */
    detectPeaks(data) {
        const windowSize = Math.floor(this.sampleRate * 0.05); // 50ms window
        const threshold = 0.3; // Energy threshold
        const peaks = [];

        // Calculate energy in windows
        for (let i = 0; i < data.length - windowSize; i += windowSize / 2) {
            let energy = 0;
            for (let j = 0; j < windowSize; j++) {
                energy += Math.abs(data[i + j]);
            }
            energy /= windowSize;

            // Detect peaks above threshold
            if (energy > threshold) {
                const timeInSeconds = i / this.sampleRate;
                peaks.push(timeInSeconds);
            }
        }

        return peaks;
    }

    /**
     * Calculate intervals between consecutive peaks
     */
    calculateIntervals(peaks) {
        const intervals = [];

        for (let i = 1; i < peaks.length; i++) {
            const interval = peaks[i] - peaks[i - 1];
            intervals.push(interval);
        }

        return intervals;
    }

    /**
     * Find BPM from intervals using histogram
     */
    findBPM(intervals) {
        if (intervals.length === 0) {
            return 120; // Default fallback
        }

        // Create histogram of intervals
        const histogram = {};
        const tolerance = 0.02; // 20ms tolerance for grouping

        for (const interval of intervals) {
            // Convert interval to BPM
            const bpm = 60 / interval;

            // Only consider BPM in valid range
            if (bpm >= this.minBPM && bpm <= this.maxBPM) {
                // Round to nearest integer for grouping
                const rounded = Math.round(bpm);

                if (!histogram[rounded]) {
                    histogram[rounded] = 0;
                }
                histogram[rounded]++;
            }
        }

        // Find most common BPM
        let maxCount = 0;
        let detectedBPM = 120;

        for (const [bpm, count] of Object.entries(histogram)) {
            if (count > maxCount) {
                maxCount = count;
                detectedBPM = parseInt(bpm);
            }
        }

        // Check for half-time or double-time
        // Common in electronic music: actual tempo might be 2x or 0.5x detected
        const halfTime = detectedBPM / 2;
        const doubleTime = detectedBPM * 2;

        // If double-time is in valid range and common, prefer it
        if (doubleTime <= this.maxBPM && histogram[doubleTime] && histogram[doubleTime] > maxCount * 0.7) {
            detectedBPM = doubleTime;
        }
        // If half-time is in valid range and more common, prefer it
        else if (halfTime >= this.minBPM && histogram[Math.round(halfTime)] && histogram[Math.round(halfTime)] > maxCount * 1.3) {
            detectedBPM = Math.round(halfTime);
        }

        return detectedBPM;
    }

    /**
     * Generate beat grid from peaks and BPM
     */
    generateBeatGrid(peaks, bpm) {
        if (peaks.length === 0) return [];

        const beatInterval = 60 / bpm; // Seconds per beat
        const beatGrid = [];

        // Start from first peak
        let beatTime = peaks[0];
        const maxTime = peaks[peaks.length - 1];

        // Generate beat grid
        while (beatTime <= maxTime) {
            beatGrid.push(beatTime);
            beatTime += beatInterval;
        }

        return beatGrid;
    }

    /**
     * Calculate confidence score (0-1)
     */
    calculateConfidence(intervals, bpm) {
        if (intervals.length === 0) return 0;

        const expectedInterval = 60 / bpm;
        let matches = 0;

        // Count how many intervals match expected tempo
        for (const interval of intervals) {
            const diff = Math.abs(interval - expectedInterval);
            const tolerance = expectedInterval * 0.1; // 10% tolerance

            if (diff < tolerance) {
                matches++;
            }
        }

        return matches / intervals.length;
    }

    /**
     * Quantize time to nearest beat
     * @param {Number} time - Time in seconds
     * @param {Array} beatGrid - Beat grid array
     * @returns {Number} - Quantized time
     */
    quantizeToNearestBeat(time, beatGrid) {
        if (!beatGrid || beatGrid.length === 0) return time;

        // Find nearest beat in grid
        let closest = beatGrid[0];
        let minDiff = Math.abs(time - closest);

        for (const beat of beatGrid) {
            const diff = Math.abs(time - beat);
            if (diff < minDiff) {
                minDiff = diff;
                closest = beat;
            }
        }

        return closest;
    }

    /**
     * Get beat division time
     * @param {Number} bpm - Beats per minute
     * @param {String} division - '1/4', '1/8', '1/16', etc.
     * @returns {Number} - Time in seconds
     */
    getBeatDivisionTime(bpm, division) {
        const beatTime = 60 / bpm; // Time for 1 beat (1/4 note)

        switch (division) {
            case '1/4':
            case '4n':
                return beatTime;
            case '1/8':
            case '8n':
                return beatTime / 2;
            case '1/16':
            case '16n':
                return beatTime / 4;
            case '1/2':
            case '2n':
                return beatTime * 2;
            case '1':
            case '1n':
                return beatTime * 4; // Whole note (1 bar)
            default:
                return beatTime;
        }
    }

    /**
     * Simple BPM detection (faster, less accurate)
     * Useful for real-time or preview purposes
     */
    quickDetectBPM(audioBuffer) {
        const channelData = this.getMonoData(audioBuffer);

        // Autocorrelation method for quick detection
        const sampleWindow = Math.floor(this.sampleRate * 10); // Analyze first 10 seconds
        const data = channelData.slice(0, sampleWindow);

        const minPeriod = Math.floor(this.sampleRate * 60 / this.maxBPM);
        const maxPeriod = Math.floor(this.sampleRate * 60 / this.minBPM);

        let maxCorrelation = 0;
        let detectedPeriod = minPeriod;

        // Simple autocorrelation
        for (let period = minPeriod; period < maxPeriod; period += 10) {
            let correlation = 0;
            for (let i = 0; i < data.length - period; i++) {
                correlation += Math.abs(data[i] * data[i + period]);
            }

            if (correlation > maxCorrelation) {
                maxCorrelation = correlation;
                detectedPeriod = period;
            }
        }

        const bpm = Math.round(this.sampleRate * 60 / detectedPeriod);
        return Math.max(this.minBPM, Math.min(this.maxBPM, bpm));
    }
}
