// Config visibile dell'Area Museo/Admin (brief §9.2). Testi fissi e parametri UI
// vivono qui: niente magic string sparse nelle pagine.

import type { MaterialCategory, ProfileStatus } from "../types/db";

/** Voce del menu laterale. `match` decide lo stato attivo per prefisso di path. */
export interface AdminNavItem {
  label: string;
  href: string;
  /** prefisso di pathname che attiva la voce (oltre all'href esatto) */
  match: string;
  icon: AdminIcon;
}

export type AdminIcon = "dashboard" | "docenti" | "materiali" | "video" | "impostazioni" | "logout";

export const ADMIN_NAV: AdminNavItem[] = [
  { label: "Dashboard", href: "/museo", match: "/museo", icon: "dashboard" },
  { label: "Docenti", href: "/museo/docenti", match: "/museo/docenti", icon: "docenti" },
  { label: "Materiali", href: "/museo/materiali", match: "/museo/materiali", icon: "materiali" },
  { label: "Video & Quiz", href: "/museo/video-quiz", match: "/museo/video-quiz", icon: "video" },
  { label: "Impostazioni", href: "/museo/impostazioni", match: "/museo/impostazioni", icon: "impostazioni" },
];

/** Etichette leggibili per le categorie materiale (enum DB → IT). */
export const MATERIAL_CATEGORY_LABELS: Record<MaterialCategory, string> = {
  prima_visita: "Prima della visita",
  percorsi_tematici: "Percorsi tematici",
  dopo_visita: "Dopo la visita",
};

/** Etichette leggibili per lo stato profilo docente. */
export const PROFILE_STATUS_LABELS: Record<ProfileStatus, string> = {
  active: "Attivo",
  inactive: "In attesa",
  disabled: "Disattivato",
};

/** Colori badge Bootstrap per stato profilo. */
export const PROFILE_STATUS_BADGE: Record<ProfileStatus, string> = {
  active: "text-bg-success",
  inactive: "text-bg-warning",
  disabled: "text-bg-secondary",
};

/** Criteri di ordinamento della tabella Gestione Docenti (§9.2). */
export const DOCENTI_SORT_OPTIONS = [
  { value: "nome", label: "Nome" },
  { value: "istituto", label: "Istituto" },
  { value: "studenti", label: "N. studenti" },
  { value: "registrazione", label: "Data registrazione" },
  { value: "ultimo_accesso", label: "Ultimo accesso" },
] as const;

export type DocentiSortKey = (typeof DOCENTI_SORT_OPTIONS)[number]["value"];

/** Storage bucket per i materiali (Supabase Storage). */
export const MATERIALS_BUCKET = "materiali";

/** Bordo coerente tra DB (storia.numero 1..7) e UI. */
export const STORIES_RANGE = { min: 1, max: 7 } as const;
