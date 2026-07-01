// Middleware globale — Modalità manutenzione.
// L'interruttore è MAINTENANCE_ENABLED in src/config/maintenance.ts: true → OGNI
// pagina/route mostra la splash /maintenance (rewrite, status 503), tranne chi ha
// il bypass. Il bypass si attiva aprendo un URL con ?bypass=<token>: viene poi
// memorizzato in un cookie per le pagine successive.
//
// Gira a runtime su OGNI pagina DENTRO la funzione SSR, perché il sito è SSR
// (astro.config: output:'server'). NIENTE edgeMiddleware: all'edge il `context.rewrite`
// verso /maintenance dava pagina bianca in produzione; nella funzione SSR (come in dev)
// funziona. Tutte le route sono on-demand, quindi non serve un gate all'edge.
//
// NB storico: con le pagine PRERENDERIZZATE il middleware NON girava a runtime (le
// serviva il filesystem prima del middleware) → manutenzione/bypass inefficaci sul
// pubblico. Risolto passando a output:'server'. Non reintrodurre `prerender = true`
// sulle pagine pubbliche senza ripensare questo gate.
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
