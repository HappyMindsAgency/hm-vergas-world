# Verga's World — Brief di sviluppo

> Webapp museale per il museo **R.I.V.I.V.I. — Casa Museo Giovanni Verga**, Vizzini (Sicilia).
> Documento di riferimento per lo sviluppo assistito con Claude Code in modalità multi-agentica.

---

## 0. Come usare questo documento

Questo file è la **fonte funzionale autorevole** del progetto. Per stack, convenzioni di codice e regole operative fai sempre riferimento a `CLAUDE.md` e `AGENTS.md` nel repo: in caso di conflitto, quei file hanno priorità sulle indicazioni tecniche generiche qui contenute.

**Regole di ingaggio:**

1. **Lavoro orchestrato multi-agentico** (vedi §7): un agente orchestratore possiede le fondamenta condivise; quattro subagent specializzati gestiscono una sezione ciascuno. I contratti condivisi vanno **congelati prima** che i subagent partano.
2. **Procedi per fasi** (vedi §8). Completa una fase, verificane i criteri di accettazione, poi passa alla successiva.
3. **Chiedi prima di decidere.** Per ogni scelta architetturale non banale (schema DB, strategia auth, gestione email, isolamento CSS, contratti tra agenti) proponi l'opzione e attendi conferma. I "Punti aperti" in §11 vanno risolti **prima** di scrivere codice che ne dipende.
4. **Nel repo esiste già un prototipo statico.** Hai l'autorizzazione a riutilizzarne parti o a rifattorizzare liberamente.
5. **Niente segreti nel repo** (vedi §6). Vincolo non negoziabile.

---

## 1. Contesto

La webapp accompagna l'esperienza museale attorno a **sette storie animate** ispirate all'opera di Giovanni Verga. Serve quattro tipi di utente, in una struttura **gerarchica**:

- **Pubblico** → frontend aperto, informativo + attività gioco "L'indizio di Verga".
- **Operatori museo (admin)** → gestiscono docenti e materiali; sono l'amministrazione dell'intera piattaforma.
- **Docenti** → inseriti dagli operatori; gestiscono classi e alunni, monitorano i progressi.
- **Alunni** → inseriti dai docenti; guardano i video e completano i quiz ("Passaporto").

Catena di provisioning: **operatore → docente → alunno**.

---

## 2. Stack tecnologico

| Ambito | Scelta |
|---|---|
| Framework | **Astro** (intero progetto) |
| Database / Auth / Storage | **Supabase** |
| Deploy | **Vercel** |
| CSS — Sezione 1 (frontend pubblico) | **Tailwind** |
| CSS — Sezioni 2/3/4 (aree riservate) | **Bootstrap** |
| Design source | **Figma** via MCP Server (node-id in §10) |

> ⚠️ **Tailwind + Bootstrap nello stesso progetto** è una potenziale fonte di conflitti (reset, utility, specificità). Vedi §11 per la strategia di isolamento da concordare prima di iniziare.

---

## 3. Regole di progetto (convenzioni di codice)

Valgono **oltre** a quanto in `CLAUDE.md`/`AGENTS.md`:

- **Single responsibility**: ogni funzione fa una cosa sola e ha un nome che lo dichiara.
- **Config visibile**: costanti, soglie, parametri di gioco e testi fissi in file di configurazione dedicati (`src/config/`, `src/data/`), non sparsi nel codice.
- **No logica duplicata**: estrai helper condivisi (validazione codici, formattazione nome alunno, generazione codici classe, ecc.).
- **Manutenibilità senza AI**: codice leggibile e modificabile da uno sviluppatore umano senza assistenza.
- **Componenti condivisi**: `Header`/`Navbar` e `Footer` del frontend sono **un solo componente** riusato su tutte le pagine pubbliche.
- **Naming coerente** tra DB, tipi TS e componenti.
- **Commenti**: solo dove spiegano il *perché*.

---

## 4. Architettura delle quattro sezioni

