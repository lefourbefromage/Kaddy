# Mockups (visual reference)

These files are exported from the Kaddy design canvas. They are the **reference for layout, copy, states and interactions**, not code to copy as is.

- **Format:** each file has a static HTML part (inside `<x-dc>`) with `{{ … }}` placeholders, followed by a `<script type="text/x-dc">` that holds the sample data and the interaction logic (states, ticks, duplicates, sorting…). They don't run outside the canvas, because the `support.js` runtime is missing. Read them as specs.
- **Images:** they point to `../public/illustrations/*.webp`.
- **Inline styles:** they contain the raw values. In the app, replace them with the `var(--kd-…)` variables from `styles/tokens.css`.

| File | Screen |
|---|---|
| menu-desktop / menu-mobile | Menu of the week + summary |
| liste-de-courses-desktop / -mobile | Recipe ingredients by week + Hors menu |
| recettes-desktop / -mobile | Catalogue, recipe sheet, form, duplicate alert (`vue` prop: liste / fiche / edition / doublon) |
| mon-kaddy-desktop / -mobile | Shopping list by aisle, ticks |
| connexion-desktop / -mobile | Household sign-in (`etat` prop: vide / erreur) |
| ordre-des-rayons-desktop / -mobile | Aisle-order setting |
| image-de-partage | OG image 1200×630 (already exported: public/kaddy-og.jpg) |
