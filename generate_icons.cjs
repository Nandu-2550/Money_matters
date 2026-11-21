const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

function createCrcTable() {
  let c;
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c;
  }
  return crcTable;
}

const crcTable = createCrcTable();

function crc32(buf) {
  let crc = 0 ^ -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ -1) >>> 0;
}

function writePng(width, height, pixelFn, outPath) {
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);
  
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelFn(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  function makeChunk(type, data) {
    const typeBuf = Buffer.from(type, 'ascii');
    const len = data.length;
    const header = Buffer.alloc(4);
    header.writeUInt32BE(len, 0);
    const crcVal = crc32(Buffer.concat([typeBuf, data]));
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crcVal, 0);
    return Buffer.concat([header, typeBuf, data, crcBuf]);
  }

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', deflated);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  const png = Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
  fs.writeFileSync(outPath, png);
}

// Function to draw shield + rupee
function drawIcon(x, y, w, h) {
  const nx = x / w; // 0 to 1
  const ny = y / h; // 0 to 1
  
  // Background: Deep Slate Gradient (#0f172a to #020617)
  let r = Math.round(15 - ny * 10);
  let g = Math.round(23 - ny * 15);
  let b = Math.round(42 - ny * 20);
  let a = 255;

  // Normalized distance from center (0.5, 0.5)
  const cx = nx - 0.5;
  const cy = ny - 0.5;

  // Outer Shield shape math:
  // y from 0.15 to 0.85
  // width varies: at top flat, then curves down to bottom point (0.5, 0.85)
  const shieldTop = 0.15;
  const shieldBottom = 0.85;
  const shieldHalfW = 0.35;
  
  let inShield = false;
  if (ny >= shieldTop && ny <= shieldBottom) {
    const progress = (ny - shieldTop) / (shieldBottom - shieldTop);
    let maxW;
    if (progress < 0.4) {
      maxW = shieldHalfW;
    } else {
      maxW = shieldHalfW * (1 - Math.pow((progress - 0.4) / 0.6, 1.8));
    }
    if (Math.abs(cx) <= maxW) {
      inShield = true;
    }
  }

  let inInnerShield = false;
  const innerTop = 0.18;
  const innerBottom = 0.80;
  const innerHalfW = 0.31;
  if (ny >= innerTop && ny <= innerBottom) {
    const progress = (ny - innerTop) / (innerBottom - innerTop);
    let maxW;
    if (progress < 0.4) {
      maxW = innerHalfW;
    } else {
      maxW = innerHalfW * (1 - Math.pow((progress - 0.4) / 0.6, 1.8));
    }
    if (Math.abs(cx) <= maxW) {
      inInnerShield = true;
    }
  }

  if (inShield) {
    // Shield Emerald / Mint border
    r = 16; g = 185; b = 129;
  }

  if (inInnerShield) {
    // Shield Core dark
    r = 15; g = 23; b = 42;
    
    // Draw Rupee Symbol (₹) inside
    // Top Bar 1: y in [0.32, 0.36], x in [0.36, 0.64]
    const inBar1 = (ny >= 0.32 && ny <= 0.36 && nx >= 0.36 && nx <= 0.64);
    // Bar 2: y in [0.40, 0.44], x in [0.36, 0.64]
    const inBar2 = (ny >= 0.40 && ny <= 0.44 && nx >= 0.36 && nx <= 0.64);
    // Vertical Stem: y in [0.32, 0.65], x in [0.42, 0.47]
    const inStem = (ny >= 0.32 && ny <= 0.65 && nx >= 0.42 && nx <= 0.47);
    // Top loop: center around (0.47, 0.45), radius ~0.11, right half
    const loopDx = nx - 0.47;
    const loopDy = ny - 0.45;
    const loopDist = Math.sqrt(loopDx * loopDx + loopDy * loopDy);
    const inLoop = (loopDist >= 0.06 && loopDist <= 0.11 && loopDx >= 0 && ny <= 0.54);
    // Diagonal leg: from (0.45, 0.53) to (0.62, 0.70)
    let inLeg = false;
    if (ny >= 0.52 && ny <= 0.70) {
      const expectedX = 0.45 + (ny - 0.52) * 1.0;
      if (Math.abs(nx - expectedX) <= 0.035) {
        inLeg = true;
      }
    }

    if (inBar1 || inBar2 || inStem || inLoop || inLeg) {
      // Radiant Emerald / Neon Green Rupee
      r = 52; g = 211; b = 153;
    }
  }

  return [r, g, b, a];
}

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

writePng(192, 192, drawIcon, path.join(publicDir, 'pwa-192x192.png'));
console.log('Generated pwa-192x192.png');

writePng(512, 512, drawIcon, path.join(publicDir, 'pwa-512x512.png'));
console.log('Generated pwa-512x512.png');
