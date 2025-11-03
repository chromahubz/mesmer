/**
 * Face Tracking using MediaPipe Face Landmarker
 * Detects facial expressions and head position for emotion-based music control
 */

class FaceTracking {
    constructor(emotionMusicMapper) {
        this.faceLandmarker = null;
        this.emotionMusicMapper = emotionMusicMapper;
        this.emotionDetector = null;

        this.video = null;
        this.canvas = null;
        this.ctx = null;

        this.isInitialized = false;
        this.isRunning = false;
        this.lastVideoTime = -1;
        this.results = null;

        this.currentEmotion = 'neutral';
        this.emotionConfidence = 0;
        this.headPosition = { x: 0, y: 0, z: 0 };

        this.drawLandmarks = true;
        this.enabled = false;

        // Performance tracking
        this.frameCount = 0;
        this.lastFpsUpdate = Date.now();
        this.fps = 0;
    }

    /**
     * Initialize MediaPipe Face Landmarker
     */
    async init() {
        try {
            console.log('🎭 Initializing Face Tracking...');

            // Wait for MediaPipe library to load
            let attempts = 0;
            while (typeof window.mpVision === 'undefined' && attempts < 50) {
                if (attempts % 10 === 0) {
                    console.log(`🔍 Waiting for MediaPipe... attempt ${attempts}/50`);
                }
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }

            // Check if MediaPipe is available
            if (typeof window.mpVision === 'undefined') {
                throw new Error('MediaPipe vision library not loaded. Please refresh the page.');
            }

            console.log('✅ MediaPipe available, loading Face Landmarker...');
            const { FaceLandmarker, FilesetResolver } = window.mpVision;

            // Load MediaPipe Vision library
            const vision = await FilesetResolver.forVisionTasks(
                'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
            );

            // Create Face Landmarker with blendshape output
            this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: 'models/face_landmarker.task',
                    delegate: 'GPU'
                },
                runningMode: 'VIDEO',
                numFaces: 1,  // Track single face
                minFaceDetectionConfidence: 0.5,
                minFacePresenceConfidence: 0.5,
                minTrackingConfidence: 0.5,
                outputFaceBlendshapes: true,  // CRITICAL: Enable emotion data
                outputFacialTransformationMatrixes: false  // Don't need 3D transforms
            });

            // Initialize emotion detector
            this.emotionDetector = new EmotionDetector();

            this.isInitialized = true;
            console.log('✅ Face Landmarker initialized successfully');
            console.log('   - Blendshapes enabled: ✓');
            console.log('   - Num faces: 1');
            console.log('   - Running mode: VIDEO');

            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Face Landmarker:', error);
            return false;
        }
    }

    /**
     * Setup video feed (shared with hand tracking)
     */
    setupVideo(videoElement, canvasElement = null) {
        this.video = videoElement;

        if (canvasElement) {
            this.canvas = canvasElement;
            this.ctx = this.canvas.getContext('2d');
        }

        console.log('📹 Face tracking using shared video feed');
    }

    /**
     * Start face detection loop
     */
    start() {
        if (!this.isInitialized) {
            console.error('❌ Face Landmarker not initialized. Call init() first.');
            return false;
        }

        if (!this.video) {
            console.error('❌ Video not setup. Call setupVideo() first.');
            return false;
        }

        // Basic video readiness check
        if (this.video.readyState < 2 || this.video.videoWidth === 0) {
            console.error('❌ Video not ready yet');
            return false;
        }

        this.isRunning = true;
        this.enabled = true;
        this.detectFaces();
        console.log('▶️ Face tracking started');
        return true;
    }

    /**
     * Stop face detection
     */
    stop() {
        this.isRunning = false;
        this.enabled = false;
        this.results = null;
        console.log('⏹️ Face tracking stopped');
    }

    /**
     * Toggle face tracking
     */
    toggle() {
        if (this.enabled) {
            this.stop();
        } else {
            this.start();
        }
        return this.enabled;
    }

    /**
     * Main detection loop
     */
    detectFaces() {
        if (!this.isRunning || !this.enabled) return;

        const now = performance.now();

        // Only process if we have a new video frame
        if (this.video.currentTime !== this.lastVideoTime) {
            this.lastVideoTime = this.video.currentTime;

            try {
                // Detect faces in video frame
                this.results = this.faceLandmarker.detectForVideo(this.video, now);

                // Process results
                if (this.results && this.results.faceLandmarks && this.results.faceLandmarks.length > 0) {
                    this.processResults(this.results);
                } else {
                    // No face detected
                    this.currentEmotion = 'neutral';
                    this.emotionConfidence = 0;
                }

                // Update FPS counter
                this.frameCount++;
                if (now - this.lastFpsUpdate > 1000) {
                    this.fps = this.frameCount;
                    this.frameCount = 0;
                    this.lastFpsUpdate = now;
                }
            } catch (error) {
                console.error('❌ Face detection error:', error);
            }
        }

        // Draw landmarks if enabled
        if (this.drawLandmarks && this.canvas) {
            this.draw();
        }

        // Continue loop
        requestAnimationFrame(() => this.detectFaces());
    }

    /**
     * Process detection results
     */
    processResults(results) {
        // Get first (and only) face
        const faceLandmarks = results.faceLandmarks[0];
        const faceBlendshapes = results.faceBlendshapes[0];

        if (!faceBlendshapes || !faceBlendshapes.categories) {
            console.warn('⚠️ No blendshapes detected');
            return;
        }

        // Extract head position from landmarks
        // Landmark 1 is the nose tip - use it as head position reference
        if (faceLandmarks && faceLandmarks.length > 1) {
            const noseTip = faceLandmarks[1];
            this.headPosition = {
                x: noseTip.x,  // 0.0 (left) to 1.0 (right)
                y: noseTip.y,  // 0.0 (top) to 1.0 (bottom)
                z: noseTip.z   // Depth (forward/back)
            };
        }

        // Detect emotion from blendshapes
        const emotionResult = this.emotionDetector.detectFromBlendshapes(faceBlendshapes.categories);
        this.currentEmotion = emotionResult.emotion;
        this.emotionConfidence = emotionResult.confidence;

        // Send to music mapper (throttled to every 500ms)
        if (this.emotionMusicMapper) {
            this.emotionMusicMapper.updateFromEmotion(
                this.currentEmotion,
                this.emotionConfidence,
                this.headPosition
            );
        }

        // Throttled logging
        if (!this._lastLog || Date.now() - this._lastLog > 1000) {
            console.log(`🎭 Face: ${this.currentEmotion.toUpperCase()} (${Math.round(this.emotionConfidence * 100)}%) | FPS: ${this.fps}`);
            this._lastLog = Date.now();
        }
    }

    /**
     * Draw face landmarks on canvas
     */
    draw() {
        if (!this.results || !this.results.faceLandmarks || this.results.faceLandmarks.length === 0) {
            return;
        }

        const faceLandmarks = this.results.faceLandmarks[0];
        const ctx = this.ctx;

        // Draw face mesh connections
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
        ctx.lineWidth = 1;

        // Draw simplified face outline (not all 478 points - too cluttered)
        // Just draw face contour
        const faceOvalIndices = [
            10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
            397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
            172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109
        ];

        ctx.beginPath();
        for (let i = 0; i < faceOvalIndices.length; i++) {
            const idx = faceOvalIndices[i];
            if (idx < faceLandmarks.length) {
                const point = faceLandmarks[idx];
                const x = point.x * this.canvas.width;
                const y = point.y * this.canvas.height;

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
        }
        ctx.closePath();
        ctx.stroke();

        // Draw key landmarks (eyes, nose, mouth)
        const keyLandmarks = [
            1,    // Nose tip
            61, 291,  // Mouth corners
            33, 263,  // Eyes
        ];

        ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
        for (const idx of keyLandmarks) {
            if (idx < faceLandmarks.length) {
                const point = faceLandmarks[idx];
                const x = point.x * this.canvas.width;
                const y = point.y * this.canvas.height;

                ctx.beginPath();
                ctx.arc(x, y, 3, 0, 2 * Math.PI);
                ctx.fill();
            }
        }

        // Draw emotion label
        ctx.fillStyle = 'rgba(0, 255, 255, 0.9)';
        ctx.font = 'bold 20px Arial';
        ctx.fillText(
            `${this.currentEmotion.toUpperCase()} ${Math.round(this.emotionConfidence * 100)}%`,
            10,
            this.canvas.height - 40
        );
    }

    /**
     * Get current emotion
     */
    getCurrentEmotion() {
        return {
            emotion: this.currentEmotion,
            confidence: this.emotionConfidence,
            headPosition: this.headPosition
        };
    }

    /**
     * Enable/disable landmark drawing
     */
    setDrawLandmarks(enabled) {
        this.drawLandmarks = enabled;
    }
}
