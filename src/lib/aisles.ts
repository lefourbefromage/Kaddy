import aisleList from "../../data/aisles.json";

/** A picture of public/illustrations/rayons, cut by scripts/cut-aisle-sheet.mjs. */
export type AisleArt = { src: string; width: number; height: number };
export type Aisle = { id: string; label: string; illustration: AisleArt };

export const AISLES: Aisle[] = aisleList;
export const AISLE_BY_ID = new Map(AISLES.map((a) => [a.id, a]));

/** CSS colour tokens of an aisle (styles/tokens.css). */
export const aisleColor = (id: string) => `var(--kd-aisle-${id})`;
export const aisleDot = (id: string) => `var(--kd-aisle-${id}-dot)`;

/** The household's aisle order, completed with the aisles it does not list yet; unknown ids are dropped. */
export const fullOrder = (aisleOrder: string[]) => {
  const known = aisleOrder.filter((id) => AISLE_BY_ID.has(id));
  return [...known, ...AISLES.map((a) => a.id).filter((id) => !known.includes(id))];
};


/** Display size of an aisle picture inside a box: next/image then serves a file of that size (1x/2x). */
export const fitArt = (art: AisleArt, maxWidth: number, maxHeight: number) => {
  const scale = Math.min(maxWidth / art.width, maxHeight / art.height);
  return { src: art.src, width: Math.round(art.width * scale), height: Math.round(art.height * scale) };
};
