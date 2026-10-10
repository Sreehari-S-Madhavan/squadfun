/**
 * games/imposter.js — Imposter social deduction game
 *
 * Everyone gets a secret word except the Imposter who gets a different (related) word.
 * Players describe their word without saying it. Then vote for who is the Imposter.
 */

import { ui } from '../ui.js';

const IMPOSTER_PAIRS = [
  { word: 'Pizza', imposter: 'Burger' },
  { word: 'Cat', imposter: 'Dog' },
  { word: 'Beach', imposter: 'Pool' },
  { word: 'Tennis', imposter: 'Badminton' },
  { word: 'Coffee', imposter: 'Tea' },
  { word: 'Guitar', imposter: 'Violin' },
  { word: 'Cinema', imposter: 'Theatre' },
  { word: 'Lion', imposter: 'Tiger' },
  { word: 'Paris', imposter: 'London' },
  { word: 'Snowboard', imposter: 'Ski' },
  { word: 'Cake', imposter: 'Pie' },
  { word: 'Baseball', imposter: 'Cricket' },
  { word: 'Astronaut', imposter: 'Pilot' },
  { word: 'Shark', imposter: 'Dolphin' },
  { word: 'Castle', imposter: 'Palace' },
  { word: 'Volcano', imposter: 'Mountain' },
  { word: 'Lemon', imposter: 'Lime' },
  { word: 'Ballet', imposter: 'Gymnastics' },
  { word: 'Hammer', imposter: 'Wrench' },
  { word: 'Fridge', imposter: 'Freezer' },
  { word: 'Facebook', imposter: 'Instagram' },
  { word: 'Helicopter', imposter: 'Aeroplane' },
  { word: 'Diamonds', imposter: 'Rubies' },
  { word: 'President', imposter: 'Prime Minister' },
  { word: 'Halloween', imposter: 'Christmas' },
];

