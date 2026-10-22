import { AISLE_BY_ID, aisleColor } from "./aisles";
import type { Catalog } from "./catalog";
import type { Recipe } from "./recipes";

export type Art = { src: string; width: number; height: number; background: string };

// Sizes of public/illustrations/*.webp, for next/image.
const SIZES: Record<string, [number, number]> = {
  "rayon-boucherie": [321, 260],
  "rayon-boulangerie": [278, 260],
  "rayon-cremerie": [324, 260],
  "rayon-epicerie": [256, 260],
  "rayon-fruits-legumes": [265, 264],
  "rayon-hygiene": [130, 112],
  "recette-a-completer": [350, 260],
  "recette-confiture": [333, 260],
  "recette-lentilles": [318, 260],
  "recette-pomme": [298, 260],
};

const art = (name: string, background: string): Art => {
  const [width, height] = SIZES[name];
  return { src: `/illustrations/${name}.webp`, width, height, background };
};

export const TODO_ART = art("recette-a-completer", "var(--kd-lavender-mist)");
const FALLBACKS = ["recette-pomme", "recette-lentilles", "recette-confiture"];

/**
 * A recipe's thumbnail, derived from its ingredients (no image is stored): the illustration
 * and colour of the aisle of its first ingredient found in the catalogue.
 */
export function recipeArt(recipe: Pick<Recipe, "id" | "ingredients">, catalog: Catalog | null): Art {
  if (!recipe.ingredients.length) return TODO_ART;
  for (const ing of recipe.ingredients) {
    const aisleId = catalog?.byKey.get(ing.key)?.aisleId;
    const illustration = aisleId ? AISLE_BY_ID.get(aisleId)?.illustration : null;
    if (aisleId && illustration && illustration in SIZES && illustration !== "rayon-hygiene") {
      return art(illustration, aisleColor(aisleId));
    }
  }
  // Stable pick from the id, so a recipe keeps its picture.
  const n = [...recipe.id].reduce((h, c) => h + c.charCodeAt(0), 0);
  return art(FALLBACKS[n % FALLBACKS.length], aisleColor("epicerie-salee"));
}
