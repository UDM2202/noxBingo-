/**
 * The seat this browser holds in a game, so a dropped connection or a
 * page reload can take it back (the server sends `session` after a room
 * is created or joined, and accepts `resume` with the same token).
 *
 * Stored in this browser only. Treated as missing after 2 hours.
 */

export type GameMode = 'solo' | 'create' | 'join';

export type StoredSession = {
  roomCode: string;
  playerId: string;
  resumeToken: string;
  savedAt: number;
  // Not sent by the server; recorded here so the lobby can reopen the
  // game with the right URL, and so a failed resume can say why.
  mode?: GameMode;
  playerName?: string;
  maxPlayers?: number;
  started?: boolean;
  finished?: boolean;
};

const SESSION_KEY = 'noxbingo-session';
const MAX_AGE_MS = 2 * 60 * 60 * 1000;

export function loadSession(): StoredSession | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    if (
      !parsed ||
      typeof parsed.roomCode !== 'string' ||
      typeof parsed.playerId !== 'string' ||
      typeof parsed.resumeToken !== 'string' ||
      typeof parsed.savedAt !== 'number'
    ) {
      return null;
    }
    if (Date.now() - parsed.savedAt > MAX_AGE_MS) {
      clearSession();
      return null;
    }
    return parsed as StoredSession;
  } catch {
    return null;
  }
}

export function saveSession(session: StoredSession) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // Storage blocked (private mode etc.). Reconnecting within this page
    // still works; only a reload can't resume.
  }
}

/** Updates the stored session, but only if it is still for this room. */
export function updateSession(roomCode: string, patch: Partial<StoredSession>) {
  const current = loadSession();
  if (current && current.roomCode === roomCode) saveSession({ ...current, ...patch });
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // Nothing to clear.
  }
}

const SAVED_RESULTS_KEY = 'noxbingo-saved-results';
const MAX_SAVED_RESULTS = 50;

/**
 * Records that this room's result has been handled in this browser.
 * Returns false if it already was, so replayed `game_over` messages
 * after a resume don't award anything twice.
 */
export function markResultSaved(roomCode: string): boolean {
  let saved: string[] = [];
  try {
    const parsed = JSON.parse(localStorage.getItem(SAVED_RESULTS_KEY) || '[]');
    if (Array.isArray(parsed)) saved = parsed.filter((c): c is string => typeof c === 'string');
  } catch {
    saved = [];
  }
  if (saved.includes(roomCode)) return false;
  saved.push(roomCode);
  try {
    localStorage.setItem(SAVED_RESULTS_KEY, JSON.stringify(saved.slice(-MAX_SAVED_RESULTS)));
  } catch {
    // Storage blocked: the result still counts once for this page.
  }
  return true;
}
