/**
 * DJ Control Panel - UI Rendering
 * Compact waveform display + FX controls
 * Clean, focused layout for track control
 */

class DJControlPanel {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas ? canvas.getContext('2d') : null;

        this.waveformHeight = 120;
        this.controlsHeight = 200;
        this.padding = 20;

        // Colors
        this.colors = {
            background: '#0a0a0a',
            waveform: '#8b5cf6',
            playhead: '#f59e0b',
            cuePoint: '#10b981',
            loop: '#3b82f6',
            fxActive: '#8b5cf6',
            fxInactive: '#374151',
            text: '#e5e7eb'
        };

        console.log('🎨 DJ Control Panel initialized');
    }

    /**
     * Draw complete control panel
     */
    draw(trackInfo, playbackState, fxState) {
        if (!this.ctx) return;

        // Clear canvas
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw sections
        const y = this.padding;

        // 1. Track info header
        this.drawTrackInfo(trackInfo, y);

        // 2. Waveform
        const waveformY = y + 40;
        this.drawWaveform(trackInfo.waveform, playbackState, waveformY);

        // 3. FX Controls
        const fxY = waveformY + this.waveformHeight + 20;
        this.drawFXControls(fxState, fxY);

        // 4. Playback controls
        const controlsY = fxY + 100;
        this.drawPlaybackControls(playbackState, controlsY);
    }

    /**
     * Draw track info header
     */
    drawTrackInfo(trackInfo, y) {
        const ctx = this.ctx;

        // Track name
        ctx.font = 'bold 16px monospace';
        ctx.fillStyle = this.colors.text;
        ctx.textAlign = 'left';
        ctx.fillText(trackInfo.name || 'No track loaded', this.padding, y);

        // BPM and time
        ctx.font = '14px monospace';
        ctx.textAlign = 'right';
        const info = `${trackInfo.bpm || 0} BPM  |  ${this.formatTime(trackInfo.currentTime)} / ${this.formatTime(trackInfo.duration)}`;
        ctx.fillText(info, this.canvas.width - this.padding, y);
    }

    /**
     * Draw compact waveform with playhead and cue points
     */
    drawWaveform(waveformData, playbackState, y) {
        if (!waveformData || waveformData.length === 0) {
            // Draw placeholder
            this.ctx.strokeStyle = this.colors.fxInactive;
            this.ctx.strokeRect(this.padding, y, this.canvas.width - this.padding * 2, this.waveformHeight);

            this.ctx.fillStyle = this.colors.text;
            this.ctx.font = '14px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Drag & drop audio file to load', this.canvas.width / 2, y + this.waveformHeight / 2);
            return;
        }

        const ctx = this.ctx;
        const width = this.canvas.width - this.padding * 2;
        const height = this.waveformHeight;
        const barWidth = width / waveformData.length;

        // Draw waveform bars
        ctx.save();
        ctx.translate(this.padding, y + height / 2);

        for (let i = 0; i < waveformData.length; i++) {
            const amplitude = waveformData[i] * height / 2;
            const x = i * barWidth;

            // Gradient based on position (visualize energy)
            const hue = 260; // Purple
            const lightness = 50 + (waveformData[i] * 30);
            ctx.fillStyle = `hsl(${hue}, 70%, ${lightness}%)`;

            ctx.fillRect(x, -amplitude, barWidth - 1, amplitude * 2);
        }

        ctx.restore();

        // Draw playhead
        if (playbackState.isPlaying || playbackState.currentPosition > 0) {
            const progress = playbackState.currentPosition / playbackState.duration;
            const playheadX = this.padding + (width * progress);

            ctx.strokeStyle = this.colors.playhead;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(playheadX, y);
            ctx.lineTo(playheadX, y + height);
            ctx.stroke();
        }

        // Draw cue points
        if (playbackState.cuePoints) {
            Object.values(playbackState.cuePoints).forEach((cueTime, index) => {
                const progress = cueTime / playbackState.duration;
                const cueX = this.padding + (width * progress);

                ctx.fillStyle = this.colors.cuePoint;
                ctx.beginPath();
                ctx.arc(cueX, y + height + 10, 4, 0, Math.PI * 2);
                ctx.fill();

                // Label
                ctx.font = '10px monospace';
                ctx.fillText(String.fromCharCode(65 + index), cueX - 3, y + height + 25);
            });
        }

        // Draw loop region
        if (playbackState.loop && playbackState.loop.enabled) {
            const startProgress = playbackState.loop.start / playbackState.duration;
            const endProgress = playbackState.loop.end / playbackState.duration;
            const loopX = this.padding + (width * startProgress);
            const loopWidth = width * (endProgress - startProgress);

            ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
            ctx.fillRect(loopX, y, loopWidth, height);

            ctx.strokeStyle = this.colors.loop;
            ctx.lineWidth = 2;
            ctx.strokeRect(loopX, y, loopWidth, height);
        }
    }

    /**
     * Draw FX control buttons
     */
    drawFXControls(fxState, y) {
        const ctx = this.ctx;
        const fxButtons = [
            { name: 'FILTER', key: 'filter' },
            { name: 'ECHO', key: 'echo' },
            { name: 'REVERB', key: 'reverb' },
            { name: 'PHASER', key: 'phaser' }
        ];

        const buttonWidth = 100;
        const buttonHeight = 60;
        const spacing = 20;
        const startX = this.padding;

        fxButtons.forEach((fx, index) => {
            const x = startX + (index * (buttonWidth + spacing));
            const isActive = fxState.activeEffects && fxState.activeEffects[fx.key];

            // Button background
            ctx.fillStyle = isActive ? this.colors.fxActive : this.colors.fxInactive;
            ctx.fillRect(x, y, buttonWidth, buttonHeight);

            // Button border
            ctx.strokeStyle = isActive ? '#a78bfa' : '#4b5563';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, buttonWidth, buttonHeight);

            // FX name
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(fx.name, x + buttonWidth / 2, y + 25);

            // Parameter value (if active)
            if (isActive && fxState.params && fxState.params[fx.key]) {
                const param = fxState.params[fx.key];
                let valueText = '';

                if (fx.key === 'filter') {
                    valueText = `${Math.round(param.cutoff)}Hz`;
                } else if (fx.key === 'echo') {
                    valueText = `${Math.round(param.wet * 100)}%`;
                } else if (fx.key === 'reverb') {
                    valueText = `${Math.round(param.wet * 100)}%`;
                } else if (fx.key === 'phaser') {
                    valueText = `${Math.round(param.depth * 100)}%`;
                }

                ctx.font = '10px monospace';
                ctx.fillText(valueText, x + buttonWidth / 2, y + 45);
            } else {
                ctx.font = '10px monospace';
                ctx.fillStyle = '#9ca3af';
                ctx.fillText('OFF', x + buttonWidth / 2, y + 45);
            }
        });
    }

    /**
     * Draw playback controls
     */
    drawPlaybackControls(playbackState, y) {
        const ctx = this.ctx;

        // Volume slider
        ctx.fillStyle = this.colors.text;
        ctx.font = '12px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('🔊 Volume:', this.padding, y);

        const sliderX = this.padding + 80;
        const sliderWidth = 200;
        const sliderHeight = 8;

        // Volume slider background
        ctx.fillStyle = this.colors.fxInactive;
        ctx.fillRect(sliderX, y - 6, sliderWidth, sliderHeight);

        // Volume slider fill
        const volumeWidth = sliderWidth * (playbackState.volume || 0.8);
        ctx.fillStyle = this.colors.fxActive;
        ctx.fillRect(sliderX, y - 6, volumeWidth, sliderHeight);

        // Volume percentage
        ctx.textAlign = 'left';
        ctx.fillStyle = this.colors.text;
        ctx.fillText(`${Math.round((playbackState.volume || 0.8) * 100)}%`, sliderX + sliderWidth + 10, y);

        // Loop status
        const loopX = sliderX + sliderWidth + 100;
        ctx.textAlign = 'left';
        const loopText = playbackState.loop && playbackState.loop.enabled ? '🔁 Loop: ON' : '🔁 Loop: OFF';
        ctx.fillStyle = playbackState.loop && playbackState.loop.enabled ? this.colors.loop : this.colors.fxInactive;
        ctx.fillText(loopText, loopX, y);

        // Cue status
        const cueX = loopX + 150;
        ctx.fillStyle = this.colors.cuePoint;
        ctx.fillText('📍 Cue: A', cueX, y);
    }

    /**
     * Draw gesture overlay (shows what gestures do)
     */
    drawGestureOverlay(gestures, y) {
        const ctx = this.ctx;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, y, this.canvas.width, 60);

        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('HAND GESTURES ACTIVE', this.canvas.width / 2, y + 20);

        ctx.font = '12px monospace';
        ctx.fillStyle = this.colors.text;

        const leftGesture = gestures.left || 'Filter Sweep';
        const rightGesture = gestures.right || 'Next Track';

        ctx.textAlign = 'left';
        ctx.fillText(`Left Hand: ${leftGesture}`, this.padding, y + 45);

        ctx.textAlign = 'right';
        ctx.fillText(`Right Hand: ${rightGesture}`, this.canvas.width - this.padding, y + 45);
    }

    /**
     * Format time as MM:SS
     */
    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Resize canvas
     */
    resize(width, height) {
        if (this.canvas) {
            this.canvas.width = width;
            this.canvas.height = height;
        }
    }
}
