import type { Metadata } from "next";
import { ListScreen } from "./ListScreen";

export const metadata: Metadata = { title: "Liste de courses" };

export default function ListePage() {
  return <ListScreen />;
}
