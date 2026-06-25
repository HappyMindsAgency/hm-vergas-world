// PATCH/DELETE /api/museo/istituti/:id — (admin) modifica { nome, citta } o
// elimina un istituto.
//
// DELETE e FK: `classes.institute_id → institutes ON DELETE RESTRICT` ⇒ se ci
// sono classi collegate il DB rifiuta (codice Postgres 23503) e noi rispondiamo
// 409 con un messaggio chiaro. `profiles.institute_id → ON DELETE SET NULL` ⇒ i
// docenti collegati restano, con istituto nullo (gestito dal DB, nessuna azione).
import type { APIRoute } from "astro";
import { json, badRequest, serverError, getServer, guardAdmin } from "../../../../lib/admin/api";

export const prerender = false;

const FK_VIOLATION = "23503";

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
  if (typeof raw.citta === "string" && raw.citta.trim()) patch.citta = raw.citta.trim();
  if (Object.keys(patch).length === 0) return badRequest("Nessun campo da aggiornare");

  let supabase;
  try {
    supabase = await getServer();
  } catch {
    return serverError("Configurazione server mancante");
  }

  const { error } = await supabase.from("institutes").update(patch).eq("id", id);
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

  const { error } = await supabase.from("institutes").delete().eq("id", id);
  if (error) {
    // FK RESTRICT: l'istituto ha classi collegate → non eliminabile.
    if (error.code === FK_VIOLATION) {
      const { count } = await supabase
        .from("classes")
        .select("id", { count: "exact", head: true })
        .eq("institute_id", id);
      const n = count ?? 0;
      return json(
        {
          error: `Impossibile eliminare: ci sono ${n} ${n === 1 ? "classe collegata" : "classi collegate"} a questo istituto.`,
        },
        409,
      );
    }
    return serverError("Eliminazione non riuscita");
  }
  return json({ ok: true });
};
