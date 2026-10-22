import type { Metadata } from "next";
import { PageHeader, TITLE_ILLUSTRATIONS } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Mon Kaddy" };

// Placeholder: Mon Kaddy is step 7.
export default function KaddyPage() {
  return <PageHeader title="Mon Kaddy" subtitle="Bientôt ici." illustration={TITLE_ILLUSTRATIONS.kaddy} />;
}
