import type { Metadata } from "next";
import { PageHeader, TITLE_ILLUSTRATIONS } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Liste de courses" };

// Placeholder: the grocery list is step 6.
export default function ListePage() {
  return <PageHeader title="Liste de courses" subtitle="Bientôt ici." illustration={TITLE_ILLUSTRATIONS.liste} />;
}
