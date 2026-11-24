# Development — abbasapplio

## Requirements

- Node.js 20+ (developed on Node 24) and npm 10+.

## Setup

```bash
git clone <repo-url> abbasapplio
cd abbasapplio
cp .env.example .env.local   # optional; v0.1 needs no keys
npm install
npm run dev                  # http://localhost:5173
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | `tsc -b` (strict) + production build + PWA service worker |
| `npm run typecheck` | `tsc -b --noEmit` |
| `npm run preview` | Serve the production build locally |

## Conventions

- **TypeScript strict** — `noUnusedLocals` / `noUnusedParameters` are on;
  keep imports clean.
- **Arabic first.** Every user-facing string goes through
  `src/i18n/translations.ts` with both `ar` and `en` values. Use
  `useApp().t(key)` in components. Never hardcode Arabic/English strings
  in JSX.
- **RTL.** Layout uses logical Tailwind utilities (`ms-`, `me-`, `ps-`,
  `pe-`, `start-`, `end-`). URLs, file names and numbers render with
  `dir="ltr"` where needed.
- **No fake data.** Never seed models, jobs or history. Empty states are
  part of the design.
- **No fake integrations.** If a feature needs a backend that doesn't
  exist, disable it with an honest explanation instead of simulating it.
- **Icons:** Lucide only, no emoji in the UI.
- **Mobile first:** design at 360px, then scale up. Bottom nav on mobile,
  sidebar on `lg`+.

## Testing

- `npm run build` — typecheck + bundle + PWA generation (the main gate).
- `npm run preview` + `curl` — smoke-check `/`, `/manifest.webmanifest`,
  `/sw.js`, icons (see delivery notes).
- Manual mobile test: open the preview URL on a phone (same Wi-Fi, use
  `vite --host`), install as PWA, walk the Colab flow in
  `README.md` → "Testing the Colab workflow".
- No unit-test runner is configured in v0.1 (kept intentionally lean);
  the honest next step is adding Vitest for `colabService` URL validation
  and `audioAnalysis` helpers.

## PWA icons

`public/icons/*.png` are generated from the waveform logo with a small
PIL script (see delivery notes). To regenerate after a logo change, redraw
`src/components/layout/Logo.tsx` and re-run an equivalent script, or drop
in 192/512 PNG exports.

## Capacitor (future Android packaging)

The app is structured to be wrapped later: no native dependencies, no
absolute URLs, service worker + manifest already in place. Wrapping
requires adding `@capacitor/core` + `@capacitor/cli`, `npx cap init`, and
`npx cap add android` — deliberately out of scope for v0.1.

## PWA icons

`public/icons/*.png` are binary files generated locally from
`scripts/generate-icons.py` (Pillow). After a fresh clone, run:

```bash
npm run icons
```

before `npm run build` if the PNG files are missing, so the PWA manifest
references resolve.
