# Data model: Firebase (draft to validate)

## Principles
- **One Firestore database** for every household (multi-tenant). Everything lives under `households/{householdId}`.
- **No personal account.** A household = **one Firebase Auth user** (email/password), created by Vincent with `scripts/create-household.mjs`.
- On the sign-in screen, the person types the **household name** and the **household password**:
  - the app turns the name into an identifier (`"Famille Martin"` → `famille-martin`);
  - then it calls `signInWithEmailAndPassword("famille-martin@foyers.kaddy.app", password)`.
- The email address is **technical, invisible and never used** (the domain does not need to exist).
- The Auth user carries a **custom claim** `householdId`, set by the creation script. The security rules rely on it.
- "Rester connecté sur cet appareil": `browserLocalPersistence` when checked, `browserSessionPersistence` otherwise.
- If more households join later, nothing changes: the same database, one more document per household.

## Aisles
`data/aisles.json` is the single source for the 27 aisles: `id` (the `AisleId` stored everywhere), French `label`, `illustration` (`{ src, width, height }`, cut from `design/rayons-planche.webp` by `npm run aisle-art`; since the split, several aisles borrow the picture of a neighbouring aisle until they get their own). The picture also illustrates the recipes whose first ingredient is in that aisle. Its order is the default `aisleOrder` of a new household. Colours: `--kd-aisle-{id}` / `--kd-aisle-{id}-dot` in `styles/tokens.css`.

**Changing aisle ids.** An `aisleId` is stored in `catalog/`, in `households/{hid}.aisleOrder`, in `ingredients/{key}` and in the `extras`. When an aisle is renamed or split: reseed the catalogue (`scripts/seed-catalog.mjs`), then run a migration over the households (the October 2026 split into 27 aisles: `scripts/migrate-aisles.mjs`, `--dry` first), and rename `FETCHED_AT` in `src/lib/catalog.ts` so phones drop their day-old copy of the catalogue. Until then the app treats an id it no longer knows as "Ingrédients à classer" (`knownAisle` in `src/lib/aisles.ts`).

## Collections

```
catalog/{key}                                // SHARED catalogue of common products (read-only for households)
  name: string                 // "Pommes de terre"
  aisleId: AisleId
  aliases: string[]            // ["pdt", "patates"] → also matched by the autocomplete
  defaultUnit: string | null   // "kg", "pièce"…
  // seeded from data/products.json with scripts/seed-catalog.mjs (taken over from the old "courses" project)
  // {key} = keyOf(name), unless products.json gives an explicit "key" (see "Product keys")

households/{householdId}
  name: string                 // "Famille Martin"
  slug: string                 // "famille-martin" (= householdId)
  aisleOrder: AisleId[]        // default: the order of data/aisles.json
  createdAt, updatedAt: timestamp

households/{hid}/recipes/{recipeId}
  title: string
  titleWords: string[]         // normalised words (no accents, no small words, singular) → duplicate detection
  description: string
  sourceUrl: string | null     // YouTube, Instagram, recipe site
  ingredients: { name: string, key: string, qty: number | null, unit: "g"|"kg"|"ml"|"cl"|"l"|"CC"|"CS"|"pincée"|"pièce"|null }[]
  steps: string[]
  status: "complete" | "todo"  // derived on every save: "todo" when there is no ingredient
                               // (a recipe added from the Menu starts as "todo")
                               // no image field: the card picture comes from the aisle of the
                               // first ingredient found in the catalogue (src/lib/recipeArt.ts)
  // "Cuisinée N fois" and the last time are NOT stored: derived from the weeks
  // (recipe slots up to today, leftovers excluded; cookStats in src/lib/weeks.ts)
  dismissedDuplicates: string[] // ids of recipes declared "not a duplicate"
  createdAt, updatedAt

households/{hid}/ingredients/{key}           // household's own aisle choice (wins over the catalogue)
  name: string
  aisleId: AisleId | null   // null = "Ingrédients à classer"

households/{hid}/weeks/{weekId}              // weekId = ISO "2026-W43"
  slots: {                                    // nested by day then meal: slots.mon.lunch
    mon: {
      lunch: { kind: "recipe", recipeId } |
             { kind: "leftover", recipeId, of: "sun.dinner" } |   // a dish earlier in the same week
             { kind: "simple", name: "Picnic plage" },            // a meal with no recipe
      dinner: …
    },
    ...                                       // absent key = empty slot
  }
  listOverrides: { "<recipeId>:<key>": { qty?: number, unit?: string, removed?: true } }
                                              // changes made in the Liste de courses for this week only;
                                              // adding an ingredient there goes into the recipe itself
  updatedAt

households/{hid}/weeks/{weekId}/extras/{extraId}     // "Hors menu"
  name, key, qty, unit, aisleId | null, createdAt
  typed?: string                              // what was typed when it differs from the name ("PQ")

households/{hid}/weeks/{weekId}/checks/{itemKey}     // Mon Kaddy ticks: ONE doc per item
  checked: boolean
  at: serverTimestamp
```

