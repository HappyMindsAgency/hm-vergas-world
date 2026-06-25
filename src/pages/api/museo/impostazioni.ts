// POST /api/museo/impostazioni — (admin) gestione account: nuovo amministratore,
// modifica propria email/password, eliminazione del proprio account.
import type { APIRoute } from "astro";
import { json, badRequest, serverError, getServer, guardAdmin } from "../../../lib/admin/api";
import { ADMIN_COOKIE } from "../../../lib/admin/session";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const admin = await guardAdmin(cookies);
  if (admin instanceof Response) return admin;

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

  const str = (k: string) => String(body[k] ?? "").trim();

  switch (action) {
    case "new-admin": {
      const nome = str("nome");
      const cognome = str("cognome");
      const email = str("email").toLowerCase();
      const password = String(body.password ?? "");
      if (!nome || !cognome) return badRequest("Nome e cognome obbligatori");
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return badRequest("Email non valida");
      if (password.length < 8) return badRequest("Password troppo corta (min 8)");

      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (createErr || !created.user) {
        return badRequest(createErr?.message ?? "Impossibile creare l'utente");
      }
      const { error: profileErr } = await supabase.from("profiles").insert({
        id: created.user.id,
        role: "admin",
        nome,
        cognome,
        email,
        status: "active",
      });
      if (profileErr) {
        await supabase.auth.admin.deleteUser(created.user.id);
        return serverError("Creazione profilo admin non riuscita");
      }
      return json({ ok: true, id: created.user.id }, 201);
    }

    case "update-self": {
      const email = str("email").toLowerCase();
      const password = String(body.password ?? "");
      const authPatch: { email?: string; password?: string } = {};
      if (email && email !== admin.email) {
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return badRequest("Email non valida");
        authPatch.email = email;
      }
      if (password) {
        if (password.length < 8) return badRequest("Password troppo corta (min 8)");
        authPatch.password = password;
      }
      if (Object.keys(authPatch).length === 0) return json({ ok: true });

      const { error: authErr } = await supabase.auth.admin.updateUserById(admin.id, authPatch);
      if (authErr) return serverError("Aggiornamento credenziali non riuscito");

      if (authPatch.email) {
        await supabase.from("profiles").update({ email: authPatch.email }).eq("id", admin.id);
      }
      return json({ ok: true });
    }

    case "delete-self": {
      // Evita di rimanere senza admin: blocca se è l'ultimo.
      const { count } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "admin");
      if ((count ?? 0) <= 1) return badRequest("Non puoi eliminare l'unico amministratore");

      const { error } = await supabase.auth.admin.deleteUser(admin.id);
      if (error) return serverError("Eliminazione non riuscita");
      cookies.delete(ADMIN_COOKIE, { path: "/" });
      return json({ ok: true });
    }

    default:
      return badRequest("Azione non riconosciuta");
  }
};
