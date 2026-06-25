// Letture per l'Area Alunni (SSR + API read-only). Via service_role (lazy import:
// build senza DB non deve crashare → tutto degrada a stato vuoto). Filtrate per lo
// student della sessione dove pertinente.
//
// SICUREZZA QUIZ (critico, vincolo 4): le funzioni che alimentano il client NON
// devono mai includere quiz_options.is_correct. Lo scoring e il feedback per-domanda
// si calcolano SOLO server-side (vedi grade.ts). Qui le opzioni escono SENZA flag.
import { STORIES_COUNT } from "../../config/game";
import { STUDENT_RANKS } from "../../config/alunni";
import type { Story, Video, VideoSource } from "../../types/db";

async function server() {
  const { supabaseServer } = await import("../supabase/server");
  return supabaseServer;
}

// ---------- Login: risoluzione access_code + display_name ----------
export interface ResolvedStudent {
  id: string;
  displayName: string;
  classId: string;
}

/**
 * Valida le credenziali alunno (codice classe + nome) lato server. Ritorna lo
 * student o null. Il match sul nome è case/spazi-insensitive per tollerare piccole
 * differenze di digitazione, ma l'univocità in classe è garantita dal DB
 * (UNIQUE(class_id, display_name)).
 */
export async function resolveStudent(accessCode: string, displayName: string): Promise<ResolvedStudent | null> {
  let supabase;
  try {
    supabase = await server();
  } catch {
    return null;
  }

  const code = accessCode.trim();
  const name = displayName.trim();
  if (!code || !name) return null;

  const { data: classe } = await supabase.from("classes").select("id").eq("access_code", code).single();
  if (!classe) return null;

  const { data: students } = await supabase
    .from("students")
    .select("id, display_name")
    .eq("class_id", classe.id);
  if (!students) return null;

  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  const target = norm(name);
  const match = students.find((s) => norm(s.display_name) === target);
  if (!match) return null;

  return { id: match.id, displayName: match.display_name, classId: classe.id };
}

/** Aggiorna last_activity_at (best-effort, non blocca il login). */
export async function touchStudent(studentId: string): Promise<void> {
  try {
    const supabase = await server();
    await supabase.from("students").update({ last_activity_at: new Date().toISOString() }).eq("id", studentId);
  } catch {
    /* best-effort */
  }
}

// ---------- Storie + video (sezione Video) ----------
export interface StoryVideo {
  storyId: string;
  numero: number;
  titolo: string;
  sinossi: string | null;
  images: string[];
  video: { id: string; titolo: string; sourceType: VideoSource; urlOrPath: string } | null;
}

/** Le 7 storie con il rispettivo video (se caricato dall'Admin). */
export async function getStoryVideos(): Promise<StoryVideo[]> {
  let supabase;
  try {
    supabase = await server();
  } catch {
    return [];
  }
  const { data: stories } = await supabase.from("stories").select("*").order("numero");
  if (!stories) return [];

  const storyIds = (stories as Story[]).map((s) => s.id);
  let videos: Video[] = [];
  if (storyIds.length) {
    const { data } = await supabase.from("videos").select("*").in("story_id", storyIds);
    videos = (data as Video[]) ?? [];
  }
  const videoByStory = new Map(videos.map((v) => [v.story_id, v]));

  return (stories as Story[]).map((s) => {
    const v = videoByStory.get(s.id);
    return {
      storyId: s.id,
      numero: s.numero,
      titolo: s.titolo,
      sinossi: s.sinossi,
      images: Array.isArray(s.images) ? s.images : [],
      video: v ? { id: v.id, titolo: v.titolo, sourceType: v.source_type, urlOrPath: v.url_or_path } : null,
    };
  });
}

// ---------- Passaporto (badge + progress) ----------
export interface Passaporto {
  badgeCount: number;
  total: number;
  rank: string;
  /** badge per numero di storia: numero → conquistato? */
  storyBadges: { numero: number; titolo: string; storyId: string; earned: boolean; passed: boolean }[];
  completed: boolean;
}

