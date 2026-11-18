// Avni and Ansh's classmates at school, and a little SVG drawing of each one.
// Used by the school yard (faces in the windows) and the kindergarten class (the whole class on the rug).
// Each classmate has a favourite thing; when they help in an adding lesson, they bring that.
// Lines about classmates use their names, never he/she.

export const CLASSMATES = [
  { name: 'Millie',    skin: '#F7CBA8', hair: '#B5532E', style: 'pigtails', shirt: '#FF9BC8', fav: '🍓' },
  { name: 'Rhett',     skin: '#E8B48A', hair: '#3B2A20', style: 'short',    shirt: '#4D96FF', fav: '🍎' },
  { name: 'Flora',     skin: '#8D5A3B', hair: '#1E1A18', style: 'puffs',    shirt: '#6BCB77', fav: '🐞' },
  { name: 'KC',        skin: '#F3D2B8', hair: '#E8B04B', style: 'curly',    shirt: '#FF9F1C', fav: '⭐' },
  { name: 'Stephanie', skin: '#C68A5E', hair: '#3B2A20', style: 'bun',      shirt: '#9B5DE5', fav: '🐥' },
  { name: 'Hailey',    skin: '#F7CBA8', hair: '#E8B04B', style: 'long',     shirt: '#FFD84D', fav: '⭐' },
  { name: 'Vera',      skin: '#E8B48A', hair: '#7A4A2A', style: 'bob',      shirt: '#FF5A5F', fav: '🍎' },
  { name: 'Yana',      skin: '#F3D2B8', hair: '#1E1A18', style: 'long',     shirt: '#7FD0FF', fav: '🐥' },
  { name: 'Trenton',   skin: '#8D5A3B', hair: '#1E1A18', style: 'short',    shirt: '#C9F0C0', fav: '🐞' }
];

const INK = '#4A3F6B';

// hair drawn behind the head, and hair drawn over the top of it
function hairBack(k) {
  const h = k.hair;
  if (k.style === 'long') return `<path d="M12 28 Q12 8 30 8 Q48 8 48 28 L50 60 Q30 66 10 60 Z" fill="${h}"/>`;
  if (k.style === 'bob') return `<path d="M11 30 Q11 8 30 8 Q49 8 49 30 V46 Q30 50 11 46 Z" fill="${h}"/>`;
  if (k.style === 'pigtails') return `<circle cx="10" cy="30" r="7" fill="${h}"/><circle cx="50" cy="30" r="7" fill="${h}"/>`;
  if (k.style === 'puffs') return `<circle cx="13" cy="14" r="9" fill="${h}"/><circle cx="47" cy="14" r="9" fill="${h}"/>`;
  if (k.style === 'bun') return `<circle cx="30" cy="8" r="8" fill="${h}"/>`;
  return '';
}
function hairTop(k) {
  const h = k.hair;
  if (k.style === 'curly') {
    return [[16, 20], [21, 13], [30, 10], [39, 13], [44, 20]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="${h}"/>`).join('');
  }
  return `<path d="M13 30 Q13 11 30 11 Q47 11 47 30 Q40 19 30 20 Q20 19 13 30 Z" fill="${h}"/>`;
}

// the whole classmate (sitting, one arm free to wave) or only the face (for the school windows)
export function kidSvg(k, { face = false } = {}) {
  const view = face ? '4 0 52 50' : '0 0 60 84';
  const body = face ? '' : `
    <path d="M12 84 Q13 52 30 50 Q47 52 48 84 Z" fill="${k.shirt}"/>
    <path d="M18 60 L10 78" stroke-width="8"/><path d="M18 60 L10 78" stroke="${k.skin}" stroke-width="4"/>
    <g class="arm"><path d="M42 60 L50 78" stroke-width="8"/><path d="M42 60 L50 78" stroke="${k.skin}" stroke-width="4"/></g>`;
  return `<svg viewBox="${view}" aria-hidden="true"><g stroke="${INK}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">
    ${body}${hairBack(k)}
    <circle cx="30" cy="31" r="17" fill="${k.skin}"/>
    ${hairTop(k)}
  </g>
  <g fill="${INK}"><circle cx="24" cy="32" r="2.4"/><circle cx="36" cy="32" r="2.4"/></g>
  <circle cx="20" cy="38" r="3" fill="#FF9EB5" opacity=".6"/><circle cx="40" cy="38" r="3" fill="#FF9EB5" opacity=".6"/>
  <path d="M25 39 Q30 43 35 39" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/></svg>`;
}
