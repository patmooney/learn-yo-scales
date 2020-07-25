// MIT License found https://github.com/patmooney/learn-yo-scales/blob/master/LICENSE
const notes = ['Ab', 'A','Bb','B','C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G'];
const intervals = ['Perfect Unison (I)', 'Minor Second (Flat II)',
    'Major Second (II)',
    'Minor Third (Flat III)', 'Major Third (III)', 'Perfect Fourth (IV)',
    'Tri-Tone (Flat V)', 'Perfect Fifth (V)', 'Minor Sixth (Flat VI)',
    'Major Sixth (VI)', 'Minor Seventh (Flat VII)', 'Major Seventh (VII)',
    'Perfect Octave (VIII)'];

const modes = { // Obviously a TODO to extend
    'Ionian': [2, 2, 1, 2, 2, 2, 1] // whole whole half etc
};
const synonym = {
    'A#': 'Bb',
    'Db': 'C#',
    'D#': 'Eb',
    'Gb': 'F#',
    'G#': 'Ab'
};

const colourSchemes = {
    night: {
        bg: '#636363',
        correct: '#436343',
        wrong: '#634343'
    },
    day: {
        bg: '#FFFFFF',
        correct: '#DDFFDD',
        wrong: '#FFDDDD'
    }
};

const noteMap = notes.reduce(
    (nacc, n, nIdx) => ({ ...nacc, [n]: intervals.reduce(
        (iacc, i, iIdx) => ({
            ...iacc,
            [i]: getNote(nIdx, iIdx)
        }), {}
    ) }), {}
);

function getNote(nIdx, iIdx) {
    const idx = parseInt(nIdx) + parseInt(iIdx);
    if (idx > notes.length - 1) {
        return notes[idx - (notes.length)];
    }
    return notes[idx];
}

/*
    START completely over-engineers one-page web app without a framework bullshit
*/
const containersMap = Array.prototype.reduce.call(
    document.querySelectorAll('div.container'),
    (acc, el) => ({
        ...acc,
        [el.dataset.container]: el
    }), {}
);
const dispatch = { help, game, metronome };
const goEvt = new Event('go');
const cleanEvt = new Event('clean');
Object.values(containersMap).forEach(
    el => el.addEventListener('go', dispatch[el.dataset.container])
);

// start, AKA switch to new container and init it
function start(mode) {
    const currentMode = document.querySelector('div.container.show');
    if (currentMode) {
        currentMode.classList.remove('show');
        currentMode.dispatchEvent(cleanEvt);
        mode = mode || currentMode.dataset.container;
    } else {
        mode = mode || 'play';
    }
    const newMode = document.querySelector(`div.container[data-container="${mode}"]`);
    newMode.classList.add('show');
    newMode.dispatchEvent(goEvt);
}
/*
    END, I promise
*/

function getAllowedNotes() {
    let allowedNotes = Array.prototype.map.call(
        document.querySelectorAll('div.note-sel.selected'),
        el => el.innerText
    );
    return allowedNotes.length ? allowedNotes : notes;
}

// Per mode, and whether we should include accidental notes
function getAllowedIntervals () {
    const allowedIntervals = Array.prototype.map.call(
        document.querySelectorAll('div.interval-sel.selected'),
        el => intervals[el.dataset.val]
    );
    if (allowedIntervals.length) {
        return allowedIntervals;
    }

    const mode = 'Ionian'; // to be continued....
    if (document.getElementById('include-accidentals').checked) {
        return intervals;
    }

    // convert the modal relative intervals (whole whole half etc) into
    // absolute indexes for our list of intervals
    const modalIdxs = modes[mode].reduce(
        (acc, skip) => ([ ...acc, acc.slice(-1)[0] + skip ]), [0]
    );

    // convert absolute indexes into interval labels
    return modalIdxs.reduce(
        (acc, idx) => ([ ...acc, intervals[idx] ]), []
    );
}

