/**
 * router.js — Hash-based SPA router
 *
 * Maps URL hashes to screen render functions.
 * Works with GitHub Pages subpath hosting (no trailing slash issues).
 */

import { renderHome }        from './screens/home.js';
import { renderCollection }  from './screens/collection.js';
import { renderTournament }  from './screens/tournament.js';
import { renderScoreboard }  from './screens/scoreboard.js';
import { renderSettings }    from './screens/settings.js';
import { renderGame }        from './screens/game.js';

// Screen registry — maps hash fragment → renderer function
const SCREENS = {
  home:        renderHome,
  collection:  renderCollection,
  tournament:  renderTournament,
  scoreboard:  renderScoreboard,
  settings:    renderSettings,
  game:        renderGame,
};

// Screens that show the bottom nav
const SHOW_NAV = new Set(['home', 'collection', 'tournament', 'scoreboard', 'settings']);

// Screens that show the back button in the header
const SHOW_BACK = new Set(['tournament', 'collection', 'scoreboard', 'settings', 'game']);

export const router = {
  _current: null,

  init() {
    window.addEventListener('hashchange', () => this._route());
    this._route(); // handle initial hash
  },

  navigate(screen, params = {}) {
    const query = Object.keys(params).length
      ? '?' + new URLSearchParams(params).toString()
      : '';
    window.location.hash = screen + query;
  },

  /** Parse query params embedded in the hash: #game?id=charades */
  getParams() {
    const hash = window.location.hash.slice(1); // remove #
    const [, qs] = hash.split('?');
    if (!qs) return {};
    return Object.fromEntries(new URLSearchParams(qs));
  },

  /** Current screen id */
  current() {
    return this._current;
  },

  _route() {
    const hash = window.location.hash.slice(1) || 'home';
    const [screenId] = hash.split('?');
    const render = SCREENS[screenId] || SCREENS['home'];

    this._current = screenId;

    // Update nav active states
    this._updateNav(screenId);

    // Toggle back button
    const btnBack = document.getElementById('btn-back');
    if (btnBack) {
      btnBack.hidden = !SHOW_BACK.has(screenId);
      btnBack.onclick = () => history.back();
    }

    // Render the screen
    const root = document.getElementById('app-root');
    if (root) {
      render(root, this.getParams());
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'instant' });
  },

  _updateNav(screenId) {
    // Bottom nav items
    document.querySelectorAll('.nav-item[data-screen]').forEach(el => {
      el.classList.toggle('active', el.dataset.screen === screenId);
    });

    // Desktop nav links
    document.querySelectorAll('.desktop-nav a[data-screen]').forEach(el => {
      el.classList.toggle('active', el.dataset.screen === screenId);
    });

    // Show/hide bottom nav
    const nav = document.getElementById('bottom-nav');
    if (nav) {
      nav.style.display = SHOW_NAV.has(screenId) ? '' : 'none';
    }
  },
};

