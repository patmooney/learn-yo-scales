function Metronome() {
    this.to = null;
    this.lengthSec = 0.1;
    this.isPlaying = false;
}

Metronome.prototype.stop = function stop() {
    if (this.to) {
        clearTimeout(this.to);
        this.isPlaying = false;
    }
}

Metronome.prototype.metronome = function metronome(speed, beatsPerBar) {
    const time = 60 / speed;
    this.stop();
    this.isPlaying = true;
    const lengthSec = this.lengthSec;
    const that = this;
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    (function run() {
        let beat = 1;
        that.to = setInterval(() => {
            const hz = beat === 1
                ? 660
                : 440;
            beat = beat >= beatsPerBar
                ? 1
                : beat + 1;
            // create Oscillator node
            playNote(audioCtx, hz, lengthSec);
        }, (time - 0.03) * 1000);
    })();
}

Metronome.prototype.train = function train(speed, max, upBy, upEveryN, beatsPerBar, cb) {
    this.stop();
    this.isPlaying = true;
    const that = this;
    const lengthSec = this.lengthSec;
    const maxItr = (max - speed) / upBy;

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    let nItr = 0, nCount = 0, beat = 1;

    (function run() {
        if (nItr > maxItr) {
            that.stop();
            return;
        }

        const hz = beat === 1
            ? 660
            : 440;
        const bpm = (speed + (nItr * upBy));
        const time = (60 / (speed + (nItr * upBy)));

        beat++;
        if (beat > beatsPerBar) {
            nCount++;
            beat = 1;
        }
        if (nCount >= upEveryN) {
            nItr++;
            nCount = 0;
        }

        cb({ bpm });
        that.to = setTimeout(() => {
            // create Oscillator node
            playNote(audioCtx, hz, lengthSec);
            run();
        }, (time - 0.03) * 1000);
    })();
}

function playNote(audioCtx, hz, lengthSec) {
    var oscGain = audioCtx.createGain();
    var oscillator = audioCtx.createOscillator();
    oscillator.frequency.setValueAtTime(hz, audioCtx.currentTime); // value in hertz
    oscillator.connect(oscGain);
    oscGain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    oscillator.start(now);
    oscGain.gain.setValueAtTime(0, now);
    oscGain.gain.linearRampToValueAtTime(1, now + 0.03);
    oscGain.gain.linearRampToValueAtTime(0.0001, now + 0.09);
    oscillator.stop(now + lengthSec);
}
