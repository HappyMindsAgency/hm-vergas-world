// POST /api/alunni/verifica — endpoint read-only AGGIUNTO (pre-autorizzato, vincolo 6).
// NON cambia le 3 firme congelate. Serve il feedback per-domanda (verde/rosso) dopo
// ogni risposta: riceve UNA risposta e ritorna SOLO la correttezza di QUELLA domanda
// (più l'id dell'opzione giusta per evidenziarla in verde). Non svela nulla delle
// altre domande → nessun leak di is_correct dell'intero quiz.
//
// Sicurezza: lo scoring "vero" e la persistenza restano su /api/alunni/quiz; questo
// endpoint NON scrive nulla e si limita alla domanda richiesta, già appartenente al
// quiz indicato (controllo lato server).
import type { APIRoute } from "astro";
import { json, badRequest, guardStudent, serverError } from "../../../lib/alunni/api";
import { checkOneAnswer } from "../../../lib/alunni/grade";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = guardStudent(cookies);
  if (session instanceof Response) return session;

  let numero: number;
  let questionId: string;
  let optionId: string;
  try {
    const body = await request.json();
    numero = Number(body.numero);
    questionId = String(body.questionId ?? "");
    optionId = String(body.optionId ?? "");
  } catch {
    return badRequest("Body non valido");
  }
  if (!Number.isInteger(numero) || !questionId || !optionId) return badRequest("Parametri mancanti");

  let feedback;
  try {
    feedback = await checkOneAnswer(numero, questionId, optionId);
  } catch {
    return serverError("Impossibile verificare la risposta");
  }
  if (!feedback) return badRequest("Domanda non trovata");

  return json(feedback);
};
