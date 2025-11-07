/**
 * DJ Audio Visualizer - Audio-Reactive Visuals
 * Uses remaining screen space for spectrum and particle effects
 * Syncs with active track playback and FX
 */

class DJAudioVisualizer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas ? canvas.getContext('2d') : null;

        this.analyser = null;
        this.frequencyData = null;
        this.dataArray = null;

        // Visualization style
        this.style = 'spectrum'; // 'spectrum', 'waveform', 'circular', 'particles'

        // Colors
        this.colors = {
            bass: '#8b5cf6',
            mid: '#3b82f6',
            treble: '#10b981',
            background: '#0a0a0a'
        };

        // Particle system
        this.particles = [];
        this.maxParticles = 100;

        console.log('🎨 DJ Audio Visualizer initialized');
    }

    /**
     * Connect to audio analyzer
     * @param {AnalyserNode} analyser - Web Audio API analyser node
     */
    connect(analyser) {
        this.analyser = analyser;
        this.analyser.fftSize = 256;
        this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

        console.log('✅ Audio analyzer connected');
    }

    /**
     * Draw visualization
     * @param {Object} fxState - Active FX state for reactive visuals
     */
    draw(fxState = {}) {
        if (!this.ctx || !this.analyser) return;

        // Get audio data
        this.analyser.getByteFrequencyData(this.frequencyData);
        this.analyser.getByteTimeDomainData(this.dataArray);

        // Clear canvas
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw visualization based on style
        switch (this.style) {
            case 'spectrum':
                this.drawSpectrum(fxState);
                break;
            case 'waveform':
                this.drawWaveform(fxState);
                break;
            case 'circular':
                this.drawCircular(fxState);
                break;
            case 'particles':
                this.drawParticles(fxState);
                break;
        }

        // Add FX-reactive overlays
        this.drawFXOverlays(fxState);
    }

    /**
     * Draw spectrum analyzer (frequency bars)
     */
    drawSpectrum(fxState) {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        const barCount = 64; // Number of bars
        const barWidth = width / barCount;

        for (let i = 0; i < barCount; i++) {
            const dataIndex = Math.floor(i * this.frequencyData.length / barCount);
            const amplitude = this.frequencyData[dataIndex] / 255;

            // Map frequency to color (bass=purple, mid=blue, treble=green)
            let color;
            if (i < barCount / 3) {
                color = this.colors.bass;
            } else if (i < barCount * 2 / 3) {
                color = this.colors.mid;
            } else {
                color = this.colors.treble;
            }

            // Filter FX changes color
            if (fxState.filter) {
                if (fxState.filterType === 'highpass') {
                    // High-pass = boost treble visualization
                    if (i >= barCount * 2 / 3) {
                        color = '#f59e0b'; // Orange for high-pass
                    }
                } else if (fxState.filterType === 'lowpass') {
                    // Low-pass = boost bass visualization
                    if (i < barCount / 3) {
                        color = '#ef4444'; // Red for low-pass
                    }
                }
            }

            const barHeight = amplitude * height * 0.8;
            const x = i * barWidth;
            const y = height - barHeight;

            ctx.fillStyle = color;
            ctx.fillRect(x, y, barWidth - 2, barHeight);

            // Glow effect
            ctx.shadowBlur = 20;
            ctx.shadowColor = color;
            ctx.fillRect(x, y, barWidth - 2, barHeight);
            ctx.shadowBlur = 0;
        }
    }

    /**
     * Draw waveform visualization
     */
    drawWaveform(fxState) {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        ctx.strokeStyle = this.colors.bass;
        ctx.lineWidth = 2;
        ctx.beginPath();

        const sliceWidth = width / this.dataArray.length;
        let x = 0;

        for (let i = 0; i < this.dataArray.length; i++) {
            const v = this.dataArray[i] / 255.0;
            const y = v * height;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        ctx.stroke();

        // Echo FX adds trailing effect
        if (fxState.echo) {
            ctx.globalAlpha = 0.3;
            ctx.strokeStyle = this.colors.mid;
            ctx.stroke();
            ctx.globalAlpha = 1.0;
        }
    }

    /**
     * Draw circular visualization
     */
    drawCircular(fxState) {
        const ctx = this.ctx;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(this.canvas.width, this.canvas.height) / 3;

        const bars = 128;
        const angleStep = (Math.PI * 2) / bars;

        for (let i = 0; i < bars; i++) {
            const dataIndex = Math.floor(i * this.frequencyData.length / bars);
            const amplitude = this.frequencyData[dataIndex] / 255;

            const angle = i * angleStep;
            const x1 = centerX + Math.cos(angle) * radius;
            const y1 = centerY + Math.sin(angle) * radius;

            const barLength = amplitude * radius;
            const x2 = centerX + Math.cos(angle) * (radius + barLength);
            const y2 = centerY + Math.sin(angle) * (radius + barLength);

            // Color based on frequency
            const hue = (i / bars) * 360;
            ctx.strokeStyle = `hsl(${hue}, 70%, 60%)`;
            ctx.lineWidth = 3;

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }

        // Reverb FX adds expanding circles
        if (fxState.reverb) {
            ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * 1.5, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    /**
     * Draw particle system
     */
    drawParticles(fxState) {
        const ctx = this.ctx;

        // Create particles based on audio energy
        const avgFrequency = this.getAverageFrequency();
        if (avgFrequency > 100 && this.particles.length < this.maxParticles) {
            this.createParticle();
        }

        // Update and draw particles
        this.particles = this.particles.filter(particle => {
            particle.update();
            particle.draw(ctx);
            return particle.life > 0;
        });
    }

    /**
     * Create new particle
     */
    createParticle() {
        this.particles.push({
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: 100,
            color: this.colors.bass,
            size: Math.random() * 5 + 2,

            update() {
                this.x += this.vx;
                this.y += this.vy;
                this.life -= 1;
            },

            draw(ctx) {
                ctx.fillStyle = this.color;
                ctx.globalAlpha = this.life / 100;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }
        });
    }

    /**
     * Draw FX-reactive overlays
     */
    drawFXOverlays(fxState) {
        const ctx = this.ctx;

        // Echo = Trailing effect
        if (fxState.echo) {
            ctx.fillStyle = 'rgba(59, 130, 246, 0.05)';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Phaser = Wavy distortion
        if (fxState.phaser) {
            const time = Date.now() / 1000;
            ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath();

            for (let x = 0; x < this.canvas.width; x += 10) {
                const y = this.canvas.height / 2 + Math.sin(x * 0.02 + time * 2) * 50;
                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
        }
    }

    /**
     * Get average frequency (audio energy)
     */
    getAverageFrequency() {
        if (!this.frequencyData) return 0;

        let sum = 0;
        for (let i = 0; i < this.frequencyData.length; i++) {
            sum += this.frequencyData[i];
        }
        return sum / this.frequencyData.length;
    }

    /**
     * Set visualization style
     */
    setStyle(style) {
        const validStyles = ['spectrum', 'waveform', 'circular', 'particles'];
        if (validStyles.includes(style)) {
            this.style = style;
            console.log(`🎨 Visualization style: ${style}`);
        }
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
