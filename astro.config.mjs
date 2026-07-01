import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel";

// https://astro.build/config
export default defineConfig({
  // On-demand (SSR) di default: il frontend pubblico non è più prerenderizzato, così
  // il middleware (modalità manutenzione) gira a RUNTIME su ogni pagina, dentro la
  // funzione SSR. Tutte le route sono on-demand → NON serve edgeMiddleware (anzi:
  // all'edge il `context.rewrite` verso /maintenance rendeva pagina bianca in prod).
  output: "server",
  adapter: vercel(),
  // Dominio custom di produzione. Usato per canonical, Open Graph e come origine
  // dei link nelle email (via import.meta.env.SITE in src/lib/siteUrl.ts).
  // Override runtime possibile con la env var PUBLIC_SITE_URL su Vercel.
  site: "https://vergasworld.incunziria.eu",
  build: {
    inlineStylesheets: "auto",
  },
  compressHTML: true,
});
