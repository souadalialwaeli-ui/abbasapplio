# Colab Integration — abbasapplio

## The workflow (as the user experiences it)

1. **Open the official notebook** from the Colab page:
   `https://colab.research.google.com/github/iahispano/applio/blob/main/assets/Applio.ipynb`
2. **Run "Mount Drive"** — Google asks for Drive permission inside Colab.
3. **Run "Setup runtime environment"** — clones Applio, installs
   dependencies, downloads models (a few minutes on first run).
4. **(Optional) Run "Sync with Google Drive"** — links `logs/` to the
   `ApplioBackup` folder so trained models survive session restarts.
5. **Run "Start server"** (Gradio method, the default). When the cell prints
   `Running on public URL: https://<id>.gradio.live`, copy that URL.
6. **Paste the URL in abbasapplio** (Colab page → "Link session"). It is
   validated (`https`, host `*.gradio.live` / `*.loca.lt` /
   `*.ngrok-free.app` / `*.ngrok.io`) and stored in `localStorage` only.
7. **Open Applio** from abbasapplio — the Gradio UI opens in the user's
   browser, where conversion and training actually run.

## Implementation

`src/services/colab/colabService.ts`:

- `validateSessionUrl()` — format + host validation, normalizes the URL.
- `createSession()` / `loadSession()` / `clearSession()` — localStorage
  persistence (`abbasapplio:colab-session:v1`).
- `deriveStatus()` — `disconnected | linked | unverified | expired`.
  Sessions older than 12h are treated as expired (Colab free runtimes end
  around then; the UI warns from 9h).
- `probeSession()` — `fetch(url, { mode: 'no-cors' })` with an 8s timeout.
  Gradio share URLs don't send CORS headers, so the browser can only tell
  whether the network answered. The result is reported as:
  - `reachable` → "the network answers, but the browser cannot verify the
    session content (CORS). Open Applio to confirm."
  - `unreachable` → the session has most likely expired.
  - `unknown` → the check itself was blocked.

## What is NOT done (and why)

- **No iframe embedding** of the Gradio UI — ephemeral session URLs,
  unreliable framing, no live session to verify against.
- **No automation of Google login / Colab cells** — unsupported and
  against policy; all interaction happens in the user's own browser.
- **No proxying of Gradio traffic** — the app never sees session content.
- **No Drive API integration in v0.1** — Drive is mounted inside the
  notebook; see `src/services/drive/driveService.ts`.
- **No background keep-alive** — a PWA cannot keep a Colab runtime alive.

## Failure modes the UI covers

| Situation | What the user sees |
| --- | --- |
| No session linked | "Disconnected" + guided steps |
| Session older than ~12h | "Expired" + re-link instructions |
| Probe fails (host gone) | "Unreachable — session most likely expired" |
| Probe inconclusive (CORS) | "Unverified" + open Applio to confirm |
| Runtime disconnects mid-job | Job stays `in-progress` until the user marks it; troubleshooting steps on the Colab page |

## Notebook reference (verified 2026-11-24)

- 7 cells; server cell offers `gradio` (default), `localtunnel`, `ngrok`.
- Gradio launch: `python app.py --listen --share --client`, port `6969`.
- `app.py`: `DEFAULT_PORT = 6969`, `--share` creates the public link.
