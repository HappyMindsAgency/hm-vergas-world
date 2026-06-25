// Allocazione del codice classe con gestione collisioni (ADR-5).
// Il codice base è NOME-ISTITUTO-ANNO (buildClassCode); l'univocità reale è il
// vincolo UNIQUE su classes.access_code. Qui:
//  1) proponiamo il primo codice libero rispetto ai codici già noti (nextFreeClassCode);
//  2) inseriamo la classe; se il DB rifiuta per collisione UNIQUE (race con un altro
//     insert), ricalcoliamo includendo i codici aggiornati e riproviamo.
import { buildClassCode, nextFreeClassCode } from "../classCode";

type Server = Awaited<ReturnType<typeof import("./api").getServer>>;

const UNIQUE_VIOLATION = "23505";
const MAX_RETRIES = 5;

export interface CreatedClass {
  id: string;
  access_code: string;
}

/**
 * Inserisce una classe generando un access_code univoco. Ritorna id + codice,
 * oppure lancia se non riesce dopo i retry (caso patologico).
 */
export async function insertClassWithUniqueCode(
  supabase: Server,
  params: { teacherId: string; instituteId: string; nome: string; anno: number; istitutoNome: string },
): Promise<CreatedClass> {
  const base = buildClassCode(params.nome, params.istitutoNome, params.anno);

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const taken = await loadTakenCodesLike(supabase, base);
    const code = nextFreeClassCode(base, taken);

    const { data, error } = await supabase
      .from("classes")
      .insert({
        teacher_id: params.teacherId,
        institute_id: params.instituteId,
        nome: params.nome,
        anno: params.anno,
        access_code: code,
      })
      .select("id, access_code")
      .single();

    if (!error && data) return { id: data.id, access_code: data.access_code };
    // collisione UNIQUE: un altro insert ha preso il codice nel frattempo → riprova.
    if (error?.code !== UNIQUE_VIOLATION) {
      throw new Error(error?.message ?? "Creazione classe non riuscita");
    }
  }
  throw new Error("Impossibile generare un codice classe univoco. Riprova.");
}

/** Carica i codici esistenti che partono dal base (base, base-2, …). */
async function loadTakenCodesLike(supabase: Server, base: string): Promise<Set<string>> {
  const { data } = await supabase.from("classes").select("access_code").like("access_code", `${base}%`);
  return new Set((data ?? []).map((r) => r.access_code));
}
