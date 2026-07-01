import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel";

// https://astro.build/config
export default defineConfig({
  // On-demand (SSR) di default: il frontend pubblico non è più prerenderizzato, così
  // il middleware (modalità manutenzione) gira a RUNTIME su ogni pagina. Senza questo
  // le pagine statiche sono servite dal filesystem PRIMA del middleware → manutenzione
  // e bypass non si applicherebbero al pubblico. Le aree riservate erano già SSR.
  output: "server",
  // Output statico di default (frontend pubblico prerenderizzato); le route che
  // richiedono server (Area Museo/Admin: SSR auth-gated + /api) usano
  // `export const prerender = false`. L'adapter Vercel serve queste route on-demand.
  // NB: aggiunta richiesta dalla Sezione 2 — vedi "Richieste di modifica" in
  // docs/INTEGRATION.md (l'intera area riservata è strutturalmente server-side).
  // edgeMiddleware: il middleware (modalità manutenzione) gira come Vercel Edge
  // Middleware, così intercetta ANCHE le pagine statiche prerenderizzate a runtime.
  adapter: vercel({ edgeMiddleware: true }),
  // Dominio custom di produzione. Usato per canonical, Open Graph e come origine
  // dei link nelle email (via import.meta.env.SITE in src/lib/siteUrl.ts).
  // Override runtime possibile con la env var PUBLIC_SITE_URL su Vercel.
  site: "https://vergasworld.incunziria.eu",
  build: {
    inlineStylesheets: "auto",
  },
  compressHTML: true,
});
