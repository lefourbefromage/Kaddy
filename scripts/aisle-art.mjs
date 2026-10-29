// Turns one picture per aisle, design/rayons/{id}.png (see design/prompts-rayons.md), into
// public/illustrations/rayons/{id}.webp and writes each picture's size into data/aisles.json.
// Aisles without a source picture keep their current illustration.
// Usage: node scripts/aisle-art.mjs [design/rayons]
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const SRC = process.argv[2] ?? 'design/rayons';
const OUT = 'public/illustrations/rayons';
const MAX = 320; // px: twice the largest display size, next/image serves smaller copies
const SOLID = 40; // alpha: blobs are found on clearly opaque pixels only
const NOISE = 0.0005; // share of the picture: blobs smaller than this are stray specks
const WHITE = 240; // r, g and b above this, touching the border: background to remove
const PAD = 4; // px kept around the solid blobs for the soft crayon edges

const aisles = JSON.parse(await readFile('data/aisles.json', 'utf8'));
await mkdir(OUT, { recursive: true });
const missing = [];

for (const aisle of aisles) {
  const source = `${SRC}/${aisle.id}.png`;
  try {
    await access(source);
  } catch {
    missing.push(aisle.id);
    continue;
  }
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const stack = new Int32Array(W * H);

  // A model that cannot output transparency gives a white background: clear the near-white
  // pixels connected to the border (white inside the objects, e.g. a yoghurt pot, stays).
  if (data[3] === 255 && data[(W * H - 1) * 4 + 3] === 255) {
    // Each pixel is cleared when pushed, so it is pushed once at most.
    let top = 0;
    const push = (p) => {
      if (data[p * 4 + 3] === 0 || data[p * 4] <= WHITE || data[p * 4 + 1] <= WHITE || data[p * 4 + 2] <= WHITE) return;
      data[p * 4 + 3] = 0;
      stack[top++] = p;
    };
    for (let x = 0; x < W; x++) {
      push(x);
      push((H - 1) * W + x);
    }
    for (let y = 0; y < H; y++) {
      push(y * W);
      push(y * W + W - 1);
    }
    while (top) {
      const p = stack[--top];
      const x = p % W, y = (p - x) / W;
      if (x > 0) push(p - 1);
      if (x < W - 1) push(p + 1);
      if (y > 0) push(p - W);
      if (y < H - 1) push(p + W);
    }
  }

  // Keep the box around the opaque blobs (4-connected) big enough not to be specks.
  const seen = new Uint8Array(W * H);
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let start = 0; start < W * H; start++) {
    if (seen[start] || data[start * 4 + 3] < SOLID) continue;
    let top = 0, n = 0, bx0 = W, by0 = H, bx1 = -1, by1 = -1;
    stack[top++] = start;
    seen[start] = 1;
    while (top) {
      const p = stack[--top];
      const x = p % W, y = (p - x) / W;
      n++;
      if (x < bx0) bx0 = x;
      if (x > bx1) bx1 = x;
      if (y < by0) by0 = y;
      if (y > by1) by1 = y;
      for (const q of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y > 0 ? p - W : -1, y < H - 1 ? p + W : -1]) {
        if (q >= 0 && !seen[q] && data[q * 4 + 3] >= SOLID) {
          seen[q] = 1;
          stack[top++] = q;
        }
      }
    }
    if (n < NOISE * W * H) continue;
    x0 = Math.min(x0, bx0);
    y0 = Math.min(y0, by0);
    x1 = Math.max(x1, bx1);
    y1 = Math.max(y1, by1);
  }
  if (x1 < 0) throw new Error(`Nothing found in ${source}`);
  x0 = Math.max(0, x0 - PAD);
  y0 = Math.max(0, y0 - PAD);
  x1 = Math.min(W - 1, x1 + PAD);
  y1 = Math.min(H - 1, y1 + PAD);

  const file = `${OUT}/${aisle.id}.webp`;
  const { width, height, size } = await sharp(data, { raw: { width: W, height: H, channels: 4 } })
    .extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 })
    .resize(MAX, MAX, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82, alphaQuality: 90, effort: 6 })
    .toFile(file);
  aisle.illustration = { src: `/illustrations/rayons/${aisle.id}.webp`, width, height };
  console.log(`${file}  ${width}×${height}  ${(size / 1024).toFixed(1)} KB`);
}

if (missing.length) console.log(`No picture yet in ${SRC}/ for: ${missing.join(', ')}`);
const json = `[\n${aisles.map((a) => `  ${JSON.stringify(a).replace(/,"/g, ', "').replace(/":/g, '": ').replace(/\{"/g, '{ "').replace(/\}/g, ' }')}`).join(',\n')}\n]\n`;
await writeFile('data/aisles.json', json);
