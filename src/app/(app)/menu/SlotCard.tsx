"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Modal } from "@/components/Modal";
import { areClose, fold, titleWords } from "@/lib/normalize";
import type { Recipe } from "@/lib/recipes";
import { slotLabel, type Slot, type SlotRef } from "@/lib/weeks";
import styles from "./menu.module.css";

export type Choice =
  | { kind: "recipe"; recipeId: string }
  | { kind: "create"; title: string }
  | { kind: "simple"; name: string }
  | { kind: "leftover"; recipeId: string; of: string };

type Option = { id: string; label: string; hint?: string; choice: Choice };

/** A dish earlier in the week that this slot can be the leftovers of. */
export type LeftoverSource = { recipeId: string; title: string; key: string; ref: SlotRef };

type Props = {
  slotRef: SlotRef;
  slot: Slot | undefined;
  recipesById: Map<string, Recipe>;
  recipes: Recipe[];
  editing: boolean;
  leftoverSources: LeftoverSource[];
  onEdit: () => void;
  onCancel: () => void;
  onChoose: (choice: Choice) => void;
  onClear: () => void;
  onOpenRecipe: (recipe: Recipe) => void;
};

export function SlotCard(props: Props) {
  const { slot, editing } = props;
  if (editing) return <SlotEditor {...props} />;
  if (!slot) return <EmptySlot {...props} />;
  return <FilledSlot {...props} slot={slot} />;
}

const mealLabel = (ref: SlotRef) => (ref.meal === "lunch" ? "Midi" : "Soir");

function EmptySlot({ slotRef, onEdit }: Props) {
  return (
    <button type="button" className={`${styles.slot} ${styles.slotEmpty}`} onClick={onEdit}>
      <span className="kd-label">{mealLabel(slotRef)}</span>
      <span className={styles.slotPlaceholder}>Quel plat ?</span>
      <span className={styles.srOnly}>, {slotLabel(slotRef)}, vide</span>
    </button>
  );
}

/* ---------- Editing: quick entry with suggestions (WAI-ARIA combobox) ---------- */

function SlotEditor({ slotRef, recipes, leftoverSources, onCancel, onChoose }: Props) {
  const uid = useId();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [pickingLeftover, setPickingLeftover] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const options = useMemo(() => {
    const q = query.trim();
    if (!q) return [] as Option[];
    const fq = fold(q);
    const words = titleWords(q);
    const matches = recipes
      .filter((r) => fold(r.title).includes(fq) || areClose(words, r.titleWords ?? titleWords(r.title)))
      .sort((a, b) => Number(fold(b.title).startsWith(fq)) - Number(fold(a.title).startsWith(fq)))
      .slice(0, 6)
      .map((r): Option => ({ id: r.id, label: r.title, choice: { kind: "recipe", recipeId: r.id } }));
    const exact = recipes.some((r) => fold(r.title) === fq);
    if (!exact) {
      matches.push(
        { id: "create", label: `Ajouter « ${q} »`, hint: "Nouveau repas, à détailler plus tard si besoin", choice: { kind: "create", title: q } },
        { id: "simple", label: `Repas simple « ${q} »`, hint: "Sans recette", choice: { kind: "simple", name: q } },
      );
    }
    return matches;
  }, [query, recipes]);

  const current = Math.min(active, Math.max(options.length - 1, 0));

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" && options.length) {
      e.preventDefault();
      setActive((current + 1) % options.length);
    } else if (e.key === "ArrowUp" && options.length) {
      e.preventDefault();
      setActive((current - 1 + options.length) % options.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (options[current]) onChoose(options[current].choice);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      onCancel();
    }
  }

  return (
    <div
      ref={boxRef}
      className={`${styles.slot} ${styles.slotEditing}`}
      onBlur={(e) => {
        // Leaving the slot (click elsewhere, Tab out) cancels the entry.
        if (!boxRef.current?.contains(e.relatedTarget as Node | null)) onCancel();
      }}
      // clicks inside the leftover dialog bubble here through the DOM: leave them alone
      onClick={(e) => {
        if (!(e.target as Element).closest("dialog")) inputRef.current?.focus();
      }}
    >
      <label htmlFor={`${uid}-input`} className={`kd-label ${styles.editingLabel}`}>
        {mealLabel(slotRef)}
        <span className={styles.srOnly}> du {slotLabel(slotRef)}</span>
      </label>
      <input
        ref={inputRef}
        id={`${uid}-input`}
        type="text"
        role="combobox"
        aria-expanded={options.length > 0}
        aria-controls={`${uid}-list`}
        aria-autocomplete="list"
        aria-activedescendant={options.length ? `${uid}-opt-${current}` : undefined}
        autoComplete="off"
        placeholder="Quel plat ?"
        className={styles.slotInput}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setPickingLeftover(false);
        }}
        onKeyDown={onKeyDown}
      />

      {options.length > 0 && (
        <ul id={`${uid}-list`} role="listbox" aria-label="Suggestions" className={styles.suggestions}>
          {options.map((o, i) => (
            <li
              key={o.id}
              id={`${uid}-opt-${i}`}
              role="option"
              aria-selected={i === current}
              className={styles.suggestion}
              // mousedown keeps the input focused, so the slot doesn't close before the click
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => onChoose(o.choice)}
            >
              <span className={styles.suggestionLabel}>{o.label}</span>
              {o.hint && <span className={styles.suggestionHint}>{o.hint}</span>}
            </li>
          ))}
        </ul>
      )}

      {!query.trim() && (
        <>
          <span className={styles.flexFill} />
          <button type="button" className={`${styles.resteButton} kd-hit`} onClick={() => setPickingLeftover(true)}>
            <RefreshIcon />
            Reste
          </button>
        </>
      )}

      {pickingLeftover && (
        <LeftoverDialog
          slotRef={slotRef}
          sources={leftoverSources}
          onClose={() => setPickingLeftover(false)}
          onChoose={onChoose}
        />
      )}
    </div>
  );
}

