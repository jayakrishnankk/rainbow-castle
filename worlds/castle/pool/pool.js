// The castle swimming pool. Princess Carsi is the swim teacher; Avni and Ansh are her students.
//
// The dock at the bottom is the swim path for the playing child's own cap level (White, Red, Yellow):
// one round button per skill and a square one for the level's "benchmark". The next skill glows.
// In a skill Carsi shows the move first, then the child copies it with their own swimmer (skills.js).
// Finishing a skill gives that child its token (a golden coin with the skill's picture), placed on its
// spot in the path and on the child's card at the top. The benchmark changes the child's cap colour.
// Each child has their own level and tokens. The two cards sit side by side with no count or total.
//
// Turns: in the default "both" mode each turn lasts a random 3 to 5 minutes (the bar under the
// playing child's card). A skill in progress is always finished before the turn passes. A parent can
// set "only Avni" or "only Ansh" for this device by holding the cards for 2 seconds (shared/players.js);
// then there is no timer.
//
// Progress is kept on this device in localStorage; the page works without it.
import { createSwimmer } from './swimmer.js';
import { LEVELS, NEXT_CAP } from './skills.js';
import * as sfx from '../../../shared/audio.js';
import { speak, hush } from '../../../shared/speech.js';
import { createFx } from '../../../shared/particles.js';
import { KIDS, turnFromUrl, withTurn, soloKid } from '../../../shared/turns.js';
import { addParentHold } from '../../../shared/players.js';

const $ = s => document.querySelector(s);
const NS = 'http://www.w3.org/2000/svg';
const svg = $('#scene');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const RAINBOW = ['#FF5A5F', '#FF9F1C', '#FFD84D', '#6BCB77', '#4D96FF', '#9B5DE5'];

// pool geometry in scene units (matches the drawing in index.html)
const P = {
  DECK: 560, WATER: 590, FLOOR: 735, DEEP: 800,
  steps: [{ x: 184, y: 605 }, { x: 228, y: 650 }, { x: 272, y: 695 }],
  deckL: 118, deckR: 930, ladderX: 857,
  shallowX: 340,   // where a swimmer lands at the bottom of the steps
  shallowEnd: 560, // past here the floor slopes into the deep end
  coachX: 540,     // Carsi's spot in the shallow end
  spotX: 380       // where the child practises, next to her
};

// ---------- saved progress, one record per child ----------
const SAVE_KEY = 'rainbowCastle.pool.v2';
const keyOf = (li, step) => LEVELS[li].id + '.' + step.id;
function load() {
  const fresh = () => ({ level: 0, tokens: [] });
  const out = { kids: [fresh(), fresh()] };
  try {
    localStorage.removeItem('rainbowCastle.pool.v1'); // the old shared record from before per-child progress
    const o = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (o && Array.isArray(o.kids)) {
      o.kids.slice(0, 2).forEach((k, i) => {
        if (k && Number.isInteger(k.level) && Array.isArray(k.tokens)) {
          out.kids[i] = { level: Math.max(0, Math.min(LEVELS.length, k.level)), tokens: k.tokens.filter(t => typeof t === 'string') };
        }
      });
    }
  } catch (e) {}
  return out;
}
const progress = load();
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(progress)); } catch (e) {} }
const capFor = level => (LEVELS[level] || NEXT_CAP);