// containers /  views
function help(evt) {
    const allowedNotes = getAllowedNotes();
    const allowedIntervals = getAllowedIntervals();
    const container = evt.target;
    container.innerHTML = "";
    allowedNotes.forEach(
        note => {
            const div = document.createElement('div');
            const ul = document.createElement('ul');
            const title = document.createElement('h3');
            title.innerText = note;
            div.appendChild(title);

            allowedIntervals.forEach(
                interval => {
                    const intNote = noteMap[note][interval];
                    const li = document.createElement('li');
                    li.innerHTML = `${interval}: <strong>${intNote}</strong>`;
                    ul.appendChild(li);
                }
            )
            div.appendChild(ul);
            container.appendChild(div);
        }
    );
}

function metronome(evt) {
    const metro = new Metronome();
    const goButton = document.createElement('button');
    goButton.innerText = 'Start';
    goButton.addEventListener('click', () => {
        const speed = Math.max(Math.min(parseInt(document.getElementById('startBPM').value) || 60, 240), 40);
        const max = Math.max(Math.min(parseInt(document.getElementById('endBPM').value) || 120, 240), 45);
        const upBy = Math.max(Math.min(parseInt(document.getElementById('increase').value) || 5, 30), 1);
        const upEveryN = Math.max(Math.min(parseInt(document.getElementById('barCount').value) || 4, 20), 1);
        const readOut = document.getElementById('bpm');
        metro.go(speed, max, upBy, upEveryN, (n) => readOut.innerText = `${n.bpm} bpm`);
    });
    evt.target.addEventListener(
        'clean',
        () => {
            goButton.parentNode.removeChild(goButton);
            metro.go()
        },
        { once: true }
    );
    evt.target.appendChild(goButton);
}

