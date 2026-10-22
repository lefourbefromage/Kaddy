import type { Metadata } from "next";
import { PageHeader, TITLE_ILLUSTRATIONS } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Ordre des rayons" };

// Placeholder: the aisle order is step 8 (the mockup reuses the Mon Kaddy illustration).
export default function OrdreDesRayonsPage() {
  return <PageHeader title="Ordre des rayons" subtitle="Bientôt ici." illustration={TITLE_ILLUSTRATIONS.kaddy} />;
}
