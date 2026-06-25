// Self-check di indizioGiorno. Run: node --experimental-strip-types src/lib/indizioGiorno.check.ts
import assert from "node:assert/strict";
import { INDIZI } from "../data/indizi.ts";
import {
  dayIndexInTimeZone,
  indizioDelGiorno,
  msToNextMidnight,
} from "./indizioGiorno.ts";

const TZ = "Europe/Rome";
const MARKERS = 3;

// Lo stesso istante deve dare lo stesso giorno e gli stessi marker (idempotenza).
const t1 = new Date("2026-06-25T09:00:00Z");
const a = indizioDelGiorno(t1, TZ, MARKERS);
const b = indizioDelGiorno(t1, TZ, MARKERS);
assert.deepEqual(a.markers, b.markers, "marker stabili a parità di istante");
assert.equal(a.indizio.nome, b.indizio.nome);

// Reload più tardi nella stessa giornata civile Rome → stesso oggetto e marker.
const t1Later = new Date("2026-06-25T20:30:00Z"); // 22:30 Rome, stesso giorno
assert.equal(dayIndexInTimeZone(t1, TZ), dayIndexInTimeZone(t1Later, TZ));
const aLater = indizioDelGiorno(t1Later, TZ, MARKERS);
assert.deepEqual(a.markers, aLater.markers, "marker stabili nell'arco della giornata");

// Giorno successivo → indice +1 e (di norma) oggetto diverso nella rotazione.
const t2 = new Date("2026-06-26T09:00:00Z");
assert.equal(dayIndexInTimeZone(t2, TZ), dayIndexInTimeZone(t1, TZ) + 1);

// Esattamente un marker è quello buono.
assert.equal(a.markers.filter((m) => m.correct).length, 1, "una sola lente corretta");
assert.equal(a.markers.length, MARKERS);

// Le posizioni stanno dentro il riquadro centrale previsto.
for (const m of a.markers) {
  assert.ok(m.leftPct >= 18 && m.leftPct <= 82, "leftPct in range");
  assert.ok(m.topPct >= 22 && m.topPct <= 74, "topPct in range");
}

// La rotazione copre tutti e 7 gli oggetti nell'arco di 7 giorni.
const nomi = new Set<string>();
for (let d = 0; d < INDIZI.length; d++) {
  const day = new Date(t1.getTime() + d * 86_400_000);
  nomi.add(indizioDelGiorno(day, TZ, MARKERS).indizio.nome);
}
assert.equal(nomi.size, INDIZI.length, "7 giorni → 7 oggetti distinti");

// Countdown: positivo e mai oltre 24h.
const ms = msToNextMidnight(t1, TZ);
assert.ok(ms > 0 && ms <= 86_400_000, "countdown in (0, 24h]");

console.log("indizioGiorno.check OK");
