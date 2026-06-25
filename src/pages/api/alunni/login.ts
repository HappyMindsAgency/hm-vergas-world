// POST /api/alunni/login — firma congelata (INTEGRATION.md).
// body { accessCode, displayName } → valida server-side, emette il cookie di
// sessione firmato (ADR-2, NIENTE Supabase Auth) e ritorna l'identità minima.
// 401 se credenziali non valide.
import type { APIRoute } from "astro";
import { json, badRequest, unauthorized, serverError } from "../../../lib/alunni/api";
import { resolveStudent, touchStudent } from "../../../lib/alunni/data";
import { setStudentSession } from "../../../lib/alunni/session";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  let accessCode: string;
  let displayName: string;
  try {
    const body = await request.json();
    accessCode = String(body.accessCode ?? "");
    displayName = String(body.displayName ?? "");
  } catch {
    return badRequest("Body non valido");
  }
  if (!accessCode.trim() || !displayName.trim()) return badRequest("Codice e nome sono obbligatori");

  let student;
  try {
    student = await resolveStudent(accessCode, displayName);
  } catch {
    return serverError("Configurazione server mancante");
  }
  if (!student) return unauthorized();

  const ok = setStudentSession(cookies, {
    id: student.id,
    displayName: student.displayName,
    classId: student.classId,
  });
  if (!ok) return serverError("Sessione non disponibile");

  await touchStudent(student.id);

  return json({
    ok: true,
    student: { id: student.id, displayName: student.displayName, classId: student.classId },
  });
};
