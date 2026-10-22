import type { ComponentType } from "react";
import { IconCart, IconList, IconMenu, IconRecipes } from "./icons";

// The 4 pages, in navigation order (PRODUCT.md). `short` is the mobile tab label,
// `also`: other sections shown under that tab (the aisle order belongs to Mon Kaddy).
export const NAV_LINKS: {
  href: string;
  label: string;
  short: string;
  also?: string[];
  Icon: ComponentType<{ size?: number; strokeWidth?: number }>;
}[] = [
  { href: "/menu", label: "Menu", short: "Menu", Icon: IconMenu },
  { href: "/liste", label: "Liste de courses", short: "Liste", Icon: IconList },
  { href: "/recettes", label: "Recettes", short: "Recettes", Icon: IconRecipes },
  { href: "/kaddy", label: "Mon Kaddy", short: "Mon Kaddy", also: ["/reglages"], Icon: IconCart },
];

const under = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

export const isActive = (pathname: string, link: { href: string; also?: string[] }) =>
  [link.href, ...(link.also ?? [])].some((href) => under(pathname, href));
