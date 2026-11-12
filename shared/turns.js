// The two players and whose turn it is. Avni is a girl (6), Ansh is a boy (4).
// The turn travels between pages in the URL (?turn=0 or 1), so walking from the castle into a room
// keeps the same child playing.
//
// Players setting (chosen by a parent, see players.js): both children taking turns on one screen
// (the default), or only one child on this device, when each has their own device. It is kept in
// localStorage on this device; the castle's inline script reads the same key.

export const KIDS = [
  { name: 'Avni', color: '#FF9BC8', emoji: '👧' },
  { name: 'Ansh', color: '#7CC4FF', emoji: '👦' }
];

export const PLAYERS_KEY = 'rainbowCastle.players.v1';

// null = both take turns; 0 or 1 = only that child plays on this device
export function soloKid() {
  try {
    const v = localStorage.getItem(PLAYERS_KEY);
    return v === '0' || v === '1' ? +v : null;
  } catch (e) { return null; }
}

export function setSolo(idx) {
  try {
    if (idx === 0 || idx === 1) localStorage.setItem(PLAYERS_KEY, String(idx));
    else localStorage.removeItem(PLAYERS_KEY);
  } catch (e) {}
}

// whose turn it is when a page opens: the only player, else the URL, else a coin toss
export function turnFromUrl() {
  const solo = soloKid();
  if (solo !== null) return solo;
  const t = new URLSearchParams(location.search).get('turn');
  return t === '0' || t === '1' ? +t : (Math.random() < 0.5 ? 0 : 1);
}

export function withTurn(href, idx) {
  return href + (href.includes('?') ? '&' : '?') + 'turn=' + idx;
}
