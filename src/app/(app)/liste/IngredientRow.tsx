"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { UNITS, parseQty, unitLabel, type Unit } from "@/lib/recipes";
import styles from "./liste.module.css";

const qtyText = (n: number | null | undefined) => (n == null ? "" : String(n).replace(".", ","));

/**
 * One editable line of the list: name (+ aisle line), quantity, unit, remove.
 * Just added (`onNext`): the quantity takes the focus, Enter moves on to the unit, and Tab from
 * the unit goes back to the add field instead of landing on the remove cross.
 */
export function IngredientRow({
  name,
  sub,
  qty,
  unit,
  modified = false,
  modifiedHint,
  onQty,
  onUnit,
  onRemove,
  onNext,
}: {
  name: string;
  sub?: ReactNode;
  qty: number | null;
  unit: Unit | null;
  modified?: boolean;
  modifiedHint?: string;
  onQty: (qty: number | null) => void;
  onUnit: (unit: Unit | null) => void;
  onRemove: () => void;
  onNext?: () => void;
}) {
  const qtyRef = useRef<HTMLInputElement>(null);
  const unitRef = useRef<HTMLSelectElement>(null);
  const entry = !!onNext;
  useEffect(() => {
    if (entry) qtyRef.current?.focus();
  }, [entry]);

  // Local text while typing; written on blur / Enter (not on every keystroke).
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft == null) return;
    const next = parseQty(draft);
    setDraft(null);
    if (next !== qty) onQty(next);
  };

  return (
    <div className={styles.row}>
      <div className={styles.rowName}>
        <span className={styles.rowLabel}>{name}</span>
        {sub}
      </div>
      <input
        ref={qtyRef}
        type="text"
        inputMode="decimal"
        enterKeyHint="next"
        aria-label={`Quantité de ${name}${modified && modifiedHint ? ` (${modifiedHint})` : ""}`}
        title={modified ? modifiedHint : undefined}
        placeholder="—"
        className={`${styles.qty} ${modified ? styles.qtyModified : ""}`}
        value={draft ?? qtyText(qty)}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
            const unit = unitRef.current;
            unit?.focus();
            try {
              unit?.showPicker();
            } catch {
              // No picker API (or not allowed here): the focus alone is enough.
            }
          }
          if (e.key === "Escape") setDraft(null);
        }}
      />
      <select
        ref={unitRef}
        aria-label={`Unité de ${name}`}
        className={styles.unit}
        value={unit ?? ""}
        onChange={(e) => onUnit((e.target.value || null) as Unit | null)}
        onKeyDown={(e) => {
          if (onNext && e.key === "Tab" && !e.shiftKey) {
            e.preventDefault();
            onNext();
          }
        }}
      >
        <option value="">—</option>
        {UNITS.map((u) => (
          <option key={u} value={u}>
            {unitLabel(u, qty)}
          </option>
        ))}
      </select>
      <button type="button" className={`${styles.remove} kd-hit`} aria-label={`Retirer ${name}`} onClick={onRemove}>
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  );
}
