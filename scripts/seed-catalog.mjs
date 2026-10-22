// Seed the shared product catalogue (catalog/{key}) from data/products.json.
// Usage: GOOGLE_APPLICATION_CREDENTIALS=./service-account.json node scripts/seed-catalog.mjs
// PowerShell: $env:GOOGLE_APPLICATION_CREDENTIALS="./service-account.json"; node scripts/seed-catalog.mjs
// Expected format of data/products.json:
//   [{ "name": "Pommes de terre", "aisleId": "fruits-legumes", "aliases": ["pdt", "patates"], "defaultUnit": "kg" }, ...]
// Optional "key": overrides keyOf(name) when two names normalise to the same key
// (e.g. "Pâté" → "pate-charcuterie", so it doesn't overwrite "Pâtes" → "pate").
// Idempotent: the document id is the normalised key, so re-running updates without duplicates.

import { readFile } from 'node:fs/promises';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const aisles = JSON.parse(await readFile(new URL('../data/aisles.json', import.meta.url), 'utf8'));
const AISLES = new Set(aisles.map((a) => a.id));
// Must stay identical to the normalisation used in the app (no accents, lowercase, final plural removed).
export const keyOf = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, ' ').trim()
    .split(' ').map((w) => w.replace(/[sx]$/, '')).join('-');

const products = JSON.parse(await readFile(new URL('../data/products.json', import.meta.url), 'utf8'));
const bad = products.filter((p) => !p.name || !AISLES.has(p.aisleId));
if (bad.length) { console.error('Invalid products:', bad); process.exit(1); }
const byKey = new Map();
for (const p of products) {
  const key = p.key ?? keyOf(p.name);
  if (byKey.has(key)) { console.error(`Duplicate key "${key}": ${byKey.get(key)} / ${p.name}. Add an explicit "key".`); process.exit(1); }
  byKey.set(key, p.name);
}

initializeApp({ credential: applicationDefault() });
const db = getFirestore();
const writer = db.bulkWriter();
for (const p of products) {
  writer.set(db.doc(`catalog/${p.key ?? keyOf(p.name)}`), {
    name: p.name,
    aisleId: p.aisleId,
    aliases: (p.aliases || []).map((a) => a.toLowerCase()),
    defaultUnit: p.defaultUnit ?? null,
  });
}
await writer.close();
console.log(`${products.length} products seeded into the catalogue.`);
