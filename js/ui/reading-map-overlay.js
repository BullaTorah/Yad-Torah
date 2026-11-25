import { isLoggedIn } from "../core/auth.js";
import {
  getReadingMapStats,
  loadReadingMap,
  onReadingMapChange,
  TORAH_BOOKS
} from "../core/reading-map.js";
import { parashotForBook, ALIYOT_PER_PARASHA } from "../core/torah-parashot.js";
import {
  findCatalogParasha,
  getAliyahRefsForParasha
} from "../core/parasha-aliyot.js";
import { openAuthPanel } from "./auth-panel.js";

/** @type {string | null} */
let activeBook = null;
let bound = false;
/** @type {(opts: { parashaName: string, aliyahNumber: number, aliyahRef: string, aliyahRefs: string[] }) => void | Promise<void>} */
let onOpenAliyah = null;
/** @type {{ parasha: object, aliyahNumber: number } | null} */
let pendingOpen = null;

function els() {
  return {
    panel: document.getElementById("readingMapPanel"),
    guest: document.getElementById("readingMapGuest"),
    body: document.getElementById("readingMapBody"),
    bars: document.getElementById("readingMapBars"),
    backBtn: document.getElementById("readingMapBackBtn"),
    bookTitle: document.getElementById("readingMapBookTitle"),
    heat: document.getElementById("readingMapHeat"),
    confirm: document.getElementById("readingMapConfirm"),
    confirmLabel: document.getElementById("readingMapConfirmLabel"),
    confirmOpen: document.getElementById("readingMapConfirmOpen")
  };
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function paintSummaryBars(stats) {
  const { bars } = els();
  if (!bars) return;

  const rows = [
    {
      label: "Verses",
      meta: `${stats.versesOpened.toLocaleString()} / ${stats.versesTotal.toLocaleString()}`,
      pct: stats.versesPct
    },
    {
      label: "Parashot",
      meta: `${stats.parashotOpened.toLocaleString()} / ${stats.parashotTotal.toLocaleString()}`,
      pct: stats.parashotPct
    },
    {
      label: "Aliyot",
      meta: `${stats.aliyotOpened.toLocaleString()} opened`,
      pct: stats.aliyotPct
    }
  ];

  bars.innerHTML = rows
    .map(
      (row) => `
    <div class="reading-map-bar">
      <div class="reading-map-bar-label">
        <span>${row.label}</span>
        <span class="reading-map-bar-meta">${row.meta}</span>
      </div>
      <div class="reading-map-bar-track" aria-hidden="true">
        <div class="reading-map-bar-fill" style="width:${row.pct.toFixed(2)}%"></div>
      </div>
    </div>`
    )
    .join("");
}


function aliyahColsHtml({ visible = true } = {}) {
  return `
    <div class="reading-map-aliyah-cols${visible ? "" : " is-spacer"}" aria-hidden="true">
      ${Array.from(
        { length: ALIYOT_PER_PARASHA },
        (_, i) => `<span class="reading-map-aliyah-col">${i + 1}</span>`
      ).join("")}
    </div>`;
}

function paintBookBars(stats) {
  const { heat, backBtn, bookTitle } = els();
  if (!heat) return;
  if (backBtn) backBtn.hidden = true;
  if (bookTitle) {
    bookTitle.hidden = true;
    bookTitle.textContent = "";
  }

  heat.className = "reading-map-heat reading-map-heat-books";
  const byBook = Object.fromEntries(
    (stats.byBook || []).map((b) => [b.id, b])
  );
  heat.innerHTML =
    aliyahColsHtml({ visible: false }) +
    TORAH_BOOKS.map((book) => {
      const list = stats.parashotByBook[book.id] || [];
      const opened = list.filter((p) => p.weight > 0).length;
      const total = list.length || 1;
      const row = byBook[book.id];
      const progress = Math.min(1, Math.max(0, Number(row?.progress) || 0));
      return `
    <button type="button" class="reading-map-book-bar" data-book="${escapeHtml(book.id)}"
      aria-label="${escapeHtml(book.id)}, ${opened} of ${total} parashot">
      <div class="reading-map-book-bar-track" aria-hidden="true">
        <div class="reading-map-book-bar-fill" style="width:100%;opacity:${progress.toFixed(4)}"></div>
      </div>
      <span class="reading-map-book-bar-label">
        <span>${escapeHtml(book.id)}</span>
        <span class="reading-map-bar-meta">${opened} / ${total}</span>
      </span>
    </button>`;
    }).join("");
}

function paintParashaBars(stats, bookId) {
  const { heat, backBtn, bookTitle } = els();
  if (!heat) return;
  if (backBtn) backBtn.hidden = false;
  if (bookTitle) {
    bookTitle.hidden = false;
    bookTitle.textContent = bookId || "";
  }

  const list = stats.parashotByBook[bookId] || parashotForBook(bookId);
  heat.className = "reading-map-heat reading-map-heat-parashot";
  const rows = list
    .map((p) => {
      const name = p.name;
      const aliyot = stats.aliyotByParasha[name] || [];
      const chunks = Array.from({ length: ALIYOT_PER_PARASHA }, (_, i) => {
        const row = aliyot[i] || {
          number: i + 1,
          weight: 0,
          progress: 0
        };
        const progress = Math.min(
          1,
          Math.max(0, Number(row.progress) || (row.weight > 0 ? 1 : 0))
        );
        const on = progress > 0;
        return `
        <button type="button" class="reading-map-aliyah-chunk${on ? " is-read" : ""}"
          data-parasha="${escapeHtml(name)}"
          data-aliyah="${row.number}"
          style="${on ? `opacity:${progress.toFixed(4)}` : ""}"
          aria-label="${escapeHtml(name)} aliyah ${row.number}${on ? ", opened" : ""}"></button>`;
      }).join("");

      return `
      <div class="reading-map-parasha-row">
        <div class="reading-map-parasha-chunks" role="group" aria-label="${escapeHtml(name)} aliyot">
          ${chunks}
        </div>
        <span class="reading-map-parasha-name">${escapeHtml(name)}</span>
      </div>`;
    })
    .join("");
  heat.innerHTML = aliyahColsHtml({ visible: true }) + rows;
}

function render() {
  const { guest, body } = els();
  if (!isLoggedIn()) {
    if (guest) guest.hidden = false;
    if (body) body.hidden = true;
    return;
  }
  if (guest) guest.hidden = true;
  if (body) body.hidden = false;

  const stats = getReadingMapStats();
  paintSummaryBars(stats);
  if (activeBook) paintParashaBars(stats, activeBook);
  else paintBookBars(stats);
}

function hideAliyahConfirm() {
  const { confirm } = els();
  pendingOpen = null;
  if (confirm) confirm.hidden = true;
}

function showAliyahConfirm(parasha, aliyahNumber) {
  const { confirm, confirmLabel } = els();
  if (!confirm || !confirmLabel) return;
  pendingOpen = { parasha, aliyahNumber };
  confirmLabel.textContent = `${parasha.name} · ${aliyahNumber}`;
  confirm.hidden = false;
}

async function openPendingAliyah() {
  if (!pendingOpen) return;
  const { parasha, aliyahNumber } = pendingOpen;
  hideAliyahConfirm();

  try {
    const refs = await getAliyahRefsForParasha(parasha);
    const aliyahRef = refs[aliyahNumber - 1];
    if (!aliyahRef) {
      window.alert("Could not load that aliyah.");
      return;
    }
    hideReadingMapOverlay();
    await onOpenAliyah?.({
      parashaName: parasha.name,
      aliyahNumber,
      aliyahRef,
      aliyahRefs: refs
    });
  } catch (err) {
    window.alert(err?.message || "Could not open that aliyah.");
  }
}

function handleAliyahChunkClick(parashaName, aliyahNumber) {
  const parasha = findCatalogParasha(parashaName);
  if (!parasha) {
    window.alert("Could not find that parasha.");
    return;
  }
  showAliyahConfirm(parasha, aliyahNumber);
}

export function hideReadingMapOverlay() {
  const { panel } = els();
  hideAliyahConfirm();
  if (panel) panel.hidden = true;
  activeBook = null;
}

export async function showReadingMapOverlay() {
  const { panel } = els();
  if (!panel) return;

  if (!isLoggedIn()) {
    openAuthPanel();
    return;
  }

  activeBook = null;
  panel.hidden = false;
  render();
  try {
    await loadReadingMap();
  } catch {
    /* cache ok */
  }
  render();
}

export function initReadingMapOverlay(options = {}) {
  if (bound) return;
  bound = true;
  onOpenAliyah = options.onOpenAliyah || null;

  const { panel, heat, backBtn, confirm, confirmOpen } = els();
  if (!panel) return;

  panel.querySelectorAll("[data-reading-map-close]").forEach((el) => {
    el.addEventListener("click", () => hideReadingMapOverlay());
  });

  document
    .getElementById("readingMapSignInBtn")
    ?.addEventListener("click", () => {
      hideReadingMapOverlay();
      openAuthPanel();
    });

  backBtn?.addEventListener("click", () => {
    hideAliyahConfirm();
    activeBook = null;
    render();
  });

  confirm?.querySelectorAll("[data-reading-map-confirm-cancel]").forEach((el) => {
    el.addEventListener("click", () => hideAliyahConfirm());
  });
  confirmOpen?.addEventListener("click", () => {
    void openPendingAliyah();
  });

  heat?.addEventListener("click", (e) => {
    const bookBtn = e.target.closest("[data-book]");
    if (bookBtn && heat.contains(bookBtn)) {
      activeBook = bookBtn.dataset.book;
      render();
      return;
    }

    const chunk = e.target.closest("[data-parasha][data-aliyah]");
    if (chunk && heat.contains(chunk)) {
      const name = chunk.dataset.parasha;
      const num = Number(chunk.dataset.aliyah);
      void handleAliyahChunkClick(name, num);
    }
  });

  onReadingMapChange(() => {
    if (panel.hidden) return;
    render();
  });
}
