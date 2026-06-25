// POST /api/insegnante/completa-registrazione — completamento registrazione da
// invito (§9.3): il client ha già una sessione valida (dal link di invito/recovery)
// e ha impostato la password via supabaseBrowser.updateUser. Qui, lato server,
// validiamo il token e portiamo profiles.status a 'active'. Imposta anche il cookie
// di sessione docente così l'utente entra direttamente nel cruscotto.
//
// Perché server-side: status='active' è un cambio di stato di provisioning; lo
// facciamo con service_role dopo aver verificato l'identità dal token, senza
// fidarci del client.
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
    .select("role")
    .eq("id", data.user.id)
    .single();
  if (!profile || profile.role !== "teacher") {
    return json({ error: "Account non docente" }, 403);
  }

  // attiva il profilo: la registrazione è completa.
  const { error: updErr } = await supabase
    .from("profiles")
    .update({ status: "active", last_login_at: new Date().toISOString() })
    .eq("id", data.user.id);
  if (updErr) return serverError("Attivazione non riuscita");

  cookies.set(TEACHER_COOKIE, accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });

  return json({ ok: true });
};
