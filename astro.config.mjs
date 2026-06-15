import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  // URL provvisorio Vercel: aggiornare col dominio finale (custom o .vercel.app reale)
  // quando il progetto sara' creato. Usato per canonical e Open Graph.
  site: "https://hm-vergas-world.vercel.app",
  // Il redirect /insegnante -> /insegnante/dashboard e' gestito a livello
  // HTTP da Vercel (vercel.json, 308) invece che da una pagina meta-refresh.
  build: {
    inlineStylesheets: "auto",
  },
  compressHTML: true,
});
