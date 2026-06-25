// Scambia l'access_token Supabase (ottenuto lato client con la anon key) con un
// cookie HttpOnly `sb-teacher-token`. Valida che l'utente esista e abbia
// role='teacher' E status='active' (un docente solo invitato/disattivato non entra).
import type { APIRoute } from "astro";
import { json, badRequest, unauthorized, serverError, getServer } from "../../../lib/docenti/api";
import { TEACHER_COOKIE } from "../../../lib/docenti/session";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  let accessToken: string;
  try {
    const body = await request.json();
    accessToken = String(body.accessToken ?? "");
  } catch {
    return badRequest("Body non valido");
  }
  if (!accessToken) return badRequest("Token mancante");

  let supabase;
  try {
    supabase = await getServer();
  } catch {
    return serverError("Configurazione server mancante");
  }

  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) return unauthorized();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", data.user.id)
    .single();

  if (!profile || profile.role !== "teacher") {
    return json({ error: "Account non docente" }, 403);
  }
  if (profile.status !== "active") {
    return json({ error: "Registrazione non completata. Usa il link di invito." }, 403);
  }

  // segna l'accesso (best-effort, non blocca il login).
  await supabase.from("profiles").update({ last_login_at: new Date().toISOString() }).eq("id", data.user.id);

  cookies.set(TEACHER_COOKIE, accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });

  return json({ ok: true });
};
