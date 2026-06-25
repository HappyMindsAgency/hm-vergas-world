// Logica condivisa di import alunni in una classe: parsing file → display_name
// formattato → insert in students, gestendo i duplicati già presenti in classe.
// Usata sia da POST /api/classi (creazione con Excel) sia da POST /api/classi/import.
import { parseStudentFile } from "../studentImport";
import { formatStudentName } from "../format";

export interface ImportResult {
  created: number;
  skipped: number;
  /** Nomi scartati con motivo (per il report a video, ADR-7). */
  skippedDetails: Array<{ name: string; reason: "duplicato_nel_file" | "duplicato_in_classe" | "errore" }>;
}

type Server = Awaited<ReturnType<typeof import("./api").getServer>>;

/**
 * Importa gli alunni del file nella classe `classId`. Il display_name è formattato
 * con l'helper condiviso (Marco R.). Salta i duplicati (nel file e già in classe).
 * Il vincolo UNIQUE(class_id, display_name) è la garanzia finale: se una insert
 * collide, l'alunno è contato come skipped (non rompe l'import).
 */
export async function importStudentsIntoClass(
  supabase: Server,
  classId: string,
  filename: string,
  bytes: Uint8Array,
): Promise<ImportResult> {
  const parsed = parseStudentFile(filename, bytes);
  const result: ImportResult = {
    created: 0,
    skipped: 0,
    skippedDetails: parsed.duplicatesInFile.map((name) => ({ name, reason: "duplicato_nel_file" as const })),
  };
  result.skipped += parsed.duplicatesInFile.length;

  // display_name formattato; deduplica anche le forme formattate identiche
  // (es. "Marco Rossi" e "Marco Rossi"→ diversi; "Marco Rossi" due volte già tolto).
  const displayNames = parsed.names.map((raw) => formatStudentName(raw));

  // alunni già presenti in classe (per non riproporli).
  const { data: existing } = await supabase.from("students").select("display_name").eq("class_id", classId);
  const existingSet = new Set((existing ?? []).map((s) => s.display_name.toLowerCase()));

  const seenFormatted = new Set<string>();
  const toInsert: string[] = [];
  for (const name of displayNames) {
    const key = name.toLowerCase();
    if (existingSet.has(key)) {
      result.skipped++;
      result.skippedDetails.push({ name, reason: "duplicato_in_classe" });
      continue;
    }
    if (seenFormatted.has(key)) {
      result.skipped++;
      result.skippedDetails.push({ name, reason: "duplicato_nel_file" });
      continue;
    }
    seenFormatted.add(key);
    toInsert.push(name);
  }

  if (toInsert.length) {
    const rows = toInsert.map((display_name) => ({ class_id: classId, display_name }));
    // ignoreDuplicates: in caso di race sul vincolo UNIQUE, non solleva.
    const { data, error } = await supabase
      .from("students")
      .upsert(rows, { onConflict: "class_id,display_name", ignoreDuplicates: true })
      .select("id");
    if (error) {
      // se l'insert massiva fallisce, segnaliamo tutti come errore.
      for (const name of toInsert) result.skippedDetails.push({ name, reason: "errore" });
      result.skipped += toInsert.length;
    } else {
      result.created += data?.length ?? 0;
      result.skipped += toInsert.length - (data?.length ?? 0);
    }
  }

  return result;
}
