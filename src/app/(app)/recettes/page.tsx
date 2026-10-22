import type { Metadata } from "next";
import { PageHeader, TITLE_ILLUSTRATIONS } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Recettes" };

// Placeholder: the recipes are step 4.
export default function RecettesPage() {
  return <PageHeader title="Recettes" subtitle="Bientôt ici." illustration={TITLE_ILLUSTRATIONS.recettes} />;
}
