// Logica di correzione del quiz — SOLO server-side (vincolo 4). Legge le risposte
// corrette (quiz_options.is_correct) col client service_role e calcola esito/score
// e l'eventuale badge. Il client non vede mai is_correct; riceve solo il verdetto.
import { QUIZ_MAX_ERRORS, STORIES_COUNT } from "../../config/game";

async function server() {
  const { supabaseServer } = await import("../supabase/server");
  return supabaseServer;
}

type Supabase = Awaited<ReturnType<typeof server>>;

/** Mappa questionId → optionId corretto, per le domande di un quiz. */
async function correctAnswerByQuestion(supabase: Supabase, quizId: string): Promise<Map<string, string> | null> {
  const { data: questions } = await supabase.from("quiz_questions").select("id").eq("quiz_id", quizId);
  if (!questions || questions.length === 0) return null;
  const questionIds = questions.map((q) => q.id);

  const { data: options } = await supabase
    .from("quiz_options")
    .select("question_id, id, is_correct")
    .in("question_id", questionIds);
  if (!options) return null;

  const map = new Map<string, string>();
  for (const o of options) {
    if (o.is_correct) map.set(o.question_id, o.id);
  }
  return map;
}

/** Esito di UNA domanda (feedback verde/rosso) senza svelare le altre. */
export interface QuestionFeedback {
  questionId: string;
  correctOptionId: string;
  chosenCorrect: boolean;
}

/**
 * Verifica una singola risposta e ritorna SOLO la correttezza di QUELLA domanda
 * (più l'id dell'opzione giusta per evidenziarla in verde). Non rivela nulla delle
 * altre domande → nessun leak di is_correct dell'intero quiz.
 */
export async function checkOneAnswer(
  numero: number,
  questionId: string,
  optionId: string,
): Promise<QuestionFeedback | null> {
  let supabase;
  try {
    supabase = await server();
  } catch {
    return null;
  }

  const { data: story } = await supabase.from("stories").select("id").eq("numero", numero).single();
  if (!story) return null;
  const { data: quiz } = await supabase.from("quizzes").select("id").eq("story_id", story.id).single();
  if (!quiz) return null;

  // la domanda deve appartenere a questo quiz (no probing cross-quiz).
  const { data: question } = await supabase
    .from("quiz_questions")
    .select("id")
    .eq("id", questionId)
    .eq("quiz_id", quiz.id)
    .single();
  if (!question) return null;

  const { data: correct } = await supabase
    .from("quiz_options")
    .select("id")
    .eq("question_id", questionId)
    .eq("is_correct", true)
    .maybeSingle();
  if (!correct) return null;

  return {
    questionId,
    correctOptionId: correct.id,
    chosenCorrect: optionId === correct.id,
  };
}

export interface GradeResult {
  passed: boolean;
  score: number; // risposte corrette
  total: number;
  errors: number;
  badgeEarned: boolean;
  /** già superato in precedenza → non ripetibile, nessuna riscrittura. */
  alreadyPassed: boolean;
  allBadges: boolean; // ha conquistato tutti e 7 i badge (PDF disponibile)
}

/**
 * Corregge l'intero quiz (identificato dal `quizId`, firma congelata), applica la
 * regola "max 1 errore" (QUIZ_MAX_ERRORS), persiste l'attempt e, se superato, il
 * badge. Idempotente: se il quiz è già `passed` non riscrive (protezione DB: indice
 * unico sqa_one_pass_idx).
 *
 * `answers`: mappa questionId → optionId scelto (eventuali domande mancanti = errore).
 */
export async function gradeQuiz(
  studentId: string,
  quizId: string,
  answers: Record<string, string>,
): Promise<GradeResult | null> {
  let supabase;
  try {
    supabase = await server();
  } catch {
    return null;
  }

  const { data: quiz } = await supabase.from("quizzes").select("id, story_id").eq("id", quizId).single();
  if (!quiz) return null;
  const story = { id: quiz.story_id };

  // Non ripetibile: se esiste già un attempt passed, restituisci lo stato senza riscrivere.
  const { data: prior } = await supabase
    .from("student_quiz_attempts")
    .select("score")
    .eq("student_id", studentId)
    .eq("quiz_id", quiz.id)
    .eq("passed", true)
    .maybeSingle();

  const correctMap = await correctAnswerByQuestion(supabase, quiz.id);
  if (!correctMap || correctMap.size === 0) return null;
  const total = correctMap.size;

  if (prior) {
    return {
      passed: true,
      score: prior.score,
      total,
      errors: total - prior.score,
      badgeEarned: false, // già conquistato in precedenza
      alreadyPassed: true,
      allBadges: await hasAllBadges(supabase, studentId),
    };
  }

  let score = 0;
  for (const [questionId, correctOptionId] of correctMap) {
    if (answers[questionId] === correctOptionId) score++;
  }
  const errors = total - score;
  const passed = errors <= QUIZ_MAX_ERRORS;

  await supabase.from("student_quiz_attempts").insert({
    student_id: studentId,
    quiz_id: quiz.id,
    score,
    passed,
  });

  let badgeEarned = false;
  if (passed) {
    // upsert badge: PK (student_id, story_id) → idempotente.
    const { error } = await supabase
      .from("student_badges")
      .upsert({ student_id: studentId, story_id: story.id }, { onConflict: "student_id,story_id", ignoreDuplicates: true });
    badgeEarned = !error;
    await supabase.from("students").update({ last_activity_at: new Date().toISOString() }).eq("id", studentId);
  }

  return {
    passed,
    score,
    total,
    errors,
    badgeEarned,
    alreadyPassed: false,
    allBadges: passed ? await hasAllBadges(supabase, studentId) : false,
  };
}

async function hasAllBadges(supabase: Supabase, studentId: string): Promise<boolean> {
  const { count } = await supabase
    .from("student_badges")
    .select("story_id", { count: "exact", head: true })
    .eq("student_id", studentId);
  return (count ?? 0) >= STORIES_COUNT;
}
