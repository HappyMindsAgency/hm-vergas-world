// Invio email — SOLO server-side. Inviti docente e reset password (§11.3).
// Un solo punto di invio: per cambiare provider basta sostituire il transport qui sotto,
// la firma sendMail() resta il contratto per le API route.
import nodemailer from "nodemailer";
import { readFileSync, existsSync } from "node:fs";

const host = import.meta.env.SMTP_HOST;
const port = Number(import.meta.env.SMTP_PORT ?? 587);
const user = import.meta.env.SMTP_USER;
const pass = import.meta.env.SMTP_PASS;
// CA extra (solo locale): su questa macchina un AV intercetta il TLS con una root
// presente nello store Windows ma non nel bundle di Node. Esportata in un PEM e passata
// qui. Su Vercel la var non è settata → si usano le root native (nessuna interception).
const caFile = import.meta.env.SMTP_CA_FILE;

export const MAIL_FROM = import.meta.env.SMTP_FROM ?? "Verga's World <no-reply@vergasworld.it>";

// ponytail: transport unico riusato; se serviranno più mittenti/coda, qui il punto di estensione.
let transport: nodemailer.Transporter | null = null;
function getTransport(): nodemailer.Transporter {
  if (!host || !user || !pass) {
    throw new Error("Config SMTP mancante (SMTP_HOST/SMTP_USER/SMTP_PASS)");
  }
  const ca = caFile && existsSync(caFile) ? readFileSync(caFile, "utf8") : undefined;
  transport ??= nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    ...(ca ? { tls: { ca } } : {}),
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
