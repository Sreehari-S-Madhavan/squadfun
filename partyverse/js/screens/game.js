/**
 * screens/game.js — Game engine shell
 *
 * Manages the game lifecycle:
 *   ready → playing → result → (next round | complete)
 *
 * Each game module implements a standard interface.
 * The engine handles: ready screen, timer, pause/resume, result, scoring.
 */

import { storage }     from '../storage.js';
import { tournament }  from '../tournament.js';
import { scoring, POINTS } from '../scoring.js';
import { getGame }     from '../games/registry.js';
import { ui }          from '../ui.js';
import { router }      from '../router.js';
import { Timer }       from '../timer.js';

// ── Dynamic game module imports ─────────────────────────────
const GAME_MODULES = {
  'charades':           () => import('../games/charades.js'),
  'imposter':           () => import('../games/imposter.js'),
  'word-bomb':          () => import('../games/word-bomb.js'),
  'snakes-ladders':     () => import('../games/snakes-ladders.js'),
  'memory-match':       () => import('../games/memory-match.js'),
  'reaction-test':      () => import('../games/reaction-test.js'),
  'quick-quiz':         () => import('../games/quick-quiz.js'),
  'rock-paper-scissors':() => import('../games/rock-paper-scissors.js'),
};

// Active game cleanup function
let _cleanupFn = null;
let _timer = null;

export async function renderGame(root, params = {}) {
  // Cleanup any previous game
  if (_cleanupFn) { _cleanupFn(); _cleanupFn = null; }
  if (_timer) { _timer.destroy(); _timer = null; }

  // Determine game to load
  let gameId, isSolo = false;
  const t = storage.getTournament();

  if (params.view === 'winner') {
    renderWinner(root);
    return;
  }

  if (params.id) {
    // Direct play from collection
    gameId = params.id;
    isSolo = true;
  } else if (t.status === 'active' || t.status === 'paused') {
    const round = t.rounds[t.currentRoundIndex];
    gameId = round?.gameId;
  } else if (t.status === 'complete') {
    renderWinner(root);
    return;
  } else {
    router.navigate('tournament');
    return;
  }

  const gameMeta = getGame(gameId);
  if (!gameMeta || !gameMeta.implemented) {
    root.innerHTML = `<div class="screen"><div class="empty-state">
      <div class="empty-state__icon">🚧</div>
      <div class="empty-state__title">Game not available</div>
      <div class="empty-state__desc">This game hasn't been implemented yet.</div>
      <button class="btn btn-primary mt-4" onclick="history.back()">Go Back</button>
    </div></div>`;
    return;
  }

  const loader = GAME_MODULES[gameId];
  if (!loader) {
    root.innerHTML = `<div class="screen"><div class="empty-state">
      <div class="empty-state__icon">⚠️</div>
      <div class="empty-state__title">Module not found</div>
      <button class="btn btn-primary mt-4" onclick="history.back()">Go Back</button>
    </div></div>`;
    return;
  }

  // Show ready screen
  renderReadyScreen(root, gameMeta, async () => {
    // Load game module
    ui.showLoading(root, `Loading ${gameMeta.title}…`);
    try {
      const mod = await loader();
      const gameModule = mod.default || mod[Object.keys(mod)[0]];
      runGame(root, gameModule, gameMeta, t, isSolo);
    } catch (err) {
      console.error('[game] Module load error:', err);
      root.innerHTML = `<div class="screen"><div class="empty-state">
        <div class="empty-state__icon">❌</div>
        <div class="empty-state__title">Failed to load game</div>
        <div class="empty-state__desc">${ui.escHtml(err.message)}</div>
        <button class="btn btn-primary mt-4" onclick="history.back()">Go Back</button>
      </div></div>`;
    }
  });
}

