// POST /api/alunni/quiz — firma congelata (INTEGRATION.md).
// (cookie sessione) body { quizId, answers } → calcola score/passed (≤ QUIZ_MAX_ERRORS),
// upsert student_quiz_attempts, eventuale student_badges → { passed, score, badgeEarned }.
// Quiz già passed → non ripetibile (gestito in gradeQuiz: nessuna riscrittura).
//
// SICUREZZA (vincolo 4): lo scoring avviene SOLO qui, server-side, leggendo
// is_correct col service_role. Il client manda solo le proprie scelte e riceve il
// verdetto. is_correct non lascia mai il server.
import type { APIRoute } from "astro";
import { json, badRequest, guardStudent, serverError } from "../../../lib/alunni/api";
import { gradeQuiz } from "../../../lib/alunni/grade";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = guardStudent(cookies);
  if (session instanceof Response) return session;

  let quizId: string;
  let answers: Record<string, string>;
  try {
    const body = await request.json();
    quizId = String(body.quizId ?? "");
    answers = normalizeAnswers(body.answers);
  } catch {
    return badRequest("Body non valido");
  }
  if (!quizId) return badRequest("quizId mancante");

  let result;
  try {
    result = await gradeQuiz(session.id, quizId, answers);
  } catch {
    return serverError("Impossibile correggere il quiz");
  }
  if (!result) return badRequest("Quiz non trovato");

  // Risposta secondo la firma congelata, più info utili al client (non segrete).
  return json({
    passed: result.passed,
    score: result.score,
    total: result.total,
    badgeEarned: result.badgeEarned,
    alreadyPassed: result.alreadyPassed,
    allBadges: result.allBadges,
  });
};

/** Accetta { questionId: optionId } e scarta valori non stringa. */
function normalizeAnswers(raw: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (raw && typeof raw === "object") {
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof v === "string") out[k] = v;
    }
  }
  return out;
}
