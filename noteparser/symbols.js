function timeSignature (numerator, denominator, quarternote, tempo) {
    this.numerator = numerator;
    this.denominator = denominator;
    this.quarternote = quarternote;
    this.tempo = tempo;

    let beat = quarternote * (denominator == 2 ? 2 : 1/(denominator/4));
    if (denominator == 2)
        beat = quarternote * 2;
    else
        beat = quarternote / (denominator/4);

    this.measure = numerator * beat;
}

timeSignature.prototype.getNoteDuration = function (duration) {
    let value = Math.floor(duration * 8 / this.quarternote);
    return value == 5 ? 5 + (1/3) : value; // 5 = triplet
}

function keySignature (tracks) {
    let notecount = this.getNoteFrequency(tracks);
    console.log(notecount);


    // find the most frequent note
    // find which third is more frequent, major or minor
    // use as best guess
    let bestkey = 3;
    for (let n=0;n<12;++n) {
        bestkey = notecount[n] > notecount[bestkey] ? n : bestkey;
    }

    // Compare frequency of major & minor third
    let third = (bestkey+3)%12;
    let isminor = notecount[third] > notecount[third+1];

    // A,Bb,B,C,Db,D,Eb,E,F,F#/Fb,G,Ab
    // + sharps, - flats, number of accidentals for each key
    // none: 3
    // sharps: 10 5 0 7 2 9
    // flats: 8 1 6 11 4 9
    let accidIndex = [3,-2,5,0,-5,2,-3,4,-1,6,1,-4]; 


    // Special Case: F#/Fb, bestkey = 9
    // Find out which needs the least amount of accidentals
    if (bestkey == 9) {
    } else {
        this.accidCount = accidIndex[bestkey];
    }
}

keySignature.prototype.getNoteFrequency = function(tracks) {
    /* Get the frequency of each note in the 12 tone scale */ 
    let notecount = new Array(12).fill(0);
    let notescale = 0;
    for(let t=0;t<Object.keys(tracks).length;++t) {
        tracks[t].note.forEach(note => {
            // convert midi note to 12 tone scale note
            notescale = midiToNoteScale(note.notenumber); //(note.notenumber + 3) % 12; 
            ++notecount[notescale];
        });
    }
    return notecount;  
}


keySignature.prototype.GetWhiteNote = function(notenumber){
    let notescale = midiToNoteScale(notenumber);
    let octave = Math.floor((notenumber + 3) / 12 - 1);
    let accid = 0;

}

const midiToNoteScale = function(notenumber) {
    return (note.notenumber + 3) % 12; 
}

function sheetChord (notegroup, mainkey, time, clef) {
    this.notegroup = notegroup;
    this.clef = clef;
    this.starttime = notegroup[0].startTime;
    this.endtime = notegroup[0].startTime + notegroup[0].duration;

    for (let n=0;n<notegroup.length;++n) {
        if (n > 1) {
            if (notegroup[n].notenumber < notegroup[n-1].notenumber) {
                throw new Error('Chord notes not in increasing order by number');
            }
        }
        this.endtime = Math.max(this.endtime, notegroup[n].startTime + notegroup[n].duration);
    }

    sheetnotes = this.createSheetNotes(notegroup, mainkey, time);
}

sheetChord.prototype.createSheetNotes = function(notegroup, key, time) {
    this.sheetnotes = [];
    
    for(let n=0;n<notegroup.length;++n) {
        this.sheetnotes[n] = {
            number: notegroup[n].notenumber,
            leftside: true,
            whitenote: {},
            duration: notegroup[n].duration,
            accid: {}
        };
    }
}

sheetChord.prototype.createAccidentals = function() {

}

export {keySignature, sheetChord, timeSignature}