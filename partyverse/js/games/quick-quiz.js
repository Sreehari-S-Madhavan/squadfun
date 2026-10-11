/**
 * games/quick-quiz.js — Quick Quiz
 *
 * Multiple-choice trivia. Players share one device.
 * Questions presented turn by turn or buzzer style with explicit answers.
 */

import { Timer } from '../timer.js';
import { ui }    from '../ui.js';

const QUIZ_DATA = [
  { q: 'What planet is known as the Red Planet?',         a: 'Mars',        opts: ['Mars','Venus','Jupiter','Saturn'] },
  { q: 'How many sides does a hexagon have?',             a: '6',           opts: ['5','6','7','8'] },
  { q: 'What is the capital of France?',                  a: 'Paris',       opts: ['London','Berlin','Paris','Madrid'] },
  { q: 'Who painted the Mona Lisa?',                      a: 'Da Vinci',    opts: ['Picasso','Da Vinci','Rembrandt','Monet'] },
  { q: 'What is the largest ocean on Earth?',             a: 'Pacific',     opts: ['Atlantic','Indian','Pacific','Arctic'] },
  { q: 'How many colors are in a standard rainbow?',      a: '7',           opts: ['5','6','7','8'] },
  { q: 'What gas do plants primarily absorb?',            a: 'Carbon Dioxide', opts: ['Oxygen','Nitrogen','Carbon Dioxide','Hydrogen'] },
  { q: 'What is the fastest land animal?',                a: 'Cheetah',     opts: ['Lion','Horse','Cheetah','Greyhound'] },
  { q: 'How many strings does a standard guitar have?',   a: '6',           opts: ['4','5','6','8'] },
  { q: 'What is the smallest country in the world?',      a: 'Vatican City',opts: ['Monaco','San Marino','Vatican City','Liechtenstein'] },
  { q: 'What year did World War II end?',                 a: '1945',        opts: ['1942','1944','1945','1947'] },
  { q: 'What chemical formula represents water?',         a: 'H2O',         opts: ['CO2','H2O','NaCl','CH4'] },
  { q: 'What is the longest river in the world?',         a: 'Nile',        opts: ['Amazon','Nile','Yangtze','Mississippi'] },
  { q: 'How many planets are in our solar system?',       a: '8',           opts: ['7','8','9','10'] },
  { q: 'What is the square root of 144?',                 a: '12',          opts: ['10','11','12','14'] },
  { q: 'What chemical element has the symbol Au?',        a: 'Gold',        opts: ['Silver','Gold','Copper','Iron'] },
  { q: 'What sport uses a puck?',                         a: 'Ice Hockey',  opts: ['Football','Ice Hockey','Polo','Lacrosse'] },
  { q: 'How many bones are in the adult human body?',     a: '206',         opts: ['182','206','212','248'] },
  { q: 'What is the currency of Japan?',                  a: 'Yen',         opts: ['Won','Yuan','Yen','Baht'] },
  { q: 'What is the hardest natural mineral?',            a: 'Diamond',     opts: ['Diamond','Titanium','Topaz','Quartz'] },
  { q: 'What is the national animal of Australia?',       a: 'Kangaroo',    opts: ['Koala','Kangaroo','Platypus','Emu'] },
  { q: 'What is the largest continent by area?',          a: 'Asia',        opts: ['Africa','Asia','Europe','North America'] },
  { q: 'In what year did the Titanic sink?',              a: '1912',        opts: ['1910','1912','1914','1916'] },
  { q: 'Who wrote Romeo and Juliet?',                     a: 'Shakespeare', opts: ['Dickens','Tolkien','Shakespeare','Austen'] },
  { q: 'What is the tallest mountain in the world?',      a: 'Everest',     opts: ['K2','Kangchenjunga','Everest','Lhotse'] },
  { q: 'What is 7 × 8?',                                  a: '56',          opts: ['48','54','56','64'] },
  { q: 'How many continents are there?',                  a: '7',           opts: ['5','6','7','8'] },
];

const QUESTIONS_PER_GAME = 6;
const TIMER_SECONDS = 15;

