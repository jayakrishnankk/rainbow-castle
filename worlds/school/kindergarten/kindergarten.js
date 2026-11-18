// The kindergarten class at school. Princess Carsi is the teacher; Avni and Ansh take turns, and their
// classmates (shared/classmates.js) sit on the rug: one of them helps in each lesson (in adding they
// bring their favourite things), the whole class bobs along as the child counts, and everyone waves at
// the end. Tapping a classmate says who they are and picks them as the next lesson's helper.
//
// Two lessons, chosen in the dock: adding (➕) and taking away (➖). Each is a short story on the
// counting mat (ten-frames, rows of five):
//   adding:      "Here are 8 apples." → tap to add 5 more, one by one → count them → 8 + 5 = 13
//   taking away: "Here are 12 balloons." → tap the ones that float away → count what's left → 12 − 4 = 8
// The chalkboard writes the number sentence as it happens. Every tap moves the story on; there is
// no question to answer and nothing to get wrong. Tapping any counter while counting counts that one,
// so a child can touch each thing as they count it, the way they do with real objects.
//
// The size button (a picture of 5, 10 or 20 dots) sets how big the numbers get. Each child has their
// own size, kept on this device (rainbowCastle.kindergarten.v1); the page works without it.
// Up to 20, adding counts on from the first number and taking away counts back (see lessons.js).
//
// Turns work as in the pool: a random 3 to 5 minutes each (the bar under the playing child's card),
// a lesson in progress always finishes first, and a parent can pick one child per device by holding
// the cards for 2 seconds (shared/players.js).
import * as sfx from '../../../shared/audio.js';
import { speak, hush } from '../../../shared/speech.js';
import { createFx } from '../../../shared/particles.js';
import { KIDS, turnFromUrl, withTurn, soloKid } from '../../../shared/turns.js';
import { addParentHold } from '../../../shared/players.js';
import { classOf, kidSvg } from '../../../shared/classmates.js';
import { SIZES, DEFAULT_SIZE, ADD_THEMES, TAKE_THEMES, noun, makeProblem, PRAISE_ADD, PRAISE_TAKE } from './lessons.js';

const $ = s => document.querySelector(s);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const RAINBOW = ['#FF5A5F', '#FF9F1C', '#FFD84D', '#6BCB77', '#4D96FF', '#9B5DE5'];
const pick = list => list[Math.floor(Math.random() * list.length)];

// ---------- saved size, one per child ----------
const SAVE_KEY = 'rainbowCastle.kindergarten.v1';
function load() {
  const out = { kids: DEFAULT_SIZE.map(size => ({ size })) };
  try {
    const o = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (o && Array.isArray(o.kids)) o.kids.slice(0, 2).forEach((k, i) => { if (k && SIZES.includes(k.size)) out.kids[i].size = k.size; });
  } catch (e) {}
  return out;
}
const saved = load();
const save = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(saved)); } catch (e) {} };

const solo = soloKid();   // null = both take turns; 0/1 = only that child on this device
let turnIdx = turnFromUrl();
const kid = () => KIDS[turnIdx].name;
const me = () => saved.kids[turnIdx];

// ---------- Carsi talks: words in the bubble (always) and spoken aloud (when sound is on) ----------
const bubble = $('#bubble'), carsi = $('#carsi');
let sayId = 0;
function sayLine(text) {
  const id = ++sayId;
  bubble.textContent = text;
  bubble.classList.add('show');
  carsi.classList.add('talking');
  return speak(text).then(() => {
    if (id !== sayId) return;
    carsi.classList.remove('talking');
    setTimeout(() => { if (id === sayId) bubble.classList.remove('show'); }, 1400);
  });
}
function replay(node, cls, ms = 900) {
  node.classList.remove(cls); void node.getBoundingClientRect(); node.classList.add(cls);
  clearTimeout(node._t); node._t = setTimeout(() => node.classList.remove(cls), ms);
}

