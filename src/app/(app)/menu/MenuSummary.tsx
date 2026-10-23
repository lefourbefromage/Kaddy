"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AISLE_BY_ID, type AisleArt } from "@/lib/aisles";
import { GROUPS, type GroupId } from "@/lib/foodGroups";
import styles from "./summary.module.css";

export type SummaryData = {
  dishes: number; // recipe slots (leftovers and simple meals excluded)
  groupCounts: Record<GroupId, number>;
  newRecipes: number;
  toClassify: number;
  different: number;
  leftovers: number;
  filled: number;
};

// Illustration that pops next to the chart for the focused group (design/menu-*.html): the
// picture of the matching aisle (data/aisles.json); pulses take the tin of Épicerie salée.
const popArt = (aisleId: string, className: string) => ({ ...AISLE_BY_ID.get(aisleId)!.illustration, className });
const POP: Record<GroupId, AisleArt & { className: string }> = {
  veg: popArt("fruits-legumes", "popVeg"),
  starch: popArt("pain-patisserie", "popStarch"),
  protein: popArt("viande-poisson", "popProtein"),
  dairy: popArt("laitier-oeufs-vegetal", "popVeg"),
  pulses: popArt("epicerie-salee", "popStarch"),
  fruit: popArt("fruits-legumes", "popVeg"),
};

function headline(d: SummaryData) {
  if (d.dishes === 0) return "Le bilan se remplit au fil des plats prévus.";
  const veg = d.groupCounts.veg / d.dishes;
  if (veg >= 0.6) return "Une semaine bien garnie en légumes.";
  if (veg < 0.3) return "Peu de légumes pour l’instant : une poêlée, une soupe ?";
  return "Une semaine variée.";
}

