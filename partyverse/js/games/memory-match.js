/**
 * games/memory-match.js — Memory Match
 *
 * Players take turns flipping cards to find matching pairs.
 * Most pairs wins. 4x4 grid of 8 pairs.
 */

import { ui } from '../ui.js';

const EMOJIS = [
  '🍕','🍔','🍿','🍣','🌮','🍩','🍪','🍰',
  '🥐','🍫','🍉','🎨','⚽','🎸','🚀','🦄',
  '🐳','🐬','🦊','🐼','🐧','🐢','🦒','💎',
];

export default {
  id: 'memory-match',

  run(root, { players, ui: _ui, onComplete, onCleanup }) {
    const GRID_SIZE = 4; // 4x4 = 16 cards = 8 pairs
    const PAIRS = 8;

    const chosen = shuffleArr([...EMOJIS]).slice(0, PAIRS);
    const cards  = shuffleArr([...chosen, ...chosen]).map((emoji, i) => ({
      id: i, emoji, flipped: false, matched: false,
    }));

    let currentPlayerIdx = 0;
    let pairsFound = {};
    players.forEach(p => { pairsFound[p.id] = 0; });
    let firstFlip = null;
    let lockBoard = false;
    let moves = 0;
    let totalMatches = 0;

    function renderBoard() {
      const player = players[currentPlayerIdx];
      root.innerHTML = `
        <div class="game-header">
          <div class="game-title-bar">
            <div class="game-round-label">${ui.escHtml(player.name)}'s Turn</div>
            <div class="game-name">🧠 Memory Match</div>
          </div>
          <div style="text-align:center;padding:.5rem">
            <div class="text-xs text-muted">Matches</div>
            <div class="text-xl font-black" style="color:var(--color-primary)">${totalMatches}/${PAIRS}</div>
          </div>
        </div>

        <div class="game-area">
          <div style="display:flex;gap:.5rem;flex-wrap:wrap;justify-content:center;margin-bottom:1rem">
            ${players.map((p, i) => `
              <div class="flex items-center gap-2 ${p.id===player.id?'font-bold':'text-3'}" style="font-size:.85rem">
                <div style="width:8px;height:8px;border-radius:50%;background:${ui.avatarColor(i).bg}"></div>
                ${ui.escHtml(p.name)}: <strong>${pairsFound[p.id]}</strong>
              </div>
            `).join('')}
          </div>

          <div
            class="memory-grid"
            style="grid-template-columns:repeat(${GRID_SIZE},1fr);max-width:${GRID_SIZE*80}px"
            id="memory-grid"
          >
            ${cards.map((card) => `
              <button
                class="memory-card ${card.flipped||card.matched?'flipped':''} ${card.matched?'matched':''}"
                data-id="${card.id}"
                aria-label="${card.matched || card.flipped ? card.emoji : 'Hidden card'}"
                ${card.matched || lockBoard ? 'disabled' : ''}
              >
                ${card.flipped || card.matched ? card.emoji : ''}
              </button>
            `).join('')}
          </div>

          <div class="text-xs text-muted text-center mt-3">Total Moves: ${moves}</div>
        </div>
      `;

      root.querySelectorAll('.memory-card:not([disabled])').forEach(btn => {
        btn.addEventListener('click', () => {
          if (lockBoard) return;
          const id = parseInt(btn.dataset.id, 10);
          const card = cards[id];
          if (card.flipped || card.matched) return;

          card.flipped = true;
          moves++;
          renderBoard();

          if (!firstFlip) {
            firstFlip = card;
          } else {
            lockBoard = true;
            if (firstFlip.emoji === card.emoji && firstFlip.id !== card.id) {
              setTimeout(() => {
                firstFlip.matched = true;
                card.matched = true;
                firstFlip.flipped = false;
                card.flipped = false;
                pairsFound[player.id]++;
                totalMatches++;
                firstFlip = null;
                lockBoard = false;

                if (totalMatches >= PAIRS) {
                  renderBoard();
                  setTimeout(finishGame, 600);
                } else {
                  renderBoard();
                }
              }, 600);
            } else {
              setTimeout(() => {
                firstFlip.flipped = false;
                card.flipped = false;
                firstFlip = null;
                lockBoard = false;

                currentPlayerIdx = (currentPlayerIdx + 1) % players.length;
                renderBoard();
              }, 800);
            }
          }
        });
      });
    }

    function finishGame() {
      const sorted = players
        .map(p => ({ id: p.id, name: p.name, pairs: pairsFound[p.id] }))
        .sort((a, b) => b.pairs - a.pairs);

      const pointMap = [10, 5, 2, 0];
      const rankings = sorted.map((p, i) => ({
        id: p.id, name: p.name, points: pointMap[i] ?? 0, isWin: i === 0 && p.pairs > 0,
      }));

      root.innerHTML = `
        <div class="ready-screen">
          <div style="font-size:3rem">🧠</div>
          <h2 class="text-2xl font-black">All Pairs Found!</h2>
          <div style="width:100%;max-width:300px">
            ${sorted.map((p, i) => `
              <div class="score-row mb-2">
                <div class="score-row__rank">${['🥇','🥈','🥉'][i]||`#${i+1}`}</div>
                <div class="score-row__info">
                  <div class="score-row__name">${ui.escHtml(p.name)}</div>
                  <div class="score-row__meta">${p.pairs} pair${p.pairs!==1?'s':''} found</div>
                </div>
                <div class="score-row__points">+${pointMap[i]??0}</div>
              </div>
            `).join('')}
          </div>
          <p class="text-sm text-3">Total moves: ${moves}</p>
          <button class="btn btn-primary btn-xl" id="btn-done">Confirm Results ✔</button>
        </div>
      `;

      root.querySelector('#btn-done')?.addEventListener('click', () => {
        onComplete({
          rankings,
          summary: `${sorted[0].name} won with ${sorted[0].pairs} matching pairs!`,
        });
      });
    }

    function shuffleArr(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }

    onCleanup(() => {});
    renderBoard();
  },
};

