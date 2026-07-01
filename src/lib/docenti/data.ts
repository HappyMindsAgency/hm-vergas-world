// Letture aggregate per le pagine Docente (SSR). Via service_role (lazy import:
// build senza DB non deve crashare). Tutte le query sono ESPLICITAMENTE filtrate
// per teacher_id del docente loggato: leggiamo solo i suoi dati, coerente con la
// RLS (classes_owner/students_owner/sqa_owner/badges_owner). Le pagine degradano
// a stato vuoto se le env mancano.
import type { Class, Institute, Material, Student, Story, Video, Quiz, QuizQuestion, QuizOption } from "../../types/db";
import { STORIES_COUNT } from "../../config/game";
import { formatStudentName } from "../format";

async function server() {
  const { supabaseServer } = await import("../supabase/server");
  return supabaseServer;
}

// ---------- Dashboard ----------
export interface TeacherDashboard {
  alunniTotali: number;
  alunniAttivi: number; // hanno almeno un'attività (last_activity_at)
  badgeTotali: number;
  passaportiCompletati: number; // alunni con tutti i 7 badge
  ultimeAttivita: ActivityItem[];
  storie: StoryCompletion[];
}

export interface ActivityItem {
  studentName: string;
  badgeStory: string;
  earnedAt: string;
}

export interface StoryCompletion {
  numero: number;
  titolo: string;
  completati: number;
  totale: number;
}

const EMPTY_DASHBOARD: TeacherDashboard = {
  alunniTotali: 0,
  alunniAttivi: 0,
  badgeTotali: 0,
  passaportiCompletati: 0,
  ultimeAttivita: [],
  storie: [],
};

export async function getTeacherDashboard(teacherId: string): Promise<TeacherDashboard> {
  let supabase;
  try {
    supabase = await server();
  } catch {
    return EMPTY_DASHBOARD;
  }

  const { data: classes } = await supabase.from("classes").select("id").eq("teacher_id", teacherId);
  const classIds = (classes ?? []).map((c) => c.id);
  if (classIds.length === 0) {
    // niente classi: storie a 0 per coerenza UI.
    const stories = await getStories(supabase);
    return { ...EMPTY_DASHBOARD, storie: stories.map((s) => ({ numero: s.numero, titolo: s.titolo, completati: 0, totale: 0 })) };
  }

  const { data: students } = await supabase
    .from("students")
    .select("id, display_name, last_activity_at")
    .in("class_id", classIds);
  const studentList = (students ?? []) as Pick<Student, "id" | "display_name" | "last_activity_at">[];
  const studentIds = studentList.map((s) => s.id);
  const nameById = new Map(studentList.map((s) => [s.id, s.display_name]));

  const stories = await getStories(supabase);
  const storyTitleById = new Map(stories.map((s) => [s.id, s.titolo]));

  let badges: Array<{ student_id: string; story_id: string; earned_at: string }> = [];
  if (studentIds.length) {
    const { data } = await supabase
      .from("student_badges")
      .select("student_id, story_id, earned_at")
      .in("student_id", studentIds)
      .order("earned_at", { ascending: false });
    badges = data ?? [];
  }

  // badge per alunno → passaporti completati (tutti e 7).
  const badgesPerStudent = new Map<string, number>();
  const completatiPerStory = new Map<string, number>();
  for (const b of badges) {
    badgesPerStudent.set(b.student_id, (badgesPerStudent.get(b.student_id) ?? 0) + 1);
    completatiPerStory.set(b.story_id, (completatiPerStory.get(b.story_id) ?? 0) + 1);
  }
  const passaportiCompletati = [...badgesPerStudent.values()].filter((n) => n >= STORIES_COUNT).length;

  const ultimeAttivita: ActivityItem[] = badges.slice(0, 6).map((b) => ({
    studentName: nameById.get(b.student_id) ?? "—",
    badgeStory: storyTitleById.get(b.story_id) ?? "—",
    earnedAt: b.earned_at,
  }));

  const totale = studentList.length;
  return {
    alunniTotali: totale,
    alunniAttivi: studentList.filter((s) => s.last_activity_at).length,
    badgeTotali: badges.length,
    passaportiCompletati,
    ultimeAttivita,
    storie: stories.map((s) => ({
      numero: s.numero,
      titolo: s.titolo,
      completati: completatiPerStory.get(s.id) ?? 0,
      totale,
    })),
  };
}

// ---------- Le mie classi ----------
export interface ClassRow extends Class {
  istitutoNome: string | null;
  alunniCount: number;
}

export async function getTeacherClasses(teacherId: string): Promise<ClassRow[]> {
  let supabase;
  try {
    supabase = await server();
  } catch {
    return [];
  }
  const { data: classes } = await supabase
    .from("classes")
    .select("*")
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: false });
  if (!classes) return [];

  const classIds = (classes as Class[]).map((c) => c.id);
  const [{ data: institutes }, studentCounts] = await Promise.all([
    supabase.from("institutes").select("id, nome"),
    countStudents(supabase, classIds),
  ]);
  const instMap = new Map((institutes ?? []).map((i) => [i.id, i.nome]));

  return (classes as Class[]).map((c) => ({
    ...c,
    istitutoNome: instMap.get(c.institute_id) ?? null,
    alunniCount: studentCounts.get(c.id) ?? 0,
  }));
}

