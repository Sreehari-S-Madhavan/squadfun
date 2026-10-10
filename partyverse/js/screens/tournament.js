/**
 * screens/tournament.js — Multi-step tournament setup flow
 *
 * Steps:
 *   1. Player Setup (add/remove players)
 *   2. Mode Selection (solo vs team)
 *   3. Duration & Category Selection
 *   4. Randomization Mode
 *   5. Preview & Start
 */

import { router }     from '../router.js';
import { storage }    from '../storage.js';
import { tournament } from '../tournament.js';
import { ui }         from '../ui.js';
import { CATEGORIES } from '../games/registry.js';
import { randomizer } from '../randomizer.js';
import { getGame }    from '../games/registry.js';

const MAX_PLAYERS = 12;
const MIN_PLAYERS = 2;

// Player color palette (shared with ui.js avatarColor)
const PLAYER_COLORS = [
  '#7c3aed','#f43f5e','#0ea5e9','#10b981',
  '#f59e0b','#ec4899','#14b8a6','#6366f1',
  '#ef4444','#84cc16','#8b5cf6','#f97316',
];

let _state = null;

function defaultState() {
  const saved = storage.getTournament();
  const players = storage.getPlayers();

  // If a tournament is in an active/paused state, jump to preview
  if (saved.status === 'active' || saved.status === 'paused') {
    return { step: 'preview', ...extractConfig(saved), players };
  }
  if (saved.status === 'preview') {
    return { step: 'preview', ...extractConfig(saved), players };
  }

  return {
    step:       'players',  // players | mode | options | preview
    players:    players.length ? players : [],
    mode:       'solo',
    duration:   15,
    categories: ['all'],
    randomMode: 'balanced',
    teams:      { 'Team A': [], 'Team B': [] },
    rounds:     [],
  };
}

function extractConfig(t) {
  return {
    mode:       t.mode,
    duration:   t.duration,
    categories: t.categories,
    randomMode: t.randomMode,
    rounds:     t.rounds,
  };
}

export function renderTournament(root) {
  _state = defaultState();

  // If active tournament, go straight to preview
  const saved = storage.getTournament();
  if (saved.status === 'active' || saved.status === 'paused') {
    renderPreview(root);
    return;
  }

  renderStep(root);
}

function renderStep(root) {
  switch (_state.step) {
    case 'players':  renderPlayers(root);  break;
    case 'mode':     renderMode(root);     break;
    case 'options':  renderOptions(root);  break;
    case 'preview':  renderPreview(root);  break;
  }
}

// ────────────────────────────────────────────────────────────────
// STEP 1: Player Setup
// ────────────────────────────────────────────────────────────────
function renderPlayers(root) {
  const { players } = _state;

  root.innerHTML = `
    <div class="screen">
      ${stepHeader('Step 1 of 4', 'players', 'Add Players', 'Add 2–12 players. Tap × to remove.')}

      <div class="player-chips" id="player-chips">
        ${players.map((p, i) => playerChipHtml(p, i)).join('')}
      </div>

      ${players.length < MAX_PLAYERS ? `
        <div class="add-player-row" id="add-row">
          <input
            class="input" id="player-name-input"
            type="text" placeholder="Enter player name…"
            maxlength="20" autocomplete="off"
            aria-label="New player name"
          />
          <button class="btn btn-primary" id="btn-add-player">Add</button>
        </div>
        <div class="form-error" id="player-error" style="display:none"></div>
      ` : `<p class="text-sm text-muted">Maximum ${MAX_PLAYERS} players reached.</p>`}

      <div class="divider"></div>

      <div class="flex gap-3">
        <button class="btn btn-ghost flex-1" id="btn-random-names">🎲 Random Names</button>
        <button class="btn btn-ghost flex-1" id="btn-clear-all" ${players.length===0?'disabled':''}>🗑 Clear All</button>
      </div>

      <div class="mt-8">
        <button class="btn btn-primary btn-full btn-lg" id="btn-next" ${players.length < MIN_PLAYERS ? 'disabled' : ''}>
          Continue → (${players.length} player${players.length!==1?'s':''})
        </button>
        ${players.length < MIN_PLAYERS ? `<p class="form-hint text-center mt-2">Need at least ${MIN_PLAYERS} players</p>` : ''}
      </div>
    </div>
  `;

  // Add player
  const input = root.querySelector('#player-name-input');
  const errEl = root.querySelector('#player-error');

  function addPlayer() {
    const name = input?.value.trim();
    const err = validatePlayerName(name, _state.players);
    if (err) {
      showError(errEl, err);
      return;
    }
    _state.players.push({ id: `p_${Date.now()}_${Math.random().toString(36).slice(2,5)}`, name });
    storage.savePlayers(_state.players);
    renderPlayers(root);
    // Re-focus input after re-render
    root.querySelector('#player-name-input')?.focus();
  }

  root.querySelector('#btn-add-player')?.addEventListener('click', addPlayer);
  input?.addEventListener('keydown', e => { if (e.key === 'Enter') addPlayer(); });

  // Remove player chips
  root.querySelectorAll('.player-chip__remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      _state.players = _state.players.filter(p => p.id !== id);
      storage.savePlayers(_state.players);
      renderPlayers(root);
    });
  });

  // Random names
  root.querySelector('#btn-random-names')?.addEventListener('click', () => {
    const names = shuffleArray([...RANDOM_NAMES]).slice(0, 4);
    _state.players = names.map((name, i) => ({
      id: `p_${Date.now()}_${i}`,
      name,
    }));
    storage.savePlayers(_state.players);
    renderPlayers(root);
  });

  // Clear all
  root.querySelector('#btn-clear-all')?.addEventListener('click', () => {
    _state.players = [];
    storage.savePlayers([]);
    renderPlayers(root);
  });

  // Next
  root.querySelector('#btn-next')?.addEventListener('click', () => {
    if (_state.players.length < MIN_PLAYERS) return;
    _state.step = 'mode';
    renderStep(root);
  });
}

