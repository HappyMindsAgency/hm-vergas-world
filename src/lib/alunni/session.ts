// Sessione ALUNNO lato server — caso speciale ADR-2: NIENTE Supabase Auth.
// L'alunno non ha un account: dopo il login (access_code + display_name validati
// server-side) emettiamo un cookie HttpOnly FIRMATO (HMAC) e SENZA maxAge, così la
// sessione vive solo finché il browser è aperto (cookie di sessione). Nessun reset,
// nessun logout.
//
// Il cookie contiene solo l'identità minima necessaria (id alunno + nome + classe);
// la firma HMAC impedisce all'alunno di forgiare/alterare la propria sessione. Il
// segreto vive SOLO server-side (deriva dalla service_role key, mai nel bundle).
// Tutte le scritture passano comunque per le API route che rifanno la verifica.
import crypto from "node:crypto";
import type { AstroCookies } from "astro";
import { STUDENT_COOKIE } from "../../config/alunni";

export interface StudentSession {
  id: string;
  displayName: string;
  classId: string;
}

/**
 * Segreto di firma del cookie. Deriva dalla service_role key (solo server). Se
 * manca (build senza env) ritorna null: nessuna sessione valida può esistere, ma
 * niente crasha — coerente con la regola "degrada a stato vuoto senza env".
 */
function signingSecret(): string | null {
  const key = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  // Namespacing: separa questo uso da altri eventuali usi della stessa key.
  return crypto.createHash("sha256").update(`vw-alunno-session:${key}`).digest("hex");
}

function sign(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

/** Confronto a tempo costante per non far trapelare informazione dalla durata. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/** Serializza la sessione in `payload.signature` (entrambi base64url). */
export function encodeSession(session: StudentSession): string | null {
  const secret = signingSecret();
  if (!secret) return null;
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

/** Verifica firma e ritorna la sessione, o null se assente/manomessa/senza env. */
export function decodeSession(raw: string | undefined): StudentSession | null {
  if (!raw) return null;
  const secret = signingSecret();
  if (!secret) return null;
  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = raw.slice(0, dot);
  const signature = raw.slice(dot + 1);
  if (!safeEqual(signature, sign(payload, secret))) return null;
  try {
    const obj = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof obj?.id === "string" && typeof obj?.displayName === "string" && typeof obj?.classId === "string") {
      return obj as StudentSession;
    }
  } catch {
    /* payload corrotto */
  }
  return null;
}

/** Sessione alunno corrente (dalla cookie), o null. Non lancia mai. */
export function getStudentSession(cookies: AstroCookies): StudentSession | null {
  return decodeSession(cookies.get(STUDENT_COOKIE)?.value);
}

/**
 * Imposta il cookie di sessione. SENZA maxAge/expires → cookie di sessione: il
 * browser lo elimina alla chiusura (ADR-2: "vive finché il browser è aperto").
 */
export function setStudentSession(cookies: AstroCookies, session: StudentSession): boolean {
  const value = encodeSession(session);
  if (!value) return false;
  cookies.set(STUDENT_COOKIE, value, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    // niente maxAge: sessione effimera.
  });
  return true;
}
