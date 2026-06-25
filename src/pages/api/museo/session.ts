// Scambia l'access_token Supabase (ottenuto lato client con la anon key) con un
// cookie HttpOnly. Valida che l'utente esista e abbia role='admin' prima di
// emettere il cookie: solo gli admin entrano nell'Area Museo.
import type { APIRoute } from "astro";
import { json, badRequest, unauthorized, serverError, getServer } from "../../../lib/admin/api";
import { ADMIN_COOKIE } from "../../../lib/admin/session";

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
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return json({ error: "Account non amministratore" }, 403);
  }

  cookies.set(ADMIN_COOKIE, accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    // Allineato alla durata della sessione Supabase (default 1h). Niente refresh
    // lato cookie: scaduto il token, il guard reindirizza al login.
    maxAge: 60 * 60,
  });

  return json({ ok: true });
};
