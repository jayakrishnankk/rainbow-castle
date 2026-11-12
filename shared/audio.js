// Shared sound effects: one Web Audio context and synthesized notes, so no sound files to load.
// Sound is optional: setMuted(true) silences everything (speech.js checks isMuted too).
// iOS only starts audio from inside a touchend/click; speech.js calls resume() from its unlock handler.

let ac = null, master = null, muted = false;

// C major pentatonic, low to high
export const NOTES = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.5, 1174.66];

export function resume() {
  if (!ac) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ac = new AC();
    master = ac.createGain();
    master.gain.value = muted ? 0 : 0.7;
    master.connect(ac.destination);
  }
  if (ac.state !== 'running') ac.resume().catch(() => {});
  return ac;
}

export function setMuted(m) {
  muted = m;
  if (master) master.gain.value = m ? 0 : 0.7;
}
export const isMuted = () => muted;

export function tone(freq, { dur = 1.1, vol = 0.22, type = 'sine', when = 0, slideTo } = {}) {
  if (muted) return;
  const a = resume(); if (!a) return;
  const t = a.currentTime + when;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur * 0.8);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.05);
}

export const bell = (f, when = 0) => { tone(f, { when }); tone(f * 4, { vol: 0.04, dur: 0.25, when }); };
export const pop = () => tone(760, { dur: 0.16, vol: 0.3, slideTo: 200 });
export const twinkle = () => { bell(1567.98); bell(2093, 0.08); };
export const chime = () => [523.25, 659.25, 783.99, 1046.5].forEach((f, k) => bell(f, k * 0.09));
export const fanfare = () => [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5].forEach((f, k) => bell(f, k * 0.12));
export const bloop = (when = 0) => tone(260 + Math.random() * 200, { dur: 0.18, vol: 0.18, slideTo: 900 + Math.random() * 400, when });
export const quack = () => { tone(520, { dur: 0.14, vol: 0.2, type: 'sawtooth', slideTo: 300 }); tone(500, { dur: 0.14, vol: 0.2, type: 'sawtooth', slideTo: 280, when: 0.18 }); };
export const boing = () => tone(180, { dur: 0.45, vol: 0.25, type: 'triangle', slideTo: 520 });

// filtered white noise: a splash (size 0.3 = drip, 1 = jump)
let noise = null;
export function splash(size = 0.6, when = 0) {
  if (muted) return;
  const a = resume(); if (!a) return;
  if (!noise) {
    noise = a.createBuffer(1, a.sampleRate, a.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t = a.currentTime + when, dur = 0.15 + size * 0.5;
  const src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
  src.buffer = noise;
  f.type = 'bandpass'; f.Q.value = 0.8;
  f.frequency.setValueAtTime(2400, t); f.frequency.exponentialRampToValueAtTime(500, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.25 + size * 0.3, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(master); src.start(t); src.stop(t + dur + 0.05);
}
