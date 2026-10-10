/**
 * screens/scoreboard.js — Live scoreboard screen
 */

import { scoring } from '../scoring.js';
import { storage } from '../storage.js';
import { ui }      from '../ui.js';
import { router }  from '../router.js';

export function renderScoreboard(root) {
  const t         = storage.getTournament();
  const players   = storage.getPlayers();
  const board     = scoring.leaderboard();
  const isActive  = t.status === 'active' || t.status === 'paused';
  const isComplete = t.status === 'complete';

  // Map id → player name
  const nameMap = {};
  players.forEach(p => { nameMap[p.id] = p.name; });

  // For team mode, team IDs are used
  const displayName = (id) => nameMap[id] || id;

  const rankEmoji = (rank) => rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

  root.innerHTML = `
    <div class="screen">
      <h1 class="screen-title">${isComplete ? '🏆 Final Results' : '📊 Scoreboard'}</h1>
      <p class="screen-subtitle">
        ${isComplete
          ? 'Tournament complete! Here are the final standings.'
          : isActive
            ? `Round ${t.currentRoundIndex + 1} of ${t.rounds.length} · Live standings`
            : 'No active tournament'}
      </p>

      ${board.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state__icon">📊</div>
          <div class="empty-state__title">No scores yet</div>
          <div class="empty-state__desc">Start a tournament to see the scoreboard.</div>
          <button class="btn btn-primary mt-4" id="btn-create">Start a Party</button>
        </div>
      ` : `
        <div class="scoreboard-list">
          ${board.map((entry, i) => {
            const color = ui.avatarColor(i);
            const name  = displayName(entry.id);
            return `
              <div class="score-row ${entry.rank === 1 ? 'score-row--leader' : ''}">
                <div class="score-row__rank">${rankEmoji(entry.rank)}</div>
                <div class="score-row__avatar" style="background:${color.bg};color:${color.text}">
                  ${name[0]?.toUpperCase() || '?'}
                </div>
                <div class="score-row__info">
                  <div class="score-row__name">${ui.escHtml(name)}</div>
                  <div class="score-row__meta">${entry.wins} win${entry.wins!==1?'s':''} · ${entry.rounds} round${entry.rounds!==1?'s':''}</div>
                </div>
                <div class="score-row__points">${entry.points}</div>
              </div>
            `;
          }).join('')}
        </div>

        ${isComplete ? `
          <div class="mt-8 flex flex-col gap-3">
            <button class="btn btn-gold btn-full btn-lg" id="btn-winner">🏆 See Winner!</button>
            <button class="btn btn-ghost btn-full" id="btn-new">🎲 New Tournament</button>
          </div>
        ` : isActive ? `
          <div class="mt-8">
            <button class="btn btn-primary btn-full btn-lg" id="btn-continue">▶ Continue Playing</button>
          </div>
        ` : ''}
      `}
    </div>
  `;

  root.querySelector('#btn-create')?.addEventListener('click', () => router.navigate('tournament'));
  root.querySelector('#btn-continue')?.addEventListener('click', () => router.navigate('game'));
  root.querySelector('#btn-winner')?.addEventListener('click', () => router.navigate('game', { view: 'winner' }));
  root.querySelector('#btn-new')?.addEventListener('click', async () => {
    const ok = await ui.confirm({
      title: 'New Tournament?',
      body: 'This will clear scores and start fresh.',
      confirmText: 'Start Fresh',
      danger: true,
    });
    if (ok) {
      storage.resetTournament();
      router.navigate('tournament');
    }
  });
}