// ── Ready Screen ─────────────────────────────────────────────
function renderReadyScreen(root, gameMeta, onStart) {
  const t = storage.getTournament();
  const roundNum = (t.currentRoundIndex ?? 0) + 1;
  const totalRounds = t.rounds?.length ?? 1;
  const players = storage.getPlayers();

  root.innerHTML = `
    <div class="game-header">
      <div class="game-title-bar">
        <div class="game-round-label">Round ${roundNum} of ${totalRounds}</div>
        <div class="game-name">${ui.escHtml(gameMeta.title)}</div>
      </div>
      <span class="badge badge-${categoryColor(gameMeta.category)}">${ui.escHtml(gameMeta.category)}</span>
    </div>
    <div class="ready-screen">
      <div class="ready-screen__emoji">${gameMeta.emoji}</div>
      <h1 class="ready-screen__title">${ui.escHtml(gameMeta.title)}</h1>
      <div class="ready-screen__rules">
        <h4>How to Play</h4>
        <p class="text-sm text-3" id="game-rules-text" style="line-height:1.7">
          ${ui.escHtml(gameMeta.description)}
        </p>
      </div>
      <div style="text-align:center">
        <div class="text-xs text-muted mb-3">
          👥 ${players.length} player${players.length!==1?'s':''} · ${ui.escHtml(gameMeta.players || '2+')} supported
        </div>
        <button class="btn btn-primary btn-xl" id="btn-ready">
          ✅ Everyone's Ready!
        </button>
        <div class="mt-3">
          <button class="btn btn-ghost btn-sm" id="btn-skip-round">⏭ Skip this round</button>
        </div>
      </div>
    </div>
  `;

  root.querySelector('#btn-ready')?.addEventListener('click', () => {
    tournament.startRound();
    onStart();
  });

  root.querySelector('#btn-skip-round')?.addEventListener('click', async () => {
    const ok = await ui.confirm({
      title: 'Skip this round?',
      body: 'No points will be awarded for skipped rounds.',
      confirmText: 'Skip',
    });
    if (ok) {
      tournament.skipRound();
      advanceOrEnd(root);
    }
  });
}

// ── Run Game ─────────────────────────────────────────────────
function runGame(root, gameModule, gameMeta, t, isSolo) {
  if (!gameModule || typeof gameModule.run !== 'function') {
    root.innerHTML = `<div class="screen"><div class="empty-state">
      <div class="empty-state__icon">⚠️</div>
      <div class="empty-state__title">Invalid game module</div>
    </div></div>`;
    return;
  }

  const players = storage.getPlayers();
  const scores  = storage.getScores();

  const context = {
    players,
    scores,
    t,
    isSolo,
    ui,
    Timer,
    onComplete: (result) => handleResult(root, result, gameMeta, isSolo),
    onCleanup: (fn) => { _cleanupFn = fn; },
  };

  try {
    gameModule.run(root, context);
  } catch (err) {
    console.error('[game] Runtime error:', err);
    root.innerHTML = `<div class="screen"><div class="empty-state">
      <div class="empty-state__icon">❌</div>
      <div class="empty-state__title">Game crashed</div>
      <div class="empty-state__desc">${ui.escHtml(err.message)}</div>
      <button class="btn btn-primary mt-4" onclick="history.back()">Go Back</button>
    </div></div>`;
  }
}

// ── Handle Result ─────────────────────────────────────────────
function handleResult(root, result, gameMeta, isSolo) {
  // result: { rankings: [{id, name, points, isWin}], summary: string }
  if (!result) { advanceOrEnd(root); return; }

  const round = storage.getTournament().rounds[storage.getTournament().currentRoundIndex];

  root.innerHTML = `
    <div class="screen">
      <div class="game-header">
        <div class="game-title-bar">
          <div class="game-round-label">Round Complete!</div>
          <div class="game-name">${ui.escHtml(gameMeta.title)}</div>
        </div>
      </div>
      <div class="ready-screen" style="padding-top:1.5rem">
        <div style="font-size:3rem">${result.rankings?.[0] ? '🏆' : '✅'}</div>
        ${result.rankings?.[0] ? `
          <div>
            <div class="text-xs text-muted mb-1" style="letter-spacing:.1em;text-transform:uppercase">Winner</div>
            <div class="text-2xl font-black">${ui.escHtml(result.rankings[0].name || result.rankings[0].id)}</div>
          </div>
        ` : ''}
        ${result.summary ? `<p class="text-sm text-3 text-center">${ui.escHtml(result.summary)}</p>` : ''}

        <div style="width:100%;max-width:320px">
          <div class="text-xs text-muted mb-3" style="text-align:center">Points Awarded</div>
          ${(result.rankings || []).map((r, i) => `
            <div class="score-row mb-2">
              <div class="score-row__rank">${['🥇','🥈','🥉'][i] || `#${i+1}`}</div>
              <div class="score-row__info">
                <div class="score-row__name">${ui.escHtml(r.name || r.id)}</div>
              </div>
              <div class="score-row__points" style="font-size:1.2rem">+${r.points}</div>
            </div>
          `).join('')}
        </div>

        <div style="width:100%">
          <button class="btn btn-primary btn-full btn-lg" id="btn-confirm-result">
            ✅ Confirm & Continue
          </button>
          ${!isSolo ? `
            <button class="btn btn-ghost btn-full mt-3" id="btn-view-scores">📊 View Scoreboard</button>
          ` : ''}
        </div>
      </div>
    </div>
  `;

  root.querySelector('#btn-confirm-result')?.addEventListener('click', () => {
    if (!isSolo && round && !round.committed) {
      // Commit scores
      tournament.completeRound(result);
      scoring.commitRound(round.id, result.rankings || []);
    }
    advanceOrEnd(root);
  });

  root.querySelector('#btn-view-scores')?.addEventListener('click', () => {
    if (round && !round.committed) {
      tournament.completeRound(result);
      scoring.commitRound(round.id, result.rankings || []);
    }
    router.navigate('scoreboard');
  });
}

