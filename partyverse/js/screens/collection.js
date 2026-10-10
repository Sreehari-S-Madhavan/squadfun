/**
 * screens/collection.js — Game collection / browse screen
 */

import { GAME_REGISTRY, CATEGORIES } from '../games/registry.js';
import { router } from '../router.js';
import { ui } from '../ui.js';

export function renderCollection(root) {
  let activeCategory = 'all';

  function render() {
    const filtered = activeCategory === 'all'
      ? GAME_REGISTRY
      : GAME_REGISTRY.filter(g => g.category === activeCategory);

    const implemented = filtered.filter(g => g.implemented);
    const locked      = filtered.filter(g => !g.implemented);
    const games       = [...implemented, ...locked];

    root.innerHTML = `
      <div class="screen">
        <h1 class="screen-title">Game Collection</h1>
        <p class="screen-subtitle">${GAME_REGISTRY.filter(g=>g.implemented).length} of ${GAME_REGISTRY.length} games available</p>

        <div class="collection-filters" role="tablist" aria-label="Filter by category">
          ${CATEGORIES.map(cat => `
            <button
              class="filter-chip ${activeCategory === cat.id ? 'active' : ''}"
              data-cat="${ui.escHtml(cat.id)}"
              role="tab"
              aria-selected="${activeCategory === cat.id}"
            >
              ${cat.emoji} ${ui.escHtml(cat.label)}
            </button>
          `).join('')}
        </div>

        ${games.length === 0 ? `
          <div class="empty-state">
            <div class="empty-state__icon">🔍</div>
            <div class="empty-state__title">No games found</div>
            <div class="empty-state__desc">Try a different category filter</div>
          </div>
        ` : `
          <div class="games-grid" role="list">
            ${games.map((g, i) => renderGameCard(g)).join('')}
          </div>
        `}
      </div>
    `;

    // Category filters
    root.querySelectorAll('.filter-chip[data-cat]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeCategory = btn.dataset.cat;
        render();
      });
    });

    // Game cards
    root.querySelectorAll('.game-card[data-game]').forEach(card => {
      card.addEventListener('click', () => {
        const gameId = card.dataset.game;
        const game = GAME_REGISTRY.find(g => g.id === gameId);
        if (!game?.implemented) return;
        showGameInfo(game);
      });
    });
  }

  function renderGameCard(g) {
    const locked = !g.implemented;
    return `
      <div
        class="game-card ${locked ? 'is-locked' : 'card-hover'}"
        data-game="${ui.escHtml(g.id)}"
        role="listitem"
        tabindex="${locked ? -1 : 0}"
        aria-label="${ui.escHtml(g.title)} ${locked ? '(coming soon)' : ''}"
      >
        <div class="game-card__emoji">${g.emoji}</div>
        <div class="game-card__title">${ui.escHtml(g.title)}</div>
        <div class="game-card__meta">
          <span class="badge badge-${categoryColor(g.category)}">${ui.escHtml(g.category)}</span>
          <span class="game-card__players">👥 ${ui.escHtml(g.players || '2+')}</span>
        </div>
        ${locked ? '<span class="game-card__lock" title="Coming soon">🔒</span>' : ''}
      </div>
    `;
  }

  function showGameInfo(game) {
    ui.openModal(`
      <div style="text-align:center;margin-bottom:1rem">
        <div style="font-size:3.5rem;margin-bottom:.5rem">${game.emoji}</div>
        <h2 class="modal-title">${ui.escHtml(game.title)}</h2>
      </div>
      <p class="modal-body">${ui.escHtml(game.description)}</p>
      <div class="flex gap-2 mb-4" style="justify-content:center;flex-wrap:wrap">
        <span class="badge badge-${categoryColor(game.category)}">${ui.escHtml(game.category)}</span>
        <span class="badge">👥 ${ui.escHtml(game.players || '2+')}</span>
        ${(game.tags || []).map(t => `<span class="badge">${ui.escHtml(t)}</span>`).join('')}
      </div>
      <div class="modal-actions">
        <button class="btn btn-ghost" id="modal-cancel">Close</button>
        <button class="btn btn-primary" id="modal-play">Play Now</button>
      </div>
    `);

    document.getElementById('modal-cancel')?.addEventListener('click', () => ui.closeModal());
    document.getElementById('modal-play')?.addEventListener('click', () => {
      ui.closeModal();
      router.navigate('game', { id: game.id, solo: '1' });
    });
  }

  render();
}

function categoryColor(cat) {
  const map = {
    creative: 'accent',
    social:   'info',
    word:     'warning',
    board:    'success',
    puzzle:   'primary',
    reaction: 'error',
    trivia:   'gold',
    competitive: 'accent',
  };
  return map[cat] || 'primary';
}

