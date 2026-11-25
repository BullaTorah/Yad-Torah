/**
 * Weekly Torah portions (parashot) with inclusive Hebrew verse ranges.
 * Used by Your Progress: Books → Parashot → 7 aliyot.
 */
export const TORAH_PARASHOT = [
  // Genesis
  { id: "Bereishit", name: "Bereishit", book: "Genesis", start: [1, 1], end: [6, 8] },
  { id: "Noach", name: "Noach", book: "Genesis", start: [6, 9], end: [11, 32] },
  { id: "Lech Lecha", name: "Lech Lecha", book: "Genesis", start: [12, 1], end: [17, 27] },
  { id: "Vayera", name: "Vayera", book: "Genesis", start: [18, 1], end: [22, 24] },
  { id: "Chayei Sara", name: "Chayei Sara", book: "Genesis", start: [23, 1], end: [25, 18] },
  { id: "Toldot", name: "Toldot", book: "Genesis", start: [25, 19], end: [28, 9] },
  { id: "Vayetzei", name: "Vayetzei", book: "Genesis", start: [28, 10], end: [32, 3] },
  { id: "Vayishlach", name: "Vayishlach", book: "Genesis", start: [32, 4], end: [36, 43] },
  { id: "Vayeshev", name: "Vayeshev", book: "Genesis", start: [37, 1], end: [40, 23] },
  { id: "Miketz", name: "Miketz", book: "Genesis", start: [41, 1], end: [44, 17] },
  { id: "Vayigash", name: "Vayigash", book: "Genesis", start: [44, 18], end: [47, 27] },
  { id: "Vayechi", name: "Vayechi", book: "Genesis", start: [47, 28], end: [50, 26] },
  // Exodus
  { id: "Shemot", name: "Shemot", book: "Exodus", start: [1, 1], end: [6, 1] },
  { id: "Vaera", name: "Vaera", book: "Exodus", start: [6, 2], end: [9, 35] },
  { id: "Bo", name: "Bo", book: "Exodus", start: [10, 1], end: [13, 16] },
  { id: "Beshalach", name: "Beshalach", book: "Exodus", start: [13, 17], end: [17, 16] },
  { id: "Yitro", name: "Yitro", book: "Exodus", start: [18, 1], end: [20, 23] },
  { id: "Mishpatim", name: "Mishpatim", book: "Exodus", start: [21, 1], end: [24, 18] },
  { id: "Terumah", name: "Terumah", book: "Exodus", start: [25, 1], end: [27, 19] },
  { id: "Tetzaveh", name: "Tetzaveh", book: "Exodus", start: [27, 20], end: [30, 10] },
  { id: "Ki Tisa", name: "Ki Tisa", book: "Exodus", start: [30, 11], end: [34, 35] },
  { id: "Vayakhel", name: "Vayakhel", book: "Exodus", start: [35, 1], end: [38, 20] },
  { id: "Pekudei", name: "Pekudei", book: "Exodus", start: [38, 21], end: [40, 38] },
  // Leviticus
  { id: "Vayikra", name: "Vayikra", book: "Leviticus", start: [1, 1], end: [5, 26] },
  { id: "Tzav", name: "Tzav", book: "Leviticus", start: [6, 1], end: [8, 36] },
  { id: "Shmini", name: "Shmini", book: "Leviticus", start: [9, 1], end: [11, 47] },
  { id: "Tazria", name: "Tazria", book: "Leviticus", start: [12, 1], end: [13, 59] },
  { id: "Metzora", name: "Metzora", book: "Leviticus", start: [14, 1], end: [15, 33] },
  { id: "Achrei Mot", name: "Achrei Mot", book: "Leviticus", start: [16, 1], end: [18, 30] },
  { id: "Kedoshim", name: "Kedoshim", book: "Leviticus", start: [19, 1], end: [20, 27] },
  { id: "Emor", name: "Emor", book: "Leviticus", start: [21, 1], end: [24, 23] },
  { id: "Behar", name: "Behar", book: "Leviticus", start: [25, 1], end: [26, 2] },
  { id: "Bechukotai", name: "Bechukotai", book: "Leviticus", start: [26, 3], end: [27, 34] },
  // Numbers
  { id: "Bamidbar", name: "Bamidbar", book: "Numbers", start: [1, 1], end: [4, 20] },
  { id: "Nasso", name: "Nasso", book: "Numbers", start: [4, 21], end: [7, 89] },
  { id: "Behaalotcha", name: "Beha'alotcha", book: "Numbers", start: [8, 1], end: [12, 16] },
  { id: "Shlach", name: "Shlach", book: "Numbers", start: [13, 1], end: [15, 41] },
  { id: "Korach", name: "Korach", book: "Numbers", start: [16, 1], end: [18, 32] },
  { id: "Chukat", name: "Chukat", book: "Numbers", start: [19, 1], end: [22, 1] },
  { id: "Balak", name: "Balak", book: "Numbers", start: [22, 2], end: [25, 9] },
  { id: "Pinchas", name: "Pinchas", book: "Numbers", start: [25, 10], end: [30, 1] },
  { id: "Matot", name: "Matot", book: "Numbers", start: [30, 2], end: [32, 42] },
  { id: "Masei", name: "Masei", book: "Numbers", start: [33, 1], end: [36, 13] },
  // Deuteronomy
  { id: "Devarim", name: "Devarim", book: "Deuteronomy", start: [1, 1], end: [3, 22] },
  { id: "Vaetchanan", name: "Va'etchanan", book: "Deuteronomy", start: [3, 23], end: [7, 11] },
  { id: "Eikev", name: "Eikev", book: "Deuteronomy", start: [7, 12], end: [11, 25] },
  { id: "Reeh", name: "Re'eh", book: "Deuteronomy", start: [11, 26], end: [16, 17] },
  { id: "Shoftim", name: "Shoftim", book: "Deuteronomy", start: [16, 18], end: [21, 9] },
  { id: "Ki Teitzei", name: "Ki Teitzei", book: "Deuteronomy", start: [21, 10], end: [25, 19] },
  { id: "Ki Tavo", name: "Ki Tavo", book: "Deuteronomy", start: [26, 1], end: [29, 8] },
  { id: "Nitzavim", name: "Nitzavim", book: "Deuteronomy", start: [29, 9], end: [30, 20] },
  { id: "Vayeilech", name: "Vayeilech", book: "Deuteronomy", start: [31, 1], end: [31, 30] },
  { id: "Haazinu", name: "Ha'azinu", book: "Deuteronomy", start: [32, 1], end: [32, 52] },
  { id: "Vezot Haberakhah", name: "Vezot Haberakhah", book: "Deuteronomy", start: [33, 1], end: [34, 12] }
];

