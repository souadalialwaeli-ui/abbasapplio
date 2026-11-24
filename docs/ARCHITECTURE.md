# Architecture — abbasapplio

## Overview

abbasapplio is a **local-first PWA**. There is no abbasapplio backend.
All user data lives on the device (IndexedDB + localStorage). Heavy
processing (voice conversion, model training) runs in the official Applio
notebook on the user's own Google Colab runtime, reached through a guided
external-browser handoff.

```
┌─────────────────────────────┐      user opens notebook      ┌──────────────────────┐
│ abbasapplio PWA (this repo) │ ─────────────────────────────▶│ Google Colab notebook│
│  React + TS + Tailwind      │   user pastes Gradio URL ◀─── │  official Applio     │
│  IndexedDB / localStorage   │   (stored locally only)       │  Gradio on :6969     │
└─────────────────────────────┘      user opens Applio UI ───▶└──────────────────────┘
```

## Stack

- **Vite 5 + React 18 + TypeScript (strict)** — `tsc -b` in the build.
- **Tailwind CSS v4** (`@tailwindcss/vite`), theme tokens in
  `src/styles/index.css`. RTL via `dir="rtl"` on `<html>` + logical
  utilities (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`).
- **react-router-dom 6** — 9 routes, see `src/app/App.tsx`.
- **lucide-react** — all icons (no emoji in the UI).
- **idb-keyval** — IndexedDB wrapper (models / projects / jobs / training).
- **vite-plugin-pwa** — `generateSW`, offline app-shell precache, Arabic
  RTL manifest, PNG icons generated from the SVG logo.
- **No state library** — a single React context (`src/stores/AppContext.tsx`)
  holds settings, Colab session, and cached collections.

## Module map

```
src/
  app/            App.tsx — routes + scroll reset
  main.tsx        entry: BrowserRouter + AppProvider
  styles/         index.css — Tailwind v4 theme, fonts, accents
  i18n/           translations.ts — typed ar/en dictionaries
  types/          domain types (models, projects, jobs, sessions)
  stores/         AppContext.tsx — settings, colab, collections
  services/
    db.ts         IndexedDB stores + storage estimate + clear-all
    colab/        URL validation, session persistence, honest probing
    applio/       Applio parameter constants + settings summary
    audio/        Web Audio decode: peaks, duration, clipping
    auth/         stub — v0.1 has no sign-in (deliberate, documented)
    drive/        stub — Drive is mounted inside the notebook only
  components/
    layout/       AppShell (sidebar / bottom nav), Logo
    common/       Button, Card, Badge, Notice, Field, Modal, EmptyState
    audio/        WaveformPlayer (canvas + <audio>)
    uploads/      AudioUploader (drag & drop + picker)
    models/       ModelCard
  pages/
    Dashboard/ Conversion/ Training/ Models/
    Projects/ History/ Colab/ Settings/ Help/
```

## Data model

| Store | Contents | Blobs? |
| --- | --- | --- |
| `models` | VoiceModel: name, `.pth`/`.index` metadata + blobs, notes, dates | yes |
| `projects` | AudioProject: name, notes, audio files | yes |
| `jobs` | ConversionJob: input + settings + status + optional output blob | yes |
| `training` | TrainingSession: dataset files, params, confirmed epochs | yes |
| localStorage | Colab session URL, app settings | no |

Nothing is seeded: empty states are real. Job/training statuses are
**user-confirmed records** (`waiting-colab` → `in-progress` → `completed` /
`failed` / `interrupted`), never inferred from a fake backend.

## Key decisions

1. **No iframe embedding of Applio.** Gradio share URLs are ephemeral and
   embedding is unreliable; the app opens them externally. See
   `docs/FEASIBILITY.md`.
2. **No fabricated APIs.** `services/applio/` holds only constants and
   formatting helpers matching Applio's real parameters. `auth` and `drive`
   are documented stubs, not fake clients.
3. **Honest session status.** `disconnected | linked | unverified | expired`.
   The probe can only prove the network answered (opaque `no-cors`
   response); the UI says exactly that.
4. **Capacitor-ready, not Capacitor-bound.** No native dependencies; the
   PWA structure (manifest, service worker, relative-safe routing) keeps a
   future Capacitor wrap straightforward.

## Adding a feature

- New page: add a route in `src/app/App.tsx`, a nav item in
  `AppShell.tsx`, and strings in `src/i18n/translations.ts` (both languages).
- New external integration: put it behind `src/services/<name>/` as an
  interface + adapter; never call an external API directly from a component.
- New persisted entity: add a store in `src/services/db.ts` and a refresh
  function in `AppContext.tsx`.
