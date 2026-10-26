"use client";

import { useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { areClose, keyOf, titleWords } from "./normalize";

export const UNITS = ["g", "kg", "ml", "cl", "l", "CC", "CS", "pincée", "pièce"] as const;
export type Unit = (typeof UNITS)[number];

export type Ingredient = { name: string; key: string; qty: number | null; unit: Unit | null };

export type Recipe = {
  id: string;
  title: string;
  titleWords: string[];
  description: string;
  sourceUrl: string | null;
  ingredients: Ingredient[];
  steps: string[];
  status: "complete" | "todo";
  dismissedDuplicates: string[];
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
};

/** What the form edits; everything else is derived or kept. */
export type RecipeInput = {
  title: string;
  sourceUrl: string | null;
  ingredients: { name: string; qty: number | null; unit: Unit | null }[];
  steps: string[];
  dismissedDuplicates: string[];
};

const recipesOf = (householdId: string) => collection(db, "households", householdId, "recipes");

/** All the household's recipes, kept in sync (local writes show up immediately). */
export function useRecipes(householdId: string) {
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  useEffect(
    () =>
      onSnapshot(
        recipesOf(householdId),
        (snap) =>
          setRecipes(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Recipe, "id">) }))),
        () => setRecipes((r) => r ?? []),
      ),
    [householdId],
  );
  return recipes;
}

// A recipe without ingredients is "à compléter" (PRODUCT.md).
function toFields(input: RecipeInput) {
  const ingredients: Ingredient[] = input.ingredients
    .map((i) => ({ ...i, name: i.name.trim() }))
    .filter((i) => i.name)
    .map((i) => ({ name: i.name, key: keyOf(i.name), qty: i.qty, unit: i.unit }));
  return {
    title: input.title.trim(),
    titleWords: titleWords(input.title),
    sourceUrl: input.sourceUrl,
    ingredients,
    steps: input.steps.map((s) => s.trim()).filter(Boolean),
    status: ingredients.length ? ("complete" as const) : ("todo" as const),
    dismissedDuplicates: input.dismissedDuplicates,
    updatedAt: serverTimestamp(),
  };
}

/**
 * Creates a recipe. The id is known at once, so a caller can use it without waiting for the
 * server (the Menu fills a slot with it straight away); `saved` resolves once it is stored.
 * "Cuisinée N fois" is not stored: it is derived from the weeks (cookStats in weeks.ts).
 */
export function createRecipe(householdId: string, input: RecipeInput) {
  const ref = doc(recipesOf(householdId));
  const saved = setDoc(ref, { ...toFields(input), description: "", createdAt: serverTimestamp() });
  return { id: ref.id, saved };
}

export const updateRecipe = (householdId: string, id: string, input: RecipeInput) =>
  updateDoc(doc(recipesOf(householdId), id), toFields(input));

/** Adds an ingredient to the recipe itself (from the list): a recipe "à compléter" becomes complete. */
export function appendIngredient(householdId: string, recipe: Recipe, name: string, qty: number | null = null, unit: Unit | null = null) {
  const ingredients = [...recipe.ingredients, { name: name.trim(), key: keyOf(name), qty, unit }];
  return updateDoc(doc(recipesOf(householdId), recipe.id), {
    ingredients,
    status: "complete",
    updatedAt: serverTimestamp(),
  }).catch((e) => console.error("appendIngredient", e));
}

export const deleteRecipe = (householdId: string, id: string) =>
  deleteDoc(doc(recipesOf(householdId), id));

/** First other recipe whose title is close, ignoring the ones declared "not a duplicate". */
export function findDuplicate(title: string, recipes: Recipe[], exceptId: string | null, dismissed: string[]) {
  const words = titleWords(title);
  return (
    recipes.find(
      (r) => r.id !== exceptId && !dismissed.includes(r.id) && areClose(words, r.titleWords ?? titleWords(r.title)),
    ) ?? null
  );
}

/* ---------- Display helpers ---------- */

const number = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });

/** "2 pièces", "3 pincées"; the other units never take an s. */
export const unitLabel = (unit: Unit, qty: number | null) =>
  (unit === "pièce" || unit === "pincée") && (qty ?? 0) > 1 ? `${unit}s` : unit;

export const formatQty = (qty: number | null, unit: Unit | null) => {
  if (qty == null) return "";
  const u = unit && unitLabel(unit, qty);
  return u ? `${number.format(qty)} ${u}` : number.format(qty);
};

export const cookedLabel = (n: number) =>
  n === 0 ? "Jamais cuisinée" : n === 1 ? "Cuisinée 1 fois" : `Cuisinée ${n} fois`;

/** Only http(s) links are kept (a pasted "javascript:" link must never become an href). */
export function safeUrl(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

export type SourceKind = "YouTube" | "Instagram" | "Site de recette";

export function sourceKind(url: string | null): SourceKind | null {
  if (!url) return null;
  if (/youtu\.?be/i.test(url)) return "YouTube";
  if (/instagram/i.test(url)) return "Instagram";
  return "Site de recette";
}

export const sourceLabel = (kind: SourceKind) =>
  kind === "Site de recette" ? "Voir la recette" : `Voir sur ${kind}`;

export const parseQty = (raw: string) => {
  const n = Number.parseFloat(raw.replace(",", ".").trim());
  return Number.isFinite(n) && n > 0 ? n : null;
};
