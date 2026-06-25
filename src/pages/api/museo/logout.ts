// Logout admin: cancella il cookie di sessione e torna al login.
import type { APIRoute } from "astro";
import { ADMIN_COOKIE } from "../../../lib/admin/session";

export const prerender = false;

export const POST: APIRoute = ({ cookies, redirect }) => {
  cookies.delete(ADMIN_COOKIE, { path: "/" });
  return redirect("/museo/login", 303);
};
