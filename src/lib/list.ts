"use client";

import { useEffect, useState } from "react";
import {
  FieldPath,
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Catalog } from "./catalog";
import type { HouseholdIngredients } from "./ingredients";
import { fold, keyOf } from "./normalize";
import type { Unit } from "./recipes";

/* ---------- Per-week changes to a recipe's ingredients (weeks/{weekId}.listOverrides) ---------- */

export type Override = { qty?: number | null; unit?: Unit | null; removed?: true };
export const overrideKey = (recipeId: string, key: string) => `${recipeId}:${key}`;

const weekDoc = (householdId: string, weekId: string) => doc(db, "households", householdId, "weeks", weekId);

export function setOverride(householdId: string, weekId: string, id: string, value: Override | null) {
  const ref = weekDoc(householdId, weekId);
  const write = value
    ? updateDoc(ref, new FieldPath("listOverrides", id), value, "updatedAt", serverTimestamp())
    : updateDoc(ref, new FieldPath("listOverrides", id), deleteField(), "updatedAt", serverTimestamp());
  return write.catch((e) => console.error("setOverride", e));
}

/* ---------- "Hors menu" (weeks/{weekId}/extras) ---------- */

export type Extra = {
  id: string;
  name: string;
  key: string;
  qty: number | null;
  unit: Unit | null;
  aisleId: string | null;
  typed?: string; // what was typed when it differs from the name ("PQ")
  createdAt: Timestamp | null;
};

const extrasOf = (householdId: string, weekId: string) =>
  collection(db, "households", householdId, "weeks", weekId, "extras");

export function useExtras(householdId: string, weekId: string) {
  const [extras, setExtras] = useState<Extra[] | null>(null);
  useEffect(
    () =>
      onSnapshot(
        extrasOf(householdId, weekId),
        (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Extra, "id">) }));
          list.sort((a, b) => (a.createdAt?.toMillis() ?? Infinity) - (b.createdAt?.toMillis() ?? Infinity));
          setExtras(list);
        },
        () => setExtras((e) => e ?? []),
      ),
    [householdId, weekId],
  );
  return extras;
}

export const addExtra = (householdId: string, weekId: string, extra: Omit<Extra, "id" | "createdAt">) =>
  addDoc(extrasOf(householdId, weekId), { ...extra, createdAt: serverTimestamp() }).catch((e) =>
    console.error("addExtra", e),
  );

export const updateExtra = (householdId: string, weekId: string, id: string, patch: Partial<Extra>) =>
  updateDoc(doc(extrasOf(householdId, weekId), id), patch).catch((e) => console.error("updateExtra", e));

export const deleteExtra = (householdId: string, weekId: string, id: string) =>
  deleteDoc(doc(extrasOf(householdId, weekId), id)).catch((e) => console.error("deleteExtra", e));

/* ---------- The household's aisle choice (households/{hid}/ingredients/{key}) ---------- */

export const setIngredientAisle = (householdId: string, key: string, name: string, aisleId: string) =>
  setDoc(doc(db, "households", householdId, "ingredients", key), { name, aisleId }).catch((e) =>
    console.error("setIngredientAisle", e),
  );

/* ---------- Product suggestions (catalogue + the household's own products) ---------- */

export type ProductSuggestion = { name: string; key: string; aisleId: string | null; matched: string };

// Aisles that never hold a recipe ingredient: ranked last when filling a recipe.
const NOT_COOKING = new Set(["boissons", "hygiene-beaute", "entretien-nettoyage"]);

/**
 * Up to `limit` products whose name or an alias matches what is typed (accents and plurals
 * ignored). For a recipe, food comes first ("champ" → Champignons before Champagne).
 */
export function searchProducts(
  query: string,
  catalog: Catalog | null,
  own: HouseholdIngredients | null,
  { limit = 6, forRecipe = false }: { limit?: number; forRecipe?: boolean } = {},
): ProductSuggestion[] {
  const q = fold(query.trim());
  if (!q) return [];
  const qKey = keyOf(query);
  const found = new Map<string, ProductSuggestion & { score: number }>();
  const consider = (name: string, key: string, aisleId: string | null, alias: string) => {
    const f = fold(alias);
    const ak = keyOf(alias);
    const starts = f.startsWith(q) || (qKey.length > 1 && ak.startsWith(qKey));
    // The product's own name first, then an alias ("sucre roux" for Cassonade), then "contains".
    const match = starts ? (alias === name ? 0 : 1) : f.includes(q) && q.length > 1 ? 2 : -1;
    if (match < 0) return;
    const score = match + (forRecipe && aisleId && NOT_COOKING.has(aisleId) ? 3 : 0);
    const prev = found.get(key);
    if (!prev || score < prev.score) found.set(key, { name, key, aisleId, matched: alias, score });
  };
  for (const [key, item] of own ?? []) consider(item.name, key, item.aisleId, item.name);
  for (const p of catalog?.products ?? []) {
    const aisle = own?.get(p.key)?.aisleId ?? p.aisleId;
    for (const alias of [p.name, ...p.aliases]) consider(p.name, p.key, aisle, alias);
  }
  return [...found.values()]
    .sort((a, b) => a.score - b.score || a.name.localeCompare(b.name, "fr", { sensitivity: "base" }))
    .slice(0, limit)
    .map(({ name, key, aisleId, matched }) => ({ name, key, aisleId, matched }));
}