export const TORAH_PARASHA_TOTAL = TORAH_PARASHOT.length;
export const ALIYOT_PER_PARASHA = 7;

function verseKey(chapter, verse) {
  return chapter * 1000 + verse;
}

/** Find parasha containing a book/chapter/verse (Hebrew numbering). */
export function findParashaForVerse(book, chapter, verse) {
  const key = verseKey(chapter, verse);
  return (
    TORAH_PARASHOT.find((p) => {
      if (p.book !== book) return false;
      const a = verseKey(p.start[0], p.start[1]);
      const b = verseKey(p.end[0], p.end[1]);
      return key >= a && key <= b;
    }) || null
  );
}

export function parashotForBook(bookId) {
  return TORAH_PARASHOT.filter((p) => p.book === bookId);
}

/** Stable key for aliyah opens in the reading map. */
export function parashaAliyahKey(parashaName, aliyahNumber) {
  const n = Number(aliyahNumber);
  if (!parashaName || !Number.isFinite(n) || n < 1 || n > 7) return null;
  return `${parashaName}::${n}`;
}

export function parseParashaAliyahKey(key) {
  const raw = String(key || "");
  const idx = raw.lastIndexOf("::");
  if (idx < 0) return null;
  const name = raw.slice(0, idx);
  const n = Number(raw.slice(idx + 2));
  if (!name || !Number.isFinite(n) || n < 1 || n > 7) return null;
  return { parasha: name, aliyah: n };
}

function normalizeParashaLabel(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[''`´]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

const PARASHA_ALIASES = {
  bereshit: "Bereishit",
  bereishit: "Bereishit",
  lechlecha: "Lech Lecha",
  vayetze: "Vayetzei",
  vayetzei: "Vayetzei",
  haazinu: "Ha'azinu",
  veZothaberakhah: "Vezot Haberakhah",
  vezothaberakhah: "Vezot Haberakhah",
  vezothabracha: "Vezot Haberakhah",
  behaalotecha: "Beha'alotcha",
  behaalotcha: "Beha'alotcha",
  vaetchanan: "Va'etchanan",
  reeh: "Re'eh",
  ree: "Re'eh"
};

/** Map Sefaria / display titles onto catalog parasha names. */
export function resolveParashaName(title) {
  const raw = String(title || "").trim();
  if (!raw) return "";
  const exact = TORAH_PARASHOT.find((p) => p.name === raw || p.id === raw);
  if (exact) return exact.name;
  const needle = normalizeParashaLabel(raw);
  if (PARASHA_ALIASES[needle]) return PARASHA_ALIASES[needle];
  const fuzzy = TORAH_PARASHOT.find(
    (p) =>
      normalizeParashaLabel(p.name) === needle ||
      normalizeParashaLabel(p.id) === needle
  );
  return fuzzy?.name || raw;
}
