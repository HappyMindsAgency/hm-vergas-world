const VALID_CODES = [
  { code: "VRG-2024", classId: "demo-class-vrg", className: "Classe demo", active: true },
  { code: "VIZZINI", classId: "demo-class-vizzini", className: "Visita Museo", active: true },
  { code: "CAT-2026", classId: "demo-class-caterina", className: "Avventura Caterina", active: true },
  { code: "PASS-2026", classId: "demo-class-passaporto", className: "Test Passaporto", active: true },
];

const STORIES = [
  ["carletto-arriva", "Carletto arriva a Vizzini"],
  ["la-lupa", "La Lupa"],
  ["cavalleria", "Cavalleria Rusticana"],
  ["rosso-malpelo", "Rosso Malpelo"],
  ["malavoglia", "I Malavoglia"],
  ["gesualdo", "Mastro-don Gesualdo"],
  ["segreto-marco", "Il segreto di Marco"],
];

const STORY_IMAGES = {
  "carletto-arriva": "/immagini/badge-carletto-arriva.svg",
  "la-lupa": "/immagini/badge-la-lupa.svg",
  cavalleria: "/immagini/badge-cavalleria.svg",
  "rosso-malpelo": "/immagini/badge-rosso-malpelo.svg",
  malavoglia: "/immagini/badge-malavoglia.svg",
  gesualdo: "/immagini/badge-gesualdo.svg",
  "segreto-marco": "/immagini/badge-segreto-marco.svg",
};

