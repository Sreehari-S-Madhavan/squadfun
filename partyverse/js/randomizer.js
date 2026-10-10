/**
 * randomizer.js — Tournament round generator
 *
 * Selects eligible games, avoids repeats and consecutive same-category rounds,
 * produces a stable sequence (stored in tournament state).
 */

import { GAME_REGISTRY } from './games/registry.js';

// Approx minutes per round (used for duration estimation)
const ROUND_MINUTES = {
  short:    2,
  medium:   3,
  long:     5,
};

const TRANSITION_MINUTES = 0.5; // between rounds

export const randomizer = {
  /**
   * Generate a tournament round sequence.
   *
   * @param {object} config
   * @param {number}   config.duration   — target duration in minutes
   * @param {string}   config.mode       — 'solo' | 'team'
   * @param {number}   config.playerCount
   * @param {string[]} config.categories — enabled category IDs or ['all']
   * @param {string}   config.randomMode — 'balanced' | 'chaos' | 'skill'
   * @returns {Array}  array of round objects
   */
  generate({ duration, mode, playerCount, categories, randomMode }) {
    const eligible = this._getEligible(mode, playerCount, categories);

    if (eligible.length === 0) {
      return [];
    }

    // Estimate rounds that fit in duration
    const targetRounds = this._targetRoundCount(duration);

    const sequence = [];
    const usedIds  = new Set();
    let lastCategory = null;

    for (let i = 0; i < targetRounds; i++) {
      let pool = eligible.filter(g => !usedIds.has(g.id));

      // If pool exhausted, allow repeats (reset)
      if (pool.length === 0) {
        usedIds.clear();
        pool = [...eligible];
      }

      // Avoid same category as last round (when pool allows)
      let filteredPool = pool.filter(g => g.category !== lastCategory);
      if (filteredPool.length === 0) filteredPool = pool;

      // Apply randomMode bias
      const game = this._pickGame(filteredPool, randomMode);
      if (!game) break;

      sequence.push(this._makeRound(game, i));
      usedIds.add(game.id);
      lastCategory = game.category;
    }

    return sequence;
  },

  /**
   * Reroll a single round in the sequence.
   * Preserves completed rounds. Does not touch them.
   */
  reroll(sequence, roundIndex, { mode, playerCount, categories, randomMode }) {
    const eligible = this._getEligible(mode, playerCount, categories);
    const usedIds  = new Set(
      sequence.filter((r, i) => i !== roundIndex).map(r => r.gameId)
    );

    let pool = eligible.filter(g => !usedIds.has(g.id));
    if (pool.length === 0) pool = eligible;

    const prevCat = roundIndex > 0 ? sequence[roundIndex - 1]?.category : null;
    const nextCat = roundIndex < sequence.length - 1 ? sequence[roundIndex + 1]?.category : null;
    let filtered = pool.filter(g => g.category !== prevCat && g.category !== nextCat);
    if (filtered.length === 0) filtered = pool;

    const game = this._pickGame(filtered, randomMode);
    if (!game) return sequence;

    const newSeq = [...sequence];
    newSeq[roundIndex] = this._makeRound(game, roundIndex);
    return newSeq;
  },

  /** Estimate total duration for a sequence */
  estimateDuration(sequence) {
    let mins = 0;
    sequence.forEach(r => {
      const game = GAME_REGISTRY.find(g => g.id === r.gameId);
      if (!game) return;
      mins += ROUND_MINUTES[game.roundLength || 'medium'] + TRANSITION_MINUTES;
    });
    return Math.round(mins);
  },

  // ── Private ─────────────────────────────────────────────────
  _getEligible(mode, playerCount, categories) {
    return GAME_REGISTRY.filter(g => {
      if (!g.implemented) return false;
      if (g.minPlayers && playerCount < g.minPlayers) return false;
      if (g.maxPlayers && playerCount > g.maxPlayers) return false;
      if (mode === 'solo' && g.teamOnly) return false;
      if (mode === 'team' && g.soloOnly) return false;
      if (!categories.includes('all') && !categories.includes(g.category)) return false;
      return true;
    });
  },

  _targetRoundCount(durationMinutes) {
    // 15 min → ~6 rounds, 30 → ~10, 45 → ~14
    if (durationMinutes <= 15) return 6;
    if (durationMinutes <= 30) return 10;
    return 14;
  },

  _pickGame(pool, mode) {
    if (pool.length === 0) return null;
    if (mode === 'chaos') {
      return pool[Math.floor(Math.random() * pool.length)];
    }
    if (mode === 'skill') {
      // Weight towards games tagged 'skill'
      const skilled = pool.filter(g => g.tags?.includes('skill'));
      if (skilled.length > 0 && Math.random() < 0.7) {
        return skilled[Math.floor(Math.random() * skilled.length)];
      }
    }
    // Balanced: pure random from pool
    return pool[Math.floor(Math.random() * pool.length)];
  },

  _makeRound(game, index) {
    return {
      id:        `round_${index}_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
      gameId:    game.id,
      category:  game.category,
      status:    'pending',   // pending | active | complete | skipped
      result:    null,
      committed: false,
    };
  },
};

