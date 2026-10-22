import type { Metadata } from "next";
import { RecipesScreen } from "./RecipesScreen";

export const metadata: Metadata = { title: "Recettes" };

export default function RecettesPage() {
  return <RecipesScreen />;
}
