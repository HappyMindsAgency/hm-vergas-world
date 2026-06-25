# CLAUDE.md — Verga's World

Guida operativa per Claude Code. Definisce stack, comandi, convenzioni, sicurezza e
workflow multi-agentico. **Caricato automaticamente a ogni sessione.**

## Gerarchia dei documenti
1. **`BRIEF_VERGAS_WORLD.md`** → fonte **funzionale** autorevole (cosa costruire).
2. **`CLAUDE.md`** (questo file) + **`AGENTS.md`** → fonte **tecnica/convenzioni** autorevole (come costruire).
3. **`docs/INTEGRATION.md`** → registro dei contratti e delle interfacce tra agenti.

In caso di conflitto sulle convenzioni vince questo file. In caso di conflitto sui requisiti vince il brief.

---

## Stack
- **Astro** (intero progetto) · **Supabase** (DB/Auth/Storage) · **Vercel** (deploy).
- **Tailwind** → solo Sezione 1 (frontend pubblico).
- **Bootstrap** → Sezioni 2/3/4 (aree riservate).
- **MCP Figma** per le grafiche (node-id nel brief §10).
- TypeScript ovunque.

---

## Comandi essenziali
> Allinea questi script al `package.json` reale; se mancano, aggiungili.

```bash
npm install            # dipendenze
npm run dev            # dev server Astro
npm run build          # build di produzione
npm run preview        # anteprima build
npx astro check        # typecheck Astro/TS — eseguire PRIMA di ogni commit
npm run lint           # lint (se configurato)
```

Supabase (CLI, se in uso):
```bash
supabase start                         # stack locale
supabase migration new <nome>          # nuova migration
supabase db push                       # applica migrations
supabase gen types typescript --local  # genera i tipi condivisi
```

---

## Struttura del progetto (convenzione)
```
src/
  config/        # costanti, soglie, parametri di gioco, testi fissi (config VISIBILE)
  data/          # dati hardcodati (es. indizi.ts per "L'indizio di Verga")
  types/         # tipi TS condivisi — CONTRATTO, generati da Supabase
  lib/           # client Supabase (browser vs server), helper condivisi
  components/    # componenti riusabili (Header, Footer, UI primitives = CONTRATTO)
  layouts/       # layout per route group (pubblico vs aree riservate)
  pages/         # routing Astro
    index.astro            # frontend pubblico (Tailwind)
    museo/                 # Sezione 2 — admin (Bootstrap)
    docenti/               # Sezione 3 (Bootstrap)
    studenti/              # Sezione 4 — alunni (Bootstrap)
    api/                   # API route server-side (service_role NON esce da qui)
supabase/
  migrations/    # schema versionato = CONTRATTO
docs/
  INTEGRATION.md
```

---

## Convenzioni di codice
- **Single responsibility**: una funzione fa una cosa sola; il nome la dichiara.
- **Config visibile**: niente "magic number" o testi sparsi nel codice → in `src/config` o `src/data`.
- **No logica duplicata**: estrai helper condivisi in `src/lib`. Esempi obbligati:
  - formattazione nome alunno (`Marco Rossi` → `Marco R.`; `Marco Antonio Rossi` → `Marco A. R.`);
  - generazione/validazione codice classe;
  - validazione login alunno (codice + nome).
- **Manutenibilità senza AI**: codice leggibile e modificabile da un umano senza assistenza. Niente astrazioni non documentate.
- **Naming coerente** tra DB, `src/types` e componenti.
- **Commenti** solo sul *perché*, mai sul *cosa*.
- **Typecheck pulito** prima di ogni commit (`npx astro check`).

---

## CSS: Tailwind + Bootstrap
- Tailwind **solo** sotto le route pubbliche; Bootstrap **solo** sotto le aree riservate.
- I due framework vanno **isolati** per route group per evitare conflitti di reset/specificità.
- ⚠️ La strategia di isolamento definitiva è un **punto aperto** (brief §11): da concordare con l'orchestratore prima di scrivere CSS condiviso.

---

## Sicurezza (vincoli non negoziabili)
- **Mai** chiavi/token/credenziali nel repo, nemmeno temporaneamente. Solo variabili d'ambiente
  (`.env` locale + Environment Variables su Vercel).
- Verifica che `.env`, `.env.*` e file di credenziali siano in **`.gitignore` prima del primo commit**.
- Sul **client** gira solo la `anon` key. La **`service_role` key** vive **esclusivamente** nelle
  API route server-side / Edge Functions e non deve mai raggiungere il browser.
- **RLS attiva su tutte le tabelle.** Nessuna tabella senza policy. Policy minime:
  - docente → solo le proprie classi/alunni/progressi;
  - admin → docenti e materiali secondo le sue funzioni.
- Prima di un commit, controlla con un diff che non siano finiti segreti nei file tracciati.

---

## Auth
- **Admin / Docenti** → Supabase Auth (email + password). Flussi: invito docente, reset password, completamento registrazione.
- **Alunni** → **NO Supabase Auth**. Login con `codice classe + display_name`. Le operazioni alunno
  (lettura video/quiz, salvataggio tentativi/badge) passano per **API route server-side** che validano
  e usano la `service_role` key lato server. Sessione effimera, niente recupero password, niente logout.
- Meccanismo esatto della sessione alunno = punto aperto (brief §11.2): confermare prima di implementare.

---

## Workflow multi-agentico
- **Orchestratore** (thread principale): possiede le **fondamenta condivise** (schema, RLS, auth, tipi,
  componenti, isolamento CSS), le **congela** come contratti, integra gli output, fa da arbitro sui merge.
- **Subagent** (`.claude/agents/`): uno per sezione — `frontend`, `admin`, `docenti`, `alunni`.
- **Contratti condivisi** (schema DB, `src/types`, contratti API, componenti condivisi, `INTEGRATION.md`):
  un subagent **non li modifica mai da solo**. Se gli serve una modifica → **si ferma e segnala all'orchestratore**.
- Lo scambio di informazioni tra agenti avviene **solo** tramite `docs/INTEGRATION.md` e i contratti, non in tempo reale.
- **Sequenza:** Fase 0 (orchestratore) → poi le sezioni. Per il primo giro: ordine
  `Frontend → Admin → Docenti → Alunni` (rispetta le dipendenze: Admin produce materiali e quiz prima che Docenti/Alunni li consumino).

---

## Git
- Operazioni Git via **GitHub Desktop** (no CLI).
- Niente segreti nei commit (vedi Sicurezza).
- Commit piccoli e tematici, un commit non mescola più sezioni.
- Policy parallelo vs sequenziale (worktrees/branch) = punto aperto (brief §11.10).

---

## MCP Figma
- Accedi alle grafiche con i `node-id` della tabella nel brief §10.
- Estrai prima HTML/CSS semantico, poi adatta al framework della sezione (Tailwind o Bootstrap).

---

## Checklist pre-commit
- [ ] `npx astro check` pulito
- [ ] Nessun segreto nei file tracciati
- [ ] RLS attiva sulle nuove tabelle
- [ ] `service_role` non raggiunge il client
- [ ] Interfacce trasversali aggiornate in `docs/INTEGRATION.md`
- [ ] Nessuna modifica unilaterale ai contratti condivisi

---

## Prima di scrivere codice
Risolvi i **Punti aperti** rilevanti del brief (§11): schema DB, auth alunni, servizio email,
regola dell'indizio, formato codice classe, Figma alunni, formato Excel, PDF, contenuti quiz,
policy multi-agente. In caso di dubbio architetturale: **proponi e attendi conferma**.