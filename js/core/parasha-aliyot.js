import { TORAH_PARASHOT } from "./torah-parashot.js";

/** Max verse per chapter (Hebrew numbering), from TAHOT. */
const CHAPTER_LENGTHS = {
  Genesis: {
    1: 31, 2: 25, 3: 24, 4: 26, 5: 32, 6: 22, 7: 24, 8: 22, 9: 29, 10: 32,
    11: 32, 12: 20, 13: 18, 14: 24, 15: 21, 16: 16, 17: 27, 18: 33, 19: 38, 20: 18,
    21: 34, 22: 24, 23: 20, 24: 67, 25: 34, 26: 35, 27: 46, 28: 22, 29: 35, 30: 43,
    31: 54, 32: 33, 33: 20, 34: 31, 35: 29, 36: 43, 37: 36, 38: 30, 39: 23, 40: 23,
    41: 57, 42: 38, 43: 34, 44: 34, 45: 28, 46: 34, 47: 31, 48: 22, 49: 33, 50: 26
  },
  Exodus: {
    1: 22, 2: 25, 3: 22, 4: 31, 5: 23, 6: 30, 7: 29, 8: 28, 9: 35, 10: 29,
    11: 10, 12: 51, 13: 22, 14: 31, 15: 27, 16: 36, 17: 16, 18: 27, 19: 25, 20: 26,
    21: 37, 22: 30, 23: 33, 24: 18, 25: 40, 26: 37, 27: 21, 28: 43, 29: 46, 30: 38,
    31: 18, 32: 35, 33: 23, 34: 35, 35: 35, 36: 38, 37: 29, 38: 31, 39: 43, 40: 38
  },
  Leviticus: {
    1: 17, 2: 16, 3: 17, 4: 35, 5: 26, 6: 23, 7: 38, 8: 36, 9: 24, 10: 20,
    11: 47, 12: 8, 13: 59, 14: 57, 15: 33, 16: 34, 17: 16, 18: 30, 19: 37, 20: 27,
    21: 24, 22: 33, 23: 44, 24: 23, 25: 55, 26: 46, 27: 34
  },
  Numbers: {
    1: 54, 2: 34, 3: 51, 4: 49, 5: 31, 6: 27, 7: 89, 8: 26, 9: 23, 10: 36,
    11: 35, 12: 16, 13: 33, 14: 45, 15: 41, 16: 35, 17: 28, 18: 32, 19: 22, 20: 29,
    21: 35, 22: 41, 23: 30, 24: 25, 25: 19, 26: 65, 27: 23, 28: 31, 29: 39, 30: 17,
    31: 54, 32: 42, 33: 56, 34: 29, 35: 34, 36: 13
  },
  Deuteronomy: {
    1: 46, 2: 37, 3: 29, 4: 49, 5: 33, 6: 25, 7: 26, 8: 20, 9: 29, 10: 22,
    11: 32, 12: 31, 13: 19, 14: 29, 15: 23, 16: 22, 17: 20, 18: 22, 19: 21, 20: 20,
    21: 23, 22: 29, 23: 26, 24: 22, 25: 19, 26: 19, 27: 26, 28: 69, 29: 28, 30: 20,
    31: 30, 32: 52, 33: 29, 34: 12
  }
};

const ORDER = [
  "First",
  "Second",
  "Third",
  "Fourth",
  "Fifth",
  "Sixth",
  "Seventh"
];

/** @type {Map<string, string[]>} */
const cache = new Map();

function lastVerseOfChapter(book, chapter) {
  return CHAPTER_LENGTHS[book]?.[chapter] || 1;
}

/** Total verses in a Torah book (Hebrew chapter lengths). */
export function verseCountForBook(book) {
  const chapters = CHAPTER_LENGTHS[book];
  if (!chapters) return 0;
  let n = 0;
  for (const len of Object.values(chapters)) n += len;
  return n;
}

/** Inclusive verse count for a parasha range. */
export function verseCountForRange(book, start, end) {
  if (!book || !start || !end) return 0;
  let n = 0;
  const [sc, sv] = start;
  const [ec, ev] = end;
  for (let ch = sc; ch <= ec; ch++) {
    const last = lastVerseOfChapter(book, ch);
    const from = ch === sc ? sv : 1;
    const to = ch === ec ? ev : last;
    if (to >= from) n += to - from + 1;
  }
  return n;
}

function verseBefore(book, chapter, verse) {
  if (verse > 1) return { chapter, verse: verse - 1 };
  const prevCh = chapter - 1;
  return { chapter: prevCh, verse: lastVerseOfChapter(book, prevCh) };
}

function toSefariaRef(book, a, b) {
  return `${book} ${a.chapter}:${a.verse}-${b.chapter}:${b.verse}`;
}

function extractStarts(book, startCh, startV, alts) {
  /** @type {({ chapter: number, verse: number } | undefined)[]} */
  const starts = [];
  if (!Array.isArray(alts)) return starts;

  for (let ci = 0; ci < alts.length; ci++) {
    const chap = alts[ci];
    if (!Array.isArray(chap)) continue;
    const chapter = startCh + ci;
    const verseBase = ci === 0 ? startV : 1;
    for (let vi = 0; vi < chap.length; vi++) {
      const cell = chap[vi];
      if (!cell?.aliyah_en) continue;
      const idx = ORDER.indexOf(cell.aliyah_en);
      if (idx < 0) continue;
      starts[idx] = { chapter, verse: verseBase + vi };
    }
  }
  return starts;
}

function buildRefs(book, start, end, starts) {
  const refs = [];
  for (let i = 0; i < 7; i++) {
    const a = starts[i] || { chapter: start[0], verse: start[1] };
    const next = starts[i + 1];
    const b = next
      ? verseBefore(book, next.chapter, next.verse)
      : { chapter: end[0], verse: end[1] };
    refs.push(toSefariaRef(book, a, b));
  }
  return refs;
}

/**
 * Resolve 7 Sefaria aliyah refs for a catalog parasha (cached).
 * @param {{ name: string, book: string, start: number[], end: number[] }} parasha
 * @returns {Promise<string[]>}
 */
export async function getAliyahRefsForParasha(parasha) {
  if (!parasha?.book) return [];
  const cacheKey = parasha.name;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const range = `${parasha.book} ${parasha.start[0]}:${parasha.start[1]}-${parasha.end[0]}:${parasha.end[1]}`;
  const res = await fetch(
    `https://www.sefaria.org/api/v3/texts/${encodeURIComponent(range)}`
  );
  if (!res.ok) {
    throw new Error(`Could not load aliyot for ${parasha.name}`);
  }
  const data = await res.json();
  const starts = extractStarts(
    parasha.book,
    parasha.start[0],
    parasha.start[1],
    data.alts
  );
  const refs = buildRefs(parasha.book, parasha.start, parasha.end, starts);
  cache.set(cacheKey, refs);
  return refs;
}

export function findCatalogParasha(name) {
  const needle = String(name || "").trim();
  return (
    TORAH_PARASHOT.find((p) => p.name === needle || p.id === needle) || null
  );
}
