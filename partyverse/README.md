# 🎮 PartyVerse — Random Party Game Platform

**PartyVerse** is a mobile-first party-game Progressive Web Application (PWA) designed for friends playing together in the same physical location using a single shared phone, tablet, or laptop. One person acts as host and passes the device around when needed.

---

## 🌟 Features & Highlights

- **Arcade-Inspired Design**: Custom dark-mode arcade visual system built with pure CSS, zero external fonts or CDN dependencies.
- **Pass-and-Play Local Experience**: Optimized for shared device play (2–12 players), supporting both Free-For-All (Solo) and Team tournaments.
- **Tournament Engine**: Configurable sessions (15, 30, or 45 minutes), dynamic category toggles, and three randomization modes (*Balanced*, *Chaos*, and *Skill*).
- **Audit-Friendly Persistence**: State survives accidental page refreshes, tab closures, and background timer throttling.
- **Idempotent Scoring Engine**: Round results require explicit confirmation; points can never be double-awarded on navigation or refresh; includes undo/score correction and tie-breaking by wins.
- **Offline-First PWA**: Service Worker pre-caches the full app shell and games. Once visited online once, the application plays 100% offline.

---

## 🎲 Game Collection (24 Games Total)

### 🚀 8 Fully Playable Priority Games

1. **🎭 Charades** (*Creative / Acting*) — Turn-based silent acting with SVG countdown ring, category/difficulty selection, and score attribution.
2. **🕵️ Imposter** (*Social Deduction*) — Pass-and-play secret word reveals (where the imposter receives a subtle variation), speaking order tracker, and group voting with elimination.
3. **💣 Word Bomb** (*Fast Reaction / Vocabulary*) — Ticking bomb syllable challenge with life counters, duplicate word rejection, and elimination.
4. **🐍 Snakes & Ladders** (*Board / Race*) — Full 10x10 board with interactive dice roll, animated snake slides and ladder climbs, and exact-100 win condition.
5. **🧠 Memory Match** (*Puzzle / Memory*) — 4x4 card grid with 8 pairs, turn-based flipping, move counting, and pair tracking.
6. **⚡ Reaction Test** (*Reflex*) — Millisecond precision timer with false-start detection, penalty handling, and speed ratings.
7. **🎯 Quick Quiz** (*Trivia*) — Timed multiple-choice trivia with progress tracking and player score assignment.
8. **✊ Rock Paper Scissors** (*Versus*) — Secret pass-and-play selection, best-of-5 tournament bracket with draw handling.

### 🔒 16 Coming Soon in the Catalog
Truth or Dare, Most Likely To, Two Truths and a Lie, Emoji Story, One-Word Story, Forbidden Word, Guess the Word, 20 Questions, Odd One Out, Tic-Tac-Toe, Connect Four, Lucky Grid, Quick Math, Number Memory, Higher or Lower, and Unscramble.

---

## 🛠️ Project Structure

```
partyverse/
  index.html              # App shell, responsive viewport & containers
  style.css               # Complete arcade design system & responsive layout
  manifest.webmanifest    # Web App Manifest (standalone, theme colors, icons)
  sw.js                   # Service Worker with precaching & offline fallbacks
  offline.html            # Standalone offline fallback view
  README.md               # Deployment and testing instructions
  assets/
    icons/
      icon.svg            # Scalable SVG vector icon
      apple-touch-icon.png# iOS touch icon (180x180)
      icon-192.png        # PWA home screen icon (192x192)
      icon-512.png        # PWA splash screen icon (512x512)
  js/
    app.js                # App bootstrap & service worker registration
    router.js             # Hash-based SPA router compatible with subpaths
    storage.js            # Versioned LocalStorage wrapper with auto-migration
    tournament.js         # Tournament state machine & lifecycle manager
    randomizer.js         # Balanced tournament sequence generator & reroller
    scoring.js            # Idempotent scoring engine with undo & leaderboards
    timer.js              # Drift-free Date.now() RAF countdown timer
    ui.js                 # Shared UI helpers (toasts, modals, player avatars)
    games/
      registry.js         # Single source of truth for all 24 games
      charades.js         # Charades game logic
      imposter.js         # Imposter game logic
      word-bomb.js        # Word Bomb game logic
      snakes-ladders.js   # Snakes & Ladders board game logic
      memory-match.js     # Memory Match puzzle logic
      reaction-test.js    # Reaction Test challenge logic
      quick-quiz.js       # Quick Quiz trivia logic
      rock-paper-scissors.js # Rock Paper Scissors versus logic
    screens/
      home.js             # Lobby, resume tournament, quick-start
      tournament.js       # 4-step wizard: Players, Mode, Settings, Preview
      collection.js       # Game browser with category filters & modals
      game.js             # Active game shell, timer, and score confirmation
      scoreboard.js       # Live standings and rank medals
      settings.js         # Offline guide, PWA installation, data export/reset
  tests/
    test-plan.md          # Test strategy, manual test matrix & checklists
    runner.js             # Automated unit & integration test suite
```

