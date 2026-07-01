// Logout alunno: cancella il cookie di sessione effimero e torna al login avventura.
// ADR-2: la sessione alunno non ha scadenza esplicita (cookie di sessione), ma
// l'alunno deve poterla chiudere PRIMA (es. PC condiviso in classe).
import type { APIRoute } from "astro";
import { STUDENT_COOKIE } from "../../../config/alunni";

export const prerender = false;

export const POST: APIRoute = ({ cookies, redirect }) => {
  cookies.delete(STUDENT_COOKIE, { path: "/" });
  return redirect("/avventura", 303);
};
