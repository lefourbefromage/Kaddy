import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { HOUSEHOLD_EMAIL_DOMAIN, db } from "./firebase";

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

/** The aisle order of Mon Kaddy, shared by the whole household. Not awaited: the local write shows at once. */
export const setAisleOrder = (householdId: string, aisleOrder: string[]) =>
  updateDoc(doc(db, "households", householdId), { aisleOrder, updatedAt: serverTimestamp() }).catch((e) =>
    console.error("setAisleOrder", e),
  );
