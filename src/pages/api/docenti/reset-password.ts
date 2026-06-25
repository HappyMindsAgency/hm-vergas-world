// POST /api/docenti/reset-password — body { email } → email di reset password.
// Firma CONGELATA (INTEGRATION.md). Aperto (non richiede auth): usato sia dal
// login admin sia dal dettaglio docente. Risposta sempre ok per non rivelare
// quali email sono registrate. Email via sendMail (nodemailer, ADR-3).
import type { APIRoute } from "astro";
import { json, badRequest, serverError, getServer } from "../../../lib/admin/api";

export const prerender = false;

export const POST: APIRoute = async ({ request, url }) => {
  let email: string;
  try {
    const raw = await request.json();
    email = String(raw.email ?? "").trim().toLowerCase();
  } catch {
    return badRequest("Body non valido");
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return badRequest("Email non valida");

  let supabase;
  try {
    supabase = await getServer();
  } catch {
    return serverError("Configurazione server mancante");
  }

  const redirectTo = new URL("/invito?reset=1", url.origin).toString();
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo },
  });

  // Se l'email non esiste, non lo riveliamo: rispondiamo ok comunque.
  if (error || !data?.properties?.action_link) {
    return json({ ok: true });
  }

  try {
    const { sendMail } = await import("../../../lib/mail");
    await sendMail({
      to: email,
      subject: "Reimposta la tua password — Verga's World",
      html: `<p>Hai richiesto di reimpostare la password.</p>
        <p><a href="${data.properties.action_link}">Reimposta la password</a></p>
        <p>Se non sei stato tu, ignora questa email.</p>`,
      text: `Reimposta la password: ${data.properties.action_link}`,
    });
  } catch {
    return serverError("Invio email non riuscito");
  }

  return json({ ok: true });
};
