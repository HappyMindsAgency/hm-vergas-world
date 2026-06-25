// POST /api/museo/istituti — (admin) crea un istituto { nome, citta }.
// CRUD abilitato dalla RLS `institutes_admin` (is_admin()); qui si passa per
// service_role come le altre route admin, con guard esplicito.
import type { APIRoute } from "astro";
import { json, badRequest, serverError, getServer, guardAdmin } from "../../../../lib/admin/api";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const admin = await guardAdmin(cookies);
  if (admin instanceof Response) return admin;

  let raw: Record<string, unknown>;
  try {
    raw = await request.json();
  } catch {
    return badRequest("Body non valido");
  }

  const nome = typeof raw.nome === "string" ? raw.nome.trim() : "";
  const citta = typeof raw.citta === "string" ? raw.citta.trim() : "";
  if (!nome) return badRequest("Nome obbligatorio");
  if (!citta) return badRequest("Città obbligatoria");

  let supabase;
  try {
    supabase = await getServer();
  } catch {
    return serverError("Configurazione server mancante");
  }

  const { data, error } = await supabase
    .from("institutes")
    .insert({ nome, citta })
    .select("id")
    .single();
  if (error) return serverError("Creazione istituto non riuscita");

  return json({ ok: true, id: data.id }, 201);
};
