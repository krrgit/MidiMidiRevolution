// import note parser (will create a reference in the global scope)
import './main.js';

// identify the global scope
let _global = typeof window === 'object' && window.self === window && window ||
            typeof self === 'object' && self.self === self && self ||
            typeof global === 'object' && global.global === global && global;

// retrieve a copy of the NoteParser reference and store it
let _NoteParser = _global.NoteParser;

// delete the global scope reference
delete _global.NoteParser;

// export the stored NoteParser reference
export {_NoteParser as NoteParser};