import { AISLE_BY_ID, aisleColor } from "./aisles";
import type { Catalog } from "./catalog";
import type { Recipe } from "./recipes";

export type Art = { src: string; width: number; height: number; background: string };

// A recipe ingredient filed there is a mistake, not a reason to show soap on the recipe.
const NOT_FOOD = new Set(["hygiene-beaute", "entretien-nettoyage", "autres"]);

export const TODO_ART: Art = {
  src: "/illustrations/recette-a-completer.webp",
  width: 350,
  height: 260,
  background: "var(--kd-lavender-mist)",
};

// No ingredient found in the catalogue: one of these aisles, picked from the id.
const FALLBACKS = ["produits-cuisines", "epicerie-salee", "epicerie-sucree"];

/**
 * A recipe's thumbnail, derived from its ingredients (no image is stored): the illustration
 * and colour of the aisle of its first ingredient found in the catalogue (data/aisles.json).
 */
export function recipeArt(recipe: Pick<Recipe, "id" | "ingredients">, catalog: Catalog | null): Art {
  if (!recipe.ingredients.length) return TODO_ART;
  for (const ing of recipe.ingredients) {
    const aisleId = catalog?.byKey.get(ing.key)?.aisleId;
    const illustration = aisleId ? AISLE_BY_ID.get(aisleId)?.illustration : null;
    if (aisleId && illustration && !NOT_FOOD.has(aisleId)) return { ...illustration, background: aisleColor(aisleId) };
  }
  // Stable pick from the id, so a recipe keeps its picture.
  const n = [...recipe.id].reduce((h, c) => h + c.charCodeAt(0), 0);
  const aisleId = FALLBACKS[n % FALLBACKS.length];
  return { ...AISLE_BY_ID.get(aisleId)!.illustration, background: aisleColor(aisleId) };
}