const screenFx = createFx($('#fx'));
function burstAt(node, colors = RAINBOW, n = 14) {
  const r = node.getBoundingClientRect();
  screenFx.burst(r.left + r.width / 2, r.top + r.height / 2, colors, n, 4);
}

// ---------- number flags on the wall ----------
const bunting = $('#bunting');
for (let n = 1; n <= 10; n++) {
  const f = document.createElement('button');
  f.className = 'flag';
  f.textContent = n;
  f.style.setProperty('--c', ['#FFC2DD', '#FFD8A8', '#FFF0A0', '#C9F0C0', '#B8DCFF', '#DCC8FF'][(n - 1) % 6]);
  f.setAttribute('aria-label', 'Number ' + n);
  f.addEventListener('click', () => {
    replay(f, 'swing');
    sfx.bell(sfx.NOTES[(n - 1) % 7] * (n > 7 ? 2 : 1));
    sayLine(String(n));
    // that many stars float up from the flag
    const r = f.getBoundingClientRect();
    for (let k = 0; k < n; k++) {
      screenFx.release(r.left + r.width / 2, r.bottom, { ch: '⭐', n: 1, spread: 18, vy: [1, 2.4], vx: 1.6, g: 0.02, decay: 0.012, size: [16, 22] });
    }
  });
  bunting.appendChild(f);
}

// ---------- the classmates on the rug ----------
// Each child has their own class (Avni's and Ansh's), so the rug is rebuilt when the turn passes.
// A child with no classmates listed yet gets an empty rug (hidden) and lessons without a helper.
const classRow = $('#class');
let roster = [], mates = [];
let nextHelper = -1;     // the next lesson's helper (-1: nobody)
let chosen = false;      // a child picked them by tapping
function buildClass() {
  roster = classOf(turnIdx);
  classRow.innerHTML = '';
  classRow.hidden = roster.length === 0;
  mates = roster.map((k, i) => {
    const b = document.createElement('button');
    b.className = 'mate';
    b.setAttribute('aria-label', k.name);
    b.innerHTML = kidSvg(k) + `<span class="name" aria-hidden="true">${k.name}</span>`;
    b.addEventListener('click', () => tapMate(i));
    classRow.appendChild(b);
    return b;
  });
  nextHelper = roster.length ? Math.floor(Math.random() * roster.length) : -1;
  chosen = false;
}
buildClass();
const favTheme = k => ADD_THEMES.find(t => t.ch === k.fav) || ADD_THEMES[0];
function markHelper(i) { mates.forEach((m, k) => m.classList.toggle('helper', k === i)); }
function everyone(cls, ms) { mates.forEach((m, k) => setTimeout(() => replay(m, cls, ms), reduced ? 0 : k * 60)); }
function hopHelper(cls, ms) { if (mates[L.helper]) replay(mates[L.helper], cls, ms); }
function tapMate(i) {
  const k = roster[i];
  replay(mates[i], 'wave', 1600);
  sfx.bell(sfx.NOTES[i % 7] * 2);
  if (mode !== 'menu' || switching) return;   // during a lesson they just wave
  hidePointer();
  nextHelper = i; chosen = true;
  markHelper(i);
  sayLine(`This is ${k.name}! ${k.name} loves ${favTheme(k).many}. ${k.name} will help next!`);
  schedulePointer();
}

// ---------- the chalkboard ----------
const eq = $('#eq');
// parts: numbers and signs, e.g. [8, '+', 5, '=', '?']; the answer box is the 5th part
function writeBoard(parts, fresh = -1) {
  eq.innerHTML = '';
  parts.forEach((p, i) => {
    const s = document.createElement('span');
    if (i === 4) s.className = 'ans' + (p === '' ? '' : ' done');
    else if (typeof p === 'string') s.className = 'op';
    else s.className = i === 0 ? 'n1' : 'n2';
    if (i === fresh) s.classList.add('pop');
    s.textContent = p;
    eq.appendChild(s);
  });
  $('#board').setAttribute('aria-label', 'Chalkboard: ' + (parts.length ? parts.join(' ').replace('−', 'take away') : 'empty'));
}
function boardAnswer(n, done = false) {
  const a = eq.querySelector('.ans');
  if (!a) return;
  a.textContent = n;
  a.classList.toggle('done', done);
  replay(a, 'tick', 400);
}