// ────────────────────────────────────────────────────────────────
// STEP 2: Mode Selection
// ────────────────────────────────────────────────────────────────
function renderMode(root) {
  const { mode, players } = _state;

  // Auto-build teams
  if (!_state.teams || Object.keys(_state.teams).length === 0) {
    _state.teams = buildDefaultTeams(players);
  }

  root.innerHTML = `
    <div class="screen">
      ${stepHeader('Step 2 of 4', 'mode', 'Game Mode', 'How will players compete?')}

      <div class="mode-options" id="mode-options">
        <button class="mode-option ${mode==='solo'?'active':''}" data-mode="solo">
          <div class="mode-option__icon">🧑</div>
          <div class="flex-1">
            <div class="mode-option__title">Solo / Free-for-all</div>
            <div class="mode-option__desc">Every player competes for themselves. Individual scoring.</div>
          </div>
          <div class="mode-option__radio"></div>
        </button>
        <button class="mode-option ${mode==='team'?'active':''}" data-mode="team" ${players.length<3?'disabled title="Need 3+ players for teams"':''}>
          <div class="mode-option__icon">👥</div>
          <div class="flex-1">
            <div class="mode-option__title">Team Mode</div>
            <div class="mode-option__desc">Split into teams and compete together. Team scoring.</div>
          </div>
          <div class="mode-option__radio"></div>
        </button>
      </div>

      ${mode === 'team' ? renderTeamAssignment(players, _state.teams) : ''}

      <div class="mt-8 flex gap-3">
        <button class="btn btn-ghost flex-1" id="btn-back">← Back</button>
        <button class="btn btn-primary flex-1 btn-lg" id="btn-next">Continue →</button>
      </div>
    </div>
  `;

  // Mode selector
  root.querySelectorAll('.mode-option[data-mode]').forEach(btn => {
    btn.addEventListener('click', () => {
      _state.mode = btn.dataset.mode;
      if (_state.mode === 'team' && !_state.teams) {
        _state.teams = buildDefaultTeams(players);
      }
      renderMode(root);
    });
  });

  // Team assignment
  root.querySelectorAll('.team-member-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const playerId = btn.dataset.player;
      const targetTeam = btn.dataset.team;
      // Move player to target team
      Object.keys(_state.teams).forEach(teamName => {
        _state.teams[teamName] = _state.teams[teamName].filter(id => id !== playerId);
      });
      if (!_state.teams[targetTeam]) _state.teams[targetTeam] = [];
      _state.teams[targetTeam].push(playerId);
      renderMode(root);
    });
  });

  // Random team assignment
  root.querySelector('#btn-random-teams')?.addEventListener('click', () => {
    _state.teams = buildRandomTeams(players);
    renderMode(root);
  });

  root.querySelector('#btn-back')?.addEventListener('click', () => {
    _state.step = 'players';
    renderStep(root);
  });

  root.querySelector('#btn-next')?.addEventListener('click', () => {
    _state.step = 'options';
    renderStep(root);
  });
}

