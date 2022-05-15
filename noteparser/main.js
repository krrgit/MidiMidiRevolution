/*
    Project Name : note-parser-js
    Project Url  : 
    Author       : krrgit
    Author URL   : 
    Description  : Note Parser library reads MIDI events structured as JS objects,
    and outputs sheet music symbols as a readable and structured JS object.
*/
import {keySignature, sheetChord, timeSignature} from './objects.js'
import {sheetTimeSig} from './symbols.js' 

(function(){
    'use strict';
    
    /**
     * [NoteParser description]
     * @type {Object}
     */
    const NoteParser = {

        parse: function(midi) {
            if (midi instanceof Object) return NoteParser.init(midi);
            else throw new Error('NoteParser.parse() : Invalid input provided');
        },

        init: function(midi) {
            let Sheet = {
                staffs:{}, 
                mainkey: {},
                symbols: [],
                time: {},
                shortestDuration: 0, // This is the shortest amount of time between chords. Used to compute scroll speed.

                // Create all music symbols needed for music notation
                createNotation: function(midi) {
                    let numtracks = Object.keys(midi.tracks).length;

                    this.time = new timeSignature(midi.timesig.numerator, midi.timesig.denominator, midi.timeDivision, midi.tempo);
                    for(let tracknum = 0; tracknum < numtracks;++tracknum) {
                        if (midi.tracks[tracknum].note.length == 0) continue;

                        let clefs = this.createClefMeasures(midi.tracks[tracknum].note);
                        let chords = this.createChords(tracknum, midi.tracks[tracknum].note, clefs);
                        this.symbols.push(this.createSymbols(chords, clefs, midi.endTime));
                    }
                },

                createSymbols: function(chords, clefs, endTime) {
                    let symbols = [];


                    this.shortestDuration = this.time.quarternote;
                    
                    symbols.push(new sheetTimeSig(this.time.numerator, this.time.denominator));
                    this.addBars(symbols,chords,endTime);
                    symbols = this.addRests(symbols);
                    symbols = this.addClefChanges(symbols);

                    return symbols;
                },
                
                addBars: function(symbols, chords, endTime) {
                    /* The starttime of the beginning of the measure */
                    let measuretime = 0;

                    let i = 0;
                    while (i < chords.length) {
                        if (measuretime <= chords[i].starttime) {
                            symbols.push({symbol: 'bar', starttime: measuretime});
                            measuretime += this.time.measure;
                        } else {
                            symbols.push(chords[i]);
                            ++i;                        
                        }
                    }

                    /* Keep adding bars until the last StartTime (the end of the song) */
                    while (measuretime < endTime) {
                        symbols.push({symbol: 'bar', starttime: measuretime});
                        measuretime += this.time.measure;
                    }

                    /* Add the final vertical bar to the last measure */
                    symbols.push({symbol: 'bar', starttime: measuretime});
                },

                addRests: function(symbols) {
                    let prevtime = 0;
                    let result = [];
                    let duration = 0;

                    symbols.forEach(symbol => {
                        duration = Math.max(0,symbol.starttime - prevtime);
                        if (duration > 0) {
                            result.push({symbol: 'rest', starttime: symbol.starttime,
                                duration: this.time.getNoteDuration(duration)});
                        }                        
                        result.push(symbol);

                        if (symbol instanceof sheetChord) {
                            prevtime = Math.max(symbol.endtime, prevtime);
                        } else {
                            prevtime = Math.max(symbol.starttime, prevtime);
                        }
                    });

                    return result;
                },

                addClefChanges: function(symbols) {
                    let result = [];
                    let prevChord = symbols[1];
                    let i = 0;
                    
                    // Push symbols until first chord
                    while(!prevChord instanceof sheetChord && i < symbols.length) {
                        prevChord = symbols[i];
                        result.push(symbols[i]);
                        ++i;
                    }

                    for(;i<symbols.length;++i) {
                        if(symbols[i] instanceof sheetChord) {
                            if(symbols[i].clef != prevChord.clef) {
                                result.push({symbol: symbols[i].clef, starttime: symbols[i].starttime});
                                prevChord = symbols[i];
                            }
                        }
                        result.push(symbols[i]);
                    }
                    return result;
                },

                createChords: function(tracknum, notes, clefs) {
                    let n = 0;
                    let chords = [];
                    let notegroup = [];

                    while (n < notes.length) {
                        let starttime = notes[n].startTime;
                        let c = starttime / this.time.measure >= clefs.length ? clefs.length-1 : Math.floor(starttime / this.time.measure); 
                        let clef = clefs[c];

                        /* Group all the midi notes with the same start time
                        * into the notes list.
                        */
                        notegroup = [];
                        notegroup.push(notes[n]);
                        ++n;
                        while (n < notes.length && notes[n].startTime == starttime) {
                            notegroup.push(notes[n]);
                            ++n;
                        }
                        let chord = new sheetChord(notegroup, this.mainkey, this.time, clef);
                        
                        this.findShortestTimeSeparation(notegroup[0].duration);

                        chords.push(chord);
                    }
                    return chords;
                },

                findShortestTimeSeparation: function(diff) {
                    this.shortestDuration = diff < this.shortestDuration ? diff : this.shortestDuration; 
                },

                // Symbol creation functions
                /**
                 * creates an array of clefs best suited for each measure
                 * @param midi midi notes
                 * @param measure measure length in pulses
                 */
                createClefMeasures: function (notes) {
                    let total = 0;
                    notes.forEach(m => {
                        total += m.notenumber;    
                    });
                    
                    // Find best clef based on the average note.
                    let mainclef = 'Bass';
                    // 60 is middle C
                    if (notes.length || total/notes.length >= 60) {
                        mainclef = 'Treble';
                    }

                    let clefs = [];
                    let clef = mainclef;
                    let n = 0;
                    let nextmeasure = this.time.measure;
                    while (n < notes.length) {
                        /* Sum all the notes in the current measure */
                        let sumnotes = 0;
                        let notecount = 0;
                        while(n < notes.length && notes[n].startTime < nextmeasure) {
                            sumnotes += notes[n].notenumber;
                            ++notecount;
                            ++n;
                        }
                        if (notecount == 0) notecount = 1;

                        /* Calculate the "average" note in the measure */
                        let avgnote = sumnotes / notecount;
                        if (avgnote == 0) {
                            /* This measure doesn't contain any notes.
                            * Keep the previous clef.
                            */
                        } else if (avgnote >= 65) {     // 65 is lowest F on Treble Clef
                            clef = 'Treble';
                        } else if (avgnote <= 57) {     // 57 is highest F on Bass Clef
                            clef = 'Bass';
                        } else {
                            /* The average note is between G3 and F4. We can use either
                            * the treble or bass clef.  Use the "main" clef, the clef
                            * that appears most for this track.
                            */
                            clef = mainclef;
                        }
                        clefs.push(clef);
                        nextmeasure += this.time.measure;
                        if (nextmeasure > midi.endTime) {n = notes.length;}
                    }
                    clefs.push(clef);
                    return clefs;
                },
                
                // Sheet Music Functions 
                getKeySignature: function(tracks) {
                    this.mainkey = new keySignature(tracks);
                },
            };

            NoteParser.quantize(midi);
            Sheet.getKeySignature(midi.tracks);

            Sheet.createNotation(midi);
            return Sheet;
        },
        
        /**
         * Quantizes the notes so that close notes appear as a single chord,
         * and reduces the amount of rests. 
         * @param {Object} midi 
         */
        quantize: function(midi) {
            NoteParser.roundStartTimes(midi.tracks, midi.timeDivision, midi.tempo);
            NoteParser.roundDurations(midi.tracks, midi.timeDivision);
        },

        roundStartTimes: function(tracks, quarternote, tempo) {
            let starttimes = [];
            for(let t=0;t<Object.keys(tracks).length;++t) {
                tracks[t].note.forEach(note => {
                    starttimes.push(note.startTime);
                });
            }

            starttimes.sort((a, b) => {
                return a - b;
            });

            
            let millisec = 40;
            let interval = quarternote * millisec * 1000 / tempo;
            
            /* If two starttimes are within interval millisec, make them the same */
            for (let i = 0; i < starttimes.Count - 1; i++) {
                if (starttimes[i+1] - starttimes[i] <= interval) {
                    starttimes[i+1] = starttimes[i];
                }
            }

            /* Adjust the note starttimes, so that it matches one of the starttimes values */
            for(let t=0;t<Object.keys(tracks).length;++t) {
                let i = 0;
                tracks[t].note.forEach(note => {
                    while (i < starttimes.Count &&
                        note.StartTime - interval > starttimes[i]) {
                        ++i;
                    }
    
                    if (note.StartTime > starttimes[i] &&
                        note.StartTime - starttimes[i] <= interval) {
    
                        note.StartTime = starttimes[i];
                    }
                });
                tracks[t].note.sort((a, b) => {
                    return a - b;
                });
            }
        },
        
        roundDurations: function(tracks, quarternote) {
            for(let t=0;t<Object.keys(tracks).length;++t) {
                let prevNote = {}; // let prevNote = track[t].note[0];
                for(let i=0;i< tracks[t].note.length-1;++i) {
                    // let note1 = tracks[t].note[i];
                    if (prevNote == null) {
                        prevNote = tracks[t].note[i];
                    }

                    /* Get the next note that has a different start time */
                    let note2 = tracks[t].note[i];
                    for (let j = i+1; j < tracks[t].note.length; ++j) {
                        note2 = tracks[t].note[j];
                        if (tracks[t].note[i].startTime < note2.startTime) {
                            break;
                        }
                    }

                    let maxduration = note2.startTime - tracks[t].note[i].startTime;

                    let dur = Math.floor(maxduration * 8 / quarternote) * quarternote / 8;
 
                    /* Special case: If the previous note's duration
                    * matches this note's duration, we can make a notepair.
                    * So don't expand the duration in that case.
                    */
                    if ((prevNote.startTime + prevNote.duration == tracks[t].note[i].startTime) &&
                    (prevNote.duration == tracks[t].note[i].duration)) {

                        dur = tracks[t].note[i].duration;
                    }
                    tracks[t].note[i].duration = dur;
                    if (tracks[t].note[i+1].startTime != tracks[t].note[i].startTime) {
                        prevNote = tracks[t].note[i];
                    }
                }
            }
        },   

    };

    // if running in NODE export module
    if(typeof module !== 'undefined') module.exports = NoteParser;
    else{
        // if running in Browser, set a global variable.
        let _global = typeof window === 'object' && window.self === window && window ||
                    typeof self === 'object' && self.self === self && self ||
                    typeof global === 'object' && global.global === global && global;

        _global.NoteParser = NoteParser;
    }


    
})();