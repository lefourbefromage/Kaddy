"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { AISLE_BY_ID, aisleDot } from "@/lib/aisles";
import type { Catalog } from "@/lib/catalog";
import type { HouseholdIngredients } from "@/lib/ingredients";
import { searchProducts } from "@/lib/list";
import { fold } from "@/lib/normalize";
import { useDropdownSpace } from "@/lib/useDropdownSpace";
import { Highlight } from "@/components/ProductInput";
import listStyles from "@/components/ProductInput.module.css";
import styles from "./recipeDialogs.module.css";

/**
 * Name of a recipe ingredient, with suggestions from the catalogue and the household's own
 * products (WAI-ARIA combobox, same list as ProductInput). Whatever is typed is kept as is:
 * a suggestion only completes the name.
 */
export function IngredientNameInput({
  id,
  label,
  value,
  catalog,
  own,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  catalog: Catalog | null;
  own: HouseholdIngredients | null;
  onChange: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const options = useMemo(() => {
    const found = searchProducts(value, catalog, own, { forRecipe: true });
    // Already the product's exact name: nothing left to suggest.
    return found.length === 1 && fold(found[0].name) === fold(value.trim()) ? [] : found;
  }, [value, catalog, own]);

  const expanded = open && options.length > 0;
  const current = active < options.length ? active : -1;

  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  useDropdownSpace(wrapRef, listRef, expanded);
  useEffect(() => {
    if (expanded && current >= 0) document.getElementById(`${id}-opt-${current}`)?.scrollIntoView({ block: "nearest" });
  }, [expanded, current, id]);

  function pick(name: string) {
    onChange(name);
    setOpen(false);
    setActive(-1);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" && options.length) {
      e.preventDefault();
      setOpen(true);
      setActive((current + 1) % options.length);
    } else if (e.key === "ArrowUp" && options.length) {
      e.preventDefault();
      setOpen(true);
      setActive(current <= 0 ? options.length - 1 : current - 1);
    } else if (e.key === "Enter" && expanded && current >= 0) {
      // Only when an option is chosen: otherwise Enter submits the form as usual.
      e.preventDefault();
      pick(options[current].name);
    } else if (e.key === "Escape" && expanded) {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    }
  }

  return (
    <div ref={wrapRef} className={listStyles.wrap}>
      <input
        id={id}
        type="text"
        role="combobox"
        aria-label={label}
        aria-expanded={expanded}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-activedescendant={expanded && current >= 0 ? `${id}-opt-${current}` : undefined}
        autoComplete="off"
        placeholder="Ingrédient"
        value={value}
        className={styles.rowName}
        onChange={(e) => {
          onChange(e.target.value);
          setActive(-1);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
        onBlur={() => setOpen(false)}
      />
      {expanded && (
        <ul
          ref={listRef}
          id={`${id}-list`}
          role="listbox"
          aria-label="Suggestions"
          className={`${listStyles.list} ${styles.suggestions}`}
        >
          {options.map((o, i) => (
            <li
              key={o.key}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={i === current}
              className={listStyles.option}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(o.name)}
            >
              <span
                className={listStyles.dot}
                style={{ background: o.aisleId ? aisleDot(o.aisleId) : "transparent" }}
                aria-hidden="true"
              />
              <span className={listStyles.name}>
                <Highlight text={o.name} query={value} />
                {fold(o.matched) !== fold(o.name) && <span className={listStyles.alias}> ({o.matched})</span>}
              </span>
              {o.aisleId && <span className={listStyles.aisle}>{AISLE_BY_ID.get(o.aisleId)?.label}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
