// Text-to-speech for characters. speak() returns a promise that resolves when the line is
// (probably) finished, so scripted scenes can pace themselves; the room shows the words on screen too.
//
// iPhones only allow speech and audio to start from a touchend/click (not pointerdown), and a silent
// blank utterance doesn't count. So until the first such tap, the latest line waits in `pending` and
// unlock() speaks it from inside that tap.
import { resume, isMuted } from './audio.js';

let unlocked = false, pending = null;

function pickVoice() {
  const vs = speechSynthesis.getVoices();
  const prefs = ['Samantha', 'Karen', 'Moira', 'Tessa', 'Google UK English Female', 'Google US English', 'Zira', 'Aria', 'Jenny', 'Female'];
  for (const p of prefs) { const v = vs.find(v => v.name.includes(p)); if (v) return v; }
  return vs.find(v => v.lang && v.lang.startsWith('en')) || null;
}
try { speechSynthesis.getVoices(); speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices(); } catch (e) {}

// time to read the bubble when nothing is spoken
const readTime = text => 700 + text.length * 55;

export function speak(text, { pitch = 1.7, rate = 0.95 } = {}) {
  return new Promise(resolve => {
    let done = false;
    const finish = () => { if (!done) { done = true; resolve(); } };
    if (isMuted() || !('speechSynthesis' in window)) { setTimeout(finish, readTime(text)); return; }
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.pitch = pitch; u.rate = rate; u.volume = 1;
      const v = pickVoice(); if (v) u.voice = v;
      if (!unlocked) {
        pending = u;
        setTimeout(finish, readTime(text));
        return;
      }
      u.onend = finish;
      u.onerror = finish;
      // iOS Safari drops an utterance queued right after cancel(), so only cancel when busy and wait a beat
      if (speechSynthesis.speaking || speechSynthesis.pending) {
        speechSynthesis.cancel();
        setTimeout(() => { try { speechSynthesis.speak(u); } catch (e) { finish(); } }, 80);
      } else {
        speechSynthesis.speak(u);
      }
      // onend is unreliable on some browsers: never hold a scene longer than this
      setTimeout(finish, 1500 + text.length * 90);
    } catch (e) { setTimeout(finish, readTime(text)); }
  });
}

export function hush() {
  pending = null;
  try { speechSynthesis.cancel(); } catch (e) {}
}

function unlock() {
  resume();
  if (unlocked || !pending) return;
  if (isMuted()) { pending = null; return; }
  try {
    speechSynthesis.speak(pending);
    unlocked = true; pending = null;
  } catch (e) {}
}
['touchend', 'click'].forEach(t => addEventListener(t, unlock, { passive: true }));
