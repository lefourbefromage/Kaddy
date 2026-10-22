# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

- **Front end:** Next.js (App Router, TypeScript) + plain CSS based on `styles/tokens.css`.
- **Database:** Firebase Firestore, one database shared by all households (multi-tenant).
- **Hosting:** Vercel.
- **Starting point:** a new build from scratch. The former `lefourbefromage/courses` repo imposes no code, data or backend constraints.

## Users

- Vincent, who plans the week's meals and does the shopping. Primary user today.
- His household, soon. They share the same menu and the same grocery list, and can tick items in the shop.
- Kaddy is meant for a few households (2 or 3 at first), each completely separate from the others.
- Usage is mostly on the phone (installable web app), especially in the shop. The desktop is used to plan the week and manage recipes.

## Product Purpose

Kaddy turns "what are we eating this week?" into a ready-to-use grocery list.

The user plans lunch and dinner for each of the 7 days, drawing on their household's recipe catalogue. Kaddy then derives the ingredients to buy, sorted by aisle.

Success means:
- **Plan the menu in 5 minutes**, without having to think about what to eat.
- **Shop without forgetting anything**: a list sorted by aisle, with nothing forgotten and nothing duplicated.
- **Eat more varied meals**: bring back recipes that haven't been cooked in a long time, and avoid always eating the same thing.

## Positioning

A household's personal tool, not a recipe platform.

The catalogue only contains the household's own recipes. The list follows the menu that was actually planned (current week and following weeks). The weekly summary pushes towards variety by surfacing forgotten dishes.

## Operating Context

1. **Plan (Menu).** On a desktop or a phone, fill the week's 14 slots: lunch and dinner from Monday to Sunday.
   - A slot holds a recipe or a "Reste" (leftovers).
   - A recipe can be viewed in large format or edited from the slot.
2. **Prepare (Liste de courses).** Check each planned recipe's ingredients and quantities, grouped by week, then add off-menu items.
   - A recipe with no ingredients is flagged "à compléter" (to complete) in Recettes and Liste de courses only. The Menu never shows that status: a dish typed there can simply be "Indien" (a restaurant night).
3. **Shop (Mon Kaddy).** In the shop, on a phone, tick items aisle by aisle.
   - Aisles (14, default order, see `data/aisles.json`): Viande & poisson, Fruits & légumes, Pain & pâtisserie, Laitier, œufs & végétal, Charcuterie & traiteur, Produits cuisinés (pizza, gnocchi, fresh pasta, doughs), Surgelés, Épicerie salée, Épicerie sucrée, Boissons, Saveurs du monde, Hygiène & beauté, Entretien & nettoyage, Autres.
4. **Manage the catalogue (Recettes).** Each recipe has a title, a description, ingredients with quantity and unit, steps, and an optional link to a video or website.
5. **Weekly summary** on the Menu page: meal-type split, new recipes, ingredients to sort, number of different meals, leftovers, how full the week is, and dishes not cooked in a long time.

## Capabilities and Constraints

- **Pages, in navigation order:** Menu, Liste de courses, Recettes, Mon Kaddy.
- **Interface language:** French, addressing the user as "tu".
- **Product vocabulary:**
  - "repas" (a meal of the week; the code calls it a slot, the interface never says "créneau"): midi (lunch) / soir (dinner);
  - "Reste" (leftovers);
  - "Hors menu" (off-menu);
  - "Ingrédients à classer" (ingredients with no aisle yet);
  - "Pas cuisinées depuis longtemps" (not cooked in a long time).
- **Accounts per household:**
  - Sign-in page with the household name and a password, shared by all its members; there is no individual account.
  - **Separate for each household:** everything, for now: recipes, menu, grocery list ("Liste de courses"), Mon Kaddy, off-menu items and the aisle-order setting. This avoids one household editing another household's recipes.
  - **One database for everyone:** a single database, each record tied to its household. This avoids one database per household and must scale as more households join.
  - **No personal account:** members don't create an account; they only type the household name and the household password.
  - **Households are provisioned by Vincent:** for now, Vincent creates each household himself (name and password) with an admin tool; there is no public sign-up.
  - **Option for later:** share the catalogue, with each recipe editable only by the household that created it.
  - Expected volume: 2 or 3 households.
  - Hosting and database must be free at first.
- **Sync:** within a household, the menu, the list and the ticked items are kept in sync across devices. This is a priority.
- **Real-time sync in the shop:**
  - Two members in the shop, each on their own phone, tick items at the same time.
  - A ticked item must appear on the other device almost instantly, so the same item is never picked up twice.
  - This speed takes priority over offline mode.
- **Offline mode:** a bonus, not a requirement.
- **Duplicate recipes:**
  - Detection is based on the title, including close matches (for example "Poulet champignon" and "Poulet à la crème de champignon").
  - **Rule:** a title is considered close when more than 80% of its words appear in another recipe's title.
  - **Mockup interpretation (to confirm):** the check runs in both directions, ignores small words ("à", "la", "de", "aux"…), accents and plurals, and only applies when a recipe is created.
  - **Display:** the recipe shows a subtitle "Une recette identique semble déjà exister : <nom de la recette>".
  - **Dismissing:** the user can dismiss the message, for example when it is a mistake or the recipe is only slightly different. Kaddy never blocks or merges anything automatically.
- **Product catalogue:**
  - Kaddy ships with a base list of the most commonly bought products, each tied to its aisle. The former "Courses" project (`lefourbefromage/courses`) already has this list; it will be taken over as the starting point.
  - This catalogue is shared by every household and read-only for them.
  - It is used to suggest products as you type (ingredients and off-menu items) and to file every known product into the right aisle automatically.
  - A household can file a product differently, or add an unknown one: that choice is stored for that household only and wins over the shared catalogue.
  - A product found in neither the catalogue nor the household's choices goes into "Ingrédients à classer".
- **Sorting in Mon Kaddy:**
  - The order of the aisles can be customised in a setting.
  - Inside each aisle, items are always sorted alphabetically. There is no manual sorting of items.
- **Planning horizon:** future weeks appear in the list as soon as recipes are planned for them.
- **Open questions:**
  - whether to share the catalogue later (creator-only editing).

## Brand Commitments

- **Name:** Kaddy, a nod to "caddie" (shopping cart).
- **Logo:** a cart drawn with a thick line, sticker style, with fluid, very bold, rounded bubble lettering. It exists as a PNG.
- **Illustrations:** an established series with the same mascot.
  - A stick figure with a round white head, two oval eyes, no mouth, a violet cap and an apron, drawn in crayon and gouache.
  - New illustrations follow this series. Each page title has one.
- **Tone:** friendly and light, using "tu", with light wordplay allowed in names.

## Evidence on Hand

- Kaddy design canvas (Design artifact): Menu, Liste de courses, Mon Kaddy and Recettes screens, on desktop and mobile.
- Illustrations, logo and favicon uploaded to the artifact; favicon pack `kaddy-favicon.zip`.
- The recipes, quantities and numbers shown in the mockups are sample data. There are no real users, testimonials or metrics to cite.

## Product Principles

1. **Speed beats exhaustiveness.** Filling a slot or ticking an item must take one gesture. Editing goes through a secondary menu.
2. **The menu drives the list.** Nothing is entered twice: the list derives from the planned recipes, and off-menu items are the exception.
3. **Shop with one hand.** The Mon Kaddy page is designed for a phone, in a shop, in a hurry: large targets and a clear aisle order.
4. **Gently push towards variety.** The summary and forgotten recipes suggest; they never judge.
5. **Shared, so always in sync.** What one household member does, the others see.
