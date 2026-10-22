import type { Metadata } from "next";
import { PageHeader, TITLE_ILLUSTRATIONS } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Menu" };

// Placeholder: the Menu screen is step 5.
export default function MenuPage() {
  return <PageHeader title="Menu" subtitle="Bientôt ici." illustration={TITLE_ILLUSTRATIONS.menu} />;
}