// ---------- decor (drawn here to keep index.html short) ----------
function el(tag, attrs, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
function starPath(cx, cy, r) {
  let d = '';
  for (let k = 0; k < 10; k++) {
    const rr = k % 2 ? r * 0.45 : r, a = -Math.PI / 2 + k * Math.PI / 5;
    d += (k ? 'L' : 'M') + (cx + Math.cos(a) * rr).toFixed(1) + ' ' + (cy + Math.sin(a) * rr).toFixed(1);
  }
  return d + 'Z';
}
function buildDecor() {
  const defs = svg.querySelector('defs');
  const windows = $('#windows');
  [250, 500, 750].forEach((cx, i) => {
    const d = `M${cx - 75} 380 V263 A75 75 0 0 1 ${cx + 75} 263 V380 Z`;
    const clip = el('clipPath', { id: 'win' + i }, defs);
    el('path', { d }, clip);
    const g = el('g', { 'clip-path': `url(#win${i})` }, windows);
    el('path', { d, fill: 'url(#windowSky)' }, g);
    RAINBOW.slice(0, 5).forEach((c, k) =>
      el('path', { d: `M${cx - 62 + k * 8} 380 A${62 - k * 8} ${62 - k * 8} 0 0 1 ${cx + 62 - k * 8} 380`, fill: 'none', stroke: c, 'stroke-width': 8, opacity: 0.8 }, g));
    el('ellipse', { cx: cx - 30, cy: 392, rx: 70, ry: 34, fill: '#8EDB8E' }, g);
    el('ellipse', { cx: cx + 45, cy: 398, rx: 60, ry: 30, fill: '#6BCB77' }, g);
    el('path', { d: d + ` M${cx} 188 V380 M${cx - 75} 290 H${cx + 75}`, fill: 'none', stroke: '#4A3F6B', 'stroke-width': 6, 'stroke-linejoin': 'round' }, windows);
    el('rect', { x: cx - 85, y: 378, width: 170, height: 14, rx: 5, fill: '#FFF6E6', stroke: '#4A3F6B', 'stroke-width': 4 }, windows);
  });

  const stars = $('#stars');
  [[100, 240], [375, 215], [625, 225], [900, 245], [375, 340], [625, 330]].forEach(([x, y], i) => {
    const g = el('g', { class: 'wallStar tappable' }, stars);
    el('path', { d: starPath(x, y, 20), fill: RAINBOW[(i * 2) % 6], stroke: '#4A3F6B', 'stroke-width': 3, 'stroke-linejoin': 'round',
      class: 'twinkle', style: `animation-delay:${-i * 0.4}s` }, g);
    g.addEventListener('click', () => {
      restart(g, 'zing');
      sfx.bell(sfx.NOTES[(i + 2) % 7]);
      const s = toScreen(x, y); screenFx.burst(s.x, s.y, RAINBOW, 10, 4);
    });
  });

  const bunting = $('#bunting');
  const sag = x => 118 + 34 * Math.sin(Math.PI * (x - 30) / 940);
  el('path', { d: Array.from({ length: 48 }, (_, k) => (k ? 'L' : 'M') + (30 + k * 20) + ' ' + sag(30 + k * 20).toFixed(1)).join(''),
    fill: 'none', stroke: '#4A3F6B', 'stroke-width': 3 }, bunting);
  for (let k = 0; k < 20; k++) {
    const x = 60 + k * 46, y = sag(x);
    const f = el('polygon', { points: `${x - 17},${y} ${x + 17},${y} ${x},${y + 40}`, fill: RAINBOW[k % 6], stroke: '#4A3F6B', 'stroke-width': 3, 'stroke-linejoin': 'round', class: 'flag' }, bunting);
    f.addEventListener('click', () => { restart(f, 'swing'); sfx.bell(sfx.NOTES[k % 7]); });
  }

  const mosaic = $('#mosaic');
  for (let x = -400, k = 0; x < 1400; x += 24, k++) {
    el('rect', { x, y: 494, width: 20, height: 20, rx: 4, fill: RAINBOW[k % 6], opacity: 0.75 }, mosaic);
  }
}

// replay a one-shot CSS animation class
function restart(node, cls, ms = 1200) {
  node.classList.remove(cls); void node.getBoundingClientRect(); node.classList.add(cls);
  clearTimeout(node._t); node._t = setTimeout(() => node.classList.remove(cls), ms);
}

// ---------- fitting the scene to any screen ----------
// Keep the pool, decks and swimmers in view; on tall phones the extra height shows more wall above.
function fit() {
  const r = $('#stage').getBoundingClientRect();
  if (!r.width || !r.height) return;
  const portrait = r.width < r.height;
  const kx0 = portrait ? 80 : 40, kx1 = 970, ky0 = 110, ky1 = 805;
  const kw = kx1 - kx0, kh = ky1 - ky0, aspect = r.width / r.height;
  let x = kx0, y = ky0, w = kw, h = kh;
  if (aspect < kw / kh) { h = kw / aspect; y = ky0 - (h - kh) * 0.8; }
  else { w = kh * aspect; x = (kx0 + kx1) / 2 - w / 2; }
  svg.setAttribute('viewBox', `${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`);
}

function toScreen(x, y) {
  const m = svg.getScreenCTM();
  return { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f };
}
const unit = () => svg.getScreenCTM().a; // screen px per scene unit

// particles placed in scene units
const screenFx = createFx($('#fx'));
const fx = {
  burst(x, y, colors = RAINBOW, n = 18) { const s = toScreen(x, y); screenFx.burst(s.x, s.y, colors, n, 5); },
  drops(x, y, n = 10, power = 5, spread = 20) {
    const s = toScreen(x, y), u = unit();
    screenFx.drops(s.x, s.y, n, power * Math.max(0.7, Math.sqrt(u)), spread * u);
  },
  ring(x, y) { const s = toScreen(x, y); screenFx.ring(s.x, s.y, 10 * unit()); },
  pour(x, y) { const s = toScreen(x, y); screenFx.pour(s.x, s.y, 18 * unit()); },
  // bubbles from a swimmer's mouth (the playing child unless another is given), rising to the surface
  mouthBubbles(n = 5, who = learner()) {
    const hd = who.head();
    const top = toScreen(0, P.WATER).y, h = toScreen(hd.x, hd.y);
    screenFx.bubbles(h.x, Math.max(h.y, top + 8), n, top);
  }
};

// ---------- the teacher and the two children ----------
buildDecor();
fit();
addEventListener('resize', fit);

const solo = soloKid();               // null = both take turns; 0/1 = only that child on this device
let turnIdx = turnFromUrl();
const kid = () => KIDS[turnIdx].name;
const kp = (i = turnIdx) => progress.kids[i];

const layer = $('#swimmers');
const carsi = createSwimmer(layer, {
  id: 'carsi', label: 'Princess Carsi, the swim teacher', scale: 1.15,
  suit: '#A77BFF', trim: '#E2D4FF', hair: '#7A4A2A', hairDo: 'pony', crown: true
}, { x: P.coachX, y: P.FLOOR - 97.4 * 1.15, where: 'water', cap: '#FFB3D9' });
const LOOKS = [
  { id: 'avni', label: 'Avni', scale: 1, suit: '#FF7EB6', trim: '#FFC2DD', hair: '#3B2A20', hairDo: 'pigtails' },
  { id: 'ansh', label: 'Ansh', scale: 1, suit: '#4D96FF', trim: '#2F5FB3', hair: '#3B2A20', hairDo: 'short', trunks: true }
];
const kids = LOOKS.map((look, i) => {
  const s = createSwimmer(layer, look, { x: P.deckL, y: P.DECK - 97.4, where: 'deck', cap: capFor(kp(i).level).cap });
  s.show(i === turnIdx);
  return s;
});
const learner = () => kids[turnIdx];

const bubble = $('#bubble');
let sayId = 0;
// Carsi says a line: words in the bubble (always) and spoken aloud (when sound is on)
function sayLine(text) {
  const id = ++sayId;
  bubble.textContent = text;
  bubble.classList.add('show');
  carsi.talk(true);
  return speak(text).then(() => {
    if (id !== sayId) return;
    carsi.talk(false);
    setTimeout(() => { if (id === sayId) bubble.classList.remove('show'); }, 1400);
  });
}

// ---------- underwater friends, props and helpers the skills use ----------
const FRIENDS = [['🐠', 'a fish'], ['🐢', 'a turtle'], ['🦀', 'a crab'], ['🐙', 'an octopus'], ['👑', 'a crown'], ['🐚', 'a shell'], ['🐬', 'a dolphin']];
let friendIdx = 0;
const TOYS = [
  { id: 'boat', ch: '⛵', word: 'Boat', x: 280, line: 'A little boat!' },
  { id: 'turtle', ch: '🐢', word: 'Turtle', x: 470, line: 'Hello, turtle!' },
  { id: 'octopus', ch: '🐙', word: 'Octopus', x: 720, line: 'Wiggly octopus!' }
];
const hand = $('#hand'), bucket = $('#bucket'), under = $('#under'), toysG = $('#toys');

const scene = {
  bucket(on, who = learner()) {
    const s = who.state, k = who.scale;
    bucket.setAttribute('transform', `translate(${s.x + 34 * k} ${s.y - 112 * k})`);
    bucket.setAttribute('opacity', on ? 1 : 0);
  },
  async pour(who = learner()) {
    const s = who.state, k = who.scale;
    bucket.classList.add('pouring');
    await sleep(250);
    sfx.splash(0.45);
    fx.pour(s.x + 8 * k, s.y - 120 * k);
    await sleep(650);
    bucket.classList.remove('pouring');
  },
  // the next underwater friend appears on the pool floor in front of the swimmer
  friend(who = learner()) {
    const f = FRIENDS[friendIdx++ % FRIENDS.length], s = who.state;
    const x = Math.min(860, s.x + 80), y = (x > 690 ? P.DEEP : P.FLOOR) - 8;
    const t = el('text', { x, y, 'font-size': 46, 'text-anchor': 'middle', opacity: 0 }, under);
    t.textContent = f[0];
    requestAnimationFrame(() => t.setAttribute('opacity', 1));
    setTimeout(() => { t.setAttribute('opacity', 0); setTimeout(() => t.remove(), 500); }, 2600);
    return f;
  },
  peek(ch, blurry = false) {
    const p = $('#peek');
    if (!ch) { p.hidden = true; return; }
    $('#peekThing').textContent = ch;
    p.classList.toggle('blurry', blurry);
    p.hidden = false;
  },
  hand(on, x = 0, y = 0) {
    if (on) { hand.setAttribute('x', x); hand.setAttribute('y', y); }
    hand.setAttribute('opacity', on ? 1 : 0);
  },
  dots(n) {
    const d = $('#dots');
    d.innerHTML = '';
    for (let i = 0; i < n; i++) { const s = document.createElement('span'); s.className = 'dot'; s.textContent = i + 1; d.appendChild(s); }
    d.hidden = !n;
  },
  dot(i) { const s = $('#dots').children[i]; if (s) s.classList.add('on'); },
  stars(on) { $('#stars').classList.toggle('bright', on); if (on) sfx.twinkle(); },
  vestHook(on) { $('#vestHook').setAttribute('opacity', on ? 1 : 0); },
  toys(on) {
    toysG.innerHTML = '';
    if (!on) return [];
    for (const t of TOYS) {
      const g = el('g', { class: 'toy', 'data-id': t.id, role: 'button', 'aria-label': t.word }, toysG);
      el('circle', { cx: t.x, cy: P.WATER - 10, r: 34, fill: 'transparent' }, g);
      const tx = el('text', { x: t.x, y: P.WATER + 10, 'font-size': 52, 'text-anchor': 'middle' }, g);
      tx.textContent = t.ch;
      g.addEventListener('click', e => { e.stopPropagation(); answer(t.id); });
    }
    return TOYS;
  },
  wiggleToy(id) { const g = toysG.querySelector(`[data-id="${id}"]`); if (g) restart(g, 'wiggle', 700); }
};

function resetProps() {
  scene.bucket(false); scene.hand(false); scene.peek(null); scene.dots(0);
  scene.stars(false); scene.vestHook(true); scene.toys(false);
  bucket.classList.remove('pouring');
}

// ---------- running a skill ----------
// A skill script awaits the swimmers' moves, speech and the child's taps. Leaving a skill (↩) sets
// token.aborted: the next thing the script awaits throws ABORT and the runner tidies up.
// Every guarded promise has a no-op catch so lines the script doesn't await never log errors.
const ABORT = Symbol('abort');
const quiet = p => { p.catch(() => {}); return p; };
const guard = (p, token) => quiet(p.then(v => { if (token.aborted) throw ABORT; return v; }));
const aborted = () => quiet(Promise.reject(ABORT));

let pendingAsk = null;   // { ids, resolve, reject }
let mode = 'menu';       // 'menu' | 'step'
let finishing = false;   // praise and token after a skill
let switching = false;   // the turn passing to the other child
let token = null;
let running = Promise.resolve();
const busy = () => finishing || switching;

// a swimmer whose moves stop the script once the skill has been left
function guarded(sw, tk) {
  return new Proxy(sw, {
    get(t, k) {
      const v = t[k];
      if (typeof v !== 'function') return v;
      return (...a) => {
        if (tk.aborted) return aborted();
        const r = v.apply(t, a);
        return r && r.then ? guard(r, tk) : r;
      };
    }
  });
}

function makeCtx(tk) {
  return {
    C: guarded(learner(), tk), T: guarded(carsi, tk), P, fx, sfx, scene,
    k: kid,
    say: text => tk.aborted ? aborted() : guard(sayLine(text), tk),
    wait: ms => tk.aborted ? aborted() : guard(sleep(ms), tk),
    ask: buttons => {
      if (tk.aborted) return aborted();
      return new Promise((resolve, reject) => {
        pendingAsk = { ids: buttons.map(b => b.id), resolve, reject };
        renderActions(buttons);
      });
    }
  };
}

// a tap on an action button (or a swimmer, or a toy in the water)
function answer(id) {
  if (!pendingAsk || !pendingAsk.ids.includes(id)) return false;
  const a = pendingAsk; pendingAsk = null;
  dock.classList.add('busy');
  sfx.pop();
  a.resolve(id);
  return true;
}

function leaveStep() {
  if (mode !== 'step') return;
  token.aborted = true;
  if (pendingAsk) { pendingAsk.reject(ABORT); pendingAsk = null; }
  hush();
  mode = 'menu';
  renderMenu();
}

let starting = false;
async function runStep(li, step) {
  if (starting) return; // a second quick tap must not start a second script
  starting = true;
  hidePointer();
  await running; // a skill that was just left finishes tidying up first
  starting = false;
  const tk = token = { aborted: false };
  mode = 'step';
  renderActions([]);
  running = (async () => {
    let praise;
    try {
      praise = await step.run(makeCtx(tk));
    } catch (e) {
      if (e !== ABORT) console.error(e);
      await tidyAfterLeaving();
      return;
    }
    if (tk.aborted) { await tidyAfterLeaving(); return; }
    mode = 'menu';
    await finish(li, step, praise);
  })();
  await running;
}

// after ↩: put props away; the child stands somewhere sensible and Carsi goes back to her spot
async function tidyAfterLeaving() {
  resetProps();
  const c = learner(), s = c.state;
  if (s.where === 'deck') c.stand(P.deckL, P.DECK, 500, { where: 'deck', vest: false, board: false, goggles: false });
  else c.stand(Math.max(P.shallowX, Math.min(s.x, P.shallowEnd - 120)), P.FLOOR, 600, { where: 'water', vest: false, board: false, goggles: false });
  carsi.stand(P.coachX, P.FLOOR, 600, { where: 'water', vest: false, board: false, goggles: false });
  if (timeUp) { await sleep(400); await switchTurn(); return; }
  sayLine("Okay! Let's choose another.");
  schedulePointer();
}

async function finish(li, step, praise) {
  finishing = true;
  resetProps();
  const c = learner(), me = kp();
  c.set({ board: false, vest: false, goggles: false, arms: 'cheer', face: 'wow' }, 300);
  carsi.set({ arms: 'cheer' }, 300);
  fx.burst(c.state.x, c.state.y - 40, RAINBOW, 22);
  sfx.chime();
  const key = keyOf(li, step);
  renderMenu();
  if (!me.tokens.includes(key)) {
    await flyToken(step);
    me.tokens.push(key);
    save();
    renderMenu();
    renderCards();
  }
  await sayLine(`${kid()}, ${praise}`);
  c.set({ arms: 'down', face: 'happy' }, 300);
  carsi.set({ arms: 'down' }, 300);

  if (step.bench && li === me.level) {
    me.level++;
    save();
    const next = capFor(me.level);
    await sleep(300);
    await c.set({ cap: next.cap, arms: 'cheer', face: 'wow' }, 400);
    sfx.fanfare();
    const h = c.head();
    fx.burst(h.x, h.y - 20, [next.cap, '#FFFFFF', '#FFD84D'], 30);
    viewLevel = Math.min(me.level, LEVELS.length - 1);
    renderMenu();
    renderCards();
    await sayLine(`${kid()}, your cap is ${next.name.toLowerCase()} now!`);
    if (me.level >= LEVELS.length) await sayLine('More swimming games soon!');
    c.set({ arms: 'down', face: 'happy' }, 300);
  }

  finishing = false;
  if (timeUp) { await switchTurn(); return; }
  sayLine(`What next, ${kid()}?`);
  schedulePointer();
}

// the golden token flies from the child to its spot on the child's card
function flyToken(step) {
  const target = $(`#kids .kidCard[data-kid="${turnIdx}"] .mini[data-step="${step.id}"]`)
    || dock.querySelector(`[data-step="${step.id}"]`);
  if (!target) return sleep(400);
  const c = learner();
  const from = toScreen(c.state.x, c.state.y - 40), r = target.getBoundingClientRect();
  const t = document.createElement('div');
  t.className = 'flyToken';
  t.textContent = step.icon;
  t.style.left = from.x + 'px'; t.style.top = from.y + 'px';
  document.body.appendChild(t);
  void t.getBoundingClientRect();
  t.style.transform = `translate(${r.left + r.width / 2 - from.x}px, ${r.top + r.height / 2 - from.y}px) scale(${Math.max(0.3, r.width / 70)})`;
  return sleep(950).then(() => {
    t.remove();
    screenFx.burst(r.left + r.width / 2, r.top + r.height / 2, ['#FFD84D', '#FFF6C9', '#FF9F1C'], 16, 4);
    sfx.twinkle();
  });
}

// ---------- turns: a random 3 to 5 minutes each (only when both children play here) ----------
// The time only runs while the page is visible. When it is up the turn passes at the next calm moment:
// straight away from the menu, otherwise right after the current skill finishes (or is left).
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
    if (turnLeft === 15 && !warned && mode === 'menu' && !finishing) {
      warned = true;
      sayLine(`A little more, then it's ${KIDS[1 - turnIdx].name}'s turn.`);
    }
    if (turnLeft <= 0) {
      timeUp = true;
      if (mode === 'menu' && !busy() && !starting) switchTurn();
    }
  }, 1000);
}

