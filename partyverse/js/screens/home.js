/**
 * screens/home.js — Home / Party Lobby screen
 */

import { router } from '../router.js';
import { tournament } from '../tournament.js';
import { GAME_REGISTRY } from '../games/registry.js';
import { ui } from '../ui.js';
import { storage } from '../storage.js';

export function renderHome(root) {
  const hasActive = tournament.hasActive();
  const t = hasActive ? tournament.get() : null;

  const featured = GAME_REGISTRY.filter(g => g.implemented).slice(0, 6);
  const implementedCount = GAME_REGISTRY.filter(g => g.implemented).length;
  const players = storage.getPlayers();

  root.innerHTML = `
    <div class="screen">
      <div class="home-hero">
        <div class="home-hero__glow"></div>
        <span class="home-hero__emoji">🎮</span>
        <h1 class="home-hero__title">
          Let the <span>Party</span> Begin!
        </h1>
        <p class="home-hero__sub">
          Random mini-games, tournaments &amp; non-stop fun — all on one device.
        </p>

        <div class="home-cta-group">
          ${hasActive ? `
            <button class="btn btn-gold btn-xl btn-full" id="btn-resume">
              ▶ Resume Tournament
            </button>
            <button class="btn btn-primary btn-lg btn-full" id="btn-new-tournament">
              🎲 New Tournament
            </button>
          ` : `
            <button class="btn btn-primary btn-xl btn-full" id="btn-start-tournament">
              🎲 Start a Party
            </button>
          `}
          <a href="#collection" class="btn btn-ghost btn-lg btn-full">
            🎮 Browse Games
          </a>
        </div>
      </div>

      ${hasActive ? `
        <div class="card mb-4" style="border-color:var(--color-gold);background:rgba(251,191,36,0.05)">
          <div class="flex items-center gap-3">
            <span style="font-size:1.5rem">🏆</span>
            <div class="flex-1">
              <div class="font-bold text-sm">Tournament in Progress</div>
              <div class="text-xs text-3">
                Round ${(t.currentRoundIndex + 1)} of ${t.rounds.length} · ${t.mode === 'team' ? 'Team mode' : 'Solo mode'}
              </div>
            </div>
            <button class="btn btn-sm btn-gold" id="btn-resume-2">Resume</button>
          </div>
        </div>
      ` : ''}

      <div class="home-section">
        <div class="stats-bar">
          <div class="stat-item">
            <div class="stat-value">${implementedCount}</div>
            <div class="stat-label">Games</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">24</div>
            <div class="stat-label">Total</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${players.length || '—'}</div>
            <div class="stat-label">Players</div>
          </div>
        </div>
      </div>

      <div class="home-section">
        <div class="section-header">
          <h2 class="section-title">Featured Games</h2>
          <a href="#collection" class="section-link">See all</a>
        </div>
        <div class="featured-games">
          ${featured.map(g => `
            <button class="featured-game-card" data-game="${ui.escHtml(g.id)}" aria-label="Play ${ui.escHtml(g.title)}">
              <div class="featured-game-card__emoji">${g.emoji}</div>
              <div class="featured-game-card__name">${ui.escHtml(g.title)}</div>
            </button>
          `).join('')}
        </div>
      </div>

      <div class="home-section">
        <div class="card" style="background:var(--color-bg-3);border-style:dashed">
          <div class="flex items-center gap-3 mb-3">
            <span style="font-size:1.4rem">📡</span>
            <div>
              <div class="font-bold text-sm">Offline-First</div>
              <div class="text-xs text-3">Play anywhere, no internet required after first load</div>
            </div>
          </div>
          <div class="text-xs text-muted" id="offline-home-status">
            Visit once online to cache all game files for offline play.
          </div>
        </div>
      </div>
    </div>
  `;

  // Wire buttons
  root.querySelector('#btn-start-tournament')?.addEventListener('click', () => {
    router.navigate('tournament');
  });

  root.querySelector('#btn-resume')?.addEventListener('click', () => {
    router.navigate('tournament');
  });

  root.querySelector('#btn-resume-2')?.addEventListener('click', () => {
    router.navigate('tournament');
  });

  root.querySelector('#btn-new-tournament')?.addEventListener('click', async () => {
    const ok = await ui.confirm({
      title: 'Start new tournament?',
      body: 'This will clear the current tournament and scores. Make sure everyone is ready.',
      confirmText: 'Start Fresh',
      danger: true,
    });
    if (ok) {
      storage.resetTournament();
      router.navigate('tournament');
    }
  });

  // Featured game cards
  root.querySelectorAll('.featured-game-card[data-game]').forEach(btn => {
    btn.addEventListener('click', () => {
      const gameId = btn.dataset.game;
      router.navigate('game', { id: gameId, solo: '1' });
    });
  });

  // Update offline home status label
  if (navigator.serviceWorker?.controller) {
    const el = document.getElementById('offline-home-status');
    if (el) el.textContent = '✅ Cached and ready for offline play!';
  }
}

