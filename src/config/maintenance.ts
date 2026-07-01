// Modalità manutenzione (config visibile). Interruttore diretto nel codice:
// metti `true` per accendere la splash a tutti, `false` per spegnere. Dopo la
// modifica serve un redeploy perché il valore è compilato nel middleware.
export const MAINTENANCE_ENABLED = true;

// Token di bypass: chi apre una pagina con ?bypass=<token> salta la manutenzione.
export const MAINTENANCE_BYPASS_TOKEN = "vergavizzini";

/** Cookie che ricorda il bypass tra le pagine dopo il primo ?bypass=<token>. */
export const MAINTENANCE_BYPASS_COOKIE = "vw-mnt-bypass";

/** Parametro GET che attiva il bypass. */
export const MAINTENANCE_BYPASS_PARAM = "bypass";

/** Durata del cookie di bypass (scadenza deterministica). Default 12h. */
export const MAINTENANCE_BYPASS_DURATION_SECONDS = 60 * 60 * 12;
