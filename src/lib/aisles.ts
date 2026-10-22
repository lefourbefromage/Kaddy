import aisleList from "../../data/aisles.json";

export type Aisle = { id: string; label: string; illustration: string | null };

export const AISLES: Aisle[] = aisleList;
export const AISLE_BY_ID = new Map(AISLES.map((a) => [a.id, a]));

/** CSS colour tokens of an aisle (styles/tokens.css). */
export const aisleColor = (id: string) => `var(--kd-aisle-${id})`;
export const aisleDot = (id: string) => `var(--kd-aisle-${id}-dot)`;
