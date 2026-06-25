// Sessione docente lato server (Supabase Auth, email+password). Specchio di
// lib/admin/session.ts ma per role='teacher'.
//
// Il login client (supabaseBrowser) ottiene una sessione e ne salva l'access_token
// in un cookie HttpOnly `sb-teacher-token` (set da /api/insegnante/session). Le
// pagine/route docente validano il token con il client service_role e verificano
// role='teacher' su profiles. Import di supabaseServer SEMPRE dinamico (lancia se
// mancano le env → build senza DB non deve crashare).
import type { AstroCookies } from "astro";
import type { Profile } from "../../types/db";

export const TEACHER_COOKIE = "sb-teacher-token";

/**
 * Profilo docente autenticato, o null se non autenticato / non teacher / config
 * mancante. Non lancia mai: usabile sia nelle pagine sia nelle API route.
 */
export async function getTeacherProfile(cookies: AstroCookies): Promise<Profile | null> {
  const token = cookies.get(TEACHER_COOKIE)?.value;
  if (!token) return null;

  let supabaseServer;
  try {
    ({ supabaseServer } = await import("../supabase/server"));
  } catch {
    return null;
  }

  const { data, error } = await supabaseServer.auth.getUser(token);
  if (error || !data.user) return null;

  const { data: profile } = await supabaseServer
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .single();

  if (!profile || profile.role !== "teacher") return null;
  return profile as Profile;
}

/** True (profilo) se la richiesta proviene da un docente autenticato. */
export async function requireTeacher(cookies: AstroCookies): Promise<Profile | null> {
  return getTeacherProfile(cookies);
}
