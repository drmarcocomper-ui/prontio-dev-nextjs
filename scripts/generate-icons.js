/**
 * generate-icons.js
 *
 * Generates PWA icon PNGs for Prontio using only Node.js built-in modules.
 * Produces a white letter "P" on a sky-600 (#0284c7) background.
 *
 * Output files (in public/icons/):
 *   - icon-192.png          192x192
 *   - icon-512.png          512x512
 *   - icon-maskable-512.png 512x512  (extra padding for maskable safe-zone)
 *   - apple-touch-icon.png  180x180
 *
 * Usage:  node scripts/generate-icons.js
 */

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

// -- colour constants (sky-600 = #0284c7) --
const BG = { r: 2, g: 132, b: 199 };
const FG = { r: 255, g: 255, b: 255 };

// -- PNG helpers --
function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function uint32be(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n);
  return b;
}

function pngChunk(type, data) {
  const typeB = Buffer.from(type, "ascii");
  const payload = Buffer.concat([typeB, data]);
  return Buffer.concat([uint32be(data.length), payload, uint32be(crc32(payload))]);
}

function buildPNG(width, height, rgbBuf) {
  const rowBytes = width * 3;
  const raw = Buffer.alloc((rowBytes + 1) * height);
  for (let y = 0; y < height; y++) {
    const offset = y * (rowBytes + 1);
    raw[offset] = 0; // filter: None
    rgbBuf.copy(raw, offset + 1, y * rowBytes, (y + 1) * rowBytes);
  }

  const compressed = zlib.deflateSync(raw, { level: 9 });

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // colour type: RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  return Buffer.concat([
    signature,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", compressed),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

// -- Rasterise the letter "P" onto a pixel buffer --
function renderIcon(size, padding) {
  const buf = Buffer.alloc(size * size * 3);
  const cornerR = Math.round(size * 0.18);

  function isInsideRoundedRect(x, y) {
    if (x < cornerR && y < cornerR) {
      return (cornerR - x) ** 2 + (cornerR - y) ** 2 <= cornerR ** 2;
    }
    if (x >= size - cornerR && y < cornerR) {
      return (x - (size - 1 - cornerR)) ** 2 + (cornerR - y) ** 2 <= cornerR ** 2;
    }
    if (x < cornerR && y >= size - cornerR) {
      return (cornerR - x) ** 2 + (y - (size - 1 - cornerR)) ** 2 <= cornerR ** 2;
    }
    if (x >= size - cornerR && y >= size - cornerR) {
      return (x - (size - 1 - cornerR)) ** 2 + (y - (size - 1 - cornerR)) ** 2 <= cornerR ** 2;
    }
    return true;
  }

  // Fill background
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 3;
      if (isInsideRoundedRect(x, y)) {
        buf[idx] = BG.r; buf[idx + 1] = BG.g; buf[idx + 2] = BG.b;
      } else {
        buf[idx] = 255; buf[idx + 1] = 255; buf[idx + 2] = 255;
      }
    }
  }

  // Glyph positioning
  const pad = size * padding;
  const glyphL = pad + size * 0.28;
  const glyphT = pad + size * 0.18;
  const glyphR = pad + size * 0.72;
  const glyphB = pad + size * 0.82;

  const stemW = size * 0.15;
  const barH = size * 0.12;
  const bowlBottom = glyphT + (glyphB - glyphT) * 0.55;
  const bowlStemW = size * 0.13;

  function setPixel(x, y) {
    const px = Math.round(x);
    const py = Math.round(y);
    if (px >= 0 && px < size && py >= 0 && py < size && isInsideRoundedRect(px, py)) {
      const idx = (py * size + px) * 3;
      buf[idx] = FG.r; buf[idx + 1] = FG.g; buf[idx + 2] = FG.b;
    }
  }

  function fillRect(rx0, ry0, rx1, ry1) {
    for (let y = Math.max(0, Math.round(ry0)); y <= Math.min(size - 1, Math.round(ry1)); y++) {
      for (let x = Math.max(0, Math.round(rx0)); x <= Math.min(size - 1, Math.round(rx1)); x++) {
        setPixel(x, y);
      }
    }
  }

  function fillCircle(cx, cy, r) {
    const ri = Math.ceil(r);
    for (let dy = -ri; dy <= ri; dy++) {
      for (let dx = -ri; dx <= ri; dx++) {
        if (dx * dx + dy * dy <= r * r) {
          setPixel(Math.round(cx + dx), Math.round(cy + dy));
        }
      }
    }
  }

  // Vertical stem (full glyph height)
  fillRect(glyphL, glyphT, glyphL + stemW, glyphB);

  // Top horizontal bar of bowl
  fillRect(glyphL + stemW, glyphT, glyphR, glyphT + barH);

  // Right vertical side of bowl
  fillRect(glyphR - bowlStemW, glyphT, glyphR, bowlBottom);

  // Bottom horizontal bar of bowl
  fillRect(glyphL + stemW, bowlBottom - barH, glyphR, bowlBottom);

  // Round the top-right corner of the bowl
  const trR = Math.min(bowlStemW, barH) * 0.8;
  fillCircle(glyphR - trR, glyphT + trR, trR);

  // Round the bottom-right corner of the bowl
  const brR = Math.min(bowlStemW, barH) * 0.8;
  fillCircle(glyphR - brR, bowlBottom - brR, brR);

  return buf;
}

// -- Generate all icons --
const outDir = path.join(__dirname, "..", "public", "icons");
fs.mkdirSync(outDir, { recursive: true });

const icons = [
  { name: "icon-192.png", size: 192, padding: 0 },
  { name: "icon-512.png", size: 512, padding: 0 },
  { name: "icon-maskable-512.png", size: 512, padding: 0.1 },
  { name: "apple-touch-icon.png", size: 180, padding: 0 },
];

console.log("Generating Prontio PWA icons...\n");

for (const { name, size, padding } of icons) {
  const pixels = renderIcon(size, padding);
  const png = buildPNG(size, size, pixels);
  const outPath = path.join(outDir, name);
  fs.writeFileSync(outPath, png);
  const kb = (png.length / 1024).toFixed(1);
  console.log("  " + name.padEnd(28) + size + "x" + size + "  " + kb + " KB");
}

console.log("\nDone! Icons written to public/icons/");
