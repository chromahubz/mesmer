/**
 * DJ Gesture Controller - Hand Tracking for DJ Mode
 * Maps hand gestures to DJ controls
 * Casual mode: Simple gestures | Pro mode: Advanced control
 */

class DJGestureController {
    constructor(djEngine, fxRack) {
        this.djEngine = djEngine;
        this.fxRack = fxRack;

        this.mode = 'casual'; // 'casual' or 'pro'

        // Gesture state
        this.lastGestures = {
            left: null,
            right: null
        };

        // Swipe detection
        this.swipeThreshold = 0.3; // Distance threshold for swipe
        this.swipeVelocityThreshold = 0.02; // Velocity threshold
        this.lastSwipeTime = 0;
        this.swipeDebounce = 500; // ms

        // Filter sweep state
        this.filterAmount = 0.5; // 0.5 = neutral/off

        // Track playlist (for next/previous track)
        this.playlist = [];
        this.currentTrackIndex = 0;

        console.log('👋 DJ Gesture Controller initialized');
    }

    /**
     * Process hand tracking data for DJ mode
     * @param {Object} leftHand - Left hand data {position, gesture, landmarks}
     * @param {Object} rightHand - Right hand data {position, gesture, landmarks}
     */
    processGestures(leftHand, rightHand) {
        // CASUAL MODE GESTURES
        if (this.mode === 'casual') {
            this.processCasualGestures(leftHand, rightHand);
        }
        // PRO MODE GESTURES
        else {
            this.processProGestures(leftHand, rightHand);
        }

        // Store last gestures
        this.lastGestures.left = leftHand ? leftHand.gesture : null;
        this.lastGestures.right = rightHand ? rightHand.gesture : null;
    }

    /**
     * Process casual mode gestures (simple, beginner-friendly)
     */
    processCasualGestures(leftHand, rightHand) {
        // LEFT HAND: Filter sweep (Y-axis control)
        if (leftHand && leftHand.position) {
            const handY = leftHand.position.y;

            // Map Y position to filter amount (0-1)
            // Hand up (y=0) = 0, Hand down (y=1) = 1
            this.filterAmount = handY;

            // Apply filter
            if (this.fxRack) {
                this.fxRack.applyFilter(this.filterAmount);
            }
        }

        // RIGHT HAND: Swipe gestures for track loading
        if (rightHand && rightHand.position) {
            this.detectSwipeGesture(rightHand);
        }

        // GESTURE TRIGGERS
        if (leftHand) {
            this.processGestureTriggers(leftHand.gesture, 'left');
        }
        if (rightHand) {
            this.processGestureTriggers(rightHand.gesture, 'right');
        }
    }

    /**
     * Process pro mode gestures (advanced control)
     */
    processProGestures(leftHand, rightHand) {
        // LEFT HAND: Crossfader (X-axis) + Filter (Y-axis)
        if (leftHand && leftHand.position) {
            const handX = leftHand.position.x;
            const handY = leftHand.position.y;

            // X-axis = Crossfader
            if (this.djEngine) {
                this.djEngine.setCrossfader(handX);
            }

            // Y-axis = Filter
            this.filterAmount = handY;
            if (this.fxRack) {
                this.fxRack.applyFilter(this.filterAmount);
            }
        }

        // RIGHT HAND: Volume (X-axis) + Effects (Y-axis)
        if (rightHand && rightHand.position) {
            const handX = rightHand.position.x;
            const handY = rightHand.position.y;

            // X-axis = Volume
            if (this.djEngine) {
                this.djEngine.setVolume(handX);
            }

            // Y-axis = Echo feedback
            if (this.fxRack) {
                const echoAmount = 1 - handY; // Inverted: hand up = more echo
                this.fxRack.applyEcho(echoAmount);
            }
        }

        // GESTURE TRIGGERS (both modes)
        if (leftHand) {
            this.processGestureTriggers(leftHand.gesture, 'left');
        }
        if (rightHand) {
            this.processGestureTriggers(rightHand.gesture, 'right');
        }
    }