| # | Sezione | Accesso | Auth |
|---|---|---|---|
| 1 | Frontend pubblico | Aperto | Nessuna |
| 2 | Area Museo (admin) | Riservato | Email + password (Supabase Auth) |
| 3 | Area Docenti | Riservato | Email + password (Supabase Auth) |
| 4 | Area Alunni | Riservato | **Codice classe + nome alunno** (NO Supabase Auth standard — vedi §6) |

**Gerarchia dei permessi:** operatore crea/gestisce docenti e materiali → docente crea/gestisce classi e alunni → alunno consuma contenuti e accumula badge. Cancellazioni a cascata (§9).

---

## 5. Modello dati (proposta Supabase)

> **Proposta da validare** prima dell'implementazione (Punto aperto §11.1). Questo schema è anche il **primo contratto condiviso** tra agenti: una volta approvato va congelato (§7).

**Identità & ruoli**
- `profiles` — `id` (= auth.uid), `role` (`admin` | `teacher`), `nome`, `cognome`, `email`, `institute_id`, `status` (`active` | `inactive` | `disabled`), `created_at`, `last_login_at`.

**Strutture**
- `institutes` — `id`, `nome`, `citta`. *(Necessaria per disambiguare i codici classe, §9.3.)*
- `classes` — `id`, `teacher_id` → profiles, `institute_id` → institutes, `nome` (es. `3B`), `anno`, `access_code` (**UNIQUE**), `created_at`.
- `students` — `id`, `class_id` → classes, `display_name` (es. `Marco R.`), `created_at`, `last_activity_at`.

**Contenuti**
- `stories` — `id`, `numero` (1–7), `titolo`, `sinossi`, immagini.
- `characters` — `id`, `story_id`, `nome`, `soprannome`, `descrizione`, `immagine`.
- `videos` — `id`, `story_id`, `titolo`, `source_type` (`youtube` | `asset`), `url_or_path`.
- `quizzes` — `id`, `story_id` (1:1 con storia/video).
- `quiz_questions` — `id`, `quiz_id`, `testo`, `ordine`.
- `quiz_options` — `id`, `question_id`, `testo`, `is_correct`.

**Progressi alunni**
- `student_quiz_attempts` — `id`, `student_id`, `quiz_id`, `score`, `passed` (bool), `completed_at`. *Una volta `passed = true`, il quiz non è ripetibile.*
- `student_badges` — `student_id`, `story_id`, `earned_at`. *Il "Passaporto" è l'aggregato dei badge dell'alunno.*

**Materiali**
- `materials` — `id`, `nome`, `file_path` (Supabase Storage), `category` (`prima_visita` | `percorsi_tematici` | `dopo_visita`), `uploaded_by`, `created_at`.
- `material_assignments` — `material_id`, `teacher_id`.

**Dati di gioco (NON in DB)**
- `src/data/indizi.ts` — pool **hardcodato** degli oggetti per "L'indizio di Verga" (§9.1).

---

## 6. Sicurezza & Autenticazione (critico)

**Gestione segreti — vincolo assoluto:**
- Nessuna chiave/token/credenziale nel repo, **mai**, nemmeno temporaneamente. Tutto in variabili d'ambiente (`.env` locale ignorato da git + Environment Variables su Vercel).
- La **`service_role` key di Supabase** è usata **solo server-side** (API routes Astro / Edge Functions). Mai sul client. Sul client solo la `anon` key.
- Verifica che `.env`, `.env.*` e file di credenziali siano in `.gitignore` **prima** del primo commit.

**Row Level Security (RLS):** attiva su tutte le tabelle. Policy minime:
- Un docente vede/modifica **solo** le proprie classi, alunni e progressi.
- Un operatore (admin) ha visibilità su docenti e materiali secondo le funzioni della sua area.
- I dati alunno sono scrivibili solo via endpoint server-side validati.

