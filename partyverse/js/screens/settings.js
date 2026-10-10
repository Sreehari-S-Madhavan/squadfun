/**
 * screens/settings.js — Settings and Reset screen
 */

import { storage } from '../storage.js';
import { ui }      from '../ui.js';
import { router }  from '../router.js';

export function renderSettings(root) {
  const settings = storage.getSettings();

  root.innerHTML = `
    <div class="screen">
      <h1 class="screen-title">⚙️ Settings</h1>
      <p class="screen-subtitle">Preferences and data management</p>

      <div class="settings-section">
        <div class="settings-section-title">App</div>
        <div class="settings-list">
          <div class="settings-item" id="item-offline">
            <div class="settings-item__icon">📡</div>
            <div class="settings-item__info">
              <div class="settings-item__label">Offline Status</div>
              <div class="settings-item__desc" id="offline-status-desc">Checking…</div>
            </div>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section-title">Data</div>
        <div class="settings-list">
          <div class="settings-item" id="item-export">
            <div class="settings-item__icon">📤</div>
            <div class="settings-item__info">
              <div class="settings-item__label">Export Debug Data</div>
              <div class="settings-item__desc">Copy all local storage data to clipboard</div>
            </div>
            <span class="settings-item__chevron">›</span>
          </div>
          <div class="settings-item danger" id="item-reset-tournament">
            <div class="settings-item__icon">🗑️</div>
            <div class="settings-item__info">
              <div class="settings-item__label">Clear Tournament Data</div>
              <div class="settings-item__desc">Removes current tournament and scores. Keeps player names.</div>
            </div>
            <span class="settings-item__chevron">›</span>
          </div>
          <div class="settings-item danger" id="item-reset-all">
            <div class="settings-item__icon">⚠️</div>
            <div class="settings-item__info">
              <div class="settings-item__label">Factory Reset</div>
              <div class="settings-item__desc">Removes ALL data including player names and settings.</div>
            </div>
            <span class="settings-item__chevron">›</span>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section-title">About</div>
        <div class="card">
          <div class="flex items-center gap-3 mb-3">
            <span style="font-size:2rem">🎮</span>
            <div>
              <div class="font-bold">PartyVerse</div>
              <div class="text-xs text-3">Version 1.0.0 · Stage 1</div>
            </div>
          </div>
          <p class="text-xs text-3" style="line-height:1.6">
            A mobile-first party game platform for groups. Play together on one shared device.
            No internet required after first load.
          </p>
          <div class="divider"></div>
          <div class="text-xs text-muted">
            8 of 24 games implemented · Offline-first PWA
          </div>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section-title">How to Play Offline</div>
        <div class="card" style="background:var(--color-bg-3)">
          <ol style="list-style:decimal;padding-left:1.25rem;display:flex;flex-direction:column;gap:.5rem">
            <li class="text-sm text-3">Open the app once while online</li>
            <li class="text-sm text-3">Wait for "Cached ✓" to appear in the header</li>
            <li class="text-sm text-3">Turn off Wi-Fi and mobile data</li>
            <li class="text-sm text-3">Reload the page — it should work offline!</li>
          </ol>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section-title">Add to Home Screen</div>
        <div class="card" style="background:var(--color-bg-3)">
          <p class="text-sm text-3 mb-3">Install PartyVerse as an app for the best experience:</p>
          <ul style="list-style:disc;padding-left:1.25rem;display:flex;flex-direction:column;gap:.5rem">
            <li class="text-sm text-3"><strong>iOS Safari:</strong> Tap Share → Add to Home Screen</li>
            <li class="text-sm text-3"><strong>Android Chrome:</strong> Tap Menu → Add to Home Screen</li>
            <li class="text-sm text-3"><strong>Desktop Chrome:</strong> Click install icon in address bar</li>
          </ul>
        </div>
      </div>
    </div>
  `;

  // Update offline status
  const offlineDesc = root.querySelector('#offline-status-desc');
  if (offlineDesc) {
    if (!navigator.onLine) {
      offlineDesc.textContent = '🔴 Offline — using cached version';
    } else if (navigator.serviceWorker?.controller) {
      offlineDesc.textContent = '🟡 Online and cached — ready for offline use';
    } else {
      offlineDesc.textContent = '🟢 Online — visit once to enable offline mode';
    }
  }

  // Export debug data
  root.querySelector('#item-export')?.addEventListener('click', () => {
    const data = storage.export();
    const text = JSON.stringify(data, null, 2);
    navigator.clipboard?.writeText(text).then(() => {
      ui.toast('Debug data copied to clipboard!', 'success');
    }).catch(() => {
      // Fallback: show in modal
      ui.openModal(`
        <h2 class="modal-title">Debug Data</h2>
        <textarea style="width:100%;height:200px;background:var(--color-bg-3);border:1px solid var(--color-border);border-radius:8px;padding:.75rem;color:var(--color-text);font-size:.75rem;font-family:monospace;resize:vertical">${text}</textarea>
        <div class="modal-actions mt-4">
          <button class="btn btn-primary btn-full" onclick="document.getElementById('modal-overlay').hidden=true">Close</button>
        </div>
      `);
    });
  });

  // Reset tournament
  root.querySelector('#item-reset-tournament')?.addEventListener('click', async () => {
    const ok = await ui.confirm({
      title: 'Clear Tournament Data?',
      body: 'This will remove the current tournament, all round results, and scores. Player names will be kept.',
      confirmText: 'Clear',
      danger: true,
    });
    if (ok) {
      storage.resetTournament();
      ui.toast('Tournament data cleared.', 'success');
    }
  });

  // Full reset
  root.querySelector('#item-reset-all')?.addEventListener('click', async () => {
    const ok = await ui.confirm({
      title: '⚠️ Factory Reset?',
      body: 'This will permanently delete ALL data including player names, settings, and tournament history. This cannot be undone.',
      confirmText: 'Reset Everything',
      danger: true,
    });
    if (ok) {
      storage.resetAll();
      ui.toast('All data cleared. Starting fresh.', 'success');
      setTimeout(() => router.navigate('home'), 800);
    }
  });
}

