"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AISLES, aisleColor, aisleDot } from "@/lib/aisles";
import { useDropdownSpace } from "@/lib/useDropdownSpace";
import styles from "./AislePicker.module.css";

/** "Choisir un rayon": a chip that opens the list of aisles. */
export function AislePicker({ name, onPick }: { name: string; onPick: (aisleId: string) => void }) {
  const uid = useId();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  useDropdownSpace(ref, menuRef, open);

  useEffect(() => {
    if (!open) return;
    ref.current?.querySelector<HTMLButtonElement>("[data-aisle]")?.focus();
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
    <div ref={ref} className={styles.wrap}>
      <button
        ref={buttonRef}
        type="button"
        className={`${styles.chip} kd-hit`}
        aria-expanded={open}
        aria-controls={`${uid}-menu`}
        aria-label={`Choisir un rayon pour ${name}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={styles.bang} aria-hidden="true">
          !
        </span>
        Choisir un rayon
      </button>
      {open && (
        <div ref={menuRef} id={`${uid}-menu`} role="group" aria-label={`Rayon de ${name}`} className={styles.menu}>
          {AISLES.map((a) => (
            <button
              key={a.id}
              type="button"
              data-aisle={a.id}
              className={styles.item}
              onClick={() => {
                setOpen(false);
                onPick(a.id);
              }}
            >
              <span className={styles.swatch} style={{ background: aisleColor(a.id) }} aria-hidden="true">
                <span style={{ background: aisleDot(a.id) }} />
              </span>
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
