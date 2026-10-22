// Generates every app icon from one square source (design/favicon-source.png).
// Usage: node scripts/make-icons.mjs
// The source is a yellow rounded square on a black background: it is cropped inside the
// dark outline, then exported with transparent corners (favicons, manifest "any", logo icon)
// or as a full yellow square (apple-touch-icon, maskable: no transparency allowed there).

import { writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const SRC = new URL('../design/favicon-source.png', import.meta.url).pathname.replace(/^\/(\w:)/, '$1');
const OUT = (name) => new URL(`../public/${name}`, import.meta.url).pathname.replace(/^\/(\w:)/, '$1');
const YELLOW = { r: 253, g: 224, b: 48, alpha: 1 }; // sampled from the source

// Square inside the dark outline (source 1254 × 1254, yellow square ≈ 21..1233 × 19..1223).
const SIDE = 1190;
const CROP = { left: 627 - SIDE / 2, top: 621 - SIDE / 2, width: SIDE, height: SIDE };
const RADIUS = Math.round(SIDE * 0.228);

const cropped = await sharp(SRC).extract(CROP).png().toBuffer();
const mask = Buffer.from(
  `<svg width="${SIDE}" height="${SIDE}"><rect width="${SIDE}" height="${SIDE}" rx="${RADIUS}" fill="#fff"/></svg>`,
);
const rounded = await sharp(cropped).ensureAlpha().composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
// Opaque version: the artwork masked a little further in (the source darkens near its
// outline), laid on flat yellow so no seam shows where the two meet.
const INSET = 18;
const innerMask = Buffer.from(
  `<svg width="${SIDE}" height="${SIDE}"><rect x="${INSET}" y="${INSET}" width="${SIDE - 2 * INSET}" height="${SIDE - 2 * INSET}" rx="${RADIUS - INSET}" fill="#fff"/></svg>`,
);
const innerArt = await sharp(cropped).ensureAlpha().composite([{ input: innerMask, blend: 'dest-in' }]).png().toBuffer();
const full = await sharp({ create: { width: SIDE, height: SIDE, channels: 4, background: YELLOW } })
  .composite([{ input: innerArt }])
  .png()
  .toBuffer();

const png = (input, size) => sharp(input).resize(size, size, { kernel: 'lanczos3' }).png({ compressionLevel: 9 }).toBuffer();

for (const size of [16, 32, 48, 192, 512]) await writeFile(OUT(`favicon-${size}.png`), await png(rounded, size));
await writeFile(OUT('apple-touch-icon.png'), await png(full, 180));
await writeFile(OUT('illustrations/app-icon.webp'), await sharp(rounded).resize(128, 128).webp({ quality: 90 }).toBuffer());

// Maskable: the artwork inside the 80% safe zone, on a full yellow background.
const inner = await png(full, 410);
await writeFile(
  OUT('icon-512-maskable.png'),
  await sharp({ create: { width: 512, height: 512, channels: 4, background: YELLOW } })
    .composite([{ input: inner, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toBuffer(),
);

// favicon.ico: PNG images (16, 32, 48) in an ICO container.
const images = await Promise.all([16, 32, 48].map((s) => png(rounded, s)));
const header = Buffer.alloc(6 + 16 * images.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(images.length, 4);
let offset = header.length;
images.forEach((img, i) => {
  const size = [16, 32, 48][i];
  const e = 6 + 16 * i;
  header.writeUInt8(size, e);
  header.writeUInt8(size, e + 1);
  header.writeUInt8(0, e + 2);
  header.writeUInt8(0, e + 3);
  header.writeUInt16LE(1, e + 4);
  header.writeUInt16LE(32, e + 6);
  header.writeUInt32LE(img.length, e + 8);
  header.writeUInt32LE(offset, e + 12);
  offset += img.length;
});
await writeFile(OUT('favicon.ico'), Buffer.concat([header, ...images]));

console.log('Icons written to public/.');
