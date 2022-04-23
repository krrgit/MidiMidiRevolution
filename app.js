import {MidiParser} from '../midiparser/midi-parser.js';

let source = document.getElementById('filereader');
let mid = {}
window.onload = function(){
    // configure MIDIReader
    var source = document.getElementById('filereader');
    MidiParser.parse( source, function(obj){
        // Your callback function
        mid = obj;
        console.log(mid);
        document.getElementById("output").innerHTML = JSON.stringify(obj, undefined, 2);
    });
};