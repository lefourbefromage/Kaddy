import type { Metadata } from "next";
import { AisleOrderScreen } from "./AisleOrderScreen";

export const metadata: Metadata = { title: "Ordre des rayons" };

export default function OrdreDesRayonsPage() {
  return <AisleOrderScreen />;
}
