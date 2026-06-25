// POST /api/materiali — (admin) carica un file su Supabase Storage e registra il
// materiale (tabella materials). Multipart: nome, category, file.
import type { APIRoute } from "astro";
import { json, badRequest, serverError, getServer, guardAdmin } from "../../../lib/admin/api";
import { MATERIALS_BUCKET } from "../../../config/admin";
import { MATERIAL_CATEGORIES } from "../../../config/game";
import type { MaterialCategory } from "../../../types/db";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const admin = await guardAdmin(cookies);
  if (admin instanceof Response) return admin;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return badRequest("Form non valido");
  }

  const nome = String(form.get("nome") ?? "").trim();
  const category = String(form.get("category") ?? "") as MaterialCategory;
  const file = form.get("file");

  if (!nome) return badRequest("Nome obbligatorio");
  if (!MATERIAL_CATEGORIES.includes(category)) return badRequest("Categoria non valida");
  if (!(file instanceof File) || file.size === 0) return badRequest("File mancante");

  let supabase;
  try {
    supabase = await getServer();
  } catch {
    return serverError("Configurazione server mancante");
  }

  // path univoco: timestamp + nome file sanitizzato.
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${Date.now()}-${safeName}`;

  const { error: uploadErr } = await supabase.storage
    .from(MATERIALS_BUCKET)
    .upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
  if (uploadErr) return serverError(`Upload non riuscito: ${uploadErr.message}`);

  const { data, error } = await supabase
    .from("materials")
    .insert({ nome, category, file_path: path, uploaded_by: admin.id })
    .select("id")
    .single();
  if (error) {
    // rimuovi il file orfano se l'insert fallisce.
    await supabase.storage.from(MATERIALS_BUCKET).remove([path]);
    return serverError("Registrazione materiale non riuscita");
  }

  return json({ ok: true, id: data.id }, 201);
};
