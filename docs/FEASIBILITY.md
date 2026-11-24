# Technical Feasibility — abbasapplio × Applio × Google Colab

Date: 2026-11-24 · Sources inspected: `IAHispano/Applio` repo (`README.md`, `app.py`,
`assets/Applio.ipynb` — 7 cells, fetched from GitHub raw).

## What the official notebook actually does

| Cell | What it runs |
| --- | --- |
| Mount Drive | `google.colab.drive.mount("/content/drive")` — Google's own auth flow |
| Setup runtime | Clones `github.com/IAHispano/Applio`, creates a Python 3.12 venv with `uv`, installs requirements (PyTorch cu128), downloads models via `core.py prerequisites --models --pretraineds-hifigan`, installs `ngrok`, `localtunnel` |
| Sync with Google Drive | Optional ipywidgets UI that links `logs/` to `ApplioBackup` in Drive |
| Start server | `python app.py --listen --share --client` (Gradio, default) — or `localtunnel` / `ngrok` forwarding port **6969** |

`app.py` confirms: default port `6969`, `--share` creates a public Gradio link
(`https://<id>.gradio.live`), `--listen` binds `0.0.0.0`.

## What CAN be integrated

- **Guided handoff to the official notebook.** Open the notebook in the user's
  browser, walk them through the cells, and let them run Applio themselves.
  Fully supported by Google and Applio.
- **User-pasted Gradio share URL.** After the notebook prints
  `Running on public URL`, the user copies the `*.gradio.live` link into
  abbasapplio. The app stores it locally (localStorage) and opens it in the
  user's browser. No credentials, no automation, no proxy.
- **Local job/model/project management.** IndexedDB stores models (`.pth` /
  `.index`), audio, conversion settings and job records on the device. Real
  audio analysis (duration, sample rate, clipping) runs locally via Web Audio.
- **PWA shell + offline.** The app shell and local data work offline; only
  conversion/training need a live Colab session.

## What CANNOT (or must not) be integrated

- **Direct control of Colab.** There is no supported API for a web app to
  start cells, read notebook output, or manage a Colab runtime. Google sign-in
  in the PWA grants nothing over Colab. Automating Google login or scraping
  session state is forbidden — by policy and by this project's rules.
- **Embedding the Gradio UI in an iframe.** Gradio share URLs are ephemeral
  per-session URLs; embedding them is unreliable (framing restrictions vary
  by Gradio version and browser) and no live session existed to verify against.
  **Decision: external-browser handoff only.** The app never iframes Applio.
- **Calling Applio's Gradio API from the app.** Technically a Gradio app
  exposes HTTP endpoints, but a share URL's session is the user's own runtime;
  driving it headlessly from a third-party page is fragile (CORS, session
  cookies, queue semantics) and would silently break. v0.1 does not do it.
  The adapter seam (`src/services/applio/`) exists if a supported approach
  emerges later.
- **Guaranteed free GPU.** Colab free tier is quota-managed by Google: GPUs
  may be unavailable, runtimes idle-timeout, and sessions end (typically
  within ~12h). The app must — and does — say this honestly.
- **Background processing.** A PWA cannot keep a Colab session alive or run
  conversion while closed. Jobs are user-confirmed records, never simulated.

## Chosen approach (v0.1)

1. Guided Colab page: open official notebook → run cells → mount Drive →
   start server → paste the public Gradio URL.
2. Session status derived only from user-confirmed state plus an honest
   reachability probe (`fetch` with `no-cors`): an opaque response means
   "the network answered, content unverifiable due to CORS" — reported as
   *unverified*, never as a confirmed live session.
3. Conversion/training forms prepare real job records with Applio's actual
   parameter names/ranges; the user runs them in the Applio UI and attaches
   the real output file afterwards. Nothing is faked.
