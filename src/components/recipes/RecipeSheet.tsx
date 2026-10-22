"use client";

import { useState } from "react";
import Image from "next/image";
import { Modal } from "@/components/Modal";
import type { Art } from "@/lib/recipeArt";
import {
  cookedLabel,
  deleteRecipe,
  formatQty,
  sourceKind,
  sourceLabel,
  type Recipe,
} from "@/lib/recipes";
import styles from "./recipeDialogs.module.css";

export function RecipeSheet({
  householdId,
  recipe,
  art,
  cookedCount,
  onClose,
  onEdit,
  onDeleted,
  onPlan,
}: {
  householdId: string;
  recipe: Recipe;
  art: Art;
  cookedCount: number;
  onClose: () => void;
  onEdit: () => void;
  onDeleted: () => void;
  /** Puts the recipe in the next free slot; resolves to that slot's label ("jeudi soir"). */
  onPlan?: () => string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [planned, setPlanned] = useState<string | null>(null);
  const kind = sourceKind(recipe.sourceUrl);
  const n = recipe.ingredients.length;

  return (
    <Modal labelledBy="fiche-titre" onClose={onClose}>
      <div className={styles.head} style={{ background: art.background }}>
        <button type="button" aria-label="Fermer" className={styles.close} onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <Image
          src={art.src}
          alt=""
          width={art.width}
          height={art.height}
          sizes="168px"
          className={styles.headImage}
        />
        <div className={styles.headText}>
          <h2 id="fiche-titre" className={styles.title}>
            {recipe.title}
          </h2>
          <div className={styles.headChips}>
            <span className={styles.whiteChip}>{cookedLabel(cookedCount)}</span>
            {kind && recipe.sourceUrl && (
              <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer" className={`${styles.sourceLink} kd-hit`}>
                <span className={styles.sourcePlay} aria-hidden="true">
                  <svg width="12" height="12" viewBox="0 0 24 24">
                    <path d="M7 4.5v15l13-7.5z" />
                  </svg>
                </span>
                {sourceLabel(kind)}
                <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" className={styles.external}>
                  <path d="M7 17L17 7M9 7h8v8" />
                </svg>
                <span className={styles.srOnly}> (nouvel onglet)</span>
              </a>
            )}
          </div>
        </div>
      </div>

      <div className={styles.columns}>
        <section aria-labelledby="fiche-ingredients" className={styles.ingredients}>
          <h3 id="fiche-ingredients" className={styles.sectionTitle}>
            Ingrédients
            <span className={styles.count}>{n === 1 ? "1 ingrédient" : `${n} ingrédients`}</span>
          </h3>
          {n ? (
            <ul className={styles.ingredientList}>
              {recipe.ingredients.map((ing, i) => (
                <li key={`${ing.key}-${i}`} className={styles.ingredient}>
                  <span className={styles.ingredientName}>{ing.name}</span>
                  {ing.qty != null && <span className={styles.qty}>{formatQty(ing.qty, ing.unit)}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.muted}>Aucun ingrédient pour l’instant. Complète la recette avec « Modifier ».</p>
          )}
        </section>

        <section aria-labelledby="fiche-etapes" className={styles.steps}>
          <h3 id="fiche-etapes" className={styles.sectionTitle}>
            Préparation
          </h3>
          {recipe.steps.length ? (
            <ol className={styles.stepList}>
              {recipe.steps.map((text, i) => (
                <li key={i} className={styles.step}>
                  <span className={styles.stepNumber} aria-hidden="true">
                    {i + 1}
                  </span>
                  <span className={styles.stepText}>{text}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className={styles.muted}>Pas encore d’étapes.</p>
          )}
        </section>
      </div>

      <div className={styles.footer}>
        <button type="button" className={styles.secondary} onClick={onEdit}>
          Modifier
        </button>
        {confirming ? (
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
            Supprimer
          </button>
        )}
        {onPlan && (
          <span className={styles.planSlot}>
            <span role="status" className={styles.planned}>
              {planned && <>Ajoutée au menu : {planned}</>}
            </span>
            <button type="button" className={styles.primary} onClick={() => setPlanned(onPlan())}>
              Mettre au menu
              <span className={styles.primaryIcon} aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <rect x="3.5" y="5" width="17" height="15" rx="3" />
                  <path d="M3.5 10h17M8 3v4M16 3v4" />
                </svg>
              </span>
            </button>
          </span>
        )}
      </div>
    </Modal>
  );
}
