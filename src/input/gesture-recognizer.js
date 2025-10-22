/**
 * Gesture Recognizer
 * Analyzes MediaPipe hand landmarks to detect musical gestures
 */

class GestureRecognizer {
    constructor() {
        this.gestures = {
            left: null,
            right: null
        };

        this.prevPositions = {
            left: null,
            right: null
        };

        this.velocities = {
            left: 0,
            right: 0
        };

        // Landmark indices (MediaPipe Hands)
        this.landmarks = {
            WRIST: 0,
            THUMB_TIP: 4,
            THUMB_IP: 3,
            THUMB_MCP: 2,
            INDEX_TIP: 8,
            INDEX_PIP: 6,
            INDEX_MCP: 5,
            MIDDLE_TIP: 12,
            MIDDLE_PIP: 10,
            MIDDLE_MCP: 9,
            RING_TIP: 16,
            RING_PIP: 14,
            RING_MCP: 13,
            PINKY_TIP: 20,
            PINKY_PIP: 18,
            PINKY_MCP: 17
        };
    }

    /**
     * Recognize gesture from hand landmarks
     * @param {Array} landmarks - Array of 21 hand landmarks from MediaPipe
     * @param {String} handedness - 'left' or 'right'
     * @returns {Object} - Gesture information
     */
    recognize(landmarks, handedness) {
        if (!landmarks || landmarks.length !== 21) {
            return null;
        }

        // Calculate velocity
        this.calculateVelocity(landmarks, handedness);

        // Get finger states
        const fingerStates = this.getFingerStates(landmarks);

        // Detect specific gestures
        const gesture = this.detectGesture(landmarks, fingerStates);

        // Store gesture
        this.gestures[handedness] = gesture;

        return gesture;
    }

    /**
     * Get states of all fingers (extended or curled)
     */
    getFingerStates(landmarks) {
        return {
            thumb: this.isThumbExtended(landmarks),
            index: this.isFingerExtended(landmarks, 'index'),
            middle: this.isFingerExtended(landmarks, 'middle'),
            ring: this.isFingerExtended(landmarks, 'ring'),
            pinky: this.isFingerExtended(landmarks, 'pinky')
        };
    }

    /**
     * Check if thumb is extended
     */
    isThumbExtended(landmarks) {
        const thumbTip = landmarks[this.landmarks.THUMB_TIP];
        const thumbIp = landmarks[this.landmarks.THUMB_IP];
        const thumbMcp = landmarks[this.landmarks.THUMB_MCP];
        const indexMcp = landmarks[this.landmarks.INDEX_MCP];

        // Thumb is extended if tip is farther from index MCP than IP
        const tipDist = this.distance2D(thumbTip, indexMcp);
        const ipDist = this.distance2D(thumbIp, indexMcp);

        return tipDist > ipDist * 1.2;
    }

    /**
     * Check if a finger is extended
     */
    isFingerExtended(landmarks, fingerName) {
        let tipIdx, pipIdx, mcpIdx;

        switch(fingerName) {
            case 'index':
                tipIdx = this.landmarks.INDEX_TIP;
                pipIdx = this.landmarks.INDEX_PIP;
                mcpIdx = this.landmarks.INDEX_MCP;
                break;
            case 'middle':
                tipIdx = this.landmarks.MIDDLE_TIP;
                pipIdx = this.landmarks.MIDDLE_PIP;
                mcpIdx = this.landmarks.MIDDLE_MCP;
                break;
            case 'ring':
                tipIdx = this.landmarks.RING_TIP;
                pipIdx = this.landmarks.RING_PIP;
                mcpIdx = this.landmarks.RING_MCP;
                break;
            case 'pinky':
                tipIdx = this.landmarks.PINKY_TIP;
                pipIdx = this.landmarks.PINKY_PIP;
                mcpIdx = this.landmarks.PINKY_MCP;
                break;
        }

        const tip = landmarks[tipIdx];
        const pip = landmarks[pipIdx];
        const mcp = landmarks[mcpIdx];
        const wrist = landmarks[this.landmarks.WRIST];

        // Finger is extended if tip is farther from wrist than PIP
        const tipDist = this.distance2D(tip, wrist);
        const pipDist = this.distance2D(pip, wrist);

        return tipDist > pipDist;
    }

