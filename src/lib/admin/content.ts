// Lettura dell'albero contenuti di una singola storia (video + quiz + domande +
// opzioni) per l'editor Video & Quiz. service_role, lazy import.

import type { Quiz, QuizOption, QuizQuestion, Story, Video } from "../../types/db";

async function server() {
  const { supabaseServer } = await import("../supabase/server");
  return supabaseServer;
}

export interface QuestionWithOptions extends QuizQuestion {
  options: QuizOption[];
}

export interface StoryContent {
  story: Story;
  videos: Video[];
  quiz: Quiz | null;
  questions: QuestionWithOptions[];
}

export async function getStoryContent(storyId: string): Promise<StoryContent | null> {
  let supabase;
  try {
    supabase = await server();
  } catch {
    return null;
  }

  const { data: story } = await supabase.from("stories").select("*").eq("id", storyId).single();
  if (!story) return null;

  const { data: videos } = await supabase
    .from("videos")
    .select("*")
    .eq("story_id", storyId)
    .order("titolo");

  const { data: quiz } = await supabase.from("quizzes").select("*").eq("story_id", storyId).single();

  let questions: QuestionWithOptions[] = [];
  if (quiz) {
    const { data: qs } = await supabase
      .from("quiz_questions")
      .select("*")
      .eq("quiz_id", quiz.id)
      .order("ordine");
    const questionIds = (qs ?? []).map((q) => q.id);
    let optionsByQuestion = new Map<string, QuizOption[]>();
    if (questionIds.length) {
      const { data: opts } = await supabase.from("quiz_options").select("*").in("question_id", questionIds);
      for (const o of (opts as QuizOption[]) ?? []) {
        const arr = optionsByQuestion.get(o.question_id) ?? [];
        arr.push(o);
        optionsByQuestion.set(o.question_id, arr);
      }
    }
    questions = (qs as QuizQuestion[] ?? []).map((q) => ({
      ...q,
      options: optionsByQuestion.get(q.id) ?? [],
    }));
  }

  return {
    story: story as Story,
    videos: (videos as Video[]) ?? [],
    quiz: (quiz as Quiz) ?? null,
    questions,
  };
}