**Auth Alunni (caso speciale):** gli alunni **non** hanno account Supabase Auth. Accedono con `codice classe + display_name`, quindi **non** scrivono direttamente sul DB col client. Proposta da validare (§11.2): le operazioni alunno passano per **API route Astro server-side** che (a) validano codice + nome, (b) usano la `service_role` key lato server, (c) rilasciano una sessione effimera (cookie/JWT a breve durata, nessun "ricordami"). Nessun recupero password; sessione che dura solo finché la schermata è aperta.

**Flussi email** (inviti docente, reset password): richiedono un servizio di invio. Punto aperto §11.3.

---

## 7. Strategia multi-agentica e orchestrazione

L'obiettivo è far lavorare **quattro agenti specializzati**, uno per sezione, che si coordinano e si scambiano informazioni. In Claude Code questo si realizza con un **orchestratore + quattro subagent**, tenendo conto di come funziona davvero il meccanismo.

### 7.1 Come funziona realmente (e i suoi limiti)
- I subagent hanno **context window isolate** e restituiscono un risultato all'orchestratore. **Non comunicano peer-to-peer in tempo reale.**
- Lo "scambio di informazioni" avviene tramite **artefatti condivisi versionati nel repo** (i *contratti*, §7.3), non via chat diretta tra agenti.
- L'**orchestratore** (il thread principale) fa da hub: possiede le fondamenta, integra gli output, risolve i conflitti, aggiorna i contratti.

### 7.2 Ruoli
- **Orchestratore (foundation + integrazione):** esegue la Fase 0 (schema DB, RLS, client Supabase, auth, layout e componenti condivisi, isolamento CSS). **Congela** i contratti. Poi delega, integra e fa da arbitro.
- **Agente Frontend** → Sezione 1 (Tailwind).
- **Agente Museo/Admin** → Sezione 2 (Bootstrap).
- **Agente Docenti** → Sezione 3 (Bootstrap).
- **Agente Alunni** → Sezione 4 (Bootstrap + auth custom).

I file dei subagent vanno in `.claude/agents/` (forniti a parte). Ogni subagent riceve in input: questo brief, `CLAUDE.md`/`AGENTS.md`, i contratti congelati e i node-id Figma pertinenti.

### 7.3 Contratti condivisi (il "linguaggio comune" tra agenti)
Sono la fonte di verità che permette agli agenti di "confrontarsi". Nessun subagent li modifica da solo: le proposte di modifica passano dall'orchestratore.
1. **Schema DB + migrations** (§5).
2. **Tipi TypeScript condivisi** (`src/types/`) generati dallo schema.
3. **Contratti API** — firme delle route server-side (specie quelle alunno e gli inviti email).
4. **Componenti/primitive condivise** — `Header`/`Footer`, design token, UI di base.
5. **`docs/INTEGRATION.md`** — registro in cui ogni agente dichiara **cosa espone** e **cosa consuma** dalle altre sezioni, e annota le decisioni. È qui che gli agenti "si scambiano informazioni" in modo tracciabile.

### 7.4 Interfacce trasversali (le sezioni NON sono indipendenti)
| Da → A | Cosa attraversa il confine |
|---|---|
| Admin → Docenti | Provisioning docenti (invito email); **Materiali** assegnati |
| Admin → Alunni | **Video & Quiz** (gestiti in Admin, consumati dagli Alunni) |
| Docenti → Alunni | Provisioning alunni; identità classe/alunno per il login |
| Orchestratore → tutti | Auth, schema, tipi, componenti condivisi |

Queste interfacce vanno **dichiarate in `INTEGRATION.md` prima** di implementare le due estremità.

### 7.5 Esecuzione: sequenza anti-conflitto
- La **Fase 0 non si parallelizza**: la fa l'orchestratore e congela i contratti.
- Solo dopo, i quattro subagent lavorano sulle rispettive sezioni **contro i contratti congelati**.
- Lavoro parallelo su file condivisi = rischio di sovrascritture/race. Da concordare (§11.10): esecuzione **sequenziale** dei subagent, oppure **git worktrees / branch per sezione** con integrazione frequente fatta dall'orchestratore.
- Regola d'oro: un subagent che ha bisogno di toccare un contratto **si ferma e segnala all'orchestratore**, non lo modifica unilateralmente.

