# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Verga's World** is a multi-page educational website for the Casa Verga museum in Vizzini (Sicily). It introduces children (ages 6–12) to Giovanni Verga's works through an illustrated interactive map, character cards, a daily clue game, and an unlockable "Adventure Code" quiz experience. All user-facing copy is in **Italian**.

The site is an **Astro** static site (migrated from plain HTML on 2026-06-12). Pages live in `src/pages/*.astro` and share a single `src/layouts/BaseLayout.astro`. The original interactive logic is **unchanged vanilla JS** served from `public/scripts/` and loaded with `is:inline` `<script>` tags (so global ordering — e.g. `quiz-data.js` before `adventure.js` — and `window.*` globals are preserved). Styling is still the **hand-written CSS** in `src/styles/`, imported per-page (not Tailwind — see note below).

## Running locally

```bash
npm install
npm run dev       # dev server (http://localhost:4321)
npm run build     # static build -> dist/
npm run preview   # serve the built dist/
```

There are no unit tests or linters. `astro build` is the de-facto check — it fails on broken imports, bad `.astro` syntax, or missing assets.

### Styling / Tailwind status
Styling lives entirely in `src/styles/{styles,teacher,adventure}.css`, each imported by the pages that need it so Astro bundles/scopes it per-page. `src/styles/a11y.css` is global (imported by `BaseLayout`) and holds focus-visible, reduced-motion, and the `.visually-hidden` util. `tailwind.config.js` defines design tokens (brand `#1A3A5C` / accent `#E07B2A` / warm `#F2C94C`, Fraunces/Nunito, radii, shadows) but **Tailwind is not wired up** — markup uses no utility classes. A future migration to compiled Tailwind is planned; keep the legacy CSS authoritative until then.

## Routing / page structure

Astro file-based routing under `src/pages/`. Clean URLs (no `.html`); the flat marketing pages became routes:

- `index.astro` → `/` — homepage: interactive Vizzini map, character carousel, video vault, daily clue game. (Hand-authored, not machine-converted.)
- `borgo-cunziria.astro`, `famiglie.astro`, `scuole.astro` → `/borgo-cunziria`, `/famiglie`, `/scuole` — marketing/info.
- `avventura/` → `/avventura` (code entry), `/avventura/passaporto` (badge progress), `/avventura/missione/la-lupa` (quiz runner).
- `insegnante/` → `/insegnante/{login,dashboard,classe,materiali,impostazioni}`. `/insegnante` redirects to `/insegnante/dashboard` (configured in `astro.config.mjs`, not a page).
- `invito/` → `/invito` — teacher invite landing.

All internal links and asset paths are **absolute** (`/avventura`, `/immagini/…`, `/scripts/…`). When adding pages/links, use absolute paths — there are no relative `../` links anymore.

### How the pages were generated
`tools/convert.mjs` was a one-shot migration script: it lifted each old `<body>`, rewrote relative paths to absolute clean URLs, injected `loading="lazy"`/`decoding="async"`/`alt=""` on images, and wrapped the body in `BaseLayout` via `<Fragment set:html={...}>`. The generated `.astro` files are now the source of truth — **edit them directly; do not re-run the script** (re-running would overwrite hand edits). The machine-converted pages embed their body as a JSON-encoded `set:html` string; `index.astro` is the exception (fully hand-written, normal markup).

### BaseLayout
`BaseLayout.astro` owns `<head>` (meta, canonical, Open Graph, `lang="it"`), the skip link, and Google-Fonts loading. Props: `title`, `description`, `fonts` (`"main"` = Lexend+Fredericka / `"adventure"` = Abel+Source Serif 4 / `"none"`), `scripts` (array of `{src, defer}` served from `public/`), `page` (→ `<body data-page>` for `adventure.js` dispatch), `bodyClass`. The page body goes in the default slot; extra `<head>` content via the `head` named slot.

### Original assets
- `public/immagini/` — all images and SVG badges (served at `/immagini/…`).
- `public/scripts/` — the vanilla JS modules (served at `/scripts/…`).

## JavaScript modules (`public/scripts/`)

Scripts are plain classic `<script>` includes (no ES modules/bundler), emitted by `BaseLayout` as `is:inline`. Key shared conventions:

- **DOM hooks use `data-*` attributes**, not classes/IDs, for behavior wiring (e.g. `[data-story]`, `[data-clue-panel]`, `[data-entry-form]`). When adding interactivity, follow this pattern.
- `app.js` — homepage map + daily clue. The "clue of the day" is deterministic: `dailyClues[floor(Date.now()/86400000) % len]`, so it rotates every 24h with no backend.
- `characters.js` — homepage character carousel scrolling.
- `adventure.js` — the core quiz/passport engine (see below).
- `teacher.js` — teacher-page UI (copy-code toast, help modal, invite-token handling, language toggle persisted to `localStorage["teacher-language"]`).

### Adventure quiz engine (`public/scripts/adventure.js`)

This is the most stateful part of the codebase. Understand it before touching the adventure flow:

- The single script handles three pages, dispatched by `document.body.dataset.page` (`"entry"`, `"passport"`, or `"mission"`). Each page must set `<body data-page="…">`.
- **Auth is client-side only.** `VALID_CODES` is a hard-coded array of demo codes (e.g. `VRG-2024`, `VIZZINI`). Entering a valid code + name writes a session to `localStorage["vergaAdventure"]`. There is no real authentication.
- **Quiz content has two sources:** `public/scripts/quiz-data.js` sets `window.VERGA_QUIZ_DATA` (the authoritative Italian quiz set, keyed by `storyId`); `adventure.js` transforms it via `buildQuizzesFromData()`. If that global is absent, it falls back to the inline `FALLBACK_QUIZZES` constant. **The two sources duplicate question content — keep them in sync** when editing quizzes, and load `quiz-data.js` before `adventure.js`.
- **Progress** is stored in `localStorage["vergaCompletions"]`, namespaced by completion scope (`session.classId || session.code || "default"`). `getAllCompletions()` migrates an older flat (un-namespaced) store on read — preserve that migration if you refactor.
- The 7 stories/badges are defined by the `STORIES` array and `STORY_IMAGES` (SVG badges in `public/immagini/`). Story IDs (`carletto-arriva`, `la-lupa`, etc.) are the join key across `STORIES`, `quiz-data.js`, `STORY_IMAGES`, and the `?storyId=` query param used by the mission page.

## Supabase (planned backend, not yet wired)

`supabase/teacher-dashboard.sql` defines the intended teacher backend: `teacher_profiles`, a `class_progress` view, and RLS policies over `adventure_codes` / `mission_completions`. **No page currently imports a Supabase client** — the teacher dashboard and adventure flow are still front-end mocks. This SQL is the schema to build against when the backend is connected; align any new code (e.g. replacing `VALID_CODES` or `vergaCompletions` with real persistence) with these table/column names.

## Conventions

- Italian UI text frequently omits accents in source strings (e.g. "puo", "liberta", "citta") — match the surrounding style rather than "correcting" them unless asked.
- Internal links and asset references are **absolute** (`/avventura`, `/immagini/…`). Image references inside JS (`app.js` `images:[…]`, `adventure.js` `STORY_IMAGES`) and the redirect targets in `adventure.js` are also absolute — keep them that way.
- The old `immagini/`, `src/*.css`, `src/*.js` top-level layout and the flat `*.html` pages no longer exist; assets moved to `public/` and `src/` under the Astro layout.
