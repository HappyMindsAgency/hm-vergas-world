// PATCH/DELETE /api/docenti/:id — (admin) modifica profilo, cambia stato, o
// cancella il docente a cascata.
//
// Cancellazione: eliminiamo l'utente auth (auth.users) — la FK
// profiles.id → auth.users(on delete cascade) propaga al profilo, e da lì
// classes → students → student_quiz_attempts/badges (tutte on delete cascade).
// Così la rimozione è a cascata come richiesto (§9.2) e coerente col contratto DB.
import type { APIRoute } from "astro";
import { json, badRequest, serverError, getServer, guardAdmin } from "../../../lib/admin/api";
import type { ProfileStatus } from "../../../types/db";

export const prerender = false;

const VALID_STATUS: ProfileStatus[] = ["active", "inactive", "disabled"];

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
  if (typeof raw.cognome === "string" && raw.cognome.trim()) patch.cognome = raw.cognome.trim();
  if (typeof raw.email === "string" && raw.email.trim()) patch.email = raw.email.trim().toLowerCase();
  if (typeof raw.status === "string") {
    if (!VALID_STATUS.includes(raw.status as ProfileStatus)) return badRequest("Stato non valido");
    patch.status = raw.status;
  }
  const hasInstituteIds = Array.isArray(raw.instituteIds);
  if (typeof raw.instituteId === "string" && !hasInstituteIds) patch.institute_id = raw.instituteId || null;

  if (!hasInstituteIds && Object.keys(patch).length === 0) return badRequest("Nessun campo da aggiornare");

  let supabase;
  try {
    supabase = await getServer();
  } catch {
    return serverError("Configurazione server mancante");
  }

  // Associazioni multi-istituto: sostituisce l'intero insieme e riallinea l'istituto
  // primario (profiles.institute_id resta se ancora selezionato, altrimenti il primo).
  if (hasInstituteIds) {
    const ids = (raw.instituteIds as unknown[]).filter((x): x is string => typeof x === "string" && !!x);
    const { error: delErr } = await supabase.from("teacher_institutes").delete().eq("teacher_id", id);
    if (delErr) return serverError("Aggiornamento istituti non riuscito");
    if (ids.length) {
      const { error: insErr } = await supabase
        .from("teacher_institutes")
        .insert(ids.map((institute_id) => ({ teacher_id: id, institute_id })));
      if (insErr) return serverError("Aggiornamento istituti non riuscito");
    }
    const { data: prof } = await supabase.from("profiles").select("institute_id").eq("id", id).single();
    const current = prof?.institute_id as string | null | undefined;
    patch.institute_id = current && ids.includes(current) ? current : (ids[0] ?? null);
  }

  if (Object.keys(patch).length) {
    const { error } = await supabase.from("profiles").update(patch).eq("id", id).eq("role", "teacher");
    if (error) return serverError("Aggiornamento non riuscito");
  }
  return json({ ok: true });
};

export const DELETE: APIRoute = async ({ params, request, cookies }) => {
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

  // Conferma per nome (difesa in profondità: la UI già la richiede).
  let confirmName = "";
  try {
    const body = await request.json();
    confirmName = String(body.confirmName ?? "").trim();
  } catch {
    /* body opzionale */
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("nome, cognome, role")
    .eq("id", id)
    .single();
  if (!profile || profile.role !== "teacher") return badRequest("Docente non trovato");

  const fullName = `${profile.nome} ${profile.cognome}`;
  if (confirmName && confirmName !== fullName) {
    return badRequest("Il nome digitato non corrisponde");
  }

  // Cascata via auth.users → profiles → classes → students → progressi.
  const { error } = await supabase.auth.admin.deleteUser(id);
  if (error) return serverError("Cancellazione non riuscita");
  return json({ ok: true });
};
