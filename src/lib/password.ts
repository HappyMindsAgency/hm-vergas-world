// Generazione di una password forte per il completamento registrazione docente (§9.3).
// Usata SOLO lato client (Web Crypto): suggerisce una password, non la valida lato server.
import { STRONG_PASSWORD_ALPHABET, STRONG_PASSWORD_LENGTH } from "../config/docenti";

/**
 * Password casuale di `length` caratteri dall'alfabeto configurato.
 * Usa crypto.getRandomValues per entropia reale (no Math.random).
 * Rifiuta i byte fuori dall'intervallo uniforme per evitare bias del modulo.
 */
export function generateStrongPassword(length = STRONG_PASSWORD_LENGTH): string {
  const alphabet = STRONG_PASSWORD_ALPHABET;
  const max = Math.floor(256 / alphabet.length) * alphabet.length;
  const out: string[] = [];
  const buf = new Uint8Array(1);
  while (out.length < length) {
    crypto.getRandomValues(buf);
    if (buf[0] < max) out.push(alphabet[buf[0] % alphabet.length]);
  }
  return out.join("");
}
