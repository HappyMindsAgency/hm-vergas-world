// Logica pura di "L'indizio di Verga" (ADR-4).
// L'oggetto ruota 1 volta/giorno su fuso Europe/Rome e si nasconde nel pin del
// luogo a cui è associato (campo `luogo`). Niente DOM qui: solo dati → testabile
// con node.
import { INDIZI, type Indizio } from "../data/indizi.ts";

export interface IndizioDelGiorno {
  /** Indice del giorno (giorni interi dall'epoch nel fuso di gioco). */
  dayIndex: number;
  indizio: Indizio;
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

/** Oggetto del giorno: rotazione stabile per tutta la giornata civile Rome. */
export function indizioDelGiorno(now: Date, timeZone: string): IndizioDelGiorno {
  const dayIndex = dayIndexInTimeZone(now, timeZone);
  const indizio = INDIZI[((dayIndex % INDIZI.length) + INDIZI.length) % INDIZI.length];
  return { dayIndex, indizio };
}
