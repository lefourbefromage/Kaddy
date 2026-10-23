// Cuts the aisle illustration sheet (4×4 grid, transparent background, aisles in the order of
// data/aisles.json, left to right then top to bottom) into public/illustrations/rayons/{id}.webp
// and writes each picture's size into data/aisles.json.
// Usage: node scripts/cut-aisle-sheet.mjs [design/rayons-planche.webp]
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const SHEET = process.argv[2] ?? 'design/rayons-planche.webp';
const OUT = 'public/illustrations/rayons';
const GRID = 4;
const MAX = 320; // px: twice the largest display size, next/image serves smaller copies
const NOISE = 60; // px: specks smaller than this are dropped
const SOLID = 40; // alpha: blobs are joined on clearly opaque pixels only (faint edges would bridge items)

const aisles = JSON.parse(await readFile('data/aisles.json', 'utf8'));
const { data, info } = await sharp(SHEET).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;
const cellW = W / GRID;
const cellH = H / GRID;

// Label the opaque blobs (4-connected), then give each blob to the cell holding its centre:
// an item may spill over its cell, and a few loose crumbs (ice crystals) belong to it.
// Faint pixels (soft edges, the translucent peas bag) go to the cell they sit in.
const label = new Int32Array(W * H).fill(-1);
const cellOf = [];
const stack = new Int32Array(W * H);
for (let start = 0; start < W * H; start++) {
  if (label[start] !== -1 || data[start * 4 + 3] < SOLID) continue;
  const id = cellOf.length;
  let top = 0, n = 0, sx = 0, sy = 0;
  stack[top++] = start;
  label[start] = id;
  while (top) {
    const p = stack[--top];
    const x = p % W, y = (p - x) / W;
    n++; sx += x; sy += y;
    for (const q of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y > 0 ? p - W : -1, y < H - 1 ? p + W : -1]) {
      if (q >= 0 && label[q] === -1 && data[q * 4 + 3] >= SOLID) {
        label[q] = id;
        stack[top++] = q;
      }
    }
  }
  cellOf.push(n < NOISE ? -1 : Math.floor(sy / n / cellH) * GRID + Math.floor(sx / n / cellW));
}

await mkdir(OUT, { recursive: true });
for (const [i, aisle] of aisles.entries()) {
  // Only this cell's pixels, everything else transparent.
  const own = Buffer.alloc(W * H * 4);
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let p = 0; p < W * H; p++) {
    const a = data[p * 4 + 3];
    if (a < 8) continue; // near-invisible haze would stretch the crop
    const x = p % W, y = (p - x) / W;
    const cell = a < SOLID ? Math.floor(y / cellH) * GRID + Math.floor(x / cellW) : cellOf[label[p]];
    if (cell !== i) continue;
    data.copy(own, p * 4, p * 4, p * 4 + 4);
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }
  if (x1 < 0) throw new Error(`Nothing found in cell ${i + 1} (${aisle.id})`);
  const file = `${OUT}/${aisle.id}.webp`;
  const { width, height, size } = await sharp(own, { raw: { width: W, height: H, channels: 4 } })
    .extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 })
    .resize(MAX, MAX, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82, alphaQuality: 90, effort: 6 })
    .toFile(file);
  aisle.illustration = { src: `/illustrations/rayons/${aisle.id}.webp`, width, height };
  console.log(`${file}  ${width}×${height}  ${(size / 1024).toFixed(1)} KB`);
}

const json = `[\n${aisles.map((a) => `  ${JSON.stringify(a).replace(/,"/g, ', "').replace(/":/g, '": ').replace(/\{"/g, '{ "').replace(/\}/g, ' }')}`).join(',\n')}\n]\n`;
await writeFile('data/aisles.json', json);