function game() {
    const text = document.getElementById('t');
    const list = document.getElementById('l');
    const scoreboard = document.getElementById('score');
    const answerContainer = document.getElementById('answer');
    let score = 0, total = -1, sTime = 0, tTime = -1;
    list.innerHTML = "";
    const allowedNotes = getAllowedNotes();
    const allowedIntervals = getAllowedIntervals();

    // view
    function printButtons(initial = false) {
        const isRandom = document.getElementById('randomise-buttons').checked;
        const shouldRandom = isRandom && initial
            ? true
            : isRandom && Math.random() >= 0.8;

        if (!initial && !shouldRandom) {
            return;
        }

        const buttonNotes = shouldRandom
            ? shuffle(notes.slice())
            : notes;

        answerContainer.innerHTML = "";
        buttonNotes.forEach(
            n => {
                const divAns = document.createElement('div');
                divAns.classList.add('note-answer');
                divAns.addEventListener('click', submitAnswer);
                divAns.dataset.val = n;
                divAns.innerText = n;
                answerContainer.appendChild(divAns);
            }
        );
    }

    function normalise(input) {
        let normal = cF(input);
        normal = synonym[normal] || normal;
        if (notes.indexOf(normal) === -1){
            return false;
        }
        return normal;
    }


    function submitAnswer(e) {
        const answer = normalise(e.target.dataset.val);
        const correct = getNote(t.dataset.note, t.dataset.interval);
        if (answer === correct) {
            onCorrect(text.innerText, correct);
        } else {
            onWrong(text.innerText, correct, answer);
        }
        newQuestion();
        printButtons();
    }

    function cF(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    function newQuestion() {
        // Get random note/interval pair
        const nIdx = getAllowedRandomNote();
        const iIdx = getAllowedRandomInterval();

        // Maintain state within the element
        t.dataset.note = nIdx;
        t.dataset.interval = iIdx;
        text.innerHTML = `${intervals[iIdx]} of <strong>${notes[nIdx]}</strong>`;

        // Update view
        total++;
        const avgTime = tTime > -1 && ((tTime / score) / 1000).toFixed(3);
        scoreboard.innerText = `Answered ${score} of ${total} / avg. time: ${avgTime ? `${avgTime}s` : '-'}`;
        sTime = Date.now();                
    }

    function getAllowedRandomNote() {
        const nIdx = Math.round(Math.random() * (allowedNotes.length - 1));
        return notes.indexOf(allowedNotes[nIdx]);
    }

    function getAllowedRandomInterval() {
        const iIdx = Math.round(Math.random() * (allowedIntervals.length - 1));
        return intervals.indexOf(allowedIntervals[iIdx]);
    }

    function onError(desc) {
        output(`<strong class='text-error'>Error:</strong> ${desc}`);
    }

    function onCorrect(desc, correct) {
        score++;
        tTime += Date.now() - sTime;
        output(`<strong class='text-correct'>Correct</strong> - The ${desc} is ${correct}`);
        flash('correct');
    }

    function getColourScheme() {
        if (document.getElementById('night-mode').checked) {
            return colourSchemes.night;
        }
        return colourSchemes.day;
    }

    function flash(adj) {
        const cS = getColourScheme();
        document.body.style.transition = "";
        document.body.style.backgroundColor = cS[adj];
        setTimeout(() => {
            document.body.style.transition = "background-color 1.5s";
            document.body.style.backgroundColor = cS.bg;
        });
    }

    function onWrong(desc, correct, wrong) {
        output(`<strong class='text-wrong'>Wrong</strong> - The ${desc}
            is <strong><u>${correct}</u></strong>, not ${wrong}`);
        flash('wrong');
    }

    function output(html) {
        const li = document.createElement('li');
        li.innerHTML = html;
        list.insertBefore(li, list.firstChild);
    }

    // thankyou https://bost.ocks.org/mike/shuffle/
    function shuffle(array) {
        let m = array.length, t, i;

        while (m) {
            i = Math.floor(Math.random() * m--);
            t = array[m];
            array[m] = array[i];
            array[i] = t;
        }
        return array;
    }

    newQuestion();
    printButtons(true);
}

// global menu/settings setup
const noteFilterContainer = document.getElementById('note-filter');
notes.forEach(
    n => {
        const divFil = document.createElement('div');
        divFil.classList.add('note-sel', 'filter-sel');
        divFil.addEventListener('click', evt => {
            const el = evt.target;
            if (el.classList.contains('selected')) {
                el.classList.remove('selected');
            } else {
                el.classList.add('selected');
            }
            start();
        });
        divFil.dataset.val = n;
        divFil.innerText = n;
        noteFilterContainer.appendChild(divFil);
    }
);

const intervalFilterContainer = document.getElementById('interval-filter');
['I', 'IIb', 'II', 'IIIb', 'III', 'IV', 'Vb', 'V', 'VIb', 'VI', 'VIIb', 'VII', 'VIII'].forEach(
    (i, idx) => {
        const divFil = document.createElement('div');
        divFil.classList.add('interval-sel', 'filter-sel');
        divFil.addEventListener('click', evt => {
            const el = evt.target;
            if (el.classList.contains('selected')) {
                el.classList.remove('selected');
            } else {
                el.classList.add('selected');
            }
            start();
        });
        divFil.dataset.val = idx;
        divFil.innerText = i;
        intervalFilterContainer.appendChild(divFil);
    }
);

document.getElementById('include-accidentals').addEventListener(
    'change', evt => start()
);

document.querySelectorAll('h4.item > a').forEach(
    el => el.addEventListener('click', (evt) => {
        evt.preventDefault();
        start(el.dataset.mode);
    })
);

document.getElementById('toggle-options').addEventListener(
    'click', evt => {
        const optContainer = document.getElementById('options');
        optContainer.style.display = optContainer.style.display === 'block'
            ? 'none'
            : 'block';
    }
);

document.getElementById('night-mode').addEventListener(
    'change', evt => {
        document.body.style.transition = "background-color 1.5s";
        if (evt.target.checked) {
            document.body.style.backgroundColor = colourSchemes.night.bg;
        } else {
            document.body.style.backgroundColor = colourSchemes.day.bg;
        }
    }
);

window.onload = () => start('game');
