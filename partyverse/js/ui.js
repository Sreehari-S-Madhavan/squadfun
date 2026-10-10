/**
 * ui.js — Shared UI utilities
 *
 * toast()  — ephemeral notification banners
 * modal()  — bottom-sheet confirmation dialogs
 * confirm()— promise-based confirm dialog
 * avatar() — deterministic player avatar colors
 */

// ── Player Colors ─────────────────────────────────────────────
const AVATAR_COLORS = [
  { bg: '#7c3aed', text: '#fff' }, // purple
  { bg: '#f43f5e', text: '#fff' }, // coral
  { bg: '#0ea5e9', text: '#fff' }, // sky
  { bg: '#10b981', text: '#fff' }, // emerald
  { bg: '#f59e0b', text: '#000' }, // amber
  { bg: '#ec4899', text: '#fff' }, // pink
  { bg: '#14b8a6', text: '#fff' }, // teal
  { bg: '#6366f1', text: '#fff' }, // indigo
  { bg: '#ef4444', text: '#fff' }, // red
  { bg: '#84cc16', text: '#000' }, // lime
  { bg: '#8b5cf6', text: '#fff' }, // violet
  { bg: '#f97316', text: '#fff' }, // orange
];

export const ui = {
  // ── Toasts ──────────────────────────────────────────────────
  /**
   * @param {string} message
   * @param {'success'|'error'|'warning'|'info'} type
   * @param {number} duration ms
   */
  toast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };

    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `
      <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
      <span class="toast-msg">${escHtml(message)}</span>
    `;
    container.appendChild(el);

    const remove = () => {
      el.classList.add('exit');
      el.addEventListener('animationend', () => el.remove(), { once: true });
    };

    const timer = setTimeout(remove, duration);
    el.addEventListener('click', () => { clearTimeout(timer); remove(); });
  },

  // ── Modal ────────────────────────────────────────────────────
  /**
   * Opens the global modal with arbitrary HTML content.
   * Returns a cleanup function.
   */
  openModal(html) {
    const overlay = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-content');
    if (!overlay || !content) return () => {};

    content.innerHTML = html;
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';

    return () => this.closeModal();
  },

  closeModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.hidden = true;
    document.body.style.overflow = '';
  },

  /**
   * Promise-based confirm dialog.
   * Resolves true on confirm, false on cancel/close.
   */
  confirm({ title, body, confirmText = 'Confirm', cancelText = 'Cancel', danger = false }) {
    return new Promise((resolve) => {
      const html = `
        <h2 class="modal-title">${escHtml(title)}</h2>
        <p class="modal-body">${escHtml(body)}</p>
        <div class="modal-actions">
          <button class="btn btn-ghost" id="modal-cancel">${escHtml(cancelText)}</button>
          <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="modal-confirm">${escHtml(confirmText)}</button>
        </div>
      `;

      this.openModal(html);

      const overlay = document.getElementById('modal-overlay');
      const confirmBtn = document.getElementById('modal-confirm');
      const cancelBtn  = document.getElementById('modal-cancel');

      const done = (val) => {
        this.closeModal();
        resolve(val);
      };

      confirmBtn?.addEventListener('click', () => done(true),  { once: true });
      cancelBtn?.addEventListener('click',  () => done(false), { once: true });
      overlay?.addEventListener('click', (e) => {
        if (e.target === overlay) done(false);
      }, { once: true });
    });
  },

  // ── Avatar ───────────────────────────────────────────────────
  /** Returns { bg, text } for a given player index */
  avatarColor(index) {
    return AVATAR_COLORS[index % AVATAR_COLORS.length];
  },

  /** Renders an avatar circle with the first letter of the name */
  avatarHtml(name, index, size = 40) {
    const { bg, text } = this.avatarColor(index);
    const letter = (name || '?')[0].toUpperCase();
    return `<div class="player-chip__avatar" style="background:${bg};color:${text};width:${size}px;height:${size}px;font-size:${size * 0.4}px">${letter}</div>`;
  },

  // ── Misc ─────────────────────────────────────────────────────
  /** Escape HTML for safe insertion */
  escHtml,

  /** Format seconds as mm:ss */
  formatTime(seconds) {
    const m = Math.floor(Math.abs(seconds) / 60);
    const s = Math.abs(seconds) % 60;
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  },

  /** Ordinal suffix: 1 → "1st", 2 → "2nd" */
  ordinal(n) {
    const s = ['th','st','nd','rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  },

  /** Show a loading screen in root */
  showLoading(root, msg = 'Loading…') {
    root.innerHTML = `
      <div class="loading-screen">
        <div class="spinner"></div>
        <p class="text-muted">${escHtml(msg)}</p>
      </div>`;
  },
};

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

