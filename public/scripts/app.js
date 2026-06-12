const stories = {
  casa: {
    title: "La casa delle storie",
    work: "Opera collegata: Vita dei campi",
    description: "La stanza introduce Verga, Vizzini e il modo in cui un luogo vero puo diventare racconto.",
    theme: "memoria",
    previews: ["Casa", "Strada", "Stanza"],
    images: ["/immagini/palazzo di verga.jpg", "/immagini/vizzini.jpg", "/immagini/saa da pranzo.jpg"],
  },
  liberta: {
    title: "La voce della piazza",
    work: "Opera collegata: Liberta",
    description: "Una piazza piena di voci racconta che cosa succede quando il desiderio di giustizia diventa scelta difficile.",
    theme: "liberta",
    previews: ["Piazza", "Folla", "Bandiera"],
    images: ["/immagini/chiesa.jpg", "/immagini/vizzini.jpg", "/immagini/banda_di_verga_pagina_14.jpg"],
  },
  roba: {
    title: "Il campo di Mazzaro",
    work: "Opera collegata: La roba",
    description: "Tra spighe, confini e masserie, i bambini incontrano il tema del possesso e del valore delle cose.",
    theme: "desiderio",
    previews: ["Spighe", "Masseria", "Collina"],
    images: ["/immagini/cumulo robe piazza.jpg", "/immagini/incontro con gesualdo.jpg", "/immagini/vizzini.jpg"],
  },
  malavoglia: {
    title: "La barca dei Malavoglia",
    work: "Opera collegata: I Malavoglia",
    description: "Il mare diventa una grande prova: famiglia, lavoro e coraggio si muovono come onde.",
    theme: "famiglia",
    previews: ["Barca", "Rete", "Onda"],
    images: ["/immagini/malavoglia.jpg", "/immagini/vizzini.jpg", "/immagini/banda_di_verga_pagina_14.jpg"],
  },
  rosso: {
    title: "Il vicolo di Rosso",
    work: "Opera collegata: Rosso Malpelo",
    description: "Un percorso delicato sulla diversita, lo sguardo degli altri e la forza di chi resta in piedi.",
    theme: "coraggio",
    previews: ["Vicolo", "Cava", "Luce"],
    images: ["/immagini/PALAZZO Verga_Vizzini_corridoio variante1.jpg", "/immagini/vizzini.jpg", "/immagini/chiesa.jpg"],
  },
  gramigna: {
    title: "Il sentiero di Gramigna",
    work: "Opera collegata: L'amante di Gramigna",
    description: "La storia apre una domanda su scelte, conseguenze e desiderio di liberta.",
    theme: "scelta",
    previews: ["Sentiero", "Ombra", "Collina"],
    images: ["/immagini/incontro con gesualdo.jpg", "/immagini/vizzini.jpg", "/immagini/cumulo robe piazza.jpg"],
  },
  cavalleria: {
    title: "La festa del paese",
    work: "Opera collegata: Cavalleria rusticana",
    description: "Suoni, carretti e tradizioni portano dentro un mondo di orgoglio, parole non dette e comunita.",
    theme: "onore",
    previews: ["Carretto", "Festa", "Cortile"],
    images: ["/immagini/banda_di_verga_pagina_14.jpg", "/immagini/chiesa.jpg", "/immagini/vizzini.jpg"],
  },
};

const characters = {
  carletto: {
    name: "Carletto",
    text: "Curioso, rapido e sempre pronto a cercare indizi. Aiuta i bambini a osservare dettagli, oggetti e stanze della Casa Verga.",
    image: "/immagini/carletto.jpg",
  },
  caterina: {
    name: "Caterina",
    text: "Curiosa e attenta, aiuta i bambini a osservare i piccoli dettagli delle storie e a trasformarli in scoperte.",
    image: "/immagini/caterina.svg",
  },
};

const clueIcons = {
  "Acquari di corridoio": "🐠",
  "Orologio da taschino di Carletto": "🕰️",
  "Sasso colorato": "🪨",
};