    /**
     * Process gesture triggers (buttons/actions)
     */
    processGestureTriggers(gesture, hand) {
        if (!gesture) return;

        const lastGesture = this.lastGestures[hand];
        const isNewGesture = gesture !== lastGesture;

        if (!isNewGesture) return;

        switch (gesture) {
            case 'FIST':
                // Play/Pause
                if (this.djEngine) {
                    this.djEngine.togglePlayPause();
                    console.log('✊ FIST gesture: Play/Pause');
                }
                break;

            case 'PEACE':
                // Toggle loop
                if (this.djEngine) {
                    this.djEngine.toggleLoop();
                    console.log('✌️ PEACE gesture: Toggle Loop');
                }
                break;

            case 'THUMBS_UP':
                // Jump to Cue A (left hand) or Cue B (right hand)
                if (this.djEngine) {
                    const cueId = hand === 'left' ? 'A' : 'B';
                    this.djEngine.jumpToCue(cueId);
                    console.log(`👍 THUMBS_UP gesture: Jump to Cue ${cueId}`);
                }
                break;

            case 'PINCH':
                // Set cue point at current position
                if (this.djEngine) {
                    const cueId = hand === 'left' ? 'A' : 'B';
                    this.djEngine.setCuePoint(cueId);
                    console.log(`🤏 PINCH gesture: Set Cue ${cueId}`);
                }
                break;

            case 'OPEN_PALM':
                // Reset all effects
                if (this.fxRack) {
                    this.fxRack.resetAllEffects();
                    console.log('🖐️ OPEN_PALM gesture: Reset FX');
                }
                break;
        }
    }

    /**
     * Detect swipe gestures for track loading
     */
    detectSwipeGesture(hand) {
        if (!hand.position || !hand.velocity) return;

        const now = Date.now();
        if (now - this.lastSwipeTime < this.swipeDebounce) return;

        const velocityY = hand.velocity.y;

        // Swipe UP = Load next track
        if (velocityY < -this.swipeVelocityThreshold) {
            this.loadNextTrack();
            this.lastSwipeTime = now;
            console.log('⬆️ SWIPE UP: Load next track');
        }
        // Swipe DOWN = Load previous track
        else if (velocityY > this.swipeVelocityThreshold) {
            this.loadPreviousTrack();
            this.lastSwipeTime = now;
            console.log('⬇️ SWIPE DOWN: Load previous track');
        }
    }

    /**
     * Load next track in playlist
     */
    loadNextTrack() {
        if (this.playlist.length === 0) {
            console.warn('⚠️ No tracks in playlist');
            return;
        }

        this.currentTrackIndex = (this.currentTrackIndex + 1) % this.playlist.length;
        const nextTrack = this.playlist[this.currentTrackIndex];

        console.log(`📀 Loading next track: ${nextTrack.name}`);

        // Trigger track load event
        if (this.onTrackChange) {
            this.onTrackChange(nextTrack, 'next');
        }
    }

    /**
     * Load previous track in playlist
     */
    loadPreviousTrack() {
        if (this.playlist.length === 0) {
            console.warn('⚠️ No tracks in playlist');
            return;
        }

        this.currentTrackIndex = (this.currentTrackIndex - 1 + this.playlist.length) % this.playlist.length;
        const prevTrack = this.playlist[this.currentTrackIndex];

        console.log(`📀 Loading previous track: ${prevTrack.name}`);

        // Trigger track load event
        if (this.onTrackChange) {
            this.onTrackChange(prevTrack, 'previous');
        }
    }

    /**
     * Set playlist for swipe navigation
     */
    setPlaylist(tracks) {
        this.playlist = tracks;
        console.log(`📀 Playlist set: ${tracks.length} tracks`);
    }

    /**
     * Add track to playlist
     */
    addToPlaylist(track) {
        this.playlist.push(track);
        console.log(`📀 Added to playlist: ${track.name}`);
    }

    /**
     * Set mode (casual or pro)
     */
    setMode(mode) {
        if (mode !== 'casual' && mode !== 'pro') {
            console.warn('⚠️ Invalid mode. Use "casual" or "pro"');
            return;
        }

        this.mode = mode;
        console.log(`👋 Gesture mode: ${mode.toUpperCase()}`);
    }

    /**
     * Get current gesture status (for UI display)
     */
    getGestureStatus() {
        return {
            mode: this.mode,
            leftGesture: this.getGestureDescription('left'),
            rightGesture: this.getGestureDescription('right'),
            filterAmount: this.filterAmount
        };
    }

    /**
     * Get human-readable gesture description
     */
    getGestureDescription(hand) {
        if (this.mode === 'casual') {
            if (hand === 'left') {
                return 'Filter Sweep (Y-axis)';
            } else {
                return 'Swipe: Next/Prev Track';
            }
        } else {
            if (hand === 'left') {
                return 'Crossfader (X) + Filter (Y)';
            } else {
                return 'Volume (X) + Echo (Y)';
            }
        }
    }

    /**
     * Set callback for track change events
     */
    onLoad(callback) {
        this.onTrackChange = callback;
    }

    /**
     * Reset gesture state
     */
    reset() {
        this.lastGestures = { left: null, right: null };
        this.filterAmount = 0.5;
        this.lastSwipeTime = 0;
    }
}