function renderTeamAssignment(players, teams) {
  const teamNames = Object.keys(teams);

  return `
    <div class="divider-label">Team Assignment</div>
    <div style="display:flex;gap:.5rem;justify-content:flex-end;margin-bottom:.75rem">
      <button class="btn btn-sm btn-ghost" id="btn-random-teams">🎲 Randomize</button>
    </div>
    ${teamNames.map((teamName, ti) => `
      <div class="team-card">
        <div class="team-card__header">
          <div class="team-card__color" style="background:${PLAYER_COLORS[ti % PLAYER_COLORS.length]}"></div>
          <span class="font-bold">${ui.escHtml(teamName)}</span>
          <span class="badge ml-auto">${teams[teamName].length} members</span>
        </div>
        <div class="team-card__members">
          ${players.map(p => {
            const inThisTeam = teams[teamName].includes(p.id);
            return `
              <button
                class="player-chip ${inThisTeam ? '' : 'opacity-50'}"
                style="${inThisTeam ? `border-color:${PLAYER_COLORS[ti % PLAYER_COLORS.length]}` : ''};cursor:pointer"
                data-player="${ui.escHtml(p.id)}"
                data-team="${ui.escHtml(teamName)}"
                title="Move ${ui.escHtml(p.name)} to ${ui.escHtml(teamName)}"
              >
                <div class="player-chip__avatar" style="background:${PLAYER_COLORS[players.indexOf(p) % PLAYER_COLORS.length]};color:#fff;width:22px;height:22px;font-size:11px">
                  ${p.name[0].toUpperCase()}
                </div>
                ${ui.escHtml(p.name)}
              </button>
            `;
          }).join('')}
        </div>
      </div>
    `).join('')}
  `;
}

