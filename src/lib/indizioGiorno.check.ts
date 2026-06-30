// Self-check di indizioGiorno. Run: node --experimental-strip-types src/lib/indizioGiorno.check.ts
import assert from "node:assert/strict";
import { INDIZI } from "../data/indizi.ts";
import {
  dayIndexInTimeZone,
  indizioDelGiorno,
  msToNextMidnight,
} from "./indizioGiorno.ts";

const TZ = "Europe/Rome";

// Lo stesso istante deve dare lo stesso oggetto (idempotenza).
const t1 = new Date("2026-06-25T09:00:00Z");
const a = indizioDelGiorno(t1, TZ);
const b = indizioDelGiorno(t1, TZ);
assert.equal(a.indizio.nome, b.indizio.nome);

// Reload più tardi nella stessa giornata civile Rome → stesso oggetto.
const t1Later = new Date("2026-06-25T20:30:00Z"); // 22:30 Rome, stesso giorno
assert.equal(dayIndexInTimeZone(t1, TZ), dayIndexInTimeZone(t1Later, TZ));
assert.equal(indizioDelGiorno(t1Later, TZ).indizio.nome, a.indizio.nome, "oggetto stabile nella giornata");

// Giorno successivo → indice +1.
const t2 = new Date("2026-06-26T09:00:00Z");
assert.equal(dayIndexInTimeZone(t2, TZ), dayIndexInTimeZone(t1, TZ) + 1);

// La rotazione copre tutti gli oggetti nell'arco di N giorni.
const nomi = new Set<string>();
for (let d = 0; d < INDIZI.length; d++) {
  const day = new Date(t1.getTime() + d * 86_400_000);
  nomi.add(indizioDelGiorno(day, TZ).indizio.nome);
}
assert.equal(nomi.size, INDIZI.length, `${INDIZI.length} giorni → ${INDIZI.length} oggetti distinti`);

// Ogni oggetto si nasconde in un luogo: campo non vuoto e abbinato a un pin.
const LUOGHI = new Set([
  "Palazzo Verga",
  "I vicoli della Cunziria",
  "Il vicolo degli oggetti",
  "La grotta di Rosso",
  "La piazza della Morra",
  "La collina del nespolo",
  "Il panorama del ritorno",
]);
for (const ind of INDIZI) {
  assert.ok(LUOGHI.has(ind.luogo), `luogo "${ind.luogo}" deve combaciare con un pin LUOGHI (${ind.nome})`);
}

// Countdown: positivo e mai oltre 24h.
const ms = msToNextMidnight(t1, TZ);
assert.ok(ms > 0 && ms <= 86_400_000, "countdown in (0, 24h]");

console.log("indizioGiorno.check OK");
