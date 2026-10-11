# PartyVerse — Comprehensive Test Plan & Verification Checklist

This document details the test strategy, automated test suites, and manual verification checklists for the PartyVerse platform.

---

## 1. Automated Test Suite

Run using Node.js:
```bash
node tests/runner.js
```

### Covered Test Areas:
1. **Scoring Engine (`scoring.js`)**
   - Idempotent round commit (preventing duplicate awards for the same round ID).
   - Point attribution for 1st, 2nd, 3rd places and individual answers.
   - Leaderboard generation with ties sorted by wins and alphabetical fallback.
   - Round undo / score correction functionality without corrupting subsequent rounds.
2. **Randomizer & Tournament Sequence (`randomizer.js`)**
   - Eligibility filtering (only implemented games with matching player count and mode constraints).
   - Category alternation (avoiding back-to-back rounds in the same category when alternatives exist).
   - Rerolling future rounds without disturbing already completed rounds.
   - Duration estimation based on chosen game lengths and transition buffers.
3. **Timer Lifecycle (`timer.js`)**
   - Accurate countdown calculation using timestamps (`Date.now()`).
   - Pause and resume calculating elapsed duration correctly without drift.
   - Timer serialization and restoration for surviving browser tab reloads.
4. **Local Data Persistence (`storage.js`)**
   - Schema version validation and fallback handling.
   - Atomic saving and retrieval of tournament, active round, and score states.
   - Reset routines (tournament-only vs factory reset).

---

## 2. Manual Test Matrix & Edge Cases

| Test Case | Scenario / Preconditions | Expected Outcome | Status |
|-----------|--------------------------|------------------|--------|
| **TC-01: Minimum Players** | Attempt to start tournament with 0 or 1 player | "Continue" button is disabled; warning hint indicates min 2 players required | Passed |
| **TC-02: Maximum Players** | Add 12 players, then attempt to add a 13th | Input hidden/disabled; message displays max 12 players reached | Passed |
| **TC-03: Empty & Whitespace Names** | Try adding `""` or `"   "` as player name | Rejected with validation message "Name cannot be empty" | Passed |
| **TC-04: Duplicate Names** | Add player "Alex", then try adding "alex" | Rejected with "A player with that name already exists" | Passed |
| **TC-05: Team Assignment** | Switch between Solo and Team mode | Automatic fair team distribution; manual player reassignment works cleanly | Passed |
| **TC-06: Unequal Team Sizes** | 3 or 5 players in team mode | Handled gracefully with ceil distribution (e.g. 2 vs 1 or 3 vs 2) | Passed |
| **TC-07: Round Reroll** | In tournament preview, click 🎲 on an upcoming round | Round replaces game with an eligible alternative; other rounds remain unchanged | Passed |
| **TC-08: Round Skip** | Click "Skip this round" on game ready screen | Round marked as skipped; 0 points awarded; advances to next round smoothly | Passed |
| **TC-09: Score Confirmation** | Complete a mini-game round | Explicit score confirmation required before points commit to tournament scoreboard | Passed |
| **TC-10: Refresh During Game** | Refresh browser during an active round | Tournament preserves active status, scores intact, and resumes safely | Passed |
| **TC-11: Offline Launch** | Load app online once, disconnect network, reload page | App launches from Service Worker cache; "Offline" status shown; gameplay remains functional | Passed |
| **TC-12: Service Worker Update** | New service worker version detected while playing | Update banner appears without interrupting current round; user activates update when ready | Passed |
| **TC-13: Tournament Completion** | Finish all rounds in sequence | Confetti winner screen displays; highest scorer crowned; options to review full scoreboard or start fresh | Passed |
| **TC-14: Responsive Viewport** | Test on 320px phone screen and 1920px desktop screen | Mobile bottom navigation displays on small screens; desktop layout adjusts nicely without overflow | Passed |

---

## 3. Mini-Game Verification Checklist

- [x] **Charades**: Word prompt revealed only on button press; SVG countdown timer functions; scoring awarded (+3); difficulty selection functional.
- [x] **Imposter**: Pass-and-play secret word reveal; imposter receives distinct paired word; discussion turn order shown; voting interface exposes imposter; scores awarded.
- [x] **Word Bomb**: Rapid 6s countdown; life deduction on explosion; word verification requires target letters and rejects duplicates; survivor rankings determined.
- [x] **Snakes & Ladders**: 100-cell interactive board; dice roll moves player token; snakes slide down, ladders climb up; exact 100 roll required to win.
- [x] **Memory Match**: 4x4 card grid with 8 pairs; turn-based flipping; match persistence; flip-back delay; total pairs tracked per player.
- [x] **Reaction Test**: Random delay before visual signal; false-start detection with penalty; millisecond precision timing; ranking determined by reaction speed.
- [x] **Quick Quiz**: Multi-question trivia with progress indicator; answer reveal with player selection; score attribution; timer expiration fallback.
- [x] **Rock Paper Scissors**: Pass-and-play hidden selection for 2 competitors; best-of-5 rounds tracking; ties handled without point awarding; match winner crowned.

