// Logout docente: cancella il cookie di sessione e torna al login di sezione.
import type { APIRoute } from "astro";
import { TEACHER_COOKIE } from "../../../lib/docenti/session";

export const prerender = false;

export const POST: APIRoute = ({ cookies, redirect }) => {
  cookies.delete(TEACHER_COOKIE, { path: "/" });
  return redirect("/insegnante/login", 303);
};
