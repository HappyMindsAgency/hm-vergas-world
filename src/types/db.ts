// Tipi condivisi del DB — CONTRATTO congelato (brief §5).
// ponytail: scritti a mano finché non c'è un DB live; quando c'è, rigenera con
//   `supabase gen types typescript --local > src/types/db.ts` e tieni questo file come riferimento.

export type UserRole = "admin" | "teacher";
export type ProfileStatus = "active" | "inactive" | "disabled";
export type VideoSource = "youtube" | "asset";
export type MaterialCategory = "prima_visita" | "percorsi_tematici" | "dopo_visita";

export interface Institute {
  id: string;
  nome: string;
  citta: string;
}

export interface Profile {
  id: string;
  role: UserRole;
  nome: string;
  cognome: string;
  email: string;
  institute_id: string | null;
  status: ProfileStatus;
  created_at: string;
  last_login_at: string | null;
}

export interface Class {
  id: string;
  teacher_id: string;
  institute_id: string;
  nome: string;
  anno: number;
  access_code: string;
  created_at: string;
}

export interface Student {
  id: string;
  class_id: string;
  display_name: string;
  created_at: string;
  last_activity_at: string | null;
}

export interface Story {
  id: string;
  numero: number;
  titolo: string;
  sinossi: string | null;
  images: string[];
}

export interface Character {
  id: string;
  story_id: string;
  nome: string;
  soprannome: string | null;
  descrizione: string | null;
  immagine: string | null;
}

export interface Video {
  id: string;
  story_id: string;
  titolo: string;
  source_type: VideoSource;
  url_or_path: string;
}

export interface Quiz {
  id: string;
  story_id: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  testo: string;
  ordine: number;
}

export interface QuizOption {
  id: string;
  question_id: string;
  testo: string;
  is_correct: boolean;
}

export interface StudentQuizAttempt {
  id: string;
  student_id: string;
  quiz_id: string;
  score: number;
  passed: boolean;
  completed_at: string;
}

export interface StudentBadge {
  student_id: string;
  story_id: string;
  earned_at: string;
}

export interface Material {
  id: string;
  nome: string;
  file_path: string;
  category: MaterialCategory;
  uploaded_by: string | null;
  created_at: string;
}

export interface MaterialAssignment {
  material_id: string;
  teacher_id: string;
}

export interface TeacherInstitute {
  teacher_id: string;
  institute_id: string;
}
