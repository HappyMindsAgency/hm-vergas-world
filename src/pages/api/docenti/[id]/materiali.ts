// POST/DELETE /api/docenti/:id/materiali — (admin) assegna o revoca un materiale
// a un docente (tabella material_assignments). Body { materialId }.
import type { APIRoute } from "astro";
import { json, badRequest, serverError, getServer, guardAdmin } from "../../../../lib/admin/api";

export const prerender = false;

async function readMaterialId(request: Request): Promise<string | null> {
  try {
    const body = await request.json();
    const id = String(body.materialId ?? "").trim();
    return id || null;
  } catch {
    return null;
  }
}

export const POST: APIRoute = async ({ params, request, cookies }) => {
  const admin = await guardAdmin(cookies);
  if (admin instanceof Response) return admin;
  const teacherId = params.id;
  const materialId = await readMaterialId(request);
  if (!teacherId || !materialId) return badRequest("Parametri mancanti");

  let supabase;
  try {
    supabase = await getServer();
  } catch {
    return serverError("Configurazione server mancante");
  }

  const { error } = await supabase
    .from("material_assignments")
    .upsert({ teacher_id: teacherId, material_id: materialId }, { onConflict: "material_id,teacher_id" });
  if (error) return serverError("Assegnazione non riuscita");
  return json({ ok: true });
};

export const DELETE: APIRoute = async ({ params, request, cookies }) => {
  const admin = await guardAdmin(cookies);
  if (admin instanceof Response) return admin;
  const teacherId = params.id;
  const materialId = await readMaterialId(request);
  if (!teacherId || !materialId) return badRequest("Parametri mancanti");

  let supabase;
  try {
    supabase = await getServer();
  } catch {
    return serverError("Configurazione server mancante");
  }

  const { error } = await supabase
    .from("material_assignments")
    .delete()
    .eq("teacher_id", teacherId)
    .eq("material_id", materialId);
  if (error) return serverError("Revoca non riuscita");
  return json({ ok: true });
};
