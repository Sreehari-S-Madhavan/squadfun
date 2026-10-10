/**
 * tournament.js — Tournament state machine
 *
 * Manages the full lifecycle:
 *   idle → setup → preview → active → paused → complete
 *
 * All mutations are persisted to localStorage immediately.
 */

import { storage } from './storage.js';
import { randomizer } from './randomizer.js';
import { scoring } from './scoring.js';

export const tournament = {
  /** Return current tournament state */
  get() {
    return storage.getTournament();
  },

  /** Create a brand-new tournament (discards any previous state) */
  create(config) {
    storage.resetTournament();

    const players = storage.getPlayers();
    const playerIds = players.map(p => p.id);

    // Generate round sequence
    const rounds = randomizer.generate({
      duration:     config.duration,
      mode:         config.mode,
      playerCount:  players.length,
      categories:   config.categories,
      randomMode:   config.randomMode,
    });

    const t = {
      id:                  `t_${Date.now()}`,
      status:              'preview',
      mode:                config.mode,
      duration:            config.duration,
      randomMode:          config.randomMode,
      categories:          config.categories,
      createdAt:           Date.now(),
      startedAt:           null,
      pausedAt:            null,
      totalElapsed:        0,
      currentRoundIndex:   0,
      rounds,
      playerIds,
      teamAssignments:     config.teamAssignments || {},
    };

    storage.saveTournament(t);

    // Initialise scores
    const scoreIds = config.mode === 'team'
      ? Object.keys(config.teamAssignments || {})
      : playerIds;
    scoring.init(scoreIds);

    return t;
  },

  /** Mark tournament as started */
  start() {
    const t = storage.getTournament();
    t.status    = 'active';
    t.startedAt = Date.now();
    storage.saveTournament(t);
    return t;
  },

  /** Pause the tournament */
  pause() {
    const t = storage.getTournament();
    if (t.status !== 'active') return t;
    t.status   = 'paused';
    t.pausedAt = Date.now();
    t.totalElapsed += Date.now() - (t.startedAt || Date.now());
    storage.saveTournament(t);
    return t;
  },

  /** Resume a paused tournament */
  resume() {
    const t = storage.getTournament();
    if (t.status !== 'paused') return t;
    t.status    = 'active';
    t.startedAt = Date.now();
    t.pausedAt  = null;
    storage.saveTournament(t);
    return t;
  },

  /** Mark current round as active */
  startRound() {
    const t = storage.getTournament();
    const round = t.rounds[t.currentRoundIndex];
    if (round) round.status = 'active';
    storage.saveTournament(t);
    return round;
  },

  /** Complete a round with results */
  completeRound(results) {
    const t = storage.getTournament();
    const round = t.rounds[t.currentRoundIndex];
    if (!round) return t;

    round.status = 'complete';
    round.result = results;
    storage.saveTournament(t);
    return { t, round };
  },

  /** Skip the current round */
  skipRound() {
    const t = storage.getTournament();
    const round = t.rounds[t.currentRoundIndex];
    if (round) round.status = 'skipped';
    storage.saveTournament(t);
    return round;
  },

  /** Advance to next round. Returns false if tournament is complete. */
  nextRound() {
    const t = storage.getTournament();
    t.currentRoundIndex++;

    if (t.currentRoundIndex >= t.rounds.length) {
      t.status = 'complete';
      storage.saveTournament(t);
      return false;
    }

    storage.saveTournament(t);
    return true;
  },

  /** Reroll the current or next pending round */
  reroll(roundIndex) {
    const t = storage.getTournament();
    const players = storage.getPlayers();

    const round = t.rounds[roundIndex];
    if (!round || round.status !== 'pending') return t;

    const newSequence = randomizer.reroll(t.rounds, roundIndex, {
      mode:        t.mode,
      playerCount: players.length,
      categories:  t.categories,
      randomMode:  t.randomMode,
    });

    t.rounds = newSequence;
    storage.saveTournament(t);
    return t;
  },

  /** Check if there's a recoverable tournament in progress */
  hasActive() {
    const t = storage.getTournament();
    return t && t.id && ['active', 'paused', 'preview'].includes(t.status);
  },

  /** Mark complete */
  complete() {
    const t = storage.getTournament();
    t.status = 'complete';
    storage.saveTournament(t);
    return t;
  },
};

