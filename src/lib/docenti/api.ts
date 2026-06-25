// Helper condivisi per le API route docente: risposte JSON, accesso lazy al
// client server-side, guard teacher. Specchio di lib/admin/api.ts.
import type { AstroCookies } from "astro";
import { requireTeacher } from "./session";
import type { Profile } from "../../types/db";

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const badRequest = (msg: string) => json({ error: msg }, 400);
export const unauthorized = () => json({ error: "Non autorizzato" }, 401);
export const serverError = (msg = "Errore interno") => json({ error: msg }, 500);

/** Import dinamico di supabaseServer (isolato qui: lancia se mancano le env). */
export async function getServer() {
  const { supabaseServer } = await import("../supabase/server");
  return supabaseServer;
}

/** Guard: ritorna il profilo docente o una Response 401 già pronta. */
export async function guardTeacher(cookies: AstroCookies): Promise<Profile | Response> {
  const teacher = await requireTeacher(cookies);
  if (!teacher) return unauthorized();
  return teacher;
}
