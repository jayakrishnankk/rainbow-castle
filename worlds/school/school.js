// The school yard (the school world's map). Princess Carsi's castle car drives in from the castle and
// parks by the school; tapping the door walks her in to the kindergarten class (kindergarten/).
// The castle button drives the car back home. On the way, the windows, bell, clock and car are
// things to tap: classmates pop up in the windows and wave.
// The turn travels in the URL (?turn=0|1); the turn timer runs in the castle and the class, not here,
// because this is a place you pass through in a few seconds.
import * as sfx from '../../shared/audio.js';
import { speak, hush } from '../../shared/speech.js';
import { createFx } from '../../shared/particles.js';
import { KIDS, turnFromUrl, withTurn, soloKid } from '../../shared/turns.js';
import { CLASSMATES, kidSvg } from '../../shared/classmates.js';

const $ = s => document.querySelector(s);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const turnIdx = turnFromUrl();
const kid = () => KIDS[turnIdx].name;
const fx = createFx($('#fx'));
const svg = $('#scene');
const NS = 'http://www.w3.org/2000/svg';

function burstAt(node, colors, n = 16) {
  const r = node.getBoundingClientRect();
  fx.burst(r.left + r.width / 2, r.top + r.height / 2, colors, n, 4);
}
function replay(node, cls, ms) {
  node.classList.remove(cls); void node.getBoundingClientRect(); node.classList.add(cls);
  clearTimeout(node._t); node._t = setTimeout(() => node.classList.remove(cls), ms);
}

// ---------- Carsi's words: in the bubble always, spoken when sound is on ----------
const bubble = $('#bubble');
let sayId = 0;
function sayLine(text) {
  const id = ++sayId;
  bubble.textContent = text;
  bubble.classList.add('show');
  return speak(text).then(() => {
    if (id === sayId) setTimeout(() => { if (id === sayId) bubble.classList.remove('show'); }, 1600);
  });
}

// ---------- tall phone screens: frame the car and the school ----------
function fitScene() {
  const portrait = innerHeight > innerWidth * 1.1;
  svg.setAttribute('viewBox', portrait ? '100 120 790 640' : '0 0 1000 750');
}
addEventListener('resize', fitScene); fitScene();

// ---------- the windows: classmates peek up when you tap ----------
// [x, y, width, height, which classmates]; upper row one each, lower row beside the door
const WINDOWS = [
  [478, 350, 70, 70, [0]], [574, 350, 70, 70, [1]], [676, 350, 70, 70, [2]], [772, 350, 70, 70, [3]],
  [478, 480, 120, 80, [4, 5]], [722, 480, 120, 80, [6, 7, 8]]
];
const winG = $('#windows');
const wins = WINDOWS.map(([x, y, w, h, who], k) => {
  const g = document.createElementNS(NS, 'g');
  g.setAttribute('class', 'win tap');
  g.setAttribute('role', 'button');
  g.setAttribute('tabindex', '0');
  g.setAttribute('aria-label', 'A window');
  const faces = who.map((i, j) => {
    // faces as big as fit, waiting just below the sill (the .peek group lifts them by 56)
    const fw = Math.min(54, (w - 6) / who.length), fh = fw * 50 / 52, gap = (w - who.length * fw) / (who.length + 1);
    return kidSvg(CLASSMATES[i], { face: true }).replace('<svg ', `<svg x="${(x + gap + j * (fw + gap)).toFixed(1)}" y="${(y + h + 54 - fh).toFixed(1)}" width="${fw.toFixed(1)}" height="${fh.toFixed(1)}" `);
  }).join('');
  g.innerHTML = `<clipPath id="wc${k}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#CDEBFF"/>
    <g clip-path="url(#wc${k})"><g class="peek">${faces}</g></g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none"/>
    <rect x="${x - 6}" y="${y + h}" width="${w + 12}" height="8" rx="3" fill="#FFFDF7"/>`;
  winG.appendChild(g);
  return { g, who };
});
function tapWindow(k) {
  const { g, who } = wins[k];
  if (g.classList.contains('up')) return;
  g.classList.add('up');
  sfx.pop();
  who.forEach((i, j) => sfx.bell(sfx.NOTES[(i + j) % 7] * 2, 0.1 + j * 0.12));
  const names = who.map(i => CLASSMATES[i].name);
  const list = names.length === 1 ? names[0] : names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
  sayLine(`${list} ${names.length === 1 ? 'says' : 'say'} hi, ${kid()}!`);
  setTimeout(() => g.classList.remove('up'), 4500);
}

