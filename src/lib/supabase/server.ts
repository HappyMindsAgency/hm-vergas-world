// Client Supabase SOLO server-side: usa la service_role key e bypassa RLS.
// Importarlo SOLO da API route / endpoint server. Non deve mai finire nel bundle client.
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.PUBLIC_SUPABASE_URL;
const serviceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error("Mancano PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (server)");
}

// Guardia: se per errore gira nel browser, fermati prima di esporre la chiave.
if (typeof window !== "undefined") {
  throw new Error("supabaseServer importato sul client: la service_role key non deve mai uscire dal server");
}

export const supabaseServer = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
