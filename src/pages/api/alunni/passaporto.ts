// GET /api/alunni/passaporto — firma congelata (INTEGRATION.md).
// (cookie sessione) → badge dell'alunno + progress. Sola lettura.
import type { APIRoute } from "astro";
import { json, guardStudent, serverError } from "../../../lib/alunni/api";
import { getPassaporto } from "../../../lib/alunni/data";

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
  const session = guardStudent(cookies);
  if (session instanceof Response) return session;

  try {
    const passaporto = await getPassaporto(session.id);
    return json(passaporto);
  } catch {
    return serverError("Impossibile leggere il passaporto");
  }
};
