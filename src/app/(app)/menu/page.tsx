import type { Metadata } from "next";
import { MenuScreen } from "./MenuScreen";

export const metadata: Metadata = { title: "Menu" };

export default function MenuPage() {
  return <MenuScreen />;
}
