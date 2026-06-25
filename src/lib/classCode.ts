// Generazione codice classe: NOME-ISTITUTO-ANNO (es. "3B-GARIBALDI-2026").
// Univocità garantita dal vincolo UNIQUE in DB + suffisso numerico su collisione (§11.5).

function slug(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "") // via accenti
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "");
}

/** Codice base, senza suffisso anti-collisione. */
export function buildClassCode(nomeClasse: string, istituto: string, anno: number): string {
  return `${slug(nomeClasse)}-${slug(istituto)}-${anno}`;
}

/**
 * Dato il codice base e l'insieme dei codici già presi, ritorna il primo libero:
 * base, poi base-2, base-3, … La verifica di unicità reale resta il vincolo UNIQUE in DB;
 * questo serve a proporre un codice probabilmente libero lato server prima dell'insert.
 */
export function nextFreeClassCode(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base;
  for (let i = 2; ; i++) {
    const candidate = `${base}-${i}`;
    if (!taken.has(candidate)) return candidate;
  }
}
