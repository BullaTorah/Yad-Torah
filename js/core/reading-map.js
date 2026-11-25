import { getSupabase, getUser, isLoggedIn } from "./auth.js";
import {
  TORAH_PARASHOT,
  TORAH_PARASHA_TOTAL,
  ALIYOT_PER_PARASHA,
  findParashaForVerse,
  parashotForBook,
  parashaAliyahKey,
  parseParashaAliyahKey,
  resolveParashaName
} from "./torah-parashot.js";
import {
  verseCountForBook,
  verseCountForRange
} from "./parasha-aliyot.js";

/** Torah book order. */
export const TORAH_BOOKS = [
  { id: "Genesis" },
  { id: "Exodus" },
  { id: "Leviticus" },
  { id: "Numbers" },
  { id: "Deuteronomy" }
];

export const TORAH_VERSE_TOTAL = 5853;
export { TORAH_PARASHA_TOTAL, ALIYOT_PER_PARASHA };
/** Soft cap for aliyot bar (~54 weekly portions × 7). */
export const ALIYOT_SOFT_CAP = TORAH_PARASHA_TOTAL * ALIYOT_PER_PARASHA;

const BOOK_SET = new Set(TORAH_BOOKS.map((b) => b.id));

/** @type {Map<string, { open_count: number, last_opened_at: string }>} */
let verseOpens = new Map();
/** @type {Map<string, { open_count: number, last_opened_at: string }>} */
let aliyahOpens = new Map();

const sessionVerses = new Set();
const sessionAliyot = new Set();

const listeners = new Set();

function storageKey(userId) {
  return `bulla-reading-map:${userId}`;
}

function nowIso() {
  return new Date().toISOString();
}

function parseVerseRef(ref) {
  const parts = String(ref || "").split(".");
  if (parts.length < 3) return null;
  const book = parts[0];
  const chapter = Number(parts[1]);
  const verse = Number(parts[2]);
  if (!BOOK_SET.has(book) || !Number.isFinite(chapter) || chapter < 1) {
    return null;
  }
  return { book, chapter, verse, ref: `${book}.${chapter}.${verse}` };
}

function readLocal(userId) {
  if (!userId) return { verses: {}, aliyot: {} };
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return { verses: {}, aliyot: {} };
    const parsed = JSON.parse(raw);
    return {
      verses:
        parsed?.verses && typeof parsed.verses === "object" ? parsed.verses : {},
      aliyot:
        parsed?.aliyot && typeof parsed.aliyot === "object" ? parsed.aliyot : {}
    };
  } catch {
    return { verses: {}, aliyot: {} };
  }
}

function writeLocal(userId) {
  if (!userId) return;
  const verses = {};
  for (const [ref, row] of verseOpens) {
    verses[ref] = {
      open_count: row.open_count,
      last_opened_at: row.last_opened_at
    };
  }
  const aliyot = {};
  for (const [ref, row] of aliyahOpens) {
    aliyot[ref] = {
      open_count: row.open_count,
      last_opened_at: row.last_opened_at
    };
  }
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify({ verses, aliyot }));
  } catch {
    /* ignore */
  }
}

function notify() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* ignore */
    }
  });
}

export function onReadingMapChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function mergeRow(map, key, incoming) {
  const count = Math.max(0, Number(incoming?.open_count) || 0);
  const at =
    typeof incoming?.last_opened_at === "string"
      ? incoming.last_opened_at
      : nowIso();
  const prev = map.get(key);
  if (!prev) {
    map.set(key, { open_count: count || 1, last_opened_at: at });
    return;
  }
  map.set(key, {
    open_count: Math.max(prev.open_count, count),
    last_opened_at: prev.last_opened_at > at ? prev.last_opened_at : at
  });
}

function applyLocalBundle(bundle) {
  for (const [ref, row] of Object.entries(bundle.verses || {})) {
    if (parseVerseRef(ref)) mergeRow(verseOpens, ref, row);
  }
  for (const [ref, row] of Object.entries(bundle.aliyot || {})) {
    if (ref) mergeRow(aliyahOpens, ref, row);
  }
}

/**
 * Load + merge remote and local reading map for the signed-in user.
 */