---

## 🚀 Deployment to GitHub Pages

PartyVerse is built as a pure static web app. No build steps, Node servers, or bundlers are required.

### Steps to Deploy:

1. **Create or Push to a GitHub Repository**:
   - Ensure the `partyverse` directory contents (or root of repository) contain `index.html`.
2. **Go to Repository Settings**:
   - Navigate to **Settings** > **Pages** in your GitHub repository.
3. **Configure Source**:
   - Under **Build and deployment** > **Source**, choose **Deploy from a branch**.
   - Select your main branch (e.g. `main` or `master`) and directory `/ (root)` (or `/partyverse` if placed in a subdirectory).
   - Click **Save**.
4. **Subpath Hosting Support**:
   - PartyVerse uses strictly relative paths (`./`) across HTML, CSS, JavaScript ES module imports, Manifest, and Service Worker assets. It operates identically whether deployed at `https://<username>.github.io/` or under a subpath like `https://<username>.github.io/<repo-name>/`.

---

## 📡 Testing Offline Functionality

PartyVerse follows honest offline-first principles. It clearly informs users that one online visit is needed to precache the application.

### In Chrome / Edge DevTools:
1. Open the application URL via a local HTTP server or GitHub Pages.
2. Verify the header status shows **Cached ✓** (green/gold dot).
3. Open **Developer Tools** (`F12` or `Ctrl+Shift+I`).
4. Switch to the **Network** tab and toggle the throttling dropdown from **No throttling** to **Offline**.
5. Reload the page (`Ctrl+R` / `F5`).
6. Notice:
   - The app shell, screens, and games load instantaneously from the Service Worker cache.
   - The header displays the **Offline** badge.
   - mini-games, timers, and tournament scoring run without network errors.

### On a Real Mobile Device:
1. Open the live deployment link in Mobile Safari or Chrome.
2. Wait 3 seconds for the header indicator to show **Cached ✓**.
3. Enable **Airplane Mode** (disconnect Wi-Fi and Cellular).
4. Refresh the tab or close and reopen the browser.
5. The game runs smoothly without any connection.

---

## 📱 Adding to Mobile Home Screen

### iOS (Safari):
1. Open PartyVerse in Safari.
2. Tap the **Share** button (box with an upward arrow) at the bottom toolbar.
3. Scroll down and tap **Add to Home Screen**.
4. Tap **Add** in the top-right corner. The arcade icon will appear on your home screen.

### Android (Chrome / Firefox / Edge):
1. Open PartyVerse in Chrome.
2. Tap the **Three Dots (Menu)** in the top right.
3. Select **Add to Home screen** or **Install app**.
4. Confirm installation. The app will open in a standalone, immersive fullscreen window.

### Desktop (Chrome / Edge):
1. Look for the **Install App** icon on the right side of the URL address bar.
2. Click **Install**. PartyVerse will launch in a dedicated desktop window.

---

## 🧪 Running Automated Tests

PartyVerse includes automated tests for all critical scoring, state, timer, and randomization mechanics.

```bash
# From within the partyverse directory:
node tests/runner.js
```

---

## 📄 License

MIT License. Designed for local fun with friends and family!

