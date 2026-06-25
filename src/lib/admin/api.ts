// Helper condivisi per le API route admin: risposte JSON e accesso lazy al
// client server-side. Tenuti in un solo posto per non duplicare boilerplate.

import type { AstroCookies } from "astro";
import { requireAdmin } from "./session";
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

/**
 * Import dinamico di supabaseServer. Il modulo lancia se mancano le env: lo
 * isoliamo qui così le route non crashano a import-time durante build senza DB.
 */
export async function getServer() {
  const { supabaseServer } = await import("../supabase/server");
  return supabaseServer;
}

/** Guard: ritorna il profilo admin o una Response 401 già pronta. */
export async function guardAdmin(cookies: AstroCookies): Promise<Profile | Response> {
  const admin = await requireAdmin(cookies);
  if (!admin) return unauthorized();
  return admin;
}
