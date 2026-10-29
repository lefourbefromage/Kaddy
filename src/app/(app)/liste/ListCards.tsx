"use client";

import { useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { AislePicker } from "@/components/AislePicker";
import { ProductInput } from "@/components/ProductInput";
import { AISLE_BY_ID, knownAisle } from "@/lib/aisles";
import type { Catalog } from "@/lib/catalog";
import { aisleOf, type HouseholdIngredients } from "@/lib/ingredients";
import { keyOf } from "@/lib/normalize";
import {
  addPickedExtra,
  deleteExtra,
  overrideKey,
  setIngredientAisle,
  setOverride,
  updateExtra,
  type Extra,
  type Override,
} from "@/lib/list";
import { appendIngredient, formatQty, type Recipe } from "@/lib/recipes";
import { IngredientRow } from "./IngredientRow";
import styles from "./liste.module.css";

/**
 * The row just added from a card's field: it takes the focus for its quantity, then hands it
 * back to the field (IngredientRow `onNext`).
 */
function useEntry() {
  const [key, setKey] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  return {
    inputRef,
    start: (k: string) => setKey(k),
    next: (k: string) =>
      k === key
        ? () => {
            setKey(null);
            inputRef.current?.focus();
          }
        : undefined,
  };
}

type Shared = {
  householdId: string;
  weekId: string;
  catalog: Catalog | null;
  own: HouseholdIngredients | null;
  collapsible: boolean;
};

/** Card shell: always open on desktop, a disclosure on mobile. */
function Card({
  title,
  titleExtra,
  sub,
  count,
  action,
  collapsible,
  defaultOpen,
  children,
}: {
  title: string;
  titleExtra?: ReactNode;
  sub: string;
  count: string;
  action?: ReactNode;
  collapsible: boolean;
  defaultOpen: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const shown = !collapsible || open;
  const heading = (
    <>
      <span className={styles.cardText}>
        <span className={styles.cardTitle}>
          {title}
          {titleExtra}
        </span>
        <span className={styles.cardSub}>{sub}</span>
      </span>
      <span className={styles.count}>{count}</span>
    </>
  );
  return (
    <article className={styles.card}>
      <div className={styles.cardHead}>
        {collapsible ? (
          <h3 className={styles.cardHeading}>
            <button type="button" className={styles.cardToggle} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
              {heading}
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className={styles.chevron}>
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          </h3>
        ) : (
          <h3 className={styles.cardHeading}>{heading}</h3>
        )}
        {action}
      </div>
      {shown && <div className={styles.cardBody}>{children}</div>}
    </article>
  );
}

const RowHeader = () => (
  <div className={styles.rowHeader} aria-hidden="true">
    <span>Ingrédient</span>
    <span>Qté</span>
    <span>Unité</span>
    <span />
  </div>
);

function AisleLine({
  householdId,
  name,
  ingKey,
  aisleId,
  prefix,
  onPicked,
}: {
  householdId: string;
  name: string;
  ingKey: string;
  aisleId: string | null;
  prefix?: string;
  onPicked?: (aisleId: string) => void;
}) {
  if (!aisleId)
    return (
      <AislePicker
        name={name}
        onPick={(a) => {
          setIngredientAisle(householdId, ingKey, name, a);
          onPicked?.(a);
        }}
      />
    );
  const label = AISLE_BY_ID.get(aisleId)?.label;
  return prefix ? <span className={styles.rowSub}>{`${prefix} · ${label}`}</span> : null;
}

/* ---------- A planned recipe ---------- */

export function RecipeCard({
  recipe,
  when,
  overrides,
  onOpen,
  ...shared
}: Shared & {
  recipe: Recipe;
  when: string;
  overrides: Record<string, Override>;
  onOpen: () => void;
}) {
  const { householdId, weekId, catalog, own, collapsible } = shared;
  const entry = useEntry();
  const todo = recipe.ingredients.length === 0;
  const rows = recipe.ingredients.map((ing) => {
    const o = overrides[overrideKey(recipe.id, ing.key)];
    const modified = !!o && !o.removed && (o.qty !== undefined || o.unit !== undefined);
    return {
      ing,
      removed: !!o?.removed,
      modified,
      qty: o && "qty" in o && o.qty !== undefined ? o.qty : ing.qty,
      unit: o && "unit" in o && o.unit !== undefined ? o.unit : ing.unit,
    };
  });
  const active = rows.filter((r) => !r.removed);
  const removed = rows.filter((r) => r.removed);

  const write = (key: string, base: { qty: number | null; unit: Recipe["ingredients"][number]["unit"] }, next: { qty: number | null; unit: Recipe["ingredients"][number]["unit"] }) =>
    setOverride(
      householdId,
      weekId,
      overrideKey(recipe.id, key),
      next.qty === base.qty && next.unit === base.unit ? null : { qty: next.qty, unit: next.unit },
    );

  return (
    <Card
      title={recipe.title}
      titleExtra={
        todo ? (
          <span className={styles.todoDot} aria-label="À compléter" title="À compléter">
            !
          </span>
        ) : null
      }
      sub={when}
      count={todo ? "Vide" : active.length === 1 ? "1 ingrédient" : `${active.length} ingrédients`}
      collapsible={collapsible}
      defaultOpen={todo}
      action={
        <button type="button" className={`${styles.eye} kd-hit`} aria-label={`Voir la recette ${recipe.title}`} onClick={onOpen}>
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 12s3.5-6.5 9-6.5 9 6.5 9 6.5-3.5 6.5-9 6.5S3 12 3 12z" />
            <circle cx="12" cy="12" r="2.8" />
          </svg>
        </button>
      }
    >
      {todo ? (
        <>
          <p className={styles.todoNote}>
            <span className={styles.todoDot} aria-hidden="true">
              !
            </span>
            À compléter : ses ingrédients seront gardés dans la recette.
          </p>
          <div className={styles.todoIntro}>
            <Image src="/illustrations/recette-a-completer.webp" alt="" width={350} height={260} className={styles.todoArt} />
            <p>
              Ajoute le premier ingrédient de <strong>{recipe.title}</strong>.
            </p>
          </div>
        </>
      ) : (
        <>
          <RowHeader />
          {active.map((r) => (
            <IngredientRow
              key={r.ing.key}
              name={r.ing.name}
              qty={r.qty}
              unit={r.unit}
              modified={r.modified}
              modifiedHint={`modifiée cette semaine, ${formatQty(r.ing.qty, r.ing.unit) || "sans quantité"} dans la recette`}
              sub={<AisleLine householdId={householdId} name={r.ing.name} ingKey={r.ing.key} aisleId={aisleOf(r.ing.key, own, catalog)} />}
              onQty={(qty) => write(r.ing.key, r.ing, { qty, unit: r.unit })}
              onUnit={(unit) => write(r.ing.key, r.ing, { qty: r.qty, unit })}
              onRemove={() => setOverride(householdId, weekId, overrideKey(recipe.id, r.ing.key), { removed: true })}
              onNext={entry.next(r.ing.key)}
            />
          ))}
          {removed.length > 0 && (
            <p className={styles.removed}>
              Retiré cette semaine :{" "}
              {removed.map((r, i) => (
                <span key={r.ing.key}>
                  {i > 0 && ", "}
                  {r.ing.name}{" "}
                  <button
                    type="button"
                    className={`${styles.restore} kd-hit`}
                    onClick={() => setOverride(householdId, weekId, overrideKey(recipe.id, r.ing.key), null)}
                  >
                    Rétablir<span className={styles.srOnly}> {r.ing.name}</span>
                  </button>
                </span>
              ))}
            </p>
          )}
        </>
      )}
      <button type="button" className={styles.openRecipe} onClick={onOpen}>
        Voir la recette
      </button>
      <div className={styles.addRow}>
        <ProductInput
          label={`Ajouter un ingrédient à ${recipe.title}`}
          placeholder="Ajouter un ingrédient"
          catalog={catalog}
          own={own}
          dashed={!todo}
          forRecipe
          inputRef={entry.inputRef}
          onPick={(p) => {
            appendIngredient(householdId, recipe, p.name);
            entry.start(keyOf(p.name));
          }}
        />
      </div>
    </Card>
  );
}

/* ---------- "Hors menu" ---------- */

/** No head of its own: it sits under the "Hors menu" title, at the bottom of the page. */
export function ExtrasCard({ extras, ...shared }: Omit<Shared, "collapsible"> & { extras: Extra[] }) {
  const { householdId, weekId, catalog, own } = shared;
  const entry = useEntry();
  // Several extras can share a product: the one just added is the last of them.
  const lastOf = new Map(extras.map((x) => [x.key, x.id]));
  return (
    <article className={`${styles.card} ${styles.extrasCard}`}>
      <div className={styles.cardBody}>
        {extras.length > 0 && <RowHeader />}
        {extras.map((x) => {
          const aisleId = knownAisle(x.aisleId) ?? aisleOf(x.key, own, catalog);
          return (
            <IngredientRow
              key={x.id}
              name={x.name}
              qty={x.qty}
              unit={x.unit}
              sub={
                aisleId ? (
                  <span className={styles.rowSub}>{AISLE_BY_ID.get(aisleId)?.label}</span>
                ) : (
                  <AisleLine
                    householdId={householdId}
                    name={x.name}
                    ingKey={x.key}
                    aisleId={null}
                    onPicked={(a) => updateExtra(householdId, weekId, x.id, { aisleId: a })}
                  />
                )
              }
              onQty={(qty) => updateExtra(householdId, weekId, x.id, { qty })}
              onUnit={(unit) => updateExtra(householdId, weekId, x.id, { unit })}
              onRemove={() => deleteExtra(householdId, weekId, x.id)}
              onNext={lastOf.get(x.key) === x.id ? entry.next(x.key) : undefined}
            />
          );
        })}
        <div className={styles.addRow}>
          <ProductInput
            label="Ajouter un produit hors menu"
            placeholder="Ajouter un produit (éponges, café…)"
            catalog={catalog}
            own={own}
            inputRef={entry.inputRef}
            onPick={(p) => {
              addPickedExtra(householdId, weekId, p, own, catalog);
              entry.start(p.key ?? keyOf(p.name));
            }}
          />
        </div>
      </div>
    </article>
  );
}
