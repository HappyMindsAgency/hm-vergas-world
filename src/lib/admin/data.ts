// Letture aggregate per le pagine Admin (SSR). Tutto via service_role (lazy
// import: build senza DB non deve crashare). Le pagine chiamano questi helper e
// degradano a stato vuoto se le env mancano.

import type { Institute, Material, Profile, Story } from "../../types/db";

async function server() {
  const { supabaseServer } = await import("../supabase/server");
  return supabaseServer;
}

export interface DashboardStats {
  docentiTotali: number;
  istitutiTotali: number;
  classiTotali: number;
  docentiAttivi: number;
}

export interface TeacherRow extends Profile {
  istitutoNome: string | null;
  studentiCount: number;
  classiCount: number;
}

const EMPTY_STATS: DashboardStats = { docentiTotali: 0, istitutiTotali: 0, classiTotali: 0, docentiAttivi: 0 };

export async function getDashboardStats(): Promise<DashboardStats> {
  let supabase;
  try {
    supabase = await server();
  } catch {
    return EMPTY_STATS;
  }
  const [docenti, istituti, classi, attivi] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "teacher"),
    supabase.from("institutes").select("id", { count: "exact", head: true }),
    supabase.from("classes").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "teacher").eq("status", "active"),
  ]);
  return {
    docentiTotali: docenti.count ?? 0,
    istitutiTotali: istituti.count ?? 0,
    classiTotali: classi.count ?? 0,
    docentiAttivi: attivi.count ?? 0,
  };
}

/** Lista docenti con nome istituto e conteggio classi/studenti (per la tabella). */
export async function getTeachers(): Promise<TeacherRow[]> {
  let supabase;
  try {
    supabase = await server();
  } catch {
    return [];
  }
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "teacher")
    .order("cognome", { ascending: true });
  if (!profiles) return [];

  const [{ data: institutes }, { data: classes }] = await Promise.all([
    supabase.from("institutes").select("id, nome"),
    supabase.from("classes").select("id, teacher_id"),
  ]);

  const instMap = new Map((institutes ?? []).map((i) => [i.id, i.nome]));
  const classIds = (classes ?? []).map((c) => c.id);

  // conteggio studenti per classe → poi raggruppato per docente.
  let studentsPerClass = new Map<string, number>();
  if (classIds.length) {
    const { data: students } = await supabase.from("students").select("class_id").in("class_id", classIds);
    for (const s of students ?? []) {
      studentsPerClass.set(s.class_id, (studentsPerClass.get(s.class_id) ?? 0) + 1);
    }
  }

  const classesByTeacher = new Map<string, string[]>();
  for (const c of classes ?? []) {
    const arr = classesByTeacher.get(c.teacher_id) ?? [];
    arr.push(c.id);
    classesByTeacher.set(c.teacher_id, arr);
  }

  return (profiles as Profile[]).map((p) => {
    const teacherClasses = classesByTeacher.get(p.id) ?? [];
    const studentiCount = teacherClasses.reduce((sum, cid) => sum + (studentsPerClass.get(cid) ?? 0), 0);
    return {
      ...p,
      istitutoNome: p.institute_id ? (instMap.get(p.institute_id) ?? null) : null,
      classiCount: teacherClasses.length,
      studentiCount,
    };
  });
}

export async function getInstitutes(): Promise<Institute[]> {
  let supabase;
  try {
    supabase = await server();
  } catch {
    return [];
  }
  const { data } = await supabase.from("institutes").select("*").order("nome");
  return (data as Institute[]) ?? [];
}

export async function getTeacherDetail(id: string): Promise<TeacherRow | null> {
  const all = await getTeachers();
  return all.find((t) => t.id === id) ?? null;
}

export async function getMaterials(): Promise<Material[]> {
  let supabase;
  try {
    supabase = await server();
  } catch {
    return [];
  }
  const { data } = await supabase.from("materials").select("*").order("created_at", { ascending: false });
  return (data as Material[]) ?? [];
}

/** Materiali assegnati a un docente (lista di material_id). */
export async function getAssignedMaterialIds(teacherId: string): Promise<Set<string>> {
  let supabase;
  try {
    supabase = await server();
  } catch {
    return new Set();
  }
  const { data } = await supabase.from("material_assignments").select("material_id").eq("teacher_id", teacherId);
  return new Set((data ?? []).map((r) => r.material_id));
}

export interface StoryWithContent extends Story {
  hasVideo: boolean;
  videoCount: number;
  hasQuiz: boolean;
  questionCount: number;
}

export async function getStoriesWithContent(): Promise<StoryWithContent[]> {
  let supabase;
  try {
    supabase = await server();
  } catch {
    return [];
  }
  const { data: stories } = await supabase.from("stories").select("*").order("numero");
  if (!stories) return [];

  const [{ data: videos }, { data: quizzes }] = await Promise.all([
    supabase.from("videos").select("id, story_id"),
    supabase.from("quizzes").select("id, story_id"),
  ]);

  const videosByStory = new Map<string, number>();
  for (const v of videos ?? []) videosByStory.set(v.story_id, (videosByStory.get(v.story_id) ?? 0) + 1);

  const quizByStory = new Map<string, string>();
  for (const q of quizzes ?? []) quizByStory.set(q.story_id, q.id);

  // conteggio domande per quiz.
  const questionsByQuiz = new Map<string, number>();
  const quizIds = [...quizByStory.values()];
  if (quizIds.length) {
    const { data: questions } = await supabase.from("quiz_questions").select("quiz_id").in("quiz_id", quizIds);
    for (const q of questions ?? []) questionsByQuiz.set(q.quiz_id, (questionsByQuiz.get(q.quiz_id) ?? 0) + 1);
  }

  return (stories as Story[]).map((s) => {
    const quizId = quizByStory.get(s.id);
    return {
      ...s,
      hasVideo: (videosByStory.get(s.id) ?? 0) > 0,
      videoCount: videosByStory.get(s.id) ?? 0,
      hasQuiz: Boolean(quizId),
      questionCount: quizId ? (questionsByQuiz.get(quizId) ?? 0) : 0,
    };
  });
}
