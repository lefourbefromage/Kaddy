// Seed the shared product catalogue (catalog/{key}) from data/products.json.
// Usage: GOOGLE_APPLICATION_CREDENTIALS=./service-account.json node scripts/seed-catalog.mjs
// Expected format of data/products.json:
//   [{ "name": "Pommes de terre", "aisleId": "fl", "aliases": ["pdt", "patates"], "defaultUnit": "kg" }, ...]
// Idempotent: the document id is the normalised key, so re-running updates without duplicates.

import { readFile } from 'node:fs/promises';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const AISLES = new Set(['fl', 'bo', 'cr', 'ep', 'bl', 'hy', 'au']);
// Must stay identical to the normalisation used in the app (no accents, lowercase, final plural removed).
export const keyOf = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, ' ').trim()
    .split(' ').map((w) => w.replace(/[sx]$/, '')).join('-');

const products = JSON.parse(await readFile(new URL('../data/products.json', import.meta.url), 'utf8'));
const bad = products.filter((p) => !p.name || !AISLES.has(p.aisleId));
if (bad.length) { console.error('Invalid products:', bad); process.exit(1); }

initializeApp({ credential: applicationDefault() });
const db = getFirestore();
const writer = db.bulkWriter();
for (const p of products) {
  writer.set(db.doc(`catalog/${keyOf(p.name)}`), {
    name: p.name,
    aisleId: p.aisleId,
    aliases: (p.aliases || []).map((a) => a.toLowerCase()),
    defaultUnit: p.defaultUnit ?? null,
  });
}
await writer.close();
console.log(`${products.length} products seeded into the catalogue.`);
