// Parametri di gioco e costanti condivise (config visibile, brief §3).

/** Numero di storie/video/quiz/badge. */
export const STORIES_COUNT = 7;

/** Quiz superato con al massimo questo numero di errori (§11.9). */
export const QUIZ_MAX_ERRORS = 1;

/** Fuso di riferimento per la rotazione dell'indizio e i countdown (§11.4). */
export const GAME_TIMEZONE = "Europe/Rome";

/** Categorie materiali (allineate all'enum DB material_category). */
export const MATERIAL_CATEGORIES = ["prima_visita", "percorsi_tematici", "dopo_visita"] as const;
