"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import { PageHeader, TITLE_ILLUSTRATIONS } from "@/components/PageHeader";
import { useHouseholdId } from "@/components/HouseholdProvider";
import { useCatalog } from "@/lib/catalog";
import { fold } from "@/lib/normalize";
import { cookedLabel, sourceKind, useRecipes, type Recipe } from "@/lib/recipes";
import { recipeArt } from "@/lib/recipeArt";
import { RecipeSheet } from "./RecipeSheet";
import { RecipeForm, type FormMode } from "./RecipeForm";
import styles from "./recettes.module.css";

type Tab = "all" | "todo";
type Sort = "recent" | "never" | "most";

const SORTS: [Sort, string][] = [
  ["recent", "Récentes"],
  ["never", "Jamais cuisinées"],
  ["most", "Les plus cuisinées"],
];

const created = (r: Recipe) => r.createdAt?.toMillis() ?? Number.MAX_SAFE_INTEGER; // just added: not yet stamped

export function RecipesScreen() {
  const householdId = useHouseholdId();
  const recipes = useRecipes(householdId);
  const catalog = useCatalog();

  const [tab, setTab] = useState<Tab>("all");
  const [sort, setSort] = useState<Sort>("recent");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [form, setForm] = useState<{ mode: FormMode; recipe: Recipe | null } | null>(null);

  const complete = useMemo(() => (recipes ?? []).filter((r) => r.status === "complete"), [recipes]);
  const todos = useMemo(
    () => (recipes ?? []).filter((r) => r.status === "todo").sort((a, b) => created(b) - created(a)),
    [recipes],
  );

  const list = useMemo(() => {
    const q = fold(query.trim());
    const found = q ? complete.filter((r) => fold(r.title).includes(q)) : complete;
    const byTitle = (a: Recipe, b: Recipe) => a.title.localeCompare(b.title, "fr", { sensitivity: "base" });
    return [...found].sort((a, b) =>
      sort === "recent"
        ? created(b) - created(a)
        : sort === "never"
          ? a.cookedCount - b.cookedCount || byTitle(a, b)
          : b.cookedCount - a.cookedCount || byTitle(a, b),
    );
  }, [complete, query, sort]);

  const opened = openId ? (recipes ?? []).find((r) => r.id === openId) ?? null : null;

  // Tabs: arrow keys move between the two (WAI-ARIA tabs pattern).
  const onTabKey = (e: KeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const next: Tab = tab === "all" ? "todo" : "all";
    setTab(next);
    document.getElementById(`onglet-${next}`)?.focus();
  };

  const subtitle =
    recipes === null
      ? "Chargement du carnet…"
      : complete.length === 1
        ? "1 recette dans ton carnet"
        : `${complete.length} recettes dans ton carnet`;

  return (
    <>
      <PageHeader title="Recettes" subtitle={subtitle} illustration={TITLE_ILLUSTRATIONS.recettes}>
        <button
          type="button"
          className={styles.newButton}
          onClick={() => setForm({ mode: "new", recipe: null })}
        >
          Nouvelle recette
          <span className={styles.plus} aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
        </button>
      </PageHeader>

      <div className={styles.toolbar}>
        <div role="tablist" aria-label="Catégories de recettes" className={styles.tabs} onKeyDown={onTabKey}>
          <button
            id="onglet-all"
            type="button"
            role="tab"
            aria-selected={tab === "all"}
            aria-controls="panneau-all"
            tabIndex={tab === "all" ? 0 : -1}
            className={styles.tab}
            onClick={() => setTab("all")}
          >
            Recettes · {complete.length}
          </button>
          <button
            id="onglet-todo"
            type="button"
            role="tab"
            aria-selected={tab === "todo"}
            aria-controls="panneau-todo"
            tabIndex={tab === "todo" ? 0 : -1}
            className={styles.tab}
            onClick={() => setTab("todo")}
          >
            <span className={styles.bang} aria-hidden="true">
              !
            </span>
            À compléter · {todos.length}
          </button>
        </div>

        {tab === "all" && (
          <>
            <label className={styles.search}>
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="6.5" />
                <path d="M16 16l4.5 4.5" />
              </svg>
              <input
                type="search"
                aria-label="Chercher une recette"
                placeholder="Chercher une recette…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <div role="group" aria-label="Trier" className={styles.sorts}>
              {SORTS.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={sort === key}
                  className={`${styles.sort} kd-hit`}
                  onClick={() => setSort(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {tab === "all" ? (
        <div id="panneau-all" role="tabpanel" aria-labelledby="onglet-all">
          {recipes !== null && list.length > 0 && (
            <ul className={styles.grid}>
              {list.map((r) => {
                const art = recipeArt(r, catalog);
                const kind = sourceKind(r.sourceUrl);
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      className={styles.card}
                      data-recipe={r.id}
                      onClick={() => setOpenId(r.id)}
                      aria-label={`Ouvrir la recette ${r.title}`}
                    >
                      <span className={styles.thumb} style={{ background: art.background }}>
                        <Image
                          src={art.src}
                          alt=""
                          width={art.width}
                          height={art.height}
                          sizes="146px"
                          className={styles.thumbImage}
                        />
                      </span>
                      <span className={styles.cardBody}>
                        <span className={styles.cardTitle}>{r.title}</span>
                        <span className={styles.chips}>
                          <span className={styles.chip}>{cookedLabel(r.cookedCount)}</span>
                          {kind && (
                            <span className={`${styles.chip} ${styles.chipSource}`}>
                              <svg width="10" height="10" viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M7 4.5v15l13-7.5z" />
                              </svg>
                              {kind === "Site de recette" ? "Lien" : kind}
                            </span>
                          )}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {recipes !== null && list.length === 0 && (
            <div className={styles.empty}>
              {complete.length === 0 ? (
                <>
                  <span className={styles.emptyTitle}>Ton carnet est encore vide.</span>
                  <span>Ajoute ta première recette avec « Nouvelle recette ».</span>
                </>
              ) : (
                <>
                  <span className={styles.emptyTitle}>Aucune recette ne correspond.</span>
                  <span>Essaie un autre mot, ou crée la recette.</span>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        <div id="panneau-todo" role="tabpanel" aria-labelledby="onglet-todo" className={styles.todos}>
          {todos.map((r) => (
            <div key={r.id} className={styles.todo}>
              <span className={styles.todoBang} aria-hidden="true">
                !
              </span>
              <div className={styles.todoText}>
                <span className={styles.todoTitle}>{r.title}</span>
                <span>Aucun ingrédient</span>
              </div>
              <button
                type="button"
                className={styles.todoButton}
                onClick={() => setForm({ mode: "todo", recipe: r })}
                aria-label={`Compléter ${r.title}`}
              >
                Compléter
              </button>
            </div>
          ))}
          {recipes !== null && todos.length === 0 && (
            <div className={styles.empty}>
              <span className={styles.emptyTitle}>Rien à compléter.</span>
              <span>Toutes tes recettes ont leurs ingrédients.</span>
            </div>
          )}
        </div>
      )}

      {opened && !form && (
        <RecipeSheet
          householdId={householdId}
          recipe={opened}
          art={recipeArt(opened, catalog)}
          onClose={() => {
            // The opener may be gone (sheet opened after saving): land on the recipe's card.
            const id = openId;
            setOpenId(null);
            setTimeout(() => {
              if (document.activeElement === document.body) {
                document.querySelector<HTMLElement>(`[data-recipe="${id}"]`)?.focus();
              }
            }, 0);
          }}
          onEdit={() => setForm({ mode: "edit", recipe: opened })}
          onDeleted={() => setOpenId(null)}
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
          onSaved={(id) => {
            setForm(null);
            setTab("all");
            setOpenId(id);
          }}
          onDeleted={() => {
            setForm(null);
            setOpenId(null);
          }}
        />
      )}
    </>
  );
}