// ---------- the counting mat ----------
const mat = $('#mat'), matWrap = $('#matWrap');
let cells = [];   // { btn, counter (span or null), group, gone, n }
let matSize = 0;
function buildMat(size) {
  matSize = size;
  mat.innerHTML = '';
  cells = [];
  const frames = size === 20 ? 2 : 1, per = size === 5 ? 5 : 10;
  for (let f = 0; f < frames; f++) {
    const fr = document.createElement('div');
    fr.className = 'frame';
    for (let k = 0; k < per; k++) {
      const i = cells.length;
      const b = document.createElement('button');
      b.className = 'cell';
      b.setAttribute('aria-label', 'Empty space');
      b.addEventListener('click', () => tapCell(i));
      fr.appendChild(b);
      cells.push({ btn: b, counter: null, group: '', gone: false, n: 0 });
    }
    mat.appendChild(fr);
  }
  fit();
}
function putCounter(i, ch, group) {
  const c = cells[i];
  if (!c) return;
  c.btn.innerHTML = '';
  const s = document.createElement('span');
  s.className = 'counter ' + group;
  s.textContent = ch;
  c.btn.appendChild(s);
  Object.assign(c, { counter: s, group, gone: false, n: 0 });
  c.btn.setAttribute('aria-label', ch);
}
function label(i) {
  const c = cells[i];
  c.btn.setAttribute('aria-label', c.gone ? 'Gone' : c.counter.textContent + (c.n ? ', ' + c.n : ''));
}

// Size the cells to fill the space: up to 20 picks two frames side by side or one above the other,
// whichever gives bigger cells. (The numbers below are the frames' padding, borders and gaps.)
function fit() {
  if (!matSize) return;
  const r = matWrap.getBoundingClientRect();
  const w = r.width, h = r.height;
  let cell, stack = false;
  if (matSize === 20) {
    const side = Math.min((w - 72) / 10.35, (h - 30) / 2);
    const tall = Math.min((w - 36) / 5, (h - 58) / 4.2);
    stack = tall > side;
    cell = Math.max(side, tall);
  } else {
    const rows = matSize === 5 ? 1 : 2;
    cell = Math.min((w - 36) / 5, (h - 25 - (rows - 1) * 4) / rows);
  }
  mat.classList.toggle('stack', stack);
  mat.style.setProperty('--cell', Math.max(30, Math.min(92, Math.floor(cell))) + 'px');
}
addEventListener('resize', fit);

// ---------- a lesson ----------
let mode = 'menu';      // 'menu' | 'lesson'
let L = null;           // the lesson in progress
let lessonId = 0;       // bumps when a lesson ends or is left, so its pending steps stop
let lastProblem = null;
const themeNext = { add: 0, take: 0 };
let switching = false;

const total = () => L.kind === 'add' ? L.a + L.b : L.a - L.b;
const present = () => cells.map((c, i) => i).filter(i => cells[i].counter && !cells[i].gone);
const pips = n => { L.pips = n; };

