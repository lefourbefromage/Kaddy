import { Bricolage_Grotesque, Figtree } from "next/font/google";

// The two families of the system (DESIGN.md, Single Lettering Rule).
// next/font exposes them as --font-bricolage / --font-figtree;
// globals.css maps them onto --font-display / --font-body from tokens.css.
export const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-bricolage",
  display: "swap",
});

export const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
});