// ────────────────────────────────────────────────────────────────
// STEP 3: Duration & Category Options
// ────────────────────────────────────────────────────────────────
function renderOptions(root) {
  const { duration, categories, randomMode } = _state;

  root.innerHTML = `
    <div class="screen">
      ${stepHeader('Step 3 of 4', 'options', 'Party Settings', 'Customize your tournament.')}

      <div class="form-group">
        <label class="form-label">Session Duration</label>
        <div class="duration-options">
          ${[15,30,45].map(d => `
            <button class="duration-option ${duration===d?'active':''}" data-dur="${d}">
              <div class="duration-option__time">${d}</div>
              <div class="duration-option__label">min</div>
              <div class="duration-option__rounds">${d===15?'~6':''}${d===30?'~10':''}${d===45?'~14':''} rounds</div>
            </button>
          `).join('')}
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Randomization Mode</label>
        <div class="seg-control">
          ${[['balanced','⚖️ Balanced'],['chaos','🌪 Chaos'],['skill','🎯 Skill']].map(([id,label]) => `
            <button class="seg-btn ${randomMode===id?'active':''}" data-rmode="${id}">${label}</button>
          `).join('')}
        </div>
        <div class="form-hint">
          ${randomMode==='balanced'?'A good mix of all game types.':''}
          ${randomMode==='chaos'?'Completely random — expect anything!':''}
          ${randomMode==='skill'?'Weighted toward skill-based games.':''}
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Game Categories</label>
        <div class="category-grid">
          ${CATEGORIES.filter(c=>c.id!=='all').map(cat => {
            const active = categories.includes('all') || categories.includes(cat.id);
            return `
              <button class="category-toggle ${active?'active':''}" data-cat="${ui.escHtml(cat.id)}">
                <span class="category-toggle__icon">${cat.emoji}</span>
                <span class="category-toggle__name">${ui.escHtml(cat.label)}</span>
                <div class="category-toggle__check">${active?'✓':''}</div>
              </button>
            `;
          }).join('')}
        </div>
        <button class="btn btn-sm btn-ghost mt-3" id="btn-select-all">Select All</button>
      </div>

      <div class="flex gap-3 mt-8">
        <button class="btn btn-ghost flex-1" id="btn-back">← Back</button>
        <button class="btn btn-primary flex-1 btn-lg" id="btn-preview">Preview →</button>
      </div>
    </div>
  `;

  // Duration
  root.querySelectorAll('.duration-option[data-dur]').forEach(btn => {
    btn.addEventListener('click', () => {
      _state.duration = parseInt(btn.dataset.dur);
      renderOptions(root);
    });
  });

  // Randomization mode
  root.querySelectorAll('.seg-btn[data-rmode]').forEach(btn => {
    btn.addEventListener('click', () => {
      _state.randomMode = btn.dataset.rmode;
      renderOptions(root);
    });
  });

  // Category toggles
  root.querySelectorAll('.category-toggle[data-cat]').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset.cat;
      if (_state.categories.includes('all')) {
        // Switch to specific selection
        _state.categories = CATEGORIES.filter(c=>c.id!=='all').map(c=>c.id).filter(id=>id!==cat);
      } else if (_state.categories.includes(cat)) {
        _state.categories = _state.categories.filter(id=>id!==cat);
        if (_state.categories.length === 0) _state.categories = ['all'];
      } else {
        _state.categories = [..._state.categories, cat];
        // If all specific selected, switch to 'all'
        if (_state.categories.length === CATEGORIES.filter(c=>c.id!=='all').length) {
          _state.categories = ['all'];
        }
      }
      renderOptions(root);
    });
  });

  root.querySelector('#btn-select-all')?.addEventListener('click', () => {
    _state.categories = ['all'];
    renderOptions(root);
  });

  root.querySelector('#btn-back')?.addEventListener('click', () => {
    _state.step = 'mode';
    renderStep(root);
  });

  root.querySelector('#btn-preview')?.addEventListener('click', () => {
    // Generate tournament
    tournament.create({
      mode:            _state.mode,
      duration:        _state.duration,
      categories:      _state.categories,
      randomMode:      _state.randomMode,
      teamAssignments: _state.teams,
    });
    _state.step = 'preview';
    renderStep(root);
  });
}