const FALLBACK_QUIZZES = {
  "carletto-arriva": {
    title: "Carletto arriva a Vizzini",
    questions: [
      {
        text: "Come si chiama il bambino protagonista della storia?",
        options: ["Marco", "Carletto", "Gesualdo", "Turiddu"],
        correct: 1,
        explanation: "Il protagonista si chiama Carletto, ha 10 anni ed e figlio di uno scrittore milanese.",
      },
      {
        text: "Da quale citta arriva Carletto prima di andare a Vizzini?",
        options: ["Roma", "Napoli", "Milano", "Palermo"],
        correct: 2,
        explanation: "Carletto viene da Milano, una citta grigia e ordinata, molto diversa dalla colorata Vizzini.",
      },
      {
        text: "Cosa trova Carletto nella valigia che lo fa sognare?",
        options: ["Una conchiglia", "Un fazzoletto ricamato", "Un sasso colorato", "Una pigna secca"],
        correct: 2,
        explanation: "Carletto trova un sasso colorato che vale per lui piu di tutti gli altri oggetti della valigia messi insieme.",
      },
      {
        text: "Come si chiama il primo amico che Carletto incontra a Vizzini?",
        options: ["Rosso", "Alfio", "Marco", "Gesualdo"],
        correct: 2,
        explanation: "Marco appare da sotto il tavolo durante il pranzo degli adulti, con gli occhi neri come le olive e il panino di Carletto in mano.",
      },
      {
        text: "Cosa stava facendo Carletto all'inizio della storia, seduto sul davanzale?",
        options: ["Leggeva un libro", "Guardava fuori dalla finestra annoiato", "Giocava con i giocattoli", "Scriveva una lettera"],
        correct: 1,
        explanation: "Carletto guardava la grigia Milano, annoiato e malinconico.",
      },
    ],
  },
  "la-lupa": {
    title: "La Lupa",
    questions: [
      {
        text: "Come si chiama la bambina che aiuta Carletto e Marco nel vicolo?",
        options: ["Nina", "Pina", "Maria", "Rosa"],
        correct: 1,
        explanation: "La bambina si chiama Pina, ha tredici anni, capelli neri sciolti e i piedi scalzi sulla pietra calda.",
      },
      {
        text: "Perche a Vizzini chiamano Pina 'La Lupa'?",
        options: ["Perche corre veloce come un lupo", "Perche abita nei boschi", "Perche protegge gli altri come i lupi proteggono il loro branco", "Perche urla molto forte"],
        correct: 2,
        explanation: "La chiamano La Lupa perche protegge chi ne ha bisogno, come fanno i lupi con il branco.",
      },
      {
        text: "Cosa indossava Carletto che lo faceva sembrare un bambino di Milano?",
        options: ["Un cappotto rosso e un cappello", "Un vestito alla marinara con le scarpe lucide", "Una giacca con i bottoni dorati", "Un grembiule da scuola"],
        correct: 1,
        explanation: "Carletto aveva ancora il vestito alla marinara e le scarpe lucide.",
      },
      {
        text: "Come fa Pina ad allontanare i bulli nel vicolo?",
        options: ["Urla piu forte di loro", "Chiama gli adulti", "Li insegue correndo", "Li guarda negli occhi senza paura e senza dire una parola"],
        correct: 3,
        explanation: "Pina li guarda con uno sguardo che non trema. I bulli scappano in due secondi.",
      },
      {
        text: "Qual e la cosa piu importante che impara Carletto dall'incontro con Pina?",
        options: ["Che bisogna sempre correre via dai pericoli", "Che il coraggio non fa rumore: a volte uno sguardo vale piu di due pugni", "Che i bulli hanno sempre paura", "Che e meglio stare a casa che uscire nei vicoli"],
        correct: 1,
        explanation: "Carletto impara che il vero coraggio non fa rumore e sa prendersi cura degli altri.",
      },
    ],
  },
  gesualdo: {
    title: "Mastro-don Gesualdo",
    questions: [
      {
        text: "Dove abita Gesualdo con tutte le sue cose?",
        options: ["In una grotta buia", "In un cortile nascosto pieno di oggetti accatastati", "Su una collina fuori dal paese", "In una stanza segreta di Palazzo Verga"],
        correct: 1,
        explanation: "Gesualdo vive in un cortile nascosto pieno di ruote, pentole, sassi colorati e barattoli.",
      },
      {
        text: "Cosa tiene stretto al petto Gesualdo quando lo incontrano per la prima volta?",
        options: ["Un libro molto vecchio", "Un barattolo arrugginito", "Una bambola di pezza", "Un sacco di monete"],
        correct: 1,
        explanation: "Gesualdo stringe un vecchio barattolo arrugginito come se fosse preziosissimo.",
      },
      {
        text: "Cosa regala Carletto a Gesualdo per fare amicizia?",
        options: ["Il suo mappamondo", "Il vestito alla marinara", "La sua bussola nuova fiammante", "Il sasso colorato"],
        correct: 2,
        explanation: "Carletto dona la sua bussola nuova, con l'ago che brilla al sole.",
      },
      {
        text: "Cosa fa Gesualdo dopo aver ricevuto il regalo di Carletto?",
        options: ["Scappa via con la bussola", "Apre un passaggio segreto attraverso la montagna di oggetti", "Regala a Carletto il suo barattolo", "Lo invita a salire in cima alla catasta"],
        correct: 1,
        explanation: "Gesualdo apre un passaggio segreto che porta dall'altra parte del cortile.",
      },
      {
        text: "Qual e la lezione che Carletto impara da Gesualdo?",
        options: ["Che bisogna tenere le proprie cose e non darle a nessuno", "Che le cose belle, quando le condividi, diventano un ponte tra le persone", "Che collezionare oggetti vecchi e uno spreco di tempo", "Che i bambini poveri non vogliono ricevere regali"],
        correct: 1,
        explanation: "Carletto capisce che un oggetto condiviso puo diventare un ponte tra le persone.",
      },
    ],
  },
  "rosso-malpelo": {
    title: "Rosso Malpelo",
    questions: [
      {
        text: "Dove trovano Rosso Malpelo Marco e Carletto?",
        options: ["Sulla cima di una collina", "Nella piazza del paese", "Dentro una grotta buia scavata nella roccia", "Nel cortile di Palazzo Verga"],
        correct: 2,
        explanation: "Rosso si trova in fondo a un ipogeo, una grotta buia e fresca scavata nella roccia.",
      },
      {
        text: "Di che colore sono i capelli di Rosso Malpelo?",
        options: ["Neri come la notte", "Biondi come il grano", "Color carota, arancioni e arruffati", "Bianchi come la neve"],
        correct: 2,
        explanation: "Rosso ha i capelli color carota, arruffati e pieni di polvere.",
      },
      {
        text: "Cosa stava disegnando Rosso per terra nella grotta con un bastoncino?",
        options: ["Un ritratto degli abitanti di Vizzini", "Una mappa del paese di Vizzini", "Un sistema di canali per portare l'acqua dalla collina fino al paese", "I disegni degli animali che vivono nella grotta"],
        correct: 2,
        explanation: "Rosso aveva disegnato un progetto di canali per portare l'acqua dalla collina fino al paese.",
      },
      {
        text: "Qual e il primo pensiero sbagliato che ha Carletto quando vede Rosso?",
        options: ["Che Rosso fosse pericoloso", "Che Rosso fosse povero e non sapesse niente", "Che Rosso volesse rubargli la bussola", "Che Rosso non parlasse italiano"],
        correct: 1,
        explanation: "Carletto pensa che Rosso sia povero e non sappia niente, ma si sbaglia di grosso.",
      },
      {
        text: "Cosa impara Carletto dall'incontro con Rosso Malpelo?",
        options: ["Che le grotte sono luoghi pericolosi", "Che i bambini con i capelli rossi portano sfortuna", "Che non bisogna giudicare le persone dall'aspetto: l'intelligenza fiorisce dove vuole", "Che studiare a scuola e piu importante di qualsiasi altra cosa"],
        correct: 2,
        explanation: "Carletto capisce che non si giudica una persona dai capelli, dal vestito o dalle mani sporche.",
      },
    ],
  },
  cavalleria: {
    title: "Cavalleria Rusticana",
    questions: [
      {
        text: "Dove si trovano Turiddu e Alfio quando Carletto li incontra?",
        options: ["Nella Cunziria, tra i vicoli", "Al centro della piazza, sotto una grande quercia", "In cima alla collina fuori dal paese", "Dentro Palazzo Verga"],
        correct: 1,
        explanation: "Turiddu e Alfio si fronteggiano nella piazza centrale di Vizzini, sotto una grande quercia.",
      },
      {
        text: "A quale gioco tradizionale siciliano stanno giocando Turiddu e Alfio?",
        options: ["Al tiro alla fune", "Alle carte", "Alla Morra", "A nascondino"],
        correct: 2,
        explanation: "Stanno giocando alla Morra, un gioco antichissimo fatto con dita e voce.",
      },
      {
        text: "Perche Carletto aveva paura quando vedeva Turiddu e Alfio urlare?",
        options: ["Perche pensava che stessero litigando davvero e si sarebbero fatti del male", "Perche lo avevano visto e volevano giocare con lui", "Perche aveva paura delle colombe del campanile", "Perche non conosceva le regole del gioco"],
        correct: 0,
        explanation: "Carletto non capiva che era un gioco e pensava che stessero litigando davvero.",
      },
      {
        text: "Cosa succede quando la partita finisce tra Turiddu e Alfio?",
        options: ["Continuano a litigare fino a sera", "Uno dei due scappa via piangendo", "Si stringono la mano e mangiano insieme un cannolo", "Chiamano i genitori per decidere chi ha vinto"],
        correct: 2,
        explanation: "Finita la partita, si stringono la mano e mangiano insieme un cannolo.",
      },
      {
        text: "Cosa vola via dal campanile quando Turiddu e Alfio urlano fortissimo?",
        options: ["I gabbiani", "I pipistrelli", "I piccioni", "Le rondini"],
        correct: 2,
        explanation: "Le loro voci sono cosi forti che i piccioni sul campanile volano via tutti insieme.",
      },
    ],
  },
  malavoglia: {
    title: "I Malavoglia",
    questions: [
      {
        text: "Dove si trova la barca dei bambini Malavoglia?",
        options: ["In riva al mare, tra le onde", "Nel porto di un fiume vicino al paese", "In cima a una collina, sull'erba, lontana dal mare", "Nel cortile di casa loro"],
        correct: 2,
        explanation: "La barca e poggiata sull'erba in cima a una collina, lontana dal mare.",
      },
      {
        text: "Cosa fanno i bambini Malavoglia nella barca sull'erba?",
        options: ["Dormono e riposano all'ombra", "Remano nel vuoto sognando il mare lontano", "Fanno finta di pescare con canne di bambu", "Guardano le stelle di notte"],
        correct: 1,
        explanation: "I bambini remano con gli occhi chiusi, sognando il mare anche se la barca non si muove.",
      },
      {
        text: "Come si chiama il posto speciale dei Malavoglia, sotto la barca?",
        options: ["La Casa della Quercia", "Il Nido del Falco", "La Casa del Nespolo", "Il Rifugio della Collina"],
        correct: 2,
        explanation: "Sotto la barca c'e un nespolo vecchissimo: e la Casa del Nespolo.",
      },
      {
        text: "Perche i Malavoglia non vanno al mare, anche se lo sognano tantissimo?",
        options: ["Perche non sanno nuotare", "Perche i genitori non li lasciano andare", "Perche il mare e troppo lontano e non hanno i soldi per il viaggio", "Perche non vogliono lasciare la loro casa e le loro radici"],
        correct: 3,
        explanation: "La Casa del Nespolo e il posto a cui appartengono, e vale piu del sogno del mare.",
      },
      {
        text: "Cosa capisce Carletto guardando la barca sull'erba?",
        options: ["Che sognare posti lontani e stupido", "Che sognare e bello, ma avere un posto in cui tornare e un tesoro che non tutti hanno", "Che i Malavoglia sono bambini un po' matti", "Che la Sicilia e piu bella di Milano perche ha il mare vicino"],
        correct: 1,
        explanation: "Carletto capisce che sognare e bello, ma avere un posto a cui tornare e un tesoro raro.",
      },
    ],
  },
  "segreto-marco": {
    title: "Il segreto di Marco",
    questions: [
      {
        text: "In che condizioni sono il vestito e le scarpe di Carletto alla fine della giornata?",
        options: ["Puliti e perfetti come quando e partito", "Sporchi di terra, con uno strappo e le scarpe bianche di polvere", "Bagnati perche era caduto nel fiume", "Strappati perche aveva litigato con i bulli"],
        correct: 1,
        explanation: "Il vestito ha macchie di terra e uno strappo, le scarpe non sono piu lucide, ma Carletto sorride.",
      },
      {
        text: "Cosa mette Carletto sul tavolo di Palazzo Verga davanti a suo padre?",
        options: ["La bussola di Gesualdo", "Un cannolo portato da Turiddu e Alfio", "Il sasso colorato che gli aveva dato Pina", "Un disegno fatto da Rosso Malpelo"],
        correct: 2,
        explanation: "Carletto poggia sul tavolo il sasso colorato: sembra fuori posto, ma e la cosa piu giusta del mondo.",
      },
      {
        text: "Dove torna Carletto alla fine della sua avventura?",
        options: ["Resta a vivere a Vizzini con Marco", "Va a vivere dai Malavoglia sulla collina", "Torna a Milano", "Parte per un viaggio verso il mare"],
        correct: 2,
        explanation: "Carletto torna a Milano, ma porta con se un sasso in tasca e la testa piena di storie.",
      },
      {
        text: "Quale valore NON fa parte di cio che Carletto ha imparato a Vizzini?",
        options: ["Il coraggio non fa rumore", "Non si giudica nessuno dai vestiti", "Bisogna sempre obbedire agli adulti senza fare domande", "Fare pace e piu coraggioso che tenere il rancore"],
        correct: 2,
        explanation: "Carletto non impara a obbedire senza domande: e la curiosita a cambiarlo.",
      },
      {
        text: "Cosa porta Carletto con se da Vizzini come ricordo piu prezioso?",
        options: ["Una fotografia di Marco", "Un sasso in tasca e la testa piena di storie e lezioni imparate", "Il libro scritto da Giovanni Verga", "La bussola che aveva regalato a Gesualdo"],
        correct: 1,
        explanation: "Il sasso e il simbolo di tutto quello che Carletto ha vissuto e imparato a Vizzini.",
      },
    ],
  },
};

