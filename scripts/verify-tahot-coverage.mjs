#!/usr/bin/env node
/**
 * Audit built TAHOT books against the STEPBible source.
 *
 * Catches Eng/Heb ref gaps (e.g. Gen.32.3(32.4) never indexed) and
 * missing chapter holes.
 *
 * Usage:
 *   node scripts/verify-tahot-coverage.mjs
 *   npm run verify:tahot
 */

import { readFile } from "fs/promises";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { parseRefField } from "./lib/parse-tahot.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SOURCE = join(ROOT, "vendor", "tahot-gen-deu.txt");
const BOOKS_DIR = join(ROOT, "data", "tahot", "books");

const BOOK_FILES = {
  Genesis: "genesis.json",
  Exodus: "exodus.json",
  Leviticus: "leviticus.json",
  Numbers: "numbers.json",
  Deuteronomy: "deuteronomy.json"
};

const HEADER = "Eng (Heb) Ref & Type";
const DATA_ROW_START =
  /^(Gen|Exo|Lev|Num|Deu)\.\d+\.\d+(?:\(\d+\.\d+\))?#\d+=/;

function chapterGaps(verseRefs) {
  const byBook = new Map();
  for (const ref of verseRefs) {
    const [book, ch] = ref.split(".");
    if (!byBook.has(book)) byBook.set(book, new Set());
    byBook.get(book).add(Number(ch));
  }

  const gaps = [];
  for (const [book, chapters] of byBook) {
    const sorted = [...chapters].sort((a, b) => a - b);
    for (let ch = sorted[0]; ch <= sorted[sorted.length - 1]; ch++) {
      if (!chapters.has(ch)) gaps.push(`${book}.${ch}`);
    }
  }
  return gaps;
}

async function loadBuiltVerses() {
  const built = new Set();
  const empty = [];

  for (const [book, file] of Object.entries(BOOK_FILES)) {
    const data = JSON.parse(await readFile(join(BOOKS_DIR, file), "utf8"));
    for (const [ref, tokens] of Object.entries(data)) {
      built.add(ref);
      if (!Array.isArray(tokens) || tokens.length === 0) empty.push(ref);
      if (!ref.startsWith(`${book}.`)) {
        empty.push(`wrong-book-key:${ref}`);
      }
    }
  }

  return { built, empty };
}

async function scanSource() {
  const text = await readFile(SOURCE, "utf8");
  let inData = false;
  const expected = new Set();
  const divergent = new Set();
  const unparsed = [];
  let dataRows = 0;

  for (const line of text.split("\n")) {
    if (line.startsWith(HEADER)) {
      inData = true;
      continue;
    }
    if (!inData) continue;
    if (!DATA_ROW_START.test(line)) continue;

    dataRows += 1;
    const ref = parseRefField(line);
    if (!ref) {
      unparsed.push(line.slice(0, 48));
      continue;
    }

    expected.add(ref.verseRef);
    if (/\.\d+\.\d+\(\d+\.\d+\)#/.test(line)) {
      divergent.add(ref.verseRef);
    }
  }

  return { expected, divergent, unparsed, dataRows };
}

function sample(set, n = 12) {
  return [...set].slice(0, n);
}

async function main() {
  const { expected, divergent, unparsed, dataRows } = await scanSource();
  const { built, empty } = await loadBuiltVerses();

  const missing = [...expected].filter((ref) => !built.has(ref)).sort();
  const extra = [...built].filter((ref) => !expected.has(ref)).sort();
  const gaps = chapterGaps(built);
  const divergentMissing = [...divergent]
    .filter((ref) => !built.has(ref))
    .sort();

  console.log("TAHOT coverage audit");
  console.log("────────────────────");
  console.log(`Source data rows:     ${dataRows}`);
  console.log(`Source verse refs:    ${expected.size}`);
  console.log(`  Eng≠Heb verses:     ${divergent.size}`);
  console.log(`Built verse refs:     ${built.size}`);
  console.log(`Unparsed source rows: ${unparsed.length}`);
  console.log(`Missing from built:   ${missing.length}`);
  console.log(`Extra in built:       ${extra.length}`);
  console.log(`Empty token verses:   ${empty.length}`);
  console.log(`Chapter gaps:         ${gaps.length}`);
  console.log(`Divergent missing:    ${divergentMissing.length}`);

  if (unparsed.length) {
    console.log("\nUnparsed samples:");
    for (const row of sample(unparsed)) console.log(`  ${row}`);
  }
  if (missing.length) {
    console.log("\nMissing verse samples:");
    for (const ref of sample(missing)) console.log(`  ${ref}`);
  }
  if (divergentMissing.length) {
    console.log("\nMissing Eng≠Heb verse samples:");
    for (const ref of sample(divergentMissing)) console.log(`  ${ref}`);
  }
  if (gaps.length) {
    console.log("\nChapter gaps:");
    for (const gap of gaps) console.log(`  ${gap}`);
  }
  if (extra.length) {
    console.log("\nExtra built samples:");
    for (const ref of sample(extra)) console.log(`  ${ref}`);
  }

  const ok =
    unparsed.length === 0 &&
    missing.length === 0 &&
    empty.length === 0 &&
    gaps.length === 0 &&
    divergentMissing.length === 0;

  if (ok) {
    console.log("\nOK — all source verses present; no Eng/Heb gaps.");
    process.exit(0);
  }

  console.log("\nFAIL — coverage gaps found.");
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