// ---------- the car arrives ----------
const car = $('#car'), carsi = $('#carsi'), door = $('#door');
let arrived = false, leaving = false;
function horn() {
  sfx.tone(659.25, { dur: 0.18, vol: 0.25, type: 'triangle' });
  sfx.tone(783.99, { dur: 0.22, vol: 0.25, type: 'triangle', when: 0.2 });
}
async function arrive() {
  car.style.transition = 'none';
  car.style.transform = 'translateX(-800px)';
  void car.getBoundingClientRect();
  car.style.transition = '';
  car.classList.add('driving');
  requestAnimationFrame(() => { car.style.transform = 'translateX(0px)'; });
  await sleep(reduced ? 650 : 2250);
  car.classList.remove('driving');
  horn();
  burstAt(carsi, ['#FF9BC8', '#FFD84D', '#FFFFFF'], 18);
  arrived = true;
  await sayLine(`We're at school, ${kid()}!`);
  if (leaving) return;
  await sayLine('Tap the door!');
  if (!leaving) showPointer(door);
}

// ---------- in through the door, to class ----------
async function goIn() {
  if (!arrived || leaving) return;
  leaving = true;
  hidePointer();
  door.classList.add('open');
  sfx.chime();
  sayLine("Let's go to class!");
  await sleep(400);
  // Carsi steps off the car and walks to the door, getting smaller as she goes in
  carsi.style.transform = 'translate(318px, 70px) scale(.55)';
  carsi.style.transformOrigin = '340px 560px';
  await sleep(1400);
  carsi.classList.add('gone');
  await sleep(400);
  door.classList.remove('open');
  sfx.tone(220, { dur: 0.25, vol: 0.3, type: 'triangle', slideTo: 110 });
  await sleep(500);
  $('#curtain').classList.remove('open');
  await sleep(600);
  location.href = withTurn('kindergarten/index.html', turnIdx);
}

// ---------- back home to the castle ----------
async function driveHome() {
  if (leaving) return;
  leaving = true;
  hidePointer();
  hush();
  horn();
  sayLine('Back to the castle!');
  car.classList.add('driving');
  car.style.transition = 'transform 1.6s cubic-bezier(.5,0,.9,.6)';
  car.style.transform = 'translateX(-900px)';
  await sleep(reduced ? 700 : 1500);
  $('#curtain').classList.remove('open');
  await sleep(600);
  location.href = withTurn('../../index.html', turnIdx);
}

// ---------- things to tap ----------
function ringBell() {
  replay($('#bellTower'), 'ring', 1300);
  [0, 0.3, 0.6, 0.9].forEach((t, k) => sfx.bell(k % 2 ? 784 : 1046.5, t));
  sayLine('Ding dong! Time for school!');
}
let clockTurns = 0;
function spinClock() {
  clockTurns++;
  $('#minHand').style.transform = `rotate(${clockTurns * 360}deg)`;
  $('#hourHand').style.transform = `rotate(${clockTurns * 30}deg)`;
  [0, 0.25, 0.5, 0.75].forEach((t, k) => sfx.tone(k % 2 ? 900 : 1200, { dur: 0.08, vol: 0.15, when: t }));
  sayLine('Tick tock!');
}
function tapCar() {
  horn();
  burstAt(carsi, ['#FF9BC8', '#FFD84D', '#FFFFFF'], 12);
  sayLine('Beep beep!');
}

function onTap(el, fn) {
  el.addEventListener('click', fn);
  el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } });
}
onTap(door, goIn);
onTap($('#bellTower'), ringBell);
onTap($('#clock'), spinClock);
onTap(car, tapCar);
wins.forEach((w, k) => onTap(w.g, () => tapWindow(k)));
$('#homeBtn').addEventListener('click', driveHome);
const soundBtn = $('#soundBtn');
soundBtn.addEventListener('click', () => {
  const on = soundBtn.getAttribute('aria-pressed') !== 'true';
  soundBtn.setAttribute('aria-pressed', on);
  sfx.setMuted(!on);
  if (!on) hush();
});

// ---------- the pointing hand ----------
const pointer = $('#pointer');
let pointerTarget = null;
function showPointer(target) {
  pointerTarget = target;
  const r = target.getBoundingClientRect();
  pointer.style.left = (r.left + r.width / 2 - 6) + 'px';
  pointer.style.top = (r.top + r.height * 0.25) + 'px';
  pointer.hidden = false;
}
function hidePointer() { pointer.hidden = true; pointerTarget = null; }
addEventListener('resize', () => { if (pointerTarget) showPointer(pointerTarget); });

// ---------- who is playing (just the name; no timer here) ----------
const card = document.createElement('div');
card.className = 'kidCard';
card.style.setProperty('--kid', KIDS[turnIdx].color);
card.textContent = kid();
$('#kids').appendChild(card);
$('#kids').setAttribute('aria-label', soloKid() === null ? `${kid()}'s turn` : `${kid()} is playing`);

// coming back with the browser's back button can restore this page as it was left: start again
addEventListener('pageshow', e => {
  if (!e.persisted) return;
  leaving = false; arrived = false;
  carsi.classList.remove('gone'); carsi.style.transform = '';
  door.classList.remove('open');
  $('#curtain').classList.add('open');
  arrive();
});

requestAnimationFrame(() => { $('#curtain').classList.add('open'); arrive(); });