function buildQuizzesFromData(data) {
  if (!data?.stanze) return FALLBACK_QUIZZES;

  return data.stanze.reduce((quizzes, stanza) => {
    quizzes[stanza.storyId] = {
      title: STORIES.find(([id]) => id === stanza.storyId)?.[1] || stanza.titolo,
      roomTitle: stanza.titolo,
      character: stanza.personaggio,
      questions: stanza.domande.map((item) => ({
        text: item.domanda,
        options: item.opzioni,
        correct: item.risposta_corretta,
        explanation: item.spiegazione,
      })),
    };
    return quizzes;
  }, {});
}

const QUIZZES = buildQuizzesFromData(window.VERGA_QUIZ_DATA);

const page = document.body.dataset.page;

function getSession() {
  return JSON.parse(localStorage.getItem("vergaAdventure") || "null");
}

function setSession(session) {
  localStorage.setItem("vergaAdventure", JSON.stringify(session));
}

function getCompletionScope(session = getSession()) {
  return session?.classId || session?.code || "default";
}

function getAllCompletions() {
  const stored = JSON.parse(localStorage.getItem("vergaCompletions") || "{}");
  const looksLikeOldFlatStore = STORIES.some(([id]) => stored[id]);
  if (!looksLikeOldFlatStore) return stored;

  const scope = getCompletionScope();
  const migrated = { [scope]: stored };
  localStorage.setItem("vergaCompletions", JSON.stringify(migrated));
  return migrated;
}