async function startLesson(kind) {
  if (mode !== 'menu' || switching) return;
  hidePointer();
  const id = ++lessonId;
  mode = 'lesson';
  const p = makeProblem(kind, me().size, lastProblem);
  lastProblem = p;
  const helper = nextHelper;
  markHelper(helper);
  // adding: the helper brings their favourite things; taking away: the themes take turns
  const theme = kind === 'add' && chosen ? favTheme(roster[helper])
    : (kind === 'add' ? ADD_THEMES : TAKE_THEMES)[themeNext[kind]++ % 5];
  chosen = false;
  L = { ...p, theme, helper, stage: 'intro', n: 0, counted: 0, id, pips: 0 };
  renderActions([]);
  buildMat(p.size);
  writeBoard([p.a], 0);
  for (let i = 0; i < p.a; i++) {
    putCounter(i, theme.ch, 'first');
    sfx.tone(sfx.NOTES[i % 7] * (i >= 7 ? 2 : 1), { dur: 0.25, vol: 0.12 });
    if (!reduced) await sleep(70);
    if (id !== lessonId) return;
  }
  await sayLine(`Here are ${p.a} ${noun(theme, p.a)}.`);
  if (id !== lessonId) return;

  if (kind === 'add') {
    L.stage = 'add';
    writeBoard([p.a, '+', p.b], 2);
    renderActions([{ id: 'more', icon: theme.ch + '+', word: 'Add' }]);
    hopHelper('hop', 600);
    sayLine(roster[helper] ? `${roster[helper].name} brings ${p.b} more. Tap!` : `${p.b} more are coming. Tap!`);
  } else {
    L.stage = 'take';
    writeBoard([p.a, '−', p.b], 2);
    renderActions([{ id: 'less', icon: theme.ch + '−', word: 'Away' }]);
    hopHelper('wave', 1600);
    sayLine(`${p.b} will ${theme.go}. Tap ${p.b === 1 ? 'one' : 'them'}!`);
  }
}

// adding: the next one drops into the next space
function addOne() {
  if (!L || L.stage !== 'add' || L.n >= L.b) return;
  const i = L.a + L.n;
  putCounter(i, L.theme.ch, 'more');
  hopHelper('hop', 500);
  L.n++;
  renderPips();
  sfx.bell(sfx.NOTES[Math.min(L.n, 6)]);
  burstAt(cells[i].btn, ['#7CC4FF', '#FFFFFF', '#FFD84D'], 8);
  if (L.n === L.b) toCount();
}

// taking away: the tapped one (or the last one) leaves, and a dashed ghost stays in its space
function takeOne(i) {
  if (!L || L.stage !== 'take' || L.n >= L.b) return;
  const left = present();
  if (i === undefined || !left.includes(i)) i = left[left.length - 1];
  const c = cells[i];
  flyAway(c.btn, L.theme);
  hopHelper('wave', 1600);
  c.gone = true;
  c.counter.className = 'counter gone';
  label(i);
  L.n++;
  renderPips();
  // up to 20: count back as each one leaves
  if (L.size === 20) {
    const now = L.a - L.n;
    if (eq.querySelector('.ans')) boardAnswer(now);
    else { writeBoard([L.a, '−', L.b, '=', now], 4); }
    sayLine(String(now));
  }
  if (L.n === L.b) {
    const id = L.id;
    if (L.size === 20) setTimeout(() => { if (id === lessonId) finishLesson(); }, 900);
    else toCount();
  }
}

// the leaving counter's copy floats, flies, hops, pops or gets munched
function flyAway(btn, theme) {
  const r = btn.getBoundingClientRect();
  const x = r.left + r.width / 2, y = r.top + r.height / 2;
  if (theme.leave === 'pop') {
    sfx.pop();
    screenFx.release(x, y, { ch: '💦', n: 1, vy: [-2, -1], g: 0.15, decay: 0.03, size: [20, 26] });
    screenFx.burst(x, y, ['#BDEBFF', '#FFFFFF'], 10, 4);
    return;
  }
  if (theme.leave === 'munch') {
    sfx.tone(300, { dur: 0.12, vol: 0.2, type: 'square', slideTo: 180 });
    sfx.tone(280, { dur: 0.12, vol: 0.2, type: 'square', slideTo: 160, when: 0.16 });
    screenFx.burst(x, y, ['#C68A4E', '#8B5A2B', '#FFE6B3'], 14, 3, 0.2);
    return;
  }
  const f = document.createElement('div');
  f.className = 'leaver';
  f.textContent = theme.ch;
  f.style.fontSize = (r.height * 0.6) + 'px';
  f.style.left = x + 'px'; f.style.top = y + 'px';
  document.body.appendChild(f);
  void f.getBoundingClientRect();
  const away = {
    float: `translate(-50%,-50%) translate(${(Math.random() - 0.5) * 80}px, ${-y - 80}px)`,
    fly: `translate(-50%,-50%) translate(${(Math.random() < 0.5 ? -1 : 1) * innerWidth * 0.7}px, ${-y * 0.8}px) rotate(20deg)`,
    hop: `translate(-50%,-50%) translate(${innerWidth - x + 80}px, -60px) rotate(30deg)`
  }[theme.leave];
  f.style.transform = away;
  f.style.opacity = '0.2';
  if (theme.leave === 'hop') sfx.boing();
  else if (theme.leave === 'fly') for (let k = 0; k < 3; k++) sfx.tone(2400 + Math.random() * 400, { dur: 0.09, vol: 0.1, slideTo: 3200, when: k * 0.11 });
  else sfx.tone(400, { dur: 0.6, vol: 0.15, slideTo: 900 });
  setTimeout(() => f.remove(), 1000);
}

