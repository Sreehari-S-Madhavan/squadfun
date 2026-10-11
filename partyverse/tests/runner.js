/**
 * tests/runner.js — Automated test suite for PartyVerse core logic
 * Run with: node tests/runner.js
 */

import assert from 'node:assert';

// ── In-memory mock for localStorage & DOM ────────────────────
const mockStorage = new Map();
globalThis.localStorage = {
  getItem: (key) => mockStorage.get(key) ?? null,
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
};

globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 16);
globalThis.cancelAnimationFrame = (id) => clearTimeout(id);

// ── Import modules under test ────────────────────────────────
import { storage } from '../js/storage.js';
import { scoring, POINTS } from '../js/scoring.js';
import { randomizer } from '../js/randomizer.js';
import { Timer } from '../js/timer.js';
import { GAME_REGISTRY, getGame } from '../js/games/registry.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(err);
    failed++;
  }
}

async function runTests() {
  console.log('\n=== RUNNING PARTYVERSE AUTOMATED TESTS ===\n');

  // 1. GAME REGISTRY
  console.log('--- Game Registry Tests ---');
  test('Registry contains 24 planned games', () => {
    assert.strictEqual(GAME_REGISTRY.length, 24);
  });

  test('Exactly 8 priority games are marked as implemented', () => {
    const implemented = GAME_REGISTRY.filter(g => g.implemented);
    assert.strictEqual(implemented.length, 8);
    const expectedIds = [
      'charades', 'imposter', 'word-bomb', 'snakes-ladders',
      'memory-match', 'reaction-test', 'quick-quiz', 'rock-paper-scissors'
    ];
    for (const id of expectedIds) {
      assert.ok(implemented.some(g => g.id === id), `Game ${id} should be implemented`);
    }
  });

  test('Lookup by ID returns correct game metadata', () => {
    const g = getGame('charades');
    assert.ok(g);
    assert.strictEqual(g.title, 'Charades');
    assert.strictEqual(g.category, 'creative');
  });

  // 2. RANDOMIZER & TOURNAMENT GENERATION
  console.log('\n--- Randomizer Tests ---');
  test('Generates expected round count based on duration', () => {
    const seq15 = randomizer.generate({
      duration: 15, mode: 'solo', playerCount: 4, categories: ['all'], randomMode: 'balanced'
    });
    assert.strictEqual(seq15.length, 6);

    const seq30 = randomizer.generate({
      duration: 30, mode: 'solo', playerCount: 4, categories: ['all'], randomMode: 'balanced'
    });
    assert.strictEqual(seq30.length, 10);

    const seq45 = randomizer.generate({
      duration: 45, mode: 'solo', playerCount: 4, categories: ['all'], randomMode: 'balanced'
    });
    assert.strictEqual(seq45.length, 14);
  });

  test('Only implemented games are included in sequence', () => {
    const seq = randomizer.generate({
      duration: 30, mode: 'solo', playerCount: 4, categories: ['all'], randomMode: 'balanced'
    });
    for (const round of seq) {
      const g = getGame(round.gameId);
      assert.ok(g.implemented, `Round game ${round.gameId} must be implemented`);
    }
  });

  test('Player count filter is respected', () => {
    // 2 players: Imposter requires min 3 players, so should never be in sequence
    for (let i = 0; i < 5; i++) {
      const seq = randomizer.generate({
        duration: 15, mode: 'solo', playerCount: 2, categories: ['all'], randomMode: 'chaos'
      });
      assert.ok(!seq.some(r => r.gameId === 'imposter'), 'Imposter should not appear for 2 players');
    }
  });

  test('Category filter is respected', () => {
    const seq = randomizer.generate({
      duration: 15, mode: 'solo', playerCount: 4, categories: ['word'], randomMode: 'balanced'
    });
    for (const r of seq) {
      assert.strictEqual(r.category, 'word');
    }
  });

  test('Reroll replaces round with eligible game and preserves others', () => {
    const seq = randomizer.generate({
      duration: 15, mode: 'solo', playerCount: 4, categories: ['all'], randomMode: 'balanced'
    });
    const originalRound0 = { ...seq[0] };
    const originalRound1 = { ...seq[1] };

    const rerolled = randomizer.reroll(seq, 0, {
      mode: 'solo', playerCount: 4, categories: ['all'], randomMode: 'balanced'
    });

    assert.strictEqual(rerolled[1].id, originalRound1.id);
    assert.strictEqual(rerolled[1].gameId, originalRound1.gameId);
    assert.notStrictEqual(rerolled[0].id, originalRound0.id);
  });

  // 3. SCORING ENGINE
  console.log('\n--- Scoring Engine Tests ---');
  test('Initialises player scores at 0', () => {
    mockStorage.clear();
    const scores = scoring.init(['p1', 'p2', 'p3']);
    assert.strictEqual(scores.p1.points, 0);
    assert.strictEqual(scores.p1.wins, 0);
    assert.strictEqual(scores.p1.rounds, 0);
  });

  test('Commits round points and wins correctly', () => {
    mockStorage.clear();
    storage.saveTournament({
      id: 't_test',
      rounds: [{ id: 'r_1', committed: false }]
    });
    scoring.init(['p1', 'p2']);

    scoring.commitRound('r_1', [
      { id: 'p1', points: 10, isWin: true },
      { id: 'p2', points: 5, isWin: false }
    ]);

    const s = scoring.getScores();
    assert.strictEqual(s.p1.points, 10);
    assert.strictEqual(s.p1.wins, 1);
    assert.strictEqual(s.p1.rounds, 1);
    assert.strictEqual(s.p2.points, 5);
    assert.strictEqual(s.p2.wins, 0);
  });

  test('Idempotency: Committing the same roundId twice does NOT double points', () => {
    mockStorage.clear();
    storage.saveTournament({
      id: 't_test',
      rounds: [{ id: 'r_duplicate', committed: false }]
    });
    scoring.init(['p1']);

    scoring.commitRound('r_duplicate', [{ id: 'p1', points: 10, isWin: true }]);
    assert.strictEqual(scoring.getScores().p1.points, 10);

    // Second call with same roundId
    scoring.commitRound('r_duplicate', [{ id: 'p1', points: 10, isWin: true }]);
    assert.strictEqual(scoring.getScores().p1.points, 10, 'Points must remain 10, not 20');
  });

  test('Undo round reverses points and win count cleanly', () => {
    mockStorage.clear();
    storage.saveTournament({
      id: 't_test',
      rounds: [{ id: 'r_undo', committed: false }]
    });
    scoring.init(['p1']);

    scoring.commitRound('r_undo', [{ id: 'p1', points: 10, isWin: true }]);
    assert.strictEqual(scoring.getScores().p1.points, 10);

    scoring.undoRound('r_undo', [{ id: 'p1', points: 10, isWin: true }]);
    assert.strictEqual(scoring.getScores().p1.points, 0);
    assert.strictEqual(scoring.getScores().p1.wins, 0);
    assert.strictEqual(scoring.getScores().p1.rounds, 0);
  });

  test('Leaderboard ranks players and resolves ties using wins then alphabet', () => {
    mockStorage.clear();
    storage.saveScores({
      alex: { points: 20, wins: 2, rounds: 2 },
      blake: { points: 20, wins: 1, rounds: 2 },
      casey: { points: 30, wins: 3, rounds: 2 },
      dana: { points: 20, wins: 2, rounds: 2 },
    });

    const board = scoring.leaderboard();
    assert.strictEqual(board[0].id, 'casey');
    assert.strictEqual(board[0].rank, 1);

    // alex and dana both have 20 pts & 2 wins -> tied rank
    assert.strictEqual(board[1].points, 20);
    assert.strictEqual(board[2].points, 20);
    assert.strictEqual(board[1].rank, board[2].rank);

    // blake has 20 pts but only 1 win -> ranked below alex and dana
    assert.strictEqual(board[3].id, 'blake');
  });

  // 4. TIMER TESTS
  console.log('\n--- Timer Tests ---');
  test('Timer initializes with correct duration and remaining', () => {
    let tickCount = 0;
    const t = new Timer(30, () => { tickCount++; }, () => {});
    assert.strictEqual(t.duration, 30);
    assert.strictEqual(t.remaining, 30);
    assert.strictEqual(t.fraction, 0);
    t.destroy();
  });

  test('Timer serialization and restore preserves elapsed time', () => {
    const t = new Timer(60, () => {}, () => {});
    t._elapsed = 15000; // 15 seconds elapsed
    const serialized = t.serialize();
    assert.strictEqual(serialized.duration, 60);
    assert.strictEqual(serialized.elapsed, 15000);

    const restored = Timer.restore(serialized, () => {}, () => {});
    assert.strictEqual(restored.remaining, 45); // 60 - 15 = 45 remaining
    restored.destroy();
  });

  // 5. STORAGE TESTS
  console.log('\n--- Storage Tests ---');
  test('Initialisation sets schema version', async () => {
    mockStorage.clear();
    await storage.init();
    assert.strictEqual(mockStorage.get('pv_schema_version'), '1');
  });

  test('Save and retrieve players persists cleanly', () => {
    const testPlayers = [{ id: 'p1', name: 'Sam' }, { id: 'p2', name: 'Robin' }];
    storage.savePlayers(testPlayers);
    const retrieved = storage.getPlayers();
    assert.deepStrictEqual(retrieved, testPlayers);
  });

  test('Clear tournament leaves player roster intact', () => {
    storage.savePlayers([{ id: 'p1', name: 'Sam' }]);
    storage.saveTournament({ id: 't1', status: 'active' });
    storage.saveScores({ p1: { points: 10 } });

    storage.resetTournament();
    assert.strictEqual(storage.getPlayers().length, 1);
    assert.strictEqual(storage.getTournament().id, null);
    assert.deepStrictEqual(storage.getScores(), {});
  });

  test('Reset all clears all keys', () => {
    storage.savePlayers([{ id: 'p1', name: 'Sam' }]);
    storage.resetAll();
    assert.deepStrictEqual(storage.getPlayers(), []);
  });

  console.log(`\n========================================`);
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});

