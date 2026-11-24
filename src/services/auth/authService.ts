/**
 * Auth service — intentionally minimal in v0.1.
 *
 * abbasapplio v0.1 has NO sign-in of its own. This is a deliberate design
 * decision, not a missing feature:
 *
 * - Google sign-in inside this PWA would NOT grant access to a Colab
 *   session anyway: Colab authentication happens in Google's own Colab
 *   interface, in the user's browser, and must never be automated or
 *   proxied by this app.
 * - All app data (models, projects, jobs) is stored locally on the
 *   device in IndexedDB; there is no abbasapplio account or server.
 *
 * If a future version adds optional Google sign-in (e.g. to sync settings
 * across devices), it must use Google Identity Services with the narrowest
 * scopes, must never request or store passwords, and must never claim the
 * sign-in controls Colab. The interface below is the seam for that work.
 */

export interface AuthState {
  /** Always 'anonymous' in v0.1 — there is no account system. */
  kind: 'anonymous';
}

export function getAuthState(): AuthState {
  return { kind: 'anonymous' };
}
