// Invio email — SOLO server-side. Inviti docente e reset password (§11.3).
// Un solo punto di invio: per cambiare provider basta sostituire il transport qui sotto,
// la firma sendMail() resta il contratto per le API route.
import nodemailer from "nodemailer";
import { readFileSync, existsSync } from "node:fs";

const host = import.meta.env.SMTP_HOST;
const port = Number(import.meta.env.SMTP_PORT ?? 587);
const user = import.meta.env.SMTP_USER;
const pass = import.meta.env.SMTP_PASS;

// Il certificato del mail server può essere emesso per un FQDN diverso da SMTP_HOST
// (hosting condiviso Plesk: cert per pleskhappyminds.00gate.com, host we4italy.com).
// SMTP_SERVERNAME fa validare il cert contro il nome giusto SENZA disabilitare la verifica.
const serverName = import.meta.env.SMTP_SERVERNAME || host;
// CA extra (solo locale): su questa macchina un AV intercetta il TLS con una root
// presente nello store Windows ma non nel bundle di Node. Esportata in un PEM e passata
// qui. Su Vercel la var non è settata → si usano le root native (nessuna interception).
const caFile = import.meta.env.SMTP_CA_FILE;
// Escape hatch esplicito, default OFF: NON disabilitare la verifica salvo necessità.
const insecureTls = import.meta.env.SMTP_INSECURE_TLS === "true";

export const MAIL_FROM = import.meta.env.SMTP_FROM ?? "Verga's World <no-reply@vergasworld.it>";

function buildTlsOptions() {
  const tls: { servername?: string; ca?: string; rejectUnauthorized?: boolean } = {};
  if (serverName) tls.servername = serverName;
  if (caFile && existsSync(caFile)) tls.ca = readFileSync(caFile, "utf8");
  if (insecureTls) tls.rejectUnauthorized = false;
  return tls;
}

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
    tls: buildTlsOptions(),
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