const dailyClues = [
  {
    object: "Acquari di corridoio",
    story: "La casa delle storie",
    area: "casa",
    text: "Piccoli acquari posti lungo il corridoio: pesci e vetri che custodiscono memorie di viaggio e osservazione.",
  },
  {
    object: "Orologio da taschino di Carletto",
    story: "La voce della piazza",
    area: "liberta",
    text: "L'orologio di Carletto segna il tempo delle storie: ascolta il ticchettio e scopri quando accade il prossimo episodio.",
  },
  {
    object: "Sasso colorato",
    story: "Il campo di Mazzaro",
    area: "roba",
    text: "Un piccolo sasso dipinto trovato lungo il sentiero: colore, forma e peso raccontano chi l'ha portato con sé.",
  },
];

const storyButtons = document.querySelectorAll("[data-story]");
const unlockButton = document.querySelector("[data-unlock]");
const unlockResult = document.querySelector("[data-unlock-result]");
const codeInput = document.querySelector("#adventure-code");
const hiddenObject = document.querySelector("[data-hidden-object]");
const cluePanel = document.querySelector("[data-clue-panel]");
const clueObject = document.querySelector("[data-clue-object]");
const clueText = document.querySelector("[data-clue-text]");
const characterDialog = document.querySelector("[data-character-dialog]");
const dialogClose = document.querySelector("[data-dialog-close]");
const dialogIllustration = document.querySelector("[data-dialog-illustration]");
const dialogImage = document.querySelector("[data-dialog-image]");
const dialogLabel = document.querySelector("[data-dialog-label]");
const dialogName = document.querySelector("[data-dialog-name]");
const dialogText = document.querySelector("[data-dialog-text]");
const dialogTheme = document.querySelector("[data-dialog-theme]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const kidMenu = document.querySelector("[data-kid-menu]");
const clueSuccessModal = document.querySelector("[data-clue-success-modal]");
const clueSuccessClose = document.querySelector("[data-clue-close]");
const clueSuccessText = document.querySelector("[data-clue-success-text]");
const clueSuccessOverlay = clueSuccessModal?.querySelector("[data-modal-overlay]");

let hiddenObjectClickCount = 0;

function getDailyClue() {
  const dayNumber = Math.floor(Date.now() / 86400000);
  return dailyClues[dayNumber % dailyClues.length];
}

function setStory(storyKey) {
  const story = stories[storyKey];
  if (!story) {
    return;
  }

  storyButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.story === storyKey);
  });

  dialogLabel.textContent = "Storia della mappa";
  dialogName.textContent = story.title;
  dialogText.textContent = `${story.work}. ${story.description}`;
  dialogImage.src = story.images[0];
  dialogTheme.hidden = false;
  dialogTheme.textContent = `Tema: ${story.theme}`;
  dialogIllustration.classList.remove("is-caterina");

  if (typeof characterDialog.showModal === "function") {
    characterDialog.showModal();
  } else {
    characterDialog.setAttribute("open", "");
  }

  revealDailyClue(storyKey);
}

function showCharacter(characterKey) {
  const character = characters[characterKey];
  if (!character) {
    return;
  }

  dialogName.textContent = character.name;
  dialogText.textContent = character.text;
  dialogImage.src = character.image;
  dialogLabel.textContent = "Personaggio guida";
  dialogTheme.hidden = true;
  dialogTheme.textContent = "";
  dialogIllustration.classList.toggle("is-caterina", characterKey === "caterina");

  if (typeof characterDialog.showModal === "function") {
    characterDialog.showModal();
  } else {
    characterDialog.setAttribute("open", "");
  }
}

