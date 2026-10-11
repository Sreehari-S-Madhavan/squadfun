/**
 * games/snakes-ladders.js — Snakes & Ladders
 *
 * Classic 10x10 board race. Roll dice, avoid snakes, climb ladders.
 * First to reach square 100 wins.
 */

import { ui } from '../ui.js';

const SNAKES = {
  99: 7,  95: 13, 92: 25, 89: 68, 74: 53, 62: 19, 64: 60, 49: 11, 46: 25, 16: 6,
};

const LADDERS = {
  4: 14, 9: 31, 20: 38, 28: 84, 40: 59, 51: 67, 63: 81, 71: 91,
};

const PLAYER_EMOJIS = ['🔵','🔴','🟢','🟡','🟣','🟠','⚪','🟤'];

export default {
  id: 'snakes-ladders',

  run(root, { players, ui: _ui, onComplete, onCleanup }) {
    const activePlayers = players.slice(0, 8).map((p, i) => ({
      ...p,
      pos:   0,
      emoji: PLAYER_EMOJIS[i % PLAYER_EMOJIS.length],
      color: ui.avatarColor(i).bg,
    }));

    let currentIdx = 0;
    let diceValue  = null;
    let lastMsg    = 'Tap Roll Dice to begin!';
    let rolling    = false;
    let winner     = null;

    function cellNumber(row, col) {
      const rowFromBottom = 9 - row;
      if (rowFromBottom % 2 === 0) {
        return rowFromBottom * 10 + col + 1;
      } else {
        return rowFromBottom * 10 + (9 - col) + 1;
      }
    }

    function renderBoard() {
      const player = activePlayers[currentIdx];
      root.innerHTML = `
        <div class="game-header">
          <div class="game-title-bar">
            <div class="game-round-label">${ui.escHtml(player.name)}'s Turn</div>
            <div class="game-name">🐍 Snakes & Ladders</div>
          </div>
        </div>

        <div class="game-area" style="padding:.5rem">
          <div class="sl-board" id="sl-board">
            ${Array.from({length:10}).map((_, row) =>
              Array.from({length:10}).map((_, col) => {
                const num = cellNumber(row, col);
                const hasSnake  = SNAKES[num] !== undefined;
                const hasLadder = LADDERS[num] !== undefined;
                const playersHere = activePlayers.filter(p => p.pos === num);

                return `
                  <div class="sl-cell ${hasSnake?'has-snake':''} ${hasLadder?'has-ladder':''} ${playersHere.length?'has-player':''}" title="${num}${hasSnake?` 🐍→${SNAKES[num]}`:''}${hasLadder?` 🪜→${LADDERS[num]}`:''}">
                    <span style="position:absolute;top:1px;left:2px;font-size:7px;color:var(--color-text-muted)">${num}</span>
                    ${hasSnake  ? '<span style="position:absolute;font-size:.55rem">🐍</span>' : ''}
                    ${hasLadder ? '<span style="position:absolute;font-size:.55rem">🪜</span>' : ''}
                    ${playersHere.map(p => `<span class="sl-token" style="background:${p.color}">${p.emoji}</span>`).join('')}
                  </div>
                `;
              }).join('')
            ).join('')}
          </div>

          ${lastMsg ? `<div class="text-sm text-center mt-2" style="font-weight:700;color:var(--color-gold)">${ui.escHtml(lastMsg)}</div>` : ''}

          <div class="card mt-3">
            <div class="flex gap-2 flex-wrap mb-3">
              ${activePlayers.map(p => `
                <div class="flex items-center gap-1" style="font-size:.8rem;${p.id===player.id?'font-weight:800;color:var(--color-primary)':'color:var(--color-text-3)'}">
                  ${p.emoji} ${ui.escHtml(p.name)}: ${p.pos}/100
                </div>
              `).join('')}
            </div>

            <button class="btn btn-primary btn-full btn-lg" id="btn-roll" ${rolling||winner?'disabled':''}>
              ${diceValue !== null ? `🎲 Roll for ${ui.escHtml(player.name)}` : `🎲 ${ui.escHtml(player.name)}'s Roll`}
            </button>
          </div>
        </div>
      `;

      root.querySelector('#btn-roll')?.addEventListener('click', rollDice);
    }

    function rollDice() {
      if (rolling || winner) return;
      rolling = true;
      diceValue = Math.floor(Math.random() * 6) + 1;

      const player = activePlayers[currentIdx];
      let newPos = player.pos + diceValue;

      if (newPos > 100) {
        lastMsg = `Rolled ${diceValue}! Must reach 100 exactly. Stays at ${player.pos}.`;
        rolling = false;
        currentIdx = (currentIdx + 1) % activePlayers.length;
        renderBoard();
        return;
      }

      player.pos = newPos;

      if (SNAKES[newPos] !== undefined) {
        const snakeEnd = SNAKES[newPos];
        lastMsg = `🐍 Snake bite! ${player.name} slides from ${newPos} to ${snakeEnd}!`;
        player.pos = snakeEnd;
      } else if (LADDERS[newPos] !== undefined) {
        const ladderTop = LADDERS[newPos];
        lastMsg = `🪜 Ladder climb! ${player.name} jumps from ${newPos} to ${ladderTop}!`;
        player.pos = ladderTop;
      } else {
        lastMsg = `${player.name} rolled ${diceValue} and advanced to square ${newPos}.`;
      }

      if (player.pos >= 100) {
        player.pos = 100;
        winner = player;
        lastMsg = `🎉 ${player.name} reached 100 and WINS!`;
        rolling = false;
        renderBoard();
        setTimeout(finishGame, 1500);
        return;
      }

      rolling = false;
      currentIdx = (currentIdx + 1) % activePlayers.length;
      renderBoard();
    }

    function finishGame() {
      const sorted = [...activePlayers].sort((a, b) => b.pos - a.pos);
      const pointMap = [10, 5, 2, 0];
      const rankings = sorted.map((p, i) => ({
        id: p.id, name: p.name, points: pointMap[i] ?? 0, isWin: p.pos === 100,
      }));

      root.innerHTML = `
        <div class="ready-screen">
          <div style="font-size:3rem">🎉</div>
          <h2 class="text-2xl font-black">${ui.escHtml(winner?.name)} Wins!</h2>
          <div style="width:100%;max-width:300px">
            ${sorted.map((p, i) => `
              <div class="score-row mb-2">
                <div class="score-row__rank">${['🥇','🥈','🥉'][i]||`#${i+1}`}</div>
                <div class="score-row__info">
                  <div class="score-row__name">${p.emoji} ${ui.escHtml(p.name)}</div>
                  <div class="score-row__meta">Square: ${p.pos}/100</div>
                </div>
                <div class="score-row__points">+${pointMap[i]??0}</div>
              </div>
            `).join('')}
          </div>
          <button class="btn btn-primary btn-xl" id="btn-done">Confirm Results ✔</button>
        </div>
      `;

      root.querySelector('#btn-done')?.addEventListener('click', () => {
        onComplete({
          rankings,
          summary: `${winner?.name} climbed to 100 first!`,
        });
      });
    }

    onCleanup(() => {});
    renderBoard();
  },
};

