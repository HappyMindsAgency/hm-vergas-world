// POST /api/classi/import — (teacher) import alunni in una classe ESISTENTE.
// Firma CONGELATA (INTEGRATION.md): multipart Excel → parsing 1 colonna
// "Nome Cognome", crea students con display_name formattato, genera access_code
// univoco a livello di classe (vincolo UNIQUE class_id,display_name) → { created, skipped }.
//
// L'access_code univoco è quello della CLASSE (già esistente): qui generiamo i
// display_name (l'identità alunno = access_code classe + display_name, ADR-2).
// Multipart: classId, file.
import type { APIRoute } from "astro";
import { json, badRequest, serverError, getServer, guardTeacher } from "../../../lib/docenti/api";
import { importStudentsIntoClass } from "../../../lib/docenti/importStudents";

export const prerender = false;

const MAX_FILE_BYTES = 2 * 1024 * 1024;

export const POST: APIRoute = async ({ request, cookies }) => {
  const teacher = await guardTeacher(cookies);
  if (teacher instanceof Response) return teacher;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return badRequest("Form non valido");
  }

  const classId = String(form.get("classId") ?? "").trim();
  const file = form.get("file");
  if (!classId) return badRequest("Classe non specificata");
  if (!(file instanceof File) || file.size === 0) return badRequest("File mancante");
  if (file.size > MAX_FILE_BYTES) return badRequest("File troppo grande (max 2 MB)");

  let supabase;
  try {
    supabase = await getServer();
  } catch {
    return serverError("Configurazione server mancante");
  }

  // ownership: la classe deve essere del docente loggato.
  const { data: classe } = await supabase
    .from("classes")
    .select("id")
    .eq("id", classId)
    .eq("teacher_id", teacher.id)
    .single();
  if (!classe) return badRequest("Classe non trovata");

  const bytes = new Uint8Array(await file.arrayBuffer());
  let report;
  try {
    report = await importStudentsIntoClass(supabase, classId, file.name, bytes);
  } catch (e) {
    return badRequest(e instanceof Error ? e.message : "Import non riuscito");
  }

  return json({ created: report.created, skipped: report.skipped, skippedDetails: report.skippedDetails });
};
