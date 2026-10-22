"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import { PageHeader, TITLE_ILLUSTRATIONS } from "@/components/PageHeader";
import { useHouseholdId } from "@/components/HouseholdProvider";
import { RecipeSheet } from "@/components/recipes/RecipeSheet";
import { RecipeForm, type FormMode } from "@/components/recipes/RecipeForm";
import { useCatalog } from "@/lib/catalog";
import { GROUPS, dishGroups, type GroupId } from "@/lib/foodGroups";
import { aisleOf, useHouseholdIngredients } from "@/lib/ingredients";
import { recipeArt } from "@/lib/recipeArt";
import { createRecipe, useRecipes, type Recipe } from "@/lib/recipes";
import {
  ALL_SLOTS,
  DAYS,
  DAY_LABELS,
  clearSlot,
  cookStats,
  dateOf,
  dayMonth,
  firstFreeSlot,
  getSlot,
  isoDate,
  isoDaysAgo,
  mondayOf,
  relativeWeek,
  setSlot,
  shiftWeek,
  since,
  slotIndex,
  slotKey,
  todayIso,
  useWeeks,
  weekIdOf,
  weekRange,
  weekTitle,
  whenLabel,
  type Day,
  type SlotRef,
} from "@/lib/weeks";
import { ForgottenRecipes, MenuSummary, type SummaryData } from "./MenuSummary";
import { SlotCard, type Choice, type LeftoverSource } from "./SlotCard";
import styles from "./menu.module.css";

const SHORT: Record<Day, string> = { mon: "Lun", tue: "Mar", wed: "Mer", thu: "Jeu", fri: "Ven", sat: "Sam", sun: "Dim" };
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const FORGOTTEN_AFTER_DAYS = 21;

