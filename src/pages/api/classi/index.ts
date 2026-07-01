// POST /api/classi — (teacher) crea una classe e, opzionalmente, importa subito
// gli alunni da un file Excel/CSV. Multipart:
//   nome, instituteId, anno, file? (Nome Cognome, una colonna — ADR-7).
// Genera l'access_code univoco (NOME-ISTITUTO-ANNO + suffisso, ADR-5).
// Risponde { ok, classId, accessCode, import?: { created, skipped, skippedDetails } }.
import type { APIRoute } from "astro";
import { json, badRequest, serverError, getServer, guardTeacher } from "../../../lib/docenti/api";
import { insertClassWithUniqueCode } from "../../../lib/docenti/classCodeAlloc";
import { importStudentsIntoClass } from "../../../lib/docenti/importStudents";
import { getTeacherInstitutes } from "../../../lib/docenti/data";

export const prerender = false;

const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2 MB: un elenco classe è piccolo.

export const POST: APIRoute = async ({ request, cookies }) => {
  const teacher = await guardTeacher(cookies);
  if (teacher instanceof Response) return teacher;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return badRequest("Form non valido");
  }

  const nome = String(form.get("nome") ?? "").trim();
  const instituteId = String(form.get("instituteId") ?? "").trim();
  const anno = Number(form.get("anno"));
  const file = form.get("file");

  if (!nome) return badRequest("Nome classe obbligatorio");
  if (!instituteId) return badRequest("Istituto obbligatorio");
  if (!Number.isInteger(anno) || anno < 2000 || anno > 2100) return badRequest("Anno non valido");

  let supabase;
  try {
    supabase = await getServer();
  } catch {
    return serverError("Configurazione server mancante");
  }

  // l'istituto deve esistere ED essere tra quelli associati al docente (no spoofing
  // di instituteId nel form: un docente crea classi solo nei propri istituti).
  const allowed = await getTeacherInstitutes(teacher.id);
  const institute = allowed.find((i) => i.id === instituteId);
  if (!institute) return badRequest("Istituto non associato al docente");

  let created;
  try {
    created = await insertClassWithUniqueCode(supabase, {
      teacherId: teacher.id,
      instituteId,
      nome,
      anno,
      istitutoNome: institute.nome,
    });
  } catch (e) {
    return serverError(e instanceof Error ? e.message : "Creazione classe non riuscita");
  }

  // import opzionale degli alunni allegati.
  let importReport = undefined;
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_FILE_BYTES) return badRequest("File troppo grande (max 2 MB)");
    const bytes = new Uint8Array(await file.arrayBuffer());
    try {
      importReport = await importStudentsIntoClass(supabase, created.id, file.name, bytes);
    } catch (e) {
      // la classe è creata: segnaliamo il problema di import senza fallire del tutto.
      importReport = { created: 0, skipped: 0, error: e instanceof Error ? e.message : "Import non riuscito" };
    }
  }

  return json({ ok: true, classId: created.id, accessCode: created.access_code, import: importReport }, 201);
};
