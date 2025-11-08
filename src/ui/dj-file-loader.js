/**
 * DJ File Loader - Drag & Drop + File Browser
 * Load audio tracks (MP3/WAV/OGG) via drag & drop or file dialog
 */

class DJFileLoader {
    constructor(djEngine, bpmAnalyzer) {
        this.djEngine = djEngine;
        this.bpmAnalyzer = bpmAnalyzer;

        this.dropZone = null;
        this.fileInput = null;

        this.supportedFormats = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/x-m4a'];

        this.onTrackLoaded = null; // Callback when track is loaded

        console.log('📁 DJ File Loader initialized');
    }

    /**
     * Setup drag & drop zone
     * @param {HTMLElement} element - Drop zone element
     */
    setupDropZone(element) {
        this.dropZone = element;

        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            element.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        // Visual feedback
        element.addEventListener('dragenter', () => {
            element.classList.add('drag-over');
        });

        element.addEventListener('dragleave', () => {
            element.classList.remove('drag-over');
        });

        // Handle drop
        element.addEventListener('drop', async (e) => {
            element.classList.remove('drag-over');

            const files = Array.from(e.dataTransfer.files);
            const audioFiles = files.filter(file => this.isAudioFile(file));

            if (audioFiles.length > 0) {
                await this.loadFile(audioFiles[0]);
            } else {
                console.warn('⚠️ No valid audio files dropped');
                alert('Please drop an audio file (MP3, WAV, or OGG)');
            }
        });

        console.log('✅ Drop zone setup complete');
    }

    /**
     * Setup file browser input
     * @param {HTMLInputElement} input - File input element
     */
    setupFileInput(input) {
        this.fileInput = input;

        input.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                await this.loadFile(files[0]);
            }
        });

        console.log('✅ File input setup complete');
    }

    /**
     * Load audio file
     * @param {File} file - Audio file
     * @param {String} deck - 'A' or 'B' (null = active deck)
     */
    async loadFile(file, deck = null) {
        if (!this.isAudioFile(file)) {
            console.warn('⚠️ Invalid file type:', file.type);
            alert('Please select an audio file (MP3, WAV, or OGG)');
            return;
        }

        console.log('📁 Loading file:', file.name);

        try {
            // Show loading indicator
            this.showLoading(true);

            // Load track into DJ engine
            const result = await this.djEngine.loadTrack(file, deck);

            if (!result.success) {
                throw new Error(result.error);
            }

            // BPM Analysis DISABLED - using default 120 BPM for instant loading
            const trackInfo = this.djEngine.getTrackInfo(result.deck);
            if (trackInfo && trackInfo.audioBuffer) {
                console.log('🎵 BPM analysis skipped - setting default 120 BPM');

                // Set default BPM for instant loading
                trackInfo.bpm = 120;
                trackInfo.beatGrid = null;

                // Sync effects to default BPM if FX rack available
                if (this.djEngine.fxRack) {
                    this.djEngine.fxRack.syncToBPM(120);
                }
            }

            // Hide loading indicator
            this.showLoading(false);

            // Trigger callback
            if (this.onTrackLoaded) {
                this.onTrackLoaded({
                    deck: result.deck,
                    name: result.name,
                    duration: result.duration,
                    bpm: trackInfo.bpm,
                    waveform: trackInfo.waveform
                });
            }

            console.log(`✅ Track loaded successfully to Deck ${result.deck}`);

        } catch (error) {
            console.error('❌ Failed to load file:', error);
            this.showLoading(false);
            alert(`Failed to load track: ${error.message}`);
        }
    }

    /**
     * Check if file is supported audio format
     */
    isAudioFile(file) {
        // Check MIME type
        if (this.supportedFormats.includes(file.type)) {
            return true;
        }

        // Check file extension as fallback
        const ext = file.name.split('.').pop().toLowerCase();
        return ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(ext);
    }

    /**
     * Open file browser dialog
     */
    openFileBrowser() {
        if (this.fileInput) {
            this.fileInput.click();
        }
    }

    /**
     * Show/hide loading indicator
     */
    showLoading(show) {
        const loader = document.getElementById('djLoadingIndicator');
        if (loader) {
            loader.style.display = show ? 'block' : 'none';
        }

        // Update drop zone text
        if (this.dropZone) {
            const text = this.dropZone.querySelector('.drop-zone-text');
            if (text) {
                text.textContent = show ? 'Loading track...' : 'Drag & drop audio file or click to browse';
            }
        }
    }

    /**
     * Get track metadata (for display)
     */
    getMetadata(file) {
        return {
            name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
            size: this.formatFileSize(file.size),
            type: file.type || 'Unknown'
        };
    }

    /**
     * Format file size
     */
    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    }

    /**
     * Create loading indicator HTML (if not exists)
     */
    createLoadingIndicator() {
        if (document.getElementById('djLoadingIndicator')) return;

        const loader = document.createElement('div');
        loader.id = 'djLoadingIndicator';
        loader.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: #8b5cf6;
            padding: 30px 50px;
            border-radius: 10px;
            border: 2px solid #8b5cf6;
            font-family: monospace;
            font-size: 16px;
            z-index: 10000;
            display: none;
        `;
        loader.innerHTML = `
            <div style="text-align: center;">
                <div class="spinner" style="
                    border: 4px solid #374151;
                    border-top: 4px solid #8b5cf6;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 15px;
                "></div>
                <div>Loading track...</div>
                <div style="font-size: 12px; color: #9ca3af; margin-top: 10px;">Decoding audio...</div>
            </div>
        `;

        // Add spinner animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(loader);
    }

    /**
     * Set callback for when track is loaded
     */
    onLoad(callback) {
        this.onTrackLoaded = callback;
    }
}
