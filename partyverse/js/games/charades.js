/**
 * games/charades.js — Charades game
 *
 * One player acts out a word/phrase silently. Others guess.
 * Players take turns. Timer per turn. Score for each correct guess.
 */

import { Timer } from '../timer.js';
import { ui }    from '../ui.js';

// Import prompt data inline (no external fetch needed)
const CHARADES_DATA = {
  easy: [
    'Dog','Cat','Fish','Tree','Sun','Moon','Car','Book','Phone','Chair',
    'Ball','Hat','Bird','Boat','Rain','Snow','Fire','River','House','Pizza',
    'Guitar','Dance','Run','Jump','Sleep','Cook','Swim','Fly','Laugh','Cry',
  ],
  medium: [
    'Rollercoaster','Thunderstorm','Photograph','Basketball','Volcano','Earthquake',
    'Helicopter','Submarine','Astronaut','Firefighter','Saxophone','Waterfall',
    'Surfing','Yoga','Karate','Bowling','Skateboard','Trampoline','Parachute',
    'Robot','Ninja','Pirate','Wizard','Dragon','Unicorn','Zombie','Vampire',
  ],
  hard: [
    'Quantum physics','Climate change','Democracy','Photosynthesis','Gravity',
    'Evolution','Revolution','Renaissance','Architecture','Philosophy',
    'Procrastination','Civilization','Imagination','Determination','Inspiration',
    'Global warming','Solar system','Stock market','Time machine','Parallel universe',
  ],
};

const TIMER_SECONDS = 60;

