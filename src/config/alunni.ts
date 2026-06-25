// Config visibile dell'Area Alunni (brief §9.4). Testi fissi e parametri UI qui:
// niente magic string sparse nelle pagine.

/** Nome del cookie HttpOnly firmato della sessione alunno (ADR-2). */
export const STUDENT_COOKIE = "vw-alunno";

/**
 * Rank mostrato nel passaporto in base ai badge conquistati. Puramente decorativo
 * (nessun effetto su permessi). Si sceglie l'ultimo livello la cui soglia è <= badge.
 */
export const STUDENT_RANKS: { soglia: number; label: string }[] = [
  { soglia: 0, label: "Esploratore Principiante" },
  { soglia: 3, label: "Esploratore Esperto" },
  { soglia: 6, label: "Esploratore Provetto" },
  { soglia: 7, label: "Maestro del Verga's World" },
];

/** Testo dell'avviso "nessun recupero password" (brief §9.4). */
export const STUDENT_HELP_TEXT =
  "In caso di problemi contatta il docente di riferimento: lui può ricontrollare il codice classe e il tuo nome.";

/** Formato del nome alunno da mostrare nell'UI di login (brief §9.4). */
export const STUDENT_NAME_HINT = "Scrivilo come te lo ha dato il docente, es. Marco R.";
