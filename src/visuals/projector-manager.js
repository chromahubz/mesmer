/**
 * Projector Manager - Handles dual-window projector mode for live performances
 * Sends canvas frames to external projector window via postMessage
 */
class ProjectorManager {
    constructor(mainCanvas) {
        this.mainCanvas = mainCanvas;
        this.projectorWindow = null;
        this.isActive = false;
        this.frameRate = 30; // FPS for projector updates
        this.frameInterval = 1000 / this.frameRate;
        this.lastFrameTime = 0;
        this.animationFrameId = null;

        console.log('🎬 Projector Manager initialized');
    }

    /**
     * Open projector window
     */
    openProjector() {
        if (this.projectorWindow && !this.projectorWindow.closed) {
            console.warn('⚠️ Projector window already open');
            this.projectorWindow.focus();
            return;
        }

        // Open new window with projector view
        const width = 1920;
        const height = 1080;
        const left = window.screenX + window.outerWidth;
        const top = window.screenY;

        this.projectorWindow = window.open(
            'projector.html',
            'MesmerProjector',
            `width=${width},height=${height},left=${left},top=${top}`
        );

        if (!this.projectorWindow) {
            console.error('❌ Failed to open projector window (popup blocked?)');
            alert('Projector window blocked! Please allow popups for this site.');
            return;
        }

        console.log('✅ Projector window opened');
        console.log('💡 TIP: Drag the projector window to your external display/projector');
        console.log('💡 TIP: Click "Fullscreen" button in projector window for best experience');
        this.isActive = true;

        // Wait for projector window to load, then start sending frames
        this.projectorWindow.addEventListener('load', () => {
            console.log('✅ Projector window loaded - starting frame sync');
            this.startFrameSync();
        });

        // Handle window close
        const checkClosed = setInterval(() => {
            if (this.projectorWindow && this.projectorWindow.closed) {
                clearInterval(checkClosed);
                this.closeProjector();
            }
        }, 1000);
    }

    /**
     * Close projector window
     */
    closeProjector() {
        if (this.projectorWindow && !this.projectorWindow.closed) {
            this.projectorWindow.close();
        }

        this.projectorWindow = null;
        this.isActive = false;
        this.stopFrameSync();

        console.log('🛑 Projector window closed');
    }

    /**
     * Toggle projector mode
     */
    toggle() {
        if (this.isActive) {
            this.closeProjector();
        } else {
            this.openProjector();
        }
    }

    /**
     * Start syncing frames to projector
     */
    startFrameSync() {
        if (this.animationFrameId) {
            console.warn('⚠️ Frame sync already running');
            return;
        }

        console.log(`🎥 Starting frame sync at ${this.frameRate} FPS`);
        this.syncFrame();
    }

    /**
     * Stop syncing frames
     */
    stopFrameSync() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
            console.log('⏸️ Frame sync stopped');
        }
    }

    /**
     * Sync frame to projector (called on animation frame)
     */
    syncFrame() {
        if (!this.isActive || !this.projectorWindow || this.projectorWindow.closed) {
            this.stopFrameSync();
            return;
        }

        const now = performance.now();
        const elapsed = now - this.lastFrameTime;

        // Throttle to target frame rate
        if (elapsed >= this.frameInterval) {
            this.sendFrame();
            this.lastFrameTime = now - (elapsed % this.frameInterval);
        }

        this.animationFrameId = requestAnimationFrame(() => this.syncFrame());
    }

    /**
     * Send current canvas frame to projector window
     */
    sendFrame() {
        if (!this.mainCanvas || !this.projectorWindow || this.projectorWindow.closed) {
            if (!this._frameErrorLogged) {
                console.warn('⚠️ Cannot send frame: mainCanvas or projectorWindow not available');
                this._frameErrorLogged = true;
            }
            return;
        }

        try {
            // Get canvas context
            const ctx = this.mainCanvas.getContext('2d');
            if (!ctx) {
                console.warn('⚠️ Cannot get canvas context');
                return;
            }

            // Verify canvas has content (not all black)
            const width = this.mainCanvas.width;
            const height = this.mainCanvas.height;

            if (width === 0 || height === 0) {
                if (!this._sizeErrorLogged) {
                    console.warn('⚠️ Canvas has zero dimensions:', width, 'x', height);
                    this._sizeErrorLogged = true;
                }
                return;
            }

            // Get image data from canvas
            const imageData = ctx.getImageData(0, 0, width, height);

            // Send to projector window via postMessage
            // Note: Sending ImageData directly is more efficient than converting to base64
            this.projectorWindow.postMessage({
                type: 'FRAME_DATA',
                data: {
                    data: Array.from(imageData.data), // Convert Uint8ClampedArray to regular array
                    width: imageData.width,
                    height: imageData.height
                }
            }, '*');

            // Log first successful frame
            if (!this._firstFrameSent) {
                console.log(`✅ First frame sent to projector: ${width}x${height}`);
                this._firstFrameSent = true;
            }

        } catch (error) {
            console.error('❌ Error sending frame to projector:', error);
            console.error('   Canvas dimensions:', this.mainCanvas.width, 'x', this.mainCanvas.height);
        }
    }

    /**
     * Update frame rate
     */
    setFrameRate(fps) {
        this.frameRate = Math.max(1, Math.min(60, fps));
        this.frameInterval = 1000 / this.frameRate;
        console.log(`🎥 Frame rate updated to ${this.frameRate} FPS`);
    }

    /**
     * Check if projector is active
     */
    isProjectorActive() {
        return this.isActive && this.projectorWindow && !this.projectorWindow.closed;
    }
}

// Export for use in app.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProjectorManager;
}
