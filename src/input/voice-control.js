/**
 * Voice Control Engine
 * Hybrid system using Web Speech API for real-time commands
 * and preparing for Whisper integration for complex queries
 */

class VoiceControl {
    constructor(app) {
        this.app = app;
        this.musicEngine = app.musicEngine;
        this.recognition = null;
        this.isListening = false;
        this.isEnabled = false;

        // Command history
        this.commandHistory = [];
        this.maxHistoryLength = 10;

        // Voice feedback (optional TTS)
        this.synthesis = window.speechSynthesis;
        this.voiceFeedbackEnabled = true;

        // Special modes
        this.beatboxMode = false;
        this.pitchMode = false;
        this.audioAnalyzer = null;

        // Command categories
        this.commands = {
            simple: this.initSimpleCommands(),
            parameters: this.initParameterCommands(),
            presets: this.initPresetCommands(),
            instruments: this.initInstrumentCommands(),
            visuals: this.initVisualCommands(),
            natural: this.initNaturalLanguagePatterns()
        };

        console.log('🎤 Voice Control Engine initialized');
    }

    /**
     * Initialize Web Speech API recognition
     */
    init() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.error('⚠️ Speech recognition not supported in this browser');
            return false;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();

        // Configuration
        this.recognition.continuous = true;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 3;

        // Event handlers
        this.recognition.onstart = () => this.onStart();
        this.recognition.onend = () => this.onEnd();
        this.recognition.onresult = (event) => this.onResult(event);
        this.recognition.onerror = (event) => this.onError(event);

