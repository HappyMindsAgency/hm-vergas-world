// Helper condivisi per le API route alunno: risposte JSON, accesso lazy al client
// server-side, guard sessione. Specchio di lib/docenti/api.ts ma la sessione NON è
// Supabase Auth: è il cookie firmato (ADR-2).
import type { AstroCookies } from "astro";
import { getStudentSession, type StudentSession } from "./session";

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const badRequest = (msg: string) => json({ error: msg }, 400);
export const unauthorized = () => json({ error: "Non autorizzato" }, 401);
export const serverError = (msg = "Errore interno") => json({ error: msg }, 500);

/** Import dinamico di supabaseServer (lancia se mancano le env → gestire a monte). */
export async function getServer() {
  const { supabaseServer } = await import("../supabase/server");
  return supabaseServer;
}

/** Guard: ritorna la sessione alunno o una Response 401 già pronta. */
export function guardStudent(cookies: AstroCookies): StudentSession | Response {
  const session = getStudentSession(cookies);
  if (!session) return unauthorized();
  return session;
}
