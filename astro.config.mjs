import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: "https://vergasworld.example",
  redirects: {
    "/insegnante": "/insegnante/dashboard",
  },
  build: {
    inlineStylesheets: "auto",
  },
  compressHTML: true,
});
