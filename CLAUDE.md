# Kaddy: instructions for Claude Code

Kaddy is a household web app (installable PWA). You plan the week's lunches and dinners, Kaddy derives the grocery list by aisle, and household members tick items in real time in the shop.

## Read before every task
1. `PRODUCT.md`: users, features, product rules (duplicates, alphabetical sort, aisle order, accounts per household).
2. `DESIGN.md`: visual system (colours, type, radii, components, rules). The frontmatter tokens are the reference.
3. `docs/data-model.md`: Firestore model and security rules.
4. The matching mockup in `design/` (see `design/README.md`).

## Stack
- Next.js (App Router, TypeScript, `src/` directory), React Server Components where useful, client components for everything real-time.
- Plain CSS: **CSS Modules + `styles/tokens.css`**. No Tailwind, no component library.
- Firebase: Auth (one email/password user per household, see `docs/data-model.md`) + Firestore (one multi-tenant database).
- Hosting: Vercel. Environment variables in `.env.local` (see `.env.example`).
- Fonts: `next/font/google` → Bricolage Grotesque (variable, axes `wdth` + `wght`) and Figtree, exposed as `--font-display` and `--font-body`.

## Non-negotiable rules
- **Interface in French, addressing the user as "tu".** Product vocabulary: créneau, midi/soir, Reste, Hors menu, Ingrédients à classer, Mon Kaddy, foyer.
- **No hard-coded colour, radius or font size**: always `var(--kd-…)` from `tokens.css`. If a value is missing, add it to `tokens.css` AND `DESIGN.md`.
- **Targets of 44 × 44 px minimum** (`.kd-hit` class when the visual is smaller).
- **Visible focus** on everything that is interactive (`:focus-visible`, already in `tokens.css`).
- **Violet `--kd-violet` reserved for action/state**; no shadow on cards; two type families only.
- Every page title is paired with its illustration (`public/illustrations/titre-*.webp`).
- Every animation has a `prefers-reduced-motion` alternative.
- Images: `next/image` with explicit `width`/`height`; `preload` (Next 16 replacement for the deprecated `priority`) only for the logo and the title illustration.
- Firestore: every read/write goes through `households/{householdId}/…`; never a query outside the household. Single exception: the shared product catalogue `catalog/`, read-only.
- Real-time (Mon Kaddy ticks, menu): `onSnapshot`, one document per ticked item (see the model), optimistic updates.

## Working method
- One screen or one feature per session. Propose a short plan, then code.
- Before "done": `npm run lint`, `npm run build`, and manual check at 390 px and 1440 px.
- Keep `PRODUCT.md`/`DESIGN.md` up to date if a product or visual decision changes.