// ── Advance or End ────────────────────────────────────────────
function advanceOrEnd(root) {
  const hasMore = tournament.nextRound();
  if (hasMore) {
    // Navigate to next game
    router.navigate('game');
  } else {
    tournament.complete();
    renderWinner(root);
  }
}

// ── Winner Screen ─────────────────────────────────────────────
function renderWinner(root) {
  const board   = scoring.leaderboard();
  const players = storage.getPlayers();
  const winner  = board[0];
  if (!winner) {
    router.navigate('scoreboard');
    return;
  }

  const nameMap = {};
  players.forEach(p => { nameMap[p.id] = p.name; });
  const winnerName = nameMap[winner.id] || winner.id;

  // Confetti pieces
  const confettiColors = ['#7c3aed','#f43f5e','#fbbf24','#10b981','#0ea5e9'];
  const confetti = Array.from({length: 20}, (_, i) => {
    const color = confettiColors[i % confettiColors.length];
    const left  = Math.random() * 100;
    const delay = Math.random() * 2;
    const dur   = 2 + Math.random() * 2;
    return `<div class="confetti-piece" style="left:${left}%;background:${color};animation-delay:${delay}s;animation-duration:${dur}s"></div>`;
  }).join('');

  root.innerHTML = `
    <div class="screen">
      <div class="winner-screen">
        <div class="winner-screen__confetti">${confetti}</div>
        <div class="winner-trophy">🏆</div>
        <div class="winner-label">Tournament Winner</div>
        <div class="winner-name">${ui.escHtml(winnerName)}</div>
        <div class="winner-score">${winner.points} points · ${winner.wins} wins</div>

        <div style="width:100%;max-width:320px;margin-bottom:2rem">
          ${board.slice(0,3).map((entry, i) => {
            const name = nameMap[entry.id] || entry.id;
            const medals = ['🥇','🥈','🥉'];
            const c = ui.avatarColor(i);
            return `
              <div class="score-row mb-2 ${i===0?'score-row--leader':''}">
                <div class="score-row__rank">${medals[i]}</div>
                <div class="score-row__avatar" style="background:${c.bg};color:${c.text}">
                  ${name[0]?.toUpperCase()}
                </div>
                <div class="score-row__info">
                  <div class="score-row__name">${ui.escHtml(name)}</div>
                  <div class="score-row__meta">${entry.wins} wins</div>
                </div>
                <div class="score-row__points">${entry.points}</div>
              </div>
            `;
          }).join('')}
        </div>

        <div style="display:flex;flex-direction:column;gap:.75rem;width:100%">
          <button class="btn btn-primary btn-full btn-lg" id="btn-new-tournament">🎲 New Tournament</button>
          <button class="btn btn-ghost btn-full" id="btn-full-scoreboard">📊 Full Scoreboard</button>
        </div>
      </div>
    </div>
  `;

  root.querySelector('#btn-new-tournament')?.addEventListener('click', async () => {
    const ok = await ui.confirm({
      title: 'New Tournament?',
      body: 'Start a brand new tournament with fresh scores?',
      confirmText: 'Start Fresh',
    });
    if (ok) {
      storage.resetTournament();
      router.navigate('tournament');
    }
  });

  root.querySelector('#btn-full-scoreboard')?.addEventListener('click', () => {
    router.navigate('scoreboard');
  });
}

function categoryColor(cat) {
  const map = {
    creative:'accent', social:'info', word:'warning', board:'success',
    puzzle:'primary', reaction:'error', trivia:'gold', competitive:'accent',
  };
  return map[cat] || 'primary';
}

