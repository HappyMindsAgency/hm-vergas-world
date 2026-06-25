// Pool HARDCODATO degli oggetti per "L'indizio di Verga" (brief §5, §9.1).
// NON va in DB. Un oggetto per storia (1–7); ne ruota uno al giorno (ADR-4).
// Le immagini puntano a file in /public/immagini.

export interface Indizio {
  storyNumero: number; // 1–7, collega alla storia
  storiaTitolo: string; // titolo della storia collegata
  nome: string; // nome oggetto mostrato nel box
  immagine: string; // path in /public
  descrizioneStoria: string; // passo della storia mostrato nella modale di congratulazioni
}

export const INDIZI: Indizio[] = [
  {
    storyNumero: 1,
    storiaTitolo: "La casa delle storie",
    nome: "L'orologio da taschino di Carletto",
    immagine: "/immagini/orologio da taschino di Carletto.jpg",
    descrizioneStoria:
      "Carletto stringe l'orologio del nonno: il suo ticchettio scandisce il tempo dei racconti dentro la Casa Verga. Ogni lancetta apre la porta di una nuova storia.",
  },
  {
    storyNumero: 2,
    storiaTitolo: "La voce della piazza",
    nome: "La bandiera della piazza",
    immagine: "/immagini/banda_di_verga_pagina_14.jpg",
    descrizioneStoria:
      "Nella piazza gremita una voce sola diventa coro: è il momento in cui il desiderio di libertà di tutti si fa scelta difficile per ciascuno.",
  },
  {
    storyNumero: 3,
    storiaTitolo: "Il campo di Mazzarò",
    nome: "Il sasso colorato del sentiero",
    immagine: "/immagini/SASSO colorato.jpg",
    descrizioneStoria:
      "Mazzarò guarda la sua terra dall'alba al tramonto: tra spighe e confini, un piccolo sasso ricorda quanto valgono davvero le cose che si possiedono.",
  },
  {
    storyNumero: 4,
    storiaTitolo: "La barca dei Malavoglia",
    nome: "La rete dei Malavoglia",
    immagine: "/immagini/malavoglia.jpg",
    descrizioneStoria:
      "Il mare prova la famiglia come un'onda: la rete tirata insieme tiene unita la casa dei Malavoglia anche quando la barca rischia di affondare.",
  },
  {
    storyNumero: 5,
    storiaTitolo: "Il vicolo di Rosso",
    nome: "Il lume della cava",
    immagine: "/immagini/malpelo.jpg",
    descrizioneStoria:
      "Nel buio della cava Rosso Malpelo cammina più dritto di tutti: la sua luce racconta la diversità, lo sguardo degli altri e la forza di chi resta in piedi.",
  },
  {
    storyNumero: 6,
    storiaTitolo: "Il sentiero di Gramigna",
    nome: "Il fazzoletto sul sentiero",
    immagine: "/immagini/incontro con gesualdo.jpg",
    descrizioneStoria:
      "Lungo il sentiero un fazzoletto dimenticato apre una domanda: ogni scelta porta una conseguenza, e il desiderio di libertà ha sempre un prezzo.",
  },
  {
    storyNumero: 7,
    storiaTitolo: "La festa del paese",
    nome: "Il carretto della festa",
    immagine: "/immagini/banda_di_verga_pagina_01.jpg",
    descrizioneStoria:
      "Suoni, carretti e tradizioni riempiono il cortile: nella festa del paese l'orgoglio e le parole non dette diventano il cuore della comunità.",
  },
];
