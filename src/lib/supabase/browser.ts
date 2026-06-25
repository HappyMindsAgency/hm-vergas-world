// Client Supabase per il BROWSER: solo anon key. Mai service_role qui.
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.PUBLIC_SUPABASE_URL;
const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error("Mancano PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY");
}

export const supabaseBrowser = createClient(url, anonKey);
