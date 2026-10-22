"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Columns } from "@/components/Columns";
import { PageHeader, TITLE_ILLUSTRATIONS } from "@/components/PageHeader";
import { useHouseholdId } from "@/components/HouseholdProvider";
import { RecipeSheet } from "@/components/recipes/RecipeSheet";
import { RecipeForm } from "@/components/recipes/RecipeForm";
import { useCatalog } from "@/lib/catalog";
import { useHouseholdIngredients } from "@/lib/ingredients";
import { useExtras } from "@/lib/list";
import { recipeArt } from "@/lib/recipeArt";
import { useRecipes, type Recipe } from "@/lib/recipes";
import { DESKTOP, useMediaQuery } from "@/lib/useMediaQuery";
import {
  ALL_SLOTS,
  MEAL_LABELS,
  cookStats,
  dateOf,
  dayMonth,
  getSlot,
  mondayOf,
  slotIndex,
  useWeeks,
  weekIdOf,
  type Day,
  type SlotRef,
} from "@/lib/weeks";
import { ExtrasCard, RecipeCard } from "./ListCards";
import styles from "./liste.module.css";

const SHORT: Record<Day, string> = { mon: "Lun.", tue: "Mar.", wed: "Mer.", thu: "Jeu.", fri: "Ven.", sat: "Sam.", sun: "Dim." };

type Planned = { recipe: Recipe; slots: { ref: SlotRef; leftover: boolean }[] };

export function ListScreen() {
  const householdId = useHouseholdId();
  const recipes = useRecipes(householdId);
  const weeks = useWeeks(householdId);
  const catalog = useCatalog();
  const own = useHouseholdIngredients(householdId);
  const desktop = useMediaQuery(DESKTOP);
  const wide = useMediaQuery("(min-width: 1320px)");
  const columns = wide ? 3 : desktop ? 2 : 1;
  const thisWeek = weekIdOf(new Date());
  const extras = useExtras(householdId, thisWeek);
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Recipe | null>(null);

  const recipesById = useMemo(() => new Map((recipes ?? []).map((r) => [r.id, r])), [recipes]);
  const stats = useMemo(() => cookStats(weeks), [weeks]);

  // This week, then every later week that already has dishes planned.
  const shown = useMemo(() => {
    const ids = [...(weeks?.keys() ?? [])].filter((id) => id > thisWeek);
    return [thisWeek, ...ids.sort()].map((weekId) => {
      const week = weeks?.get(weekId);
      const byRecipe = new Map<string, Planned>();
      for (const ref of ALL_SLOTS) {
        const slot = getSlot(week, ref);
        if (!slot || slot.kind === "simple") continue;
        const recipe = recipesById.get(slot.recipeId);
        if (!recipe) continue;
        const p = byRecipe.get(recipe.id) ?? { recipe, slots: [] };
        p.slots.push({ ref, leftover: slot.kind === "leftover" });
        byRecipe.set(recipe.id, p);
      }
      // A recipe only eaten as leftovers of last week has nothing to buy.
      const planned = [...byRecipe.values()]
        .filter((p) => p.slots.some((s) => !s.leftover))
        .sort((a, b) => slotIndex(a.slots[0].ref) - slotIndex(b.slots[0].ref));
      return { weekId, week, planned };
    }).filter((w) => w.weekId === thisWeek || w.planned.length > 0);
  }, [weeks, recipesById, thisWeek]);

  const todoCount = new Set(
    shown.flatMap((w) => w.planned.filter((p) => p.recipe.ingredients.length === 0).map((p) => p.recipe.id)),
  ).size;

  const whenLabel = (weekId: string, slots: Planned["slots"]) =>
    slots
      .map(({ ref, leftover }) => {
        const day = weekId === thisWeek ? SHORT[ref.day] : `${SHORT[ref.day]} ${dateOf(weekId, ref.day).getDate()}`;
        return `${day} ${MEAL_LABELS[ref.meal]}${leftover ? " (reste)" : ""}`;
      })
      .join(" · ");

  const sheetRecipe = sheetId ? recipesById.get(sheetId) : undefined;
  const loading = recipes === null || weeks === null;

  return (
    <>
      <PageHeader
        title="Liste de courses"
        subtitle={
          <>
            Cette semaine et les suivantes
            {todoCount > 0 && ` · ${todoCount} recette${todoCount > 1 ? "s" : ""} à compléter`}
          </>
        }
        illustration={TITLE_ILLUSTRATIONS.liste}
      />

      {!loading &&
        shown.map(({ weekId, week, planned }) => {
          const isCurrent = weekId === thisWeek;
          const dishes = planned.reduce((n, p) => n + p.slots.filter((s) => !s.leftover).length, 0);
          const overrides = week?.listOverrides ?? {};
          const keys = new Set(
            planned.flatMap((p) =>
              p.recipe.ingredients.filter((i) => !overrides[`${p.recipe.id}:${i.key}`]?.removed).map((i) => i.key),
            ),
          );
          return (
            <section key={weekId} aria-labelledby={`semaine-${weekId}`} className={styles.week}>
              <div className={styles.weekHead}>
                <h2 id={`semaine-${weekId}`} className={styles.weekTitle}>
                  Semaine du {dayMonth.format(mondayOf(weekId))}
                </h2>
                {isCurrent && <span className={styles.current}>En cours</span>}
                <span className={styles.weekSummary}>
                  {dishes === 0
                    ? "Aucun plat prévu"
                    : `${dishes} plat${dishes > 1 ? "s" : ""}${isCurrent ? "" : " déjà prévu" + (dishes > 1 ? "s" : "")} · ${keys.size} ingrédient${keys.size > 1 ? "s" : ""}`}
                </span>
              </div>

              {isCurrent && planned.length === 0 && (
                <p className={styles.empty}>
                  Rien de prévu cette semaine pour l’instant. <Link href="/menu">Remplis le menu</Link>, la liste se fera
                  toute seule.
                </p>
              )}

              <Columns count={columns}>
                {planned.map((p) => (
                  <RecipeCard
                    key={p.recipe.id}
                    householdId={householdId}
                    weekId={weekId}
                    catalog={catalog}
                    own={own}
                    collapsible={!desktop}
                    recipe={p.recipe}
                    when={whenLabel(weekId, p.slots)}
                    overrides={overrides}
                    onOpen={() => setSheetId(p.recipe.id)}
                  />
                ))}
                {isCurrent && (
                  <ExtrasCard
                    householdId={householdId}
                    weekId={weekId}
                    catalog={catalog}
                    own={own}
                    collapsible={!desktop}
                    extras={extras ?? []}
                  />
                )}
              </Columns>
            </section>
          );
        })}

      {sheetRecipe && !editing && (
        <RecipeSheet
          householdId={householdId}
          recipe={sheetRecipe}
          art={recipeArt(sheetRecipe, catalog)}
          cookedCount={stats.get(sheetRecipe.id)?.count ?? 0}
          onClose={() => setSheetId(null)}
          onEdit={() => setEditing(sheetRecipe)}
          onDeleted={() => setSheetId(null)}
        />
      )}
      {editing && (
        <RecipeForm
          householdId={householdId}
          mode={editing.ingredients.length ? "edit" : "todo"}
          recipe={editing}
          recipes={recipes ?? []}
          catalog={catalog}
          onCancel={() => setEditing(null)}
          onSaved={() => setEditing(null)}
          onDeleted={() => {
            setEditing(null);
            setSheetId(null);
          }}
        />
      )}
    </>
  );
}
