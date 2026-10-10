/**
 * app.js — Bootstrap / entry point
 * Initialises storage, registers the service worker, starts the router,
 * and wires up global UI (offline badge, toast, modal, update banner).
 */

import { router } from './router.js';
import { storage } from './storage.js';
import { ui } from './ui.js';

// ── Boot ─────────────────────────────────────────────────────
async function boot() {
  // 1. Initialise storage (schema migration if needed)
  await storage.init();

  // 2. Register service worker
  await registerSW();

  // 3. Wire online/offline badge
  wireOfflineBadge();

  // 4. Wire modal close button
  wireModal();

  // 5. Wire update banner
  wireUpdateBanner();

  // 6. Start router (reads current hash)
  router.init();

  console.log('[PartyVerse] Boot complete');
}

// ── Service Worker ────────────────────────────────────────────
let _pendingSW = null;

async function registerSW() {
  if (!('serviceWorker' in navigator)) return;

  try {
    const reg = await navigator.serviceWorker.register('./sw.js', { scope: './' });

    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New SW ready — show update banner
          _pendingSW = newWorker;
          document.getElementById('update-banner').hidden = false;
        }
      });
    });

    // Track SW-controlled status for offline badge
    if (reg.active) {
      markCacheReady(true);
    }

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      markCacheReady(true);
    });

    console.log('[SW] Registered');
  } catch (err) {
    console.warn('[SW] Registration failed:', err);
  }
}

function wireUpdateBanner() {
  const btn = document.getElementById('btn-update');
  if (!btn) return;

  btn.addEventListener('click', () => {
    if (_pendingSW) {
      _pendingSW.postMessage({ type: 'SKIP_WAITING' });
    }
    // Reload after a tick
    setTimeout(() => window.location.reload(), 100);
  });
}

// ── Offline Badge ─────────────────────────────────────────────
let _cacheReady = false;

function wireOfflineBadge() {
  updateBadge();
  window.addEventListener('online',  updateBadge);
  window.addEventListener('offline', updateBadge);
}

function markCacheReady(ready) {
  _cacheReady = ready;
  updateBadge();
}

function updateBadge() {
  const badge = document.getElementById('offline-badge');
  const label = document.getElementById('offline-label');
  if (!badge || !label) return;

  badge.classList.remove('is-online', 'is-offline', 'is-ready');

  if (!navigator.onLine) {
    badge.classList.add('is-offline');
    label.textContent = 'Offline';
    badge.title = _cacheReady
      ? 'You are offline. Cached app is available.'
      : 'You are offline. App not fully cached yet.';
  } else if (_cacheReady) {
    badge.classList.add('is-ready');
    label.textContent = 'Cached ✓';
    badge.title = 'Online and cached for offline use';
  } else {
    badge.classList.add('is-online');
    label.textContent = 'Online';
    badge.title = 'Connected. Visit once to enable offline mode.';
  }
}

// ── Modal ─────────────────────────────────────────────────────
function wireModal() {
  const overlay = document.getElementById('modal-overlay');
  const closeBtn = document.getElementById('modal-close');

  closeBtn?.addEventListener('click', () => ui.closeModal());

  overlay?.addEventListener('click', (e) => {
    if (e.target === overlay) ui.closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') ui.closeModal();
  });
}

// ── Kick off ──────────────────────────────────────────────────
boot().catch(console.error);