async function switchTurn() {
  if (switching || solo !== null) return;
  switching = true;
  hidePointer();
  const old = learner();
  old.set({ arms: 'cheer', face: 'wow' }, 300);
  await sayLine(`${kid()}, you practised so many things!`);
  const h = old.head();
  fx.burst(h.x, h.y + 30, [KIDS[turnIdx].color, '#FFFFFF', '#FFD84D'], 24);
  sfx.pop();
  old.show(false);
  old.stand(P.deckL, P.DECK, 0, { where: 'deck', vest: false, board: false, goggles: false, face: 'happy' });
  turnIdx = 1 - turnIdx;
  history.replaceState(null, '', withTurn(location.pathname, turnIdx));
  const c = learner();
  c.stand(P.deckL, P.DECK, 0, { where: 'deck', vest: false, board: false, goggles: false, face: 'happy', cap: capFor(kp().level).cap });
  c.show(true);
  fx.burst(P.deckL, P.DECK - 60, [KIDS[turnIdx].color, '#FFFFFF', '#FFD84D'], 24);
  sfx.chime();
  viewLevel = Math.min(kp().level, LEVELS.length - 1);
  startTurnTimer();
  renderCards();
  renderMenu();
  restart($(`#kids .kidCard[data-kid="${turnIdx}"]`), 'pop', 800);
  switching = false;
  await sayLine(`${kid()}'s turn! Let's swim.`);
  schedulePointer();
}