        console.log('✅ Web Speech API initialized');
        return true;
    }

    /**
     * Start listening for voice commands
     */
    start() {
        if (!this.recognition) {
            if (!this.init()) {
                return;
            }
        }

        // Prevent starting if already listening
        if (this.isListening) {
            console.log('🎤 Already listening, skipping start');
            return;
        }

        try {
            this.recognition.start();
            this.isListening = true;
            this.isEnabled = true;
            this.updateUI('listening');
            console.log('🎤 Voice control started');
        } catch (error) {
            console.error('Error starting voice recognition:', error);
            this.isListening = false;
        }
    }

    /**
     * Stop listening
     */
    stop() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
            this.updateUI('stopped');
            console.log('🎤 Voice control stopped');
        }
    }

    /**
     * Toggle voice control
     */
    toggle() {
        if (this.isListening) {
            this.stop();
        } else {
            this.start();
        }
    }

    /**
     * Handle recognition start
     */
    onStart() {
        console.log('🎤 Listening...');
        this.updateUI('listening');
    }

    /**
     * Handle recognition end
     */
    onEnd() {
        console.log('🎤 Stopped listening');
        this.isListening = false; // Mark as not listening

        // Auto-restart if enabled
        if (this.isEnabled) {
            setTimeout(() => {
                this.start(); // Use start() method which has safety checks
            }, 100);
        } else {
            this.updateUI('stopped');
        }
    }

    /**
     * Handle recognition result
     */
    onResult(event) {
        const results = event.results;
        const lastResult = results[results.length - 1];

        if (lastResult.isFinal) {
            const transcript = lastResult[0].transcript.trim().toUpperCase();
            const confidence = lastResult[0].confidence;

            console.log(`🎤 Heard: "${transcript}" (confidence: ${(confidence * 100).toFixed(0)}%)`);

            // Show visual feedback
            this.showTranscript(transcript, confidence);

            // Process command
            this.processCommand(transcript, confidence);

            // Add to history
            this.addToHistory(transcript, confidence);
        }
    }

    /**
     * Handle recognition errors
     */
    onError(event) {
        console.error('🎤 Recognition error:', event.error);

        if (event.error === 'no-speech') {
            // Ignore no-speech errors (normal silence)
            return;
        }

        // Network errors - these are common with Google's API
        if (event.error === 'network') {
            console.warn('🎤 Network issue - Speech recognition temporarily unavailable, will auto-retry');
            this.isListening = false; // Mark as not listening
            // Don't manually restart - let onEnd() handle the restart naturally
            return;
        }

        // Aborted errors
        if (event.error === 'aborted') {
            console.log('🎤 Recognition aborted');
            this.isListening = false;
            return;
        }

        // Other errors - show error state
        this.updateUI('error', event.error);
        this.isListening = false;
    }

    /**
     * Process voice command
     */
    async processCommand(transcript, confidence) {
        console.log(`🎤 Processing command: "${transcript}"`);

        // Try exact matches first
        let handled = false;

        // 1. Simple trigger commands
        handled = await this.trySimpleCommands(transcript);
        if (handled) return;

        // 2. Parameter commands (with numbers)
        handled = this.tryParameterCommands(transcript);
        if (handled) return;

        // 3. Preset and sound selection
        handled = this.tryPresetCommands(transcript);
        if (handled) return;

        // 4. Instrument commands
        handled = this.tryInstrumentCommands(transcript);
        if (handled) return;

        // 5. Visual commands
        handled = this.tryVisualCommands(transcript);
        if (handled) return;

        // 6. Natural language patterns
        handled = this.tryNaturalLanguage(transcript);
        if (handled) return;

        // Command not recognized
        console.log('❓ Command not recognized:', transcript);
        this.speak('Command not recognized');
        this.showFeedback(`❓ Unknown: "${transcript}"`, 'warning');
    }

    /**
     * Initialize simple trigger commands
     */
    initSimpleCommands() {
        return {
            'PLAY': async () => {
                console.log('🎤 Voice: PLAY command');
                try {
                    // Use the app's togglePlay method which handles everything
                    if (!this.app.isPlaying) {
                        await this.app.togglePlay();
                        this.speak('Playing');
                        this.showFeedback('▶️ Playing', 'success');
                    } else {
                        this.speak('Already playing');
                        this.showFeedback('▶️ Already Playing', 'info');
                    }
                } catch (error) {
                    console.error('Error starting playback:', error);
                    this.speak('Error starting playback');
                    this.showFeedback('⚠️ Error starting playback', 'error');
                }
            },
            'STOP': () => {
                console.log('🎤 Voice: STOP command');
                if (this.app.isPlaying) {
                    this.app.togglePlay();
                    this.speak('Stopped');
                    this.showFeedback('⏹️ Stopped', 'success');
                } else {
                    this.speak('Already stopped');
                    this.showFeedback('⏹️ Already Stopped', 'info');
                }
            },
            'PAUSE': () => {
                console.log('🎤 Voice: PAUSE command');
                if (this.app.isPlaying) {
                    this.app.togglePlay();
                    this.speak('Paused');
                    this.showFeedback('⏸️ Paused', 'success');
                } else {
                    this.speak('Already paused');
                    this.showFeedback('⏸️ Already Paused', 'info');
                }
            },
            'DRUMS': () => {
                console.log('🎤 Voice: DRUMS command');
                const drumsToggle = document.getElementById('drumsToggle');
                if (drumsToggle) {
                    drumsToggle.click();
                    const isActive = drumsToggle.getAttribute('data-active') === 'true';
                    const state = isActive ? 'enabled' : 'disabled';
                    this.speak(`Drums ${state}`);
                    this.showFeedback(`🥁 Drums ${state}`, 'success');
                }
            },
            'DRUM': () => {
                // Alias for DRUMS (singular)
                console.log('🎤 Voice: DRUM command (alias for DRUMS)');
                const drumsToggle = document.getElementById('drumsToggle');
                if (drumsToggle) {
                    drumsToggle.click();
                    const isActive = drumsToggle.getAttribute('data-active') === 'true';
                    const state = isActive ? 'enabled' : 'disabled';
                    this.speak(`Drums ${state}`);
                    this.showFeedback(`🥁 Drums ${state}`, 'success');
                }
            },
            'DRUMS ON': () => {
                console.log('🎤 Voice: DRUMS ON command');
                const drumsToggle = document.getElementById('drumsToggle');
                if (drumsToggle) {
                    const isActive = drumsToggle.getAttribute('data-active') === 'true';
                    if (!isActive) {
                        drumsToggle.click();
                    }
                    this.speak('Drums enabled');
                    this.showFeedback('🥁 Drums ON', 'success');
                }
            },
            'DRUMS OFF': () => {
                console.log('🎤 Voice: DRUMS OFF command');
                const drumsToggle = document.getElementById('drumsToggle');
                if (drumsToggle) {
                    const isActive = drumsToggle.getAttribute('data-active') === 'true';
                    if (isActive) {
                        drumsToggle.click();
                    }
                    this.speak('Drums disabled');
                    this.showFeedback('🥁 Drums OFF', 'success');
                }
            },
            'FASTER': () => {
                console.log('🎤 Voice: FASTER command');
                const currentTempo = this.musicEngine.tempo || 120;
                const newTempo = Math.min(200, currentTempo + 10);
                this.musicEngine.setBPM(newTempo); // FIX: Changed from setTempo to setBPM
                this.speak(`Tempo ${newTempo}`);
                this.showFeedback(`⏩ Tempo: ${newTempo} BPM`, 'success');
            },
            'SLOWER': () => {
                console.log('🎤 Voice: SLOWER command');
                const currentTempo = this.musicEngine.tempo || 120;
                const newTempo = Math.max(60, currentTempo - 10);
                this.musicEngine.setBPM(newTempo); // FIX: Changed from setTempo to setBPM
                this.speak(`Tempo ${newTempo}`);
                this.showFeedback(`⏪ Tempo: ${newTempo} BPM`, 'success');
            },
            'LOUDER': () => {
                const volumeSlider = document.getElementById('volumeSlider');
                if (volumeSlider) {
                    const newValue = Math.min(100, parseInt(volumeSlider.value) + 10);
                    volumeSlider.value = newValue;
                    volumeSlider.dispatchEvent(new Event('input'));
                    this.speak(`Volume ${newValue}`);
                    this.showFeedback(`🔊 Volume: ${newValue}%`, 'success');
                }
            },
            'QUIETER': () => {
                const volumeSlider = document.getElementById('volumeSlider');
                if (volumeSlider) {
                    const newValue = Math.max(0, parseInt(volumeSlider.value) - 10);
                    volumeSlider.value = newValue;
                    volumeSlider.dispatchEvent(new Event('input'));
                    this.speak(`Volume ${newValue}`);
                    this.showFeedback(`🔉 Volume: ${newValue}%`, 'success');
                }
            },
            'RESET': () => {
                // Reset to default values
                this.musicEngine.setGenre('ambient');
                this.musicEngine.setBPM(120); // FIX: Changed from setTempo to setBPM
                const volumeSlider = document.getElementById('volumeSlider');
                if (volumeSlider) {
                    volumeSlider.value = 70;
                    volumeSlider.dispatchEvent(new Event('input'));
                }
                this.speak('Reset to defaults');
                this.showFeedback('🔄 Reset', 'success');
            },
            'START BEATBOX MODE': async () => {
                console.log('🎤 Voice: START BEATBOX MODE');
                try {
                    if (!this.audioAnalyzer) {
                        this.audioAnalyzer = new VoiceAudioAnalyzer();
                        const initialized = await this.audioAnalyzer.init();
                        if (!initialized) {
                            this.speak('Failed to initialize beatbox mode');
                            this.showFeedback('⚠️ Microphone access denied', 'error');
                            return;
                        }
                    }
                    this.beatboxMode = true;
                    this.audioAnalyzer.startAnalysis(
                        (beat) => {
                            // Record the beat for pattern building
                            this.audioAnalyzer.recordBeatPattern(beat);

                            // REAL-TIME FEEDBACK: Trigger the drum sound immediately!
                            if (this.musicEngine && this.musicEngine.triggerDrum) {
                                this.musicEngine.triggerDrum(beat.type);
                            }

                            this.showFeedback(`🥁 ${beat.type}`, 'info');
                        },
                        null
                    );

                    // Update UI button to show ON state
                    const beatboxBtn = document.getElementById('toggleBeatboxMode');
                    if (beatboxBtn) {
                        beatboxBtn.style.background = 'linear-gradient(135deg, #00ff00, #00cc00)';
                        beatboxBtn.querySelector('div').textContent = 'ON';
                    }

                    this.speak('Beatbox mode started');
                    this.showFeedback('🎤 Beatbox Mode Active - Start beatboxing!', 'success');
                } catch (error) {
                    console.error('Error starting beatbox mode:', error);
                    this.speak('Error starting beatbox mode');
                    this.showFeedback('⚠️ Error starting beatbox mode', 'error');
                }
            },
            'STOP BEATBOX MODE': () => {
                console.log('🎤 Voice: STOP BEATBOX MODE');
                this.beatboxMode = false;
                if (this.audioAnalyzer) {
                    this.audioAnalyzer.stopAnalysis();
                }

                // Update UI button to show OFF state
                const beatboxBtn = document.getElementById('toggleBeatboxMode');
                if (beatboxBtn) {
                    beatboxBtn.style.background = 'linear-gradient(135deg, #ff0080, #ff00ff)';
                    beatboxBtn.querySelector('div').textContent = 'OFF';
                }

                this.speak('Beatbox mode stopped');
                this.showFeedback('🎤 Beatbox Mode Stopped', 'success');
            },
            'START BEATBOXING': async () => {
                // Alias for START BEATBOX MODE
                console.log('🎤 Voice: START BEATBOXING (alias)');
                return this.commands.simple['START BEATBOX MODE']();
            },
            'STOP BEATBOXING': () => {
                // Alias for STOP BEATBOX MODE
                console.log('🎤 Voice: STOP BEATBOXING (alias)');
                return this.commands.simple['STOP BEATBOX MODE']();
            },
            'BEATBOX MODE ON': async () => {
                console.log('🎤 Voice: BEATBOX MODE ON (alias)');
                return this.commands.simple['START BEATBOX MODE']();
            },
            'BEATBOX MODE OFF': () => {
                console.log('🎤 Voice: BEATBOX MODE OFF (alias)');
                return this.commands.simple['STOP BEATBOX MODE']();
            },
            'DRUM MODE ON': async () => {
                console.log('🎤 Voice: DRUM MODE ON (alias)');
                return this.commands.simple['START BEATBOX MODE']();
            },
            'DRUM MODE OFF': () => {
                console.log('🎤 Voice: DRUM MODE OFF (alias)');
                return this.commands.simple['STOP BEATBOX MODE']();
            },
            'PLAY PATTERN': async () => {
                console.log('🎤 Voice: PLAY PATTERN');
                if (!this.audioAnalyzer) {
                    this.speak('No pattern recorded');
                    this.showFeedback('⚠️ No beatbox pattern recorded', 'warning');
                    return;
                }
                const pattern = this.audioAnalyzer.getBeatPattern();
                if (!pattern) {
                    this.speak('No pattern available');
                    this.showFeedback('⚠️ Record a beatbox pattern first', 'warning');
                    return;
                }
                // Apply pattern to drum machine
                if (this.musicEngine.loadCustomPattern) {
                    await this.musicEngine.loadCustomPattern(pattern);
                    this.speak('Playing pattern');
                    this.showFeedback('🥁 Your beatbox pattern is playing!', 'success');
                } else {
                    console.log('Pattern:', pattern);
                    this.speak('Pattern captured');
                    this.showFeedback('🥁 Pattern: ' + JSON.stringify(pattern).substring(0, 30) + '...', 'info');
                }
            },
            'START PITCH MODE': async () => {
                console.log('🎤 Voice: START PITCH MODE');
                try {
                    if (!this.audioAnalyzer) {
                        this.audioAnalyzer = new VoiceAudioAnalyzer();
                        const initialized = await this.audioAnalyzer.init();
                        if (!initialized) {
                            this.speak('Failed to initialize pitch mode');
                            this.showFeedback('⚠️ Microphone access denied', 'error');
                            return;
                        }
                    }
                    this.pitchMode = true;

                    // Track current playing note for legato/sustained playback
                    let currentNote = null;
                    let currentSynth = null;
                    let lastPitchTime = 0;
                    const silenceThreshold = 200; // ms - stop note if no pitch detected

                    this.audioAnalyzer.startAnalysis(
                        null,
                        (pitch) => {
                            this.audioAnalyzer.recordPitch(pitch);
                            if (pitch && pitch.note) {
                                this.showFeedback(`🎵 ${pitch.note.fullName} (${Math.round(pitch.frequency)}Hz)`, 'info');

                                // LEGATO MODE: Sustain notes while singing continuously
                                const now = Date.now();
                                lastPitchTime = now;

                                if (this.musicEngine && this.musicEngine.instruments && this.musicEngine.instruments.lead) {
                                    try {
                                        // If it's a new note, stop the old one and start the new one
                                        if (pitch.note.fullName !== currentNote) {
                                            // Stop previous note if playing
                                            if (currentSynth) {
                                                try {
                                                    this.musicEngine.instruments.lead.triggerRelease();
                                                } catch (e) {}
                                            }

                                            // Start new sustained note (legato!)
                                            this.musicEngine.instruments.lead.triggerAttack(
                                                pitch.note.fullName,
                                                undefined,
                                                0.5  // Medium velocity
                                            );

                                            currentNote = pitch.note.fullName;
                                            currentSynth = this.musicEngine.instruments.lead;
                                        }
                                        // If same note, it just keeps playing (legato!)
                                    } catch (error) {
                                        console.warn('Could not play pitch in real-time:', error);
                                    }
                                }
                            }
                        }
                    );

                    // Monitor for silence and release note (legato release)
                    const silenceChecker = setInterval(() => {
                        if (!this.pitchMode) {
                            clearInterval(silenceChecker);
                            if (currentSynth) {
                                try {
                                    this.musicEngine.instruments.lead.triggerRelease();
                                } catch (e) {}
                            }
                            return;
                        }

                        const now = Date.now();
                        if (now - lastPitchTime > silenceThreshold && currentSynth) {
                            // Silence detected, release the note
                            try {
                                this.musicEngine.instruments.lead.triggerRelease();
                            } catch (e) {}
                            currentNote = null;
                            currentSynth = null;
                        }
                    }, 100); // Check every 100ms

                    // Ensure instruments are initialized for real-time playback
                    if (!this.musicEngine.instruments.lead) {
                        await Tone.start();
                        this.musicEngine.setupInstruments();
                        this.musicEngine.connectAudio();
                    }

                    // Update UI button to show ON state
                    const pitchBtn = document.getElementById('togglePitchMode');
                    if (pitchBtn) {
                        pitchBtn.style.background = 'linear-gradient(135deg, #00ff00, #00cc00)';
                        pitchBtn.querySelector('div').textContent = 'ON';
                    }

                    this.speak('Pitch mode started');
                    this.showFeedback('🎶 Pitch Mode Active - Sing and hear it!', 'success');
                } catch (error) {
                    console.error('Error starting pitch mode:', error);
                    this.speak('Error starting pitch mode');
                    this.showFeedback('⚠️ Error starting pitch mode', 'error');
                }
            },
            'STOP PITCH MODE': () => {
                console.log('🎤 Voice: STOP PITCH MODE');
                this.pitchMode = false;
                if (this.audioAnalyzer) {
                    this.audioAnalyzer.stopAnalysis();
                }

                // Update UI button to show OFF state
                const pitchBtn = document.getElementById('togglePitchMode');
                if (pitchBtn) {
                    pitchBtn.style.background = 'linear-gradient(135deg, #00ffff, #0099ff)';
                    pitchBtn.querySelector('div').textContent = 'OFF';
                }

                this.speak('Pitch mode stopped');
                this.showFeedback('🎶 Pitch Mode Stopped', 'success');
            },
            'START HUMMING': async () => {
                // Alias for START PITCH MODE
                console.log('🎤 Voice: START HUMMING (alias)');
                return this.commands.simple['START PITCH MODE']();
            },
            'STOP HUMMING': () => {
                // Alias for STOP PITCH MODE
                console.log('🎤 Voice: STOP HUMMING (alias)');
                return this.commands.simple['STOP PITCH MODE']();
            },
            'PITCH MODE ON': async () => {
                console.log('🎤 Voice: PITCH MODE ON (alias)');
                return this.commands.simple['START PITCH MODE']();
            },
            'PITCH MODE OFF': () => {
                console.log('🎤 Voice: PITCH MODE OFF (alias)');
                return this.commands.simple['STOP PITCH MODE']();
            },
            'PLAY MELODY': async () => {
                console.log('🎤 Voice: PLAY MELODY');
                if (!this.audioAnalyzer) {
                    this.speak('No melody recorded');
                    this.showFeedback('⚠️ No melody recorded', 'warning');
                    return;
                }
                const melody = this.audioAnalyzer.getMelody();
                if (!melody || melody.length === 0) {
                    this.speak('No melody available');
                    this.showFeedback('⚠️ Hum a melody first', 'warning');
                    return;
                }
                // Play melody on lead synth
                if (this.musicEngine.playMelody) {
                    await this.musicEngine.playMelody(melody);
                    this.speak('Playing melody');
                    this.showFeedback('🎵 Playing your melody!', 'success');
                } else {
                    console.log('Melody:', melody);
                    this.speak('Melody captured');
                    this.showFeedback(`🎵 Melody: ${melody.length} notes`, 'info');
                }
            },
            'HARMONIZE': async () => {
                console.log('🎤 Voice: HARMONIZE');
                if (!this.audioAnalyzer) {
                    this.speak('No melody to harmonize');
                    this.showFeedback('⚠️ No melody to harmonize', 'warning');
                    return;
                }
                const melody = this.audioAnalyzer.getMelody();
                if (!melody || melody.length === 0) {
                    this.speak('No melody available');
                    this.showFeedback('⚠️ Hum a melody first', 'warning');
                    return;
                }
                // Create harmony
                if (this.musicEngine.harmonizeMelody) {
                    await this.musicEngine.harmonizeMelody(melody);
                    this.speak('Adding harmony');
                    this.showFeedback('🎶 Harmonizing melody!', 'success');
                } else {
                    this.speak('Harmony feature coming soon');
                    this.showFeedback('🎶 Harmony feature in development', 'info');
                }
            },
            'NEXT PATTERN': () => {
                console.log('🎤 Voice: NEXT PATTERN');
                const patternSelect = document.getElementById('drumPatternSelect');
                if (patternSelect) {
                    const currentIndex = patternSelect.selectedIndex;
                    const nextIndex = (currentIndex + 1) % patternSelect.options.length;
                    patternSelect.selectedIndex = nextIndex;
                    patternSelect.dispatchEvent(new Event('change'));
                    const patternName = patternSelect.options[nextIndex].text;
                    this.speak(`Pattern ${patternName}`);
                    this.showFeedback(`🥁 Pattern: ${patternName}`, 'success');
                }
            },
            'NEXT DRUM PATTERN': () => {
                console.log('🎤 Voice: NEXT DRUM PATTERN (alias)');
                return this.commands.simple['NEXT PATTERN']();
            },
            'PREVIOUS PATTERN': () => {
                console.log('🎤 Voice: PREVIOUS PATTERN');
                const patternSelect = document.getElementById('drumPatternSelect');
                if (patternSelect) {
                    const currentIndex = patternSelect.selectedIndex;
                    const prevIndex = currentIndex === 0 ? patternSelect.options.length - 1 : currentIndex - 1;
                    patternSelect.selectedIndex = prevIndex;
                    patternSelect.dispatchEvent(new Event('change'));
                    const patternName = patternSelect.options[prevIndex].text;
                    this.speak(`Pattern ${patternName}`);
                    this.showFeedback(`🥁 Pattern: ${patternName}`, 'success');
                }
            },
            'PREVIOUS DRUM PATTERN': () => {
                console.log('🎤 Voice: PREVIOUS DRUM PATTERN (alias)');
                return this.commands.simple['PREVIOUS PATTERN']();
            },
            'DRUM PATTERN NEXT': () => {
                console.log('🎤 Voice: DRUM PATTERN NEXT (alias)');
                return this.commands.simple['NEXT PATTERN']();
            },
            'DRUM PATTERN PREVIOUS': () => {
                console.log('🎤 Voice: DRUM PATTERN PREVIOUS (alias)');
                return this.commands.simple['PREVIOUS PATTERN']();
            },
            'DRUM NEXT': () => {
                console.log('🎤 Voice: DRUM NEXT (alias)');
                return this.commands.simple['NEXT PATTERN']();
            },
            'DRUM PREVIOUS': () => {
                console.log('🎤 Voice: DRUM PREVIOUS (alias)');
                return this.commands.simple['PREVIOUS PATTERN']();
            },
            'MAGIC MODE ON': () => {
                console.log('🎤 Voice: MAGIC MODE ON');
                const chaosModeBtn = document.getElementById('chaosModeBtn');
                if (chaosModeBtn) {
                    const isActive = chaosModeBtn.getAttribute('data-active') === 'true';
                    if (!isActive) {
                        chaosModeBtn.click();
                    }
                    this.speak('Magic mode enabled');
                    this.showFeedback('🔥 Magick Mode ON', 'success');
                }
            },
            'MAGIC MODE OFF': () => {
                console.log('🎤 Voice: MAGIC MODE OFF');
                const chaosModeBtn = document.getElementById('chaosModeBtn');
                if (chaosModeBtn) {
                    const isActive = chaosModeBtn.getAttribute('data-active') === 'true';
                    if (isActive) {
                        chaosModeBtn.click();
                    }
                    this.speak('Magic mode disabled');
                    this.showFeedback('🔥 Magick Mode OFF', 'success');
                }
            },
            'CHAOS MODE ON': () => {
                console.log('🎤 Voice: CHAOS MODE ON (alias)');
                return this.commands.simple['MAGIC MODE ON']();
            },
            'CHAOS MODE OFF': () => {
                console.log('🎤 Voice: CHAOS MODE OFF (alias)');
                return this.commands.simple['MAGIC MODE OFF']();
            },
            'MAGICK MODE ON': () => {
                console.log('🎤 Voice: MAGICK MODE ON (alias)');
                return this.commands.simple['MAGIC MODE ON']();
            },
            'MAGICK MODE OFF': () => {
                console.log('🎤 Voice: MAGICK MODE OFF (alias)');
                return this.commands.simple['MAGIC MODE OFF']();
            },
            'TOGGLE MAGIC MODE': () => {
                console.log('🎤 Voice: TOGGLE MAGIC MODE');
                const chaosModeBtn = document.getElementById('chaosModeBtn');
                if (chaosModeBtn) {
                    chaosModeBtn.click();
                    const isActive = chaosModeBtn.getAttribute('data-active') === 'true';
                    this.speak('Magic mode ' + (isActive ? 'enabled' : 'disabled'));
                    this.showFeedback('🔥 Magick Mode ' + (isActive ? 'ON' : 'OFF'), 'success');
                }
            },
            'TOGGLE CHAOS MODE': () => {
                console.log('🎤 Voice: TOGGLE CHAOS MODE (alias)');
                return this.commands.simple['TOGGLE MAGIC MODE']();
            },
            'MAGIC MODE DRUMS ON': () => {
                console.log('🎤 Voice: MAGIC MODE DRUMS ON');
                const magickDrumsToggle = document.getElementById('magickDrumsToggle');
                if (magickDrumsToggle && !magickDrumsToggle.checked) {
                    magickDrumsToggle.click();
                    this.speak('Magic mode drums enabled');
                    this.showFeedback('🥁 Magick Drums ON', 'success');
                }
            },
            'MAGIC MODE DRUMS OFF': () => {
                console.log('🎤 Voice: MAGIC MODE DRUMS OFF');
                const magickDrumsToggle = document.getElementById('magickDrumsToggle');
                if (magickDrumsToggle && magickDrumsToggle.checked) {
                    magickDrumsToggle.click();
                    this.speak('Magic mode drums disabled');
                    this.showFeedback('🥁 Magick Drums OFF', 'success');
                }
            },
            'PROD MODE': () => {
                console.log('🎤 Voice: PROD MODE');
                const prodBtn = document.getElementById('prodModeBtn');
                if (prodBtn && !prodBtn.classList.contains('active')) {
                    prodBtn.click();
                    this.speak('PROD mode');
                    this.showFeedback('🎚️ PROD Mode Active', 'success');
                }
            },
            'SWITCH TO PROD': () => {
                console.log('🎤 Voice: SWITCH TO PROD (alias)');
                return this.commands.simple['PROD MODE']();
            },
            'DAW MODE': () => {
                console.log('🎤 Voice: DAW MODE (alias)');
                return this.commands.simple['PROD MODE']();
            },
            'PRODUCTION MODE': () => {
                console.log('🎤 Voice: PRODUCTION MODE (alias)');
                return this.commands.simple['PROD MODE']();
            },
            'GENERATIVE MODE': () => {
                console.log('🎤 Voice: GENERATIVE MODE');
                const generativeBtn = document.getElementById('generativeModeBtn');
                if (generativeBtn && !generativeBtn.classList.contains('active')) {
                    generativeBtn.click();
                    this.speak('Generative mode');
                    this.showFeedback('🎵 Generative Mode Active', 'success');
                }
            },
            'SWITCH TO GENERATIVE': () => {
                console.log('🎤 Voice: SWITCH TO GENERATIVE (alias)');
                return this.commands.simple['GENERATIVE MODE']();
            },
            'AI MODE': () => {
                console.log('🎤 Voice: AI MODE (alias)');
                return this.commands.simple['GENERATIVE MODE']();
            },
            'LOAD DEMO PATTERN': () => {
                console.log('🎤 Voice: LOAD DEMO PATTERN');
                if (this.app && this.app.loadDemoPattern) {
                    this.app.loadDemoPattern();
                    this.speak('Demo pattern loaded');
                    this.showFeedback('🎵 Demo Pattern Loaded', 'success');
                } else {
                    this.showFeedback('⚠️ Demo pattern not available', 'warning');
                }
            }
        };
    }

    /**
     * Try simple commands
     */
    async trySimpleCommands(transcript) {
        const command = this.commands.simple[transcript];
        if (command) {
            try {
                await command();
                return true;
            } catch (error) {
                console.error(`Error executing command "${transcript}":`, error);
                this.showFeedback(`⚠️ Error: ${error.message}`, 'error');
                return false;
            }
        }
        return false;
    }

    /**
     * Initialize parameter commands
     */
    initParameterCommands() {
        return {
            patterns: [
                {
                    regex: /^VOLUME\s+(\d+)$/,
                    action: (match) => {
                        const value = parseInt(match[1]);
                        const volumeSlider = document.getElementById('volumeSlider');
                        if (volumeSlider) {
                            volumeSlider.value = Math.min(100, Math.max(0, value));
                            volumeSlider.dispatchEvent(new Event('input'));
                            this.speak(`Volume ${value}`);
                            this.showFeedback(`🔊 Volume: ${value}%`, 'success');
                        }
                    }
                },
                {
                    regex: /^REVERB\s+(\d+)$/,
                    action: (match) => {
                        const value = parseInt(match[1]);
                        const reverbSlider = document.getElementById('reverbSlider');
                        if (reverbSlider) {
                            reverbSlider.value = Math.min(100, Math.max(0, value));
                            reverbSlider.dispatchEvent(new Event('input'));
                            this.speak(`Reverb ${value}`);
                            this.showFeedback(`🌊 Reverb: ${value}%`, 'success');
                        }
                    }
                },
                {
                    regex: /^TEMPO\s+(\d+)$/,
                    action: (match) => {
                        const value = parseInt(match[1]);
                        this.musicEngine.setBPM(Math.min(200, Math.max(60, value))); // FIX: Changed from setTempo to setBPM
                        this.speak(`Tempo ${value}`);
                        this.showFeedback(`⏱️ Tempo: ${value} BPM`, 'success');
                    }
                },
                {
                    regex: /^NOTE DENSITY\s+(\d+)$/,
                    action: (match) => {
                        const value = parseInt(match[1]);
                        this.musicEngine.setNoteDensity(Math.min(100, Math.max(0, value)));
                        this.speak(`Note density ${value}`);
                        this.showFeedback(`🎵 Note Density: ${value}%`, 'success');
                    }
                },
                {
                    regex: /^DELAY\s+(\d+)$/,
                    action: (match) => {
                        const value = parseInt(match[1]);
                        const delaySlider = document.getElementById('delaySlider');
                        if (delaySlider) {
                            delaySlider.value = Math.min(100, Math.max(0, value));
                            delaySlider.dispatchEvent(new Event('input'));
                            this.speak(`Delay ${value}`);
                            this.showFeedback(`🔁 Delay: ${value}%`, 'success');
                        }
                    }
                },
                {
                    regex: /^SYNTH VOLUME\s+(\d+)$/,
                    action: (match) => {
                        const value = parseInt(match[1]);
                        const slider = document.getElementById('synthVolumeSlider');
                        if (slider) {
                            slider.value = Math.min(100, Math.max(0, value));
                            slider.dispatchEvent(new Event('input'));
                            this.speak(`Synth volume ${value}`);
                            this.showFeedback(`🎹 Synth Volume: ${value}%`, 'success');
                        }
                    }
                },
                {
                    regex: /^DRUM VOLUME\s+(\d+)$/,
                    action: (match) => {
                        const value = parseInt(match[1]);
                        const slider = document.getElementById('drumVolumeSlider');
                        if (slider) {
                            slider.value = Math.min(100, Math.max(0, value));
                            slider.dispatchEvent(new Event('input'));
                            this.speak(`Drum volume ${value}`);
                            this.showFeedback(`🥁 Drum Volume: ${value}%`, 'success');
                        }
                    }
                },
                {
                    regex: /^HUE\s+(\d+)$/,
                    action: (match) => {
                        const value = parseInt(match[1]);
                        const slider = document.getElementById('colorHue');
                        if (slider) {
                            slider.value = Math.min(360, Math.max(0, value));
                            slider.dispatchEvent(new Event('input'));
                            this.speak(`Hue ${value}`);
                            this.showFeedback(`🎨 Hue: ${value}°`, 'success');
                        }
                    }
                },
                {
                    regex: /^SATURATION\s+(\d+)$/,
                    action: (match) => {
                        const value = parseInt(match[1]);
                        const slider = document.getElementById('colorSaturation');
                        if (slider) {
                            slider.value = Math.min(100, Math.max(0, value));
                            slider.dispatchEvent(new Event('input'));
                            this.speak(`Saturation ${value}`);
                            this.showFeedback(`🎨 Saturation: ${value}%`, 'success');
                        }
                    }
                },
                {
                    regex: /^BRIGHTNESS\s+(\d+)$/,
                    action: (match) => {
                        const value = parseInt(match[1]);
                        const slider = document.getElementById('colorBrightness');
                        if (slider) {
                            slider.value = Math.min(200, Math.max(0, value));
                            slider.dispatchEvent(new Event('input'));
                            this.speak(`Brightness ${value}`);
                            this.showFeedback(`💡 Brightness: ${value}%`, 'success');
                        }
                    }
                },
                {
                    regex: /^MAIN OPACITY\s+(\d+)$/,
                    action: (match) => {
                        const value = parseInt(match[1]);
                        const slider = document.getElementById('mainOpacity');
                        if (slider) {
                            slider.value = Math.min(100, Math.max(0, value));
                            slider.dispatchEvent(new Event('input'));
                            this.speak(`Main opacity ${value}`);
                            this.showFeedback(`👁️ Main Layer: ${value}%`, 'success');
                        }
                    }
                },
                {
                    regex: /^TOY OPACITY\s+(\d+)$/,
                    action: (match) => {
                        const value = parseInt(match[1]);
                        const slider = document.getElementById('toyOpacity');
                        if (slider) {
                            slider.value = Math.min(100, Math.max(0, value));
                            slider.dispatchEvent(new Event('input'));
                            this.speak(`Toy opacity ${value}`);
                            this.showFeedback(`👁️ Toy Layer: ${value}%`, 'success');
                        }
                    }
                }
            ]
        };
    }

    /**
     * Try parameter commands
     */
    tryParameterCommands(transcript) {
        for (const pattern of this.commands.parameters.patterns) {
            const match = transcript.match(pattern.regex);
            if (match) {
                pattern.action.call(this, match);
                return true;
            }
        }
        return false;
    }

    /**
     * Initialize preset commands
     */
    initPresetCommands() {
        return {
            // Genres - Electronic
            'AMBIENT MODE': () => this.setGenre('ambient', 'Ambient'),
            'AMBIENT': () => this.setGenre('ambient', 'Ambient'),
            'TECHNO VIBES': () => this.setGenre('techno', 'Techno'),
            'TECHNO': () => this.setGenre('techno', 'Techno'),
            'HOUSE': () => this.setGenre('house', 'House'),
            'HOUSE MUSIC': () => this.setGenre('house', 'House'),
            'TRANCE': () => this.setGenre('trance', 'Trance'),
            'DRUM AND BASS': () => this.setGenre('dnb', 'Drum & Bass'),
            'DNB': () => this.setGenre('dnb', 'Drum & Bass'),
            'DUBSTEP': () => this.setGenre('dubstep', 'Dubstep'),
            'INDUSTRIAL': () => this.setGenre('industrial', 'Industrial'),
            'IDM': () => this.setGenre('idm', 'IDM'),
            'BREAKBEAT': () => this.setGenre('breakbeat', 'Breakbeat'),
            'JUNGLE': () => this.setGenre('jungle', 'Jungle'),
            'UK GARAGE': () => this.setGenre('garage', 'UK Garage'),
            'GARAGE': () => this.setGenre('garage', 'UK Garage'),
            'BASSLINE': () => this.setGenre('bassline', 'Bassline'),
            'GRIME': () => this.setGenre('grime', 'Grime'),
            'FOOTWORK': () => this.setGenre('footwork', 'Footwork'),

            // Genres - Retro/Wave
            'SYNTHWAVE': () => this.setGenre('synthwave', 'Synthwave'),
            'VAPORWAVE': () => this.setGenre('vaporwave', 'Vaporwave'),
            'CHILLWAVE': () => this.setGenre('chillwave', 'Chillwave'),

            // Genres - Hip-Hop & Urban
            'HIP HOP': () => this.setGenre('hiphop', 'Hip-Hop'),
            'HIPHOP': () => this.setGenre('hiphop', 'Hip-Hop'),
            'TRAP': () => this.setGenre('trap', 'Trap'),
            'LOFI': () => this.setGenre('lofi', 'Lo-Fi'),
            'LO FI': () => this.setGenre('lofi', 'Lo-Fi'),
            'TRIP HOP': () => this.setGenre('triphop', 'Trip-Hop'),
            'TRIPHOP': () => this.setGenre('triphop', 'Trip-Hop'),

            // Genres - Jazz & Funk
            'JAZZ IT UP': () => this.setGenre('jazz', 'Jazz'),
            'JAZZ': () => this.setGenre('jazz', 'Jazz'),
            'FUNK': () => this.setGenre('funk', 'Funk'),
            'SOUL': () => this.setGenre('soul', 'Soul'),

            // Genres - Chill & Downtempo
            'CHILLOUT': () => this.setGenre('chillout', 'Chillout'),
            'CHILL OUT': () => this.setGenre('chillout', 'Chillout'),
            'DOWNTEMPO': () => this.setGenre('downtempo', 'Downtempo'),

            // Genres - Experimental
            'DRONE MODE': () => this.setGenre('drone', 'Drone'),
            'DRONE': () => this.setGenre('drone', 'Drone'),
            'PSYCHEDELIC': () => this.setGenre('psychedelic', 'Psychedelic'),
            'EXPERIMENTAL': () => this.setGenre('experimental', 'Experimental'),
            'MINIMAL': () => this.setGenre('minimal', 'Minimal'),

            // Oscillator types
            'SINE WAVE': () => this.setOscillator('sine', 'Sine Wave'),
            'SINE': () => this.setOscillator('sine', 'Sine'),
            'SAWTOOTH': () => this.setOscillator('sawtooth', 'Sawtooth'),
            'SQUARE WAVE': () => this.setOscillator('square', 'Square'),
            'TRIANGLE': () => this.setOscillator('triangle', 'Triangle'),

            // Presets
            'WARM PAD': () => this.setPreset('pad', 'warmPad', 'Warm Pad'),
            'SPACE PAD': () => this.setPreset('pad', 'spacePad', 'Space Pad'),
            'FAT BASS': () => this.setPreset('bass', 'fatsine', 'Fat Bass'),
            'DEEP BASS': () => this.setPreset('bass', 'sine', 'Deep Bass'),

            // Drum machines - Roland TR Series
            'ROLAND EIGHT OH EIGHT': () => this.setDrumMachine('RolandTR808', '808'),
            'EIGHT OH EIGHT': () => this.setDrumMachine('RolandTR808', '808'),
            '808': () => this.setDrumMachine('RolandTR808', '808'),
            'NINE OH NINE': () => this.setDrumMachine('RolandTR909', '909'),
            '909': () => this.setDrumMachine('RolandTR909', '909'),
            'SEVEN OH SEVEN': () => this.setDrumMachine('RolandTR707', '707'),
            '707': () => this.setDrumMachine('RolandTR707', '707'),
            'SIX OH SIX': () => this.setDrumMachine('RolandTR606', '606'),
            '606': () => this.setDrumMachine('RolandTR606', '606'),
            'FIVE OH FIVE': () => this.setDrumMachine('RolandTR505', '505'),
            '505': () => this.setDrumMachine('RolandTR505', '505'),
            'SIX TWO SIX': () => this.setDrumMachine('RolandTR626', '626'),
            '626': () => this.setDrumMachine('RolandTR626', '626'),

            // Drum machines - Linn Series
            'LINN DRUM': () => this.setDrumMachine('LinnDrum', 'LinnDrum'),
            'LINN LM ONE': () => this.setDrumMachine('LinnLM1', 'LM-1'),
            'LINN LM TWO': () => this.setDrumMachine('LinnLM2', 'LM-2'),
            'LINN NINE THOUSAND': () => this.setDrumMachine('Linn9000', 'Linn 9000'),

            // Drum machines - Boss DR Series
            'BOSS DR ONE TEN': () => this.setDrumMachine('BossDR110', 'DR-110'),
            'BOSS DR TWO TWENTY': () => this.setDrumMachine('BossDR220', 'DR-220'),
            'BOSS DR FIFTY FIVE': () => this.setDrumMachine('BossDR55', 'DR-55'),
            'BOSS DR FIVE FIFTY': () => this.setDrumMachine('BossDR550', 'DR-550'),
            'BOSS DR SIX SIXTY': () => this.setDrumMachine('BossDR660', 'DR-660'),

            // Drum machines - Akai Series
            'AKAI MPC SIXTY': () => this.setDrumMachine('AkaiMPC60', 'MPC60'),
            'MPC SIXTY': () => this.setDrumMachine('AkaiMPC60', 'MPC60'),
            'MPC ONE THOUSAND': () => this.setDrumMachine('MPC1000', 'MPC1000'),
            'AKAI LINN': () => this.setDrumMachine('AkaiLinn', 'Akai Linn'),

            // Drum machines - Oberheim & Others
            'OBERHEIM DMX': () => this.setDrumMachine('OberheimDMX', 'DMX'),
            'DMX': () => this.setDrumMachine('OberheimDMX', 'DMX'),
            'SIMMONS': () => this.setDrumMachine('SimmonsSDS5', 'Simmons SDS-5'),
            'DRUMULATOR': () => this.setDrumMachine('EmuDrumulator', 'Drumulator'),

            // Drum machines - Korg Series
            'KORG DDM': () => this.setDrumMachine('KorgDDM110', 'DDM-110'),
            'KORG MINIPOPS': () => this.setDrumMachine('KorgMinipops', 'Minipops'),
            'KORG M ONE': () => this.setDrumMachine('KorgM1', 'M1'),

            // Drum machines - Yamaha Series
            'YAMAHA RX TWENTY ONE': () => this.setDrumMachine('YamahaRX21', 'RX21'),
            'YAMAHA RX FIVE': () => this.setDrumMachine('YamahaRX5', 'RX5'),
            'YAMAHA RY THIRTY': () => this.setDrumMachine('YamahaRY30', 'RY30'),

            // Drum machines - Alesis Series
            'ALESIS HR SIXTEEN': () => this.setDrumMachine('AlesisHR16', 'HR-16'),
            'ALESIS SR SIXTEEN': () => this.setDrumMachine('AlesisSR16', 'SR-16'),

            // Drum machines - Casio
            'CASIO RZ ONE': () => this.setDrumMachine('CasioRZ1', 'RZ-1'),
            'CASIO SK ONE': () => this.setDrumMachine('CasioSK1', 'SK-1'),

            // Drum machines - Roland Others
            'ROLAND R EIGHT': () => this.setDrumMachine('RolandR8', 'R-8'),
            'ROLAND MC THREE OH THREE': () => this.setDrumMachine('RolandMC303', 'MC-303'),

            // Drum Patterns - Direct Selection
            'TECHNO PATTERN': () => this.setDrumPattern('techno', 'Techno'),
            'BREAKBEAT PATTERN': () => this.setDrumPattern('breakbeat', 'Breakbeat'),
            'JUNGLE PATTERN': () => this.setDrumPattern('jungle', 'Jungle'),
            'HIP HOP PATTERN': () => this.setDrumPattern('hiphop', 'Hip-Hop'),
            'AMBIENT PATTERN': () => this.setDrumPattern('ambient', 'Ambient'),
            'BASIC PATTERN': () => this.setDrumPattern('basic', 'Basic'),
            'FOUR ON THE FLOOR': () => this.setDrumPattern('four_on_floor', '4 on Floor'),
            'SYNCOPATED PATTERN': () => this.setDrumPattern('syncopated', 'Syncopated'),
            'TECHNO DRUMS': () => this.setDrumPattern('techno', 'Techno'),
            'BREAKBEAT DRUMS': () => this.setDrumPattern('breakbeat', 'Breakbeat'),
            'JUNGLE DRUMS': () => this.setDrumPattern('jungle', 'Jungle'),
            'HIP HOP DRUMS': () => this.setDrumPattern('hiphop', 'Hip-Hop'),
            'AMBIENT DRUMS': () => this.setDrumPattern('ambient', 'Ambient')
        };
    }

    /**
     * Try preset commands
     */
    tryPresetCommands(transcript) {
        const command = this.commands.presets[transcript];
        if (command) {
            command();
            return true;
        }
        return false;
    }

    /**
     * Initialize instrument commands
     */
    initInstrumentCommands() {
        return {
            'TONE JS': () => this.setSynthEngine('tonejs', 'Tone.js'),
            'TONE': () => this.setSynthEngine('tonejs', 'Tone.js'),
            'WAD ENGINE': () => this.setSynthEngine('wad', 'WAD'),
            'WAD': () => this.setSynthEngine('wad', 'WAD'),
            'DIRT SAMPLES': () => this.setSynthEngine('dirt', 'Dirt'),
            'DIRT': () => this.setSynthEngine('dirt', 'Dirt')
        };
    }

    /**
     * Try instrument commands
     */
    tryInstrumentCommands(transcript) {
        const command = this.commands.instruments[transcript];
        if (command) {
            command();
            return true;
        }
        return false;
    }

    /**
     * Initialize visual commands
     */
    initVisualCommands() {
        return {
            'FULLSCREEN': () => {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen();
                    this.speak('Fullscreen');
                    this.showFeedback('🖥️ Fullscreen', 'success');
                }
            },
            'EXIT FULLSCREEN': () => {
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                    this.speak('Exit fullscreen');
                    this.showFeedback('🖥️ Exit Fullscreen', 'success');
                }
            },
            'RED': () => {
                const slider = document.getElementById('colorHue');
                if (slider) {
                    slider.value = 0;
                    slider.dispatchEvent(new Event('input'));
                    this.speak('Red');
                    this.showFeedback('🔴 Red', 'success');
                }
            },
            'ORANGE': () => {
                const slider = document.getElementById('colorHue');
                if (slider) {
                    slider.value = 30;
                    slider.dispatchEvent(new Event('input'));
                    this.speak('Orange');
                    this.showFeedback('🟠 Orange', 'success');
                }
            },
            'YELLOW': () => {
                const slider = document.getElementById('colorHue');
                if (slider) {
                    slider.value = 60;
                    slider.dispatchEvent(new Event('input'));
                    this.speak('Yellow');
                    this.showFeedback('🟡 Yellow', 'success');
                }
            },
            'GREEN': () => {
                const slider = document.getElementById('colorHue');
                if (slider) {
                    slider.value = 120;
                    slider.dispatchEvent(new Event('input'));
                    this.speak('Green');
                    this.showFeedback('🟢 Green', 'success');
                }
            },
            'CYAN': () => {
                const slider = document.getElementById('colorHue');
                if (slider) {
                    slider.value = 180;
                    slider.dispatchEvent(new Event('input'));
                    this.speak('Cyan');
                    this.showFeedback('🔵 Cyan', 'success');
                }
            },
            'BLUE': () => {
                const slider = document.getElementById('colorHue');
                if (slider) {
                    slider.value = 240;
                    slider.dispatchEvent(new Event('input'));
                    this.speak('Blue');
                    this.showFeedback('🔵 Blue', 'success');
                }
            },
            'PURPLE': () => {
                const slider = document.getElementById('colorHue');
                if (slider) {
                    slider.value = 280;
                    slider.dispatchEvent(new Event('input'));
                    this.speak('Purple');
                    this.showFeedback('🟣 Purple', 'success');
                }
            },
            'MAGENTA': () => {
                const slider = document.getElementById('colorHue');
                if (slider) {
                    slider.value = 300;
                    slider.dispatchEvent(new Event('input'));
                    this.speak('Magenta');
                    this.showFeedback('🟣 Magenta', 'success');
                }
            },
            'PINK': () => {
                const slider = document.getElementById('colorHue');
                if (slider) {
                    slider.value = 330;
                    slider.dispatchEvent(new Event('input'));
                    this.speak('Pink');
                    this.showFeedback('💗 Pink', 'success');
                }
            },
            'BRIGHTER': () => {
                const slider = document.getElementById('colorBrightness');
                if (slider) {
                    const newValue = Math.min(200, parseInt(slider.value) + 20);
                    slider.value = newValue;
                    slider.dispatchEvent(new Event('input'));
                    this.speak('Brighter');
                    this.showFeedback(`💡 Brighter: ${newValue}%`, 'success');
                }
            },
            'DARKER': () => {
                const slider = document.getElementById('colorBrightness');
                if (slider) {
                    const newValue = Math.max(0, parseInt(slider.value) - 20);
                    slider.value = newValue;
                    slider.dispatchEvent(new Event('input'));
                    this.speak('Darker');
                    this.showFeedback(`💡 Darker: ${newValue}%`, 'success');
                }
            },
            'MORE COLOR': () => {
                const slider = document.getElementById('colorSaturation');
                if (slider) {
                    const newValue = Math.min(100, parseInt(slider.value) + 20);
                    slider.value = newValue;
                    slider.dispatchEvent(new Event('input'));
                    this.speak('More color');
                    this.showFeedback(`🎨 Saturation: ${newValue}%`, 'success');
                }
            },
            'LESS COLOR': () => {
                const slider = document.getElementById('colorSaturation');
                if (slider) {
                    const newValue = Math.max(0, parseInt(slider.value) - 20);
                    slider.value = newValue;
                    slider.dispatchEvent(new Event('input'));
                    this.speak('Less color');
                    this.showFeedback(`🎨 Saturation: ${newValue}%`, 'success');
                }
            },
            'SHOW MAIN LAYER': () => {
                const slider = document.getElementById('mainOpacity');
                if (slider) {
                    slider.value = 100;
                    slider.dispatchEvent(new Event('input'));
                    this.speak('Main layer visible');
                    this.showFeedback('👁️ Main Layer ON', 'success');
                }
            },
            'HIDE MAIN LAYER': () => {
                const slider = document.getElementById('mainOpacity');
                if (slider) {
                    slider.value = 0;
                    slider.dispatchEvent(new Event('input'));
                    this.speak('Main layer hidden');
                    this.showFeedback('👁️ Main Layer OFF', 'success');
                }
            },
            'SHOW TOY LAYER': () => {
                const slider = document.getElementById('toyOpacity');
                if (slider) {
                    slider.value = 100;
                    slider.dispatchEvent(new Event('input'));
                    this.speak('Toy layer visible');
                    this.showFeedback('👁️ Toy Layer ON', 'success');
                }
            },
            'HIDE TOY LAYER': () => {
                const slider = document.getElementById('toyOpacity');
                if (slider) {
                    slider.value = 0;
                    slider.dispatchEvent(new Event('input'));
                    this.speak('Toy layer hidden');
                    this.showFeedback('👁️ Toy Layer OFF', 'success');
                }
            },
            'NEXT SHADER': () => {
                console.log('🎤 Voice: NEXT SHADER');
                const shaderSelect = document.getElementById('mainShaderSelect');
                if (shaderSelect) {
                    const currentIndex = shaderSelect.selectedIndex;
                    const nextIndex = (currentIndex + 1) % shaderSelect.options.length;
                    shaderSelect.selectedIndex = nextIndex;
                    shaderSelect.dispatchEvent(new Event('change'));
                    const shaderName = shaderSelect.options[nextIndex].text;
                    this.speak('Shader ' + shaderName);
                    this.showFeedback(`🎨 Shader: ${shaderName}`, 'success');
                }
            },
            'PREVIOUS SHADER': () => {
                console.log('🎤 Voice: PREVIOUS SHADER');
                const shaderSelect = document.getElementById('mainShaderSelect');
                if (shaderSelect) {
                    const currentIndex = shaderSelect.selectedIndex;
                    const prevIndex = currentIndex === 0 ? shaderSelect.options.length - 1 : currentIndex - 1;
                    shaderSelect.selectedIndex = prevIndex;
                    shaderSelect.dispatchEvent(new Event('change'));
                    const shaderName = shaderSelect.options[prevIndex].text;
                    this.speak('Shader ' + shaderName);
                    this.showFeedback(`🎨 Shader: ${shaderName}`, 'success');
                }
            },
            'AURORA SHADER': () => this.selectShaderByName('Aurora Borealis', 'Aurora'),
            'AURORA BOREALIS': () => this.selectShaderByName('Aurora Borealis', 'Aurora'),
            'AURORA': () => this.selectShaderByName('Aurora Borealis', 'Aurora'),
            'FIRE SHADER': () => this.selectShaderByName('Fire Flames', 'Fire'),
            'FIRE FLAMES': () => this.selectShaderByName('Fire Flames', 'Fire'),
            'FIRE': () => this.selectShaderByName('Fire Flames', 'Fire'),
            'LIGHTNING SHADER': () => this.selectShaderByName('Lightning Storm', 'Lightning'),
            'LIGHTNING STORM': () => this.selectShaderByName('Lightning Storm', 'Lightning'),
            'LIGHTNING': () => this.selectShaderByName('Lightning Storm', 'Lightning'),
            'CRT SHADER': () => this.selectShaderByName('CRT Monitor', 'CRT'),
            'CRT MONITOR': () => this.selectShaderByName('CRT Monitor', 'CRT'),
            'CRT': () => this.selectShaderByName('CRT Monitor', 'CRT'),
            'KALEIDOSCOPE SHADER': () => this.selectShaderByName('Kaleidoscope', 'Kaleidoscope'),
            'KALEIDOSCOPE': () => this.selectShaderByName('Kaleidoscope', 'Kaleidoscope'),
            'BLACK HOLE SHADER': () => this.selectShaderByName('Black Hole', 'Black Hole'),
            'BLACK HOLE': () => this.selectShaderByName('Black Hole', 'Black Hole'),
            'WORMHOLE SHADER': () => this.selectShaderByName('Wormhole', 'Wormhole'),
            'WORMHOLE': () => this.selectShaderByName('Wormhole', 'Wormhole'),
            'LAVA LAMP SHADER': () => this.selectShaderByName('Lava Lamp', 'Lava Lamp'),
            'LAVA LAMP': () => this.selectShaderByName('Lava Lamp', 'Lava Lamp'),
            'VORONOI SHADER': () => this.selectShaderByName('Voronoi Cells', 'Voronoi'),
            'VORONOI': () => this.selectShaderByName('Voronoi Cells', 'Voronoi'),
            'MANDELBROT SHADER': () => this.selectShaderByName('Mandelbrot Zoom', 'Mandelbrot'),
            'MANDELBROT': () => this.selectShaderByName('Mandelbrot Zoom', 'Mandelbrot'),
            'LIQUID METAL SHADER': () => this.selectShaderByName('Liquid Metal', 'Liquid Metal'),
            'LIQUID METAL': () => this.selectShaderByName('Liquid Metal', 'Liquid Metal'),
            'DNA HELIX SHADER': () => this.selectShaderByName('DNA Helix', 'DNA'),
            'DNA HELIX': () => this.selectShaderByName('DNA Helix', 'DNA'),
            'DNA': () => this.selectShaderByName('DNA Helix', 'DNA'),
            'GRID WAVES SHADER': () => this.selectShaderByName('Grid Waves', 'Grid Waves'),
            'GRID WAVES': () => this.selectShaderByName('Grid Waves', 'Grid Waves'),
            'VECTOR LINES SHADER': () => this.selectShaderByName('Vector Lines', 'Vector'),
            'VECTOR LINES': () => this.selectShaderByName('Vector Lines', 'Vector'),
            'SWIRL SHADER': () => this.selectShaderByName('Colorful Swirl', 'Swirl'),
            'COLORFUL SWIRL': () => this.selectShaderByName('Colorful Swirl', 'Swirl'),
            'COSMIC NEBULA': () => this.selectShaderByName('Cosmic Nebula', 'Cosmic Nebula')
        };
    }

    /**
     * Try visual commands
     */
    tryVisualCommands(transcript) {
        const command = this.commands.visuals[transcript];
        if (command) {
            command();
            return true;
        }
        return false;
    }

    /**
     * Initialize natural language patterns
     */
    initNaturalLanguagePatterns() {
        return [
            {
                patterns: ['MAKE IT LOUDER', 'TURN IT UP', 'INCREASE VOLUME'],
                action: () => this.commands.simple['LOUDER']()
            },
            {
                patterns: ['MAKE IT QUIETER', 'TURN IT DOWN', 'DECREASE VOLUME'],
                action: () => this.commands.simple['QUIETER']()
            },
            {
                patterns: ['ADD MORE REVERB', 'MORE REVERB', 'INCREASE REVERB'],
                action: () => {
                    const reverbSlider = document.getElementById('reverbSlider');
                    if (reverbSlider) {
                        reverbSlider.value = Math.min(100, parseInt(reverbSlider.value) + 20);
                        reverbSlider.dispatchEvent(new Event('input'));
                        this.speak('More reverb');
                        this.showFeedback('🌊 More Reverb', 'success');
                    }
                }
            },
            {
                patterns: ['LESS BASS', 'REDUCE BASS', 'DECREASE BASS'],
                action: () => {
                    const bassSlider = document.getElementById('bassVolumeSlider');
                    if (bassSlider) {
                        bassSlider.value = Math.max(0, parseInt(bassSlider.value) - 20);
                        bassSlider.dispatchEvent(new Event('input'));
                        this.speak('Less bass');
                        this.showFeedback('🔉 Less Bass', 'success');
                    }
                }
            },
            {
                patterns: ['CRANK THE TEMPO', 'SPEED UP', 'GO FASTER'],
                action: () => this.commands.simple['FASTER']()
            },
            {
                patterns: ['MAKE IT SOUND MORE DREAMY', 'DREAMY', 'DREAMY VIBES'],
                action: () => {
                    this.musicEngine.setGenre('ambient');
                    const reverbSlider = document.getElementById('reverbSlider');
                    if (reverbSlider) {
                        reverbSlider.value = 80;
                        reverbSlider.dispatchEvent(new Event('input'));
                    }
                    this.musicEngine.setBPM(90); // FIX: Changed from setTempo to setBPM
                    this.speak('Dreamy vibes');
                    this.showFeedback('✨ Dreamy Mode', 'success');
                }
            },
            {
                patterns: ['I WANT AN AGGRESSIVE DROP', 'AGGRESSIVE DROP', 'DROP IT'],
                action: () => {
                    this.musicEngine.setGenre('techno');
                    this.musicEngine.toggleDrums(true);
                    this.musicEngine.changeDrumPattern('breakbeat');
                    this.speak('Aggressive drop');
                    this.showFeedback('💥 Aggressive Drop!', 'success');
                }
            },
            {
                patterns: ['GIVE ME UNDERWATER VIBES', 'UNDERWATER', 'AQUATIC'],
                action: () => {
                    this.musicEngine.setBPM(85); // FIX: Changed from setTempo to setBPM
                    const reverbSlider = document.getElementById('reverbSlider');
                    if (reverbSlider) {
                        reverbSlider.value = 90;
                        reverbSlider.dispatchEvent(new Event('input'));
                    }
                    const delaySlider = document.getElementById('delaySlider');
                    if (delaySlider) {
                        delaySlider.value = 70;
                        delaySlider.dispatchEvent(new Event('input'));
                    }
                    this.speak('Underwater vibes');
                    this.showFeedback('🌊 Underwater Mode', 'success');
                }
            },
            {
                patterns: ['MAKE IT COSMIC', 'COSMIC VIBES', 'SPACE SOUNDS'],
                action: () => {
                    this.musicEngine.setGenre('ambient');
                    if (this.musicEngine.synthEngine === 'wad') {
                        this.musicEngine.changeWadPreset('pad', 'spacePad');
                    }
                    const reverbSlider = document.getElementById('reverbSlider');
                    if (reverbSlider) {
                        reverbSlider.value = 85;
                        reverbSlider.dispatchEvent(new Event('input'));
                    }
                    this.speak('Cosmic mode');
                    this.showFeedback('🌌 Cosmic Mode', 'success');
                }
            }
        ];
    }

    /**
     * Try natural language patterns
     */
    tryNaturalLanguage(transcript) {
        for (const pattern of this.commands.natural) {
            if (pattern.patterns.includes(transcript)) {
                pattern.action();
                return true;
            }
        }
        return false;
    }

    /**
     * Helper: Set genre
     */
    setGenre(genre, displayName) {
        this.musicEngine.setGenre(genre);
        // Update UI dropdown
        const genreSelect = document.getElementById('genreSelect');
        if (genreSelect) {
            genreSelect.value = genre;
        }
        this.speak(displayName + ' mode');
        this.showFeedback(`🎵 ${displayName} Mode`, 'success');
    }

    /**
     * Helper: Set oscillator
     */
    setOscillator(type, displayName) {
        if (this.musicEngine.synthEngine === 'tonejs') {
            this.musicEngine.changeTonejsPreset('pad', type);
            this.musicEngine.changeTonejsPreset('lead', type);
            this.speak(displayName);
            this.showFeedback(`🎛️ ${displayName}`, 'success');
        }
    }

    /**
     * Helper: Set preset
     */
    setPreset(instrument, preset, displayName) {
        if (this.musicEngine.synthEngine === 'wad') {
            this.musicEngine.changeWadPreset(instrument, preset);
        } else if (this.musicEngine.synthEngine === 'tonejs') {
            this.musicEngine.changeTonejsPreset(instrument, preset);
        }
        this.speak(displayName);
        this.showFeedback(`🎹 ${displayName}`, 'success');
    }

    /**
     * Helper: Set drum machine
     */
    setDrumMachine(machine, displayName) {
        this.musicEngine.loadDrumMachine(machine);
        // Update UI dropdown
        const drumMachineSelect = document.getElementById('drumMachineSelect');
        if (drumMachineSelect) {
            drumMachineSelect.value = machine;
        }
        this.speak('TR ' + displayName);
        this.showFeedback(`🥁 TR-${displayName}`, 'success');
    }

    /**
     * Helper: Set synth engine
     */
    setSynthEngine(engine, displayName) {
        this.musicEngine.setSynthEngine(engine);
        const synthEngineSelect = document.getElementById('synthEngineSelect');
        if (synthEngineSelect) {
            synthEngineSelect.value = engine;
            synthEngineSelect.dispatchEvent(new Event('change'));
        }
        this.speak(displayName + ' engine');
        this.showFeedback(`🎛️ ${displayName} Engine`, 'success');
    }

    /**
     * Helper: Select shader by name
     */
    selectShaderByName(shaderName, displayName) {
        const shaderSelect = document.getElementById('mainShaderSelect');
        if (shaderSelect) {
            // Find the option with matching text
            for (let i = 0; i < shaderSelect.options.length; i++) {
                if (shaderSelect.options[i].text === shaderName) {
                    shaderSelect.selectedIndex = i;
                    shaderSelect.dispatchEvent(new Event('change'));
                    this.speak(displayName + ' shader');
                    this.showFeedback(`🎨 ${displayName} Shader`, 'success');
                    return;
                }
            }
            // If not found, show warning
            this.showFeedback(`⚠️ ${shaderName} shader not found`, 'warning');
        }
    }

    /**
     * Helper: Set drum pattern
     */
    setDrumPattern(pattern, displayName) {
        this.musicEngine.changeDrumPattern(pattern);
        // Update UI dropdown if exists
        const patternSelect = document.getElementById('drumPatternSelect');
        if (patternSelect) {
            patternSelect.value = pattern;
        }
        this.speak(displayName + ' pattern');
        this.showFeedback(`🥁 ${displayName} Pattern`, 'success');
    }

    /**
     * Speak text using TTS
     */
    speak(text) {
        if (!this.voiceFeedbackEnabled || !this.synthesis) return;

        // Cancel any ongoing speech
        this.synthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.2;
        utterance.pitch = 1.0;
        utterance.volume = 0.5;

        this.synthesis.speak(utterance);
    }

    /**
     * Show transcript in UI
     */
    showTranscript(transcript, confidence) {
        const display = document.getElementById('voiceTranscript');
        if (display) {
            display.textContent = transcript;
            display.style.opacity = confidence;
        }
    }

    /**
     * Show feedback message
     */
    showFeedback(message, type = 'info') {
        const feedback = document.getElementById('voiceFeedback');
        if (feedback) {
            feedback.textContent = message;
            feedback.className = `voice-feedback ${type}`;
            feedback.style.opacity = 1;

            setTimeout(() => {
                feedback.style.opacity = 0;
            }, 2000);
        }
    }

    /**
     * Update UI state
     */
    updateUI(state, error = null) {
        const indicator = document.getElementById('voiceIndicator');
        if (indicator) {
            indicator.className = `voice-indicator ${state}`;

            if (state === 'listening') {
                indicator.textContent = '🎤 Listening...';
            } else if (state === 'stopped') {
                indicator.textContent = '🎤 Voice Control Off';
            } else if (state === 'error') {
                indicator.textContent = `⚠️ Error: ${error}`;
            }
        }
    }

    /**
     * Add command to history
     */
    addToHistory(transcript, confidence) {
        this.commandHistory.unshift({
            transcript,
            confidence,
            timestamp: new Date()
        });

        if (this.commandHistory.length > this.maxHistoryLength) {
            this.commandHistory.pop();
        }

        this.updateHistoryUI();
    }

    /**
     * Update history UI
     */
    updateHistoryUI() {
        const historyList = document.getElementById('voiceHistory');
        if (historyList) {
            historyList.innerHTML = this.commandHistory
                .slice(0, 5)
                .map(cmd => `
                    <div class="history-item">
                        🎤 "${cmd.transcript}"
                        <span class="confidence">${(cmd.confidence * 100).toFixed(0)}%</span>
                    </div>
                `)
                .join('');
        }
    }

    /**
     * Toggle voice feedback
     */
    toggleVoiceFeedback() {
        this.voiceFeedbackEnabled = !this.voiceFeedbackEnabled;
        console.log(`🔊 Voice feedback: ${this.voiceFeedbackEnabled ? 'ON' : 'OFF'}`);
    }
}
