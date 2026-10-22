import type { Catalog, CatalogProduct } from "./catalog";
import type { Ingredient } from "./recipes";
import { keyOf } from "./normalize";

// The Menu's food-group dots and the "Ce qu'il y a dans les assiettes" chart (design/menu-*.html).
export const GROUPS = [
  { id: "veg", label: "Légumes", plateLabel: "repas avec des légumes", color: "var(--kd-group-veg)" },
  { id: "starch", label: "Féculents", plateLabel: "repas avec des féculents", color: "var(--kd-group-starch)" },
  { id: "protein", label: "Viandes et poissons", plateLabel: "repas avec viande ou poisson", color: "var(--kd-group-protein)" },
  { id: "dairy", label: "Produits laitiers", plateLabel: "repas avec des produits laitiers", color: "var(--kd-group-dairy)" },
  { id: "pulses", label: "Légumineuses", plateLabel: "repas avec des légumineuses", color: "var(--kd-group-pulses)" },
  { id: "fruit", label: "Fruits", plateLabel: "repas avec des fruits", color: "var(--kd-group-fruit)" },
] as const;

export type GroupId = (typeof GROUPS)[number]["id"];

const keys = (...names: string[]) => new Set(names.map(keyOf));

// The catalogue files products by aisle; these lists refine aisles into food groups.
const FRUITS = keys(
  "Abricots", "Ananas", "Banane", "Cerises", "Clémentines", "Fraises", "Framboises", "Fruits rouges",
  "Grenade", "Kiwi", "Mangue", "Melon", "Mûres", "Myrtilles", "Nectarines", "Orange", "Pamplemousse",
  "Pastèque", "Pêches", "Poire", "Pomme", "Raisin", "Rhubarbe", "Fruits rouges surgelés", "Compote", "Fruits secs",
);
// Herbs and aromatics season a dish; they don't make it a "vegetable" meal.
const AROMATICS = keys(
  "Ail", "Basilic", "Ciboulette", "Coriandre", "Gingembre", "Herbes fraîches", "Menthe", "Persil",
  "Romarin", "Thym", "Citron jaune", "Citron vert", "Piment rouge", "Piment vert", "Échalote",
  "Oignons jaunes", "Oignons rouges", "Oignons nouveaux",
);
const STARCHES = keys(
  "Pommes de terre", "Patate douce", "Pâtes", "Spaghettis", "Penne", "Tagliatelles", "Fusilli",
  "Pâtes papillon", "Lasagnes", "Gnocchi", "Raviolis", "Riz", "Riz basmati", "Riz à risotto", "Quinoa",
  "Boulgour", "Semoule", "Couscous", "Polenta", "Nouilles udon", "Nouilles soba", "Nouilles chinoises",
  "Vermicelles de riz", "Frites", "Maïs",
);
const PULSES = keys("Lentilles", "Pois chiches", "Haricots rouges", "Haricots blancs", "Flageolets", "Houmous");
const FROZEN_VEG = keys("Épinards surgelés", "Petits pois surgelés", "Légumes surgelés", "Poêlée de légumes");

export function groupOf(product: CatalogProduct): GroupId | null {
  const k = product.key;
  if (PULSES.has(k)) return "pulses";
  if (STARCHES.has(k)) return "starch";
  if (FRUITS.has(k)) return "fruit";
  switch (product.aisleId) {
    case "fruits-legumes":
      return AROMATICS.has(k) ? null : "veg";
    case "viande-poisson":
    case "charcuterie-traiteur":
      return "protein";
    case "laitier-oeufs-vegetal":
      return "dairy";
    case "pain-patisserie":
    case "produits-cuisines":
      return "starch";
    case "surgeles":
      return FROZEN_VEG.has(k) ? "veg" : k === keyOf("Poisson pané") || k === keyOf("Nuggets") ? "protein" : null;
    default:
      return null;
  }
}

/** Food groups present in a dish, from its ingredients found in the catalogue. */
export function dishGroups(ingredients: Ingredient[], catalog: Catalog | null): Set<GroupId> {
  const found = new Set<GroupId>();
  if (!catalog) return found;
  for (const ing of ingredients) {
    const product = catalog.byKey.get(ing.key);
    const g = product && groupOf(product);
    if (g) found.add(g);
  }
  return found;
}
