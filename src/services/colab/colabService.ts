/**
 * Colab service — the integration boundary between abbasapplio and the
 * official Applio notebook running on Google Colab.
 *
 * What this service does:
 * - Validates a public URL the user pasted from THEIR OWN running notebook
 *   (Gradio share link, localtunnel or ngrok — the three methods the
 *   official notebook's "Start server" cell offers).
 * - Persists that URL in localStorage, on the device only. It is never
 *   sent to any abbasapplio server (there is none).
 * - Probes reachability honestly: a cross-origin fetch to a Gradio share
 *   URL is blocked by CORS, so an opaque response means "the network
 *   answered but the browser cannot verify the content". We report that
 *   as `unknown`, never as a confirmed live session.
 *
 * What this service NEVER does:
 * - Automate Google sign-in, scrape Colab, or read any session/cookie.
 * - Proxy traffic, or claim a session is connected without user input.
 * - Embed the Applio UI in an iframe (Gradio share URLs are ephemeral
 *   session URLs; embedding is unreliable and not a supported handoff).
 *   The app opens the URL in the user's own browser instead.
 */

import type { ColabMethod, ColabSession, ColabStatus } from '../../types';

export const COLAB_NOTEBOOK_URL =
  'https://colab.research.google.com/github/iahispano/applio/blob/main/assets/Applio.ipynb';
export const APPLIO_REPO_URL = 'https://github.com/IAHispano/Applio';
export const APPLIO_DOCS_URL = 'https://docs.applio.org';
export const APPLIO_TERMS_URL = 'https://github.com/IAHispano/Applio/blob/main/TERMS_OF_USE.md';

const STORAGE_KEY = 'abbasapplio:colab-session:v1';

/** Colab free runtimes disconnect after ~12h and may idle-timeout sooner. */
export const SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000;

export interface UrlValidation {
  ok: boolean;
  method: ColabMethod | null;
  normalizedUrl: string | null;
  error: 'empty' | 'not-url' | 'not-https' | 'unknown-host' | null;
}

export function validateSessionUrl(raw: string): UrlValidation {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, method: null, normalizedUrl: null, error: 'empty' };
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, method: null, normalizedUrl: null, error: 'not-url' };
  }
  if (parsed.protocol !== 'https:') {
    return { ok: false, method: null, normalizedUrl: null, error: 'not-https' };
  }
  const host = parsed.hostname.toLowerCase();
  let method: ColabMethod | null = null;
  if (host.endsWith('.gradio.live')) method = 'gradio';
  else if (host.endsWith('.loca.lt')) method = 'localtunnel';
  else if (host.endsWith('.ngrok-free.app') || host.endsWith('.ngrok.io')) method = 'ngrok';
  if (!method) return { ok: false, method: null, normalizedUrl: null, error: 'unknown-host' };
  // Strip query/fragment — the share URL is the host itself.
  const normalized = `https://${host}${parsed.pathname.replace(/\/+$/, '') || ''}`;
  return { ok: true, method, normalizedUrl: normalized, error: null };
}

export function deriveStatus(session: ColabSession | null): ColabStatus {
  if (!session) return 'disconnected';
  if (Date.now() - new Date(session.linkedAt).getTime() > SESSION_MAX_AGE_MS) return 'expired';
  if (session.lastProbe === 'unreachable') return 'expired';
  if (session.lastProbe === 'reachable') return 'linked';
  return 'unverified';
}

export function loadSession(): ColabSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ColabSession;
    if (!parsed || typeof parsed.url !== 'string') return null;
    return { ...parsed, status: deriveStatus(parsed) };
  } catch {
    return null;
  }
}

export function saveSession(session: ColabSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function createSession(url: string, method: ColabMethod): ColabSession {
  const session: ColabSession = {
    url,
    method,
    linkedAt: new Date().toISOString(),
    lastCheckedAt: null,
    lastProbe: null,
    status: 'unverified',
  };
  saveSession(session);
  return session;
}

/**
 * Honest reachability probe. A Gradio share URL does not send CORS headers
 * for arbitrary origins, so `fetch` in `no-cors` mode is the only probe a
 * browser page can make: it resolves to an opaque response when the network
 * answers, and rejects when the host is gone. An opaque response proves
 * the host answered — it does NOT prove the Applio UI is up or that the
 * session belongs to the user. Callers must surface that nuance.
 */
export async function probeSession(
  session: ColabSession,
  timeoutMs = 8000,
): Promise<ColabSession> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let probe: ColabSession['lastProbe'] = 'unknown';
  try {
    await fetch(session.url, { mode: 'no-cors', signal: controller.signal, cache: 'no-store' });
    // Opaque response: host answered, content unverifiable (CORS).
    probe = 'reachable';
  } catch {
    probe = 'unreachable';
  } finally {
    clearTimeout(timer);
  }
  const updated: ColabSession = {
    ...session,
    lastCheckedAt: new Date().toISOString(),
    lastProbe: probe,
    status: deriveStatus({ ...session, lastProbe: probe }),
  };
  saveSession(updated);
  return updated;
}
