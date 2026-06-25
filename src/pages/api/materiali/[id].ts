// PATCH/DELETE /api/materiali/:id — (admin) rinomina/cambia categoria, o elimina
// un materiale (riga + file su Storage; le assegnazioni vanno in cascata via FK).
import type { APIRoute } from "astro";
import { json, badRequest, serverError, getServer, guardAdmin } from "../../../lib/admin/api";
import { MATERIALS_BUCKET } from "../../../config/admin";
import { MATERIAL_CATEGORIES } from "../../../config/game";
import type { MaterialCategory } from "../../../types/db";

export const prerender = false;

export const PATCH: APIRoute = async ({ params, request, cookies }) => {
  const admin = await guardAdmin(cookies);
  if (admin instanceof Response) return admin;
  const id = params.id;
  if (!id) return badRequest("ID mancante");

  let raw: Record<string, unknown>;
  try {
    raw = await request.json();
  } catch {
    return badRequest("Body non valido");
  }

  const patch: Record<string, unknown> = {};
  if (typeof raw.nome === "string" && raw.nome.trim()) patch.nome = raw.nome.trim();
  if (typeof raw.category === "string") {
    if (!MATERIAL_CATEGORIES.includes(raw.category as MaterialCategory)) return badRequest("Categoria non valida");
    patch.category = raw.category;
  }
  if (Object.keys(patch).length === 0) return badRequest("Nessun campo da aggiornare");

  let supabase;
  try {
    supabase = await getServer();
  } catch {
    return serverError("Configurazione server mancante");
  }

  const { error } = await supabase.from("materials").update(patch).eq("id", id);
  if (error) return serverError("Modifica non riuscita");
  return json({ ok: true });
};

export const DELETE: APIRoute = async ({ params, cookies }) => {
  const admin = await guardAdmin(cookies);
  if (admin instanceof Response) return admin;
  const id = params.id;
  if (!id) return badRequest("ID mancante");

  let supabase;
  try {
    supabase = await getServer();
  } catch {
    return serverError("Configurazione server mancante");
  }

  const { data: material } = await supabase.from("materials").select("file_path").eq("id", id).single();

  const { error } = await supabase.from("materials").delete().eq("id", id);
  if (error) return serverError("Eliminazione non riuscita");

  if (material?.file_path) {
    await supabase.storage.from(MATERIALS_BUCKET).remove([material.file_path]);
  }
  return json({ ok: true });
};
