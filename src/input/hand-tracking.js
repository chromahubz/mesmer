/**
 * Hand Tracking Module
 * Uses MediaPipe Hands to detect and track hands in webcam video
 */

class HandTracking {
    constructor(gestureRecognizer, musicMapper) {
        this.gestureRecognizer = gestureRecognizer;
        this.musicMapper = musicMapper;

        // Video and canvas elements
        this.video = null;
        this.canvas = null;
        this.ctx = null;

        // MediaPipe Hand Landmarker
        this.handLandmarker = null;
        this.runningMode = 'VIDEO';

        // State
        this.isInitialized = false;
        this.isRunning = false;
        this.lastVideoTime = -1;
        this.results = null;

        // Settings
        this.drawLandmarks = true;
        this.showVideo = true;

        // Performance
        this.frameCount = 0;
        this.fps = 0;
        this.lastFpsUpdate = Date.now();

        console.log('👋 Hand Tracking initialized');
    }

    /**
     * Initialize MediaPipe Hands
     */
    async init() {
        try {
            console.log('📦 Loading MediaPipe Hands model...');

            // Check if MediaPipe is available
            if (typeof window.vision === 'undefined') {
                throw new Error('MediaPipe vision library not loaded');
            }

            const { HandLandmarker, FilesetResolver } = window.vision;

            // Load the MediaPipe vision module
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
            );

            // Create hand landmarker
            this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
                    delegate: 'GPU'
                },
                runningMode: this.runningMode,
                numHands: 2,
                minHandDetectionConfidence: 0.5,
                minHandPresenceConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            console.log('✅ MediaPipe Hands model loaded');
            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize MediaPipe Hands:', error);
            throw error;
        }
    }

    /**
     * Setup video and canvas elements
     */
    async setupVideo(videoElement, canvasElement) {
        this.video = videoElement;
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext('2d');

        try {
            console.log('📹 Requesting camera access...');

            // Request webcam access
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                }
            });

            this.video.srcObject = stream;

            // Wait for video to be ready
            await new Promise((resolve) => {
                this.video.onloadedmetadata = () => {
                    resolve();
                };
            });

            await this.video.play();

            // Set canvas size to match video
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;

            console.log(`✅ Camera active: ${this.video.videoWidth}x${this.video.videoHeight}`);
            return true;
        } catch (error) {
            console.error('❌ Camera access failed:', error);
            throw error;
        }
    }

    /**
     * Start hand tracking
     */
    start() {
        if (!this.isInitialized) {
            console.error('❌ Hand tracking not initialized');
            return;
        }

        if (this.isRunning) {
            console.warn('⚠️ Hand tracking already running');
            return;
        }

        this.isRunning = true;
        console.log('▶️ Hand tracking started');
        this.detectHands();
    }

    /**
     * Stop hand tracking
     */
    stop() {
        this.isRunning = false;
        console.log('⏸️ Hand tracking stopped');

        // Stop video stream
        if (this.video && this.video.srcObject) {
            const tracks = this.video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
        }
    }

    /**
     * Main detection loop
     */
    async detectHands() {
        if (!this.isRunning) return;

        const now = performance.now();

        // Only process if video has new frame
        if (this.video.currentTime !== this.lastVideoTime) {
            this.lastVideoTime = this.video.currentTime;

            // Detect hands in video frame
            this.results = this.handLandmarker.detectForVideo(this.video, now);

            // Process results
            this.processResults(this.results);

            // Update FPS
            this.updateFPS();
        }

        // Draw visualization
        this.draw();

        // Continue loop
        requestAnimationFrame(() => this.detectHands());
    }

    /**
     * Process hand detection results
     */
    processResults(results) {
        if (!results || !results.landmarks || results.landmarks.length === 0) {
            // No hands detected - release all notes
            this.musicMapper.processGestures(null, null, null);
            return;
        }

        let leftGesture = null;
        let rightGesture = null;

        // Process each detected hand
        for (let i = 0; i < results.landmarks.length; i++) {
            const landmarks = results.landmarks[i];
            const handedness = results.handednesses[i][0].categoryName.toLowerCase(); // 'left' or 'right'

            // Recognize gesture
            const gesture = this.gestureRecognizer.recognize(landmarks, handedness);

            if (handedness === 'left') {
                leftGesture = gesture;
            } else {
                rightGesture = gesture;
            }
        }

        // Get hand velocities
        const velocities = {
            left: this.gestureRecognizer.getVelocity('left'),
            right: this.gestureRecognizer.getVelocity('right')
        };

        // Send to music mapper
        this.musicMapper.processGestures(leftGesture, rightGesture, velocities);
    }

    /**
     * Draw video and hand landmarks
     */
    draw() {
        if (!this.canvas || !this.ctx) return;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw video frame (if enabled)
        if (this.showVideo && this.video) {
            this.ctx.save();
            this.ctx.scale(-1, 1); // Flip horizontally for mirror effect
            this.ctx.drawImage(this.video, -this.canvas.width, 0, this.canvas.width, this.canvas.height);
            this.ctx.restore();
        }

        // Draw hand landmarks (if enabled)
        if (this.drawLandmarks && this.results && this.results.landmarks) {
            for (let i = 0; i < this.results.landmarks.length; i++) {
                const landmarks = this.results.landmarks[i];
                const handedness = this.results.handednesses[i][0].categoryName;

                // Draw connections
                this.drawConnections(landmarks, handedness);

                // Draw points
                this.drawLandmarkPoints(landmarks, handedness);
            }
        }

        // Draw FPS
        this.drawFPS();

        // Draw gesture labels
        this.drawGestureLabels();
    }

    /**
     * Draw hand skeleton connections
     */
    drawConnections(landmarks, handedness) {
        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4],           // Thumb
            [0, 5], [5, 6], [6, 7], [7, 8],           // Index
            [0, 9], [9, 10], [10, 11], [11, 12],      // Middle
            [0, 13], [13, 14], [14, 15], [15, 16],    // Ring
            [0, 17], [17, 18], [18, 19], [19, 20],    // Pinky
            [5, 9], [9, 13], [13, 17]                 // Palm
        ];

        this.ctx.strokeStyle = handedness === 'Left' ? '#00ff00' : '#ff00ff';
        this.ctx.lineWidth = 2;

        connections.forEach(([start, end]) => {
            const startPoint = this.landmarkToCanvas(landmarks[start]);
            const endPoint = this.landmarkToCanvas(landmarks[end]);

            this.ctx.beginPath();
            this.ctx.moveTo(startPoint.x, startPoint.y);
            this.ctx.lineTo(endPoint.x, endPoint.y);
            this.ctx.stroke();
        });
    }

    /**
     * Draw landmark points
     */
    drawLandmarkPoints(landmarks, handedness) {
        this.ctx.fillStyle = handedness === 'Left' ? '#00ff00' : '#ff00ff';

        landmarks.forEach(landmark => {
            const point = this.landmarkToCanvas(landmark);
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
            this.ctx.fill();
        });
    }

    /**
     * Convert normalized landmark to canvas coordinates
     */
    landmarkToCanvas(landmark) {
        return {
            x: this.canvas.width - (landmark.x * this.canvas.width), // Flip for mirror
            y: landmark.y * this.canvas.height
        };
    }

    /**
     * Draw FPS counter
     */
    drawFPS() {
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = 'bold 16px monospace';
        this.ctx.fillText(`FPS: ${this.fps}`, 10, 30);
    }

    /**
     * Draw gesture labels
     */
    drawGestureLabels() {
        const state = this.musicMapper.getState();

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 18px monospace';
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 3;

        // Left hand gesture
        const leftText = `👈 ${state.leftGesture.toUpperCase()}`;
        this.ctx.strokeText(leftText, 10, this.canvas.height - 80);
        this.ctx.fillStyle = '#00ff00';
        this.ctx.fillText(leftText, 10, this.canvas.height - 80);

        // Right hand gesture
        const rightText = `👉 ${state.rightGesture.toUpperCase()}`;
        this.ctx.strokeText(rightText, 10, this.canvas.height - 50);
        this.ctx.fillStyle = '#ff00ff';
        this.ctx.fillText(rightText, 10, this.canvas.height - 50);

        // Music state
        this.ctx.fillStyle = '#ffff00';
        const stateText = `${state.scale.toUpperCase()} | ${state.playbackMode.toUpperCase()} | OCT: ${state.octave}`;
        this.ctx.strokeText(stateText, 10, this.canvas.height - 20);
        this.ctx.fillText(stateText, 10, this.canvas.height - 20);
    }

    /**
     * Update FPS counter
     */
    updateFPS() {
        this.frameCount++;
        const now = Date.now();
        const elapsed = now - this.lastFpsUpdate;

        if (elapsed >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / elapsed);
            this.frameCount = 0;
            this.lastFpsUpdate = now;
        }
    }

    /**
     * Toggle video visibility
     */
    toggleVideo() {
        this.showVideo = !this.showVideo;
        console.log(`📹 Video ${this.showVideo ? 'visible' : 'hidden'}`);
    }

    /**
     * Toggle landmark drawing
     */
    toggleLandmarks() {
        this.drawLandmarks = !this.drawLandmarks;
        console.log(`✋ Landmarks ${this.drawLandmarks ? 'visible' : 'hidden'}`);
    }

    /**
     * Get tracking status
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            running: this.isRunning,
            fps: this.fps,
            showVideo: this.showVideo,
            drawLandmarks: this.drawLandmarks
        };
    }
}
