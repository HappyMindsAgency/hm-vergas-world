// Invio email — SOLO server-side. Inviti docente e reset password (§11.3).
// Un solo punto di invio: per cambiare provider basta sostituire il transport qui sotto,
// la firma sendMail() resta il contratto per le API route.
import nodemailer from "nodemailer";

const host = import.meta.env.SMTP_HOST;
const port = Number(import.meta.env.SMTP_PORT ?? 587);
const user = import.meta.env.SMTP_USER;
const pass = import.meta.env.SMTP_PASS;

export const MAIL_FROM = import.meta.env.SMTP_FROM ?? "Verga's World <no-reply@vergasworld.it>";

// ponytail: transport unico riusato; se serviranno più mittenti/coda, qui il punto di estensione.
let transport: nodemailer.Transporter | null = null;
function getTransport(): nodemailer.Transporter {
  if (!host || !user || !pass) {
    throw new Error("Config SMTP mancante (SMTP_HOST/SMTP_USER/SMTP_PASS)");
  }
  transport ??= nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return transport;
}

export interface MailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/** Invia una email. Lancia se la config SMTP manca o l'invio fallisce. */
export async function sendMail({ to, subject, html, text }: MailInput): Promise<void> {
  await getTransport().sendMail({ from: MAIL_FROM, to, subject, html, text });
}