// counting: all the ones in the frames (adding up to 20 counts on from the first number)
function toCount() {
  L.stage = 'count';
  L.order = present();
  if (L.kind === 'add' && L.size === 20) {
    L.counted = L.a;
    for (let i = 0; i < L.a; i++) { cells[i].n = i + 1; replay(cells[i].counter, 'wiggle', 500); }
    cells[L.a - 1].counter.dataset.n = L.a;
    label(L.a - 1);
    writeBoard([L.a, '+', L.b, '=', L.a], 4);
    eq.querySelector('.ans').classList.remove('done');
    sayLine(`We know ${L.a}. Let's count on!`);
  } else {
    L.counted = 0;
    writeBoard([L.a, L.kind === 'add' ? '+' : '−', L.b, '=', ''], 4);
    sayLine(L.kind === 'add' ? "How many now? Let's count!" : "How many are left? Let's count!");
  }
  renderActions([{ id: 'count', icon: '👆', word: 'Count' }]);
}

let countedNudge = 0;
function countNext(i) {
  if (!L || L.stage !== 'count') return;
  const todo = L.order.filter(k => !cells[k].n);
  if (i !== undefined && !todo.includes(i)) {
    // already counted: a little wiggle, and now and then a reminder
    if (cells[i] && cells[i].counter && !cells[i].gone) {
      replay(cells[i].counter, 'wiggle', 500);
      if (Date.now() - countedNudge > 4000) { countedNudge = Date.now(); sayLine('We counted that one! Find another.'); }
    }
    return;
  }
  const k = i !== undefined ? i : todo[0];
  if (k === undefined) return;
  L.counted++;
  const c = cells[k];
  c.n = L.counted;
  c.counter.dataset.n = L.counted;
  label(k);
  boardAnswer(L.counted);
  everyone('nod', 400);   // the whole class counts along
  sfx.bell(sfx.NOTES[(L.counted - 1) % 7] * (L.counted > 7 ? 2 : 1));
  sayLine(String(L.counted));
  if (L.counted === total()) finishLesson();
}

async function finishLesson() {
  const id = L.id;
  L.stage = 'done';
  renderActions([]);
  const c = total(), op = L.kind === 'add' ? '+' : '−';
  writeBoard([L.a, op, L.b, '=', c]);
  eq.querySelector('.ans').classList.add('tick');
  await sleep(700);
  if (id !== lessonId) return;
  sfx.chime();
  burstAt($('#board'), RAINBOW, 26);
  burstAt(mat, ['#FFD84D', '#FFFFFF', '#FF9BC8', '#7CC4FF'], 22);
  replay(carsi, 'hop', 600);
  everyone('wave', 1600);
  await sayLine(`${kid()}, ${pick(L.kind === 'add' ? PRAISE_ADD : PRAISE_TAKE)}`);
  if (id !== lessonId) return;
  await sayLine(L.kind === 'add' ? `${L.a} and ${L.b} make ${c}.` : `${L.a} take away ${L.b} leaves ${c}.`);
  if (id !== lessonId) return;
  if (c > 10) await sayLine(`That's ten and ${c - 10} more.`);
  else if (c === 10) await sayLine("That's a full ten!");
  if (id !== lessonId) return;
  endLesson();
  if (timeUp) { await switchTurn(); return; }
  sayLine(`What next, ${kid()}?`);
  schedulePointer();
}

