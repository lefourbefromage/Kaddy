// Create a household (one Firebase Auth user + its Firestore document).
// Usage:
//   npm i -D firebase-admin
//   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json \
//   node scripts/create-household.mjs "Famille Martin" "the-household-password"
// PowerShell:
//   $env:GOOGLE_APPLICATION_CREDENTIALS="./service-account.json"; node scripts/create-household.mjs "Famille Martin" "the-household-password"
//
// The service-account.json file is downloaded from the Firebase console
// (Project settings > Service accounts). NEVER commit it (add it to .gitignore).

import { readFile } from 'node:fs/promises';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const [name, password] = process.argv.slice(2);
if (!name || !password) {
  console.error('Usage: node scripts/create-household.mjs "Household name" "password"');
  process.exit(1);
}
if (password.length < 8) {
  console.error('The password must be at least 8 characters long.');
  process.exit(1);
}

// Must stay identical to the function used on the sign-in screen.
export const slugify = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// Default aisle order = the order of data/aisles.json.
const DEFAULT_AISLES = JSON.parse(
  await readFile(new URL('../data/aisles.json', import.meta.url), 'utf8'),
).map((a) => a.id);
const householdId = slugify(name);
const email = `${householdId}@foyers.kaddy.app`;

initializeApp({ credential: applicationDefault() });
const auth = getAuth();
const db = getFirestore();

const ref = db.doc(`households/${householdId}`);
if ((await ref.get()).exists) {
  console.error(`The household "${householdId}" already exists.`);
  process.exit(1);
}

const user = await auth.createUser({ email, password, displayName: name });
await auth.setCustomUserClaims(user.uid, { householdId });
await ref.set({
  name,
  slug: householdId,
  aisleOrder: DEFAULT_AISLES,
  createdAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp(),
});

console.log(`Household created: ${name} (${householdId}). Sign in with this name and the chosen password.`);
