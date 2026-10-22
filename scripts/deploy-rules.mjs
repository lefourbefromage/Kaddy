// Deploy firestore.rules to the Firebase project, without the Firebase CLI.
// Usage:
//   npm run deploy:rules
// (= node --env-file=.env.local scripts/deploy-rules.mjs, with
//  GOOGLE_APPLICATION_CREDENTIALS defaulting to ./service-account.json)

import { readFile } from 'node:fs/promises';
import { initializeApp, cert } from 'firebase-admin/app';
import { getSecurityRules } from 'firebase-admin/security-rules';

const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ?? './service-account.json';
const serviceAccount = JSON.parse(await readFile(keyPath, 'utf8'));

initializeApp({ credential: cert(serviceAccount) });

const source = await readFile(new URL('../firestore.rules', import.meta.url), 'utf8');
const ruleset = await getSecurityRules().releaseFirestoreRulesetFromSource(source);

console.log(`Rules deployed to ${serviceAccount.project_id}: ${ruleset.name} (${ruleset.createTime})`);