export async function loadReadingMap() {
  verseOpens = new Map();
  aliyahOpens = new Map();

  if (!isLoggedIn()) {
    notify();
    return;
  }

  const user = getUser();
  if (!user) return;

  applyLocalBundle(readLocal(user.id));

  const supabase = getSupabase();
  if (supabase) {
    try {
      const [versesRes, aliyotRes] = await Promise.all([
        supabase
          .from("reading_verse_opens")
          .select("verse_ref, open_count, last_opened_at")
          .eq("user_id", user.id),
        supabase
          .from("reading_aliyah_opens")
          .select("aliyah_ref, open_count, last_opened_at")
          .eq("user_id", user.id)
      ]);

      if (!versesRes.error && Array.isArray(versesRes.data)) {
        for (const row of versesRes.data) {
          if (row?.verse_ref) mergeRow(verseOpens, row.verse_ref, row);
        }
      }
      if (!aliyotRes.error && Array.isArray(aliyotRes.data)) {
        for (const row of aliyotRes.data) {
          if (row?.aliyah_ref) mergeRow(aliyahOpens, row.aliyah_ref, row);
        }
      }
    } catch {
      /* keep local */
    }
  }

  writeLocal(user.id);
  notify();
}

export function clearReadingMapCache() {
  verseOpens = new Map();
  aliyahOpens = new Map();
  sessionVerses.clear();
  sessionAliyot.clear();
  notify();
}

async function upsertVerseRemote(userId, ref, row) {
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from("reading_verse_opens").upsert(
    {
      user_id: userId,
      verse_ref: ref,
      open_count: row.open_count,
      last_opened_at: row.last_opened_at
    },
    { onConflict: "user_id,verse_ref" }
  );
  if (error) throw error;
}

async function upsertAliyahRemote(userId, ref, row) {
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from("reading_aliyah_opens").upsert(
    {
      user_id: userId,
      aliyah_ref: ref,
      open_count: row.open_count,
      last_opened_at: row.last_opened_at
    },
    { onConflict: "user_id,aliyah_ref" }
  );
  if (error) throw error;
}

/**
 * Credit displayed verses + parasha/aliyah slot (once per session per key).
 */
export async function recordReadingOpen({
  verseRefs = [],
  parshaTitle = "",
  aliyahNumber = 0
} = {}) {
  if (!isLoggedIn()) return;

  const user = getUser();
  if (!user) return;

  const at = nowIso();
  const verseUpdates = [];
  const aliyahUpdates = [];

  for (const raw of verseRefs) {
    const parsed = parseVerseRef(raw);
    if (!parsed) continue;
    if (sessionVerses.has(parsed.ref)) continue;
    sessionVerses.add(parsed.ref);

    const prev = verseOpens.get(parsed.ref);
    const next = {
      open_count: (prev?.open_count || 0) + 1,
      last_opened_at: at
    };
    verseOpens.set(parsed.ref, next);
    verseUpdates.push([parsed.ref, next]);
  }

  const slotKey = parashaAliyahKey(
    resolveParashaName(parshaTitle),
    aliyahNumber
  );
  if (slotKey && !sessionAliyot.has(slotKey)) {
    sessionAliyot.add(slotKey);
    const prev = aliyahOpens.get(slotKey);
    const next = {
      open_count: (prev?.open_count || 0) + 1,
      last_opened_at: at
    };
    aliyahOpens.set(slotKey, next);
    aliyahUpdates.push([slotKey, next]);
  }

  if (!verseUpdates.length && !aliyahUpdates.length) return;

  writeLocal(user.id);
  notify();

  try {
    await Promise.all([
      ...verseUpdates.map(([ref, row]) => upsertVerseRemote(user.id, ref, row)),
      ...aliyahUpdates.map(([ref, row]) => upsertAliyahRemote(user.id, ref, row))
    ]);
  } catch {
    /* local already saved */
  }
}

function heatNormalize(values) {
  const max = Math.max(0, ...values, 0);
  if (max <= 0) return values.map(() => 0);
  return values.map((v) => v / max);
}

/**
 * Aggregated stats for progress bars + Books → Parashot → Aliyot heat map.
 */