/** "Reste de quel plat ?": the dishes earlier in the week. Rendered inside the slot so focus stays "in" it. */
function LeftoverDialog({
  slotRef,
  sources,
  onClose,
  onChoose,
}: {
  slotRef: SlotRef;
  sources: LeftoverSource[];
  onClose: () => void;
  onChoose: (choice: Choice) => void;
}) {
  const uid = useId();
  return (
    <Modal labelledBy={`${uid}-title`} onClose={onClose} narrow>
      <div className={styles.leftoverHead}>
        <div className={styles.leftoverHeadText}>
          <span className="kd-label">{slotLabel(slotRef)}</span>
          <h2 id={`${uid}-title`} className={styles.leftoverTitle}>
            Reste de quel plat ?
          </h2>
        </div>
        <button type="button" aria-label="Fermer" className={styles.leftoverClose} onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
      {sources.length ? (
        <ul className={styles.leftoverList}>
          {sources.map((s) => (
            <li key={s.key}>
              <button
                type="button"
                className={styles.leftoverOption}
                onClick={() => onChoose({ kind: "leftover", recipeId: s.recipeId, of: s.key })}
              >
                <span className={styles.leftoverDish}>{s.title}</span>
                <span className={styles.leftoverWhen}>{slotLabel(s.ref)}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.leftoverNone}>Aucun plat plus tôt dans la semaine.</p>
      )}
    </Modal>
  );
}

/* ---------- Filled ---------- */

function FilledSlot({
  slotRef,
  slot,
  recipesById,
  onEdit,
  onClear,
  onOpenRecipe,
}: Props & { slot: Slot }) {
  const recipe = slot.kind === "simple" ? undefined : recipesById.get(slot.recipeId);
  const name = slot.kind === "simple" ? slot.name : (recipe?.title ?? "Recette supprimée");
  const sub = slot.kind === "simple" ? "Repas simple" : null;

  return (
    <div className={`${styles.slot} ${styles.slotFilled} ${slot.kind === "leftover" ? styles.slotLeftover : ""}`}>
      <div className={styles.slotTop}>
        <span className="kd-label">{mealLabel(slotRef)}</span>
        {slot.kind === "leftover" && (
          <span className={styles.restePill}>
            <RefreshIcon size={12} />
            Reste
          </span>
        )}
      </div>
      <span className={styles.dishRow}>
        <span className={styles.dish}>{name}</span>
      </span>
      {sub && <span className={styles.slotSub}>{sub}</span>}
      <div className={styles.slotActions}>
        {slot.kind === "recipe" && recipe && (
          <button
            type="button"
            className={`${styles.eye} kd-hit`}
            aria-label={`Voir la recette ${recipe.title}`}
            title="Voir la recette"
            onClick={() => onOpenRecipe(recipe)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 12s3.5-6.5 9-6.5 9 6.5 9 6.5-3.5 6.5-9 6.5S3 12 3 12z" />
              <circle cx="12" cy="12" r="2.8" />
            </svg>
          </button>
        )}
        <SlotMenu label={`Actions du repas ${slotLabel(slotRef)}`} onChange={onEdit} onClear={onClear} />
      </div>
    </div>
  );
}

/** The "…" menu of a filled slot. */
function SlotMenu({ label, onChange, onClear }: { label: string; onChange: () => void; onClear: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent) {
        if (e.key !== "Escape") return;
        setOpen(false);
        buttonRef.current?.focus();
      } else if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div ref={ref} className={styles.menuWrap}>
      <button
        ref={buttonRef}
        type="button"
        className={`${styles.more} kd-hit`}
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
      </button>
      {open && (
        <div className={styles.menu}>
          <button
            type="button"
            className={styles.menuItem}
            onClick={() => {
              setOpen(false);
              onChange();
            }}
          >
            Changer de plat
          </button>
          <button
            type="button"
            className={styles.menuItem}
            onClick={() => {
              setOpen(false);
              onClear();
            }}
          >
            Retirer du menu
          </button>
        </div>
      )}
    </div>
  );
}

function RefreshIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={styles.refresh}>
      <path d="M20 11a8 8 0 0 0-14.3-4.9L4 8" />
      <path d="M4 4v4h4" />
      <path d="M4 13a8 8 0 0 0 14.3 4.9L20 16" />
      <path d="M20 20v-4h-4" />
    </svg>
  );
}

