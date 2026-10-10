/**
 * games/reaction-test.js — Reaction Test
 *
 * Wait for the green signal, then tap as fast as possible.
 * Each player takes a turn. Fastest time wins.
 */

import { ui } from '../ui.js';

export default {
  id: 'reaction-test',

  run(root, { players, ui: _ui, onComplete, onCleanup }) {
    let currentPlayerIdx = 0;
    let results = []; // { id, name, time } in ms
    let timeoutId = null;
    let startTime = null;
    let phase = 'waiting'; // waiting | ready | done

    function renderPlayerTurn() {
      const player = players[currentPlayerIdx];
      phase = 'waiting';
      startTime = null;

      root.innerHTML = `
        <div class="game-header">
          <div class="game-title-bar">
            <div class="game-round-label">Player ${currentPlayerIdx + 1} of ${players.length}</div>
            <div class="game-name">⚡ Reaction Test</div>
          </div>
        </div>
        <div class="reaction-arena">
          <div style="text-align:center">
            <div class="text-xs text-muted mb-1" style="text-transform:uppercase;letter-spacing:.1em">It's your turn</div>
            <div class="text-2xl font-black mb-4">${ui.escHtml(player.name)}</div>
          </div>

          <div id="reaction-target" class="reaction-target waiting" role="button" tabindex="0" aria-label="Wait for green then tap">
            ⏳
          </div>

          <div id="instruction" style="text-align:center">
            <p class="text-sm text-3">Tap the button when it turns green!</p>
            <p class="text-xs text-muted">Don't tap early — that's a false start!</p>
          </div>

          <button class="btn btn-primary btn-xl" id="btn-start-reaction">I'm Ready!</button>
        </div>
      `;

      root.querySelector('#btn-start-reaction')?.addEventListener('click', startCountdown);
      root.querySelector('#reaction-target')?.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') handleTap();
      });
    }

    function startCountdown() {
      const target = root.querySelector('#reaction-target');
      const instruction = root.querySelector('#instruction');
      const startBtn = root.querySelector('#btn-start-reaction');
      if (startBtn) startBtn.remove();

      phase = 'waiting';
      if (target) {
        target.textContent = '🚫';
        target.className = 'reaction-target waiting';
        target.style.cursor = 'not-allowed';
      }
      if (instruction) instruction.innerHTML = '<p class="text-sm text-3">Wait for it...</p>';

      // Random delay 1.5 – 5 seconds
      const delay = 1500 + Math.random() * 3500;
      timeoutId = setTimeout(() => {
        phase = 'ready';
        startTime = performance.now();
        if (target) {
          target.textContent = '✅';
          target.className = 'reaction-target ready';
          target.style.cursor = 'pointer';
        }
        if (instruction) instruction.innerHTML = '<p class="text-sm" style="color:var(--color-success);font-weight:800">TAP NOW!</p>';

        target?.addEventListener('click', handleTap, { once: true });
      }, delay);

      // False start detection
      target?.addEventListener('click', () => {
        if (phase === 'waiting') {
          clearTimeout(timeoutId);
          handleFalseStart();
        }
      }, { once: true });
    }

    function handleTap() {
      if (phase !== 'ready') return;
      const elapsed = Math.round(performance.now() - startTime);
      phase = 'done';
      clearTimeout(timeoutId);
      results.push({
        id:   players[currentPlayerIdx].id,
        name: players[currentPlayerIdx].name,
        time: elapsed,
      });
      renderTapResult(elapsed, false);
    }

    function handleFalseStart() {
      phase = 'done';
      results.push({
        id:   players[currentPlayerIdx].id,
        name: players[currentPlayerIdx].name,
        time: 9999, // penalty
        falseStart: true,
      });
      renderTapResult(0, true);
    }

    function renderTapResult(ms, isFalseStart) {
      const isLast = currentPlayerIdx >= players.length - 1;

      root.innerHTML = `
        <div class="ready-screen">
          <div style="font-size:3rem">${isFalseStart ? '🚨' : ms < 200 ? '⚡' : ms < 350 ? '😎' : '🙂'}</div>
          <div style="text-align:center">
            <div class="text-xs text-muted mb-1">${ui.escHtml(players[currentPlayerIdx].name)}'s time</div>
            <div class="text-4xl font-black" style="color:${isFalseStart?'var(--color-error)':ms<250?'var(--color-success)':'var(--color-text)'}">
              ${isFalseStart ? 'FALSE START!' : `${ms}ms`}
            </div>
            ${!isFalseStart ? `<div class="text-sm text-3 mt-1">${ratingText(ms)}</div>` : '<div class="text-sm text-muted mt-1">Penalty applied</div>'}
          </div>
          <button class="btn btn-primary btn-xl" id="btn-next">
            ${isLast ? 'See Results!' : `Next: ${ui.escHtml(players[currentPlayerIdx + 1].name)} →`}
          </button>
        </div>
      `;

      root.querySelector('#btn-next')?.addEventListener('click', () => {
        currentPlayerIdx++;
        if (currentPlayerIdx >= players.length) {
          finishGame();
        } else {
          renderPlayerTurn();
        }
      });
    }

    function ratingText(ms) {
      if (ms < 150) return '⚡ Superhuman!';
      if (ms < 200) return '🚀 Lightning fast!';
      if (ms < 300) return '😎 Very fast!';
      if (ms < 400) return '✅ Good!';
      if (ms < 600) return '🙂 Average';
      return '🐢 Keep practising!';
    }

    function finishGame() {
      // Sort by time (false starts get penalty 9999)
      const sorted = [...results].sort((a, b) => a.time - b.time);
      const pointMap = [10, 5, 2, 0];

      const rankings = sorted.map((r, i) => ({
        id:     r.id,
        name:   r.name,
        points: pointMap[i] ?? 0,
        isWin:  i === 0 && !r.falseStart,
      }));

      const winner = sorted[0];
      const summary = winner.falseStart
        ? 'Everyone had a false start!'
        : `${winner.name} wins with ${winner.time}ms!`;

      // Show final leaderboard
      root.innerHTML = `
        <div class="ready-screen">
          <div style="font-size:3rem">⚡</div>
          <h2 class="text-2xl font-black">Reaction Results</h2>
          <div style="width:100%;max-width:320px">
            ${sorted.map((r, i) => `
              <div class="score-row mb-2">
                <div class="score-row__rank">${['🥇','🥈','🥉'][i]||`#${i+1}`}</div>
                <div class="score-row__info">
                  <div class="score-row__name">${ui.escHtml(r.name)}</div>
                  <div class="score-row__meta">${r.falseStart ? '⚠️ False start' : `${r.time}ms`}</div>
                </div>
                <div class="score-row__points">+${pointMap[i]??0}</div>
              </div>
            `).join('')}
          </div>
          <button class="btn btn-primary btn-xl" id="btn-done">Confirm Results ✔</button>
        </div>
      `;

      root.querySelector('#btn-done')?.addEventListener('click', () => {
        onComplete({ rankings, summary });
      });
    }

    onCleanup(() => { clearTimeout(timeoutId); });
    renderPlayerTurn();
  },
};