function solveDailyClue() {
  const clue = getDailyClue();
  if (!hiddenObject) return;
  
  hiddenObjectClickCount++;
  
  if (hiddenObjectClickCount === 1) {
    // First click: show success modal
    if (clueSuccessModal && clueSuccessText) {
      clueSuccessText.textContent = `Hai trovato ${clue.object}! Clicca di nuovo per confermarlo.`;
      clueSuccessModal.setAttribute("aria-hidden", "false");
    }
  } else if (hiddenObjectClickCount >= 2) {
    // Second click: hide the object and solve the clue
    hiddenObject.classList.add("is-found");
    cluePanel.classList.add("is-solved");
    clueObject.textContent = clue.object;
    clueText.textContent = `${clue.object}: ${clue.text} Storia collegata: ${clue.story}.`;
    
    // Close success modal
    if (clueSuccessModal) {
      clueSuccessModal.setAttribute("aria-hidden", "true");
    }
    
    // Reset counter for next day
    hiddenObjectClickCount = 0;
    setStory(clue.area);
  }
}

function revealDailyClue(storyKey) {
  const clue = getDailyClue();
  if (storyKey !== clue.area || !cluePanel) return;

  cluePanel.classList.add("is-solved");
  clueObject.textContent = clue.object;
  clueText.textContent = `${clue.object}: ${clue.text} Storia collegata: ${clue.story}.`;
}

function placeDailyClue() {
  const clue = getDailyClue();
  if (!hiddenObject) return;
  hiddenObject.classList.remove("clue-casa", "clue-malavoglia", "clue-roba", "clue-cavalleria");
  hiddenObject.classList.add(`clue-${clue.area}`);
  
  // Update icon for the hidden object
  const icon = clueIcons[clue.object] || "📌";
  const iconSpan = hiddenObject.querySelector("span");
  if (iconSpan) {
    iconSpan.textContent = icon;
  }
}

function unlockAdventure() {
  const code = codeInput.value.trim().toUpperCase();
  const isDemoCode = code === "VIZZINI-1880";

  unlockResult.hidden = false;
  unlockResult.querySelector("strong").textContent = isDemoCode ? "Avventura sbloccata" : "Codice demo non riconosciuto";
  unlockResult.querySelector("span").textContent = isDemoCode
    ? "Hai aperto la missione \"Dentro Casa Verga\". I video e il primo badge sono pronti."
    : "Per il prototipo usa VIZZINI-1880, poi collegheremo i codici reali del museo.";
}

storyButtons.forEach((button) => {
  button.addEventListener("click", () => setStory(button.dataset.story));
});

document.querySelectorAll("[data-character]").forEach((button) => {
  button.addEventListener("click", () => showCharacter(button.dataset.character));
});

dialogClose?.addEventListener("click", () => characterDialog.close());
hiddenObject?.addEventListener("click", solveDailyClue);

// Success modal handlers
if (clueSuccessModal) {
  clueSuccessClose?.addEventListener("click", () => {
    clueSuccessModal.setAttribute("aria-hidden", "true");
  });
  clueSuccessOverlay?.addEventListener("click", () => {
    clueSuccessModal.setAttribute("aria-hidden", "true");
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && clueSuccessModal.getAttribute("aria-hidden") === "false") {
      clueSuccessModal.setAttribute("aria-hidden", "true");
    }
  });
}

unlockButton?.addEventListener("click", unlockAdventure);

menuToggle?.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  kidMenu.hidden = isOpen;
});

kidMenu?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menuToggle.setAttribute("aria-expanded", "false");
    kidMenu.hidden = true;
  });
});

document.addEventListener("click", (event) => {
  if (!kidMenu || !menuToggle || kidMenu.hidden) return;
  if (kidMenu.contains(event.target) || menuToggle.contains(event.target)) return;
  menuToggle.setAttribute("aria-expanded", "false");
  kidMenu.hidden = true;
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !kidMenu || !menuToggle || kidMenu.hidden) return;
  menuToggle.setAttribute("aria-expanded", "false");
  kidMenu.hidden = true;
  menuToggle.focus();
});

const clue = getDailyClue();
clueObject.textContent = clue.object;
clueText.textContent = `Cerca: ${clue.object}. L'indizio si resetta ogni 24 ore.`;
placeDailyClue();
