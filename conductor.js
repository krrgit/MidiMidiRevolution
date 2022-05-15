/** conductor.js
 *  Description: In charge of telling the renderer when to render objects 
 */

import {draw, drawStaves, drawMainSymbols} from './renderer.js';

const noteWidth = 28;
let MSTOPULSE = 1;
let PULSETOMS = 1;

function conductor (){
    this.loaded = false;
    this.clefs = [];
    this.key = {};
    this.time = {};
    this.key = [];
    this.startTime = 0;
    this.prevIterTime = 0;
    this.prevPulseTime = 0;
    this.deltaTime = 0;
    this.deltaPulseTime = 0;
    this.bpm = 120;
    this.scrollSpeed = 1;
}

conductor.prototype.resetTimer = function() {
    this.startTime = performance.now();
    this.prevIterTime = this.startTime;
    this.prevPulseTime = 0;
    this.deltaTime = 0;
    this.deltaPulseTime = 0;
}

conductor.prototype.start = function(sheet) {
    this.setMainSymbols(sheet);

    this.bpm = 60000000 / sheet.time.tempo;
    console.log('bpm:' + this.bpm);

    this.scrollSpeed = noteWidth * 2 / sheet.shortestDuration;
    MSTOPULSE = (1000 * sheet.time.quarternote/sheet.time.tempo);
    PULSETOMS = 1/MSTOPULSE;
    
    this.resetTimer();
}

conductor.prototype.setMainSymbols = function(sheet) {
    this.time = sheet.time;
    this.key = sheet.mainkey;

    for(let t=0;t<2;++t) {
        this.clefs.push(sheet.symbols[t][2]);
        let temp = sheet.symbols[t][1];
        sheet.symbols[t][1] = sheet.symbols[t][2];
        sheet.symbols[t][2] = temp;
    }
}

conductor.prototype.update = function(c,sheet) {
    drawMainSymbols(c, this);
    this.deltaTime = performance.now() - this.prevIterTime;
    this.deltaPulseTime = this.deltaTime * MSTOPULSE;
    this.scrollSpeed = (noteWidth * 4 / sheet.shortestDuration) * this.deltaPulseTime;
    console.log(this.scrollSpeed);
    
    draw(c,sheet, this, this.prevPulseTime, this.prevPulseTime + this.deltaPulseTime);
    // console.log(this.prevPulseTime, this.prevPulseTime + this.deltaPulseTime);
    
    this.prevIterTime += this.deltaTime; 
    this.prevPulseTime += this.deltaPulseTime;
}

export {conductor};
