"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useHousehold, useHouseholdId } from "@/components/HouseholdProvider";
import { useKaddy } from "@/components/KaddyProvider";
import { PageHeader, TITLE_ILLUSTRATIONS } from "@/components/PageHeader";
import { AISLES, AISLE_BY_ID, aisleColor, fitArt, fullOrder } from "@/lib/aisles";
import { setAisleOrder } from "@/lib/household";
import styles from "./rayons.module.css";

const DEFAULT_ORDER = AISLES.map((a) => a.id);
const MOVED_MS = 800;
// Near the top or bottom of the screen, a drag scrolls the page (the list is taller than a phone).
const EDGE = 96;

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

export function AisleOrderScreen() {
  const householdId = useHouseholdId();
  const state = useHousehold();
  const { aisles } = useKaddy();
  const saved = fullOrder(state.status === "signedIn" ? (state.household?.aisleOrder ?? []) : []);
  const counts = new Map((aisles ?? []).map((a) => [a.id, a.items.length]));

  // While dragging, the order lives here; it is written once, on release.
  const [drag, setDrag] = useState<{ id: string; order: string[] } | null>(null);
  const [moved, setMoved] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");
  const listRef = useRef<HTMLOListElement>(null);
  const refocus = useRef<{ id: string; to: number; dir: "up" | "down" } | null>(null);
  const movedTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => clearTimeout(movedTimer.current), []);

  const order = drag?.order ?? saved;
  const isDefault = saved.join() === DEFAULT_ORDER.join();

  function save(next: string[], id: string) {
    setAisleOrder(householdId, next);
    setMoved(id);
    setAnnounce(`${AISLE_BY_ID.get(id)?.label}, position ${next.indexOf(id) + 1} sur ${next.length}`);
    clearTimeout(movedTimer.current);
    movedTimer.current = window.setTimeout(() => setMoved(null), MOVED_MS);
  }

  function move(from: number, to: number, dir: "up" | "down") {
    if (to < 0 || to >= saved.length) return;
    const next = [...saved];
    const [id] = next.splice(from, 1);
    next.splice(to, 0, id);
    save(next, id);
    refocus.current = { id, to, dir };
  }

  // Once the row has moved in the DOM, keep the focus on its arrow (the other one at either end).
  useEffect(() => {
    const r = refocus.current;
    const row = r && listRef.current?.children[r.to];
    if (!r || row?.getAttribute("data-aisle") !== r.id) return;
    refocus.current = null;
    const wanted = row.querySelector<HTMLButtonElement>(`[data-dir="${r.dir}"]`);
    const other = row.querySelector<HTMLButtonElement>(`[data-dir="${r.dir === "up" ? "down" : "up"}"]`);
    (wanted && !wanted.disabled ? wanted : other)?.focus();
  });

  /* ---------- Pointer drag (mouse, finger, pen) on the handle ---------- */

  function onDragStart(e: PointerEvent<HTMLSpanElement>, id: string) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    setDrag({ id, order: saved });
  }

  // The rest of the gesture is followed on the window, not with pointer capture on the handle:
  // the row moves in the DOM as it is reordered, which drops the capture.
  const latest = useRef({ saved, save });
  useEffect(() => {
    latest.current = { saved, save };
  });
  useEffect(() => {
    if (!drag) return;
    const move = (e: globalThis.PointerEvent) => {
      const list = listRef.current;
      if (!list) return;
      if (e.clientY < EDGE) window.scrollBy(0, -12);
      else if (e.clientY > window.innerHeight - EDGE) window.scrollBy(0, 12);
      // New place = number of other rows whose middle is above the pointer.
      let to = 0;
      [...list.children].forEach((row, i) => {
        if (drag.order[i] === drag.id) return;
        const r = row.getBoundingClientRect();
        if (e.clientY > r.top + r.height / 2) to++;
      });
      if (drag.order.indexOf(drag.id) === to) return;
      const next = drag.order.filter((id) => id !== drag.id);
      next.splice(to, 0, drag.id);
      setDrag({ ...drag, order: next });
    };
    const drop = () => {
      const { saved, save } = latest.current;
      if (drag.order.join() !== saved.join()) save(drag.order, drag.id);
      setDrag(null);
    };
    // An interrupted gesture (call, notification, the browser taking over) drops the drag.
    const cancel = () => setDrag(null);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", drop);
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("blur", cancel);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", drop);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("blur", cancel);
    };
  }, [drag]);

  return (
    <div className={styles.page}>
      <Link href="/kaddy" className={styles.back}>
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" />
        </svg>
        Retour à Mon Kaddy
      </Link>

      <PageHeader
        title="Ordre des rayons"
        illustration={TITLE_ILLUSTRATIONS.kaddy}
      />
      <p className={styles.intro}>
        Range les rayons dans l’ordre où tu les croises au magasin. Mon Kaddy suivra cet ordre.
        <span className={styles.desktopOnly}> Glisse un rayon ou utilise les flèches.</span>
      </p>

      <ol ref={listRef} aria-label="Ordre des rayons" className={styles.list}>
        {order.map((id, i) => {
          const aisle = AISLE_BY_ID.get(id)!;
          const art = fitArt(aisle.illustration, 40, 38);
          const n = counts.get(id) ?? 0;
          return (
            <li
              key={id}
              data-aisle={id}
              className={cx(styles.row, drag?.id === id && styles.dragging, moved === id && !drag && styles.moved)}
            >
              <span
                className={styles.handle}
                aria-hidden="true"
                title="Glisser pour déplacer"
                onPointerDown={(e) => onDragStart(e, id)}
              >
                <svg width="16" height="20" viewBox="0 0 16 20">
                  <circle cx="5" cy="4" r="1.7" />
                  <circle cx="11" cy="4" r="1.7" />
                  <circle cx="5" cy="10" r="1.7" />
                  <circle cx="11" cy="10" r="1.7" />
                  <circle cx="5" cy="16" r="1.7" />
                  <circle cx="11" cy="16" r="1.7" />
                </svg>
              </span>
              <span className={styles.pos} aria-hidden="true">
                {i + 1}
              </span>
              <span className={styles.art} style={{ background: aisleColor(id) }} aria-hidden="true">
                <Image src={art.src} alt="" width={art.width} height={art.height} className={styles.artImg} />
              </span>
              <span className={styles.text}>
                <span className={styles.name}>{aisle.label}</span>
                <span className={styles.count}>
                  {n === 0 ? "Rien" : `${n} article${n > 1 ? "s" : ""}`}
                  <span className={styles.desktopOnly}> cette semaine</span>
                </span>
              </span>
              <button
                type="button"
                data-dir="up"
                className={styles.arrow}
                disabled={i === 0 || !!drag}
                aria-label={`Monter ${aisle.label}`}
                onClick={() => move(i, i - 1, "up")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 15l6-6 6 6" />
                </svg>
              </button>
              <button
                type="button"
                data-dir="down"
                className={styles.arrow}
                disabled={i === order.length - 1 || !!drag}
                aria-label={`Descendre ${aisle.label}`}
                onClick={() => move(i, i + 1, "down")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
            </li>
          );
        })}
      </ol>

      <div role="status" aria-live="polite" className={styles.srOnly}>
        {announce}
      </div>

      <div className={styles.foot}>
        <span className={styles.saved}>
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7" />
          </svg>
          Enregistré pour tout le foyer
        </span>
        <button
          type="button"
          className={styles.reset}
          disabled={isDefault}
          onClick={() => {
            setAisleOrder(householdId, DEFAULT_ORDER);
            setAnnounce("Ordre par défaut rétabli");
          }}
        >
          Ordre par défaut
        </button>
      </div>
    </div>
  );
}
