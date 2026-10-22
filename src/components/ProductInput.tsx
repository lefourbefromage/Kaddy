"use client";

import { useId, useMemo, useState, type KeyboardEvent } from "react";
import { AISLE_BY_ID, aisleDot } from "@/lib/aisles";
import type { Catalog } from "@/lib/catalog";
import type { HouseholdIngredients } from "@/lib/ingredients";
import { searchProducts, type ProductSuggestion } from "@/lib/list";
import { fold } from "@/lib/normalize";
import styles from "./ProductInput.module.css";

export type PickedProduct = { name: string; key?: string; aisleId: string | null; typed: string };

/**
 * Field to add a product, with suggestions from the catalogue and the household's own
 * products (WAI-ARIA combobox). The last option creates the article as typed.
 */
export function ProductInput({
  label,
  placeholder,
  catalog,
  own,
  onPick,
  dashed = true,
  forRecipe = false,
  bare = false,
}: {
  label: string;
  placeholder: string;
  catalog: Catalog | null;
  own: HouseholdIngredients | null;
  onPick: (p: PickedProduct) => void;
  dashed?: boolean;
  /** Suggest food first (recipe ingredients). */
  forRecipe?: boolean;
  /** No frame of its own: the field sits in a card (Mon Kaddy). */
  bare?: boolean;
}) {
  const uid = useId();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);

  const options = useMemo(() => {
    const q = query.trim();
    if (!q) return [] as (ProductSuggestion | { create: string })[];
    const found: (ProductSuggestion | { create: string })[] = searchProducts(q, catalog, own, { forRecipe });
    if (!found.some((p) => "name" in p && fold(p.name) === fold(q))) found.push({ create: q });
    return found;
  }, [query, catalog, own, forRecipe]);

  const current = Math.min(active, Math.max(options.length - 1, 0));
  const expanded = open && options.length > 0;

  function pick(o: ProductSuggestion | { create: string }) {
    const typed = query.trim();
    if ("create" in o) onPick({ name: o.create, aisleId: null, typed });
    else onPick({ name: o.name, key: o.key, aisleId: o.aisleId, typed });
    setQuery("");
    setActive(0);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" && options.length) {
      e.preventDefault();
      setOpen(true);
      setActive((current + 1) % options.length);
    } else if (e.key === "ArrowUp" && options.length) {
      e.preventDefault();
      setActive((current - 1 + options.length) % options.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (options[current]) pick(options[current]);
    } else if (e.key === "Escape" && expanded) {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={`${styles.field} ${bare ? styles.bare : dashed ? styles.dashed : styles.solid}`}>
        <label htmlFor={`${uid}-input`} className={styles.srOnly}>
          {label}
        </label>
        <input
          id={`${uid}-input`}
          type="text"
          role="combobox"
          aria-expanded={expanded}
          aria-controls={`${uid}-list`}
          aria-autocomplete="list"
          aria-activedescendant={expanded ? `${uid}-opt-${current}` : undefined}
          autoComplete="off"
          placeholder={placeholder}
          className={styles.input}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
        />
        <button
          type="button"
          className={`${styles.add} kd-hit`}
          aria-label="Ajouter"
          disabled={!query.trim()}
          onClick={() => options[current] && pick(options[current])}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
      {expanded && (
        <ul id={`${uid}-list`} role="listbox" aria-label="Suggestions" className={styles.list}>
          {options.map((o, i) => (
            <li
              key={"create" in o ? "create" : o.key}
              id={`${uid}-opt-${i}`}
              role="option"
              aria-selected={i === current}
              className={`${styles.option} ${"create" in o ? styles.create : ""}`}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(o)}
            >
              {"create" in o ? (
                <>Créer l’article « {o.create} »</>
              ) : (
                <>
                  <span
                    className={styles.dot}
                    style={{ background: o.aisleId ? aisleDot(o.aisleId) : "transparent" }}
                    aria-hidden="true"
                  />
                  <span className={styles.name}>
                    <Highlight text={o.name} query={query} />
                    {fold(o.matched) !== fold(o.name) && <span className={styles.alias}> ({o.matched})</span>}
                  </span>
                  <span className={styles.aisle}>{o.aisleId ? AISLE_BY_ID.get(o.aisleId)?.label : "Rayon à choisir"}</span>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Bold on the part of the name that matches (accent-insensitive). */
function Highlight({ text, query }: { text: string; query: string }) {
  const i = fold(text).indexOf(fold(query.trim()));
  if (i < 0 || !query.trim()) return <>{text}</>;
  const end = i + query.trim().length;
  return (
    <>
      {text.slice(0, i)}
      <strong>{text.slice(i, end)}</strong>
      {text.slice(end)}
    </>
  );
}