export default {
  id: 'charades',

  run(root, { players, ui: _ui, onComplete, onCleanup, Timer: TimerClass }) {
    let difficulty = 'medium';
    let currentPlayerIdx = 0;
    let scores = {};
    players.forEach(p => { scores[p.id] = 0; });
    let totalRounds = players.length; // one turn each
    let roundsDone  = 0;
    let currentWord = '';
    let timer = null;
    let phase = 'setup'; // setup | acting | result | gameover

    function getWord() {
      const pool = CHARADES_DATA[difficulty];
      return pool[Math.floor(Math.random() * pool.length)];
    }

    function shuffle(arr) {
      const a = [...arr];
      for (let i = a.length-1; i>0; i--) {
        const j = Math.floor(Math.random()*(i+1));
        [a[i],a[j]] = [a[j],a[i]];
      }
      return a;
    }

    function renderSetup() {
      phase = 'setup';
      const player = players[currentPlayerIdx];
      const color  = ui.avatarColor(currentPlayerIdx);

      root.innerHTML = `
        <div class="game-header">
          <div class="game-title-bar">
            <div class="game-round-label">Round ${roundsDone + 1} of ${totalRounds}</div>
            <div class="game-name">🎭 Charades</div>
          </div>
        </div>
        <div class="ready-screen">
          <div style="font-size:3rem">🎭</div>
          <div>
            <div class="text-xs text-muted mb-1" style="text-transform:uppercase;letter-spacing:.1em">It's your turn</div>
            <div class="text-2xl font-black">${ui.escHtml(player.name)}</div>
          </div>
          <div class="card" style="width:100%;max-width:320px">
            <div class="form-label">Difficulty</div>
            <div class="seg-control">
              ${['easy','medium','hard'].map(d => `
                <button class="seg-btn ${difficulty===d?'active':''}" data-diff="${d}">${d.charAt(0).toUpperCase()+d.slice(1)}</button>
              `).join('')}
            </div>
          </div>
          <div>
            <button class="btn btn-primary btn-xl" id="btn-show-word">Show My Word 👀</button>
            <p class="text-xs text-muted mt-2">Only ${ui.escHtml(player.name)} should look!</p>
          </div>
        </div>
      `;

      root.querySelectorAll('.seg-btn[data-diff]').forEach(btn => {
        btn.addEventListener('click', () => { difficulty = btn.dataset.diff; renderSetup(); });
      });

      root.querySelector('#btn-show-word')?.addEventListener('click', () => {
        currentWord = getWord();
        renderActing();
      });
    }

    function renderActing() {
      phase = 'acting';
      if (timer) { timer.destroy(); timer = null; }

      let revealed = false;

      root.innerHTML = `
        <div class="game-header">
          <div class="game-title-bar">
            <div class="game-round-label">Round ${roundsDone + 1} of ${totalRounds}</div>
            <div class="game-name">🎭 Charades</div>
          </div>
          <div class="timer-ring-wrap" id="timer-wrap">
            <svg class="timer-ring" width="80" height="80" viewBox="0 0 80 80">
              <circle class="timer-ring__bg" cx="40" cy="40" r="34"/>
              <circle class="timer-ring__fg" id="timer-fg" cx="40" cy="40" r="34"
                stroke-dasharray="213.6" stroke-dashoffset="0"/>
            </svg>
            <div class="timer-value" id="timer-val">${TIMER_SECONDS}</div>
          </div>
        </div>

        <div class="game-area" style="align-items:center;justify-content:center;gap:1.5rem">
          <div id="word-reveal" style="text-align:center">
            <div class="text-xs text-muted mb-2" style="text-transform:uppercase;letter-spacing:.1em">Your word</div>
            <div style="
              font-size:clamp(1.5rem,6vw,2.8rem);font-weight:900;
              background:var(--color-primary);color:#fff;
              padding:.75rem 1.5rem;border-radius:16px;
              letter-spacing:0.03em;text-align:center;
            ">${ui.escHtml(currentWord)}</div>
            <p class="text-xs text-muted mt-2">Act it out without speaking or spelling!</p>
          </div>

          <div style="display:flex;flex-direction:column;gap:.75rem;width:100%;max-width:320px">
            <button class="btn btn-success btn-full btn-lg" id="btn-got-it">✅ They Got It! (+3 pts)</button>
            <button class="btn btn-ghost btn-full" id="btn-skip-word">⏭ New Word</button>
            <button class="btn btn-danger btn-sm btn-full" id="btn-time-up">⏱ Time's Up</button>
          </div>
        </div>
      `;

      timer = new TimerClass(TIMER_SECONDS,
        (rem, frac) => {
          const val = root.querySelector('#timer-val');
          const fg  = root.querySelector('#timer-fg');
          if (val) val.textContent = rem;
          if (fg) {
            const circum = 213.6;
            fg.style.strokeDashoffset = circum * frac;
            fg.className = 'timer-ring__fg' + (rem <= 10 ? ' danger' : rem <= 20 ? ' warning' : '');
          }
        },
        () => {
          ui.toast('Time\'s up!', 'warning');
          renderRoundResult(false);
        }
      );
      timer.start();

      root.querySelector('#btn-got-it')?.addEventListener('click', () => {
        timer.pause();
        scores[players[currentPlayerIdx].id] += 3;
        renderRoundResult(true);
      });

      root.querySelector('#btn-skip-word')?.addEventListener('click', () => {
        currentWord = getWord();
        const wordEl = root.querySelector('#word-reveal div:nth-child(2)');
        if (wordEl) wordEl.textContent = currentWord;
      });

      root.querySelector('#btn-time-up')?.addEventListener('click', () => {
        timer.pause();
        renderRoundResult(false);
      });
    }

    function renderRoundResult(guessed) {
      timer?.destroy();
      phase = 'result';
      roundsDone++;

      const player = players[currentPlayerIdx];
      const nextPlayerIdx = (currentPlayerIdx + 1) % players.length;
      const isGameOver = roundsDone >= totalRounds;

      root.innerHTML = `
        <div class="ready-screen">
          <div style="font-size:3rem">${guessed ? '🎉' : '😅'}</div>
          <div class="text-2xl font-black">${guessed ? 'Nice!' : 'Better luck next time!'}</div>
          <div class="card" style="text-align:center;width:100%;max-width:280px">
            <div class="text-xs text-muted mb-2">The word was</div>
            <div class="text-xl font-black" style="color:var(--color-primary)">${ui.escHtml(currentWord)}</div>
          </div>
          <div style="width:100%;max-width:280px">
            <div class="text-xs text-muted mb-2 text-center">Current Scores</div>
            ${players.map((p,i) => `
              <div class="score-row mb-2">
                <div class="score-row__avatar" style="background:${ui.avatarColor(i).bg};color:${ui.avatarColor(i).text};width:32px;height:32px;font-size:.8rem">${p.name[0].toUpperCase()}</div>
                <div class="score-row__info"><div class="score-row__name">${ui.escHtml(p.name)}</div></div>
                <div class="score-row__points">${scores[p.id]}</div>
              </div>
            `).join('')}
          </div>
          <button class="btn btn-primary btn-xl btn-full" id="btn-next">
            ${isGameOver ? '🏆 See Results' : `Next: ${ui.escHtml(players[nextPlayerIdx].name)}'s Turn →`}
          </button>
        </div>
      `;

      root.querySelector('#btn-next')?.addEventListener('click', () => {
        if (isGameOver) {
          finishGame();
        } else {
          currentPlayerIdx = nextPlayerIdx;
          renderSetup();
        }
      });
    }

    function finishGame() {
      timer?.destroy();
      // Build rankings
      const sorted = players
        .map(p => ({ id: p.id, name: p.name, pts: scores[p.id] }))
        .sort((a, b) => b.pts - a.pts);

      const pointMap = [10, 5, 2];
      const rankings = sorted.map((p, i) => ({
        id:     p.id,
        name:   p.name,
        points: pointMap[i] ?? 0,
        isWin:  i === 0,
      }));

      const winner = sorted[0];
      onComplete({
        rankings,
        summary: `${winner.name} won with ${winner.pts} point${winner.pts!==1?'s':''}!`,
      });
    }

    onCleanup(() => { timer?.destroy(); });
    renderSetup();
  },
};
