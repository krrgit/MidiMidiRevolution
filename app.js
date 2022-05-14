import {MidiParser} from '../midiparser/midi-parser.js';
import {NoteParser} from '../noteparser/note-parser.js';
import { drawStaves, drawMainSymbols, drawMainClef, drawMainAccid} from './renderer.js';


const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

canvas.width = innerWidth;
canvas.height = innerHeight;

let loaded = false;


function gameLoop() {
    requestAnimationFrame(gameLoop);
    c.clearRect(0,0,canvas.width,canvas.height);
    draw();
    console.log('update');
}

function draw() {
    drawStaves(c);
    if (!loaded) return;
    drawMainSymbols(c,sheet);
}

// Window Resizing Function
window.addEventListener('resize', reportWindowSize);
function reportWindowSize() {
    canvas.width = innerWidth;
    canvas.height = (innerWidth/1920) * 1080;
    c.scale(window.innerWidth/1920, window.innerWidth/1920);
}

reportWindowSize();
gameLoop();

// --------------------------------------------------------------------

let source = document.getElementById('filereader');
let mid = {}
let sheet = {}

window.onload = function(){
    // configure MIDIReader
    var source = document.getElementById('filereader');
    MidiParser.parse( source, function(_mid) {
        // Your callback function
        mid = _mid;
        console.log(mid);
        document.getElementById("output").innerHTML = JSON.stringify(_mid, undefined, 2);        
        sheet = NoteParser.parse(mid);
        console.log(sheet);
        loaded = true;
    });

            
};