export function MenuScreen() {
  const householdId = useHouseholdId();
  const recipes = useRecipes(householdId);
  const weeks = useWeeks(householdId);
  const catalog = useCatalog();
  const ownIngredients = useHouseholdIngredients(householdId);

  const thisWeek = weekIdOf(new Date());
  const [weekId, setWeekId] = useState(thisWeek);
  const today = todayIso();
  const todayDay = DAYS.find((d) => isoDate(dateOf(thisWeek, d)) === today) ?? "mon";
  const [selectedDay, setSelectedDay] = useState<Day>(todayDay);
  const [editing, setEditing] = useState<string | null>(null);
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [form, setForm] = useState<{ mode: FormMode; recipe: Recipe } | null>(null);

  const recipesById = useMemo(() => new Map((recipes ?? []).map((r) => [r.id, r])), [recipes]);
  const week = weeks?.get(weekId);
  const stats = useMemo(() => cookStats(weeks), [weeks]);

  const goToWeek = (id: string) => {
    setWeekId(id);
    setEditing(null);
    setSelectedDay(id === thisWeek ? todayDay : "mon");
  };

  function choose(ref: SlotRef, choice: Choice) {
    setEditing(null);
    if (choice.kind === "create") {
      // A dish typed in the menu becomes a recipe "à compléter" (no ingredients yet).
      const { id } = createRecipe(householdId, {
        title: choice.title,
        sourceUrl: null,
        ingredients: [],
        steps: [],
        dismissedDuplicates: [],
      });
      setSlot(householdId, weekId, ref, { kind: "recipe", recipeId: id });
    } else {
      setSlot(householdId, weekId, ref, choice);
    }
  }

  function plan(recipeId: string) {
    const target = firstFreeSlot(weeks ?? new Map());
    setSlot(householdId, target.weekId, target.ref, { kind: "recipe", recipeId });
    return whenLabel(target.weekId, target.ref);
  }

  // Dishes eaten each day (leftovers included) → food-group dots.
  const dayGroups = useMemo(() => {
    const out = new Map<Day, Set<GroupId>>();
    for (const day of DAYS) {
      const groups = new Set<GroupId>();
      for (const meal of ["lunch", "dinner"] as const) {
        const slot = getSlot(week, { day, meal });
        const recipe = slot && slot.kind !== "simple" ? recipesById.get(slot.recipeId) : undefined;
        if (recipe) dishGroups(recipe.ingredients, catalog).forEach((g) => groups.add(g));
      }
      out.set(day, groups);
    }
    return out;
  }, [week, recipesById, catalog]);

  const summary: SummaryData = useMemo(() => {
    const groupCounts = Object.fromEntries(GROUPS.map((g) => [g.id, 0])) as Record<GroupId, number>;
    const meals = new Set<string>();
    const unknown = new Set<string>();
    let dishes = 0;
    let leftovers = 0;
    let filled = 0;
    for (const ref of ALL_SLOTS) {
      const slot = getSlot(week, ref);
      if (!slot) continue;
      filled++;
      if (slot.kind === "leftover") {
        leftovers++;
        continue;
      }
      if (slot.kind === "simple") {
        meals.add(`simple:${slot.name.toLowerCase()}`);
        continue;
      }
      meals.add(slot.recipeId);
      const recipe = recipesById.get(slot.recipeId);
      if (!recipe) continue;
      dishes++;
      dishGroups(recipe.ingredients, catalog).forEach((g) => groupCounts[g]++);
      if (catalog && ownIngredients) {
        for (const ing of recipe.ingredients) if (!aisleOf(ing.key, ownIngredients, catalog)) unknown.add(ing.key);
      }
    }
    const start = mondayOf(weekId).getTime() - 12 * 36e5; // Monday 00:00
    const end = start + 7 * 864e5;
    const newRecipes = (recipes ?? []).filter((r) => {
      const t = r.createdAt?.toMillis();
      return t != null && t >= start && t < end;
    }).length;
    return { dishes, groupCounts, newRecipes, toClassify: unknown.size, different: meals.size, leftovers, filled };
  }, [week, weekId, recipes, recipesById, catalog, ownIngredients]);

  const forgotten = useMemo(() => {
    const plannedHere = new Set(
      ALL_SLOTS.map((ref) => getSlot(week, ref)).flatMap((s) => (s && s.kind !== "simple" ? [s.recipeId] : [])),
    );
    const limit = isoDaysAgo(FORGOTTEN_AFTER_DAYS);
    const candidates = (recipes ?? []).filter((r) => r.status === "complete" && !plannedHere.has(r.id));
    const old = candidates
      .filter((r) => {
        const last = stats.get(r.id)?.last;
        return last && last <= limit;
      })
      .sort((a, b) => stats.get(a.id)!.last.localeCompare(stats.get(b.id)!.last))
      .map((r) => ({ id: r.id, title: r.title, when: since(stats.get(r.id)!.last) }));
    const never = candidates
      .filter((r) => !stats.has(r.id))
      .map((r) => ({ id: r.id, title: r.title, when: "Pas encore au menu" }));
    return [...old, ...never].slice(0, 6);
  }, [recipes, stats, week]);

  const leftoverSourcesFor = (ref: SlotRef): LeftoverSource[] =>
    ALL_SLOTS.filter((r) => slotIndex(r) < slotIndex(ref))
      .reverse()
      .flatMap((r) => {
        const s = getSlot(week, r);
        const recipe = s?.kind === "recipe" ? recipesById.get(s.recipeId) : undefined;
        return recipe ? [{ recipeId: recipe.id, title: recipe.title, key: slotKey(r), ref: r }] : [];
      })
      .slice(0, 4);

  const sheetRecipe = sheetId ? recipesById.get(sheetId) : undefined;

  const onDayKey = (e: KeyboardEvent) => {
    const i = DAYS.indexOf(selectedDay);
    const next = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : null;
    if (next == null || next < 0 || next > 6) return;
    setSelectedDay(DAYS[next]);
    document.getElementById(`jour-${DAYS[next]}`)?.focus();
  };

  return (
    <>
      <PageHeader
        title="Menu"
        subtitle={weekTitle(weekId)}
        illustration={TITLE_ILLUSTRATIONS.menu}
      >
        <div className={styles.weekNav} role="group" aria-label="Semaine affichée">
          <button
            type="button"
            className={styles.weekArrow}
            aria-label="Semaine précédente"
            onClick={() => goToWeek(shiftWeek(weekId, -1))}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <span className={styles.weekLabel} aria-live="polite">
            <span className={styles.weekRange}>{weekRange(weekId)}</span>
            <span className={styles.weekRelative}>{relativeWeek(weekId)}</span>
          </span>
          <button
            type="button"
            className={styles.weekArrow}
            aria-label="Semaine suivante"
            onClick={() => goToWeek(shiftWeek(weekId, 1))}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
          {weekId !== thisWeek && (
            <button type="button" className={styles.backToday} onClick={() => goToWeek(thisWeek)}>
              Aujourd’hui
            </button>
          )}
        </div>
      </PageHeader>

      {/* Mobile: one day at a time, picked in this strip. */}
      <div role="tablist" aria-label="Jours de la semaine" className={styles.dayTabs} onKeyDown={onDayKey}>
        {DAYS.map((day) => {
          const date = dateOf(weekId, day);
          const groups = dayGroups.get(day)!;
          const isToday = isoDate(date) === today;
          return (
            <button
              key={day}
              id={`jour-${day}`}
              type="button"
              role="tab"
              aria-selected={selectedDay === day}
              aria-controls={`colonne-${day}`}
              tabIndex={selectedDay === day ? 0 : -1}
              aria-label={`${capitalize(DAY_LABELS[day])} ${dayMonth.format(date)}${isToday ? ", aujourd’hui" : ""}`}
              className={`${styles.dayTab} ${isToday ? styles.dayTabToday : ""}`}
              onClick={() => {
                setSelectedDay(day);
                setEditing(null);
              }}
            >
              <span className={styles.dayTabShort}>{SHORT[day]}</span>
              <span className={styles.dayTabNum}>{date.getDate()}</span>
              <span className={styles.dayTabDots} aria-hidden="true">
                {groups.size ? (
                  GROUPS.filter((g) => groups.has(g.id)).map((g) => (
                    <span key={g.id} style={{ background: g.color }} />
                  ))
                ) : (
                  <span className={styles.dayTabDotEmpty} />
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div className={styles.week}>
        <div className={styles.grid}>
          {DAYS.map((day) => {
            const date = dateOf(weekId, day);
            const isToday = isoDate(date) === today;
            const groups = dayGroups.get(day)!;
            const label = `${capitalize(DAY_LABELS[day])} ${dayMonth.format(date)}`;
            return (
              <section
                key={day}
                id={`colonne-${day}`}
                aria-label={`${label}${isToday ? ", aujourd’hui" : ""}`}
                className={`${styles.day} ${isToday ? styles.dayToday : ""} ${selectedDay === day ? styles.daySelected : ""}`}
              >
                <div className={styles.dayHead}>
                  <div className={styles.dayTitle}>
                    <span className={styles.dayName}>{capitalize(DAY_LABELS[day])}</span>
                    <span className={styles.dayNum}>{date.getDate()}</span>
                  </div>
                  <h2 className={styles.dayHeading}>
                    {label}
                    {isToday && <span className={styles.todayBadge}>Aujourd’hui</span>}
                  </h2>
                  <div
                    role="img"
                    aria-label={
                      groups.size
                        ? GROUPS.filter((g) => groups.has(g.id)).map((g) => g.label.toLowerCase()).join(", ")
                        : "Aucun groupe alimentaire"
                    }
                    className={styles.dots}
                  >
                    {GROUPS.map((g) => (
                      <span
                        key={g.id}
                        className={groups.has(g.id) ? styles.dot : styles.dotEmpty}
                        style={groups.has(g.id) ? { background: g.color } : undefined}
                      />
                    ))}
                  </div>
                </div>
                {(["lunch", "dinner"] as const).map((meal) => {
                  const ref = { day, meal };
                  const key = `${weekId}/${slotKey(ref)}`;
                  return (
                    <SlotCard
                      key={key}
                      slotRef={ref}
                      slot={getSlot(week, ref)}
                      recipes={recipes ?? []}
                      recipesById={recipesById}
                      editing={editing === key}
                      leftoverSources={editing === key ? leftoverSourcesFor(ref) : []}
                      onEdit={() => setEditing(key)}
                      onCancel={() => setEditing((k) => (k === key ? null : k))}
                      onChoose={(c) => choose(ref, c)}
                      onClear={() => clearSlot(householdId, weekId, ref)}
                      onOpenRecipe={(r) => setSheetId(r.id)}
                    />
                  );
                })}
              </section>
            );
          })}
        </div>

        <ul aria-label="Légende des groupes alimentaires" className={styles.legend}>
          {GROUPS.map((g) => (
            <li key={g.id}>
              <span className={styles.dot} style={{ background: g.color }} />
              {g.label}
            </li>
          ))}
          <li>
            <span className={styles.dotEmpty} />
            Absent du jour
          </li>
        </ul>
      </div>

      <MenuSummary data={summary} />
      <ForgottenRecipes items={forgotten} onPlan={plan} />

      {sheetRecipe && !form && (
        <RecipeSheet
          householdId={householdId}
          recipe={sheetRecipe}
          art={recipeArt(sheetRecipe, catalog)}
          cookedCount={stats.get(sheetRecipe.id)?.count ?? 0}
          onClose={() => setSheetId(null)}
          onEdit={() => setForm({ mode: "edit", recipe: sheetRecipe })}
          onDeleted={() => setSheetId(null)}
        />
      )}
      {form && (
        <RecipeForm
          householdId={householdId}
          mode={form.mode}
          recipe={form.recipe}
          recipes={recipes ?? []}
          catalog={catalog}
          onCancel={() => setForm(null)}
          onSaved={() => setForm(null)}
          onDeleted={() => {
            setForm(null);
            setSheetId(null);
          }}
        />
      )}
    </>
  );
}
