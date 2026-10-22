"use client";

import { useId, useMemo, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { Modal } from "@/components/Modal";
import type { Catalog } from "@/lib/catalog";
import { TODO_ART, recipeArt } from "@/lib/recipeArt";
import {
  UNITS,
  createRecipe,
  deleteRecipe,
  findDuplicate,
  parseQty,
  safeUrl,
  sourceKind,
  updateRecipe,
  type Recipe,
  type Unit,
} from "@/lib/recipes";
import { keyOf } from "@/lib/normalize";
import styles from "./recipeDialogs.module.css";

export type FormMode = "new" | "edit" | "todo";

type Row = { id: number; name: string; qty: string; unit: Unit | null };
type Step = { id: number; text: string };

const LABELS: Record<FormMode, { title: string; save: string }> = {
  new: { title: "Nouvelle recette", save: "Enregistrer" },
  edit: { title: "Modifier la recette", save: "Enregistrer" },
  todo: { title: "Compléter la recette", save: "Enregistrer comme complète" },
};

// Local keys for the editable rows (React keys only, never stored).
let rowSeq = 0;
const newId = () => ++rowSeq;

// Focus a field once React has rendered it (a row just added: the click's update is flushed by then).
const focusSoon = (id: string) => setTimeout(() => document.getElementById(id)?.focus(), 0);

const qtyText = (n: number | null) => (n == null ? "" : String(n).replace(".", ","));

export function RecipeForm({
  householdId,
  mode,
  recipe,
  recipes,
  catalog,
  onCancel,
  onSaved,
  onDeleted,
}: {
  householdId: string;
  mode: FormMode;
  recipe: Recipe | null;
  recipes: Recipe[];
  catalog: Catalog | null;
  onCancel: () => void;
  onSaved: (id: string) => void;
  onDeleted: () => void;
}) {
  const uid = useId();

  const [title, setTitle] = useState(recipe?.title ?? "");
  const [url, setUrl] = useState(recipe?.sourceUrl ?? "");
  const [rows, setRows] = useState<Row[]>(() => {
    const existing = recipe?.ingredients.map((i) => ({ id: newId(), name: i.name, qty: qtyText(i.qty), unit: i.unit }));
    return existing?.length ? existing : [{ id: newId(), name: "", qty: "", unit: null }];
  });
  const [steps, setSteps] = useState<Step[]>(() => {
    const existing = recipe?.steps.map((text) => ({ id: newId(), text }));
    return existing?.length ? existing : [{ id: newId(), text: "" }];
  });
  const [dismissed, setDismissed] = useState<string[]>(recipe?.dismissedDuplicates ?? []);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  // Duplicate check: only while creating (PRODUCT.md), never blocking.
  const duplicate = useMemo(
    () => (mode !== "edit" && title.trim() ? findDuplicate(title, recipes, recipe?.id ?? null, dismissed) : null),
    [mode, title, recipes, recipe, dismissed],
  );

  const cleanUrl = safeUrl(url);
  const kind = sourceKind(cleanUrl);
  const filledRows = rows.filter((r) => r.name.trim());
  const art = filledRows.length
    ? recipeArt({ id: recipe?.id ?? "nouvelle", ingredients: filledRows.map((r) => ({ name: r.name, key: keyOf(r.name), qty: null, unit: null })) }, catalog)
    : TODO_ART;

  const patchRow = (id: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Donne un nom à la recette.");
      titleRef.current?.focus();
      return;
    }
    if (url.trim() && !cleanUrl) {
      setError("Ce lien ne semble pas valide. Colle l’adresse complète, ou laisse le champ vide.");
      return;
    }
    setBusy(true);
    setError(null);
    const input = {
      title,
      sourceUrl: cleanUrl,
      ingredients: rows.map((r) => ({ name: r.name, qty: parseQty(r.qty), unit: r.unit })),
      steps: steps.map((s) => s.text),
      dismissedDuplicates: dismissed,
    };
    try {
      if (recipe) {
        await updateRecipe(householdId, recipe.id, input);
        onSaved(recipe.id);
      } else {
        onSaved(await createRecipe(householdId, input));
      }
    } catch {
      setBusy(false);
      setError("L’enregistrement n’a pas abouti. Vérifie ta connexion et réessaie.");
    }
  }

  const label = LABELS[mode];

  const deleteControl =
    mode === "edit" && recipe ? (
      confirming ? (
        <span className={styles.confirm} role="group" aria-label="Confirmer la suppression">
          <button
            type="button"
            className={styles.danger}
            onClick={() => {
              deleteRecipe(householdId, recipe.id);
              onDeleted();
            }}
          >
            Oui, supprimer
          </button>
          <button type="button" className={styles.ghost} onClick={() => setConfirming(false)}>
            Garder
          </button>
        </span>
      ) : (
        <button type="button" className={styles.ghostDanger} onClick={() => setConfirming(true)}>
          Supprimer la recette
        </button>
      )
    ) : null;

  return (
    <Modal labelledBy={`${uid}-label`} onClose={onCancel} closeOnVeil={false} as="form" onSubmit={submit} wide>
      <div className={styles.editHead} style={{ background: art.background }}>
        <button type="button" aria-label="Fermer sans enregistrer" className={styles.close} onClick={onCancel}>
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <Image src={art.src} alt="" width={art.width} height={art.height} sizes="136px" className={styles.editImage} />
        <div className={styles.headText}>
          <span id={`${uid}-label`} className={styles.formLabel}>
            {label.title}
          </span>
          <label htmlFor={`${uid}-title`} className={styles.srOnly}>
            Nom de la recette
          </label>
          <input
            ref={titleRef}
            id={`${uid}-title`}
            type="text"
            className={styles.titleInput}
            placeholder="Nom de la recette"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setError(null);
            }}
            aria-invalid={error === "Donne un nom à la recette." || undefined}
            aria-describedby={`${uid}-dup`}
            autoComplete="off"
            // New or to-complete recipe: start typing the name straight away.
            data-autofocus={mode !== "edit" || undefined}
          />
          <div id={`${uid}-dup`} role="status" className={styles.dupSlot}>
            {duplicate && (
              <div className={styles.dup}>
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className={styles.dupIcon}>
                  <rect x="8" y="8" width="12" height="12" rx="2.5" />
                  <path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8" />
                </svg>
                <span className={styles.dupText}>
                  Une recette identique semble déjà exister : <strong>{duplicate.title}</strong>
                </span>
                <button
                  type="button"
                  className={`${styles.dupDismiss} kd-hit`}
                  aria-label="Masquer l’alerte : ce n’est pas un doublon"
                  title="Ce n’est pas un doublon"
                  onClick={() => {
                    setDismissed((d) => [...d, duplicate.id]);
                    titleRef.current?.focus();
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.linkField}>
        <label htmlFor={`${uid}-url`} className={styles.fieldLabel}>
          Lien de la recette <span>· optionnel</span>
        </label>
        <div className={styles.urlInput}>
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" className={styles.inputIcon}>
            <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
            <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
          </svg>
          <input
            id={`${uid}-url`}
            type="url"
            inputMode="url"
            placeholder="Colle un lien YouTube, Instagram ou d’un site de recettes"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError(null);
            }}
          />
          {kind && (
            <span className={styles.kindChip}>
              <svg width="10" height="10" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 4.5v15l13-7.5z" />
              </svg>
              {kind}
            </span>
          )}
        </div>
      </div>

      <div className={styles.columns}>
        <section aria-labelledby={`${uid}-ing`} className={`${styles.ingredients} ${styles.editSection}`}>
          <h3 id={`${uid}-ing`} className={styles.sectionTitle}>
            Ingrédients
          </h3>
          <div className={styles.rowHeader} aria-hidden="true">
            <span>Nom</span>
            <span>Qté</span>
            <span>Unité</span>
            <span />
          </div>
          {rows.map((row, i) => {
            const name = row.name.trim() || `ingrédient ${i + 1}`;
            return (
              <div key={row.id} className={styles.row}>
                <input
                  id={`${uid}-row-${row.id}`}
                  type="text"
                  aria-label={`Ingrédient ${i + 1}`}
                  placeholder="Ingrédient"
                  value={row.name}
                  list={`${uid}-catalog`}
                  autoComplete="off"
                  className={styles.rowName}
                  onChange={(e) => patchRow(row.id, { name: e.target.value })}
                />
                <input
                  type="text"
                  inputMode="decimal"
                  aria-label={`Quantité de ${name}`}
                  placeholder="—"
                  value={row.qty}
                  className={styles.rowQty}
                  onChange={(e) => patchRow(row.id, { qty: e.target.value })}
                />
                <select
                  aria-label={`Unité de ${name}`}
                  value={row.unit ?? ""}
                  className={styles.rowUnit}
                  onChange={(e) => patchRow(row.id, { unit: (e.target.value || null) as Unit | null })}
                >
                  <option value="">—</option>
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  aria-label={`Retirer ${name}`}
                  className={`${styles.remove} kd-hit`}
                  onClick={() => setRows((rs) => rs.filter((r) => r.id !== row.id))}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
            );
          })}
          <datalist id={`${uid}-catalog`}>
            {catalog?.products.map((p) => <option key={p.key} value={p.name} />)}
          </datalist>
          <button
            type="button"
            className={styles.add}
            onClick={() => {
              const id = newId();
              setRows((rs) => [...rs, { id, name: "", qty: "", unit: null }]);
              focusSoon(`${uid}-row-${id}`);
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Ajouter un ingrédient
          </button>
        </section>

        <section aria-labelledby={`${uid}-steps`} className={`${styles.steps} ${styles.editSection}`}>
          <h3 id={`${uid}-steps`} className={styles.sectionTitle}>
            Préparation
          </h3>
          {steps.map((step, i) => (
            <div key={step.id} className={styles.stepRow}>
              <span className={`${styles.stepNumber} ${styles.stepNumberEdit}`} aria-hidden="true">
                {i + 1}
              </span>
              <textarea
                id={`${uid}-step-${step.id}`}
                aria-label={`Étape ${i + 1}`}
                rows={2}
                value={step.text}
                className={styles.stepInput}
                onChange={(e) =>
                  setSteps((ss) => ss.map((s) => (s.id === step.id ? { ...s, text: e.target.value } : s)))
                }
              />
              <button
                type="button"
                aria-label={`Retirer l’étape ${i + 1}`}
                className={`${styles.remove} ${styles.removeStep} kd-hit`}
                onClick={() => setSteps((ss) => ss.filter((s) => s.id !== step.id))}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
          ))}
          <button
            type="button"
            className={styles.add}
            onClick={() => {
              const id = newId();
              setSteps((ss) => [...ss, { id, text: "" }]);
              focusSoon(`${uid}-step-${id}`);
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Ajouter une étape
          </button>
        </section>
      </div>

      {deleteControl && <div className={styles.mobileDelete}>{deleteControl}</div>}

      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      <div className={styles.footer}>
        <span className={styles.desktopOnly}>{deleteControl}</span>
        <button type="button" className={`${styles.secondary} ${styles.cancel}`} onClick={onCancel}>
          Annuler
        </button>
        <button type="submit" className={styles.primary} disabled={busy}>
          {busy ? "Enregistrement…" : label.save}
          <span className={styles.primaryIcon} aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M5 12.5l4.5 4.5L19 7" />
            </svg>
          </span>
        </button>
      </div>
    </Modal>
  );
}