function endLesson() {
  lessonId++;
  mode = 'menu';
  if (L) lastKind = L.kind;
  L = null;
  if (roster.length > 1) nextHelper = (nextHelper + 1 + Math.floor(Math.random() * (roster.length - 1))) % roster.length;
  markHelper(-1);
  renderMenu();
}

function leaveLesson() {
  if (mode !== 'lesson') return;
  hush();
  endLesson();
  if (timeUp) { switchTurn(); return; }
  sayLine("Okay! Let's choose another.");
  schedulePointer();
}

// ---------- taps on the mat, the board and Carsi ----------
function tapCell(i) {
  const c = cells[i];
  if (L && L.stage === 'add') return addOne();
  if (L && L.stage === 'take') return c.counter && !c.gone ? takeOne(i) : takeOne();
  if (L && L.stage === 'count') return c.counter && !c.gone ? countNext(i) : countNext();
  // otherwise the counters are toys: they wiggle and sing
  if (c.counter && !c.gone) { replay(c.counter, 'wiggle', 500); sfx.bell(sfx.NOTES[i % 7]); }
  else { sfx.pop(); burstAt(c.btn, ['#FFE66D', '#FFFFFF'], 6); }
}

const BOARD_LINES = ['Chalk dust!', 'Swish swish!', 'A clean board!'];
let boardIdx = 0;
$('#board').addEventListener('click', () => {
  burstAt($('#board'), ['#FFFFFF', '#FFFDF7', '#FFE66D'], 12);
  sfx.twinkle();
  // during a lesson Carsi reads the board out
  if (L && L.stage !== 'intro') {
    const words = [...eq.children].map(s => s.textContent || 'how many').join(' ')
      .replace('+', 'plus').replace('−', 'take away').replace('=', 'makes');
    sayLine(words);
  } else if (mode === 'menu') sayLine(BOARD_LINES[boardIdx++ % BOARD_LINES.length]);
});

const CARSI_LINES = ['I love counting with you!', 'Tap a friend to pick a helper!', 'Tap the number flags!', 'Shall we add, or take away?', 'Numbers are everywhere!'];
let carsiIdx = 0;
carsi.addEventListener('click', () => {
  replay(carsi, 'point', 1000);
  sfx.twinkle();
  if (!L) {
    let line = CARSI_LINES[carsiIdx++ % CARSI_LINES.length];
    if (!roster.length && line.includes('helper')) line = CARSI_LINES[carsiIdx++ % CARSI_LINES.length];
    return void sayLine(line);
  }
  // during a lesson she says what to do next
  if (L.stage === 'add') sayLine(`Tap to add ${L.b - L.n} more!`);
  else if (L.stage === 'take') sayLine(`Tap ${L.b - L.n} more to ${L.theme.go}!`);
  else if (L.stage === 'count') sayLine('Tap each one as you count!');
});

// ---------- turns: a random 3 to 5 minutes each (only when both children play here) ----------
let turnTotal = 0, turnLeft = 0, timeUp = false, warned = false;
function startTurnTimer() {
  turnTotal = turnLeft = 180 + Math.floor(Math.random() * 121);
  timeUp = false; warned = false;
  showTime();
}
function showTime() {
  const bar = $(`#kids .kidCard[data-kid="${turnIdx}"] .time`);
  if (bar) bar.style.setProperty('--left', Math.max(0, turnLeft / turnTotal).toFixed(3));
}
if (solo === null) {
  setInterval(() => {
    if (document.hidden || switching || timeUp) return;
    turnLeft--;
    showTime();
    if (turnLeft === 15 && !warned && mode === 'menu') {
      warned = true;
      sayLine(`A little more, then it's ${KIDS[1 - turnIdx].name}'s turn.`);
    }
    if (turnLeft <= 0) {
      timeUp = true;
      if (mode === 'menu') switchTurn();
    }
  }, 1000);
}

