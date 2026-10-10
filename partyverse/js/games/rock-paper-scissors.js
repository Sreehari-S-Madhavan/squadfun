/**
 * games/rock-paper-scissors.js — Rock Paper Scissors
 *
 * Best of 5 rounds tournament bracket.
 * For 2 players: direct match. For 3+: round-robin or sequential pairs.
 */

import { ui } from '../ui.js';

const CHOICES = [
  { id: 'rock',     emoji: '✊', label: 'Rock',     beats: 'scissors' },
  { id: 'scissors', emoji: '✌️', label: 'Scissors', beats: 'paper' },
  { id: 'paper',    emoji: '✋', label: 'Paper',    beats: 'rock' },
];

const ROUNDS_TO_WIN = 3; // best of 5

export default {
  id: 'rock-paper-scissors',

  run(root, { players, ui: _ui, onComplete, onCleanup }) {
    // Always play as 2-player match (first vs second, or pair by pair)
    // For groups: sequential 1v2, winner v3, etc.
    let playerA = players[0];
    let playerB = players[1];
    let scoreA = 0, scoreB = 0;
    let matchRound = 1;
    let matchPhase = 'choose-A'; // choose-A | choose-B | result
    let choiceA = null, choiceB = null;
    const totalSets = Math.min(5, Math.max(3, ROUNDS_TO_WIN * 2 - 1)); // best of 5

    function renderMatchSetup() {
      root.innerHTML = `
        <div class="game-header">
          <div class="game-title-bar">
            <div class="game-round-label">Best of ${totalSets}</div>
            <div class="game-name">✊ Rock Paper Scissors</div>
          </div>
        </div>
        <div class="rps-arena">
          <div class="flex items-center gap-4" style="font-size:1.1rem;font-weight:800">
            <div style="text-align:center">
              <div>${ui.escHtml(playerA.name)}</div>
              <div id="score-a" class="text-3xl font-black" style="color:var(--color-primary)">${scoreA}</div>
            </div>
            <div class="rps-vs">VS</div>
            <div style="text-align:center">
              <div>${ui.escHtml(playerB.name)}</div>
              <div id="score-b" class="text-3xl font-black" style="color:var(--color-accent)">${scoreB}</div>
            </div>
          </div>
          <div class="text-xs text-muted">Set ${matchRound}</div>
          <div style="text-align:center">
            <div class="text-sm text-3 mb-3">Pass to <strong>${ui.escHtml(playerA.name)}</strong> — choose in secret:</div>
            <div class="rps-choices" id="choices-a">
              ${CHOICES.map(c => `
                <button class="rps-btn" data-choice="${c.id}" aria-label="${c.label}" title="${c.label}">${c.emoji}</button>
              `).join('')}
            </div>
          </div>
        </div>
      `;

      root.querySelectorAll('#choices-a .rps-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          choiceA = btn.dataset.choice;
          renderChoiceB();
        });
      });
    }

    function renderChoiceB() {
      matchPhase = 'choose-B';
      root.innerHTML = `
        <div class="game-header">
          <div class="game-title-bar">
            <div class="game-round-label">Best of ${totalSets} — Set ${matchRound}</div>
            <div class="game-name">✊ Rock Paper Scissors</div>
          </div>
        </div>
        <div class="rps-arena">
          <div class="flex items-center gap-4" style="font-size:1.1rem;font-weight:800">
            <div style="text-align:center">
              <div>${ui.escHtml(playerA.name)}</div>
              <div class="text-3xl font-black" style="color:var(--color-primary)">${scoreA}</div>
            </div>
            <div class="rps-vs">VS</div>
            <div style="text-align:center">
              <div>${ui.escHtml(playerB.name)}</div>
              <div class="text-3xl font-black" style="color:var(--color-accent)">${scoreB}</div>
            </div>
          </div>
          <div class="card" style="text-align:center;width:100%;max-width:300px">
            <div class="text-xs text-success mb-1">${ui.escHtml(playerA.name)} has chosen ✅</div>
            <p class="text-sm text-3">Now pass to <strong>${ui.escHtml(playerB.name)}</strong> — choose in secret:</p>
          </div>
          <div class="rps-choices" id="choices-b">
            ${CHOICES.map(c => `
              <button class="rps-btn" data-choice="${c.id}" aria-label="${c.label}" title="${c.label}">${c.emoji}</button>
            `).join('')}
          </div>
        </div>
      `;

      root.querySelectorAll('#choices-b .rps-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          choiceB = btn.dataset.choice;
          renderSetResult();
        });
      });
    }

    function renderSetResult() {
      matchPhase = 'result';
      const cA = CHOICES.find(c => c.id === choiceA);
      const cB = CHOICES.find(c => c.id === choiceB);
      const aWins = cA.beats === choiceB;
      const bWins = cB.beats === choiceA;
      const draw  = !aWins && !bWins;

      if (aWins) scoreA++;
      if (bWins) scoreB++;

      const setWinner = aWins ? playerA : bWins ? playerB : null;
      const hasMatchWinner = scoreA >= ROUNDS_TO_WIN || scoreB >= ROUNDS_TO_WIN;
      const matchWinner    = scoreA >= ROUNDS_TO_WIN ? playerA : scoreB >= ROUNDS_TO_WIN ? playerB : null;

      root.innerHTML = `
        <div class="game-header">
          <div class="game-title-bar">
            <div class="game-round-label">Set ${matchRound} Result</div>
            <div class="game-name">✊ Rock Paper Scissors</div>
          </div>
        </div>
        <div class="rps-arena">
          <div class="flex items-center gap-4" style="font-size:1.1rem;font-weight:800">
            <div style="text-align:center">
              <div>${ui.escHtml(playerA.name)}</div>
              <div class="text-3xl font-black" style="color:var(--color-primary)">${scoreA}</div>
            </div>
            <div class="rps-vs">VS</div>
            <div style="text-align:center">
              <div>${ui.escHtml(playerB.name)}</div>
              <div class="text-3xl font-black" style="color:var(--color-accent)">${scoreB}</div>
            </div>
          </div>

          <div class="flex items-center gap-6">
            <div style="text-align:center">
              <div class="text-4xl">${cA.emoji}</div>
              <div class="text-xs text-3 mt-1">${ui.escHtml(playerA.name)}</div>
            </div>
            <div class="rps-vs">vs</div>
            <div style="text-align:center">
              <div class="text-4xl">${cB.emoji}</div>
              <div class="text-xs text-3 mt-1">${ui.escHtml(playerB.name)}</div>
            </div>
          </div>

          <div style="text-align:center">
            <div class="text-xl font-black ${draw?'text-muted':''}"
              style="color:${draw?'':'var(--color-gold)'}">
              ${draw ? 'Draw!' : `${ui.escHtml(setWinner.name)} wins this set!`}
            </div>
            ${draw ? '<div class="text-xs text-muted">No point awarded</div>' : ''}
          </div>

          <button class="btn btn-primary btn-xl" id="btn-next">
            ${hasMatchWinner ? '🏆 See Match Result!' : `Next Set →`}
          </button>
        </div>
      `;

      root.querySelector('#btn-next')?.addEventListener('click', () => {
        matchRound++;
        if (hasMatchWinner) {
          finishGame(matchWinner);
        } else {
          choiceA = null; choiceB = null;
          renderMatchSetup();
        }
      });
    }

    function finishGame(winner) {
      const loser = winner.id === playerA.id ? playerB : playerA;

      const rankings = [
        { id: winner.id, name: winner.name, points: 10, isWin: true },
        { id: loser.id,  name: loser.name,  points: 0,  isWin: false },
      ];

      // Add any other players as 0 points
      players.forEach(p => {
        if (p.id !== winner.id && p.id !== loser.id) {
          rankings.push({ id: p.id, name: p.name, points: 0, isWin: false });
        }
      });

      root.innerHTML = `
        <div class="ready-screen">
          <div style="font-size:3rem">🏆</div>
          <div style="text-align:center">
            <div class="text-xs text-gold mb-1" style="text-transform:uppercase;letter-spacing:.1em">Match Winner</div>
            <div class="text-3xl font-black">${ui.escHtml(winner.name)}</div>
            <div class="text-sm text-3 mt-1">${scoreA > scoreB ? scoreA : scoreB} – ${scoreA > scoreB ? scoreB : scoreA}</div>
          </div>
          <div style="display:flex;gap:2rem;font-size:2.5rem">
            <div style="text-align:center">
              <div>${CHOICES.find(c=>c.id===choiceA)?.emoji||'✊'}</div>
              <div class="text-xs text-3">${ui.escHtml(playerA.name)}</div>
            </div>
            <div style="text-align:center">
              <div>${CHOICES.find(c=>c.id===choiceB)?.emoji||'✊'}</div>
              <div class="text-xs text-3">${ui.escHtml(playerB.name)}</div>
            </div>
          </div>
          <button class="btn btn-primary btn-xl" id="btn-done">Confirm Results ✔</button>
        </div>
      `;

      root.querySelector('#btn-done')?.addEventListener('click', () => {
        onComplete({
          rankings,
          summary: `${winner.name} wins ${scoreA > scoreB ? scoreA : scoreB}–${scoreA > scoreB ? scoreB : scoreA}!`,
        });
      });
    }

    onCleanup(() => {});
    renderMatchSetup();
  },
};
