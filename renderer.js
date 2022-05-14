// Position Values
const startx = 70;
const starty = 300;
const staffDist = 360;
const noteHeight = 28;
const noteWidth = 28;
let timesigStartx = 70;

//Symbols
const sclef = ['','']; // [treble,clef]
const clefYOffset = [86,32];
const saccid = ['','','']; // #, flat, natural
const numer = ['','','','','','','','','',''];
const denom = ['','','','','','','','','',''];


function drawStaves(c) {
    c.fillRect(startx,starty,4, 476);
    for(let s=0;s<2;++s) {
        for (let l=0;l<5;++l) {
            c.fillRect(startx,starty+(l*noteHeight)+(s*staffDist),1850,4);
        }
    }
}

function drawMainSymbols(c,sheet) {
    for(let t=0;t<2;++t) {
        drawMainClef(c,sheet.symbols[t][2],t);
        drawMainAccid(c,sheet.symbols[t][2], sheet.mainkey,t);
        drawTimeSig(c,sheet.time, t);
    }
}

function drawMainClef(c, clef, tracknum) {
    c.font = '110px Bravura';
    let i = clef.symbol == 'Treble' ? 0 : 1;
    c.fillText(sclef[i],startx+20,starty + clefYOffset[i] + (tracknum * staffDist));
}

function drawMainAccid(c, clef, key, tracknum) {
    let template = [[0,3,-1,2,5,1], [4,1,5,2,6,3]];
    let accidBinary = key.accidCount > 0 ? 0 : 1; // sharp or flat index
    let clefBinary = clef.symbol == 'Treble' ? 0 : 1;

    let count = Math.abs(key.accidCount);
    let accid = saccid[accidBinary];
    c.font = '110px Bravura';

    for(let i=0;i<count;++i) {
        c.fillText(accid, startx + 100 + (i*noteWidth), starty + (tracknum*staffDist) + ((template[accidBinary][i]+(clefBinary*2) )* noteHeight * 0.5));
    }

    timesigStartx = startx + 100 + (count*noteWidth) + noteWidth;
}

function drawTimeSig(c,timesig, tracknum) {
    c.fillText(numer[timesig.numerator],timesigStartx, starty + (tracknum*staffDist) + (4*28));
    c.fillText(denom[timesig.denominator],timesigStartx, starty + (tracknum*staffDist) + (4*28));
}


export {drawStaves, drawMainSymbols, drawMainClef, drawMainAccid};