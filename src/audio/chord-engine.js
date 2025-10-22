/**
 * Chord Engine
 * Generates chords based on scale degrees and modes
 */

class ChordEngine {
    constructor() {
        // Base note frequencies (A4 = 440Hz)
        this.baseOctave = 4;
        this.currentOctave = 4;
        this.currentScale = 'phrygian';
        this.currentRoot = 'C';

        // Define scales as intervals from root (semitones)
        this.scales = {
            major: [0, 2, 4, 5, 7, 9, 11],          // Ionian
            minor: [0, 2, 3, 5, 7, 8, 10],          // Aeolian (natural minor)
            phrygian: [0, 1, 3, 5, 7, 8, 10],       // Phrygian mode
            dorian: [0, 2, 3, 5, 7, 9, 10],         // Dorian mode
            lydian: [0, 2, 4, 6, 7, 9, 11],         // Lydian mode
            mixolydian: [0, 2, 4, 5, 7, 9, 10],     // Mixolydian mode
            pentatonic: [0, 2, 4, 7, 9],            // Major pentatonic
            blues: [0, 3, 5, 6, 7, 10]              // Blues scale
        };

        // Note names
        this.noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

        // Chord quality for each scale degree in different modes
        this.chordQualities = {
            major: ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'],        // I ii iii IV V vi vii°
            minor: ['min', 'dim', 'maj', 'min', 'min', 'maj', 'maj'],        // i ii° III iv v VI VII
            phrygian: ['min', 'maj', 'maj', 'min', 'dim', 'maj', 'min'],     // i II III iv v° VI vii
            dorian: ['min', 'min', 'maj', 'maj', 'min', 'dim', 'maj'],       // i ii III IV v vi° VII
            lydian: ['maj', 'maj', 'min', 'dim', 'maj', 'min', 'min'],       // I II iii #iv° V vi vii
            mixolydian: ['maj', 'min', 'dim', 'maj', 'min', 'min', 'maj'],   // I ii iii° IV v vi VII
            pentatonic: ['maj', 'min', 'min', 'maj', 'min'],                  // I ii iii V vi
            blues: ['min', 'min', 'maj', 'maj', 'min', 'maj']                 // i bIII IV bV V bVII
        };

        this.playbackMode = 'sustain'; // 'sustain', 'arpeggio', or 'bass'
    }

    /**
     * Set the current scale/mode
     */
    setScale(scaleName) {
        if (this.scales[scaleName]) {
            this.currentScale = scaleName;
            console.log(`🎵 Scale changed to: ${scaleName}`);
        }
    }

    /**
     * Set the root note
     */
    setRoot(noteName) {
        if (this.noteNames.includes(noteName)) {
            this.currentRoot = noteName;
            console.log(`🎵 Root note changed to: ${noteName}`);
        }
    }

    /**
     * Set octave
     */
    setOctave(octave) {
        this.currentOctave = Math.max(1, Math.min(7, octave));
        console.log(`🎵 Octave changed to: ${this.currentOctave}`);
    }

    /**
     * Change octave relative to current
     */
    changeOctave(delta) {
        this.setOctave(this.currentOctave + delta);
    }

    /**
     * Set playback mode
     */
    setPlaybackMode(mode) {
        if (['sustain', 'arpeggio', 'bass'].includes(mode)) {
            this.playbackMode = mode;
            console.log(`🎵 Playback mode changed to: ${mode}`);
        }
    }

