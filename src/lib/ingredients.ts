"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import { knownAisle } from "./aisles";
import type { Catalog } from "./catalog";

/** The household's own aisle choices (households/{hid}/ingredients/{key}), which win over the catalogue. */
export type HouseholdIngredients = Map<string, { name: string; aisleId: string | null }>;

export function useHouseholdIngredients(householdId: string) {
  const [items, setItems] = useState<HouseholdIngredients | null>(null);
  useEffect(
    () =>
      onSnapshot(
        collection(db, "households", householdId, "ingredients"),
        (snap) =>
          setItems(new Map(snap.docs.map((d) => [d.id, d.data() as { name: string; aisleId: string | null }]))),
        () => setItems((i) => i ?? new Map()),
      ),
    [householdId],
  );
  return items;
}

/** Aisle of an ingredient: the household's choice, then the catalogue; null = "Ingrédients à classer". */
export function aisleOf(key: string, own: HouseholdIngredients | null, catalog: Catalog | null): string | null {
  const mine = own?.get(key);
  if (mine) return knownAisle(mine.aisleId);
  return knownAisle(catalog?.byKey.get(key)?.aisleId);
}
