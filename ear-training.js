// https://pages.mtu.edu/~suits/NoteFreqCalcs.html
// https://pages.mtu.edu/~suits/notefreqs.html
const LAMBDA = 1.059463; // 12th (i.e. one twelth) root of 2 = 2^(1/12)
const MID_NOTE = 261.63; // note number 19 C4
const MID_NOTE_N = 20;
const N_NOTES_21_FRET_GUITAR = 46; // E2 -> D6
const H_NOTES = N_NOTES_21_FRET_GUITAR - MID_NOTE_N;
const L_NOTES = - MID_NOTE_N;
const MOVEMENT_MAX = 8; // can move upto an octave from previous note
const earNotes = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const MAJOR_SCALE_PROB = [0, 0, 1, 2, 2, 2, 3, 3, 4, 4, 4, 5, 6, 6, 7]; // notes from the major scale (-1) probability
const MAJOR_SCALE_PATTERN = [2, 2, 1, 2, 2, 2, 1];
const NOTE_TIME = 0.75;

class EarTraining {
    constructor () {
        this.to = null;
        this.lengthSec = NOTE_TIME;
        this.isPlaying = false;
        this.lambda = 1.059463;
    }
    newPattern(noteCount = 16) {
        this.noteCount = noteCount;
        this.rootNote = (L_NOTES) + Math.round(Math.random() * N_NOTES_21_FRET_GUITAR);
        this.scale = this._getScale(this.rootNote);
        this.notes = this._getNotes();
        this.chords = this._getChords(this.rootNote, this.scale, Math.ceil(this.noteCount / 4));
    }
    stop () {
        if (this.to) {
            clearTimeout(this.to);
            this.isPlaying = false;
        }
    }
    _getNotes() {
        let nextNote = this.scale.indexOf(this.rootNote);
        const nextNotes = [this.scale[nextNote]];
        for (let i = 0; i < (this.noteCount - 1); i++) {
            nextNote = this._getRandomRelatedNote(nextNote, this.scale);
            nextNotes.push(this.scale[nextNote]);
        }
        return nextNotes;
    }
    playPattern(enableChords = true, cb = () => {}) {
        const nextNotes = this.notes;
        const chords = this.chords;
        this.stop();
        this.isPlaying = true;
        const chordPlayTime = this.lengthSec * 4;
        cb({ noteLabel: nextNotes.map(n => this._noteToLabel(n)).join(' - ') });
        let idx = 0;
        let chordIdx = 0;
        const run = () => {
            const note = nextNotes.at(idx);
            this._playNote(this._noteToHz(note), this.lengthSec, 0.5);
            if (enableChords && idx % 4 === 0){
                const chord = chords[chordIdx++];
                this._playNote(this._noteToHz(chord[0]), chordPlayTime, 0.1);
                this._playNote(this._noteToHz(chord[1]), chordPlayTime, 0.1);
                this._playNote(this._noteToHz(chord[2]), chordPlayTime, 0.1);
            }
            idx++;
            if (idx < nextNotes.length) {
                this.to = setTimeout(() => run(), 750);
            } else {
                this.to = setTimeout(() => this.stop(), 1000);
            }
        };
        run();
    }
    _noteToHz(note) {
        return MID_NOTE * (Math.pow(LAMBDA, note));
    }
    _getChords(rootNote, scale, numberOfChords = 4) {
        const chords = [];
        chords.push([rootNote, rootNote + 4, rootNote + 7]);
        for (let i = 0; i < (numberOfChords - 1); i++) {
            const chordRoot = this._getRandomRelatedNote(rootNote, scale);
            chords.push([scale[chordRoot], scale[chordRoot] + 4, scale[chordRoot] + 7]);
        }
        return chords;
    }
    _getScale(rootNote) {
        const notesAbove = [];
        let nIdx = rootNote;
        let sIdx = 0;
        while (nIdx <= H_NOTES) {
            notesAbove.push(nIdx);
            nIdx += MAJOR_SCALE_PATTERN[sIdx++];
            if (sIdx >= MAJOR_SCALE_PATTERN.length) {
                sIdx = 0;
            }
        }
        const notesBelow = [];
        sIdx = MAJOR_SCALE_PATTERN.length-1;
        nIdx = rootNote;
        while (nIdx >= L_NOTES) {
            notesBelow.unshift(nIdx);
            nIdx -= MAJOR_SCALE_PATTERN[sIdx--];
            if (sIdx < 0) {
                sIdx = MAJOR_SCALE_PATTERN.length-1;
            }
        }
        return [...notesBelow, ...notesAbove];
    }
    _playNote(hz, lengthSec, maxVolume = 1) {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        var oscGain = audioCtx.createGain();
        var oscillator = audioCtx.createOscillator();
        oscillator.frequency.setValueAtTime(hz, audioCtx.currentTime); // value in hertz
        oscillator.type = 'triangle';
        oscillator.connect(oscGain);
        oscGain.connect(audioCtx.destination);
        const now = audioCtx.currentTime;
        oscillator.start(now);
        oscGain.gain.setValueAtTime(0, now);
        oscGain.gain.linearRampToValueAtTime(maxVolume, now + 0.03);
        oscGain.gain.linearRampToValueAtTime(0.0001, now + lengthSec);
        oscillator.stop(now + lengthSec);
    }
    _getRandomRelatedNote(prevNote, scale) {
        // major key for now...
        const newNote = prevNote + (-8 + Math.round(Math.random() * 16));
        if (newNote < 0) {
            return 0-newNote;
        }
        if (newNote >= scale.length) {
            return scale.length - (newNote - scale.length) - 1;
        }
        return newNote;
    }
    _noteToLabel(rootNote) {
        const rootOffset = rootNote % earNotes.length;
        const octaveOffset = Math.floor(rootNote / earNotes.length);
        return `${earNotes.at(rootOffset)}${4+octaveOffset}`;
    }
}
