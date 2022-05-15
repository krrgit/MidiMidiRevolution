/** renderer.js
 * Description: Renders all the objects on screen.
 * */ 
// Position Values
const startx = 70;
const starty = 300;
const staffDist = 360;
const noteHeight = 28;
const noteWidth = 28;

let timesigStartx = 70;

let cutoffx = startx;

//Symbols
const sclef = ['','']; // [treble,clef]
const clefYOffset = [86,32];
const saccid = ['','','']; // #, flat, natural
const numer = ['','','','','','','','','','']; //numerators
const denom = ['','','','','','','','','','']; //denominators

let bars = []; // Array of xpos of all bars


function drawStaves(c) {
    c.fillRect(startx,starty,4, 476);
    for(let s=0;s<2;++s) {
        for (let l=0;l<5;++l) {
            c.fillRect(startx,starty+(l*noteHeight)+(s*staffDist),1850,4);
        }
    }
}

function drawMainSymbols(c,conductor) {
    c.font = '110px Bravura';
    for(let t=0;t<2;++t) {
        drawMainClef(c,conductor.clefs[t],t);
        drawMainAccid(c,conductor.clefs[t], conductor.key,t);
        drawMainTimeSig(c,conductor.time, t);
    }
    cutoffx = timesigStartx + 70;
}

function drawMainClef(c, clef, tracknum) {
    let i = clef.symbol == 'Treble' ? 0 : 1;
    c.fillText(sclef[i],startx+20,starty + clefYOffset[i] + (tracknum * staffDist));
}

function drawMainAccid(c, clef, key, tracknum) {
    let template = [[0,3,-1,2,5,1], [4,1,5,2,6,3]];
    let accidBinary = key.accidCount > 0 ? 0 : 1; // sharp or flat index
    let clefBinary = clef.symbol == 'Treble' ? 0 : 1;

    let count = Math.abs(key.accidCount);
    let accid = saccid[accidBinary];

    for(let i=0;i<count;++i) {
        c.fillText(accid, startx + 100 + (i*noteWidth), starty + (tracknum*staffDist) + ((template[accidBinary][i]+(clefBinary*2) )* noteHeight * 0.5));
    }

    timesigStartx = startx + 100 + (count*noteWidth) + noteWidth;
}

function drawMainTimeSig(c,timesig, tracknum) {
    c.fillText(numer[timesig.numerator],timesigStartx, starty + (tracknum*staffDist) + (4*28));
    c.fillText(denom[timesig.denominator],timesigStartx, starty + (tracknum*staffDist) + (4*28));
}

// Given a time frame, draw all the symbols between it
function draw(c, sheet, cond, prevPulse, currPulse) {
    for (let t = 0; t < 2; ++t) {

        let s = 0;
        while (s < sheet.symbols[t].length && sheet.symbols[t][s].starttime < currPulse) {
            if (prevPulse <= sheet.symbols[t][s].starttime) {
                console.log('symbol read');
                switch(sheet.symbols[t][s].symbol) {
                    case 'bar':
                        console.log('bar buffered');
                        bars.push(1920);
                        sheet.symbols[t].shift();
                        break;
                    default:
                        sheet.symbols[t].shift();
                        break;
                }
            }
            ++s;
        }
    }
    moveBars(cond.scrollSpeed);
    drawBars(c);
}

function bufferBar() {

}

function moveBars(speed) {
    for (let i = 0; i < bars.length; ++i) {
        bars[i] -= speed;
    }
    if (bars[0] <= cutoffx)
        bars.shift();
}

function drawBars(c) {
    bars.forEach(bar => {
        c.fillRect(bar,starty,4, 476);
    });
}


export {draw, drawStaves, drawMainSymbols};