async function countStudents(supabase: Awaited<ReturnType<typeof server>>, classIds: string[]) {
  const map = new Map<string, number>();
  if (!classIds.length) return map;
  const { data } = await supabase.from("students").select("class_id").in("class_id", classIds);
  for (const s of data ?? []) map.set(s.class_id, (map.get(s.class_id) ?? 0) + 1);
  return map;
}

/** Tutti gli access_code già usati (per proporre un codice libero lato server). */
export async function getTakenClassCodes(): Promise<Set<string>> {
  let supabase;
  try {
    supabase = await server();
  } catch {
    return new Set();
  }
  const { data } = await supabase.from("classes").select("access_code");
  return new Set((data ?? []).map((r) => r.access_code));
}

// ---------- Dettaglio classe ----------
export interface StudentRow {
  id: string;
  displayName: string;
  missioniFatte: number;
  badge: number;
  lastActivityAt: string | null;
}

export interface ClassDetail {
  classe: Class;
  istitutoNome: string | null;
  alunni: StudentRow[];
  alunniAttivi: number;
  missioniTotaliPerAlunno: number;
}

/** Dettaglio di UNA classe del docente. Null se la classe non è sua o non esiste. */
export async function getClassDetail(teacherId: string, classId: string): Promise<ClassDetail | null> {
  let supabase;
  try {
    supabase = await server();
  } catch {
    return null;
  }

  const { data: classe } = await supabase
    .from("classes")
    .select("*")
    .eq("id", classId)
    .eq("teacher_id", teacherId) // ownership: solo le proprie classi
    .single();
  if (!classe) return null;

  const [{ data: institute }, { data: students }] = await Promise.all([
    supabase.from("institutes").select("nome").eq("id", (classe as Class).institute_id).single(),
    supabase
      .from("students")
      .select("id, display_name, last_activity_at")
      .eq("class_id", classId)
      .order("display_name"),
  ]);

  const studentList = (students ?? []) as Pick<Student, "id" | "display_name" | "last_activity_at">[];
  const studentIds = studentList.map((s) => s.id);

  // missioni = quiz superati; badge = badge conquistati.
  const passedPerStudent = new Map<string, number>();
  const badgesPerStudent = new Map<string, number>();
  if (studentIds.length) {
    const [{ data: attempts }, { data: badges }] = await Promise.all([
      supabase.from("student_quiz_attempts").select("student_id, passed").in("student_id", studentIds).eq("passed", true),
      supabase.from("student_badges").select("student_id").in("student_id", studentIds),
    ]);
    for (const a of attempts ?? []) passedPerStudent.set(a.student_id, (passedPerStudent.get(a.student_id) ?? 0) + 1);
    for (const b of badges ?? []) badgesPerStudent.set(b.student_id, (badgesPerStudent.get(b.student_id) ?? 0) + 1);
  }

  const alunni: StudentRow[] = studentList.map((s) => ({
    id: s.id,
    displayName: s.display_name,
    missioniFatte: passedPerStudent.get(s.id) ?? 0,
    badge: badgesPerStudent.get(s.id) ?? 0,
    lastActivityAt: s.last_activity_at,
  }));

  return {
    classe: classe as Class,
    istitutoNome: institute?.nome ?? null,
    alunni,
    alunniAttivi: studentList.filter((s) => s.last_activity_at).length,
    missioniTotaliPerAlunno: STORIES_COUNT,
  };
}

/** Composizione classe: lista alunni con nome formattato già pronto. */
export async function getClassStudents(teacherId: string, classId: string): Promise<StudentRow[]> {
  const detail = await getClassDetail(teacherId, classId);
  return detail?.alunni ?? [];
}

// ---------- Materiali (consumati da Admin, sola lettura) ----------
export interface MaterialDownload extends Material {
  downloadUrl: string | null;
}

/**
 * Materiali assegnati al docente (RLS materials_assigned), con URL firmato per il
 * download. Lo URL firmato si genera lato server (service_role) ed è temporaneo.
 */
export async function getAssignedMaterials(teacherId: string): Promise<MaterialDownload[]> {
  let supabase;
  try {
    supabase = await server();
  } catch {
    return [];
  }
  const { data: assignments } = await supabase
    .from("material_assignments")
    .select("material_id")
    .eq("teacher_id", teacherId);
  const ids = (assignments ?? []).map((a) => a.material_id);
  if (!ids.length) return [];

  const { data: materials } = await supabase
    .from("materials")
    .select("*")
    .in("id", ids)
    .order("created_at", { ascending: false });
  if (!materials) return [];

  const { MATERIALS_BUCKET } = await import("../../config/admin");
  const result: MaterialDownload[] = [];
  for (const m of materials as Material[]) {
    const { data: signed } = await supabase.storage.from(MATERIALS_BUCKET).createSignedUrl(m.file_path, 60 * 60);
    result.push({ ...m, downloadUrl: signed?.signedUrl ?? null });
  }
  return result;
}

