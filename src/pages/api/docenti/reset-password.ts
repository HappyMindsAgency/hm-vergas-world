// POST /api/docenti/reset-password — body { email } → email di reset password.
// Firma CONGELATA (INTEGRATION.md). Aperto (non richiede auth): usato sia dal
// login admin sia dal dettaglio docente. Risposta sempre ok per non rivelare
// quali email sono registrate. Email via sendMail (nodemailer, ADR-3).
import type { APIRoute } from "astro";
import { json, badRequest, serverError, getServer } from "../../../lib/admin/api";
import { siteOrigin } from "../../../lib/siteUrl";
import { confirmUrl, renderEmail } from "../../../lib/email/template";

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
  } catch (e) {
    console.error("[reset-password] getServer:", e);
    return serverError("Configurazione server mancante");
  }

  const origin = siteOrigin(url);
  const redirectTo = new URL("/invito?reset=1", origin).toString();
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo },
  });

  // Link a /auth/confirm sul dominio webapp (mai *.supabase.co), torna su /invito?reset=1.
  const resetLink = confirmUrl(origin, data?.properties, "/invito?reset=1");

  // Email inesistente → non lo riveliamo: rispondiamo ok. Ma se è un errore di
  // configurazione (non "user not found"), loggalo: altrimenti resta invisibile.
  if (error || !resetLink) {
    if (error && error.status !== 404) {
      console.error("[reset-password] generateLink:", error.status, error.message);
    }
    return json({ ok: true });
  }

  try {
    const { sendMail } = await import("../../../lib/mail");
    const { html, text } = renderEmail({
      origin,
      preheader: "Reimposta la password del tuo account Verga's World.",
      title: "Reimposta la tua password",
      bodyHtml: `<p>Hai richiesto di reimpostare la password del tuo account.</p>
        <p>Scegli una nuova password dal pulsante qui sotto. Se non sei stato tu, ignora questa email.</p>`,
      ctaLabel: "Reimposta la password",
      ctaUrl: resetLink,
      text: "Hai richiesto di reimpostare la password del tuo account Verga's World. Apri questo link per sceglierne una nuova:",
    });
    await sendMail({
      to: email,
      subject: "Reimposta la tua password — Verga's World",
      html,
      text,
    });
  } catch (e) {
    // Causa reale lato server (es. SMTP host/cert/auth); al client risposta generica.
    const err = e as { code?: string; message?: string };
    console.error("[reset-password] sendMail:", err.code ?? "", err.message ?? e);
    return serverError("Invio email non riuscito");
  }

  return json({ ok: true });
};