---

## 8. Fasi di sviluppo (roadmap per gli agenti)

Ogni fase ha **obiettivo**, **agente responsabile** e **Definition of Done**. Non passare alla fase successiva finché la DoD non è soddisfatta.

### Fase 0 — Fondamenta condivise · *Orchestratore*
- **Obiettivo:** progetto Astro avviabile, Supabase collegato, deploy Vercel ok, `.gitignore`/env corretti, contratti congelati.
- **Deliverable:** scaffolding; client Supabase (anon client-side, service_role server-side); isolamento Tailwind/Bootstrap; schema DB + migrations + RLS; tipi condivisi; `Header`/`Footer`; `docs/INTEGRATION.md` inizializzato.
- **DoD:** deploy su Vercel senza segreti committati; connessione Supabase verificata; RLS attiva ovunque; contratti pubblicati e congelati.

### Fase 1 — Frontend pubblico (§9.1) · *Agente Frontend*
- **DoD:** home + 5 pagine secondarie navigabili e responsive; "L'indizio di Verga" funzionante (rotazione, 3 marker, modale); header/footer condivisi ovunque.

### Fase 2 — Area Museo / admin (§9.2) · *Agente Museo/Admin*
- **DoD:** un operatore crea un docente e genera l'email di invito; CRUD materiali completo; pannello Video & Quiz; cascate di cancellazione corrette.

### Fase 3 — Area Docenti (§9.3) · *Agente Docenti*
- **DoD:** un docente completa la registrazione dall'invito, crea una classe importando un Excel, ottiene un codice univoco, vede gli alunni formattati (`Marco R.`); consuma i materiali esposti dall'Admin.

### Fase 4 — Area Alunni (§9.4) · *Agente Alunni*
- **DoD:** un alunno accede con codice+nome, guarda un video, completa un quiz con feedback verde/rosso, sblocca un badge non ripetibile; completati tutti e 7 scarica il PDF attestato.

> **Integrazione continua:** dopo ogni fase, l'orchestratore verifica che gli artefatti dichiarati in `INTEGRATION.md` siano coerenti tra le sezioni che si toccano (Materiali Admin↔Docenti, Video/Quiz Admin↔Alunni, provisioning).

---

## 9. Dettaglio funzionale per sezione

### 9.1 — Frontend pubblico (Tailwind)

**Componenti condivisi:** `Header`/`Navbar` e `Footer`.
- *Footer:* logo museo + link Privacy/Cookie (sinistra); loghi istituzionali (UE, Min. Cultura, Borgo Cunziria) + disclaimer fondi PNRR (destra).

**Home** — sezioni in ordine:
1. **Intro:** logo progetto, testo introduttivo, due CTA → "Prenota una visita" e "Ho un codice avventura" (→ area studenti).
2. **Mappa + "L'indizio di Verga":** mappa con legenda e pointer; box verticale a destra (sotto la mappa su mobile).
   - Ogni giorno ruota un oggetto riferito a una delle 7 storie, attivo sull'arco 00–24.
   - Tre marker "lente" a posizione **randomica**; **uno solo** è quello buono → modale di congratulazioni con un passo della storia. Gli altri due → "Ritenta sarai più fortunato".
   - Pool oggetti **hardcodato** in `src/data/indizi.ts`.
   - Box: immagine, nome oggetto, titolo "*L'indizio di Verga*", descrizione fissa dell'attività (unica), countdown al prossimo oggetto.
