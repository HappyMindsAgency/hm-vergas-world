// Helper condiviso YouTube: trasforma watch?v=, youtu.be o id nudo nell'URL di
// embed. Estratto qui per non duplicare la stessa regex tra le sezioni (Docenti +
// Alunni passaporto). Single responsibility: solo costruzione dell'URL di embed.

/** URL di embed YouTube da una URL completa, da un link youtu.be o da un id nudo. */
export function youtubeEmbed(urlOrId: string): string {
  const m = urlOrId.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
  const id = m ? m[1] : urlOrId.trim();
  return `https://www.youtube.com/embed/${id}`;
}