async function switchTurn() {
  if (switching || solo !== null) return;
  switching = true;
  hidePointer();
  await sayLine(`${kid()}, you counted so many things!`);
  turnIdx = 1 - turnIdx;
  history.replaceState(null, '', withTurn(location.pathname, turnIdx));
  startTurnTimer();
  renderCards();
  buildClass();
  renderMenu();
  buildMat(me().size);
  writeBoard([]);
  const card = $(`#kids .kidCard[data-kid="${turnIdx}"]`);
  replay(card, 'pop', 800);
  burstAt(card, [KIDS[turnIdx].color, '#FFFFFF', '#FFD84D'], 24);
  sfx.chime();
  switching = false;
  await sayLine(`${kid()}'s turn! Let's count.`);
  schedulePointer();
}

// ---------- the two cards at the top: just the names, nothing to compare ----------
function renderCards() {
  const box = $('#kids');
  box.innerHTML = '';
  const who = solo === null ? [0, 1] : [solo];
  for (const i of who) {
    const on = i === turnIdx;
    const card = document.createElement('div');
    card.className = 'kidCard' + (on ? ' on' : '');
    card.dataset.kid = i;
    card.style.setProperty('--kid', KIDS[i].color);
    card.innerHTML = `<span>${KIDS[i].name}</span>${on && solo === null ? '<span class="time" aria-hidden="true"></span>' : ''}`;
    box.appendChild(card);
  }
  box.setAttribute('aria-label', who.length > 1 ? `${kid()}'s turn` : `${kid()} is playing`);
  showTime();
}

// ---------- the dock ----------
const dock = $('#dock');
let lastKind = 'add';
let usingKeys = false;
addEventListener('keydown', () => { usingKeys = true; });
addEventListener('pointerdown', () => { usingKeys = false; });

function sizeIcon(size) {
  return `<span class="dots" aria-hidden="true">${'<i></i>'.repeat(size)}</span><span class="word" aria-hidden="true">${size}</span>`;
}

function renderMenu() {
  dock.innerHTML = '';
  dock.classList.remove('busy');
  dock.setAttribute('aria-label', 'Lessons');
  const s = document.createElement('button');
  s.className = 'size';
  s.innerHTML = sizeIcon(me().size);
  s.setAttribute('aria-label', `Numbers up to ${me().size}. Tap for another size.`);
  s.addEventListener('click', () => {
    if (mode !== 'menu' || switching) return;
    const m = me();
    m.size = SIZES[(SIZES.indexOf(m.size) + 1) % SIZES.length];
    save();
    sfx.pop();
    renderMenu();
    buildMat(m.size);
    writeBoard([]);
    sayLine(`Up to ${m.size}!`);
    dock.querySelector('.size').focus({ preventScroll: true });
  });
  dock.appendChild(s);
  const gap = document.createElement('span'); gap.className = 'gap'; dock.appendChild(gap);
  [['add', '➕', 'Add'], ['take', '➖', 'Take away']].forEach(([kind, icon, word]) => {
    const b = document.createElement('button');
    b.className = 'act' + (kind === lastKind ? ' next' : '');
    b.dataset.kind = kind;
    b.innerHTML = `<span class="ico" aria-hidden="true">${icon}</span><span class="word" aria-hidden="true">${word}</span>`;
    b.setAttribute('aria-label', kind === 'add' ? 'Adding' : 'Taking away');
    b.addEventListener('click', () => { sfx.pop(); startLesson(kind); });
    dock.appendChild(b);
  });
}