// ────────────────────────────────────────────────────────────────
// STEP 4: Preview & Start
// ────────────────────────────────────────────────────────────────
function renderPreview(root) {
  const t = storage.getTournament();
  const players = storage.getPlayers();
  const isActive = t.status === 'active' || t.status === 'paused';

  const estimatedMins = randomizer.estimateDuration(t.rounds);
  const pendingRounds = t.rounds.filter(r => r.status === 'pending');
  const doneRounds    = t.rounds.filter(r => r.status === 'complete' || r.status === 'skipped');
  const currentIdx    = t.currentRoundIndex;

  root.innerHTML = `
    <div class="screen">
      ${isActive
        ? `<h1 class="screen-title">Tournament in Progress</h1><p class="screen-subtitle">Round ${currentIdx + 1} of ${t.rounds.length}</p>`
        : stepHeader('Step 4 of 4', 'preview', 'Tournament Preview', `${t.rounds.length} rounds · ~${estimatedMins} min`)}

      <div class="card mb-4" style="display:flex;gap:1rem;align-items:center">
        <span style="font-size:1.8rem">${t.mode==='team'?'👥':'🧑'}</span>
        <div>
          <div class="font-bold">${t.mode==='team'?'Team Mode':'Solo Mode'}</div>
          <div class="text-xs text-3">
            ${players.length} players · ${t.duration} min session · ${t.randomMode} mix
          </div>
        </div>
      </div>

      <div class="preview-list">
        ${t.rounds.map((round, idx) => {
          const game = getGame(round.gameId);
          const isCurrent = idx === currentIdx;
          const isDone = round.status === 'complete' || round.status === 'skipped';
          const isPending = round.status === 'pending';

          return `
            <div class="preview-round ${isDone?'completed':''} ${isCurrent&&isActive?'current':''}">
              <div class="preview-round__num">${idx + 1}</div>
              <div class="preview-round__emoji">${game?.emoji || '🎮'}</div>
              <div class="preview-round__info">
                <div class="preview-round__name">${ui.escHtml(game?.title || 'Unknown')}</div>
                <div class="preview-round__meta">
                  ${ui.escHtml(game?.category || '')} ·
                  ${isDone ? (round.status === 'skipped' ? '⏭ Skipped' : '✅ Complete') : ''}
                  ${isCurrent && isActive ? '▶ Current' : ''}
                  ${isPending && !isCurrent ? '⏳ Upcoming' : ''}
                </div>
              </div>
              <div class="preview-round__actions">
                ${isPending ? `<button class="btn btn-sm btn-ghost" data-reroll="${idx}" title="Reroll this round">🎲</button>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div class="mt-8">
        ${isActive
          ? `
            <button class="btn btn-primary btn-full btn-xl mb-3" id="btn-continue-game">
              ▶ Continue to Round ${currentIdx + 1}
            </button>
            <button class="btn btn-ghost btn-full" id="btn-scoreboard">📊 View Scoreboard</button>
          `
          : `
            <button class="btn btn-primary btn-full btn-xl mb-3" id="btn-start">
              🚀 Start Tournament!
            </button>
            <button class="btn btn-ghost btn-full" id="btn-back-options">← Back to Settings</button>
          `
        }
      </div>
    </div>
  `;

  // Reroll buttons
  root.querySelectorAll('[data-reroll]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.reroll);
      tournament.reroll(idx);
      renderPreview(root);
      ui.toast('Round rerolled!', 'success');
    });
  });

  root.querySelector('#btn-start')?.addEventListener('click', () => {
    tournament.start();
    router.navigate('game');
  });

  root.querySelector('#btn-continue-game')?.addEventListener('click', () => {
    router.navigate('game');
  });

  root.querySelector('#btn-scoreboard')?.addEventListener('click', () => {
    router.navigate('scoreboard');
  });

  root.querySelector('#btn-back-options')?.addEventListener('click', () => {
    _state.step = 'options';
    renderStep(root);
  });
}

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────
function stepHeader(stepLabel, stepId, title, subtitle) {
  const steps = ['players','mode','options','preview'];
  const idx   = steps.indexOf(stepId);
  return `
    <div class="step-indicator">
      ${steps.map((s, i) => `
        <div class="step-dot ${i < idx ? 'done' : i === idx ? 'active' : ''}"></div>
      `).join('')}
      <span class="step-label">${ui.escHtml(stepLabel)}</span>
    </div>
    <h1 class="screen-title">${ui.escHtml(title)}</h1>
    <p class="screen-subtitle">${ui.escHtml(subtitle)}</p>
  `;
}

function playerChipHtml(p, i) {
  const color = PLAYER_COLORS[i % PLAYER_COLORS.length];
  return `
    <div class="player-chip">
      <div class="player-chip__avatar" style="background:${color};color:#fff">${p.name[0].toUpperCase()}</div>
      <span>${ui.escHtml(p.name)}</span>
      <button class="player-chip__remove" data-id="${ui.escHtml(p.id)}" aria-label="Remove ${ui.escHtml(p.name)}">&times;</button>
    </div>
  `;
}

function validatePlayerName(name, existing) {
  if (!name || name.length < 1) return 'Name cannot be empty.';
  if (name.length > 20)         return 'Name too long (max 20 chars).';
  if (existing.some(p => p.name.toLowerCase() === name.toLowerCase())) {
    return 'A player with that name already exists.';
  }
  if (existing.length >= MAX_PLAYERS) {
    return `Maximum ${MAX_PLAYERS} players allowed.`;
  }
  return null;
}

function showError(el, msg) {
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 3000);
}

function buildDefaultTeams(players) {
  const half = Math.ceil(players.length / 2);
  return {
    'Team A': players.slice(0, half).map(p => p.id),
    'Team B': players.slice(half).map(p => p.id),
  };
}

function buildRandomTeams(players) {
  const shuffled = shuffleArray([...players]);
  const half = Math.ceil(shuffled.length / 2);
  return {
    'Team A': shuffled.slice(0, half).map(p => p.id),
    'Team B': shuffled.slice(half).map(p => p.id),
  };
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const RANDOM_NAMES = [
  'Alex','Blake','Casey','Dana','Eli','Faye','Gray','Harper',
  'Indie','Jules','Kai','Luna','Max','Nova','Orion','Piper',
  'Quinn','Remy','Sage','Theo','Uma','Vex','Wren','Zara',
];