function getCompletions(session = getSession()) {
  const allCompletions = getAllCompletions();
  return allCompletions[getCompletionScope(session)] || {};
}

function setCompletions(completions, session = getSession()) {
  const allCompletions = getAllCompletions();
  allCompletions[getCompletionScope(session)] = completions;
  localStorage.setItem("vergaCompletions", JSON.stringify(allCompletions));
}

function requireSession() {
  const session = getSession();
  if (!session) {
    window.location.href = page === "mission" ? "/" : "/avventura";
    return null;
  }
  return session;
}

function initEntry() {
  const form = document.querySelector("[data-entry-form]");
  const codeInput = document.querySelector("[data-code-input]");
  const nameInput = document.querySelector("[data-name-input]");
  const error = document.querySelector("[data-form-error]");

  codeInput.addEventListener("input", () => {
    codeInput.value = codeInput.value.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 12);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const code = codeInput.value.trim().toUpperCase();
    const explorerName = nameInput.value.trim().slice(0, 20);
    const adventureCode = VALID_CODES.find((item) => item.code === code && item.active);

    if (!adventureCode || !explorerName) {
      error.hidden = false;
      return;
    }

    setSession({ explorerName, code, classId: adventureCode.classId, className: adventureCode.className });
    window.location.href = "/avventura/passaporto";
  });
}

