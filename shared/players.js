// Parent setting: who plays on this device.
//   - Avni and Ansh take turns on one screen (the default), or
//   - only Avni, or only Ansh (when each child has their own device).
// The choice is saved on this device (see turns.js). So a child can't change it by accident, the
// panel only opens after holding the whose-turn badge for 2 seconds (or holding Enter/Space on it).
// The panel's words are for the grown-up; children never need it.
import { KIDS, soloKid, setSolo } from './turns.js';

const HOLD_MS = 2000;

const CSS = `
.parentHold{pointer-events:auto!important;cursor:default;-webkit-touch-callout:none}
.parentHold.holding{animation:parentHold ${HOLD_MS}ms linear forwards}
@keyframes parentHold{to{filter:brightness(.8);scale:.94}}
.parentPanel{position:fixed;inset:0;z-index:50;display:grid;place-items:center;background:#4A3F6B99;padding:16px}
.parentPanel .box{background:#FFFDF7;border:4px solid #4A3F6B;border-radius:26px;padding:18px;width:min(100%,360px);
  font-family:"Baloo 2","Arial Rounded MT Bold",system-ui,sans-serif;color:#4A3F6B;text-align:center}
.parentPanel h2{margin:0 0 4px;font-size:24px}
.parentPanel p{margin:0 0 12px;font-size:15px;line-height:1.3}
.parentPanel .opt{display:block;width:100%;min-height:56px;margin:8px 0;border:4px solid #4A3F6B;border-radius:18px;
  background:#FFFFFF;font:inherit;font-size:20px;font-weight:700;color:#4A3F6B;cursor:pointer}
.parentPanel .opt[aria-pressed="true"]{background:#FFE66D}
.parentPanel .opt:focus-visible,.parentPanel .close:focus-visible{outline:4px solid #6A5ACD;outline-offset:3px}
.parentPanel .close{margin-top:6px;min-height:48px;padding:0 22px;border:3px solid #4A3F6B;border-radius:999px;
  background:#EAF7FF;font:inherit;font-size:18px;color:#4A3F6B;cursor:pointer}
`;

function addStyle() {
  if (document.getElementById('parentPanelCss')) return;
  const s = document.createElement('style');
  s.id = 'parentPanelCss';
  s.textContent = CSS;
  document.head.appendChild(s);
}

// onChange(choice) is called with null (both), 0 or 1 after the parent picks something new
export function addParentHold(el, onChange) {
  addStyle();
  el.classList.add('parentHold');
  if (!el.hasAttribute('tabindex')) el.tabIndex = 0;
  el.setAttribute('aria-description', 'Grown-ups: hold for 2 seconds to choose who plays on this device');

  let timer = 0;
  const start = () => {
    if (timer) return;
    el.classList.add('holding');
    timer = setTimeout(() => { stop(); openPanel(onChange); }, HOLD_MS);
  };
  const stop = () => { clearTimeout(timer); timer = 0; el.classList.remove('holding'); };
  el.addEventListener('pointerdown', e => { e.stopPropagation(); start(); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => el.addEventListener(t, stop));
  el.addEventListener('contextmenu', e => e.preventDefault());
  el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); start(); } });
  el.addEventListener('keyup', stop);
}

function openPanel(onChange) {
  const before = soloKid();
  const back = document.activeElement;
  const wrap = document.createElement('div');
  wrap.className = 'parentPanel';
  wrap.innerHTML = `
    <div class="box" role="dialog" aria-modal="true" aria-labelledby="ppTitle">
      <h2 id="ppTitle">Who plays here?</h2>
      <p>For grown-ups. Pick one child when each has their own device.</p>
      <button class="opt" data-v="both">${KIDS[0].emoji} ${KIDS[0].name} and ${KIDS[1].emoji} ${KIDS[1].name}</button>
      <button class="opt" data-v="0">Only ${KIDS[0].emoji} ${KIDS[0].name}</button>
      <button class="opt" data-v="1">Only ${KIDS[1].emoji} ${KIDS[1].name}</button>
      <button class="close">Close</button>
    </div>`;
  document.body.appendChild(wrap);
  const opts = [...wrap.querySelectorAll('.opt')];
  for (const b of opts) {
    const v = b.dataset.v === 'both' ? null : +b.dataset.v;
    b.setAttribute('aria-pressed', v === before);
    b.addEventListener('click', () => {
      close();
      if (v !== before) { setSolo(v); onChange(v); }
    });
  }
  const close = () => {
    wrap.remove();
    removeEventListener('keydown', onKey, true);
    if (back && back.focus) back.focus({ preventScroll: true });
  };
  const onKey = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
  addEventListener('keydown', onKey, true);
  wrap.querySelector('.close').addEventListener('click', close);
  wrap.addEventListener('click', e => { if (e.target === wrap) close(); });
  (opts.find(b => b.getAttribute('aria-pressed') === 'true') || opts[0]).focus({ preventScroll: true });
}
