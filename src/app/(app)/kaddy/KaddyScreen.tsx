"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Columns } from "@/components/Columns";
import { useHouseholdId } from "@/components/HouseholdProvider";
import { useKaddy } from "@/components/KaddyProvider";
import { PageHeader, TITLE_ILLUSTRATIONS } from "@/components/PageHeader";
import { ProductInput } from "@/components/ProductInput";
import { aisleColor, aisleDot, fitArt } from "@/lib/aisles";
import { clearChecks, setCheck, sourceLine, type KaddyAisle, type KaddyItem } from "@/lib/kaddy";
import { addPickedExtra } from "@/lib/list";
import { formatQty } from "@/lib/recipes";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { weekTitle } from "@/lib/weeks";
import styles from "./kaddy.module.css";

// The row plays its tick, then slides out (kaddy.module.css .leaving): 220ms + 260ms.
const LEAVE_MS = 480;
const BACK_MS = 400;
const UNDO_MS = 6000;

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

export function KaddyScreen() {
  const householdId = useHouseholdId();
  const { weekId, aisles, checked, total, done, catalog, own } = useKaddy();
  const twoColumns = useMediaQuery("(min-width: 1280px)");

  // Rows animating out of (leaving) or back into (back) the list to pick.
  const [leaving, setLeaving] = useState<Set<string>>(new Set());
  const [back, setBack] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<Set<string>>(new Set());
  // Aisles ticked from this screen: only they play the counter and "terminé" animations.
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [undo, setUndo] = useState<string[] | null>(null);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));
  const without = (set: Set<string>, key: string) => {
    const next = new Set(set);
    next.delete(key);
    return next;
  };

  function toggle(aisleId: string, item: KaddyItem) {
    const key = item.itemKey;
    if (leaving.has(key)) return;
    setTouched((t) => new Set(t).add(aisleId));
    setUndo(null);
    if (!checked.has(key)) {
      setLeaving((l) => new Set(l).add(key));
      setCheck(householdId, weekId, key, true);
      later(LEAVE_MS, () => setLeaving((l) => without(l, key)));
    } else {
      setCheck(householdId, weekId, key, false);
      setBack((b) => new Set(b).add(key));
      later(BACK_MS, () => setBack((b) => without(b, key)));
    }
  }

  function resetAll() {
    const keys = [...checked];
    clearChecks(householdId, weekId, keys);
    setTouched(new Set());
    setLeaving(new Set());
    setUndo(keys);
    later(UNDO_MS, () => setUndo((u) => (u === keys ? null : u)));
  }

  function restore() {
    if (!undo) return;
    for (const key of undo) setCheck(householdId, weekId, key, true);
    setUndo(null);
  }

  const left = total - done;
  const allDone = total > 0 && left === 0;
  const anyTouched = touched.size > 0;
  const leftLabel = undo
    ? "Tout est décoché."
    : allDone
      ? "Tout est dans le caddie !"
      : left === 1
        ? "Encore 1 article."
        : `Encore ${left} articles.`;

  return (
    <>
      <PageHeader
        title="Mon Kaddy"
        subtitle={
          <>
            {weekTitle(weekId)}
            <span className={styles.byAisle}> · rangé par rayon</span>
          </>
        }
        illustration={TITLE_ILLUSTRATIONS.kaddy}
        illustrationClassName={anyTouched && allDone ? styles.roll : undefined}
      />

      {aisles && (
        <div className={styles.layout}>
          <aside className={styles.aside}>
            {total > 0 && (
              <section aria-label="Progression des courses" className={styles.progress}>
                <p className={styles.score}>
                  <span key={done} className={cx("kd-numeral", styles.done, anyTouched && styles.bump)}>
                    {done}
                  </span>
                  <span className={styles.of}>sur {total} articles</span>
                </p>
                <div
                  role="progressbar"
                  aria-label="Articles pris"
                  aria-valuemin={0}
                  aria-valuemax={total}
                  aria-valuenow={done}
                  className={styles.track}
                >
                  <div className={styles.bar} style={{ width: `${(done / total) * 100}%` }} />
                </div>
                <div className={styles.progressFoot}>
                  <span aria-live="polite">{leftLabel}</span>
                  {undo ? (
                    <button type="button" className={`${styles.secondary} kd-hit`} onClick={restore}>
                      Rétablir
                    </button>
                  ) : (
                    <button type="button" className={`${styles.secondary} kd-hit`} disabled={done === 0} onClick={resetAll}>
                      Tout décocher
                    </button>
                  )}
                </div>
              </section>
            )}

            <div className={styles.addCard}>
              <ProductInput
                label="Ajouter un produit hors menu"
                placeholder="Ajouter un produit…"
                catalog={catalog}
                own={own}
                bare
                onPick={(p) => addPickedExtra(householdId, weekId, p, own, catalog)}
              />
            </div>

            {aisles.length > 0 && (
              <nav aria-label="Rayons" className={styles.aisleNav}>
                <span className={styles.aisleNavHead}>
                  <span className={styles.aisleNavTitle}>Rayons</span>
                  <Link href="/reglages/rayons" className={styles.orderLink}>
                    Modifier l’ordre
                  </Link>
                </span>
                {aisles.map((a) => {
                  const n = a.items.filter((i) => checked.has(i.itemKey)).length;
                  const complete = n === a.items.length;
                  return (
                    <a key={a.id} href={`#rayon-${a.id}`} className={cx(styles.aisleLink, complete && styles.aisleLinkDone)}>
                      <span className={styles.dot} style={{ background: aisleDot(a.id) }} aria-hidden="true" />
                      <span className={styles.aisleLinkName}>{a.label}</span>
                      <span className={styles.aisleLinkCount}>
                        {n}/{a.items.length}
                      </span>
                    </a>
                  );
                })}
                <Link href="/reglages/rayons" className={styles.orderChip}>
                  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3" />
                  </svg>
                  Ordre
                </Link>
              </nav>
            )}
          </aside>

          <div className={styles.aisles}>
            {total === 0 ? (
              <p className={styles.empty}>
                Rien à acheter cette semaine pour l’instant. <Link href="/menu">Remplis le menu</Link> ou ajoute un
                produit hors menu.
              </p>
            ) : (
              <Columns count={twoColumns ? 2 : 1}>
                {aisles.map((a) => (
                  <AisleSection
                    key={a.id}
                    aisle={a}
                    checked={checked}
                    leaving={leaving}
                    back={back}
                    open={open.has(a.id)}
                    touched={touched.has(a.id)}
                    onToggle={(item) => toggle(a.id, item)}
                    onOpen={() =>
                      setOpen((o) => (o.has(a.id) ? without(o, a.id) : new Set(o).add(a.id)))
                    }
                  />
                ))}
              </Columns>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function AisleSection({
  aisle,
  checked,
  leaving,
  back,
  open,
  touched,
  onToggle,
  onOpen,
}: {
  aisle: KaddyAisle;
  checked: Set<string>;
  leaving: Set<string>;
  back: Set<string>;
  open: boolean;
  touched: boolean;
  onToggle: (item: KaddyItem) => void;
  onOpen: () => void;
}) {
  const todo = aisle.items.filter((i) => !checked.has(i.itemKey) || leaving.has(i.itemKey));
  const inCart = aisle.items.filter((i) => checked.has(i.itemKey) && !leaving.has(i.itemKey));
  const n = aisle.items.filter((i) => checked.has(i.itemKey)).length;
  const complete = n === aisle.items.length;
  const art = aisle.illustration && fitArt(aisle.illustration, 64, 56);
  const titleId = `rayon-${aisle.id}-titre`;

  return (
    <section id={`rayon-${aisle.id}`} aria-labelledby={titleId} className={styles.aisle}>
      <div className={styles.aisleHead} style={{ background: aisleColor(aisle.id) }}>
        {art && (
          <span className={styles.aisleArt}>
            <Image
              src={art.src}
              alt=""
              width={art.width}
              height={art.height}
              className={cx(styles.aisleImg, touched && complete && styles.hop)}
            />
          </span>
        )}
        <div className={styles.aisleText}>
          <h2 id={titleId} className={styles.aisleTitle}>
            {aisle.label}
          </h2>
          {aisle.unclassified && (
            <span className={styles.aisleHint}>
              Rayon à choisir dans <Link href="/liste">Liste de courses</Link>
            </span>
          )}
        </div>
        <span key={n} className={cx(styles.aisleCount, touched && styles.bump)}>
          {n}/{aisle.items.length}
        </span>
      </div>

      {todo.map((item) => (
        <Row
          key={item.itemKey}
          item={item}
          ticked={checked.has(item.itemKey)}
          className={cx(leaving.has(item.itemKey) && styles.leaving, back.has(item.itemKey) && styles.back)}
          onToggle={() => onToggle(item)}
        />
      ))}

      {todo.length === 0 && (
        <div className={cx(styles.aisleDone, touched && styles.appear)}>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7" />
          </svg>
          Rayon terminé
        </div>
      )}

      {inCart.length > 0 && (
        <>
          <button type="button" aria-expanded={open} className={styles.cartToggle} onClick={onOpen}>
            <Image src="/illustrations/icone-caddie.webp" alt="" width={93} height={64} className={styles.cartIcon} />
            <span className={styles.cartLabel}>{inCart.length} déjà dans le caddie</span>
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className={styles.chevron}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {open &&
            inCart.map((item) => (
              <Row key={item.itemKey} item={item} ticked inCart onToggle={() => onToggle(item)} />
            ))}
        </>
      )}
    </section>
  );
}

function Row({
  item,
  ticked,
  inCart = false,
  className,
  onToggle,
}: {
  item: KaddyItem;
  ticked: boolean;
  inCart?: boolean;
  className?: string;
  onToggle: () => void;
}) {
  const qty = formatQty(item.qty, item.unit);
  const src = sourceLine(item);
  return (
    <label className={cx(styles.row, inCart && styles.rowInCart, className)}>
      <span className={styles.box}>
        <input
          type="checkbox"
          className={styles.check}
          checked={ticked}
          onChange={onToggle}
          aria-label={qty ? `${item.name}, ${qty}` : item.name}
        />
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className={styles.tick}>
          <path d="M5 12.5l4.5 4.5L19 7" />
        </svg>
      </span>
      <span className={styles.rowText}>
        <span className={styles.name}>{item.name}</span>
        {src && !inCart && <span className={styles.src}>{src}</span>}
      </span>
      {qty && <span className={styles.qty}>{qty}</span>}
    </label>
  );
}