export default {
  id: 'imposter',

  run(root, { players, ui: _ui, onComplete, onCleanup }) {
    if (players.length < 3) {
      root.innerHTML = `<div class="screen"><div class="empty-state">
        <div class="empty-state__icon">🕵️</div>
        <div class="empty-state__title">Need 3+ players</div>
        <div class="empty-state__desc">Imposter requires at least 3 players.</div>
        <button class="btn btn-ghost mt-4" onclick="history.back()">Go Back</button>
      </div></div>`;
      return;
    }

    const pair = IMPOSTER_PAIRS[Math.floor(Math.random() * IMPOSTER_PAIRS.length)];
    const imposterIdx = Math.floor(Math.random() * players.length);
    let currentRevealIdx = 0;
    let phase = 'reveal'; // reveal | describe | vote | result

    function renderRevealPhase() {
      phase = 'reveal';
      const player = players[currentRevealIdx];
      const isImposter = currentRevealIdx === imposterIdx;

      root.innerHTML = `
        <div class="game-header">
          <div class="game-title-bar">
            <div class="game-round-label">Reveal Phase (${currentRevealIdx + 1}/${players.length})</div>
            <div class="game-name">🕵️ Imposter</div>
          </div>
        </div>
        <div class="ready-screen">
          <div style="font-size:2.5rem">🕵️</div>
          <div style="text-align:center">
            <div class="text-xs text-muted mb-1" style="text-transform:uppercase">Pass the phone to</div>
            <div class="text-2xl font-black">${ui.escHtml(player.name)}</div>
          </div>
          <div class="card" style="background:rgba(0,0,0,0.2);border-style:dashed;text-align:center;width:100%;max-width:280px">
            <p class="text-sm text-3">Only ${ui.escHtml(player.name)} should look.</p>
            <p class="text-sm text-muted">Tap to reveal your secret word.</p>
          </div>
          <button class="btn btn-primary btn-xl" id="btn-reveal">👁 Tap to Reveal</button>
        </div>
      `;

      root.querySelector('#btn-reveal')?.addEventListener('click', () => {
        renderWordReveal(player, isImposter);
      });
    }

    function renderWordReveal(player, isImposter) {
      const secretWord = isImposter ? pair.imposter : pair.word;
      root.innerHTML = `
        <div class="ready-screen" style="background:${isImposter?'rgba(244,63,94,0.05)':'rgba(16,185,129,0.05)'}">
          <div style="font-size:2.5rem">${isImposter ? '🥸' : '👤'}</div>
          <div style="text-align:center">
            <div class="text-xs ${isImposter?'text-accent':'text-success'} mb-1" style="text-transform:uppercase;letter-spacing:.1em;font-weight:800">
              ${isImposter ? '🤫 You are the IMPOSTER!' : '👤 You are an Agent'}
            </div>
            <div class="text-xs text-muted mb-3">Your secret word:</div>
            <div style="
              font-size:2.2rem;font-weight:900;
              background:${isImposter?'var(--color-accent)':'var(--color-success)'};
              color:#fff;padding:.75rem 1.5rem;border-radius:16px;
            ">${ui.escHtml(secretWord)}</div>
          </div>
          <div class="card" style="text-align:center;max-width:300px">
            ${isImposter ? `
              <p class="text-sm text-3">Others have a similar but different word. Blend in! Don't get caught!</p>
            ` : `
              <p class="text-sm text-3">Describe your word in one sentence without saying it. Try to expose the imposter!</p>
            `}
          </div>
          <button class="btn btn-primary" id="btn-done-reveal">Got it, pass the phone</button>
        </div>
      `;

      root.querySelector('#btn-done-reveal')?.addEventListener('click', () => {
        currentRevealIdx++;
        if (currentRevealIdx >= players.length) {
          renderDescribePhase();
        } else {
          renderRevealPhase();
        }
      });
    }

    function renderDescribePhase() {
      phase = 'describe';
      root.innerHTML = `
        <div class="game-header">
          <div class="game-title-bar">
            <div class="game-round-label">Discussion Phase</div>
            <div class="game-name">🕵️ Imposter</div>
          </div>
        </div>
        <div class="game-area" style="align-items:center;justify-content:center;gap:1.5rem">
          <div style="font-size:3rem">💬</div>
          <div style="text-align:center">
            <h2 class="text-2xl font-black mb-2">Discussion Time!</h2>
            <p class="text-sm text-3">Each player gives ONE clue about their word. Don't say the word itself!</p>
          </div>
          <div class="card" style="width:100%;max-width:320px">
            <div class="text-xs text-muted mb-3" style="text-transform:uppercase;letter-spacing:.1em">Speaking Order</div>
            ${players.map((p, i) => `
              <div class="flex items-center gap-3 mb-3">
                <div style="width:24px;height:24px;border-radius:50%;background:var(--color-primary);color:#fff;display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:900;flex-shrink:0">${i+1}</div>
                <div style="font-weight:700">${ui.escHtml(p.name)}</div>
              </div>
            `).join('')}
          </div>
          <button class="btn btn-primary btn-xl" id="btn-vote">Ready to Vote! 🗽</button>
        </div>
      `;

      root.querySelector('#btn-vote')?.addEventListener('click', renderVotePhase);
    }

    function renderVotePhase() {
      phase = 'vote';
      let votes = {};
      players.forEach(p => { votes[p.id] = 0; });

      root.innerHTML = `
        <div class="game-header">
          <div class="game-title-bar">
            <div class="game-round-label">Voting Phase</div>
            <div class="game-name">🕵️ Imposter</div>
          </div>
        </div>
        <div class="game-area" style="gap:1rem">
          <div style="text-align:center;margin-bottom:.5rem">
            <h2 class="text-xl font-black">Who is the Imposter? 🤔</h2>
            <p class="text-sm text-3">Discuss and tap to vote.</p>
          </div>
          <div id="vote-list" style="display:flex;flex-direction:column;gap:.75rem">
            ${players.map((p, i) => `
              <button class="vote-btn score-row" data-player="${ui.escHtml(p.id)}" style="cursor:pointer;border:2px solid var(--color-border);border-radius:12px">
                <div class="score-row__rank" style="font-size:.9rem">#${i+1}</div>
                <div class="score-row__avatar" style="background:${ui.avatarColor(i).bg};color:${ui.avatarColor(i).text};width:36px;height:36px;font-size:.85rem">${p.name[0].toUpperCase()}</div>
                <div class="score-row__info">
                  <div class="score-row__name">${ui.escHtml(p.name)}</div>
                  <div class="score-row__meta" id="vote-count-${ui.escHtml(p.id)}">0 votes</div>
                </div>
                <div style="color:var(--color-text-muted)">🗽</div>
              </button>
            `).join('')}
          </div>
          <div class="flex gap-3 mt-4">
            <div class="card flex-1" style="text-align:center">
              <div class="text-xs text-muted">Total votes</div>
              <div class="text-2xl font-black" id="total-votes">0</div>
            </div>
            <div class="card flex-1" style="text-align:center">
              <div class="text-xs text-muted">Players</div>
              <div class="text-2xl font-black">${players.length}</div>
            </div>
          </div>
          <button class="btn btn-primary btn-full btn-lg" id="btn-reveal-imposter">Reveal Imposter!</button>
        </div>
      `;

      let totalVotes = 0;
      root.querySelectorAll('.vote-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const pid = btn.dataset.player;
          votes[pid] = (votes[pid] || 0) + 1;
          totalVotes++;
          const countEl = root.querySelector(`#vote-count-${pid}`);
          if (countEl) countEl.textContent = `${votes[pid]} vote${votes[pid]!==1?'s':''}`;
          const totalEl = root.querySelector('#total-votes');
          if (totalEl) totalEl.textContent = totalVotes;
          // Highlight most-voted
          const maxVotes = Math.max(...Object.values(votes));
          root.querySelectorAll('.vote-btn').forEach(b => {
            const pv = votes[b.dataset.player] || 0;
            b.style.borderColor = pv === maxVotes && pv > 0 ? 'var(--color-accent)' : 'var(--color-border)';
          });
        });
      });

      root.querySelector('#btn-reveal-imposter')?.addEventListener('click', () => {
        const mostVotedId = Object.entries(votes).sort((a,b)=>b[1]-a[1])[0][0];
        renderResult(mostVotedId);
      });
    }

    function renderResult(accusedId) {
      phase = 'result';
      const imposterPlayer = players[imposterIdx];
      const accused = players.find(p => p.id === accusedId);
      const caught = accusedId === imposterPlayer.id;

      const rankings = [];
      if (caught) {
        // All non-imposters win
        players.forEach((p, i) => {
          if (i !== imposterIdx) {
            rankings.push({ id: p.id, name: p.name, points: 10, isWin: true });
          }
        });
        rankings.push({ id: imposterPlayer.id, name: imposterPlayer.name, points: 0, isWin: false });
      } else {
        // Imposter wins
        rankings.push({ id: imposterPlayer.id, name: imposterPlayer.name, points: 10, isWin: true });
        players.forEach((p, i) => {
          if (i !== imposterIdx) {
            rankings.push({ id: p.id, name: p.name, points: 2, isWin: false });
          }
        });
      }

      root.innerHTML = `
        <div class="ready-screen">
          <div style="font-size:3rem">${caught ? '👮‍♂️' : '🥸'}</div>
          <div style="text-align:center">
            <div class="text-xs ${caught?'text-success':'text-accent'} mb-1" style="text-transform:uppercase;font-weight:800;letter-spacing:.1em">
              ${caught ? 'Caught!' : 'Imposter Wins!'}
            </div>
            <div class="text-2xl font-black">
              ${caught ? `${ui.escHtml(imposterPlayer.name)} was the Imposter!` : `${ui.escHtml(imposterPlayer.name)} escaped!`}
            </div>
          </div>
          <div class="card" style="text-align:center;max-width:300px">
            <div class="text-xs text-muted mb-1">The words were</div>
            <div class="flex gap-3 justify-center">
              <div>
                <div class="text-xs text-muted">Agents</div>
                <div class="font-black" style="color:var(--color-success)">${ui.escHtml(pair.word)}</div>
              </div>
              <div class="text-muted">vs</div>
              <div>
                <div class="text-xs text-muted">Imposter</div>
                <div class="font-black" style="color:var(--color-accent)">${ui.escHtml(pair.imposter)}</div>
              </div>
            </div>
          </div>
          <button class="btn btn-primary btn-xl" id="btn-done">Continue →</button>
        </div>
      `;

      root.querySelector('#btn-done')?.addEventListener('click', () => {
        onComplete({
          rankings,
          summary: caught
            ? `Agents win! ${imposterPlayer.name} was the imposter.`
            : `${imposterPlayer.name} (imposter) escaped! Better luck next time.`,
        });
      });
    }

    onCleanup(() => {});
    renderRevealPhase();
  },
};