// ---------- the two cards at the top ----------
function capIcon(color) {
  return `<svg viewBox="0 0 44 44" aria-hidden="true"><path d="M6 30 Q4 8 22 8 Q40 8 38 30 Q22 24 6 30 Z" fill="${color}" stroke="#4A3F6B" stroke-width="3.5" stroke-linejoin="round"/></svg>`;
}

// each child's own card: name, cap, and the tokens of their current level. No count, nothing ranked.
function renderCards() {
  const box = $('#kids');
  box.innerHTML = '';
  const who = solo === null ? [0, 1] : [solo];
  for (const i of who) {
    const p = kp(i), li = Math.min(p.level, LEVELS.length - 1), lvl = LEVELS[li], cap = capFor(p.level);
    const on = i === turnIdx;
    const card = document.createElement('div');
    card.className = 'kidCard' + (on ? ' on' : '');
    card.dataset.kid = i;
    card.style.setProperty('--kid', KIDS[i].color);
    const minis = lvl.steps.map(s => {
      const have = p.tokens.includes(keyOf(li, s));
      return `<span class="mini${have ? ' token' : ''}${s.bench ? ' bench' : ''}" data-step="${s.id}">${have ? s.icon : ''}</span>`;
    }).join('');
    card.innerHTML = `<div class="kidTop">${capIcon(cap.cap)}<span class="kidName">${KIDS[i].name}</span></div>
      <div class="minis" aria-hidden="true">${minis}</div>${on && solo === null ? '<span class="time" aria-hidden="true"></span>' : ''}`;
    card.setAttribute('aria-label', `${KIDS[i].name}, ${cap.name} cap${on ? ', swimming now' : ''}`);
    box.appendChild(card);
  }
  box.setAttribute('aria-label', who.length > 1 ? `${kid()}'s turn` : `${kid()} is swimming`);
  showTime();
}