function initPassport() {
  const session = requireSession();
  if (!session) return;

  const completions = getCompletions(session);
  const completedCount = STORIES.filter(([id]) => completions[id]).length;
  document.querySelector("[data-avatar-initial]").textContent = session.explorerName[0].toUpperCase();
  document.querySelector("[data-explorer-name]").textContent = session.explorerName;
  document.querySelector("[data-completed-count]").textContent = completedCount;
  document.querySelector("[data-progress-bar]").style.width = `${(completedCount / 7) * 100}%`;
  document.querySelector("[data-rank]").textContent = completedCount ? "Esploratore di Verga's World" : "Esploratore Principiante";

  document.querySelector("[data-change-name]").addEventListener("click", () => {
    const explorerName = prompt("Nuovo nome esploratore", session.explorerName);
    if (explorerName) {
      setSession({ ...session, explorerName: explorerName.slice(0, 20) });
      window.location.reload();
    }
  });

  const grid = document.querySelector("[data-badge-grid]");
  STORIES.forEach(([id, title], index) => {
    const state = completions[id] ? "completed" : "available";
    const button = document.createElement("button");
    button.type = "button";
    button.className = `badge-card ${state}`;
    button.innerHTML = `<img src="${STORY_IMAGES[id]}" alt="" /><span>${state === "locked" ? "🔒" : title}</span><small>${state === "available" ? "Vai alla missione!" : ""}</small>`;
    if (state === "available") {
      button.addEventListener("click", () => {
        window.location.href = `/avventura/missione/la-lupa?storyId=${id}`;
      });
    }
    if (state === "completed") {
      button.addEventListener("click", () => openBadgeModal(id, title));
    }
    grid.appendChild(button);
  });

  const footer = document.querySelector("[data-passport-footer]");
  if (completedCount === 7) {
    footer.classList.add("celebration");
    footer.innerHTML = `<h3>Sei un Esploratore di Verga's World!</h3><p>Hai conquistato tutti i badge.</p><button type="button">Scarica il tuo Diploma</button>`;
  } else {
    const phrases = [
      "Carletto dice: ogni indizio trovato accende una storia.",
      "Marco sussurra: guarda bene, Vizzini nasconde dettagli dappertutto.",
      "Una missione alla volta: il passaporto si riempie con calma.",
    ];
    footer.textContent = phrases[Math.floor(Math.random() * phrases.length)];
  }
}

