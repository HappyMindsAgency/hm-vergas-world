// Pool HARDCODATO degli oggetti per "L'indizio di Verga" (brief §5, §9.1).
// NON va in DB. Ne ruota uno al giorno (ADR-4). Fonte testi+immagini:
// testi-vergasworld.pdf (sezione "Oggetti e modali" + associazione mappa).
// Le immagini puntano a file in /public/immagini/oggetti.

export interface Indizio {
  storyNumero: number; // 1–7, storia/luogo a cui l'oggetto è collegato
  storiaTitolo: string; // titolo della storia collegata
  nome: string; // nome oggetto mostrato nel box
  immagine: string; // path in /public
  descrizioneStoria: string; // testo "oggetto trovato" mostrato nella modale
  // Luogo della mappa in cui l'oggetto si nasconde (associazione dal PDF testi).
  // DEVE combaciare esattamente con un `nome` di LUOGHI in src/pages/index.astro:
  // indizio.js usa questa stringa per trovare il pin giusto.
  luogo: string;
}

export const INDIZI: Indizio[] = [
  {
    storyNumero: 2,
    storiaTitolo: "L'incontro con la Lupa",
    nome: "Sasso colorato",
    luogo: "I vicoli della Cunziria",
    immagine: "/immagini/oggetti/sasso-colorato.jpg",
    descrizioneStoria:
      "Hai trovato il sasso di Pina. Sembra una piccola pietra colorata, ma per Carletto diventa il ricordo del coraggio silenzioso: quello di chi protegge senza urlare e senza fare male.",
  },
  {
    storyNumero: 7,
    storiaTitolo: "Il ritorno di Carletto",
    nome: "Valigia",
    luogo: "Il panorama del ritorno",
    immagine: "/immagini/oggetti/valigia.jpg",
    descrizioneStoria:
      "Hai trovato la valigia di Carletto. Dentro non ci sono solo vestiti e oggetti da viaggio: ci sono ricordi, incontri e piccoli segni raccolti a Vizzini. È da qui che il racconto comincia, ed è qui che ogni storia può tornare.",
  },
  {
    storyNumero: 1,
    storiaTitolo: "L'inizio del viaggio",
    nome: "Panino",
    luogo: "Palazzo Verga",
    immagine: "/immagini/oggetti/panino.jpg",
    descrizioneStoria:
      "Hai trovato il panino rubato sotto la tovaglia. È un dettaglio piccolo, quasi buffo, ma cambia tutto: grazie a quel furto Carletto incontra Caterina e lascia il tavolo degli adulti per entrare nei vicoli di Vizzini.",
  },
  {
    storyNumero: 1,
    storiaTitolo: "L'inizio del viaggio",
    nome: "Orologio da taschino",
    luogo: "Palazzo Verga",
    immagine: "/immagini/oggetti/orologio-da-taschino.jpg",
    descrizioneStoria:
      "Hai trovato l'orologio di Carletto. Nella sala da pranzo il tempo sembra non passare mai: gli adulti parlano, le parole sono lunghe, la sedia è scomoda. Poi arriva Caterina, e il tempo dell'attesa diventa tempo d'avventura.",
  },
  {
    storyNumero: 3,
    storiaTitolo: "L'incontro con Gesualdo",
    nome: "Soldatino",
    luogo: "Il vicolo degli oggetti",
    immagine: "/immagini/oggetti/soldatino.jpg",
    descrizioneStoria:
      "Hai trovato il soldatino di Gesualdo. Lui lo stringe come un tesoro, insieme a tutte le cose del suo regno. È il segno di ciò che Gesualdo vuole proteggere: non solo oggetti, ma sicurezza, memoria e paura di perdere qualcosa.",
  },
  {
    storyNumero: 3,
    storiaTitolo: "L'incontro con Gesualdo",
    nome: "Scatola di caramelle",
    luogo: "Il vicolo degli oggetti",
    immagine: "/immagini/oggetti/scatola-di-caramelle.jpg",
    descrizioneStoria:
      "Hai trovato una scatola arrivata dal regno di Gesualdo. Per qualcun altro potrebbe sembrare solo una cosa vecchia, ma nel suo cortile ogni oggetto ha un posto. Anche le cose dimenticate possono diventare parte di un mondo.",
  },
  {
    storyNumero: 3,
    storiaTitolo: "L'incontro con Gesualdo",
    nome: "Cesto",
    luogo: "Il vicolo degli oggetti",
    immagine: "/immagini/oggetti/cesto.jpg",
    descrizioneStoria:
      "Hai trovato un cesto tra le cose di Gesualdo. Vuoto o pieno, rotto o intero, per lui ogni oggetto può servire a costruire il suo regno. Ma quando il regno si apre, quello che sembrava un muro può diventare un passaggio.",
  },
  {
    storyNumero: 3,
    storiaTitolo: "L'incontro con Gesualdo",
    nome: "Cavallino giocattolo",
    luogo: "Il vicolo degli oggetti",
    immagine: "/immagini/oggetti/cavallino-giocattolo.jpg",
    descrizioneStoria:
      "Hai trovato un vecchio cavallino. Forse qualcuno lo ha lasciato lì, forse Gesualdo lo ha salvato dalla polvere. Nel suo cortile le cose dimenticate tornano ad avere valore, finché imparano a non tenerlo lontano dagli altri.",
  },
  {
    storyNumero: 3,
    storiaTitolo: "L'incontro con Gesualdo",
    nome: "Carretto giocattolo",
    luogo: "Il vicolo degli oggetti",
    immagine: "/immagini/oggetti/carretto.jpg",
    descrizioneStoria:
      "Hai trovato un piccolo carretto pieno di cose. Nel mondo di Gesualdo ogni oggetto sembra dire: “non buttarmi via”. Ma la storia insegna che custodire non significa chiudere tutto: a volte condividere apre una strada nuova.",
  },
  {
    storyNumero: 3,
    storiaTitolo: "L'incontro con Gesualdo",
    nome: "Gruppo di giocattoli",
    luogo: "Il vicolo degli oggetti",
    immagine: "/immagini/oggetti/gruppo-giocattoli.jpg",
    descrizioneStoria:
      "Hai trovato alcuni giocattoli del regno di Gesualdo. Sono piccoli, diversi, un po' consumati: proprio per questo raccontano bene il suo mondo. Ogni cosa sembra senza valore, finché qualcuno decide di guardarla davvero.",
  },
  {
    storyNumero: 5,
    storiaTitolo: "L'incontro con Turiddu e Alfio",
    nome: "Cannoli e dolci",
    luogo: "La piazza della Morra",
    immagine: "/immagini/oggetti/cannoli.jpg",
    descrizioneStoria:
      "Hai trovato i cannoli di Turiddu e Alfio. Arrivano dopo una sfida rumorosa, fatta di mani veloci e numeri gridati. Quando il gioco finisce, finisce anche il rancore: ci si siede insieme e si divide qualcosa di buono.",
  },
  {
    storyNumero: 4,
    storiaTitolo: "L'incontro con Rosso",
    nome: "Disegni di Rosso",
    luogo: "La grotta di Rosso",
    immagine: "/immagini/oggetti/fogli.jpg",
    descrizioneStoria:
      "Hai trovato i disegni di Rosso. Frecce, linee e misure sembrano segni misteriosi, ma raccontano un'idea precisa: portare l'acqua fino al paese. Carletto capisce che il talento può nascondersi dove nessuno si ferma a guardare.",
  },
  {
    storyNumero: 6,
    storiaTitolo: "L'incontro con i Malavoglia",
    nome: "Nespolo",
    luogo: "La collina del nespolo",
    immagine: "/immagini/oggetti/nespolo.jpg",
    descrizioneStoria:
      "Hai trovato il nespolo dei Malavoglia. Le sue radici tengono insieme casa, famiglia e ricordi. Per Carletto diventa il segno del posto da cui si parte e a cui si può sempre tornare.",
  },
  {
    storyNumero: 6,
    storiaTitolo: "L'incontro con i Malavoglia",
    nome: "Barca",
    luogo: "La collina del nespolo",
    immagine: "/immagini/oggetti/barca.jpg",
    descrizioneStoria:
      "Hai trovato la barca dei Malavoglia. È ferma sull'erba, lontana dal mare, ma dentro porta un sogno di viaggio. Carletto scopre che si può immaginare di partire anche restando con i piedi nella propria terra.",
  },
];