// ---------- the dock ----------
const dock = $('#dock');
let viewLevel = Math.min(kp().level, LEVELS.length - 1);
let usingKeys = false;
addEventListener('keydown', () => { usingKeys = true; });
addEventListener('pointerdown', () => { usingKeys = false; });

function nextStepIndex(li) {
  if (li !== kp().level) return -1;
  return LEVELS[li].steps.findIndex(s => !kp().tokens.includes(keyOf(li, s)));
}

function renderMenu() {
  dock.innerHTML = '';
  dock.classList.remove('busy');
  dock.setAttribute('aria-label', `${kid()}'s ${LEVELS[viewLevel].name} cap swimming steps`);
  const me = kp();
  const unlocked = Math.min(me.level, LEVELS.length - 1);
  if (unlocked > 0) {
    const b = document.createElement('button');
    b.className = 'cap';
    b.innerHTML = capIcon(LEVELS[viewLevel].cap);
    b.setAttribute('aria-label', `${LEVELS[viewLevel].name} cap. Tap for another cap.`);
    b.addEventListener('click', () => {
      if (busy()) return;
      viewLevel = (viewLevel + 1) % (unlocked + 1);
      sfx.pop();
      renderMenu();
      sayLine(`${LEVELS[viewLevel].name} cap!`);
      dock.querySelector('.cap').focus({ preventScroll: true });
    });
    dock.appendChild(b);
    const gap = document.createElement('span'); gap.className = 'gap'; dock.appendChild(gap);
  }
  const next = nextStepIndex(viewLevel);
  LEVELS[viewLevel].steps.forEach((step, i) => {
    const b = document.createElement('button');
    const have = me.tokens.includes(keyOf(viewLevel, step));
    const later = !have && viewLevel === me.level && i > next;
    b.className = 'skill' + (step.bench ? ' bench' : '') + (have ? ' token' : later ? ' later' : i === next ? ' next' : '');
    b.dataset.step = step.id;
    b.innerHTML = `<span class="ico" aria-hidden="true">${step.icon}</span>`;
    b.setAttribute('aria-label', step.word + (have ? ' (learned, play again)' : later ? ' (later)' : ''));
    b.addEventListener('click', () => {
      if (busy() || mode !== 'menu') return;
      if (later) {
        sfx.boing();
        sayLine("Let's try this one first!");
        showPointer(dock.querySelector('.skill.next'));
        return;
      }
      sfx.pop();
      runStep(viewLevel, step);
    });
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
  back.setAttribute('aria-label', 'Stop and choose another step');
  back.addEventListener('click', leaveStep);
  dock.appendChild(back);
  const gap = document.createElement('span'); gap.className = 'gap'; dock.appendChild(gap);
  buttons.forEach((b, i) => {
    const e = document.createElement('button');
    e.className = 'act' + (i === 0 ? ' main' : '');
    e.innerHTML = `<span class="ico" aria-hidden="true">${b.icon}</span><span class="word" aria-hidden="true">${b.word}</span>`;
    e.setAttribute('aria-label', b.word);
    e.addEventListener('click', () => answer(b.id));
    dock.appendChild(e);
  });
  if (usingKeys && buttons.length) dock.querySelector('.act:not(.small)').focus({ preventScroll: true });
}

// ---------- a hand pointing at the next step when nobody has tapped for a while ----------
const pointer = $('#pointer');
let pointerTimer = 0;
function showPointer(target) {
  if (!target) return;
  const r = target.getBoundingClientRect();
  pointer.textContent = '👇';
  pointer.style.left = (r.left + r.width / 2 - 6) + 'px';
  pointer.style.top = (r.top - 60) + 'px';
  pointer.hidden = false;
}
function hidePointer() { pointer.hidden = true; clearTimeout(pointerTimer); }
function schedulePointer() {
  clearTimeout(pointerTimer);
  pointerTimer = setTimeout(() => {
    if (mode === 'menu' && !busy()) showPointer(dock.querySelector('.skill.next'));
  }, 6000);
}
addEventListener('pointerdown', () => { hidePointer(); if (mode === 'menu') schedulePointer(); });

// ---------- things to discover by tapping ----------
const CARSI_LINES = ['Splish splash!', 'The water feels nice.', 'Look at the duck!', 'I love swimming with you.', 'Which step next?'];
const KID_LINES = ['Hello, swimmer!', 'Nice swim cap!', 'Wiggle your toes!', 'Ready when you are!'];
let carsiIdx = 0, kidIdx = 0;
function tapSwimmer(sw, lines, idx) {
  if (mode === 'step') {
    // tapping a swimmer works like the action button when there is only one
    if (pendingAsk && pendingAsk.ids.length === 1) answer(pendingAsk.ids[0]);
    return;
  }
  if (busy()) return;
  const s = sw.state;
  if (s.where === 'water') { fx.drops(s.x, P.WATER, 10, 5); sfx.splash(0.3); }
  else sw.hop(s.x, P.DECK, 380);
  sayLine(lines[idx % lines.length]);
}
carsi.el.addEventListener('click', e => { e.stopPropagation(); tapSwimmer(carsi, CARSI_LINES, carsiIdx++); });
kids.forEach(k => k.el.addEventListener('click', e => { e.stopPropagation(); tapSwimmer(k, KID_LINES, kidIdx++); }));

$('#hitWater').addEventListener('click', e => {
  const top = toScreen(0, P.WATER).y;
  screenFx.drops(e.clientX, top, 12, 5, 12);
  screenFx.ring(e.clientX, top, 8);
  if (e.clientY > top + 20) screenFx.bubbles(e.clientX, e.clientY, 5, top);
  sfx.bloop(); sfx.splash(0.25);
});

const duck = $('#duck');
duck.addEventListener('click', () => { restart(duck, 'spin', 800); sfx.quack(); fx.drops(810, P.WATER, 8, 4); });
const ball = $('#ball');
ball.addEventListener('click', () => { restart(ball, 'bounce', 1200); sfx.boing(); });
const whale = $('#whale');
whale.addEventListener('click', () => {
  restart(whale, 'spray', 900);
  sfx.splash(0.5);
  fx.drops(554, 486, 16, 6, 14);
});

// ---------- top bar ----------
const goHome = () => {
  if (mode === 'step') leaveStep();
  hush();
  $('#curtain').classList.remove('open');
  setTimeout(() => { location.href = withTurn('../../../index.html', turnIdx); }, 600);
};
$('#homeBtn').addEventListener('click', goHome);
const soundBtn = $('#soundBtn');
soundBtn.addEventListener('click', () => {
  const on = soundBtn.getAttribute('aria-pressed') !== 'true';
  soundBtn.setAttribute('aria-pressed', on);
  sfx.setMuted(!on);
  if (!on) hush();
});
// grown-ups: hold the cards 2 s to choose who plays on this device; the pool restarts with that child
addParentHold($('#kids'), choice => {
  hush();
  $('#curtain').classList.remove('open');
  setTimeout(() => { location.href = withTurn('index.html', choice === null ? turnIdx : choice); }, 600);
});

// ---------- hello ----------
if (solo === null) startTurnTimer();
renderCards();
renderMenu();
requestAnimationFrame(() => requestAnimationFrame(() => $('#curtain').classList.add('open')));
(async () => {
  await sleep(500);
  carsi.set({ arms: 'cheer', face: 'wow' }, 350);
  learner().set({ arms: 'cheer' }, 350);
  if (kp().tokens.length) {
    await sayLine(`Hi ${kid()}! Ready to swim?`);
    carsi.set({ arms: 'down', face: 'happy' }, 350);
    learner().set({ arms: 'down' }, 350);
    await sayLine('What shall we practise?');
  } else {
    await sayLine(`Hi ${kid()}! I'm your swim teacher.`);
    carsi.set({ arms: 'down', face: 'happy' }, 350);
    learner().set({ arms: 'down' }, 350);
    await sayLine("Let's learn to swim!");
  }
  if (mode === 'menu' && !busy()) showPointer(dock.querySelector('.skill.next'));
})();