export async function getPassaporto(studentId: string): Promise<Passaporto> {
  const empty: Passaporto = {
    badgeCount: 0,
    total: STORIES_COUNT,
    rank: rankFor(0),
    storyBadges: [],
    completed: false,
  };
  let supabase;
  try {
    supabase = await server();
  } catch {
    return empty;
  }

  const { data: stories } = await supabase.from("stories").select("id, numero, titolo").order("numero");
  if (!stories) return empty;

  const { data: badges } = await supabase
    .from("student_badges")
    .select("story_id")
    .eq("student_id", studentId);
  const earnedSet = new Set((badges ?? []).map((b) => b.story_id));

  // quiz superati (passed) per evidenziare le missioni già chiuse (non ripetibili).
  const { data: quizzes } = await supabase.from("quizzes").select("id, story_id");
  const quizByStory = new Map((quizzes ?? []).map((q) => [q.story_id, q.id]));
  const quizIds = (quizzes ?? []).map((q) => q.id);

  const passedQuizSet = new Set<string>();
  if (quizIds.length) {
    const { data: attempts } = await supabase
      .from("student_quiz_attempts")
      .select("quiz_id")
      .eq("student_id", studentId)
      .eq("passed", true)
      .in("quiz_id", quizIds);
    for (const a of attempts ?? []) passedQuizSet.add(a.quiz_id);
  }

  const storyBadges = stories.map((s) => {
    const quizId = quizByStory.get(s.id);
    return {
      numero: s.numero,
      titolo: s.titolo,
      storyId: s.id,
      earned: earnedSet.has(s.id),
      passed: quizId ? passedQuizSet.has(quizId) : false,
    };
  });

  const badgeCount = storyBadges.filter((s) => s.earned).length;
  return {
    badgeCount,
    total: STORIES_COUNT,
    rank: rankFor(badgeCount),
    storyBadges,
    completed: badgeCount >= STORIES_COUNT,
  };
}

function rankFor(badgeCount: number): string {
  let label = STUDENT_RANKS[0].label;
  for (const r of STUDENT_RANKS) {
    if (badgeCount >= r.soglia) label = r.label;
  }
  return label;
}

// ---------- Quiz per il client (SENZA is_correct) ----------
export interface QuizForStudent {
  quizId: string;
  storyId: string;
  numero: number;
  titolo: string;
  /** già superato? Se sì la pagina mostra "missione completata" e non riapre il quiz. */
  alreadyPassed: boolean;
  questions: QuizQuestionForStudent[];
}

export interface QuizQuestionForStudent {
  id: string;
  testo: string;
  ordine: number;
  /** opzioni mescolate; NESSUN is_correct esposto. */
  options: { id: string; testo: string }[];
}

/**
 * Quiz di una storia (per `numero`) pronto per il client, SENZA risposte corrette.
 * Null se la storia/quiz non esiste. Include `alreadyPassed` per non riaprire un
 * quiz già superato (non ripetibile).
 */
export async function getQuizForStudent(numero: number, studentId: string): Promise<QuizForStudent | null> {
  let supabase;
  try {
    supabase = await server();
  } catch {
    return null;
  }

  const { data: story } = await supabase
    .from("stories")
    .select("id, numero, titolo")
    .eq("numero", numero)
    .single();
  if (!story) return null;

  const { data: quiz } = await supabase.from("quizzes").select("id").eq("story_id", story.id).single();
  if (!quiz) return null;

  const { data: attempt } = await supabase
    .from("student_quiz_attempts")
    .select("id")
    .eq("student_id", studentId)
    .eq("quiz_id", quiz.id)
    .eq("passed", true)
    .maybeSingle();
  const alreadyPassed = !!attempt;

  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("id, testo, ordine")
    .eq("quiz_id", quiz.id)
    .order("ordine");
  if (!questions || questions.length === 0) return null;

  const questionIds = questions.map((q) => q.id);
  // SELECT esplicito senza is_correct: la flag non lascia mai il server.
  const { data: options } = await supabase
    .from("quiz_options")
    .select("id, question_id, testo")
    .in("question_id", questionIds);

  const optionsByQuestion = new Map<string, { id: string; testo: string }[]>();
  for (const o of options ?? []) {
    const arr = optionsByQuestion.get(o.question_id) ?? [];
    arr.push({ id: o.id, testo: o.testo });
    optionsByQuestion.set(o.question_id, arr);
  }

  return {
    quizId: quiz.id,
    storyId: story.id,
    numero: story.numero,
    titolo: story.titolo,
    alreadyPassed,
    questions: questions.map((q) => ({
      id: q.id,
      testo: q.testo,
      ordine: q.ordine,
      options: shuffle(optionsByQuestion.get(q.id) ?? []),
    })),
  };
}

/** Fisher-Yates: mescola le opzioni così la posizione non rivela la risposta. */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