export function MenuSummary({ data }: { data: SummaryData }) {
  const [focus, setFocus] = useState<GroupId | null>(null);
  const present = GROUPS.filter((g) => data.groupCounts[g.id] > 0);
  const total = present.reduce((n, g) => n + data.groupCounts[g.id], 0);
  const focused = focus ? GROUPS.find((g) => g.id === focus) : null;
  const pop = focus ? POP[focus] : undefined;

  // Donut: one arc per group present, proportional to its count (a dish can count in several groups).
  const R = 80;
  const C = 2 * Math.PI * R;
  const gap = present.length > 1 ? 4 : 0;
  const lengths = present.map((g) => (data.groupCounts[g.id] / total) * C);
  const arcs = present.map((g, i) => ({
    g,
    dash: Math.max(lengths[i] - gap, 0.1),
    offset: lengths.slice(0, i).reduce((a, b) => a + b, 0),
  }));

  return (
    <section aria-labelledby="bilan-titre" className={styles.section}>
      <div className={styles.head}>
        <h2 id="bilan-titre" className={styles.title}>
          Bilan de la semaine
        </h2>
        <p className={styles.headline}>{headline(data)}</p>
      </div>

      <div className={styles.grid}>
        <figure className={`${styles.tile} ${styles.chartTile}`}>
          <figcaption className={styles.chartTitle}>Ce qu’il y a dans les assiettes</figcaption>
          <div className={styles.chartBody}>
          <div className={styles.chartArea} onMouseLeave={() => setFocus(null)}>
            {pop && (
              <Image
                key={focus}
                src={pop.src}
                alt=""
                width={pop.width}
                height={pop.height}
                className={`${styles.pop} ${styles[pop.className]}`}
              />
            )}
            <div className={styles.donut}>
              <svg viewBox="0 0 200 200" className={styles.donutSvg} role="group" aria-label="Groupes alimentaires">
                <circle cx="100" cy="100" r={R} className={styles.track} />
                <g transform="rotate(-90 100 100)">
                  {arcs.map(({ g, dash, offset: o }) => (
                    <circle
                      key={g.id}
                      cx="100"
                      cy="100"
                      r={R}
                      className={styles.arc}
                      style={{
                        stroke: g.color,
                        strokeDasharray: `${dash} ${C}`,
                        strokeDashoffset: -o,
                        strokeWidth: focus === g.id ? 40 : 34,
                        opacity: focus && focus !== g.id ? 0.35 : 1,
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`${g.label} : ${data.groupCounts[g.id]}`}
                      aria-pressed={focus === g.id}
                      onMouseEnter={() => setFocus(g.id)}
                      onFocus={() => setFocus(g.id)}
                      onBlur={() => setFocus(null)}
                      onClick={() => setFocus(focus === g.id ? null : g.id)}
                      onKeyDown={(e) => {
                        if (e.key !== "Enter" && e.key !== " ") return;
                        e.preventDefault();
                        setFocus(focus === g.id ? null : g.id);
                      }}
                    />
                  ))}
                </g>
              </svg>
              <div className={styles.donutCenter} aria-live="polite">
                <span key={focus ?? "all"} className={`kd-numeral ${styles.donutNumber}`}>
                  {focused ? data.groupCounts[focused.id] : data.dishes}
                </span>
                <span className={styles.donutLabel}>
                  {focused ? focused.plateLabel : data.dishes === 1 ? "plat cuisiné" : "plats cuisinés"}
                </span>
              </div>
            </div>
          </div>
          <p className={styles.chartHint} aria-hidden="true">
            Touche une couleur pour le détail
          </p>
          <ul className={styles.srOnly}>
            {present.map((g) => (
              <li key={g.id}>
                {g.label} : {data.groupCounts[g.id]} {g.plateLabel}
              </li>
            ))}
          </ul>
          </div>
        </figure>

        <div className={`${styles.tile} ${styles.stat}`}>
          <Image src="/illustrations/bilan-nouvelles-recettes.webp" alt="" width={219} height={216} className={styles.statArt} />
          <span className={styles.statLabel}>Nouvelles recettes</span>
          <span className={`kd-numeral ${styles.statNumber}`}>{data.newRecipes}</span>
        </div>

        <div className={`${styles.tile} ${styles.stat} ${styles.dashed}`}>
          <span className={`${styles.statLabel} ${styles.muted}`}>Ingrédients à classer</span>
          <span className={styles.statRow}>
            <span className={`kd-numeral ${styles.statNumber}`}>{data.toClassify}</span>
            {data.toClassify > 0 && (
              <Link href="/liste" className={styles.statLink}>
                Les classer
              </Link>
            )}
          </span>
        </div>

        <div className={`${styles.tile} ${styles.stat} ${styles.lavender}`}>
          <Image src="/illustrations/bilan-repas-differents.webp" alt="" width={270} height={256} className={`${styles.statArt} ${styles.flip}`} />
          <span className={styles.statLabel}>Repas différents</span>
          <span className={`kd-numeral ${styles.statNumber}`}>{data.different}</span>
        </div>

        <div className={`${styles.tile} ${styles.stat} ${styles.sun}`}>
          {/* The file names are swapped: this one shows the fridge (as in the mockup). */}
          <Image src="/illustrations/bilan-semaine-remplie.webp" alt="" width={200} height={190} className={styles.statArt} />
          <span className={styles.statLabel}>Restes</span>
          <span className={`kd-numeral ${styles.statNumber}`}>{data.leftovers}</span>
        </div>

        <div className={`${styles.tile} ${styles.filledTile} kd-on-dark`}>
          <Image src="/illustrations/bilan-restes-frigo.webp" alt="" width={279} height={230} className={styles.filledArt} />
          <span className={styles.statLabel}>Semaine remplie</span>
          <span className={styles.filledRow}>
            <span className={`kd-numeral ${styles.statNumber}`}>
              {data.filled}
              <span className={styles.outOf}>/14</span>
            </span>
            <span>repas</span>
          </span>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={14}
            aria-valuenow={data.filled}
            aria-label="Repas prévus"
            className={styles.progress}
          >
            <div className={styles.progressBar} style={{ width: `${(data.filled / 14) * 100}%` }} />
          </div>
        </div>
      </div>
    </section>
  );
}

export type Forgotten = { id: string; title: string; when: string };

export function ForgottenRecipes({
  items,
  onPlan,
}: {
  items: Forgotten[];
  onPlan: (id: string) => string;
}) {
  const [status, setStatus] = useState("");
  // Keep the section while the confirmation shows, even if the list just emptied.
  if (!items.length && !status) return null;
  return (
    <section aria-labelledby="longtemps-titre" className={styles.forgotten}>
      <div className={styles.forgottenMain}>
        <div className={styles.forgottenHead}>
          <div className={styles.head}>
            <h2 id="longtemps-titre" className={styles.forgottenTitle}>
              Pas cuisinées depuis longtemps
            </h2>
            <p className={styles.forgottenSub}>De quoi varier la semaine prochaine.</p>
          </div>
          <Image
            src="/illustrations/titre-recettes.webp"
            alt=""
            width={721}
            height={450}
            className={styles.forgottenArtMobile}
          />
        </div>
        <ul className={styles.forgottenList}>
          {items.map((r) => (
            <li key={r.id} className={styles.forgottenItem}>
              <span className={styles.forgottenText}>
                <span className={styles.forgottenName}>{r.title}</span>
                <span className={styles.forgottenWhen}>{r.when}</span>
              </span>
              <button
                type="button"
                className={styles.replan}
                aria-label={`Remettre ${r.title} au menu`}
                onClick={() => setStatus(`${r.title} ajoutée au menu : ${onPlan(r.id)}.`)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
        <p role="status" className={styles.forgottenStatus}>
          {status}
        </p>
      </div>
      <Image src="/illustrations/titre-recettes.webp" alt="" width={721} height={450} className={styles.forgottenArt} />
    </section>
  );
}
