"use client";

import { useEffect, useState } from "react";
import { collection, deleteField, doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

/* ---------- Week & day arithmetic (ISO weeks, local time) ---------- */

export const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export const MEALS = ["lunch", "dinner"] as const;
export type Day = (typeof DAYS)[number];
export type Meal = (typeof MEALS)[number];
export type SlotRef = { day: Day; meal: Meal };

export const DAY_LABELS: Record<Day, string> = {
  mon: "lundi", tue: "mardi", wed: "mercredi", thu: "jeudi", fri: "vendredi", sat: "samedi", sun: "dimanche",
};
export const MEAL_LABELS: Record<Meal, string> = { lunch: "midi", dinner: "soir" };

const atNoon = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12);
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 12);

/** "2026-W43" for the ISO week containing `date`. */
export function weekIdOf(date: Date): string {
  const d = atNoon(date);
  const thursday = addDays(d, 3 - ((d.getDay() + 6) % 7));
  const jan4 = new Date(thursday.getFullYear(), 0, 4, 12);
  const week = 1 + Math.round((thursday.getTime() - addDays(jan4, -((jan4.getDay() + 6) % 7)).getTime()) / 6048e5);
  return `${thursday.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** Monday (noon, local) of an ISO week. */
export function mondayOf(weekId: string): Date {
  const [y, w] = weekId.split("-W").map(Number);
  const jan4 = new Date(y, 0, 4, 12);
  return addDays(jan4, -((jan4.getDay() + 6) % 7) + (w - 1) * 7);
}

export const shiftWeek = (weekId: string, n: number) => weekIdOf(addDays(mondayOf(weekId), 7 * n));
export const dateOf = (weekId: string, day: Day) => addDays(mondayOf(weekId), DAYS.indexOf(day));
export const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const todayIso = () => isoDate(new Date());
export const isoDaysAgo = (n: number) => {
  const d = new Date();
  return isoDate(new Date(d.getFullYear(), d.getMonth(), d.getDate() - n, 12));
};

/** Chronological index of a slot in its week (0 = Monday lunch … 13 = Sunday dinner). */
export const slotIndex = ({ day, meal }: SlotRef) => DAYS.indexOf(day) * 2 + MEALS.indexOf(meal);
export const slotLabel = ({ day, meal }: SlotRef) => `${DAY_LABELS[day]} ${MEAL_LABELS[meal]}`;
export const slotKey = ({ day, meal }: SlotRef) => `${day}.${meal}`;
export const parseSlotKey = (key: string): SlotRef => {
  const [day, meal] = key.split(".") as [Day, Meal];
  return { day, meal };
};
export const ALL_SLOTS: SlotRef[] = DAYS.flatMap((day) => MEALS.map((meal) => ({ day, meal })));

/* ---------- Firestore ---------- */

export type Slot =
  | { kind: "recipe"; recipeId: string }
  | { kind: "leftover"; recipeId: string; of: string } // of = "tue.dinner", same week
  | { kind: "simple"; name: string }; // a meal with no recipe ("Picnic plage")

export type Week = {
  id: string;
  slots: Partial<Record<Day, Partial<Record<Meal, Slot>>>>;
  listOverrides?: Record<string, { qty?: number; unit?: string; removed?: true }>;
};

export const getSlot = (week: Week | undefined, ref: SlotRef) => week?.slots?.[ref.day]?.[ref.meal];

const weeksOf = (householdId: string) => collection(db, "households", householdId, "weeks");

/**
 * Every week document of the household, kept in sync. A few dozen small documents a year:
 * one listener serves the menu, the cooking stats and the grocery list.
 */
export function useWeeks(householdId: string) {
  const [weeks, setWeeks] = useState<Map<string, Week> | null>(null);
  useEffect(
    () =>
      onSnapshot(
        weeksOf(householdId),
        (snap) =>
          setWeeks(
            new Map(
              snap.docs.map((d) => {
                const data = d.data() as Omit<Week, "id">;
                return [d.id, { ...data, id: d.id, slots: data.slots ?? {} }];
              }),
            ),
          ),
        () => setWeeks((w) => w ?? new Map()),
      ),
    [householdId],
  );
  return weeks;
}

/** Fills a slot. Not awaited by the UI: the local write shows up at once (latency compensation). */
export function setSlot(householdId: string, weekId: string, ref: SlotRef, slot: Slot) {
  return setDoc(
    doc(weeksOf(householdId), weekId),
    { slots: { [ref.day]: { [ref.meal]: slot } }, updatedAt: serverTimestamp() },
    { merge: true },
  ).catch((e) => console.error("setSlot", e));
}

export function clearSlot(householdId: string, weekId: string, ref: SlotRef) {
  return updateDoc(doc(weeksOf(householdId), weekId), {
    [`slots.${ref.day}.${ref.meal}`]: deleteField(),
    updatedAt: serverTimestamp(),
  }).catch((e) => console.error("clearSlot", e));
}

/** First empty slot from now on (today's slots included), this week then the next ones. */
export function firstFreeSlot(weeks: Map<string, Week>, from = new Date()): { weekId: string; ref: SlotRef } {
  const today = isoDate(from);
  for (let n = 0; n < 52; n++) {
    const weekId = shiftWeek(weekIdOf(from), n);
    const week = weeks.get(weekId);
    for (const ref of ALL_SLOTS) {
      if (isoDate(dateOf(weekId, ref.day)) < today) continue;
      if (!getSlot(week, ref)) return { weekId, ref };
    }
  }
  return { weekId: shiftWeek(weekIdOf(from), 52), ref: ALL_SLOTS[0] };
}

/* ---------- Cooking stats, derived from the weeks ---------- */

export type CookStats = Map<string, { count: number; last: string }>;

/** How often each recipe was planned up to today (leftovers excluded) and when last. */
export function cookStats(weeks: Map<string, Week> | null): CookStats {
  const stats: CookStats = new Map();
  if (!weeks) return stats;
  const today = todayIso();
  for (const week of weeks.values()) {
    for (const ref of ALL_SLOTS) {
      const slot = getSlot(week, ref);
      if (slot?.kind !== "recipe") continue;
      const date = isoDate(dateOf(week.id, ref.day));
      if (date > today) continue;
      const s = stats.get(slot.recipeId);
      if (!s) stats.set(slot.recipeId, { count: 1, last: date });
      else {
        s.count++;
        if (date > s.last) s.last = date;
      }
    }
  }
  return stats;
}

/* ---------- French labels ---------- */

const dayMonthFormat = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" });
/** "19 octobre", "1er novembre". */
export const dayMonth = { format: (d: Date) => dayMonthFormat.format(d).replace(/^1 /, "1er ") };
const shortMonth = new Intl.DateTimeFormat("fr-FR", { month: "short" });

/** "Semaine du 19 au 25 octobre" / "du 28 septembre au 4 octobre". */
export function weekTitle(weekId: string) {
  const mon = mondayOf(weekId);
  const sun = dateOf(weekId, "sun");
  return mon.getMonth() === sun.getMonth()
    ? `Semaine du ${mon.getDate() === 1 ? "1er" : mon.getDate()} au ${dayMonth.format(sun)}`
    : `Semaine du ${dayMonth.format(mon)} au ${dayMonth.format(sun)}`;
}

/** "19 – 25 oct." / "28 sept. – 4 oct." */
export function weekRange(weekId: string) {
  const mon = mondayOf(weekId);
  const sun = dateOf(weekId, "sun");
  return mon.getMonth() === sun.getMonth()
    ? `${mon.getDate()} – ${sun.getDate()} ${shortMonth.format(sun)}`
    : `${mon.getDate()} ${shortMonth.format(mon)} – ${sun.getDate()} ${shortMonth.format(sun)}`;
}

export function relativeWeek(weekId: string) {
  const current = weekIdOf(new Date());
  const diff = Math.round((mondayOf(weekId).getTime() - mondayOf(current).getTime()) / 6048e5);
  if (diff === 0) return "Cette semaine";
  if (diff === 1) return "Semaine prochaine";
  if (diff === -1) return "Semaine dernière";
  return diff > 0 ? `Dans ${diff} semaines` : `Il y a ${-diff} semaines`;
}

/** "jeudi soir" in the current week, "jeudi 29 octobre soir" otherwise. */
export function whenLabel(weekId: string, ref: SlotRef) {
  if (weekId === weekIdOf(new Date())) return slotLabel(ref);
  return `${DAY_LABELS[ref.day]} ${dayMonth.format(dateOf(weekId, ref.day))} ${MEAL_LABELS[ref.meal]}`;
}

/** "Il y a 5 semaines" from an ISO date. */
export function since(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const days = Math.round((atNoon(new Date()).getTime() - new Date(y, m - 1, d, 12).getTime()) / 864e5);
  if (days < 7) return days <= 0 ? "Aujourd’hui" : days === 1 ? "Hier" : `Il y a ${days} jours`;
  const w = Math.floor(days / 7);
  return w === 1 ? "Il y a 1 semaine" : `Il y a ${w} semaines`;
}
