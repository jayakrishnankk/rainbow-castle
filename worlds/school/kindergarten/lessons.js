// The kindergarten's two lessons, adding and taking away, and how big the numbers get.
//
// Sizes are "up to 5", "up to 10" and "up to 20": the counters sit in ten-frames (rows of five), so
// a child sees "a full ten and 3 more" without counting. Each child has their own size (saved in
// kindergarten.js); a 4-year-old starts at 5, a 6-year-old at 20.
//
// Up to 20 adds one grown-up strategy each, as an optional layer for the older child:
//   adding: count on from the first number ("We know 8. 9, 10, 11...") instead of from 1,
//   taking away: count back as each one leaves ("11, 10, 9, 8").

export const SIZES = [5, 10, 20];
export const DEFAULT_SIZE = [20, 5]; // Avni, Ansh

// things that arrive (adding) and things that leave (taking away)
export const ADD_THEMES = [
  { ch: '🍎', one: 'apple', many: 'apples' },
  { ch: '🐥', one: 'chick', many: 'chicks' },
  { ch: '⭐', one: 'star', many: 'stars' },
  { ch: '🍓', one: 'strawberry', many: 'strawberries' },
  { ch: '🐞', one: 'ladybug', many: 'ladybugs' }
];
export const TAKE_THEMES = [
  { ch: '🎈', one: 'balloon', many: 'balloons', go: 'float away', leave: 'float' },
  { ch: '🐦', one: 'bird', many: 'birds', go: 'fly away', leave: 'fly' },
  { ch: '🐸', one: 'frog', many: 'frogs', go: 'hop away', leave: 'hop' },
  { ch: '🫧', one: 'bubble', many: 'bubbles', go: 'pop', leave: 'pop' },
  { ch: '🍪', one: 'cookie', many: 'cookies', go: 'get munched', leave: 'munch' }
];

export const noun = (t, n) => n === 1 ? t.one : t.many;

const rnd = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));

// a fresh problem: adding a + b, or taking b away from a. Never the same as the last one.
export function makeProblem(kind, size, last) {
  for (let tries = 0; tries < 20; tries++) {
    let a, b;
    if (kind === 'add') {
      if (size === 5) { a = rnd(1, 4); b = rnd(1, 5 - a); }
      else if (size === 10) { a = rnd(2, 8); b = rnd(1, 10 - a); }
      else { a = rnd(5, 15); b = rnd(2, Math.min(9, 20 - a)); }
    } else {
      if (size === 5) { a = rnd(2, 5); b = rnd(1, a - 1); }
      else if (size === 10) { a = rnd(4, 10); b = rnd(1, Math.min(6, a - 1)); }
      else { a = rnd(11, 20); b = rnd(2, Math.min(9, a - 1)); }
    }
    if (!last || last.kind !== kind || last.a !== a || last.b !== b) return { kind, a, b, size };
  }
  return { kind, a: 2, b: 1, size };
}

// Carsi's words. Process praise only: what the child did, never how clever they are.
export const PRAISE_ADD = [
  'you added them one by one!',
  'you counted every one!',
  'you kept counting all the way!',
  'you touched each one as you counted!'
];
export const PRAISE_TAKE = [
  'you took them away one at a time!',
  'you counted what was left!',
  'you watched them go, one by one!',
  'you kept counting all the way!'
];
