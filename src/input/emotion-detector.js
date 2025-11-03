/**
 * Emotion Detector
 * Analyzes MediaPipe blendshapes to detect emotions
 * Uses 52 facial expression coefficients to determine: happy, sad, angry, surprised, neutral
 */

class EmotionDetector {
    constructor() {
        // History for smoothing emotion detection
        this.emotionHistory = [];
        this.smoothingWindow = 5;  // Average last 5 detections
        this.confidenceThreshold = 0.3;  // Minimum confidence to register emotion

        // Blendshape name mapping (ARKit standard)
        this.blendshapeNames = {
            // Mouth
            mouthSmileLeft: 'mouthSmileLeft',
            mouthSmileRight: 'mouthSmileRight',
            mouthFrownLeft: 'mouthFrownLeft',
            mouthFrownRight: 'mouthFrownRight',
            jawOpen: 'jawOpen',
            mouthPucker: 'mouthPucker',
            // Eyebrows
            browInnerUp: 'browInnerUp',
            browDownLeft: 'browDownLeft',
            browDownRight: 'browDownRight',
            browOuterUpLeft: 'browOuterUpLeft',
            browOuterUpRight: 'browOuterUpRight',
            // Eyes
            eyeWideLeft: 'eyeWideLeft',
            eyeWideRight: 'eyeWideRight',
            eyeSquintLeft: 'eyeSquintLeft',
            eyeSquintRight: 'eyeSquintRight',
            // Jaw
            jawForward: 'jawForward',
            jawLeft: 'jawLeft',
            jawRight: 'jawRight'
        };
    }

    /**
     * Detect emotion from blendshapes
     * @param {Array} blendshapes - MediaPipe blendshape categories
     * @returns {Object} - {emotion: string, confidence: number, scores: object}
     */
    detectFromBlendshapes(blendshapes) {
        // Convert blendshapes array to map for easy access
        const blendshapeMap = {};
        for (const category of blendshapes) {
            blendshapeMap[category.categoryName] = category.score;
        }

        // Calculate emotion scores
        const scores = this.calculateEmotionScores(blendshapeMap);

        // Smooth scores with history
        const smoothedScores = this.smoothEmotions(scores);

        // Get dominant emotion
        const topEmotion = this.getTopEmotion(smoothedScores);

        return {
            emotion: topEmotion.emotion,
            confidence: topEmotion.confidence,
            scores: smoothedScores
        };
    }

    /**
     * Calculate raw emotion scores from blendshapes
     * @param {Object} blendshapes - Map of blendshape name → score
     * @returns {Object} - Map of emotion → raw score
     */
    calculateEmotionScores(blendshapes) {
        // Get blendshape values with defaults
        const get = (name) => blendshapes[name] || 0;

        // HAPPY: Smile detection
        const happy = (
            (get('mouthSmileLeft') + get('mouthSmileRight')) / 2 * 1.5 +
            (get('browOuterUpLeft') + get('browOuterUpRight')) / 2 * 0.5
        );

        // SAD: Frown + inner eyebrows up (sadness indicator)
        const sad = (
            (get('mouthFrownLeft') + get('mouthFrownRight')) / 2 * 1.2 +
            get('browInnerUp') * 0.8 +
            (get('eyeSquintLeft') + get('eyeSquintRight')) / 2 * 0.3
        );

        // ANGRY: Eyebrows down + jaw forward
        const angry = (
            (get('browDownLeft') + get('browDownRight')) / 2 * 1.5 +
            get('jawForward') * 0.8 +
            (get('eyeSquintLeft') + get('eyeSquintRight')) / 2 * 0.5
        );

        // SURPRISED: Eyes wide + jaw open + eyebrows up
        const surprised = (
            (get('eyeWideLeft') + get('eyeWideRight')) / 2 * 1.3 +
            get('jawOpen') * 0.8 +
            (get('browOuterUpLeft') + get('browOuterUpRight')) / 2 * 0.5
        );

        // NEUTRAL: Inverse of all other emotions (baseline)
        const maxOtherEmotion = Math.max(happy, sad, angry, surprised);
        const neutral = Math.max(0, 1 - maxOtherEmotion * 1.5);

        // Normalize scores
        const total = happy + sad + angry + surprised + neutral;
        const normalized = {
            happy: happy / total,
            sad: sad / total,
            angry: angry / total,
            surprised: surprised / total,
            neutral: neutral / total
        };

        return normalized;
    }

    /**
     * Smooth emotion scores using moving average
     * @param {Object} scores - Current emotion scores
     * @returns {Object} - Smoothed scores
     */
    smoothEmotions(scores) {
        // Add to history
        this.emotionHistory.push(scores);

        // Keep only last N frames
        if (this.emotionHistory.length > this.smoothingWindow) {
            this.emotionHistory.shift();
        }

        // Calculate average
        const smoothed = {};
        const emotions = ['happy', 'sad', 'angry', 'surprised', 'neutral'];

        for (const emotion of emotions) {
            let sum = 0;
            for (const frame of this.emotionHistory) {
                sum += frame[emotion];
            }
            smoothed[emotion] = sum / this.emotionHistory.length;
        }

        return smoothed;
    }

    /**
     * Get top emotion from scores
     * @param {Object} scores - Smoothed emotion scores
     * @returns {Object} - {emotion: string, confidence: number}
     */
    getTopEmotion(scores) {
        let topEmotion = 'neutral';
        let topScore = 0;

        for (const [emotion, score] of Object.entries(scores)) {
            if (score > topScore) {
                topScore = score;
                topEmotion = emotion;
            }
        }

        // If confidence too low, default to neutral
        if (topScore < this.confidenceThreshold) {
            topEmotion = 'neutral';
        }

        return {
            emotion: topEmotion,
            confidence: topScore
        };
    }

    /**
     * Reset emotion history (useful when starting/stopping)
     */
    reset() {
        this.emotionHistory = [];
    }

    /**
     * Set smoothing window size
     * @param {Number} size - Number of frames to average (1-10)
     */
    setSmoothingWindow(size) {
        this.smoothingWindow = Math.max(1, Math.min(10, size));
    }

    /**
     * Set confidence threshold
     * @param {Number} threshold - Minimum confidence (0.0-1.0)
     */
    setConfidenceThreshold(threshold) {
        this.confidenceThreshold = Math.max(0, Math.min(1, threshold));
    }
}