    /**
     * Detect specific gesture from finger states
     */
    detectGesture(landmarks, fingerStates) {
        // Count extended fingers
        const extendedCount = Object.values(fingerStates).filter(v => v).length;

        // Check for pinch gestures (thumb touching other fingers)
        const thumbIndexPinch = this.isPinching(landmarks, 'thumb', 'index');
        const thumbRingPinch = this.isPinching(landmarks, 'thumb', 'ring');

        // Fist: all fingers curled
        if (extendedCount === 0) {
            return { name: 'fist', type: 'FIST', chord: null };
        }

        // OK Sign: Thumb + Ring pinch, others extended
        if (thumbRingPinch && fingerStates.index && fingerStates.middle) {
            return { name: 'ok', type: 'OK_SIGN', chord: null };
        }

        // Pinch: Thumb + Index tips touching
        if (thumbIndexPinch && !fingerStates.middle && !fingerStates.ring && !fingerStates.pinky) {
            return { name: 'pinch', type: 'PINCH', chord: null };
        }

        // Thumbs Up: Only thumb extended
        if (fingerStates.thumb && extendedCount === 1) {
            return { name: 'thumbs_up', type: 'THUMBS_UP', chord: 'I' };
        }

        // Index Finger: Only index extended
        if (fingerStates.index && extendedCount === 1) {
            return { name: 'index', type: 'INDEX', chord: 'II' };
        }

        // Peace/Victory: Index + Middle
        if (fingerStates.index && fingerStates.middle && extendedCount === 2) {
            return { name: 'peace', type: 'PEACE', chord: 'III' };
        }

        // Three Fingers: Index + Middle + Ring
        if (fingerStates.index && fingerStates.middle && fingerStates.ring && extendedCount === 3) {
            return { name: 'three', type: 'THREE', chord: 'IV' };
        }

        // Horn/Rock: Index + Pinky (thumb can be extended or not)
        if (fingerStates.index && fingerStates.pinky && !fingerStates.middle && !fingerStates.ring) {
            return { name: 'horn', type: 'HORN', chord: 'VII' };
        }

        // Shaka/Aloha: Thumb + Pinky
        if (fingerStates.thumb && fingerStates.pinky && extendedCount === 2) {
            return { name: 'shaka', type: 'SHAKA', chord: 'VI' };
        }

        // Open Palm: All fingers extended
        if (extendedCount === 5) {
            return { name: 'open_palm', type: 'OPEN_PALM', chord: 'V' };
        }

        // Unknown/ambiguous gesture
        return { name: 'unknown', type: 'UNKNOWN', chord: null };
    }

    /**
     * Check if two fingers are pinching (tips close together)
     */
    isPinching(landmarks, finger1, finger2) {
        let idx1, idx2;

        if (finger1 === 'thumb') idx1 = this.landmarks.THUMB_TIP;
        if (finger1 === 'index') idx1 = this.landmarks.INDEX_TIP;
        if (finger1 === 'ring') idx1 = this.landmarks.RING_TIP;

        if (finger2 === 'thumb') idx2 = this.landmarks.THUMB_TIP;
        if (finger2 === 'index') idx2 = this.landmarks.INDEX_TIP;
        if (finger2 === 'ring') idx2 = this.landmarks.RING_TIP;

        const tip1 = landmarks[idx1];
        const tip2 = landmarks[idx2];

        const distance = this.distance3D(tip1, tip2);

        // Pinching threshold (adjust as needed)
        return distance < 0.05;
    }

    /**
     * Calculate hand velocity for movement-based triggers
     */
    calculateVelocity(landmarks, handedness) {
        const wrist = landmarks[this.landmarks.WRIST];
        const currentPos = { x: wrist.x, y: wrist.y, z: wrist.z };

        if (this.prevPositions[handedness]) {
            const prev = this.prevPositions[handedness];
            const dx = currentPos.x - prev.x;
            const dy = currentPos.y - prev.y;
            const dz = currentPos.z - prev.z;

            const velocity = Math.sqrt(dx*dx + dy*dy + dz*dz);
            this.velocities[handedness] = velocity;
        }

        this.prevPositions[handedness] = currentPos;
    }

    /**
     * Detect two-hand combinations
     */
    detectTwoHandGesture() {
        if (!this.gestures.left || !this.gestures.right) {
            return null;
        }

        const left = this.gestures.left;
        const right = this.gestures.right;

        // Triangle: Both hands forming specific shape
        // (This is a simplified check - would need more sophisticated detection)
        if (left.type === 'OPEN_PALM' && right.type === 'INDEX') {
            return { name: 'octave_change', type: 'OCTAVE_CHANGE' };
        }

        // Both hands showing open palms close together could be triangle
        if (left.type === 'OPEN_PALM' && right.type === 'OPEN_PALM') {
            return { name: 'triangle', type: 'TRIANGLE' };
        }

        // Second hand Shaka for filter toggle
        if (right.type === 'SHAKA') {
            return { name: 'filter_toggle', type: 'FILTER_TOGGLE' };
        }

        return null;
    }

    /**
     * Get current gesture for a hand
     */
    getGesture(handedness) {
        return this.gestures[handedness];
    }

    /**
     * Get hand velocity (for drum triggers)
     */
    getVelocity(handedness) {
        return this.velocities[handedness];
    }

    /**
     * Calculate 2D distance between two points
     */
    distance2D(p1, p2) {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return Math.sqrt(dx*dx + dy*dy);
    }

    /**
     * Calculate 3D distance between two points
     */
    distance3D(p1, p2) {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dz = (p1.z || 0) - (p2.z || 0);
        return Math.sqrt(dx*dx + dy*dy + dz*dz);
    }

    /**
     * Reset gestures
     */
    reset() {
        this.gestures = { left: null, right: null };
        this.prevPositions = { left: null, right: null };
        this.velocities = { left: 0, right: 0 };
    }
}
