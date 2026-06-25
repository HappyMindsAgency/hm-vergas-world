import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel";

// https://astro.build/config
export default defineConfig({
  // Output statico di default (frontend pubblico prerenderizzato); le route che
  // richiedono server (Area Museo/Admin: SSR auth-gated + /api) usano
  // `export const prerender = false`. L'adapter Vercel serve queste route on-demand.
  // NB: aggiunta richiesta dalla Sezione 2 — vedi "Richieste di modifica" in
  // docs/INTEGRATION.md (l'intera area riservata è strutturalmente server-side).
  adapter: vercel(),
  // URL provvisorio Vercel: aggiornare col dominio finale (custom o .vercel.app reale)
  // quando il progetto sara' creato. Usato per canonical e Open Graph.
  site: "https://hm-vergas-world.vercel.app",
  build: {
    inlineStylesheets: "auto",
  },
  compressHTML: true,
});
