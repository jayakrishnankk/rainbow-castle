// A posable swimmer, drawn front-on with the origin at the tummy so it can turn to float. Used three
// times: Princess Carsi (the teacher, with her crown) and the two children, Avni and Ansh.
// The pose is a set of data attributes (arms, legs, face, ...) that pool.css turns into limb
// rotations with transitions, so every change animates. Position/rotation is one CSS transform.
//
// s.set({ x, y, rot, ...pose }, ms) moves the swimmer; rot 90 = lying flat with the head to the
// right, -90 = head to the left. With facing 'away' we see the back of the head (face in the water).
// s.feet is the distance from tummy to soles in scene units: stand on ground y with y = ground - s.feet.

const SKIN = '#F7CBA8';
const FEET_ART = 97.4; // tummy to soles in drawing units, before scaling

const limb = (len, extra = '') =>
  `<line y2="${len}" class="c-out"/><line y2="${len}" stroke="${SKIN}" stroke-width="9" stroke-linecap="round"/>${extra}`;

// look: { suit, trim, hair, hairDo: 'pony' | 'pigtails' | 'short', crown, trunks, scale }
function art(look) {
  const { suit, trim, hair } = look;
  const hairBits = {
    pony: `<ellipse class="c-tail" cx="26" cy="-58" rx="9" ry="15" fill="${hair}" stroke="#4A3F6B" stroke-width="3" transform="rotate(-25 26 -58)"/>`,
    pigtails: `<ellipse class="c-tail" cx="-27" cy="-56" rx="8" ry="12" fill="${hair}" stroke="#4A3F6B" stroke-width="3" transform="rotate(25 -27 -56)"/>
               <ellipse class="c-tail" cx="27" cy="-56" rx="8" ry="12" fill="${hair}" stroke="#4A3F6B" stroke-width="3" transform="rotate(-25 27 -56)"/>`,
    short: ''
  }[look.hairDo];
  // a swimsuit with a frilly hem, or a swim shirt with trunks
  const outfit = look.trunks
    ? `<path d="M-17 -38 Q-22 -4 -17 22 L17 22 Q22 -4 17 -38 Q0 -44 -17 -38 Z" fill="${suit}" stroke="#4A3F6B" stroke-width="3"/>
       <path d="M-16 -14 H16" stroke="${trim}" stroke-width="6"/>
       <path d="M-19 18 H19 L21 42 H3 L0 34 L-3 42 H-21 Z" fill="${trim}" stroke="#4A3F6B" stroke-width="3" stroke-linejoin="round"/>`
    : `<path d="M-17 -38 Q-22 -4 -17 32 Q0 38 17 32 Q22 -4 17 -38 Q0 -44 -17 -38 Z" fill="${suit}" stroke="#4A3F6B" stroke-width="3"/>
       <path d="M-19 26 Q-14 36 -8 30 Q-3 38 3 30 Q8 38 13 30 Q18 36 19 26" fill="none" stroke="${trim}" stroke-width="4" stroke-linecap="round"/>
       <g fill="#FFFFFF" opacity=".8"><circle cx="-7" cy="-18" r="3"/><circle cx="7" cy="-6" r="3"/><circle cx="-5" cy="10" r="3"/><circle cx="8" cy="18" r="2.5"/></g>`;
  const crown = look.crown
    ? `<polygon points="-7,-11 -6,-19 -2,-14 0,-21 2,-14 6,-19 7,-11" fill="#FFD84D" stroke="#4A3F6B" stroke-width="1.5"/>`
    : '';
  return `
<g class="c-straight">
  <g transform="translate(-9 30)"><g class="c-leg c-legL">${limb(58, `<ellipse cx="-3" cy="62" rx="9" ry="6" fill="${SKIN}" stroke="#4A3F6B" stroke-width="3"/>`)}</g></g>
  <g transform="translate(9 30)"><g class="c-leg c-legR">${limb(58, `<ellipse cx="3" cy="62" rx="9" ry="6" fill="${SKIN}" stroke="#4A3F6B" stroke-width="3"/>`)}</g></g>
</g>
${hairBits}
<rect x="-6" y="-46" width="12" height="12" fill="${SKIN}"/>
${outfit}
<g class="c-vest">
  <path d="M-21 -38 L-8 -38 L-8 28 L-22 28 Q-25 -4 -21 -38 Z M21 -38 L8 -38 L8 28 L22 28 Q25 -4 21 -38 Z" fill="#FF9F1C" stroke="#4A3F6B" stroke-width="3" stroke-linejoin="round"/>
  <rect x="-10" y="-8" width="20" height="6" rx="2" fill="#4A3F6B"/><rect x="-10" y="10" width="20" height="6" rx="2" fill="#4A3F6B"/>
</g>
<g transform="translate(0 -62)">
  <circle r="22" fill="${SKIN}" stroke="#4A3F6B" stroke-width="3"/>
  <g class="c-face">
    <g class="c-eyesOpen" fill="#4A3F6B"><circle cx="-8" cy="2" r="3.2"/><circle cx="8" cy="2" r="3.2"/></g>
    <g class="c-eyesShut" fill="none" stroke="#4A3F6B" stroke-width="2.5" stroke-linecap="round"><path d="M-12 3 Q-8 -1 -4 3"/><path d="M4 3 Q8 -1 12 3"/></g>
    <circle class="c-cheek" cx="-13" cy="10" r="4.5" fill="#FF9EB5" opacity=".75"/>
    <circle class="c-cheek" cx="13" cy="10" r="4.5" fill="#FF9EB5" opacity=".75"/>
    <path class="c-mSmile" d="M-7 11 Q0 18 7 11" fill="none" stroke="#4A3F6B" stroke-width="3" stroke-linecap="round"/>
    <ellipse class="c-mOpen" cx="0" cy="13" rx="4.5" ry="5" fill="#B8436A"/>
    <path class="c-mPuff" d="M-3 14 L3 14" stroke="#4A3F6B" stroke-width="3" stroke-linecap="round"/>
    <circle class="c-mBlow" cx="0" cy="14" r="3.2" fill="none" stroke="#4A3F6B" stroke-width="2.5"/>
    <g class="c-goggles">
      <line x1="-22" y1="1" x2="22" y2="1" stroke="#4A3F6B" stroke-width="4"/>
      <circle cx="-8" cy="2" r="7.5" fill="#BDEBFF" fill-opacity=".55" stroke="#6A5ACD" stroke-width="3"/>
      <circle cx="8" cy="2" r="7.5" fill="#BDEBFF" fill-opacity=".55" stroke="#6A5ACD" stroke-width="3"/>
    </g>
  </g>
  <circle class="c-back" r="22" fill="${hair}" stroke="#4A3F6B" stroke-width="3"/>
  <path class="c-cap" d="M-23 0 Q-25 -25 0 -25 Q25 -25 23 0 Q0 -9 -23 0 Z" stroke="#4A3F6B" stroke-width="3" stroke-linejoin="round"/>
  ${crown}
</g>
<g class="c-tucked">
  <polyline points="-9,30 -13,0 -10,34" fill="none" class="c-out"/><polyline points="-9,30 -13,0 -10,34" fill="none" stroke="${SKIN}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
  <polyline points="9,30 13,0 10,34" fill="none" class="c-out"/><polyline points="9,30 13,0 10,34" fill="none" stroke="${SKIN}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
  <ellipse cx="-13" cy="38" rx="8" ry="5" fill="${SKIN}" stroke="#4A3F6B" stroke-width="3"/>
  <ellipse cx="13" cy="38" rx="8" ry="5" fill="${SKIN}" stroke="#4A3F6B" stroke-width="3"/>
</g>
<g transform="translate(-17 -32)"><g class="c-arm c-armL">${limb(44, `<circle cy="47" r="6" fill="${SKIN}" stroke="#4A3F6B" stroke-width="3"/>`)}</g></g>
<g transform="translate(17 -32)"><g class="c-arm c-armR">${limb(44, `<circle cy="47" r="6" fill="${SKIN}" stroke="#4A3F6B" stroke-width="3"/>`)}</g></g>
<rect class="c-board" x="-30" y="-110" width="60" height="28" rx="12" fill="#4D96FF" stroke="#4A3F6B" stroke-width="3"/>
`;
}

