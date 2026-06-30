/*
 * "L'indizio di Verga" — logica client (ADR-4).
 *
 * Il sito e' a build statica: la rotazione giornaliera NON puo' essere calcolata
 * a build time (sarebbe congelata alla data di build). Va calcolata nel browser
 * al momento della visita. Il pool oggetti e le costanti arrivano dal server in
 * un <script type="application/json" id="indizio-data"> generato da index.astro a
 * partire da src/data/indizi.ts e src/config/game.ts (fonte unica dei dati).
 *
 * L'oggetto del giorno si nasconde nel pin del luogo a cui e' associato
 * (campo `luogo` in indizi.ts). indizio.js marca quel pin con data-found-*:
 * lo script della modale dei luoghi (in index.astro) mostra l'immagine
 * dell'oggetto e le congratulazioni quando quel pin viene aperto.
 *
 * Questa logica rispecchia src/lib/indizioGiorno.ts (versione pura, testata con
 * node). Mantenere le due allineate: se cambia il seeding va aggiornato qui.
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

  const { indizi, timeZone } = config;
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

  function indizioDelGiorno(now) {
    const dayIndex = dayIndexInTimeZone(now);
    const indizio = indizi[(((dayIndex % indizi.length) + indizi.length) % indizi.length)];
    return { dayIndex, indizio };
  }

  // --- DOM ---

  const objName = document.querySelector("[data-clue-object]");
  const objImg = document.querySelector("[data-clue-image]");
  const countdownEl = document.querySelector("[data-clue-countdown]");

  const today = indizioDelGiorno(new Date());

  // Box dell'oggetto del giorno.
  if (objName) objName.textContent = today.indizio.nome;
  if (objImg) {
    objImg.src = today.indizio.immagine;
    objImg.alt = today.indizio.nome;
  }

  // Nasconde l'oggetto nel pin del luogo associato: lo stesso `nome` di LUOGHI.
  // Lo script della modale (index.astro) legge questi attributi all'apertura.
  const pins = document.querySelectorAll("[data-luogo]");
  const pin = Array.prototype.find.call(pins, (p) => p.dataset.titolo === today.indizio.luogo);
  if (pin) {
    pin.dataset.foundName = today.indizio.nome;
    pin.dataset.foundImage = today.indizio.immagine;
    pin.dataset.foundText = today.indizio.descrizioneStoria;
  }

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