function openBadgeModal(id, title) {
  const modal = document.querySelector("[data-badge-modal]");
  document.querySelector("[data-modal-img]").src = STORY_IMAGES[id];
  document.querySelector("[data-modal-title]").textContent = title;
  document.querySelector("[data-modal-text]").textContent = `Badge conquistato nella missione ${title}.`;
  modal.showModal();
  document.querySelector("[data-close-modal]").onclick = () => modal.close();
}

function initMission() {
  const session = requireSession();
  if (!session) return;

  const storyId = new URLSearchParams(window.location.search).get("storyId") || "la-lupa";
  const quiz = QUIZZES[storyId] || QUIZZES["la-lupa"];
  const nextButton = document.querySelector("[data-next-question]");
  let current = 0;
  let locked = false;

  document.querySelector("[data-mission-story]").textContent = STORIES.find(([id]) => id === storyId)?.[1] || quiz.title;

  function renderQuestion() {
    locked = false;
    const question = quiz.questions[current];
    document.querySelector("[data-question-index]").textContent = current + 1;
    document.querySelector("[data-mission-progress]").style.width = `${((current + 1) / quiz.questions.length) * 100}%`;
    document.querySelector("[data-question-text]").textContent = question.text;
    document.querySelector("[data-quiz-feedback]").textContent = "";
    nextButton.hidden = true;
    const optionsGrid = document.querySelector("[data-options-grid]");
    optionsGrid.innerHTML = "";
    question.options.forEach((option, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "option-card";
      button.textContent = option;
      button.addEventListener("click", () => answer(index, button));
      optionsGrid.appendChild(button);
    });
  }

  function answer(index, button) {
    if (locked) return;
    locked = true;
    const question = quiz.questions[current];
    const feedback = document.querySelector("[data-quiz-feedback]");
    const optionButtons = [...document.querySelectorAll(".option-card")];
    if (index === question.correct) {
      button.classList.add("correct");
      feedback.textContent = `Esatto! ${question.explanation}`;
    } else {
      button.classList.add("wrong");
      feedback.textContent = `Quasi! Ora guarda la risposta giusta. ${question.explanation}`;
      setTimeout(() => optionButtons[question.correct].classList.add("correct"), 700);
    }
    nextButton.hidden = false;
  }

  function nextQuestion() {
    nextButton.hidden = true;
    current += 1;
    if (current >= quiz.questions.length) {
      const completions = getCompletions(session);
      completions[storyId] = new Date().toISOString();
      setCompletions(completions, session);
      document.querySelector(".quiz-card").hidden = true;
      document.querySelector(".mission-header").hidden = true;
      document.querySelector("[data-complete-title]").textContent = `Hai conquistato il badge ${STORIES.find(([id]) => id === storyId)?.[1] || quiz.title}!`;
      document.querySelector("[data-mission-complete]").hidden = false;
      return;
    }
    renderQuestion();
  }

  nextButton.addEventListener("click", nextQuestion);
  renderQuestion();
}

if (page === "entry") initEntry();
if (page === "passport") initPassport();
if (page === "mission") initMission();
