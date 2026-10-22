# Kaddy roadmap: building in Claude Code

Open the `kaddy/` folder in Claude Code, then follow the steps in order. One step = one Claude Code session. Check each step on desktop (1440 px) and mobile (390 px) before moving on.

## 0. Firebase (by hand, about 10 min, before the first session)
1. Create a Firebase project. Enable **Authentication > Email/Password** and **Firestore** (production mode, `europe-west` region).
2. Add a Web app to the project and copy its config into `.env.local` (template: `.env.example`).
3. Download a service account key (Project settings > Service accounts) as `service-account.json` at the project root. It is already in `.gitignore`.
4. Optional: `git init` and create the GitHub repo.

## 1. Foundations
> Read CLAUDE.md, PRODUCT.md, DESIGN.md and docs/data-model.md. Initialise the Next.js app (App Router, TypeScript, src/, CSS Modules) in this folder, keeping the existing files. Import styles/tokens.css in the root layout, load Bricolage Grotesque and Figtree with next/font. Add the PWA manifest (public/site.webmanifest), the icons and the OG metadata (kaddy-og.jpg, description "On mange quoi ce soir ?"). Set up the Firebase client (src/lib/firebase.ts), install firebase-admin as a dev dependency and deploy firestore.rules. Show me the folder structure before coding.

## 1b. Your household and the product catalogue
1. In the terminal: `GOOGLE_APPLICATION_CREDENTIALS=./service-account.json node scripts/create-household.mjs "Your household name" "password"`
2. Prompt (give the path of the old project on your machine):
   > The old "courses" project is in <PATH/TO/courses>. Find the list of products associated with aisles. Convert it to data/products.json following the `catalog` format in docs/data-model.md (name, aisleId among fl/bo/cr/ep/bl/hy/au, aliases, defaultUnit). Map the old aisles onto Kaddy's 7 aisles and show me the mapping table and the products you couldn't file before writing the file. Then run scripts/seed-catalog.mjs (already in place) to fill the catalog collection.

## 1c. Going live (once step 2 works)
Create the Vercel project linked to the GitHub repo, add the same environment variables as `.env.local`, then test the deployed URL on your phone. Each push redeploys automatically.

## 2. Sign-in and household session
> Build the sign-in screen from design/connexion-desktop.html and connexion-mobile.html. Household name → slugify (identical to scripts/create-household.mjs) → signInWithEmailAndPassword. "Rester connecté" = local vs session persistence. Generic error messages from the mockup. Read householdId from the token's custom claim, a HouseholdProvider context, redirect to /connexion when signed out, sign-out from the household menu (desktop) and the Réglages sheet (mobile).

## 3. Layout and navigation
> Shared shell: desktop top bar (logo, 4 links, household menu), floating mobile bottom bar, mobile Réglages sheet. Routes: /menu, /liste, /recettes, /kaddy, /reglages/rayons. Take the markup from the design/ mockups.

## 4. Recipes
> Recipes screen: list (tabs All / To complete, search, sorting), recipe sheet as a dialog (focus kept inside, Esc), add/edit form, duplicate alert (algorithm in docs/data-model.md). Firestore CRUD under households/{hid}/recipes.

## 5. Menu
> Menu screen: week of 14 slots (lunch/dinner), quick entry in an empty slot (autocomplete on the recipes, otherwise creates a "todo" recipe), Reste button, "…" menu, eye to open the recipe. Week navigation. Summary (meal types, new recipes, ingredients to sort, different meals, leftovers, week filled) and "Pas cuisinées depuis longtemps". Real-time sync of the week document.

## 6. Grocery list
> Liste de courses screen: recipes for the current week and the following weeks, with editable ingredients (quantity, unit, removal → listOverrides), "Hors menu" items (extras) with autocomplete on the catalogue, "Ingrédients à classer" with an aisle picker (writes households/{hid}/ingredients/{key}). The aisle comes from the household's choice, then from the catalogue.

## 7. Mon Kaddy (the critical screen)
> Mon Kaddy screen: computed list (docs/data-model.md, "Mon Kaddy computation" section), aisles in household.aisleOrder order, items sorted alphabetically, ticks in real time (onSnapshot on checks, one doc per item, optimistic update), tick animation from the mockup, "Tout décocher", progress. Test with two devices.

## 8. Aisle order
> /reglages/rayons screen from design/ordre-des-rayons-*.html: up/down arrows + drag and drop (pointer events that work on touch too), writes household.aisleOrder.

## 9. Finishing touches
> Offline mode (Firestore persistentLocalCache) if simple, then run /impeccable audit on the deployed version and fix the findings.
