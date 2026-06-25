/*
 * "L'indizio di Verga" — logica client (ADR-4).
 *
 * Il sito e' a build statica: la rotazione giornaliera NON puo' essere calcolata
 * a build time (sarebbe congelata alla data di build). Va calcolata nel browser
 * al momento della visita. Il pool oggetti e le costanti arrivano dal server in
 * un <script type="application/json" id="indizio-data"> generato da index.astro a
 * partire da src/data/indizi.ts e src/config/game.ts (fonte unica dei dati).
 *
 * Questa logica rispecchia src/lib/indizioGiorno.ts (versione pura, testata con
 * node). Mantenere le due allineate: se cambia il seeding la' va aggiornato qui.
 */
(function () {
  const dataEl = document.getElementById("indizio-data");
  if (!dataEl) return;

  let config;
  try {
    config = JSON.parse(dataEl.textContent);
  } catch (e) {
    return;
  }

  const { indizi, timeZone, markerCount } = config;
  if (!Array.isArray(indizi) || indizi.length === 0) return;

  // --- logica pura (mirror di src/lib/indizioGiorno.ts) ---

  function localParts(now) {
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    const out = {};
    for (const p of fmt.formatToParts(now)) {
      if (p.type !== "literal") out[p.type] = Number(p.value);
    }
    return out;
  }

  function dayIndexInTimeZone(now) {
    const p = localParts(now);
    return Math.floor(Date.UTC(p.year, p.month - 1, p.day) / 86400000);
  }

  function msToNextMidnight(now) {
    const p = localParts(now);
    const elapsed = (p.hour * 3600 + p.minute * 60 + p.second) * 1000 + now.getMilliseconds();
    return 86400000 - elapsed;
  }

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function round(n) {
    return Math.round(n * 10) / 10;
  }

  function indizioDelGiorno(now) {
    const dayIndex = dayIndexInTimeZone(now);
    const indizio = indizi[(((dayIndex % indizi.length) + indizi.length) % indizi.length)];
    const correctSlot = Math.abs(dayIndex * 1103515245 + 12345) % markerCount;
    const rand = mulberry32((dayIndex + 1) * 2654435761);
    const markers = [];
    for (let i = 0; i < markerCount; i++) {
      markers.push({
        leftPct: round(18 + rand() * 64),
        topPct: round(22 + rand() * 52),
        correct: i === correctSlot,
      });
    }
    return { dayIndex, indizio, markers };
  }

  // --- DOM ---

  const map = document.querySelector("[data-clue-map]");
  const objName = document.querySelector("[data-clue-object]");
  const objImg = document.querySelector("[data-clue-image]");
  const countdownEl = document.querySelector("[data-clue-countdown]");
  const successModal = document.querySelector("[data-clue-success-modal]");
  const successText = document.querySelector("[data-clue-success-text]");
  const successTitle = document.querySelector("[data-clue-success-title]");
  const successClose = document.querySelector("[data-clue-close]");
  const successOverlay = successModal && successModal.querySelector("[data-modal-overlay]");

  const today = indizioDelGiorno(new Date());

  // Box dell'oggetto del giorno.
  if (objName) objName.textContent = today.indizio.nome;
  if (objImg) {
    objImg.src = today.indizio.immagine;
    objImg.alt = today.indizio.nome;
  }

  // Piazza le lenti seedate dalla data sulla mappa.
  if (map) {
    map.querySelectorAll("[data-clue-marker]").forEach((n) => n.remove());
    today.markers.forEach((m) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "clue-marker";
      btn.dataset.clueMarker = "";
      btn.style.left = m.leftPct + "%";
      btn.style.top = m.topPct + "%";
      btn.setAttribute("aria-label", "Cerca qui l'indizio di Verga");
      btn.innerHTML = '<span aria-hidden="true">🔍</span>';
      btn.addEventListener("click", () => onMarkerClick(m, btn));
      map.appendChild(btn);
    });
  }

  function onMarkerClick(marker, btn) {
    if (marker.correct) {
      btn.classList.add("is-correct");
      openModal(
        "Bravo! Hai trovato l'indizio!",
        today.indizio.descrizioneStoria + " (" + today.indizio.storiaTitolo + ")",
      );
    } else {
      btn.classList.add("is-wrong");
      openModal("Ritenta, sarai più fortunato!", "Questa non è la lente giusta. Riprova con un'altra zona della mappa.");
    }
  }

  function openModal(title, text) {
    if (!successModal) return;
    if (successTitle) successTitle.textContent = title;
    if (successText) successText.textContent = text;
    successModal.setAttribute("aria-hidden", "false");
    if (successClose) successClose.focus();
  }

  function closeModal() {
    if (successModal) successModal.setAttribute("aria-hidden", "true");
  }

  if (successClose) successClose.addEventListener("click", closeModal);
  if (successOverlay) successOverlay.addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && successModal && successModal.getAttribute("aria-hidden") === "false") {
      closeModal();
    }
  });

  // Countdown al prossimo oggetto (mezzanotte fuso di gioco).
  function renderCountdown() {
    if (!countdownEl) return;
    let ms = msToNextMidnight(new Date());
    if (ms <= 1000) {
      // Scaduto: ricarica per ruotare all'oggetto del nuovo giorno.
      location.reload();
      return;
    }
    const totalSec = Math.floor(ms / 1000);
    const h = String(Math.floor(totalSec / 3600)).padStart(2, "0");
    const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
    const s = String(totalSec % 60).padStart(2, "0");
    countdownEl.textContent = h + ":" + m + ":" + s;
  }
  renderCountdown();
  setInterval(renderCountdown, 1000);
})();
