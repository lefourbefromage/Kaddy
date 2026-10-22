import { HOUSEHOLD_EMAIL_DOMAIN } from "./firebase";

// Must stay identical to slugify() in scripts/create-household.mjs.
export const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// "Famille Martin" → "famille-martin@foyers.kaddy.app" (technical, never shown).
export const householdEmail = (householdId: string) =>
  `${householdId}@${HOUSEHOLD_EMAIL_DOMAIN}`;