// ---------- Contenuti didattici (sola lettura) ----------
// Il docente consulta video e quiz delle 7 storie (popolati dall'Admin). SOLA
// LETTURA: nessuna scrittura, nessuna API. La risposta corretta (is_correct) è
// visibile ai DOCENTI per scopo didattico (la restrizione vale solo per il client
// alunni). Ordinamenti stabili: storie per numero, domande per ordine, opzioni per id.
export interface StoryQuestion extends QuizQuestion {
  options: QuizOption[];
}

export interface StoryContentView {
  story: Story;
  videos: Video[];
  hasQuiz: boolean;
  questions: StoryQuestion[];
}

export async function getStoriesContent(): Promise<StoryContentView[]> {
  let supabase;
  try {
    supabase = await server();
  } catch {
    return [];
  }

  const stories = await getStories(supabase);
  if (stories.length === 0) return [];
  const storyIds = stories.map((s) => s.id);

  const [{ data: videos }, { data: quizzes }] = await Promise.all([
    supabase.from("videos").select("*").in("story_id", storyIds).order("titolo"),
    supabase.from("quizzes").select("*").in("story_id", storyIds),
  ]);

  const videosByStory = new Map<string, Video[]>();
  for (const v of (videos as Video[]) ?? []) {
    const arr = videosByStory.get(v.story_id) ?? [];
    arr.push(v);
    videosByStory.set(v.story_id, arr);
  }

  const quizByStory = new Map<string, Quiz>();
  const quizIds: string[] = [];
  for (const q of (quizzes as Quiz[]) ?? []) {
    quizByStory.set(q.story_id, q);
    quizIds.push(q.id);
  }

  // domande + opzioni di tutti i quiz in due query, poi raggruppate in memoria.
  const questionsByQuiz = new Map<string, StoryQuestion[]>();
  if (quizIds.length) {
    const { data: questions } = await supabase
      .from("quiz_questions")
      .select("*")
      .in("quiz_id", quizIds)
      .order("ordine");
    const questionList = (questions as QuizQuestion[]) ?? [];
    const questionIds = questionList.map((q) => q.id);

    const optionsByQuestion = new Map<string, QuizOption[]>();
    if (questionIds.length) {
      const { data: options } = await supabase
        .from("quiz_options")
        .select("*")
        .in("question_id", questionIds)
        .order("id");
      for (const o of (options as QuizOption[]) ?? []) {
        const arr = optionsByQuestion.get(o.question_id) ?? [];
        arr.push(o);
        optionsByQuestion.set(o.question_id, arr);
      }
    }

    for (const q of questionList) {
      const arr = questionsByQuiz.get(q.quiz_id) ?? [];
      arr.push({ ...q, options: optionsByQuestion.get(q.id) ?? [] });
      questionsByQuiz.set(q.quiz_id, arr);
    }
  }

  return stories.map((s) => {
    const quiz = quizByStory.get(s.id);
    return {
      story: s,
      videos: videosByStory.get(s.id) ?? [],
      hasQuiz: Boolean(quiz),
      questions: quiz ? questionsByQuiz.get(quiz.id) ?? [] : [],
    };
  });
}

// ---------- istituti (per il form classe) ----------
/**
 * Istituti a cui il docente è associato (teacher_institutes) — è ciò che vede nel
 * form "nuova classe". Fallback all'istituto di registrazione (profiles.institute_id)
 * se non ha ancora associazioni esplicite, così il dropdown non resta mai vuoto.
 * Unica fonte di verità: la POST /api/classi valida instituteId contro questa lista.
 */
export async function getTeacherInstitutes(teacherId: string): Promise<Institute[]> {
  let supabase;
  try {
    supabase = await server();
  } catch {
    return [];
  }
  const { data: links } = await supabase
    .from("teacher_institutes")
    .select("institute_id")
    .eq("teacher_id", teacherId);
  let ids = (links ?? []).map((r) => r.institute_id);
  if (!ids.length) {
    const { data: prof } = await supabase.from("profiles").select("institute_id").eq("id", teacherId).single();
    if (prof?.institute_id) ids = [prof.institute_id];
  }
  if (!ids.length) return [];
  const { data } = await supabase.from("institutes").select("*").in("id", ids).order("nome");
  return (data as Institute[]) ?? [];
}

// ---------- util interna ----------
async function getStories(supabase: Awaited<ReturnType<typeof server>>): Promise<Story[]> {
  const { data } = await supabase.from("stories").select("*").order("numero");
  return (data as Story[]) ?? [];
}

/** Nome formattato per la UI: riusa l'helper condiviso (no duplicazione). */
export { formatStudentName };
