// POST /api/video-quiz — (admin) gestione contenuti video & quiz (§11.9: i quiz
// sono gestiti dal pannello Admin, niente seed). Un solo endpoint con campo
// `action` per coprire le scritture sull'albero contenuti. Scrive su
// videos/quizzes/quiz_questions/quiz_options (poi consumati dagli Alunni).
import type { APIRoute } from "astro";
import { json, badRequest, serverError, getServer, guardAdmin } from "../../../lib/admin/api";
import type { VideoSource } from "../../../types/db";

export const prerender = false;

const VIDEO_SOURCES: VideoSource[] = ["youtube", "asset"];

export const POST: APIRoute = async ({ request, cookies }) => {
  const admin = await guardAdmin(cookies);
  if (admin instanceof Response) return admin;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return badRequest("Body non valido");
  }
  const action = String(body.action ?? "");

  let supabase;
  try {
    supabase = await getServer();
  } catch {
    return serverError("Configurazione server mancante");
  }

  const str = (k: string) => String(body[k] ?? "").trim();

  switch (action) {
    case "add-video": {
      const storyId = str("storyId");
      const titolo = str("titolo");
      const sourceType = str("sourceType") as VideoSource;
      const urlOrPath = str("urlOrPath");
      if (!storyId || !titolo || !urlOrPath) return badRequest("Campi mancanti");
      if (!VIDEO_SOURCES.includes(sourceType)) return badRequest("Sorgente non valida");
      const { error } = await supabase.from("videos").insert({
        story_id: storyId,
        titolo,
        source_type: sourceType,
        url_or_path: urlOrPath,
      });
      if (error) return serverError("Inserimento video non riuscito");
      return json({ ok: true }, 201);
    }

    case "delete-video": {
      const videoId = str("videoId");
      if (!videoId) return badRequest("ID video mancante");
      const { error } = await supabase.from("videos").delete().eq("id", videoId);
      if (error) return serverError("Rimozione video non riuscita");
      return json({ ok: true });
    }

    case "create-quiz": {
      const storyId = str("storyId");
      if (!storyId) return badRequest("ID storia mancante");
      // 1 quiz : 1 storia (UNIQUE su story_id): se esiste, lo restituiamo.
      const { data: existing } = await supabase.from("quizzes").select("id").eq("story_id", storyId).single();
      if (existing) return json({ ok: true, quizId: existing.id });
      const { data, error } = await supabase.from("quizzes").insert({ story_id: storyId }).select("id").single();
      if (error) return serverError("Creazione quiz non riuscita");
      return json({ ok: true, quizId: data.id }, 201);
    }

    case "add-question": {
      const quizId = str("quizId");
      const testo = str("testo");
      if (!quizId || !testo) return badRequest("Campi mancanti");
      // ordine = max(ordine)+1 per il quiz.
      const { data: last } = await supabase
        .from("quiz_questions")
        .select("ordine")
        .eq("quiz_id", quizId)
        .order("ordine", { ascending: false })
        .limit(1)
        .maybeSingle();
      const ordine = (last?.ordine ?? 0) + 1;
      const { data, error } = await supabase
        .from("quiz_questions")
        .insert({ quiz_id: quizId, testo, ordine })
        .select("id")
        .single();
      if (error) return serverError("Inserimento domanda non riuscito");
      return json({ ok: true, questionId: data.id }, 201);
    }

    case "edit-question": {
      const questionId = str("questionId");
      const testo = str("testo");
      if (!questionId || !testo) return badRequest("Campi mancanti");
      const { error } = await supabase.from("quiz_questions").update({ testo }).eq("id", questionId);
      if (error) return serverError("Modifica domanda non riuscita");
      return json({ ok: true });
    }

    case "delete-question": {
      const questionId = str("questionId");
      if (!questionId) return badRequest("ID domanda mancante");
      const { error } = await supabase.from("quiz_questions").delete().eq("id", questionId);
      if (error) return serverError("Eliminazione domanda non riuscita");
      return json({ ok: true });
    }

    case "add-option": {
      const questionId = str("questionId");
      const testo = str("testo");
      const isCorrect = body.isCorrect === true;
      if (!questionId || !testo) return badRequest("Campi mancanti");
      const { error } = await supabase
        .from("quiz_options")
        .insert({ question_id: questionId, testo, is_correct: isCorrect });
      if (error) return serverError("Inserimento opzione non riuscito");
      return json({ ok: true }, 201);
    }

    case "edit-option": {
      const optionId = str("optionId");
      if (!optionId) return badRequest("ID opzione mancante");
      // Aggiorna solo i campi passati: testo e/o correttezza.
      const patch: { testo?: string; is_correct?: boolean } = {};
      if (typeof body.testo === "string" && body.testo.trim()) patch.testo = body.testo.trim();
      if (typeof body.isCorrect === "boolean") patch.is_correct = body.isCorrect;
      if (Object.keys(patch).length === 0) return badRequest("Nessun campo da aggiornare");
      const { error } = await supabase.from("quiz_options").update(patch).eq("id", optionId);
      if (error) return serverError("Modifica opzione non riuscita");
      return json({ ok: true });
    }

    case "delete-option": {
      const optionId = str("optionId");
      if (!optionId) return badRequest("ID opzione mancante");
      const { error } = await supabase.from("quiz_options").delete().eq("id", optionId);
      if (error) return serverError("Eliminazione opzione non riuscita");
      return json({ ok: true });
    }

    default:
      return badRequest("Azione non riconosciuta");
  }
};
