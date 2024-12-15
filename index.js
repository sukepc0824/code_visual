import * as chordJs from "https://esm.sh/@patrady/chord-js";

const chord = chordJs.Chord.for('C E G')

console.log(chord?.getName())

const note = chordJs.Note.fromMidi(24);

console.log(note.getScientificName());

navigator.requestMIDIAccess().then(successCallback, faildCallback);

var midi = null;
var inputs = [];
var outputs = [];

let pre_playing_notes = [];
let playing_notes = [];
let is_pushed;
let stable_pushed;
let notes_midi = []

// MIDI接続成功時
function successCallback(m) {
    midi = m;

    // 入力MIDIデバイスの記録
    var it = midi.inputs.values();
    for (var o = it.next(); !o.done; o = it.next()) {
        inputs.push(o.value);
    }

    var ot = midi.outputs.values();
    for (var o = ot.next(); !o.done; o = ot.next()) {
        outputs.push(o.value);
    }

    for (var cnt = 0; cnt < inputs.length; cnt++) {
        inputs[cnt].onmidimessage = onMIDIEvent;
    }
}

function faildCallback(msg) {
    console.log("[Error]:" + msg);
}

function f(a, b) {
    return a - b
}

function onMIDIEvent(e) {
    is_pushed = e.data[0] == 159
    let scale = e.data[1] - 36
    if (is_pushed) {
        playing_notes.push(scale)
        playing_notes.sort(f);
        quantize_check(playing_notes)
    } else {
        let note = playing_notes.indexOf(scale);
        playing_notes.splice(note, 1);
        quantize_check(playing_notes)
    }
    notes_midi = []
    playing_notes.forEach((v, i) => {
        notes_midi[i] = chordJs.Note.fromMidi(v + 36)
    })
}

let mp;

function quantize_check(pre) {
    let pre_notes = pre.toString()
    setTimeout(() => {
        if (playing_notes.toString() === pre_notes) {
            if (playing_notes.length > 0) {
                stable_pushed = true
                if (mp === undefined) {
                    mp = new MultiplePoints(playing_notes, playing_notes);
                } else {
                    mp = new MultiplePoints(playing_notes, mp.progress_list);
                }
                console.log(chordJs.Chord.for(notes_midi)?.getName())
            } else {
                stable_pushed = false
            }
        }
    }, 100);
}

///////////

const CANVAS = {
    width: 500,
    height: 500,
};
const RING = {
    size: 400,
};

const easing = {
    linear: (t) => t,
    easeInQuad: (t) => t * t,
    easeOutQuad: (t) => t * (2 - t),
    easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
    easeInCubic: (t) => t * t * t,
    easeOutCubic: (t) => --t * t * t + 1,
    easeInQuart: (t) => t * t * t * t,
    easeOutQuint: t => 1 + (--t) * t * t * t * t,
};

function setup() {
    createCanvas(CANVAS.width, CANVAS.height);
    background(0)
    mp = new MultiplePoints([0, 4, 7], [0, 1, 2])
}

let frame = 0

function draw() {
    for (let i = 0; i < 12; i++) {
        new NotePoint(i).point();
    }
    if (frame % 3 == 0 && mp !== undefined) {
        mp.move()
    }
    if (mp !== undefined) {
        if (mp.progress < 1) {
            //mp.move()
            //text(notes_midi.length ? chordJs.Chord.for(notes_midi)?.getName() : 0, 10, 10)
        }
    }
    frame++
}

class NotePoint {
    constructor(p_index) {
        this.i = p_index;
        this.y = (sin(((PI * 2) / 12) * (12 - this.i) - PI / 2) * RING.size) / 2 + CANVAS.height / 2;
        this.x = (cos(((PI * 2) / 12) * (12 - this.i) - PI / 2) * RING.size) / 2 + CANVAS.width / 2;
    }

    point() {
        point(this.x, this.y);
    }
}

class MultiplePoints {
    constructor(array, before_array) {
        this.array = array;
        this.before_array = before_array;

        this.progress = 0;
        this.progress_list = [];
        if (before_array !== undefined) {
            for (let i = 0; i < this.array.length; i++) {
                if (before_array[i] !== undefined) {
                    this.progress_list.push(before_array[i]);
                } else {
                    this.progress_list.push(max(before_array));
                    this.before_array.push(max(before_array))
                }
            }
        }
    }
    line() {
        background(0)
        this.array.forEach((pv) => {
            this.array.forEach((cv) => {
                let note1 = new NotePoint(pv);
                let note2 = new NotePoint(cv);
                strokeWeight(0.8);
                drawLineWithPoints(note1.x, note1.y, note2.x, note2.y, 15);
            });
        });
    }
    move() {
        if (this.before_array !== undefined && this.array !== undefined) {
            if (this.progress < 1) {
                this.array.forEach((v, i) => {
                    this.progress_list[i] = this.before_array[i] + (v - this.before_array[i]) * easing.easeOutQuint(this.progress)
                });
                new MultiplePoints(this.progress_list).line();
            } else {
                this.line();
            }
            this.progress += 1 / 60;
        }
    }
}


const sumArray = (numbers) => {
    let sum = 0;
    for (let i = 0; i < numbers.length; i++) {
        sum += numbers[i];
    }
    return sum;
};

function drawLineWithPoints(x1, y1, x2, y2, w) {
    let steps = dist(x1, y1, x2, y2);
    let stepSize = 1;
    circle(x1, y1, 10);
    circle(x2, y2, 10);
    for (let i = 0; i < steps; i += stepSize) {
        let x = lerp(x1, x2, i / steps) + (randomGaussian()) * w / 6 + w / 24; // x座標を補間
        let y = lerp(y1, y2, i / steps) + (randomGaussian()) * w / 6 + w / 24; // y座標を補間

        stroke(random(100, 255));
        circle(x, y, 1);
    }
}

function toanimation() {
    mp = new MultiplePoints([0,4,7,1], mp.progress_list);
}

window.setup = setup
window.draw = draw