    /**
     * Cycle through playback modes
     */
    cyclePlaybackMode() {
        const modes = ['sustain', 'arpeggio', 'bass'];
        const currentIndex = modes.indexOf(this.playbackMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        this.setPlaybackMode(modes[nextIndex]);
        return this.playbackMode;
    }

    /**
     * Get chord notes for a given Roman numeral (I-VII)
     * @param {String} romanNumeral - 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'
     * @returns {Array} - Array of note names and frequencies
     */
    getChordNotes(romanNumeral) {
        // Convert Roman numeral to scale degree (0-6)
        const romanToIndex = { 'I': 0, 'II': 1, 'III': 2, 'IV': 3, 'V': 4, 'VI': 5, 'VII': 6 };
        const degree = romanToIndex[romanNumeral];

        if (degree === undefined) {
            console.warn(`Invalid Roman numeral: ${romanNumeral}`);
            return [];
        }

        const scale = this.scales[this.currentScale];
        const qualities = this.chordQualities[this.currentScale];

        if (!scale || !qualities) {
            console.warn(`Scale not found: ${this.currentScale}`);
            return [];
        }

        // Get root note of the chord
        const rootInterval = scale[degree % scale.length];
        const chordQuality = qualities[degree];

        // Build triad based on quality
        let intervals;
        switch(chordQuality) {
            case 'maj':
                intervals = [0, 4, 7]; // Major triad: root, major 3rd, perfect 5th
                break;
            case 'min':
                intervals = [0, 3, 7]; // Minor triad: root, minor 3rd, perfect 5th
                break;
            case 'dim':
                intervals = [0, 3, 6]; // Diminished triad: root, minor 3rd, diminished 5th
                break;
            default:
                intervals = [0, 4, 7];
        }

        // Generate actual note frequencies
        const rootNoteIndex = this.noteNames.indexOf(this.currentRoot);
        const notes = intervals.map(interval => {
            const absoluteInterval = rootInterval + interval;
            const noteIndex = (rootNoteIndex + absoluteInterval) % 12;
            const octaveOffset = Math.floor((rootNoteIndex + absoluteInterval) / 12);
            const noteName = this.noteNames[noteIndex];
            const octave = this.currentOctave + octaveOffset;
            const frequency = this.getFrequency(noteName, octave);

            return {
                name: noteName + octave,
                frequency: frequency,
                interval: interval
            };
        });

        return notes;
    }

    /**
     * Get frequency for a note name and octave
     * @param {String} noteName - 'C', 'D', 'E', etc.
     * @param {Number} octave - Octave number
     * @returns {Number} - Frequency in Hz
     */
    getFrequency(noteName, octave) {
        const A4 = 440; // Reference frequency
        const noteIndex = this.noteNames.indexOf(noteName);
        const A4Index = this.noteNames.indexOf('A');

        // Semitones from A4
        const semitones = (noteIndex - A4Index) + (octave - 4) * 12;

        // Calculate frequency using equal temperament
        const frequency = A4 * Math.pow(2, semitones / 12);

        return frequency;
    }

    /**
     * Get notes formatted for the current playback mode
     * @param {String} romanNumeral - Chord degree
     * @returns {Object} - { notes, mode }
     */
    getChordForPlayback(romanNumeral) {
        const notes = this.getChordNotes(romanNumeral);

        switch(this.playbackMode) {
            case 'bass':
                // Return only root note
                return {
                    notes: [notes[0]],
                    mode: 'bass',
                    arpeggio: false
                };

            case 'arpeggio':
                // Return all notes for arpeggio
                return {
                    notes: notes,
                    mode: 'arpeggio',
                    arpeggio: true
                };

            case 'sustain':
            default:
                // Return all notes for sustained chord
                return {
                    notes: notes,
                    mode: 'sustain',
                    arpeggio: false
                };
        }
    }

    /**
     * Get scale notes (for display or melody generation)
     */
    getScaleNotes() {
        const scale = this.scales[this.currentScale];
        const rootNoteIndex = this.noteNames.indexOf(this.currentRoot);

        return scale.map(interval => {
            const noteIndex = (rootNoteIndex + interval) % 12;
            const octaveOffset = Math.floor((rootNoteIndex + interval) / 12);
            const noteName = this.noteNames[noteIndex];
            const octave = this.currentOctave + octaveOffset;
            const frequency = this.getFrequency(noteName, octave);

            return {
                name: noteName + octave,
                frequency: frequency
            };
        });
    }

    /**
     * Get current scale name (for display)
     */
    getCurrentScale() {
        return this.currentScale;
    }

    /**
     * Get current root note (for display)
     */
    getCurrentRoot() {
        return this.currentRoot;
    }

    /**
     * Get current octave (for display)
     */
    getCurrentOctave() {
        return this.currentOctave;
    }

    /**
     * Get current playback mode (for display)
     */
    getPlaybackMode() {
        return this.playbackMode;
    }
}
