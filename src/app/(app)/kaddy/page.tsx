import type { Metadata } from "next";
import { KaddyScreen } from "./KaddyScreen";

export const metadata: Metadata = { title: "Mon Kaddy" };

export default function KaddyPage() {
  return <KaddyScreen />;
}