function renderActions(buttons) {
  dock.innerHTML = '';
  dock.classList.toggle('busy', !buttons.length);
  dock.setAttribute('aria-label', `What should ${kid()} do?`);
  const back = document.createElement('button');
  back.className = 'act small';
  back.innerHTML = '<span class="ico" aria-hidden="true">↩</span>';
  back.setAttribute('aria-label', 'Stop and choose another lesson');
  back.addEventListener('click', leaveLesson);
  dock.appendChild(back);
  const gap = document.createElement('span'); gap.className = 'gap'; dock.appendChild(gap);
  buttons.forEach(b => {
    const e = document.createElement('button');
    e.className = 'act main';
    e.innerHTML = `<span class="ico" aria-hidden="true">${b.icon}</span><span class="word" aria-hidden="true">${b.word}</span>`;
    e.setAttribute('aria-label', b.word);
    e.addEventListener('click', () => act(b.id));
    dock.appendChild(e);
  });
  if (L && L.pips) renderPips();
  if (usingKeys && buttons.length) dock.querySelector('.act.main').focus({ preventScroll: true });
}
// the little dots next to the button fill as things come or go
function renderPips() {
  if (!L || !(L.stage === 'add' || L.stage === 'take')) return;
  let p = dock.querySelector('.pips');
  if (!p) {
    p = document.createElement('span');
    p.className = 'pips';
    p.setAttribute('aria-hidden', 'true');
    p.innerHTML = '<i></i>'.repeat(L.b);
    dock.appendChild(p);
  }
  [...p.children].forEach((d, k) => d.classList.toggle('on', k < L.n));
}
function act(id) {
  if (id === 'more') addOne();
  else if (id === 'less') takeOne();
  else if (id === 'count') countNext();
}

// ---------- a hand pointing at a lesson when nobody has tapped for a while ----------
const pointer = $('#pointer');
let pointerTimer = 0;
function showPointer(target) {
  if (!target) return;
  const r = target.getBoundingClientRect();
  pointer.style.left = (r.left + r.width / 2 - 6) + 'px';
  pointer.style.top = (r.top - 60) + 'px';
  pointer.hidden = false;
}
function hidePointer() { pointer.hidden = true; clearTimeout(pointerTimer); }
function schedulePointer() {
  clearTimeout(pointerTimer);
  pointerTimer = setTimeout(() => {
    if (mode === 'menu' && !switching) showPointer(dock.querySelector('.act.next'));
  }, 6000);
}
addEventListener('pointerdown', () => { hidePointer(); if (mode === 'menu') schedulePointer(); });

// ---------- top bar ----------
$('#homeBtn').addEventListener('click', () => {
  hush();
  $('#curtain').classList.remove('open');
  setTimeout(() => { location.href = withTurn('../index.html', turnIdx); }, 600);
});
const soundBtn = $('#soundBtn');
soundBtn.addEventListener('click', () => {
  const on = soundBtn.getAttribute('aria-pressed') !== 'true';
  soundBtn.setAttribute('aria-pressed', on);
  sfx.setMuted(!on);
  if (!on) hush();
});
// grown-ups: hold the cards 2 s to choose who plays on this device; the room restarts with that child
addParentHold($('#kids'), choice => {
  hush();
  $('#curtain').classList.remove('open');
  setTimeout(() => { location.href = withTurn('index.html', choice === null ? turnIdx : choice); }, 600);
});

// ---------- hello ----------
if (solo === null) startTurnTimer();
renderCards();
renderMenu();
buildMat(me().size);
requestAnimationFrame(() => requestAnimationFrame(() => { fit(); $('#curtain').classList.add('open'); }));
(async () => {
  await sleep(500);
  replay(carsi, 'point', 1000);
  await sayLine(`Hi ${kid()}! Welcome to class!`);
  if (roster.length) {
    everyone('wave', 1600);
    sfx.twinkle();
    await sayLine('Everyone says hi!');
  }
  await sayLine("Let's add, or take away!");
  if (mode === 'menu' && !switching) showPointer(dock.querySelector('.act.next'));
})();
