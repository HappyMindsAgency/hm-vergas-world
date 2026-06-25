# INTEGRATION.md — Registro di integrazione tra agenti

Registro condiviso: ogni agente dichiara **cosa espone** e **cosa consuma**, e annota le decisioni di contratto.
Solo l'**orchestratore** modifica i contratti (schema, tipi, API, componenti condivisi).
Un subagent che ha bisogno di toccare un contratto **scrive qui una richiesta** e si ferma (vedi ultima sezione).

---

## Stato dei contratti condivisi — **CONGELATI (Fase 0)**
| Contratto | Stato | Owner | Riferimento |
|---|---|---|---|
| Schema DB + migrations | ✅ congelato | Orchestratore | `supabase/migrations/0001_initial_schema.sql` |
| Tipi TS (`src/types/db.ts`) | ✅ congelato | Orchestratore | rispecchia lo schema; rigenerabili con `supabase gen types` |
| Client Supabase | ✅ congelato | Orchestratore | `src/lib/supabase/{browser,server}.ts` |
| Contratti API (route server-side) | ✅ congelato | Orchestratore | vedi sotto "Contratti API" |
| Componenti condivisi (Header/Footer) | ✅ congelato | Orchestratore | `src/components/{Header,Footer}.astro` |
| Helper condivisi | ✅ congelato | Orchestratore | `src/lib/format.ts`, `src/lib/classCode.ts` |
| Servizio email | ✅ congelato | Orchestratore | `src/lib/mail.ts` (nodemailer/SMTP) |
| Config di gioco | ✅ congelato | Orchestratore | `src/config/game.ts` |
| Isolamento Tailwind/Bootstrap | ✅ deciso | Orchestratore | per route-group layout (vedi ADR-11) |

> **Regola di freeze:** i file sopra non si modificano da parte dei subagent. Per cambiarli → richiesta in fondo.

---

