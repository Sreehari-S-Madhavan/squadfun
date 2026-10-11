/**
 * games/word-bomb.js — Word Bomb
 *
 * Players take turns. A 2-3 letter combination is shown.
 * The current player must say a word containing that combo before the timer runs out.
 * If they fail, they're eliminated. Last player standing wins.
 */

import { Timer } from '../timer.js';
import { ui }    from '../ui.js';

const SYLLABLES = [
  'an','at','be','ca','ch','de','di','do','ea','en',
  'er','es','fi','go','ha','he','hi','ho','in','is',
  'it','la','le','li','ma','me','mi','mo','na','ne',
  'no','of','on','or','out','pa','pe','ph','pl','pr',
  're','sa','se','sh','si','so','st','ta','te','th',
  'ti','to','tr','un','up','ur','us','ve','wa','we',
  'wh','wi','wo','yo','ar','ck','ful','ing','ion','ish',
  'ld','ll','ly','nd','ng','nt','ous','rd','ry','ss',
  'str','tion','ble','ght','pre','spr','tch',
];

const TIMER_SECONDS = 6; // 6 seconds per turn

export default {
  id: 'word-bomb',

  run(root, { players, ui: _ui, onComplete, onCleanup, Timer: TimerClass }) {
    let activePlayers = players.map(p => ({ ...p, lives: 3 }));
    let currentIdx = 0;
    let usedWords = new Set();
    let currentSyllable = '';
    let timer = null;
    let roundNum = 1;

    function nextSyllable() {
      return SYLLABLES[Math.floor(Math.random() * SYLLABLES.length)];
    }

    function renderTurn() {
      if (activePlayers.length <= 1) {
        finishGame();
        return;
      }

      if (currentIdx >= activePlayers.length) currentIdx = 0;
      const player = activePlayers[currentIdx];
      currentSyllable = nextSyllable();

      if (timer) { timer.destroy(); timer = null; }

      root.innerHTML = `
        <div class="game-header">
          <div class="game-title-bar">
            <div class="game-round-label">Turn ${roundNum} · ${activePlayers.length} players remain</div>
            <div class="game-name">💣 Word Bomb</div>
          </div>
          <div class="timer-ring-wrap">
            <svg class="timer-ring" width="80" height="80" viewBox="0 0 80 80">
              <circle class="timer-ring__bg" cx="40" cy="40" r="34"/>
              <circle class="timer-ring__fg" id="timer-fg" cx="40" cy="40" r="34"
                stroke-dasharray="213.6" stroke-dashoffset="0"/>
            </svg>
            <div class="timer-value" id="timer-val">${TIMER_SECONDS}</div>
          </div>
        </div>

        <div class="word-bomb-area">
          <div style="text-align:center">
            <div class="text-xs text-muted mb-1" style="text-transform:uppercase;letter-spacing:.1em">Current player</div>
            <div class="text-xl font-black mb-1">${ui.escHtml(player.name)}</div>
            <div style="display:flex;gap:.3rem;justify-content:center">
              ${'❤️'.repeat(player.lives)}${'🖤'.repeat(3 - player.lives)}
            </div>
          </div>

          <div class="word-bomb-display" id="syllable-display">${ui.escHtml(currentSyllable.toUpperCase())}</div>

          <p class="text-sm text-3">Say a word containing <strong>${ui.escHtml(currentSyllable.toUpperCase())}</strong></p>

          <div class="word-bomb-input-wrap">
            <input
              class="word-bomb-input" id="word-input"
              type="text" placeholder="Type word..."
              autocomplete="off" autocorrect="off" spellcheck="false"
              maxlength="30"
            />
            <button class="btn btn-primary" id="btn-submit">✓</button>
          </div>

          <div style="display:flex;flex-direction:column;gap:.5rem;width:100%;max-width:320px">
            <button class="btn btn-success btn-sm btn-full" id="btn-said-aloud">🗣️ Said Aloud Correctly</button>
            <button class="btn btn-ghost btn-sm btn-full" id="btn-boom">💥 Time / Boom!</button>
          </div>

          <div class="card" style="width:100%;max-width:320px">
            <div class="text-xs text-muted mb-2">Players Remaining</div>
            ${activePlayers.map((p) => `
              <div class="flex items-center gap-2 mb-1 ${p.id===player.id?'font-bold':''}">
                <div style="flex:1;font-size:.85rem">${ui.escHtml(p.name)}${p.id===player.id?' ◄':''}</div>
                <div style="font-size:.9rem">${'❤️'.repeat(p.lives)}${'🖤'.repeat(3-p.lives)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      const input = root.querySelector('#word-input');
      input?.focus();

      timer = new TimerClass(TIMER_SECONDS,
        (rem, frac) => {
          const val = root.querySelector('#timer-val');
          const fg  = root.querySelector('#timer-fg');
          if (val) val.textContent = rem;
          if (fg) {
            fg.style.strokeDashoffset = 213.6 * frac;
            fg.className = 'timer-ring__fg' + (rem <= 2 ? ' danger' : rem <= 4 ? ' warning' : '');
          }
          if (rem <= 2) {
            const disp = root.querySelector('#syllable-display');
            if (disp) disp.style.animation = 'shake .3s ease infinite';
          }
        },
        () => {
          handleBoom();
        }
      );
      timer.start();

      function submitWord(customWord) {
        const word = (customWord || input?.value || '').trim().toLowerCase();
        if (!word) return;

        if (!word.includes(currentSyllable.toLowerCase())) {
          input.classList.add('error');
          input.value = '';
          input.placeholder = `Must contain "${currentSyllable.toUpperCase()}"!`;
          setTimeout(() => {
            input?.classList.remove('error');
            if (input) input.placeholder = 'Type word...';
          }, 1000);
          return;
        }

        if (usedWords.has(word)) {
          input.classList.add('error');
          input.value = '';
          input.placeholder = 'Already used!';
          setTimeout(() => {
            input?.classList.remove('error');
            if (input) input.placeholder = 'Type word...';
          }, 1000);
          return;
        }

        usedWords.add(word);
        timer?.pause();

        input?.classList.add('success');
        const syllEl = root.querySelector('#syllable-display');
        if (syllEl) {
          syllEl.style.background = 'rgba(16,185,129,0.2)';
          syllEl.style.borderColor = 'rgba(16,185,129,0.5)';
          syllEl.style.color = 'var(--color-success)';
        }

        setTimeout(() => {
          currentIdx = (currentIdx + 1) % activePlayers.length;
          roundNum++;
          renderTurn();
        }, 500);
      }

      function handleBoom() {
        timer?.destroy();
        const p = activePlayers[currentIdx];
        p.lives--;

        if (p.lives <= 0) {
          activePlayers.splice(currentIdx, 1);
          if (currentIdx >= activePlayers.length) currentIdx = 0;
        } else {
          currentIdx = (currentIdx + 1) % activePlayers.length;
        }
        roundNum++;

        root.innerHTML = `
          <div class="ready-screen" style="min-height:400px">
            <div style="font-size:5rem;animation:shake .3s ease 3">💥</div>
            <div class="text-2xl font-black">${ui.escHtml(p.name)} lost a life!</div>
            <div style="font-size:1.5rem">${'❤️'.repeat(Math.max(0, p.lives))}${'🖤'.repeat(Math.min(3, 3 - p.lives))}</div>
            ${p.lives <= 0 ? `<div class="text-sm font-bold" style="color:var(--color-accent)">${ui.escHtml(p.name)} is eliminated!</div>` : ''}
          </div>
        `;

        setTimeout(() => {
          if (activePlayers.length <= 1) finishGame();
          else renderTurn();
        }, 1200);
      }

      root.querySelector('#btn-submit')?.addEventListener('click', () => submitWord());
      input?.addEventListener('keydown', e => { if (e.key === 'Enter') submitWord(); });
      root.querySelector('#btn-said-aloud')?.addEventListener('click', () => {
        // Generates valid word matching syllable
        submitWord(currentSyllable.toLowerCase() + 'ing');
      });
      root.querySelector('#btn-boom')?.addEventListener('click', () => {
        timer?.pause();
        handleBoom();
      });
    }

    function finishGame() {
      timer?.destroy();

      const allPlayers = [...players];
      const surviving = activePlayers;
      const eliminated = allPlayers.filter(p => !surviving.find(s => s.id === p.id));

      const pointMap = [10, 5, 2, 0];
      const sortedSurvivors = surviving.sort((a, b) => b.lives - a.lives);

      const rankings = [
        ...sortedSurvivors.map((p, i) => ({
          id: p.id, name: p.name, points: pointMap[i] ?? 0, isWin: i === 0,
        })),
        ...eliminated.map(p => ({
          id: p.id, name: p.name, points: 0, isWin: false,
        })),
      ];

      const winner = sortedSurvivors[0] || allPlayers[0];
      root.innerHTML = `
        <div class="ready-screen">
          <div style="font-size:3rem">🎉</div>
          <h2 class="text-2xl font-black">${ui.escHtml(winner?.name || 'Winner')} Wins!</h2>
          <div style="width:100%;max-width:320px">
            ${rankings.map((r, i) => `
              <div class="score-row mb-2">
                <div class="score-row__rank">${['🥇','🥈','🥉'][i]||`#${i+1}`}</div>
                <div class="score-row__info"><div class="score-row__name">${ui.escHtml(r.name)}</div></div>
                <div class="score-row__points">+${r.points}</div>
              </div>
            `).join('')}
          </div>
          <button class="btn btn-primary btn-xl" id="btn-done">Confirm ✔</button>
        </div>
      `;

      root.querySelector('#btn-done')?.addEventListener('click', () => {
        onComplete({
          rankings,
          summary: `${winner?.name} survived the word bomb!`,
        });
      });
    }

    onCleanup(() => { timer?.destroy(); });
    renderTurn();
  },
};