export default {
  id: 'quick-quiz',

  run(root, { players, ui: _ui, onComplete, onCleanup, Timer: TimerClass }) {
    const questions = shuffleArr([...QUIZ_DATA]).slice(0, QUESTIONS_PER_GAME);
    let qIdx = 0;
    let scores = {};
    players.forEach(p => { scores[p.id] = 0; });
    let answered = false;
    let timer = null;

    function renderQuestion() {
      const q = questions[qIdx];
      answered = false;
      if (timer) { timer.destroy(); timer = null; }

      const shuffledOpts = shuffleArr([...q.opts]);
      const letters = ['A','B','C','D'];

      root.innerHTML = `
        <div class="game-header">
          <div class="game-title-bar">
            <div class="game-round-label">Question ${qIdx + 1} of ${QUESTIONS_PER_GAME}</div>
            <div class="game-name">🎯 Quick Quiz</div>
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

        <div class="quiz-area">
          <div class="quiz-progress">
            ${questions.map((_, i) => `
              <div class="quiz-progress-dot ${i < qIdx ? 'done' : i === qIdx ? 'active' : ''}"></div>
            `).join('')}
          </div>

          <div class="quiz-question">${ui.escHtml(q.q)}</div>

          <div class="quiz-options" id="options">
            ${shuffledOpts.map((opt, i) => `
              <button class="quiz-option" data-opt="${ui.escHtml(opt)}" data-correct="${opt === q.a}">
                <div class="quiz-option-letter">${letters[i]}</div>
                <div>${ui.escHtml(opt)}</div>
              </button>
            `).join('')}
          </div>

          <div class="divider"></div>

          <div style="display:flex;gap:.75rem;flex-wrap:wrap;justify-content:center">
            ${players.map(p => `
              <div class="flex items-center gap-2" style="font-size:.85rem">
                <span>${ui.escHtml(p.name)}:</span>
                <strong style="color:var(--color-primary)">${scores[p.id]}</strong>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      timer = new TimerClass(TIMER_SECONDS,
        (rem, frac) => {
          const val = root.querySelector('#timer-val');
          const fg  = root.querySelector('#timer-fg');
          if (val) val.textContent = rem;
          if (fg) {
            fg.style.strokeDashoffset = 213.6 * frac;
            fg.className = 'timer-ring__fg' + (rem <= 4 ? ' danger' : rem <= 7 ? ' warning' : '');
          }
        },
        () => {
          if (!answered) {
            answered = true;
            revealAnswer(null, null);
          }
        }
      );
      timer.start();

      root.querySelectorAll('.quiz-option').forEach(btn => {
        btn.addEventListener('click', () => {
          if (answered) return;
          answered = true;
          timer?.pause();
          const isCorrect = btn.dataset.correct === 'true';

          if (players.length === 1) {
            if (isCorrect) scores[players[0].id] += 3;
            revealAnswer(isCorrect ? players[0].id : null, btn);
          } else {
            revealWithPlayerSelect(btn, isCorrect, q);
          }
        });
      });
    }

    function revealWithPlayerSelect(clickedBtn, isCorrect) {
      root.querySelectorAll('.quiz-option').forEach(b => {
        b.disabled = true;
        if (b.dataset.correct === 'true') b.classList.add('correct');
        else if (b === clickedBtn && !isCorrect) b.classList.add('wrong');
      });

      if (!isCorrect) {
        setTimeout(advanceQuestion, 1600);
        return;
      }

      const playerSelectHtml = `
        <div id="player-select" style="margin-top:1rem;padding:1rem;background:var(--color-surface);border:1px solid var(--color-success);border-radius:12px;text-align:center">
          <div class="text-xs text-success mb-2" style="font-weight:800;text-transform:uppercase">✅ Correct! Award point to:</div>
          <div style="display:flex;flex-wrap:wrap;gap:.5rem;justify-content:center">
            ${players.map(p => `
              <button class="btn btn-sm btn-ghost player-answer-btn" data-pid="${ui.escHtml(p.id)}" style="border-color:var(--color-success)">${ui.escHtml(p.name)}</button>
            `).join('')}
            <button class="btn btn-sm btn-ghost" id="btn-nobody">Nobody</button>
          </div>
        </div>
      `;

      root.querySelector('.quiz-options')?.insertAdjacentHTML('afterend', playerSelectHtml);

      root.querySelectorAll('.player-answer-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          scores[btn.dataset.pid] += 3;
          advanceQuestion();
        });
      });
      root.querySelector('#btn-nobody')?.addEventListener('click', advanceQuestion);
    }

    function revealAnswer(winnerId, clickedBtn) {
      root.querySelectorAll('.quiz-option').forEach(b => {
        b.disabled = true;
        if (b.dataset.correct === 'true') b.classList.add('correct');
        else if (!winnerId && b === clickedBtn) b.classList.add('wrong');
      });
      setTimeout(advanceQuestion, 1600);
    }

    function advanceQuestion() {
      qIdx++;
      if (qIdx >= QUESTIONS_PER_GAME) {
        finishGame();
      } else {
        renderQuestion();
      }
    }

    function finishGame() {
      timer?.destroy();

      const sorted = players
        .map(p => ({ id: p.id, name: p.name, pts: scores[p.id] }))
        .sort((a, b) => b.pts - a.pts);

      const pointMap = [10, 5, 2, 0];
      const rankings = sorted.map((p, i) => ({
        id:    p.id,
        name:  p.name,
        points: pointMap[i] ?? 0,
        isWin:  i === 0 && p.pts > 0,
      }));

      root.innerHTML = `
        <div class="ready-screen">
          <div style="font-size:3rem">🎯</div>
          <h2 class="text-2xl font-black">Quiz Complete!</h2>
          <div style="width:100%;max-width:320px">
            ${sorted.map((p, i) => `
              <div class="score-row mb-2">
                <div class="score-row__rank">${['🥇','🥈','🥉'][i]||`#${i+1}`}</div>
                <div class="score-row__info">
                  <div class="score-row__name">${ui.escHtml(p.name)}</div>
                  <div class="score-row__meta">${p.pts} points earned</div>
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
          summary: `${sorted[0].name} topped the quiz with ${sorted[0].pts} points!`,
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

    onCleanup(() => { timer?.destroy(); });
    renderQuestion();
  },
};