## Decisioni (ADR sintetici) — risolti i Punti aperti §11 (2026-06-24)
- **ADR-1 · Schema DB:** approvato §5 as-is e congelato. Cascate via FK `on delete cascade` (docente→classi→alunni→progressi).
- **ADR-2 · Auth alunni:** login `access_code + display_name` via API route server-side; sessione **cookie HttpOnly firmato senza maxAge** (vive finché il browser è aperto). Niente Supabase Auth, niente reset, niente logout.
- **ADR-3 · Email:** **nodemailer** su SMTP (env). Un solo punto d'invio `sendMail()` in `src/lib/mail.ts`, provider sostituibile senza toccare le API route.
- **ADR-4 · Indizio di Verga:** oggetto ruota **1 volta/giorno** su fuso **Europe/Rome**; i 3 marker sono **seedati dalla data** → stabili a ogni reload nella giornata; countdown a mezzanotte Rome. Pool in `src/data/indizi.ts` (no DB).
- **ADR-5 · Codice classe:** formato `NOME-ISTITUTO-ANNO`; univocità via **UNIQUE in DB + suffisso numerico** (`-2`, `-3`…) su collisione. Helper `buildClassCode` / `nextFreeClassCode`.
- **ADR-6 · Figma Alunni:** node-id non disponibili; Sezione 4 costruita dal funzionale §9.4 con Bootstrap.
- **ADR-7 · Import Excel:** **una colonna "Nome Cognome"**, una riga per alunno, header opzionale. Righe vuote saltate; duplicati nella stessa classe scartati con report a video.
- **ADR-8 · PDF attestato:** **pagina HTML + `window.print`** (CSS `@media print`); nessuna libreria, nessun codice server.
- **ADR-9 · Quiz:** domande/opzioni in DB, gestite dal pannello **Admin** (no seed). Soglia **max 1 errore** uguale per tutti i 7 quiz (`QUIZ_MAX_ERRORS`).
- **ADR-10 · Esecuzione subagent:** **sequenziale** `Frontend → Admin → Docenti → Alunni`. L'orchestratore integra dopo ogni sezione.
- **ADR-11 · Isolamento CSS:** per **route-group layout**. Pubblico → `BaseLayout` (CSS scritto a mano, Tailwind in seguito), riservato → `ReservedLayout` (Bootstrap). Nessuna pagina mischia i due. Bootstrap importato solo in `ReservedLayout`.
- **ADR-12 · Adapter SSR (2026-06-25, ratificato):** aree riservate server-side (auth-gated + `/api` con service_role). Adottato **`@astrojs/vercel`** in `astro.config.mjs` (target deploy = Vercel, §2). `output` static di default; SSR on-demand solo su route con `export const prerender = false`. `astro.config.mjs` ora **config condivisa congelata**: i subagent non la modificano (richieste → in fondo).
- **ADR-13 · Storie seedate (2026-06-25):** le 7 `stories` sono contenuto fisso, **seedate** via `supabase/migrations/0002_seed_stories.sql` (numero+titolo, allineati a `src/data/indizi.ts`). L'Admin gestisce video/quiz relativi, non crea le storie; sinossi/images li riempie l'editoria.
- **ADR-14 · Navbar Header allineata a Figma (2026-06-25, orchestratore):** `Header.astro` (contratto condiviso) aggiornato dall'orchestratore per aderire alla navbar Figma `75:989`: voci **Mappa · Indizio · Personaggi · Storie · Visita · Il Borgo** + CTA **Area docenti** (`/insegnante/login`). Anchor verso le sezioni della home rifatta (`#mappa`, `#indizio`, `#characters-title`, `#storie`, `#visita`). La logica del menu hamburger è ora un `<script>` inline dentro `Header.astro` (prima in `public/scripts/app.js`), così viaggia col componente su ogni pagina pubblica. `public/scripts/{app,characters}.js` **rimossi** (motore mappa-cartoon dismesso); l'include `app.js` tolto da borgo-cunziria/cookie/famiglie/scuole/privacy.
- **Provisioning (non-codice):** creare il bucket **Supabase Storage `materiali`** (lettura per docenti assegnatari / accesso via service_role). Richiesto dai Materiali Admin; non esprimibile in migration SQL.

---

## Contratti API (route server-side) — firme congelate
> Implementazione a carico delle sezioni; **firma e semantica** non si cambiano senza richiesta qui.
> Tutte usano `supabaseServer` (service_role) e validano gli input.

**Alunni (sessione effimera, no Supabase Auth)**
- `POST /api/alunni/login` — body `{ accessCode, displayName }` → set-cookie HttpOnly di sessione; `{ ok, student: { id, displayName, classId } }` | 401.
- `POST /api/alunni/quiz` — (cookie sessione) body `{ quizId, answers }` → calcola score/passed (≤1 errore), upsert `student_quiz_attempts`, eventuale `student_badges`; `{ passed, score, badgeEarned }`. Quiz già `passed` → non ripetibile.
- `GET  /api/alunni/passaporto` — (cookie sessione) → badge dell'alunno + progress.

**Docenti / Admin (Supabase Auth)**
- `POST /api/docenti/invito` — (admin) body `{ nome, cognome, email, instituteId }` → crea profilo `pending` + invio email invito (`sendMail`).
- `POST /api/docenti/reset-password` — body `{ email }` → email reset.
- `POST /api/classi/import` — (teacher) multipart Excel → parsing 1 colonna "Nome Cognome", crea `students` con `display_name` formattato; genera `access_code` univoco; `{ created, skipped }`.

---

## Interfacce trasversali
| Da → A | Cosa | Owner produttore | Stato |
|---|---|---|---|
| Orchestratore → tutti | Schema, tipi, client Supabase, auth, Header/Footer, helper | Orchestratore | ✅ congelato |
| Admin → Docenti | Provisioning docenti (invito email, `/api/docenti/invito`) | Admin | contratto pronto, impl. Fase 2 |
| Admin → Docenti | Materiali + `material_assignments` | Admin | contratto pronto, impl. Fase 2 |
| Admin → Alunni | Video & Quiz (`stories/videos/quizzes/...`) | Admin | contratto pronto, impl. Fase 2 |
| Docenti → Alunni | Identità classe/alunno (`access_code` + `display_name`) | Docenti | contratto pronto, impl. Fase 3 |

