/**
 * games/registry.js — Central game registry
 *
 * Single source of truth for all games.
 * Only games with implemented: true are eligible for tournaments.
 */

export const GAME_REGISTRY = [
  // ── IMPLEMENTED ─────────────────────────────────────────────
  {
    id:          'charades',
    title:       'Charades',
    emoji:       '🎭',
    category:    'creative',
    description: 'Act it out without speaking! Get your team to guess the word.',
    players:     '2–12',
    minPlayers:  2,
    maxPlayers:  12,
    roundLength: 'medium',
    tags:        ['acting', 'group', 'fun'],
    implemented: true,
    soloOnly:    false,
    teamOnly:    false,
  },
  {
    id:          'imposter',
    title:       'Imposter',
    emoji:       '🕵️',
    category:    'social',
    description: 'One player gets a different word. Can you find the imposter?',
    players:     '3–12',
    minPlayers:  3,
    maxPlayers:  12,
    roundLength: 'medium',
    tags:        ['deduction', 'group', 'social'],
    implemented: true,
    soloOnly:    false,
    teamOnly:    false,
  },
  {
    id:          'word-bomb',
    title:       'Word Bomb',
    emoji:       '💣',
    category:    'word',
    description: 'Quick! Say a word containing the letters before the bomb explodes.',
    players:     '2–12',
    minPlayers:  2,
    maxPlayers:  12,
    roundLength: 'short',
    tags:        ['fast', 'word', 'skill'],
    implemented: true,
    soloOnly:    false,
    teamOnly:    false,
  },
  {
    id:          'snakes-ladders',
    title:       'Snakes & Ladders',
    emoji:       '🐍',
    category:    'board',
    description: 'Classic board race game. First to reach 100 wins!',
    players:     '2–6',
    minPlayers:  2,
    maxPlayers:  6,
    roundLength: 'long',
    tags:        ['board', 'luck'],
    implemented: true,
    soloOnly:    false,
    teamOnly:    false,
  },
  {
    id:          'memory-match',
    title:       'Memory Match',
    emoji:       '🧠',
    category:    'puzzle',
    description: 'Flip cards and find matching pairs. Best memory wins!',
    players:     '1–8',
    minPlayers:  1,
    maxPlayers:  8,
    roundLength: 'medium',
    tags:        ['memory', 'skill'],
    implemented: true,
    soloOnly:    false,
    teamOnly:    false,
  },
  {
    id:          'reaction-test',
    title:       'Reaction Test',
    emoji:       '⚡',
    category:    'reaction',
    description: 'Tap as fast as you can when the signal appears. Fastest wins!',
    players:     '1–12',
    minPlayers:  1,
    maxPlayers:  12,
    roundLength: 'short',
    tags:        ['fast', 'skill', 'reaction'],
    implemented: true,
    soloOnly:    false,
    teamOnly:    false,
  },
  {
    id:          'quick-quiz',
    title:       'Quick Quiz',
    emoji:       '🎯',
    category:    'trivia',
    description: 'Answer trivia questions faster than your opponents!',
    players:     '1–12',
    minPlayers:  1,
    maxPlayers:  12,
    roundLength: 'medium',
    tags:        ['trivia', 'knowledge', 'skill'],
    implemented: true,
    soloOnly:    false,
    teamOnly:    false,
  },
  {
    id:          'rock-paper-scissors',
    title:       'Rock Paper Scissors',
    emoji:       '✊',
    category:    'competitive',
    description: 'The ultimate hand showdown. Best of 5 rounds!',
    players:     '2',
    minPlayers:  2,
    maxPlayers:  12,
    roundLength: 'short',
    tags:        ['fast', 'competitive'],
    implemented: true,
    soloOnly:    false,
    teamOnly:    false,
  },

  // ── COMING SOON ──────────────────────────────────────────────
  {
    id: 'truth-dare',       title: 'Truth or Dare',      emoji: '🎲', category: 'social',
    description: 'The classic party dare game.',
    players: '2–12', minPlayers: 2, maxPlayers: 12, implemented: false,
  },
  {
    id: 'most-likely-to',   title: 'Most Likely To',     emoji: '🗳️', category: 'social',
    description: 'Vote for who is most likely to…',
    players: '3–12', minPlayers: 3, maxPlayers: 12, implemented: false,
  },
  {
    id: 'two-truths',       title: 'Two Truths & a Lie', emoji: '🤥', category: 'social',
    description: 'Can you spot the lie?',
    players: '3–12', minPlayers: 3, maxPlayers: 12, implemented: false,
  },
  {
    id: 'emoji-story',      title: 'Emoji Story',        emoji: '📖', category: 'creative',
    description: 'Tell a story using only emojis.',
    players: '2–12', minPlayers: 2, maxPlayers: 12, implemented: false,
  },
  {
    id: 'one-word-story',   title: 'One-Word Story',     emoji: '📝', category: 'creative',
    description: 'Build a story one word at a time.',
    players: '3–12', minPlayers: 3, maxPlayers: 12, implemented: false,
  },
  {
    id: 'forbidden-word',   title: 'Forbidden Word',     emoji: '🚫', category: 'word',
    description: 'Describe without using the forbidden word.',
    players: '2–12', minPlayers: 2, maxPlayers: 12, implemented: false,
  },
  {
    id: 'guess-word',       title: 'Guess the Word',     emoji: '🔤', category: 'word',
    description: 'Guess the mystery word from clues.',
    players: '2–12', minPlayers: 2, maxPlayers: 12, implemented: false,
  },
  {
    id: '20-questions',     title: '20 Questions',       emoji: '❓', category: 'word',
    description: 'Is it animal, vegetable or mineral?',
    players: '2–12', minPlayers: 2, maxPlayers: 12, implemented: false,
  },
  {
    id: 'odd-one-out',      title: 'Odd One Out',        emoji: '🔍', category: 'puzzle',
    description: 'Spot the item that does not belong.',
    players: '1–12', minPlayers: 1, maxPlayers: 12, implemented: false,
  },
  {
    id: 'tic-tac-toe',      title: 'Tic-Tac-Toe',        emoji: '⭕', category: 'board',
    description: 'Three in a row wins.',
    players: '2', minPlayers: 2, maxPlayers: 2, implemented: false,
  },
  {
    id: 'connect-four',     title: 'Connect Four',       emoji: '🔴', category: 'board',
    description: 'Drop tokens to connect four.',
    players: '2', minPlayers: 2, maxPlayers: 2, implemented: false,
  },
  {
    id: 'lucky-grid',       title: 'Lucky Grid',         emoji: '🍀', category: 'board',
    description: 'Reveal squares and collect the most points.',
    players: '2–8', minPlayers: 2, maxPlayers: 8, implemented: false,
  },
  {
    id: 'quick-math',       title: 'Quick Math',         emoji: '🔢', category: 'reaction',
    description: 'Solve mental maths under pressure.',
    players: '1–12', minPlayers: 1, maxPlayers: 12, implemented: false,
  },
  {
    id: 'number-memory',    title: 'Number Memory',      emoji: '🔢', category: 'puzzle',
    description: 'Remember the number sequence.',
    players: '1–12', minPlayers: 1, maxPlayers: 12, implemented: false,
  },
  {
    id: 'higher-lower',     title: 'Higher or Lower',    emoji: '📊', category: 'competitive',
    description: 'Guess whether the next number is higher or lower.',
    players: '2–12', minPlayers: 2, maxPlayers: 12, implemented: false,
  },
  {
    id: 'unscramble',       title: 'Unscramble',         emoji: '🔀', category: 'word',
    description: 'Rearrange the letters to form a word.',
    players: '1–12', minPlayers: 1, maxPlayers: 12, implemented: false,
  },
];

/** Lookup by game ID */
export function getGame(id) {
  return GAME_REGISTRY.find(g => g.id === id) || null;
}

/** All implemented game IDs */
export function implementedGameIds() {
  return GAME_REGISTRY.filter(g => g.implemented).map(g => g.id);
}

/** Category list with display info */
export const CATEGORIES = [
  { id: 'all',         label: 'All Games',  emoji: '🎮' },
  { id: 'creative',    label: 'Creative',   emoji: '🎨' },
  { id: 'social',      label: 'Social',     emoji: '👥' },
  { id: 'word',        label: 'Word',       emoji: '💬' },
  { id: 'board',       label: 'Board',      emoji: '🎲' },
  { id: 'puzzle',      label: 'Puzzle',     emoji: '🧩' },
  { id: 'reaction',    label: 'Reaction',   emoji: '⚡' },
  { id: 'trivia',      label: 'Trivia',     emoji: '📚' },
  { id: 'competitive', label: 'Versus',     emoji: '⚔️' },
];

