// PATCH/DELETE /api/classi/:id — (teacher) gestione di UNA classe del docente.
// Ownership sempre verificata (eq teacher_id): un docente tocca solo le sue classi.
//
// PATCH body { action, ... }:
//   - "dati"        { nome?, anno?, instituteId? }  → aggiorna i dati base
//   - "codice"      { accessCode }                  → imposta un codice manuale (unico)
//   - "rimuovi-alunno" { studentId }                → toglie un alunno (composizione)
//   - "aggiungi-alunno"{ nome }                     → aggiunge un alunno (display_name formattato)
// DELETE → elimina la classe (cascata FK: students → progressi/badge).
import type { APIRoute } from "astro";
import { json, badRequest, serverError, getServer, guardTeacher } from "../../../lib/docenti/api";
import { formatStudentName } from "../../../lib/format";
import { getTeacherInstitutes } from "../../../lib/docenti/data";

export const prerender = false;

const UNIQUE_VIOLATION = "23505";

export const PATCH: APIRoute = async ({ params, request, cookies }) => {
  const teacher = await guardTeacher(cookies);
  if (teacher instanceof Response) return teacher;
  const classId = params.id;
  if (!classId) return badRequest("ID mancante");

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return badRequest("Body non valido");
  }
  const action = String(body.action ?? "");

  let supabase;
  try {
    supabase = await getServer();
  } catch {
    return serverError("Configurazione server mancante");
  }

  // ownership.
  const { data: classe } = await supabase
    .from("classes")
    .select("id, institute_id")
    .eq("id", classId)
    .eq("teacher_id", teacher.id)
    .single();
  if (!classe) return badRequest("Classe non trovata");

  switch (action) {
    case "dati": {
      const patch: Record<string, unknown> = {};
      if (typeof body.nome === "string" && body.nome.trim()) patch.nome = body.nome.trim();
      if (body.anno !== undefined) {
        const anno = Number(body.anno);
        if (!Number.isInteger(anno) || anno < 2000 || anno > 2100) return badRequest("Anno non valido");
        patch.anno = anno;
      }
      if (typeof body.instituteId === "string" && body.instituteId.trim()) {
        // deve essere tra gli istituti associati al docente (no spoofing).
        const allowed = await getTeacherInstitutes(teacher.id);
        if (!allowed.some((i) => i.id === body.instituteId)) return badRequest("Istituto non associato al docente");
        patch.institute_id = body.instituteId;
      }
      if (Object.keys(patch).length === 0) return badRequest("Nessun campo da aggiornare");
      const { error } = await supabase.from("classes").update(patch).eq("id", classId);
      if (error) return serverError("Aggiornamento non riuscito");
      return json({ ok: true });
    }

    case "codice": {
      const accessCode = String(body.accessCode ?? "").trim().toUpperCase();
      if (!/^[A-Z0-9-]{3,}$/.test(accessCode)) return badRequest("Codice non valido (A-Z, 0-9, trattino)");
      const { error } = await supabase.from("classes").update({ access_code: accessCode }).eq("id", classId);
      if (error?.code === UNIQUE_VIOLATION) return badRequest("Codice già in uso da un'altra classe");
      if (error) return serverError("Aggiornamento codice non riuscito");
      return json({ ok: true, accessCode });
    }

    case "rimuovi-alunno": {
      const studentId = String(body.studentId ?? "").trim();
      if (!studentId) return badRequest("Alunno non specificato");
      const { error } = await supabase.from("students").delete().eq("id", studentId).eq("class_id", classId);
      if (error) return serverError("Rimozione non riuscita");
      return json({ ok: true });
    }

    case "aggiungi-alunno": {
      const nome = String(body.nome ?? "").trim();
      if (!nome) return badRequest("Nome obbligatorio");
      const displayName = formatStudentName(nome);
      const { error } = await supabase.from("students").insert({ class_id: classId, display_name: displayName });
      if (error?.code === UNIQUE_VIOLATION) return badRequest("Alunno già presente in classe");
      if (error) return serverError("Aggiunta non riuscita");
      return json({ ok: true, displayName });
    }

    default:
      return badRequest("Azione non riconosciuta");
  }
};

export const DELETE: APIRoute = async ({ params, cookies }) => {
  const teacher = await guardTeacher(cookies);
  if (teacher instanceof Response) return teacher;
  const classId = params.id;
  if (!classId) return badRequest("ID mancante");

  let supabase;
  try {
    supabase = await getServer();
  } catch {
    return serverError("Configurazione server mancante");
  }

  // ownership + cancellazione (cascata FK: students → attempts/badges).
  const { error, count } = await supabase
    .from("classes")
    .delete({ count: "exact" })
    .eq("id", classId)
    .eq("teacher_id", teacher.id);
  if (error) return serverError("Eliminazione non riuscita");
  if (!count) return badRequest("Classe non trovata");
  return json({ ok: true });
};