const POSE_KEYS = ['arms', 'legs', 'face', 'facing', 'move'];
const FLAG_KEYS = ['goggles', 'vest', 'board'];

export function createSwimmer(parent, look, start) {
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.id = look.id;
  g.setAttribute('class', 'swimmer');
  g.setAttribute('role', 'img');
  g.setAttribute('aria-label', look.label);
  g.innerHTML = art(look);
  parent.appendChild(g);

  const scale = look.scale;
  const st = { x: 0, y: 0, rot: 0, sx: 1, where: 'deck', cap: '#FFFFFF',
    arms: 'down', legs: 'together', face: 'happy', facing: 'front', move: 'none',
    goggles: false, vest: false, board: false };
  const arms = { L: g.querySelector('.c-armL'), R: g.querySelector('.c-armR') };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  let pulseTimer = 0;

  function apply(ms) {
    g.style.transitionDuration = ms + 'ms';
    g.style.transform = `translate(${st.x}px, ${st.y}px) rotate(${st.rot}deg) scale(${scale * st.sx}, ${scale})`;
    for (const k of POSE_KEYS) g.dataset[k] = st[k];
    for (const k of FLAG_KEYS) g.classList.toggle(k, !!st[k]);
    g.style.setProperty('--cap', st.cap);
  }

  const api = {
    el: g,
    scale,
    feet: FEET_ART * scale,
    get state() { return st; },
    // change any of x, y, rot, where, cap, arms, legs, face, facing, move, goggles, vest, board
    set(o = {}, ms = 450) { Object.assign(st, o); apply(ms); return wait(ms); },
    stand(x, ground, ms = 450, extra = {}) {
      return api.set({ x, y: ground - api.feet, rot: 0, arms: 'down', legs: 'together', facing: 'front', move: 'none', ...extra }, ms);
    },
    // a little hop from where the swimmer is to (x, ground)
    async hop(x, ground, ms = 420) {
      const top = Math.min(st.y, ground - api.feet) - 26;
      await api.set({ x: (st.x + x) / 2, y: top }, ms / 2);
      await api.set({ x, y: ground - api.feet }, ms / 2);
    },
    // one arm swings all the way round (swimming stroke)
    stroke(side) {
      const a = arms[side];
      a.classList.remove('stroking'); void a.getBoundingClientRect(); a.classList.add('stroking');
    },
    // roll over: squash flat, swap front/back, unsquash
    async roll() {
      await api.set({ sx: 0.12 }, 200);
      st.facing = st.facing === 'away' ? 'front' : 'away';
      await api.set({ sx: 1 }, 220);
    },
    // kick (or tread) for a moment; another pulse before it ends keeps going
    pulse(move, ms = 700) {
      st.move = move; g.dataset.move = move;
      clearTimeout(pulseTimer);
      pulseTimer = setTimeout(() => { st.move = 'none'; g.dataset.move = 'none'; }, ms);
    },
    talk(on) { g.classList.toggle('talking', on); },
    show(on) { g.style.display = on ? '' : 'none'; },
    // where the head is in scene units (for bubbles and sparkles)
    head() {
      const a = st.rot * Math.PI / 180, r = 62 * scale;
      return { x: st.x + r * Math.sin(a), y: st.y - r * Math.cos(a) };
    }
  };
  for (const side of ['L', 'R']) arms[side].addEventListener('animationend', () => arms[side].classList.remove('stroking'));
  Object.assign(st, start);
  apply(0);
  return api;
}