---

## Sezione 1 — Frontend pubblico (dichiarazione interfacce)
> Aggiornato dall'agente Frontend (Fase 1). Niente contratti condivisi modificati.

**Consuma (contratti congelati):**
- `src/components/Header.astro`, `src/components/Footer.astro` — usati su tutte le pagine pubbliche (home, borgo-cunziria, famiglie, scuole, privacy, cookie).
- `src/layouts/BaseLayout.astro` — layout pubblico (CSS scritto a mano; nessun Tailwind, ADR-11).
- `src/config/game.ts` — `GAME_TIMEZONE`, `INDIZIO_MARKERS` per "L'indizio di Verga".
- `src/data/indizi.ts` — pool 7 oggetti (popolato in questa fase con il tipo `Indizio` già definito).

**Espone (verso l'area studenti — solo link, nessuna logica auth):**
- CTA "Ho un Codice Avventura" / "Scopri come funziona" → `/avventura` (Header e home, sez. 1 e 3).
- CTA "Area insegnanti" → `/insegnante/login` (Header). Sono link statici: l'auth è di competenza delle sezioni riservate.

**Aggiunto in Sezione 1 (non contratti):**
- `src/lib/indizioGiorno.ts` (+ `indizioGiorno.check.ts`) — logica pura ADR-4: rotazione giornaliera su `Europe/Rome`, 3 marker seedati dalla data, countdown a mezzanotte Rome. Self-check via `npm test`.
- `public/scripts/indizio.js` — mirror client della logica pura (build statica: la rotazione si calcola nel browser al view-time, non a build-time). Legge pool+costanti da `<script id="indizio-data">` iniettato da `index.astro`.
- `src/pages/privacy.astro`, `src/pages/cookie.astro` — pagine legali generiche (linkate dal Footer condiviso).

**Home rifatta su Figma `75-766` (2026-06-25):** `src/pages/index.astro` reimplementa la home aderente al design Figma (mappa illustrata reale di Vizzini con 7 tappe corrette, box "Indizio di Verga" sovrapposto a destra della mappa, slider 7 storie, sezioni personaggi / CTA codice / pianifica visita / footer). CSS in `src/styles/home.css` (scritto a mano, tutto scoped sotto `.vw-home`; ADR-11 rispettato — nessun Tailwind). Tipografia Figma (Fraunces + Outfit) caricata via slot `head` del `BaseLayout` con `fonts="none"` (BaseLayout non modificato). Logica indizio invariata: `index.astro` mantiene i selettori che `indizio.js` consuma (`[data-clue-map]`, `[data-clue-object]`, `[data-clue-image]`, `[data-clue-countdown]`, e la modale `[data-clue-success-*]`). Aggiunto `public/scripts/home-slider.js` (scroll-snap nativo, niente libreria). Dismessi sulla home `app.js`/`characters.js` (motore mappa cartoon non più usato). Header/Footer condivisi intatti.
  - **Asset aggiunti in `public/immagini/`** (scaricati da Figma): `figma-mappa-vizzini.png` (mappa illustrata), `figma-logo-vergas-world.png` (logo hero), `figma-icona-missione.svg` (icona missione indizio), `figma-penna-calamaio.png` (icona banda codice), `figma-loghi-finanziamento.png` (loghi PNRR, riserva per il footer).
**Secondo giro di rifiniture Figma (2026-06-25, agente Frontend):**
  - **Mappa (75:769):** non più riquadro centrato con bordo. Ora illustrazione panoramica **a tutta larghezza** (`.vw-map-stage`, `aspect-ratio: 1920/1149`), con le 7 **tappe in una riga in cima** (`.vw-tappe` su barra bianca) e didascalia (`.vw-map-note`) in basso. Rimossa la card-wrapper `.vw-map-card` (markup e CSS). Le lenti indizio (`.clue-marker`) restano iniettate da `indizio.js` con posizione seedata (ADR-4 invariato).
  - **Box "L'indizio di Verga" (75:1016):** card verticale **stretta** (desktop `min(470px, 28vw)` ≈ 26% della mappa) che **galleggia sull'angolo top-right** della mappa (`position:absolute`); su `<1100px` scende **sotto la mappa a piena larghezza** (`max-width:502px`, brief §9.1). Contenuti e selettori invariati; `data-clue-countdown` resta un singolo elemento `HH:MM:SS` (logica indizio non toccata).
  - **`<Fragment slot="head">` rimosso da `index.astro`:** i font Fraunces/Outfit sono ora globali in `styles.css` (orchestratore), quindi i `<link>` ridondanti sono stati eliminati; `fonts="none"` invariato.
  - **3 pagine interne rifatte aderenti a Figma** (`borgo-cunziria.astro` → 37:51 layout 2/3–1/3 + citazione + museo + PNRR + "Torna alla Home"; `famiglie.astro` → 71:566; `scuole.astro` → 72:666). Nuovo CSS condiviso **`src/styles/pagina-interna.css`** scoped sotto `.vw-page` (hero con immagine sfumata, pill oro, card Fraunces, citazione, CTA). Niente Tailwind/Bootstrap (ADR-11). Usano `BaseLayout` + Header/Footer condivisi con `fonts="none"`.
  - **Asset aggiunti in `public/immagini/`** (da Figma): `figma-piazza-cunziria.png` (hero/article borgo-famiglie-scuole), `figma-museo-facciata.png` (immagine museo nelle 3 pagine).
  - **Divergenze Figma ↔ contratti note (nessun contratto toccato):** (1) le 7 "tappe" della mappa (Il Palazzo, La Chiesa sulla collina, La Giara, L'Orto, Il Salotto, Il Villaggio, Verga il ritratto) sono i nomi delle stanze del museo, distinti dai titoli delle storie seedate (`indizi.ts`/`0002_seed_stories.sql`): sono trattati come etichette di presentazione hardcodate in `index.astro`, non come dati condivisi. (2) Le slide storie riusano testo/immagini da `src/data/indizi.ts` (copy storia 1 dal Figma); le sinossi/immagini definitive le riempirà l'editoria. (3) Il navbar Figma (`75:989`: Mappa/Indizio/Personaggi/Storie/Visita/Il Borgo + "Area docenti") differisce dal `Header.astro` condiviso (congelato): si è riusato `Header.astro` senza modificarlo.

---

## Sezione 2 — Area Museo / Admin (dichiarazione interfacce)
> Aggiornato dall'agente Admin (Fase 2). Route sotto `/museo` (Bootstrap, `ReservedLayout` via `MuseoLayout`).

**Consuma (contratti congelati):**
- Schema DB + RLS (`is_admin()`), `src/types/db.ts`.
- `src/lib/supabase/server.ts` (service_role, import **dinamico** nelle API/SSR per non crashare a build-time senza env) e `src/lib/supabase/browser.ts` (anon, solo per il login `signInWithPassword`).
- `src/lib/mail.ts` (`sendMail`) per invito docente e reset password (ADR-3).
- `src/config/game.ts` (`MATERIAL_CATEGORIES`), `src/lib/format.ts` (riuso se servono nomi alunni).
- `src/layouts/ReservedLayout.astro`.

**Espone verso Docenti:**
- **Provisioning docenti** — `POST /api/docenti/invito` (firma congelata `{ nome, cognome, email, instituteId }`): crea utente auth + `profiles(role='teacher', status='inactive')` e invia email invito con link a `/invito`. `POST /api/docenti/reset-password` `{ email }` (aperto, usato anche dal login).
- **Materiali + assegnazioni** — caricati su Supabase Storage bucket **`materiali`** (vedi `MATERIALS_BUCKET` in `src/config/admin.ts`); metadati in `materials`; assegnazioni in `material_assignments` via `POST/DELETE /api/docenti/:id/materiali`. I Docenti leggono i materiali assegnati (RLS `materials_assigned`/`ma_owner`). **Bucket Storage `materiali` da creare lato Supabase** (non in migration).

**Espone verso Alunni:**
- **Video & Quiz** — scritti su `stories/videos/quizzes/quiz_questions/quiz_options` dal pannello `/museo/video-quiz` via `POST /api/video-quiz` (dispatch `action`). Quiz **1:1 con storia**; opzioni con `is_correct`. Lettura per `authenticated` già garantita da RLS → **i video sono visibili anche ai Docenti** (contratto di lettura: nessuna API dedicata, lettura diretta delle tabelle con anon/authenticated). Le storie (1..7) si assumono **seedate** lato DB: il pannello non le crea.

**Aggiunto in Sezione 2 (non contratti condivisi):**
- `src/config/admin.ts` (nav, label categorie/stato, opzioni ordinamento, bucket).
- `src/lib/admin/{session,api,data,content}.ts` (guard admin via cookie HttpOnly `sb-admin-token`, helper risposte JSON, letture aggregate SSR).
- `src/layouts/MuseoLayout.astro`, `src/styles/museo.css`, `src/components/admin/{AdminIcon,StatCards}.astro`.
- API admin-specifiche: `/api/museo/{session,logout,impostazioni}`, `/api/docenti/:id`, `/api/materiali` + `/api/materiali/:id`, `/api/video-quiz`.

**Auth Admin (meccanismo scelto):** login client con `supabaseBrowser.signInWithPassword`; l'access_token viene scambiato con un cookie **HttpOnly `sb-admin-token`** (`POST /api/museo/session`), che verifica `role='admin'`. Le pagine `/museo/*` sono SSR (`prerender=false`) e fanno da guard reindirizzando a `/museo/login`. Logout = cancellazione cookie.

**Cancellazione docente a cascata:** `DELETE /api/docenti/:id` elimina l'utente `auth.users`; la FK `profiles.id → auth.users on delete cascade` propaga a `profiles → classes → students → student_quiz_attempts/badges`. Coerente con ADR-1; nessun coordinamento runtime richiesto con l'agente Docenti.

---

## Sezione 3 — Area Docenti (dichiarazione interfacce)
> Aggiornato dall'agente Docenti (Fase 3). Route sotto `/insegnante` (+ `/invito`), Bootstrap, `ReservedLayout` via `DocenteLayout`. SSR (`prerender=false`) auth-gated.

**Consuma (contratti congelati):**
- Schema DB + RLS (`classes_owner`, `students_owner`, `sqa_owner`, `badges_owner`, `materials_assigned`), `src/types/db.ts`.
- `src/lib/supabase/server.ts` (service_role, import **dinamico** in API/SSR) e `src/lib/supabase/browser.ts` (anon, solo `signInWithPassword` e flusso invito/recovery `updateUser`).
- Helper condivisi: `formatStudentName` (`src/lib/format.ts`) per i nomi alunni; `buildClassCode` + `nextFreeClassCode` (`src/lib/classCode.ts`) per i codici classe (ADR-5).
- `src/config/game.ts` (`STORIES_COUNT`, `MATERIAL_CATEGORIES`), `src/config/admin.ts` (`MATERIALS_BUCKET`, `MATERIAL_CATEGORY_LABELS`).
- `src/layouts/ReservedLayout.astro` (unico importatore di Bootstrap, ADR-11).

**Consuma da Admin:**
- **Provisioning docente** — `POST /api/docenti/invito` (Admin) crea `profiles(role='teacher', status='inactive')` + email con link a `/invito`. Il completamento (scelta password + `status='active'`) avviene in Fase 3: `POST /api/insegnante/completa-registrazione`.
- **Reset password** — riusa `POST /api/docenti/reset-password` (firma congelata), redirect a `/invito?reset=1` (la stessa pagina gestisce invito e recovery).
- **Materiali assegnati** — lettura via RLS `materials_assigned`; URL di download **firmati temporanei** generati server-side (service_role) in `getAssignedMaterials`. Sola lettura/download, nessuna scrittura.

**Espone verso Alunni:**
- **Identità classe/alunno** — `classes.access_code` (codice classe univoco, ADR-5) + `students.display_name` (formato `Marco R.` via `formatStudentName`). Sono le credenziali del login alunno (ADR-2: `access_code + display_name`). Univocità in classe garantita dal vincolo `UNIQUE(class_id, display_name)`; univocità del codice dal vincolo `UNIQUE(classes.access_code)` + suffisso numerico.

**Coordinamento cancellazione (cascata, coerente con ADR-1):**
- Cancellazione **classe** docente (`DELETE /api/classi/:id`, ownership `teacher_id`) → FK `students → student_quiz_attempts/student_badges on delete cascade`.
- Cancellazione **docente** è dell'Admin (`DELETE /api/docenti/:id`): `profiles → classes → students → progressi`. Nessun coordinamento runtime tra agenti: solo FK. Il Docente non cancella mai altri docenti.

**Aggiunto in Sezione 3 (non contratti condivisi):**
- `src/config/docenti.ts` (nav, alfabeto/lunghezza password forte, accept/header import).
- `src/lib/docenti/{session,api,data}.ts` (guard teacher via cookie HttpOnly `sb-teacher-token`; letture aggregate SSR filtrate per `teacher_id`).
- `src/lib/docenti/{importStudents,classCodeAlloc}.ts` (import alunni in classe; allocazione codice con retry su collisione UNIQUE).
- `src/lib/password.ts` (generatore password forte, Web Crypto — proponibile come utility condivisa se servirà altrove).
- `src/lib/studentImport.ts` (parsing file import alunni, ADR-7 — vedi sotto).
- `src/layouts/DocenteLayout.astro`, `src/styles/docenti.css`, `src/components/docenti/DocenteIcon.astro`.
- Pagine: `/insegnante/{login,index,classi,classe/[id],materiali,impostazioni}`, `/invito`.
- API docente-specifiche: `/api/insegnante/{session,logout,completa-registrazione,impostazioni}`, `/api/classi` (crea classe + import opzionale), `/api/classi/[id]` (PATCH dati/codice/composizione, DELETE).

**Auth Docenti (meccanismo scelto):** specchio dell'Admin. Login client `supabaseBrowser.signInWithPassword` → scambio con cookie **HttpOnly `sb-teacher-token`** (`POST /api/insegnante/session`), che verifica `role='teacher'` **e** `status='active'`. Le pagine `/insegnante/*` sono SSR e reindirizzano a `/insegnante/login` se non autenticate. Logout = cancellazione cookie.

**Import Excel (ADR-7) — implementazione:** `POST /api/classi/import` (firma congelata) e `POST /api/classi`. Una colonna "Nome Cognome"; header opzionale (riconosciuto via `STUDENT_IMPORT_HEADER_HINTS`); righe vuote saltate; duplicati nel file e già in classe scartati con report `{ created, skipped, skippedDetails }`. Parser proprio in `src/lib/studentImport.ts`: `.xlsx` letto con **`fflate`** (unzip leggero, scelto al posto di SheetJS/`xlsx` che ha advisory high-severity senza fix) + scansione XML della colonna A; accetta anche `.csv`. Il `display_name` è formattato con `formatStudentName`. L'univocità finale è il vincolo `UNIQUE(class_id, display_name)`: upsert con `ignoreDuplicates`.

**Codice classe (ADR-5) — collisioni:** `buildClassCode(nome, istituto, anno)` → base `NOME-ISTITUTO-ANNO`. `insertClassWithUniqueCode` carica i codici esistenti `LIKE base%`, propone il primo libero con `nextFreeClassCode` (suffisso `-2`, `-3`…), inserisce; su violazione UNIQUE (`23505`, race con altro insert) ricalcola e riprova (max 5). La discriminante per classi omonime di istituti diversi è il segmento ISTITUTO; il suffisso numerico copre le collisioni residue.

**Dipendenza aggiunta:** `fflate@0.8.3` (unzip puro per il parsing `.xlsx`; nessuna advisory).

---

## Sezione 4 — Area Alunni (dichiarazione interfacce)
> Aggiornato dall'agente Alunni (Fase 4). Route sotto `/avventura` (Bootstrap, `ReservedLayout` via `AlunnoLayout`). SSR (`prerender=false`) auth-gated tranne il login. **Caso speciale ADR-2: NIENTE Supabase Auth.**

**Consuma (contratti congelati):**
- Schema DB + RLS, `src/types/db.ts`.
- `src/lib/supabase/server.ts` (service_role, import **dinamico** in tutte le API/SSR: build senza env degrada a stato vuoto, non crasha). **Nessun uso di `supabaseBrowser`**: l'alunno non tocca mai il DB dal client.
- Helper condivisi: `formatStudentName` (`src/lib/format.ts`) — riusato (non duplicato) nel data layer.
- `src/config/game.ts` (`QUIZ_MAX_ERRORS`, `STORIES_COUNT`).
- `src/layouts/ReservedLayout.astro` (unico importatore di Bootstrap, ADR-11).

**Consuma da Admin (Video & Quiz):**
- Legge `stories` (1..7 seedate), `videos` (`source_type` = `youtube|asset`, `url_or_path`), `quizzes`, `quiz_questions`, `quiz_options`. **`quiz_options.is_correct` NON lascia mai il server** (vincolo 4): la lettura per il client seleziona esplicitamente solo `id, question_id, testo`.

**Consuma da Docenti (identità login):**
- `classes.access_code` + `students.display_name` come credenziali (ADR-2). Match nome case/spazi-insensitive; univocità garantita dal vincolo `UNIQUE(class_id, display_name)`.

**Espone (progressi alunno, scritti SOLO via endpoint server-side):**
- Scrive `student_quiz_attempts` (un tentativo per submit; `passed` ≤ `QUIZ_MAX_ERRORS` errori) e `student_badges` (upsert idempotente su PK `student_id,story_id`). Non ripetibilità protetta da `sqa_one_pass_idx` + check applicativo. Letti da Docenti/Admin via RLS (`sqa_owner`/`badges_owner`/`*_admin`).

**Auth Alunni (meccanismo, ADR-2):** login `POST /api/alunni/login` valida `access_code + display_name` server-side e setta un cookie **HttpOnly firmato (HMAC) `vw-alunno` SENZA maxAge** → cookie di sessione (vive finché il browser è aperto). Il segreto di firma deriva dalla `service_role` key (solo server, mai nel bundle); senza env nessuna sessione è valida ma il build regge. **Niente reset password** ("contatta il docente"), **niente logout** (solo "Cambia codice" che riporta al login). Ogni operazione di scrittura riverifica la sessione.

**Endpoint read-only AGGIUNTI (pre-autorizzati, vincolo 6 — non cambiano le 3 firme congelate):**
- `POST /api/alunni/verifica` — (cookie) body `{ numero, questionId, optionId }` → `{ questionId, correctOptionId, chosenCorrect }`. Feedback per-domanda (verde/rosso) dopo ogni risposta: rivela SOLO la correttezza di QUELLA domanda e qual è l'opzione giusta, senza svelare le altre. Non scrive nulla.

**Le 3 firme congelate — implementate as-is:**
- `POST /api/alunni/login` `{ accessCode, displayName }` → set-cookie + `{ ok, student:{ id, displayName, classId } }` | 401.
- `POST /api/alunni/quiz` (cookie) `{ quizId, answers }` → calcola server-side, upsert attempt/badge → `{ passed, score, total, badgeEarned, alreadyPassed, allBadges }`. (`total/alreadyPassed/allBadges` sono campi additivi non segreti per la UI; la firma core `{ passed, score, badgeEarned }` è invariata.) Quiz già `passed` → nessuna riscrittura.
- `GET /api/alunni/passaporto` (cookie) → `{ badgeCount, total, rank, storyBadges[], completed }`.

**Aggiunto in Sezione 4 (non contratti condivisi):**
- `src/config/alunni.ts` (nome cookie, rank decorativi, testi fissi).
- `src/lib/alunni/{session,api,data,grade}.ts` (cookie firmato HMAC; guard sessione; letture SSR/read-only senza `is_correct`; correzione e badge SOLO server-side).
- `src/layouts/AlunnoLayout.astro`, `src/styles/alunni.css`.
- Pagine: `/avventura` (login), `/avventura/passaporto` (Video + Passaporto), `/avventura/missione/[numero]` (quiz), `/avventura/attestato` (PDF via `window.print`, ADR-8). **Sostituito** il prototipo statico (`/avventura/passaporto`, `/avventura/missione/la-lupa`) che usava `BaseLayout`/Tailwind (violava ADR-11); nessun link pubblico rotto (Header/home puntano solo a `/avventura`).
- API: `/api/alunni/{login,quiz,passaporto,verifica}`.

**PDF attestato (ADR-8):** pagina `/avventura/attestato` con CSS `@media print` + `window.print`, nessuna libreria. Gate **server-side**: accessibile solo se i 7 badge risultano nel DB (non ci si fida del client).

---

## Richieste di modifica ai contratti (dai subagent all'orchestratore)
> Un subagent che ha bisogno di toccare un contratto scrive qui la richiesta invece di modificarlo.
> Formato: `[data] [agente] — file/contratto — motivo — proposta`.

- ✅ **RATIFICATO (orchestratore, 2026-06-25) → ADR-12.** Adapter `@astrojs/vercel` confermato (target deploy Vercel). `astro.config.mjs` è ora config condivisa congelata.
- ✅ **PRESO IN CARICO (orchestratore) → provisioning.** Bucket Storage `materiali` annotato tra i task di provisioning ambiente (vedi ADR / nota Provisioning).
- ℹ️ **Storie:** seedate dall'orchestratore (`0002_seed_stories.sql`, ADR-13). Il pannello Video & Quiz le assume esistenti — corretto.

- **[2026-06-25] Admin — `astro.config.mjs` + `package.json` — adapter SSR mancante.**
  L'intera Area Museo/Admin è strutturalmente server-side (pagine auth-gated con `prerender=false` + route `/api` che usano la `service_role`). Senza un adapter `npm run build` falla con `NoAdapterInstalled`. **Modifica applicata** (necessaria per il DoD "build verde"): aggiunto `@astrojs/vercel@^10.0.8` (peer `astro@^6`, coerente con `vercel.json`/CLAUDE.md) e `adapter: vercel()` in `astro.config.mjs`. `output` resta **static** di default: solo le route con `prerender=false` diventano on-demand; tutto il frontend pubblico continua a prerenderizzare (verificato in build). **Da validare e ratificare dall'orchestratore** come contratto; se si preferisce `@astrojs/node` (preview locale) o un'altra strategia, indicarlo.
- **[2026-06-25] Admin — Supabase Storage — bucket `materiali`.** I materiali richiedono un bucket Storage `materiali` (non esprimibile nella migration SQL). Va creato lato Supabase con policy coerenti (lettura per i docenti assegnatari / accesso via service_role). Segnalato per la fase di provisioning ambiente.
