// Parsing del file di import alunni (ADR-7): UNA colonna "Nome Cognome",
// una riga per alunno, header opzionale. Righe vuote saltate; i duplicati nella
// stessa lista sono scartati (case-insensitive) e riportati.
//
// Formato XLSX: è uno ZIP di XML. Per non aggiungere una libreria pesante (e con
// CVE note come SheetJS), leggiamo solo la prima colonna del primo foglio con
// fflate (unzip puro, leggero) + una scansione XML minimale. Accettiamo anche CSV.
import { unzipSync, strFromU8 } from "fflate";
import { STUDENT_IMPORT_HEADER_HINTS } from "../config/docenti";

export interface ParsedImport {
  /** Nomi grezzi (prima colonna), già ripuliti e senza header/duplicati/vuoti. */
  names: string[];
  /** Nomi scartati perché duplicati nel file (case-insensitive). */
  duplicatesInFile: string[];
}

/** Entry-point: sceglie il parser in base al nome file. */
export function parseStudentFile(filename: string, bytes: Uint8Array): ParsedImport {
  const lower = filename.toLowerCase();
  const rawRows = lower.endsWith(".csv") ? parseCsvFirstColumn(bytes) : parseXlsxFirstColumn(bytes);
  return dedupe(stripHeader(rawRows));
}

/** Toglie spazi e collassa gli spazi interni; "" se vuoto. */
function clean(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/** Salta la prima riga se sembra un'intestazione (es. "Nome Cognome"). */
function stripHeader(rows: string[]): string[] {
  if (rows.length === 0) return rows;
  const first = rows[0].toLowerCase();
  if (STUDENT_IMPORT_HEADER_HINTS.includes(first)) return rows.slice(1);
  return rows;
}

/** Rimuove vuoti e duplicati (case-insensitive), conservando l'ordine. */
function dedupe(rows: string[]): ParsedImport {
  const seen = new Set<string>();
  const names: string[] = [];
  const duplicatesInFile: string[] = [];
  for (const raw of rows) {
    const name = clean(raw);
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) {
      duplicatesInFile.push(name);
      continue;
    }
    seen.add(key);
    names.push(name);
  }
  return { names, duplicatesInFile };
}

// ---------- CSV ----------
/** Prima colonna di un CSV: tutto prima della prima virgola/punto e virgola/tab. */
function parseCsvFirstColumn(bytes: Uint8Array): string[] {
  const text = strFromU8(bytes).replace(/^﻿/, ""); // via BOM
  return text
    .split(/\r\n|\r|\n/)
    .map((line) => firstCsvCell(line))
    .filter((cell) => cell !== null) as string[];
}

/** Estrae la prima cella di una riga CSV, rispettando le virgolette. */
function firstCsvCell(line: string): string | null {
  if (line === "") return "";
  if (line[0] === '"') {
    let out = "";
    for (let i = 1; i < line.length; i++) {
      if (line[i] === '"') {
        if (line[i + 1] === '"') {
          out += '"';
          i++;
        } else break;
      } else out += line[i];
    }
    return out;
  }
  const sep = line.search(/[,;\t]/);
  return sep === -1 ? line : line.slice(0, sep);
}

// ---------- XLSX ----------
/**
 * Prima colonna (A) del primo foglio di un .xlsx. Legge le celle A* dal foglio e
 * risolve le stringhe condivise (sharedStrings.xml). Numeri/inline string gestiti.
 */
function parseXlsxFirstColumn(bytes: Uint8Array): string[] {
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(bytes);
  } catch {
    throw new Error("File non leggibile: non è un .xlsx valido.");
  }

  const sheetPath = firstSheetPath(files);
  if (!sheetPath || !files[sheetPath]) throw new Error("Foglio di lavoro non trovato nel file.");

  const sharedStrings = parseSharedStrings(files["xl/sharedStrings.xml"]);
  const sheetXml = strFromU8(files[sheetPath]);

  // Per ogni cella in colonna A: r="A1", A2, …; t="s" → indice in sharedStrings.
  const rows: Array<{ row: number; value: string }> = [];
  const cellRe = /<c\b[^>]*\br="A(\d+)"[^>]*?(?:\bt="([^"]*)")?[^>]*>([\s\S]*?)<\/c>|<c\b[^>]*\br="A(\d+)"[^>]*\/>/g;
  let m: RegExpExecArray | null;
  while ((m = cellRe.exec(sheetXml)) !== null) {
    if (m[4] !== undefined) continue; // cella vuota self-closing
    const row = Number(m[1]);
    const type = m[2];
    const inner = m[3] ?? "";
    let value = "";
    if (type === "s") {
      const idx = Number(extractTag(inner, "v"));
      value = sharedStrings[idx] ?? "";
    } else if (type === "inlineStr") {
      value = decodeXml(stripTags(extractTag(inner, "t") || inner));
    } else {
      value = decodeXml(extractTag(inner, "v"));
    }
    rows.push({ row, value });
  }

  rows.sort((a, b) => a.row - b.row);
  return rows.map((r) => r.value);
}

/** Path del primo foglio. Default xl/worksheets/sheet1.xml, con fallback. */
function firstSheetPath(files: Record<string, Uint8Array>): string | null {
  if (files["xl/worksheets/sheet1.xml"]) return "xl/worksheets/sheet1.xml";
  const any = Object.keys(files).find((p) => /^xl\/worksheets\/sheet\d+\.xml$/.test(p));
  return any ?? null;
}

/** sharedStrings.xml → array di stringhe (indicizzato come nel file). */
function parseSharedStrings(file: Uint8Array | undefined): string[] {
  if (!file) return [];
  const xml = strFromU8(file);
  const out: string[] = [];
  const siRe = /<si\b[^>]*>([\s\S]*?)<\/si>/g;
  let m: RegExpExecArray | null;
  while ((m = siRe.exec(xml)) !== null) {
    // una <si> può avere più <t> (rich text): concatena.
    const parts = [...m[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]);
    out.push(decodeXml(parts.join("")));
  }
  return out;
}

function extractTag(xml: string, tag: string): string {
  const m = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`).exec(xml);
  return m ? m[1] : "";
}

function stripTags(xml: string): string {
  return xml.replace(/<[^>]+>/g, "");
}

function decodeXml(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&amp;/g, "&");
}