3. **CTA Codice avventura:** fascione fullwidth, sfondo scuro, testo bianco, icona, titolo, testo, pulsante "Scopri come funziona" (→ area studenti).
4. **I personaggi:** titolo, 2 righe di descrizione, carosello di card (immagine + nome, soprannome, breve descrizione).
5. **Sette storie:** titolo, descrizione, slider (1 slide/storia): foto principale + 3 thumbnail verticali, indicatore (`STORIA 1/7`), titolo, sinossi, pulsante → area studenti.
6. **Pianifica visita:** occhiello "Casa Verga – Vizzini", titolo, riga di descrizione, due box: sinistra (secondario) "Prenota la visita" → *Visite in famiglia*; destra (primario) "Organizza la gita" → *Visite scolastiche*.

**Altre pagine:** *Borgo della Cunziria* (2/3–1/3, citazione, sezione museo, sezione PNRR Vizzini, "Torna alla home"); *Visite in famiglia*; *Visite scolastiche*; *Privacy policy*; *Cookie policy*. Tutte con header/footer condivisi.

> ⚠️ Ambiguità su "ogni giorno cambia" + "attivo 00–24" → §11.4.

### 9.2 — Area Museo / admin (Bootstrap)

**Login** (§10): username/password, recupero password via email, link alla home pubblica.

**Menu:** Dashboard · Docenti · Materiali utili · **Video & Quiz** · Impostazioni · Logout.

- **Dashboard:** totale docenti iscritti, totale istituti, classi totali, docenti attivi; box aggiunta rapida docente; box gestione rapida ultimi 4 docenti.
- **Docenti ("Gestione Docenti"):** tabella con filtri (Istituto, Stato) + ricerca (nome/cognome); ordinamento per Nome, Istituto, n. studenti, data registrazione, ultimo accesso. "Nuovo docente" → modale (nome, cognome, istituto, email) → **email di invito** con link di completamento registrazione.
  - **Dettaglio docente:** nome a sinistra; a destra Modifica · Disattiva · Cancella · Torna all'elenco. Box riepilogo + reset password via email. Box tabella materiali (filtrabili per categoria + ricerca) con checkbox per **assegnare materiali**.
  - **Cancellazione docente:** modale che richiede il nome del docente. Cancella **a cascata** alunni, progressi e classi del docente.
- **Materiali utili:** carica / rinomina / assegna categoria / elimina. Categorie: *Prima della visita*, *Percorsi tematici*, *Dopo la visita*.
- **Video & Quiz:** pannello di gestione dei video e dei quiz relativi. I video devono essere **visibili anche ai docenti**.
- **Impostazioni:** nuovo amministratore; elimina account; cambia propria password/email.
- **Logout.**

### 9.3 — Area Docenti (Bootstrap)

**Login** (§10): accesso + reset password via email + link alla home pubblica. Pulsante → **schermata di invito** (completamento registrazione: conferma email + scelta password). Pulsante **"genera password forte"** (12 caratteri alfanumerici + simboli semplici, es. `-_.*][()!"£$%&/`).

**Menu:** Dashboard · Le mie classi · Materiali utili · Impostazioni · Logout.

- **Dashboard:** dati dei **soli alunni del docente loggato** — totale alunni attivi/inseriti, badge conquistati, passaporti completati; box ultime attività; elenco 7 storie con completamento aggregato.
- **Le mie classi:** titolo a sinistra, "Aggiungi nuova classe" a destra → accordion con descrizione + form (nome classe; istituto pre-compilato modificabile; anno `Date.now()` modificabile; **upload Excel alunni**). Box elenco classi.
  - **Codice classe:** `CLASSE-ISTITUTO-ANNO` (es. `3B-GARIBALDI-2026`). **Univoco**: gestire la discriminante per classi omonime di istituti diversi → §11.5.
  - **Formattazione nome alunno** (helper condiviso): `Marco Rossi` → `Marco R.`; `Marco Antonio Rossi` → `Marco A. R.`.
  - Per classe: apri dettaglio (click sul nome) · elimina (modale con codice classe; cascata).
  - **Dettaglio classe:** `nome – anno – Istituto`; riepilogo testuale (es. "18 alunni attivi su 23…"); tabella alunni (nome, Missioni `fatte/totali`, Badge come icone-stella, ultima attività). Azioni: modifica codice · modifica dati · modifica composizione · elimina.
