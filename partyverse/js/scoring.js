/**
 * scoring.js — Centralised score engine
 *
 * Tracks individual and team scores.
 * Prevents duplicate awards.
 * Supports undo of last committed round.
 */

import { storage } from './storage.js';

// Default point values
export const POINTS = {
  WIN:    10,
  SECOND:  5,
  THIRD:   2,
  CORRECT: 3,  // per correct answer (game-specific)
  LOSS:    0,
};

export const scoring = {
  /** Initialise scores for a list of player/team IDs */
  init(ids) {
    const scores = {};
    ids.forEach(id => {
      scores[id] = { points: 0, wins: 0, rounds: 0 };
    });
    storage.saveScores(scores);
    return scores;
  },

  getScores() {
    return storage.getScores();
  },

  /**
   * Commit results for a completed round.
   * results: [ { id, points, isWin } ]
   * Idempotency: roundId prevents double-awarding.
   */
  commitRound(roundId, results) {
    const scores = storage.getScores();
    const tournament = storage.getTournament();

    // Check if this round already committed
    const round = tournament.rounds.find(r => r.id === roundId);
    if (round?.committed) {
      console.warn('[scoring] Round already committed:', roundId);
      return scores;
    }

    results.forEach(({ id, points, isWin }) => {
      if (!scores[id]) scores[id] = { points: 0, wins: 0, rounds: 0 };
      scores[id].points += points || 0;
      scores[id].rounds += 1;
      if (isWin) scores[id].wins += 1;
    });

    // Mark round as committed
    if (round) round.committed = true;
    storage.saveTournament(tournament);
    storage.saveScores(scores);
    return scores;
  },

  /**
   * Undo the last committed round (score correction).
   * results must match what was originally committed.
   */
  undoRound(roundId, results) {
    const scores = storage.getScores();
    const tournament = storage.getTournament();

    const round = tournament.rounds.find(r => r.id === roundId);
    if (!round?.committed) {
      console.warn('[scoring] Cannot undo — round not committed:', roundId);
      return scores;
    }

    results.forEach(({ id, points, isWin }) => {
      if (!scores[id]) return;
      scores[id].points = Math.max(0, scores[id].points - (points || 0));
      scores[id].rounds = Math.max(0, scores[id].rounds - 1);
      if (isWin) scores[id].wins = Math.max(0, scores[id].wins - 1);
    });

    round.committed = false;
    storage.saveTournament(tournament);
    storage.saveScores(scores);
    return scores;
  },

  /**
   * Returns sorted leaderboard array:
   * [ { id, points, wins, rounds, rank } ]
   * Tie-break: wins > id (alphabetic)
   */
  leaderboard() {
    const scores = storage.getScores();
    const sorted = Object.entries(scores)
      .map(([id, s]) => ({ id, ...s }))
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.wins   !== a.wins)   return b.wins   - a.wins;
        return a.id.localeCompare(b.id);
      });

    let rank = 1;
    sorted.forEach((entry, i) => {
      if (i > 0 && entry.points === sorted[i - 1].points && entry.wins === sorted[i - 1].wins) {
        entry.rank = sorted[i - 1].rank; // tie
      } else {
        entry.rank = rank;
      }
      rank++;
    });

    return sorted;
  },

  /** Award points by position (1st, 2nd, 3rd) */
  pointsForPosition(position) {
    switch (position) {
      case 1: return POINTS.WIN;
      case 2: return POINTS.SECOND;
      case 3: return POINTS.THIRD;
      default: return POINTS.LOSS;
    }
  },
};