### Why one document per ticked item
Two people in the shop tick **different items at the same time**. With one document per item there is no write conflict, and every phone receives the change in under a second (`onSnapshot` on `checks`). A single document holding a map would force transactions.

### Mon Kaddy computation (client side)
1. Take the recipes from the week's slots of kind `recipe`. A **leftover** adds no ingredient.
2. Apply `listOverrides`, then add `extras`.
3. Merge by `key + unit`, summing quantities, and keep the sources for the "2 Gnocchi + 3 One pot" label.
4. Find each item's aisle, in this order:
   1. `households/{hid}/ingredients/{key}.aisleId` (the household's choice);
   2. `catalog/{key}.aisleId`, also searched via the `aliases`;
   3. otherwise "Autres", marked "Rayon à choisir", and the product shows in "Ingrédients à classer".
5. Order the aisles by `household.aisleOrder`, and **sort alphabetically** inside each aisle: `localeCompare('fr', { sensitivity: 'base' })`.
6. `itemKey` = `${key}__${unit ?? "-"}`, used for `checks`.

### Duplicate detection
`titleWords` = title in lowercase, without accents, without small words (`à, au, aux, de, des, du, d, la, le, les, l, et, en, avec, sans, un, une, sur, façon`), without a final s/x.
- Two titles are close if `max(common/len(A), common/len(B)) > 0.8`.
- Show the message "Une recette identique semble déjà exister : …", which can be dismissed. Dismissing it adds the other recipe's id to `dismissedDuplicates`.

### Product keys
`key` = name without accents, lowercase, words joined by `-`, final s/x removed (`keyOf` in `scripts/seed-catalog.mjs`, to reuse as is in the app).
- Two different products can end up with the same key: "Pâté" and "Pâtes" both give `pate`. In that case `data/products.json` sets an explicit `key` on one of them ("Pâté" → `pate-charcuterie`); the seed script refuses duplicate keys.
- **Matching a typed ingredient**, in this order:
  1. exact spelling, accents kept, case ignored, against the household's `ingredients` then the catalogue's `name` and `aliases` ("pâté" → Pâté, "pâtes" → Pâtes);
  2. otherwise the loose match on `keyOf` (name and aliases), which absorbs missing accents and plurals ("pate" → Pâtes).

### Product autocomplete
When typing an ingredient or an off-menu item, the app suggests matches from `catalog` (name + aliases, normalised: no accents, no plural), merged with the household's own `ingredients`. The catalogue is a few hundred entries: load it once into memory rather than querying it on every keystroke. It is read from the offline copy, and from the server at most once a day (`src/lib/catalog.ts`).

## Security rules (`firestore.rules`)
See the `firestore.rules` file at the root. Summary:
- `catalog/{key}` can be read by every signed-in user; writing it is reserved to the seed script (Admin SDK).
- Every document under `households/{hid}` can only be read or written by a user whose `token.householdId == hid`.
- The household document itself can only be updated for `aisleOrder` and `updatedAt`. Creating and deleting it is reserved to the admin script (the Admin SDK bypasses the rules).
