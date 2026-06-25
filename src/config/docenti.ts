// Config visibile dell'Area Docenti (brief §9.3). Testi fissi e parametri UI qui:
// niente magic string sparse nelle pagine. Riusa i token di museo.css (palette
// condivisa); aggiunge solo ciò che è specifico dei Docenti.

export type DocenteIcon = "dashboard" | "classi" | "contenuti" | "materiali" | "impostazioni" | "logout";

/** Voce del menu laterale. `match` decide lo stato attivo per prefisso di path. */
export interface DocenteNavItem {
  label: string;
  href: string;
  match: string;
  icon: DocenteIcon;
}

export const DOCENTE_NAV: DocenteNavItem[] = [
  { label: "Dashboard", href: "/insegnante", match: "/insegnante", icon: "dashboard" },
  { label: "Le mie classi", href: "/insegnante/classi", match: "/insegnante/classi", icon: "classi" },
  { label: "Video & Quiz", href: "/insegnante/contenuti", match: "/insegnante/contenuti", icon: "contenuti" },
  { label: "Materiali", href: "/insegnante/materiali", match: "/insegnante/materiali", icon: "materiali" },
  { label: "Impostazioni", href: "/insegnante/impostazioni", match: "/insegnante/impostazioni", icon: "impostazioni" },
];

/** Lunghezza della password forte generata sul completamento registrazione (§9.3). */
export const STRONG_PASSWORD_LENGTH = 12;

/**
 * Set di caratteri per la password forte: alfanumerici + simboli semplici (§9.3).
 * Esclusi caratteri ambigui (0/O, 1/l/I) per leggibilità a video.
 */
export const STRONG_PASSWORD_ALPHABET =
  "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789-_.*][()!$%&";

/** Estensioni accettate dall'upload alunni (Excel + CSV di cortesia). */
export const STUDENT_IMPORT_ACCEPT = ".xlsx,.csv";

/** Intestazioni di colonna riconosciute come header (riga saltata se presente). */
export const STUDENT_IMPORT_HEADER_HINTS = ["nome cognome", "nome e cognome", "alunno", "nome", "cognome"];