export function getReadingMapStats() {
  /** @type {Map<string, number>} */
  const bookWeight = new Map(TORAH_BOOKS.map((b) => [b.id, 0]));
  /** @type {Map<string, number>} parasha name -> weight */
  const parashaWeight = new Map(TORAH_PARASHOT.map((p) => [p.name, 0]));
  const parashotTouched = new Set();

  for (const [ref, row] of verseOpens) {
    const parsed = parseVerseRef(ref);
    if (!parsed) continue;
    const w = row.open_count || 1;
    bookWeight.set(parsed.book, (bookWeight.get(parsed.book) || 0) + w);
    const parasha = findParashaForVerse(
      parsed.book,
      parsed.chapter,
      parsed.verse
    );
    if (parasha) {
      parashaWeight.set(
        parasha.name,
        (parashaWeight.get(parasha.name) || 0) + w
      );
      parashotTouched.add(parasha.name);
    }
  }

  // Aliyah slot opens also warm their parasha / book
  for (const [key, row] of aliyahOpens) {
    const parsed = parseParashaAliyahKey(key);
    if (!parsed) continue;
    const w = row.open_count || 1;
    const parasha = TORAH_PARASHOT.find((p) => p.name === parsed.parasha);
    if (!parasha) continue;
    parashaWeight.set(
      parasha.name,
      (parashaWeight.get(parasha.name) || 0) + w
    );
    parashotTouched.add(parasha.name);
    bookWeight.set(parasha.book, (bookWeight.get(parasha.book) || 0) + w);
  }

  /** @type {Map<string, number>} unique verses opened per book */
  const versesOpenedByBook = new Map(TORAH_BOOKS.map((b) => [b.id, 0]));
  /** @type {Map<string, number>} unique verses opened per parasha */
  const versesOpenedByParasha = new Map(TORAH_PARASHOT.map((p) => [p.name, 0]));
  for (const [ref] of verseOpens) {
    const parsed = parseVerseRef(ref);
    if (!parsed) continue;
    versesOpenedByBook.set(
      parsed.book,
      (versesOpenedByBook.get(parsed.book) || 0) + 1
    );
    const parasha = findParashaForVerse(
      parsed.book,
      parsed.chapter,
      parsed.verse
    );
    if (parasha) {
      versesOpenedByParasha.set(
        parasha.name,
        (versesOpenedByParasha.get(parasha.name) || 0) + 1
      );
    }
  }

  const bookWeights = TORAH_BOOKS.map((b) => bookWeight.get(b.id) || 0);
  const bookHeat = heatNormalize(bookWeights);

  const parashotByBook = {};
  for (const book of TORAH_BOOKS) {
    const list = parashotForBook(book.id);
    const weights = list.map((p) => parashaWeight.get(p.name) || 0);
    const heats = heatNormalize(weights);
    parashotByBook[book.id] = list.map((p, i) => {
      const versesOpened = versesOpenedByParasha.get(p.name) || 0;
      const versesTotal =
        verseCountForRange(p.book, p.start, p.end) || 1;
      const progress = Math.min(1, versesOpened / versesTotal);
      return {
        id: p.id,
        name: p.name,
        weight: weights[i],
        heat: heats[i],
        versesOpened,
        versesTotal,
        progress
      };
    });
  }

  // Book brightness: each parasha is an equal share (Genesis = 12ths).
  // Verse completion fills that share; an opened aliyah counts as a full share.
  const byBook = TORAH_BOOKS.map((b, i) => {
    const list = parashotByBook[b.id] || [];
    const versesOpened = versesOpenedByBook.get(b.id) || 0;
    const versesTotal = verseCountForBook(b.id) || 1;
    const progress =
      list.length > 0
        ? list.reduce((sum, p) => {
            const fromVerses = Number(p.progress) || 0;
            const fromOpen = p.weight > 0 ? 1 : 0;
            return sum + Math.min(1, Math.max(fromVerses, fromOpen));
          }, 0) / list.length
        : Math.min(1, versesOpened / versesTotal);
    return {
      id: b.id,
      weight: bookWeights[i],
      heat: bookHeat[i],
      versesOpened,
      versesTotal,
      progress
    };
  });

  const aliyotByParasha = {};
  for (const p of TORAH_PARASHOT) {
    const weights = [];
    for (let n = 1; n <= ALIYOT_PER_PARASHA; n++) {
      const key = parashaAliyahKey(p.name, n);
      weights.push(key ? aliyahOpens.get(key)?.open_count || 0 : 0);
    }
    const heats = heatNormalize(weights);
    aliyotByParasha[p.name] = weights.map((weight, idx) => ({
      number: idx + 1,
      weight,
      heat: heats[idx],
      progress: weight > 0 ? 1 : 0
    }));
  }

  const versesOpened = verseOpens.size;
  const aliyotOpened = [...aliyahOpens.keys()].filter((k) =>
    parseParashaAliyahKey(k)
  ).length;
  const parashotOpened = parashotTouched.size;

  return {
    versesOpened,
    versesTotal: TORAH_VERSE_TOTAL,
    versesPct: Math.min(100, (versesOpened / TORAH_VERSE_TOTAL) * 100),
    parashotOpened,
    parashotTotal: TORAH_PARASHA_TOTAL,
    parashotPct: Math.min(100, (parashotOpened / TORAH_PARASHA_TOTAL) * 100),
    aliyotOpened,
    aliyotSoftCap: ALIYOT_SOFT_CAP,
    aliyotPct: Math.min(100, (aliyotOpened / ALIYOT_SOFT_CAP) * 100),
    byBook,
    parashotByBook,
    aliyotByParasha
  };
}
