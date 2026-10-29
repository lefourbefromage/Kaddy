// Move every household from the 14 old aisles to the 27 aisles of data/aisles.json (October 2026).
// Run it AFTER scripts/seed-catalog.mjs, so the catalogue already holds the new aisles.
// Usage: node scripts/migrate-aisles.mjs [--dry]
// (reads ./service-account.json, or the key named by GOOGLE_APPLICATION_CREDENTIALS)
//
// For each household:
// - aisleOrder: a renamed aisle keeps its place; a split aisle is replaced, at its place, by the
//   aisles it was split into (in the default order); a brand-new aisle goes after its default neighbour.
// - ingredients/{key} and weeks/*/extras/*: an aisleId that no longer exists becomes the catalogue's
//   new aisle for that product; for a product the household created itself, the renamed aisle, or
//   null ("Ingrédients à classer") when the old aisle was split, since only the household knows where it goes.
// Idempotent: ids that still exist are left as they are.

import { readFile } from 'node:fs/promises';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Must stay identical to keyOf in scripts/seed-catalog.mjs (importing it would run the seed).
const keyOf = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, ' ').trim()
    .split(' ').map((w) => w.replace(/[sx]$/, '')).join('-');

const dry = process.argv.includes('--dry');
const aisles = JSON.parse(await readFile(new URL('../data/aisles.json', import.meta.url), 'utf8'));
const products = JSON.parse(await readFile(new URL('../data/products.json', import.meta.url), 'utf8'));
const ORDER = aisles.map((a) => a.id);
const EXISTS = new Set(ORDER);

// Old id → the new ids that took over its products (one id = a plain rename).
const SUCCESSORS = {
  'viande-poisson': ['viandes-volailles', 'poissonnerie'],
  'pain-patisserie': ['boulangerie'],
  'laitier-oeufs-vegetal': ['lait-oeufs', 'cremerie-yaourts', 'fromages', 'bio-vegetal'],
  'charcuterie-traiteur': ['charcuterie'],
  'epicerie-salee': ['conserves-legumes', 'plats-cuisines', 'assaisonnements-condiments', 'pates-riz-feculents', 'aperitif'],
  'saveurs-du-monde': ['produits-du-monde'],
  'hygiene-beaute': ['hygiene'],
};
const RENAMED = {};
for (const [old, next] of Object.entries(SUCCESSORS)) {
  if (EXISTS.has(old)) throw new Error(`${old} still exists`);
  for (const id of next) if (!EXISTS.has(id)) throw new Error(`unknown aisle ${id}`);
  if (next.length === 1) RENAMED[old] = next[0];
}

const catalogAisle = new Map();
for (const p of products) {
  catalogAisle.set(p.key ?? keyOf(p.name), p.aisleId);
  for (const a of p.aliases ?? []) if (!catalogAisle.has(keyOf(a))) catalogAisle.set(keyOf(a), p.aisleId);
}

const newAisle = (aisleId, key) => {
  if (aisleId == null || EXISTS.has(aisleId)) return aisleId;
  return catalogAisle.get(key) ?? RENAMED[aisleId] ?? null;
};

const newOrder = (order) => {
  const out = [];
  for (const id of order) {
    const next = EXISTS.has(id) ? [id] : (SUCCESSORS[id] ?? []).toSorted((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
    for (const n of next) if (!out.includes(n)) out.push(n);
  }
  // Brand-new aisles (Desserts, Friandises…) go right after the aisle that precedes them by default.
  for (const [i, id] of ORDER.entries()) {
    if (out.includes(id)) continue;
    const before = ORDER.slice(0, i).findLast((b) => out.includes(b));
    out.splice(before ? out.indexOf(before) + 1 : 0, 0, id);
  }
  return out;
};

// Same key as scripts/deploy-rules.mjs: GOOGLE_APPLICATION_CREDENTIALS, or ./service-account.json.
const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ?? './service-account.json';
initializeApp({ credential: cert(JSON.parse(await readFile(keyPath, 'utf8'))) });
const db = getFirestore();
const writer = db.bulkWriter();
let changes = 0;
const update = (ref, data, label) => {
  changes++;
  console.log(`${dry ? '[dry] ' : ''}${ref.path}: ${label}`);
  if (!dry) writer.update(ref, data);
};

for (const household of (await db.collection('households').get()).docs) {
  const order = household.get('aisleOrder') ?? [];
  const order2 = newOrder(order);
  if (order2.join() !== order.join()) update(household.ref, { aisleOrder: order2 }, `aisleOrder → ${order2.join(', ')}`);

  const fix = (doc, key) => {
    const was = doc.get('aisleId');
    const now = newAisle(was, key);
    if (now !== was) update(doc.ref, { aisleId: now }, `${doc.get('name')}: ${was} → ${now ?? 'à classer'}`);
  };
  for (const ing of (await household.ref.collection('ingredients').get()).docs) fix(ing, ing.id);
  for (const week of await household.ref.collection('weeks').listDocuments()) {
    for (const extra of (await week.collection('extras').get()).docs) fix(extra, extra.get('key'));
  }
}

await writer.close();
console.log(`${changes} change(s)${dry ? ' to make (dry run, nothing written)' : ' written'}.`);
