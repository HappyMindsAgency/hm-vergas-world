// Sessione admin lato server (Supabase Auth, email+password).
//
// Strategia: il login client (supabaseBrowser) ottiene una sessione e ne salva
// l'access_token in un cookie HttpOnly `sb-admin-token` (set dall'endpoint
// /api/museo/session). Le pagine/route admin validano il token con il client
// service_role e verificano role='admin' su profiles.
//
// Tutti gli import di supabaseServer sono DINAMICI: quel modulo lancia se mancano
// le env, quindi non deve essere valutato a import-time (build senza DB live).

import type { AstroCookies } from "astro";
import type { Profile } from "../../types/db";

export const ADMIN_COOKIE = "sb-admin-token";

export interface AdminContext {
  cookies: AstroCookies;
  request: Request;
}

/**
 * Ritorna il profilo admin autenticato, o null se non autenticato / non admin /
 * config mancante. Non lancia mai: usabile sia nelle pagine sia nelle API route.
 */
export async function getAdminProfile(cookies: AstroCookies): Promise<Profile | null> {
  const token = cookies.get(ADMIN_COOKIE)?.value;
  if (!token) return null;

  let supabaseServer;
  try {
    ({ supabaseServer } = await import("../supabase/server"));
  } catch {
    // env mancanti (es. build senza DB live): nessuna sessione valida.
    return null;
  }

  const { data, error } = await supabaseServer.auth.getUser(token);
  if (error || !data.user) return null;

  const { data: profile } = await supabaseServer
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .single();

  if (!profile || profile.role !== "admin") return null;
  return profile as Profile;
}

/** True se la richiesta proviene da un admin autenticato. */
export async function requireAdmin(cookies: AstroCookies): Promise<Profile | null> {
  return getAdminProfile(cookies);
}