- **Materiali:** materiali della redazione, raggruppati per le 3 categorie, scaricabili/stampabili.
- **Impostazioni:** cambia propria password/email.
- **Logout** → login di questa sezione.

### 9.4 — Area Alunni (Bootstrap)

**Login:** **codice classe + nome alunno** (formato `Marco R.`, specificarlo nell'UI). **Nessun recupero password**: "in caso di problemi contatta il docente di riferimento". **Nessun logout**: sessione finché la schermata è aperta (§6).

Schermata divisa in **video** e **Passaporto (quiz)**.

- **Video:** 7 card-anteprima; click → modale con player (YouTube o asset interno).
- **Passaporto / Quiz:** badge col nome dell'alunno + progress bar. Box con 7 pulsanti (1/storia).
  - Quiz: 5–7 domande; badge con **max 1 errore**.
  - Dopo ogni domanda: risposta corretta in **verde**; se l'alunno sbaglia, la sua in **rosso**.
  - Badge conquistato → modale "Badge conquistato!", **senza** poter rifare il quiz.
  - Completati tutti e 7 → **PDF** che attesta che l'alunno *XXXXXX* ha completato l'esplorazione del Verga's World.

---

## 10. Riferimenti Figma (MCP)

File: `Verga's World` — `https://www.figma.com/design/WcVYyNgWHVEaRoBqCjWvw9/Verga-s-World`

| Sezione / Pagina | node-id | Agente |
|---|---|---|
| Home (frontend) | `75-766` | Frontend |
| Borgo della Cunziria | `37-51` | Frontend |
| Visite in famiglia | `71-566` | Frontend |
| Visite scolastiche | `72-666` | Frontend |
| Login Area Museo | `99-414` | Admin |
| Dashboard Area Museo | `99-139` | Admin |
| Gestione Docenti | `103-4` | Admin |
| Dettaglio Docente | `110-1514` | Admin |
| Login Area Docenti | `61-3` | Docenti |
| Dashboard Area Docenti | `63-31` | Docenti |
| Dettaglio classe | `64-159` | Docenti |

> Privacy/Cookie policy non hanno mockup dedicati: layout generico (titolo + testo) con header/footer condivisi. Mancano i node-id per l'**Area Alunni** → §11.6.

---

## 11. Punti aperti da risolvere prima di sviluppare

1. **Schema DB** — validare la proposta §5 (nomi, indici, cascate) e congelarla come contratto.
2. **Auth alunni** — confermare "API route server-side + sessione effimera" (§6); definire durata e meccanismo.
3. **Invio email** — scegliere il servizio per inviti e reset (Supabase Auth email? Resend? Nodemailer via Edge Function?). Template e mittente.
4. **"L'indizio di Verga"** — l'oggetto cambia una volta al giorno (00→24) o più volte? I marker random si rigenerano a ogni reload o sono fissi per la giornata? Fuso di riferimento del countdown.
5. **Univocità codice classe** — strategia discriminante: suffisso città (`3B-GARIBALDI-RA-2026`), ID istituto, o counter. Formato definitivo.
6. **Figma Area Alunni** — fornire i node-id mancanti per video, passaporto, quiz, PDF.
7. **Formato Excel alunni** — colonne attese e gestione errori di import (righe malformate, duplicati).
8. **PDF attestato** — generazione server-side (consigliata) o client; libreria; template.
9. **Quiz** — contenuti gestiti via pannello Admin o seed iniziale? Confermare soglia "max 1 errore" per tutti i quiz.
10. **Esecuzione multi-agente** — subagent in **sequenza** o in **parallelo con git worktrees/branch**? Definire la policy di integrazione e chi possiede il merge (l'orchestratore).
