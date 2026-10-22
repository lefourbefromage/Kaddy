// Text normalisation shared by the catalogue, recipes and the list (docs/data-model.md).

const stripAccents = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Product key. Must stay identical to keyOf() in scripts/seed-catalog.mjs. */
export const keyOf = (s: string) =>
  stripAccents(s)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .map((w) => w.replace(/[sx]$/, ""))
    .join("-");

/** Case- and accent-insensitive form, for search. */
export const fold = (s: string) => stripAccents(s).toLowerCase();

const SMALL_WORDS = new Set([
  "a", "au", "aux", "de", "des", "du", "d", "la", "le", "les", "l",
  "et", "en", "avec", "sans", "un", "une", "sur", "facon",
]);

/** Title words for duplicate detection: no accents, no small words, singular. */
export const titleWords = (title: string) => [
  ...new Set(
    fold(title)
      .replace(/[^a-z0-9]+/g, " ")
      .split(" ")
      .filter((w) => w && !SMALL_WORDS.has(w))
      .map((w) => w.replace(/[sx]$/, "")),
  ),
];

/** Two titles are close when more than 80% of the words of one appear in the other. */
export const areClose = (a: string[], b: string[]) => {
  if (!a.length || !b.length) return false;
  const common = a.filter((w) => b.includes(w)).length;
  return Math.max(common / a.length, common / b.length) > 0.8;
};
