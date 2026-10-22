"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useHousehold, useHouseholdId } from "./HouseholdProvider";
import { useCatalog, type Catalog } from "@/lib/catalog";
import { useHouseholdIngredients, type HouseholdIngredients } from "@/lib/ingredients";
import { byAisle, kaddyItems, useChecks, type KaddyAisle } from "@/lib/kaddy";
import { useExtras } from "@/lib/list";
import { useRecipes } from "@/lib/recipes";
import { useWeeks, weekIdOf } from "@/lib/weeks";

type Kaddy = {
  weekId: string;
  /** null while loading */
  aisles: KaddyAisle[] | null;
  checked: Set<string>;
  total: number;
  done: number;
  catalog: Catalog | null;
  own: HouseholdIngredients | null;
};

const KaddyContext = createContext<Kaddy | null>(null);

/**
 * This week's shopping list, computed once for the whole shell: Mon Kaddy shows it and the
 * navigation badge counts what is left. Firestore shares the listeners with the other screens.
 */
export function KaddyProvider({ children }: { children: ReactNode }) {
  const householdId = useHouseholdId();
  const state = useHousehold();
  const aisleOrder = state.status === "signedIn" ? state.household?.aisleOrder : undefined;
  const weekId = weekIdOf(new Date());
  const recipes = useRecipes(householdId);
  const weeks = useWeeks(householdId);
  const extras = useExtras(householdId, weekId);
  const checks = useChecks(householdId, weekId);
  const catalog = useCatalog();
  const own = useHouseholdIngredients(householdId);

  const value = useMemo<Kaddy>(() => {
    const checked = checks ?? new Set<string>();
    // Without the catalogue and the household's aisles, every product would land in "Autres".
    if (!recipes || !weeks || !extras || !checks || !catalog || !own) return { weekId, aisles: null, checked, total: 0, done: 0, catalog, own };
    const items = kaddyItems(weeks.get(weekId), new Map(recipes.map((r) => [r.id, r])), extras, own, catalog);
    const aisles = byAisle(items, aisleOrder ?? []);
    const done = items.filter((i) => checked.has(i.itemKey)).length;
    return { weekId, aisles, checked, total: items.length, done, catalog, own };
  }, [weekId, recipes, weeks, extras, checks, own, catalog, aisleOrder]);

  return <KaddyContext.Provider value={value}>{children}</KaddyContext.Provider>;
}

export function useKaddy() {
  const kaddy = useContext(KaddyContext);
  if (!kaddy) throw new Error("useKaddy outside KaddyProvider");
  return kaddy;
}
