// Logica pura di "L'indizio di Verga" (ADR-4).
// L'oggetto ruota 1 volta/giorno su fuso Europe/Rome; i 3 marker "lente" hanno
// posizione SEEDATA dalla data (stabili a ogni reload nella giornata, non random);
// uno solo è quello buono. Niente DOM qui: solo dati → testabile con node.
import { INDIZI, type Indizio } from "../data/indizi.ts";

/** Una "lente" piazzata sulla mappa, in percentuali 0–100 dei lati. */
export interface MarkerPosition {
  /** Posizione orizzontale in % della larghezza mappa. */
  leftPct: number;
  /** Posizione verticale in % dell'altezza mappa. */
  topPct: number;
  /** true solo per la lente che nasconde l'indizio del giorno. */
  correct: boolean;
}

export interface IndizioDelGiorno {
  /** Indice del giorno (giorni interi dall'epoch nel fuso di gioco). */
  dayIndex: number;
  indizio: Indizio;
  markers: MarkerPosition[];
}

/**
 * Indice del giorno civile nel fuso indicato: numero di giorni interi
 * dall'epoch calcolati sulla mezzanotte locale di quel fuso. Stabile per
 * tutte le 24 ore della giornata locale.
 */
export function dayIndexInTimeZone(now: Date, timeZone: string): number {
  const ymd = localYmd(now, timeZone);
  // Date.UTC su una data "civile" → ms a mezzanotte; /giorno = indice stabile.
  const utcMidnight = Date.UTC(ymd.year, ymd.month - 1, ymd.day);
  return Math.floor(utcMidnight / 86_400_000);
}

/** Scompone una data nei suoi componenti Y/M/D/H/M nel fuso indicato. */
function localParts(now: Date, timeZone: string) {
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
  const parts: Record<string, string> = {};
  for (const p of fmt.formatToParts(now)) {
    if (p.type !== "literal") parts[p.type] = p.value;
  }
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

function localYmd(now: Date, timeZone: string) {
  const { year, month, day } = localParts(now, timeZone);
  return { year, month, day };
}

/**
 * Millisecondi che mancano alla prossima mezzanotte civile nel fuso indicato.
 * Usato per il countdown al prossimo oggetto.
 */
export function msToNextMidnight(now: Date, timeZone: string): number {
  const { hour, minute, second } = localParts(now, timeZone);
  const elapsed = (hour * 3600 + minute * 60 + second) * 1000 + now.getMilliseconds();
  return 86_400_000 - elapsed;
}

/** PRNG deterministico (mulberry32): stesso seed → stessa sequenza. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Posizioni dei marker seedate dal giorno: deterministiche (stabili a ogni
 * reload nella giornata) ma diverse di giorno in giorno. Una sola è "correct".
 * Le posizioni restano in un riquadro centrale della mappa per evitare i bordi.
 */
function seededMarkers(dayIndex: number, count: number, correctSlot: number): MarkerPosition[] {
  const rand = mulberry32((dayIndex + 1) * 2654435761);
  const markers: MarkerPosition[] = [];
  for (let i = 0; i < count; i++) {
    markers.push({
      leftPct: round(18 + rand() * 64), // 18%–82%
      topPct: round(22 + rand() * 52), // 22%–74%
      correct: i === correctSlot,
    });
  }
  return markers;
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Calcola tutto ciò che serve all'UI per la giornata: oggetto del giorno e
 * posizioni delle 3 lenti. `markerCount` è INDIZIO_MARKERS da config.
 */
export function indizioDelGiorno(
  now: Date,
  timeZone: string,
  markerCount: number,
): IndizioDelGiorno {
  const dayIndex = dayIndexInTimeZone(now, timeZone);
  const indizio = INDIZI[((dayIndex % INDIZI.length) + INDIZI.length) % INDIZI.length];
  // Slot vincente derivato dallo stesso seed → stabile nella giornata.
  const correctSlot = Math.abs(dayIndex * 1103515245 + 12345) % markerCount;
  const markers = seededMarkers(dayIndex, markerCount, correctSlot);
  return { dayIndex, indizio, markers };
}
