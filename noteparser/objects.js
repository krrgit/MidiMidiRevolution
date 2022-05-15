const keyAccids = {
    C: 0,
    G: 1,
    D: 2,
    A: 3,
    E: 4,
    B: 5,
    F: -1,
    Bflat: -2,
    Eflat: -3,
    Aflat: -4,
    Dflat: -5,
    Gflat: -6,
}

const accid = {
    none: 0,
    flat: 1,
    sharp: 2,
    natural: 3,
}

function timeSignature (numerator, denominator, quarternote, tempo) {
    this.numerator = numerator;
    this.denominator = denominator;
    this.quarternote = quarternote;
    this.tempo = tempo;
    this.symbol = 'timesig';

    let beat = quarternote * (denominator == 2 ? 2 : 1/(denominator/4));
    if (denominator == 2)
        beat = quarternote * 2;
    else
        beat = quarternote / (denominator/4);

    this.measure = numerator * beat;
}

timeSignature.prototype.getNoteDuration = function (duration) {
    let value = Math.floor(duration * 8 / this.quarternote);
    // console.log(value);
    return value == 2 && (duration * 8 / this.quarternote) % 1 > 0 ? value + Math.floor(value * 2/3) : value;
    // when its 2 with remainder, its a triplet 
}

function keySignature (tracks) {
    this.naturals = Array(12).fill(0);

    let notecount = this.getNoteFrequency(tracks);
    
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


    // Special Cases: 
    // F#/Gb, bestkey = 9
    // Db/C#, bestkey = 4
    // B/Cb, bestkey = 2
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

keySignature.prototype.getWhiteNote = function(notenumber){
    let sheetNote = {
        notescale: midiToNoteScale(notenumber),
        octave: Math.floor((notenumber + 3) / 12 - 1),
        letter: midiToNoteScale(notenumber),
        accid: 0,
    };

    // Map of every notescale that could be an accidental in the current key
    let accidMap = [9, 4, 11, 6, 1];
    accidMap.reduce(Math.abs(this.accidCount));    

    // 4 Cases: sharps, flats, natural, none
    /** If the note is a black key, the letter is determined by the key(sharp or flat)
     *  If it's a white key, see if the scale contains a sharp/flat version, and add a natural.
     *  If none is true, then no need for an accidental.
    */
    if (accidMap.includes(sheetNote.notescale)) {
        sheetNote.letter = this.accidCount >= 0 ? sheetNote.letter-1 : sheetNote.letter+1;

        // If the previous note letter was a natural, re-add the accidental
        if (this.naturals[sheetNote.notescale] == 1) {
            sheetNote.accid = this.accidCount >= 0 ? 2 : 1;
            this.naturals[sheetNote.notescale] = 0;
        }

    } else if (accidMap.reduce(sheetNote.notescale + Math.sign(this.accidCount))) {
        sheetNote.accid = accid.natural;

        // If we use a natural, keep track so next note applies its proper accidental
        this.naturals[notescale + Math.sign(this.accidCount)] = 1;
    }

    /* The above algorithm doesn't quite work for G-flat major.
    * Handle it here.
    */
    if (this.accidCount == keyAccids.Gflat) {
        switch(sheetNote.letter) {
            case 1:
            case 2:
                ++sheetNote.letter;
                break;
            default:
                break;
        }
    }
    if (this.accidCount < 0 && notescale == 11) {
        ++sheetNote.octave;
    }
    return sheetNote;
}

Array.prototype.reduce = function(size) {
    while (this.length > size) { this.pop(); }
}

const midiToNoteScale = function(notenumber) {
    return (notenumber + 3) % 12; 
}

function sheetChord (notegroup, mainkey, time, clef) {
    this.notegroup = notegroup;
    this.clef = clef;
    this.starttime = notegroup[0].startTime;
    this.endtime = notegroup[0].startTime + notegroup[0].duration;
    this.symbol = 'chord';

    for (let n=0;n<notegroup.length;++n) {
        if (n > 1) {
            if (notegroup[n].notenumber < notegroup[n-1].notenumber) {
                throw new Error('Chord notes not in increasing order by number');
            }
        }
        this.endtime = Math.max(this.endtime, notegroup[n].startTime + notegroup[n].duration);
    }
    this.sheetnotes = this.createSheetNotes(notegroup, mainkey, time);
}

sheetChord.prototype.createSheetNotes = function(notegroup, key, time) {
    let sheetnotes = [];
    
    for(let n=0;n<notegroup.length;++n) {
        sheetnotes.push({
            number: notegroup[n].notenumber,
            leftside: true,
            whitenote: key.getWhiteNote(notegroup[n].notenumber),
            duration: notegroup[n].duration,
        });
    }
    return sheetnotes;
}

sheetChord.prototype.createAccidentals = function() {

}

export {keySignature, sheetChord, timeSignature}