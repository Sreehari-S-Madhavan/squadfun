/**
 * storage.js — LocalStorage wrapper with versioned schema
 *
 * All data is stored under prefixed keys.
 * The schema version guards against stale serialized state.
 */

const SCHEMA_VERSION = 1;
const PREFIX = 'pv_';

const KEYS = {
  version:     PREFIX + 'schema_version',
  settings:    PREFIX + 'settings',
  tournament:  PREFIX + 'tournament',
  players:     PREFIX + 'players',
  scores:      PREFIX + 'scores',
  rounds:      PREFIX + 'rounds',
  activeRound: PREFIX + 'active_round',
};

/** Default settings */
const DEFAULT_SETTINGS = {
  sound: false,
  reducedMotion: false,
  theme: 'dark',
};

/** Default tournament state */
function defaultTournament() {
  return {
    id: null,
    status: 'idle',   // idle | setup | preview | active | paused | complete
    mode: 'solo',     // solo | team
    duration: 15,     // minutes
    randomMode: 'balanced', // balanced | chaos | skill
    categories: ['all'],
    createdAt: null,
    startedAt: null,
    pausedAt: null,
    totalElapsed: 0,  // ms elapsed before last pause
    currentRoundIndex: 0,
    rounds: [],       // array of { gameId, status, result }
  };
}

// ── Private helpers ───────────────────────────────────────────
function get(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function set(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn('[storage] Write failed:', key, e);
    return false;
  }
}

function remove(key) {
  try {
    localStorage.removeItem(key);
  } catch { /* ignore */ }
}

// ── Public API ────────────────────────────────────────────────
export const storage = {
  /** Called once on boot. Migrates schema if needed. */
  async init() {
    const ver = get(KEYS.version);
    if (!ver || ver < SCHEMA_VERSION) {
      // Future: migrate old data here
      set(KEYS.version, SCHEMA_VERSION);
    }
  },

  // ── Settings ────────────────────────────────────────────────
  getSettings() {
    return { ...DEFAULT_SETTINGS, ...(get(KEYS.settings) || {}) };
  },
  saveSettings(settings) {
    return set(KEYS.settings, { ...this.getSettings(), ...settings });
  },

  // ── Players ─────────────────────────────────────────────────
  getPlayers() {
    return get(KEYS.players) || [];
  },
  savePlayers(players) {
    return set(KEYS.players, players);
  },

  // ── Tournament ──────────────────────────────────────────────
  getTournament() {
    return get(KEYS.tournament) || defaultTournament();
  },
  saveTournament(t) {
    return set(KEYS.tournament, t);
  },
  clearTournament() {
    remove(KEYS.tournament);
    remove(KEYS.scores);
    remove(KEYS.rounds);
    remove(KEYS.activeRound);
  },

  // ── Scores ──────────────────────────────────────────────────
  getScores() {
    return get(KEYS.scores) || {};
  },
  saveScores(scores) {
    return set(KEYS.scores, scores);
  },

  // ── Active Round ─────────────────────────────────────────────
  getActiveRound() {
    return get(KEYS.activeRound) || null;
  },
  saveActiveRound(roundState) {
    return set(KEYS.activeRound, roundState);
  },
  clearActiveRound() {
    remove(KEYS.activeRound);
  },

  // ── Full Reset ───────────────────────────────────────────────
  resetAll() {
    Object.values(KEYS).forEach(k => {
      if (k !== KEYS.version) remove(k);
    });
  },

  /** Reset only tournament data, keep settings and player names */
  resetTournament() {
    remove(KEYS.tournament);
    remove(KEYS.scores);
    remove(KEYS.rounds);
    remove(KEYS.activeRound);
  },

  /** Export all data for debugging */
  export() {
    const out = {};
    Object.entries(KEYS).forEach(([name, key]) => {
      out[name] = get(key);
    });
    return out;
  },
};

