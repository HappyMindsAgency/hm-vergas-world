// Self-check dei helper condivisi. Run: node --experimental-strip-types src/lib/helpers.check.ts
import assert from "node:assert/strict";
import { formatStudentName } from "./format.ts";
import { buildClassCode, nextFreeClassCode } from "./classCode.ts";

assert.equal(formatStudentName("Marco Rossi"), "Marco R.");
assert.equal(formatStudentName("Marco Antonio Rossi"), "Marco A. R.");
assert.equal(formatStudentName("Marco"), "Marco");
assert.equal(formatStudentName("  giulia  de  luca "), "giulia D. L.");

assert.equal(buildClassCode("3B", "Garibaldi", 2026), "3B-GARIBALDI-2026");
assert.equal(buildClassCode("3 B", "Niccolò Tommaseo", 2026), "3B-NICCOLOTOMMASEO-2026");

const taken = new Set(["3B-GARIBALDI-2026", "3B-GARIBALDI-2026-2"]);
assert.equal(nextFreeClassCode("3B-GARIBALDI-2026", taken), "3B-GARIBALDI-2026-3");
assert.equal(nextFreeClassCode("4A-VERGA-2026", taken), "4A-VERGA-2026");

console.log("helpers.check OK");
