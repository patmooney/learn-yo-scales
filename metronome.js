function Metronome() {
    this.to = null;
    this.lengthSec = 0.1;
}

Metronome.prototype.go = function go(speed, max, upBy, upEveryN, cb) {
    if (this.to) {
        clearTimeout(this.to);
    }
    const that = this;

    var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = getNotes(speed, max, upBy, upEveryN);
    const lengthSec = this.lengthSec;

    (function run() {
        if (!notes.length) {
            return;
        }
        const { hz, time, bpm } = notes.shift();
        cb({ bpm });
        that.to = setTimeout(() => {
            // create Oscillator node
            var oscGain = audioCtx.createGain();
            var oscillator = audioCtx.createOscillator();
            oscillator.frequency.setValueAtTime(hz, audioCtx.currentTime); // value in hertz
            oscillator.connect(oscGain);
            oscGain.connect(audioCtx.destination);
            const now = audioCtx.currentTime;
            oscillator.start(now);
            oscGain.gain.setValueAtTime(0, now);
            oscGain.gain.linearRampToValueAtTime(1, now + 0.03);

            oscillator.stop(now + lengthSec);
            run();
        }, (time - 0.03) * 1000);
    })();

    function getNotes() {
        const notes = [];
        let currentBpm = speed;
        const maxItr = (max - speed) / upBy;
        for (let nItr = 0; nItr <= maxItr; nItr++) {
            const previousItr = notes.length
                ? notes.slice(-1)[0].time
                : 0;
            for (let nCount = 0; nCount < upEveryN; nCount++) {
                for (let beat = 1; beat < 5; beat++) {
                    let hz = 440;
                    if (beat > 0 && beat % 4 === 0){
                        hz = 660;
                    }
                    notes.push({
                        bpm: (speed + (nItr * upBy)),
                        hz,
                        time: (60 / (speed + (nItr * upBy))) //previousItr + ((nCount * 4) + beat) * (60 / (speed + (nItr * upBy)))
                    });
                }
            }
        }
        return notes;
    }
}
