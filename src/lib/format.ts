// Helper condivisi di formattazione. Usati da Docenti (lista alunni) e Alunni (login).

/**
 * Nome alunno → forma privacy: primo nome intero, resto in iniziali puntate.
 *   "Marco Rossi"          → "Marco R."
 *   "Marco Antonio Rossi"  → "Marco A. R."
 *   "Marco"                → "Marco"
 */
export function formatStudentName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  const [first, ...rest] = parts;
  const initials = rest.map((w) => `${w[0].toUpperCase()}.`);
  return [first, ...initials].join(" ");
}
