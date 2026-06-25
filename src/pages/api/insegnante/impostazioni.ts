// POST /api/insegnante/impostazioni — (teacher) cambia la propria email/password.
// Specchio ridotto di /api/museo/impostazioni: il docente gestisce solo il proprio
// account (niente creazione/eliminazione, fuori scope §9.3).
import type { APIRoute } from "astro";
import { json, badRequest, serverError, getServer, guardTeacher } from "../../../lib/docenti/api";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const teacher = await guardTeacher(cookies);
  if (teacher instanceof Response) return teacher;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return badRequest("Body non valido");
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  const authPatch: { email?: string; password?: string } = {};
  if (email && email !== teacher.email) {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return badRequest("Email non valida");
    authPatch.email = email;
  }
  if (password) {
    if (password.length < 8) return badRequest("Password troppo corta (min 8)");
    authPatch.password = password;
  }
  if (Object.keys(authPatch).length === 0) return json({ ok: true });

  let supabase;
  try {
    supabase = await getServer();
  } catch {
    return serverError("Configurazione server mancante");
  }

  const { error: authErr } = await supabase.auth.admin.updateUserById(teacher.id, authPatch);
  if (authErr) return serverError("Aggiornamento credenziali non riuscito");

  if (authPatch.email) {
    await supabase.from("profiles").update({ email: authPatch.email }).eq("id", teacher.id);
  }
  return json({ ok: true });
};
