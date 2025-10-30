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

        // Hand audio settings
        this.handVolume = 0.7; // 70% default
        this.currentEngine = 'tonejs'; // tonejs, wad, dirt
        this.currentPreset = 'sine'; // Current sound preset
        this.playbackMode = 'note'; // note, legato, arpeggio, chord
        this.handInteractionMode = 'layer'; // layer (additional) or control (generative)

        // Performance
        this.frameCount = 0;
        this.fps = 0;
        this.lastFpsUpdate = Date.now();

        // Setup UI controls
        this.setupHandAudioControls();

        console.log('👋 Hand Tracking initialized');
    }

    /**
     * Setup hand audio control UI elements
     */
    setupHandAudioControls() {
        // Hand Volume Slider
        const handVolumeSlider = document.getElementById('handVolumeSlider');
        const handVolumeValue = document.getElementById('handVolumeValue');

        if (handVolumeSlider && handVolumeValue) {
            handVolumeSlider.addEventListener('input', (e) => {
                this.handVolume = parseInt(e.target.value) / 100;
                handVolumeValue.textContent = `${e.target.value}%`;
                console.log('🎚️ Hand volume:', this.handVolume);
            });
        }

        // Synth Engine Selector & Sound Preset Selector
        const handEngineSelect = document.getElementById('handEngineSelect');
        const handPresetSelect = document.getElementById('handPresetSelect');
        const activePreset = document.getElementById('activePreset');

        if (handEngineSelect && handPresetSelect) {
            handEngineSelect.addEventListener('change', (e) => {
                this.currentEngine = e.target.value;
                console.log('🎛️ Switched engine to:', this.currentEngine);

                // Update preset dropdown based on engine
                this.updatePresetOptions(handPresetSelect);

                // Update active preset display
                this.updateActivePresetDisplay();
            });
        }

        if (handPresetSelect && activePreset) {
            handPresetSelect.addEventListener('change', (e) => {
                this.currentPreset = e.target.value;

                // Update visual indicator
                this.updateActivePresetDisplay();

                console.log('🎹 Changed preset to:', this.currentPreset);
            });
        }

        // Playback Mode Selector
        const handModeSelect = document.getElementById('handModeSelect');

        if (handModeSelect) {
            handModeSelect.addEventListener('change', (e) => {
                this.playbackMode = e.target.value;
                this.updateActivePresetDisplay();
                console.log('🎵 Changed playback mode to:', this.playbackMode);
            });
        }

        // Hand Mode Toggle Buttons
        const handModeLayer = document.getElementById('handModeLayer');
        const handModeControl = document.getElementById('handModeControl');

        console.log('🔍 DEBUG: handModeLayer found?', !!handModeLayer);
        console.log('🔍 DEBUG: handModeControl found?', !!handModeControl);

        if (handModeLayer && handModeControl) {
            console.log('✅ Hand mode toggle buttons found, adding event listeners');

            // Layer Mode Handler
            const activateLayerMode = (e) => {
                console.log('🔵 Layer button clicked!', e);
                e.preventDefault();
                e.stopPropagation();
                this.handInteractionMode = 'layer';
                handModeLayer.classList.add('active');
                handModeControl.classList.remove('active');
                console.log('🎵 Hand Mode: Additional Layer (plays alongside generative music)');

                // Resume generative music if it was paused
                if (this.musicMapper && this.musicMapper.musicEngine) {
                    this.musicMapper.musicEngine.resume();
                }
            };

            // Control Mode Handler
            const activateControlMode = (e) => {
                console.log('🔵 Control button clicked!', e);
                e.preventDefault();
                e.stopPropagation();
                this.handInteractionMode = 'control';
                handModeControl.classList.add('active');
                handModeLayer.classList.remove('active');
                console.log('🎛️ Hand Mode: Control Generative (controls/pauses generative music)');
            };

            // Add multiple event types for better compatibility
            handModeLayer.addEventListener('click', activateLayerMode, true);
            handModeLayer.addEventListener('mousedown', activateLayerMode, true);
            handModeLayer.addEventListener('touchstart', activateLayerMode, true);

            handModeControl.addEventListener('click', activateControlMode, true);
            handModeControl.addEventListener('mousedown', activateControlMode, true);
            handModeControl.addEventListener('touchstart', activateControlMode, true);

            console.log('✅ Event listeners attached with capture phase');
        } else {
            console.error('❌ Hand mode toggle buttons not found in DOM!');
        }
    }

    /**
     * Update Active Preset Display with sound preset name
     */
    updateActivePresetDisplay() {
        const activePresetText = document.getElementById('activePresetText');
        const activePreset = document.getElementById('activePreset');
        const handScaleOverlay = document.getElementById('handScaleOverlay');

        // Update scale/key/mode overlay on video
        if (handScaleOverlay) {
            const scale = this.musicMapper && this.musicMapper.chordEngine
                ? this.musicMapper.chordEngine.getCurrentScale()
                : 'phrygian';
            const key = this.musicMapper && this.musicMapper.chordEngine
                ? this.musicMapper.chordEngine.getCurrentRoot()
                : 'C';

            const scaleName = scale.charAt(0).toUpperCase() + scale.slice(1);
            const modeNames = {
                'note': 'Note',
                'legato': 'Legato',
                'arpeggio': 'Arpeggio',
                'chord': 'Chord'
            };
            const modeName = modeNames[this.playbackMode] || 'Note';

            handScaleOverlay.textContent = `${key} ${scaleName} • ${modeName}`;
        }

        // Update active preset with sound preset name
        if (activePresetText && activePreset) {
            const handPresetSelect = document.getElementById('handPresetSelect');
            if (handPresetSelect) {
                const selectedOption = handPresetSelect.options[handPresetSelect.selectedIndex];
                const presetName = selectedOption.text;
                const groupLabel = selectedOption.parentElement.label;

                // Update preset name
                activePresetText.textContent = presetName;

                // Update icon and color based on category
                let icon, color;
                if (groupLabel.includes('Pad')) {
                    icon = '🎹'; color = '#8b5cf6';
                } else if (groupLabel.includes('Lead')) {
                    icon = '⚡'; color = '#3b82f6';
                } else if (groupLabel.includes('Bass')) {
                    icon = '🔊'; color = '#ef4444';
                } else {
                    icon = '✨'; color = '#10b981';
                }

                activePreset.querySelector('span').textContent = icon;
                activePreset.style.borderLeftColor = color;
            }
        }
    }

    /**
     * Update preset dropdown options based on selected engine
     */
    updatePresetOptions(handPresetSelect) {
        if (!handPresetSelect) return;

        // Clear existing options
        handPresetSelect.innerHTML = '';

        if (this.currentEngine === 'tonejs') {
            // Tone.js oscillator presets (Celestial)
            handPresetSelect.innerHTML = `
                <optgroup label="🎹 Pad Synth">
                    <option value="sine" selected>Smooth Sine</option>
                    <option value="triangle">Warm Triangle</option>
                    <option value="sawtooth">Rich Sawtooth</option>
                    <option value="square">Hollow Square</option>
                    <option value="fatsine">Fat Sine</option>
                    <option value="fatsawtooth">Fat Sawtooth</option>
                </optgroup>
                <optgroup label="⚡ Lead Synth">
                    <option value="sine">Pure Sine</option>
                    <option value="triangle">Soft Triangle</option>
                    <option value="sawtooth">Bright Sawtooth</option>
                    <option value="square">Digital Square</option>
                    <option value="fatsawtooth">Fat Sawtooth</option>
                </optgroup>
                <optgroup label="🔊 Bass Synth">
                    <option value="sine">Deep Sine</option>
                    <option value="fatsine">Fat Sine</option>
                    <option value="triangle">Round Triangle</option>
                    <option value="sawtooth">Aggressive Saw</option>
                    <option value="square">Sub Square</option>
                </optgroup>
                <optgroup label="🎵 Arp Synth">
                    <option value="sine">Smooth Sine</option>
                    <option value="triangle">Soft Triangle</option>
                    <option value="sawtooth">Sharp Sawtooth</option>
                    <option value="square">Classic Square</option>
                </optgroup>
            `;
            this.currentPreset = 'sine';
        } else if (this.currentEngine === 'wad') {
            // WAD synth presets (Magma)
            handPresetSelect.innerHTML = `
                <optgroup label="🎹 Pad Sound">
                    <option value="warmPad" selected>Warm Pad</option>
                    <option value="spacePad">Space Pad</option>
                    <option value="dreamPad">Dream Pad</option>
                    <option value="atmosphericPad">Atmospheric</option>
                    <option value="drone">Drone</option>
                    <option value="ghost">Ghost</option>
                </optgroup>
                <optgroup label="⚡ Lead Sound">
                    <option value="brightLead">Bright Lead</option>
                    <option value="analogLead">Analog Lead</option>
                </optgroup>
                <optgroup label="🔊 Bass Sound">
                    <option value="deepBass">Deep Bass</option>
                    <option value="subBass">Sub Bass</option>
                    <option value="acidBass">Acid Bass</option>
                </optgroup>
                <optgroup label="🎵 Arp Sound">
                    <option value="digitalArp">Digital Arp</option>
                    <option value="classicArp">Classic Arp</option>
                    <option value="electricPiano">Electric Piano</option>
                    <option value="pluck">Pluck</option>
                </optgroup>
            `;
            this.currentPreset = 'warmPad';
        } else if (this.currentEngine === 'dirt') {
            // Dirt sample banks (Chaos)
            handPresetSelect.innerHTML = `
                <optgroup label="🎹 Pad Samples">
                    <option value="pad" selected>Pad</option>
                    <option value="breath">Breath</option>
                    <option value="cosmicg">Cosmicg</option>
                    <option value="feel">Feel</option>
                    <option value="moog">Moog</option>
                    <option value="space">Space</option>
                    <option value="wind">Wind</option>
                </optgroup>
                <optgroup label="⚡ Lead Samples">
                    <option value="arpy">Arpy</option>
                    <option value="bleep">Bleep</option>
                    <option value="hoover">Hoover</option>
                    <option value="sax">Sax</option>
                    <option value="trump">Trumpet</option>
                </optgroup>
                <optgroup label="🔊 Bass Samples">
                    <option value="bass">Bass</option>
                    <option value="bass3">Bass 3</option>
                    <option value="jungbass">Jungle Bass</option>
                    <option value="wobble">Wobble</option>
                </optgroup>
                <optgroup label="🎵 Arp Samples">
                    <option value="arp">Arp</option>
                    <option value="blip">Blip</option>
                    <option value="click">Click</option>
                    <option value="glitch">Glitch</option>
                </optgroup>
            `;
            this.currentPreset = 'pad';
        }

        console.log(`✅ Updated presets for ${this.currentEngine} engine`);
    }

    /**
     * Initialize MediaPipe Hands
     */
    async init() {
        try {
            console.log('📦 Loading MediaPipe Hands model...');
            console.log('🔍 DEBUG: window.mpVision initially:', typeof window.mpVision);
            console.log('🔍 DEBUG: Checking all window properties...');

            // Check what's available in window
            const visionKeys = Object.keys(window).filter(k =>
                k.toLowerCase().includes('vision') ||
                k.toLowerCase().includes('mediapipe') ||
                k.toLowerCase().includes('hand')
            );
            console.log('🔍 DEBUG: Window keys related to vision/mediapipe/hand:', visionKeys);

            // Wait for MediaPipe library to load
            let attempts = 0;
            while (typeof window.mpVision === 'undefined' && attempts < 50) {
                if (attempts % 10 === 0) {
                    console.log(`🔍 DEBUG: Waiting for MediaPipe... attempt ${attempts}/50`);
                }
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }

            console.log(`🔍 DEBUG: After waiting ${attempts} attempts, window.mpVision is:`, typeof window.mpVision);

            // Check if MediaPipe is available
            if (typeof window.mpVision === 'undefined') {
                console.error('❌ MediaPipe not found after waiting');
                console.log('🔍 DEBUG: Final check - all window keys:', Object.keys(window).filter(k => !k.startsWith('webkit')).slice(0, 100));
                throw new Error('MediaPipe vision library not loaded. Please refresh the page.');
            }

            console.log('✅ window.mpVision found:', window.mpVision);
            const { HandLandmarker, FilesetResolver } = window.mpVision;
            console.log('🔍 DEBUG: HandLandmarker:', typeof HandLandmarker);
            console.log('🔍 DEBUG: FilesetResolver:', typeof FilesetResolver);

            console.log('📦 Loading vision tasks WASM...');

            // Load the MediaPipe vision module
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
            );

            console.log('📦 Creating hand landmarker...');

            // Create hand landmarker with LOCAL model
            this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: 'models/hand_landmarker.task',
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

        // Send to music mapper with volume, preset, playback mode, and interaction mode settings
        this.musicMapper.processGestures(leftGesture, rightGesture, velocities, {
            volume: this.handVolume,
            engine: this.currentEngine,
            preset: this.currentPreset,
            mode: this.playbackMode,
            interactionMode: this.handInteractionMode
        });
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
            // Draw video naturally without mirror flip
            this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
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
            x: landmark.x * this.canvas.width, // Natural coordinates (no flip)
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
        const stateText = `${state.scale.toUpperCase()} | ${state.playbackMode.toUpperCase()}`;
        this.ctx.strokeText(stateText, 10, this.canvas.height - 20);
        this.ctx.fillText(stateText, 10, this.canvas.height - 20);

        // Octave display (large, prominent)
        this.ctx.fillStyle = '#00ffff';
        this.ctx.font = 'bold 32px monospace';
        const octaveText = `OCT ${state.octave}`;
        const octaveWidth = this.ctx.measureText(octaveText).width;
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 4;
        this.ctx.strokeText(octaveText, this.canvas.width - octaveWidth - 15, this.canvas.height - 15);
        this.ctx.fillText(octaveText, this.canvas.width - octaveWidth - 15, this.canvas.height - 15);

        // Hand interaction mode (top right)
        const modeIcon = this.handInteractionMode === 'layer' ? '🎵' : '🎛️';
        const modeText = this.handInteractionMode === 'layer' ? 'LAYER' : 'CONTROL';
        const modeColor = this.handInteractionMode === 'layer' ? '#00ff00' : '#ff8800';

        this.ctx.fillStyle = modeColor;
        this.ctx.font = 'bold 14px monospace';
        const modeString = `${modeIcon} ${modeText}`;
        const modeWidth = this.ctx.measureText(modeString).width;
        this.ctx.strokeText(modeString, this.canvas.width - modeWidth - 10, 30);
        this.ctx.fillText(modeString, this.canvas.width - modeWidth - 10, 30);
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
