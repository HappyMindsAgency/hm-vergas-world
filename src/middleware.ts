// Middleware globale — Modalità manutenzione.
// L'interruttore è MAINTENANCE_ENABLED in src/config/maintenance.ts: true → OGNI
// pagina/route mostra la splash /maintenance (rewrite, status 503), tranne chi ha
// il bypass. Il bypass si attiva aprendo un URL con ?bypass=<token>: viene poi
// memorizzato in un cookie per le pagine successive.
//
// NB: gira anche sulle pagine statiche perché il build lo estrae come Vercel Edge
// Middleware (astro.config: vercel({ edgeMiddleware: true })). Perciò qui usiamo
// solo Web API (niente Node).
//
// ⚠️ Dev vs prod: in `astro dev` le pagine PRERENDERIZZATE (frontend pubblico)
// arrivano al middleware SENZA query né cookie → il blocco 503 funziona ma il
// bypass NO. In produzione (edge middleware Vercel) la richiesta è completa e il
// bypass funziona. Quindi il bypass va testato sul sito deployato, non in dev.
import { defineMiddleware } from "astro:middleware";
import {
  MAINTENANCE_ENABLED,
  MAINTENANCE_BYPASS_TOKEN,
  MAINTENANCE_BYPASS_COOKIE,
  MAINTENANCE_BYPASS_PARAM,
  MAINTENANCE_BYPASS_DURATION_SECONDS,
} from "./config/maintenance";

const MAINTENANCE_PATH = "/maintenance";

export const onRequest = defineMiddleware(async (context, next) => {
  if (!MAINTENANCE_ENABLED) return next();

  const token = MAINTENANCE_BYPASS_TOKEN;
  const url = context.url;

  // La splash stessa deve poter essere renderizzata (no loop di rewrite).
  if (url.pathname === MAINTENANCE_PATH) return next();

  // 1) bypass appena passato via ?bypass=<token> → memorizza nel cookie e ripulisci
  // l'URL (302 senza il param), così il token non resta nella barra indirizzi /
  // cronologia / link condivisi. Gli altri eventuali query param si conservano.
  if (token && url.searchParams.get(MAINTENANCE_BYPASS_PARAM) === token) {
    context.cookies.set(MAINTENANCE_BYPASS_COOKIE, token, {
      httpOnly: true,
      secure: url.protocol === "https:", // in dev (http) resterebbe altrimenti non salvato
      sameSite: "lax",
      path: "/",
      maxAge: MAINTENANCE_BYPASS_DURATION_SECONDS,
    });
    const clean = new URLSearchParams(url.searchParams);
    clean.delete(MAINTENANCE_BYPASS_PARAM);
    const qs = clean.toString();
    return context.redirect(qs ? `${url.pathname}?${qs}` : url.pathname, 302);
  }
  // 2) bypass già concesso in una richiesta precedente (cookie).
  if (token && context.cookies.get(MAINTENANCE_BYPASS_COOKIE)?.value === token) {
    return next();
  }

  // 3) altrimenti: mostra la splash mantenendo l'URL richiesto.
  return context.rewrite(MAINTENANCE_PATH);
});
