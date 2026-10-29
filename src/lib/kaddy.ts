"use client";

import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, serverTimestamp, setDoc, writeBatch } from "firebase/firestore";
import { db } from "./firebase";
import { AISLES, fullOrder, knownAisle, type AisleArt } from "./aisles";
import type { Catalog } from "./catalog";
import { aisleOf, type HouseholdIngredients } from "./ingredients";
import { overrideKey, type Extra } from "./list";
import type { Recipe, Unit } from "./recipes";
import { ALL_SLOTS, getSlot, type Week } from "./weeks";

/* ---------- The shopping list of a week (docs/data-model.md, "Mon Kaddy computation") ---------- */

export type KaddyItem = {
  itemKey: string; // `${key}__${unit ?? "-"}`, id of its weeks/{weekId}/checks document
  key: string;
  name: string;
  qty: number | null;
  unit: Unit | null;
  aisleId: string; // "autres" when the product has no aisle yet
  unclassified: boolean;
  sources: { label: string; qty: number | null }[]; // recipe titles, or "Hors menu"
};

export type KaddyAisle = { id: string; label: string; illustration: AisleArt | null; unclassified: boolean; items: KaddyItem[] };

export const itemKeyOf = (key: string, unit: Unit | null) => `${key}__${unit ?? "-"}`;
const UNCLASSIFIED = "autres";

/**
 * Recipes of the week's `recipe` slots (once per recipe, as in the Liste de courses; leftovers add
 * nothing), with the week's overrides, plus the Hors menu items, merged by key + unit.
 */
export function kaddyItems(
  week: Week | undefined,
  recipesById: Map<string, Recipe>,
  extras: Extra[],
  own: HouseholdIngredients | null,
  catalog: Catalog | null,
): KaddyItem[] {
  const items = new Map<string, KaddyItem>();
  const add = (key: string, name: string, qty: number | null, unit: Unit | null, aisleId: string | null, source: string) => {
    const itemKey = itemKeyOf(key, unit);
    const item = items.get(itemKey) ?? {
      itemKey,
      key,
      name,
      qty: null,
      unit,
      aisleId: aisleId ?? UNCLASSIFIED,
      unclassified: !aisleId,
      sources: [],
    };
    if (qty != null) item.qty = (item.qty ?? 0) + qty;
    item.sources.push({ label: source, qty });
    items.set(itemKey, item);
  };

  const planned = new Set<string>();
  for (const ref of ALL_SLOTS) {
    const slot = getSlot(week, ref);
    if (slot?.kind === "recipe") planned.add(slot.recipeId);
  }
  const overrides = week?.listOverrides ?? {};
  for (const id of planned) {
    const recipe = recipesById.get(id);
    if (!recipe) continue;
    for (const ing of recipe.ingredients) {
      const o = overrides[overrideKey(recipe.id, ing.key)];
      if (o?.removed) continue;
      const qty = o && o.qty !== undefined ? o.qty : ing.qty;
      const unit = o && o.unit !== undefined ? o.unit : ing.unit;
      add(ing.key, ing.name, qty, unit, aisleOf(ing.key, own, catalog), recipe.title);
    }
  }
  for (const x of extras) add(x.key, x.name, x.qty, x.unit, knownAisle(x.aisleId) ?? aisleOf(x.key, own, catalog), "Hors menu");
  return [...items.values()];
}

/** "2 Gnocchi + 3 One pot" when several sources add up, "Hors menu" for an off-menu product. */
export function sourceLine(item: KaddyItem) {
  if (item.sources.length === 1) return item.sources[0].label === "Hors menu" ? "Hors menu" : "";
  return item.sources.map((s) => (s.qty != null ? `${number.format(s.qty)} ${s.label}` : s.label)).join(" + ");
}
const number = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });

/** Aisles in the household's order (unknown ones after), items sorted alphabetically inside. */
export function byAisle(items: KaddyItem[], aisleOrder: string[]): KaddyAisle[] {
  return fullOrder(aisleOrder)
    .map((id) => {
      const aisle = AISLES.find((a) => a.id === id);
      const inAisle = items
        .filter((i) => i.aisleId === id)
        .sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));
      return {
        id,
        label: aisle?.label ?? id,
        illustration: aisle?.illustration ?? null,
        unclassified: inAisle.some((i) => i.unclassified),
        items: inAisle,
      };
    })
    .filter((a) => a.items.length > 0);
}

/* ---------- Ticks: one document per item (weeks/{weekId}/checks/{itemKey}) ---------- */

const checksOf = (householdId: string, weekId: string) =>
  collection(db, "households", householdId, "weeks", weekId, "checks");

/** itemKeys ticked this week, kept in sync across the household's devices. */
export function useChecks(householdId: string, weekId: string) {
  const [checked, setChecked] = useState<Set<string> | null>(null);
  useEffect(
    () =>
      onSnapshot(
        checksOf(householdId, weekId),
        (snap) => setChecked(new Set(snap.docs.filter((d) => d.data().checked).map((d) => d.id))),
        () => setChecked((c) => c ?? new Set()),
      ),
    [householdId, weekId],
  );
  return checked;
}

/** Not awaited: the local write reaches the listener at once, then the other phones. */
export const setCheck = (householdId: string, weekId: string, itemKey: string, checked: boolean) =>
  setDoc(doc(checksOf(householdId, weekId), itemKey), { checked, at: serverTimestamp() }).catch((e) =>
    console.error("setCheck", e),
  );

/** "Tout décocher": removes the week's tick documents. */
export function clearChecks(householdId: string, weekId: string, itemKeys: Iterable<string>) {
  const batch = writeBatch(db);
  for (const k of itemKeys) batch.delete(doc(checksOf(householdId, weekId), k));
  return batch.commit().catch((e) => console.error("clearChecks", e));
}
