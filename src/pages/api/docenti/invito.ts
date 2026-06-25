// POST /api/docenti/invito — (admin) crea un profilo docente in attesa e invia
// l'email di invito con il link di completamento registrazione.
// Firma CONGELATA (INTEGRATION.md): body { nome, cognome, email, instituteId }.
//
// Flusso:
//  1) crea l'utente in auth.users (senza email Supabase) → ottiene l'id;
//  2) inserisce profiles(role='teacher', status='inactive') con quell'id;
//  3) genera un link di tipo "invite" e lo invia via sendMail (nodemailer, ADR-3);
//     il docente completa la registrazione su /invito (Fase 3).
import type { APIRoute } from "astro";
import { json, badRequest, serverError, getServer, guardAdmin } from "../../../lib/admin/api";
import { siteOrigin } from "../../../lib/siteUrl";

export const prerender = false;

interface InvitoBody {
  nome: string;
  cognome: string;
  email: string;
  instituteId: string;
}

export const POST: APIRoute = async ({ request, cookies, url }) => {
  const admin = await guardAdmin(cookies);
  if (admin instanceof Response) return admin;

  let body: InvitoBody;
  try {
    const raw = await request.json();
    body = {
      nome: String(raw.nome ?? "").trim(),
      cognome: String(raw.cognome ?? "").trim(),
      email: String(raw.email ?? "").trim().toLowerCase(),
      instituteId: String(raw.instituteId ?? "").trim(),
    };
  } catch {
    return badRequest("Body non valido");
  }

  if (!body.nome || !body.cognome) return badRequest("Nome e cognome obbligatori");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email)) return badRequest("Email non valida");
  if (!body.instituteId) return badRequest("Istituto obbligatorio");

  let supabase;
  try {
    supabase = await getServer();
  } catch {
    return serverError("Configurazione server mancante");
  }

  // 1) utente auth (email non confermata: la conferma avviene al completamento).
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email: body.email,
    email_confirm: false,
  });
  if (createErr || !created.user) {
    return badRequest(createErr?.message ?? "Impossibile creare l'utente (email già esistente?)");
  }
  const userId = created.user.id;

  // 2) profilo docente "in attesa".
  const { error: profileErr } = await supabase.from("profiles").insert({
    id: userId,
    role: "teacher",
    nome: body.nome,
    cognome: body.cognome,
    email: body.email,
    institute_id: body.instituteId,
    status: "inactive",
  });
  if (profileErr) {
    // rollback dell'utente auth se il profilo non si crea.
    await supabase.auth.admin.deleteUser(userId);
    return serverError("Impossibile creare il profilo docente");
  }

  // 3) link di invito + email (nodemailer). redirectTo verso la route /invito.
  const redirectTo = new URL("/invito", siteOrigin(url)).toString();
  const { data: linkData } = await supabase.auth.admin.generateLink({
    type: "invite",
    email: body.email,
    options: { redirectTo },
  });

  const inviteLink = linkData?.properties?.action_link ?? redirectTo;

  try {
    const { sendMail } = await import("../../../lib/mail");
    await sendMail({
      to: body.email,
      subject: "Invito all'Area Docenti — Verga's World",
      html: `<p>Ciao ${body.nome},</p>
        <p>il Museo ti ha invitato a Verga's World. Completa la registrazione dal link qui sotto:</p>
        <p><a href="${inviteLink}">Completa la registrazione</a></p>
        <p>A presto,<br/>Il team di Verga's World</p>`,
      text: `Ciao ${body.nome}, completa la registrazione: ${inviteLink}`,
    });
  } catch {
    // L'account è creato; segnaliamo solo il mancato invio così l'admin può reinviare.
    return json({ ok: true, emailSent: false, warning: "Profilo creato ma email non inviata" });
  }

  return json({ ok: true, emailSent: true, teacherId: userId }, 201);
};
