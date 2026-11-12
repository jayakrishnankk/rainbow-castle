// Full-screen canvas particles in screen pixels: sparkle bursts, emoji critters, water drops,
// rising bubbles and ripple rings. Pointer-events pass through. Fewer particles under reduced motion.

export function createFx(canvas) {
  const ctx = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rand = (a, b) => a + Math.random() * (b - a);
  let bits = [];

  function resize() {
    const d = Math.min(devicePixelRatio || 1, 2);
    canvas.width = innerWidth * d; canvas.height = innerHeight * d;
    ctx.setTransform(d, 0, 0, d, 0, 0);
  }
  addEventListener('resize', resize); resize();

  const few = n => reduced ? Math.ceil(n / 3) : n;

  function burst(x, y, colors, n = 16, speed = 5, gravity = 0.12) {
    for (let i = 0, m = few(n); i < m; i++) {
      const a = Math.random() * Math.PI * 2, s = speed * (0.4 + Math.random());
      bits.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1.5, g: gravity,
        life: 1, decay: rand(0.014, 0.032), size: rand(4, 10),
        color: colors[i % colors.length], shape: Math.random() < 0.55 ? 'star' : 'dot', rot: rand(0, 6), vr: rand(-0.15, 0.15) });
    }
  }
  // emoji; vy is signed (negative floats up)
  function release(x, y, o) {
    const sp = o.spread ?? 20, vx = o.vx ?? 1, [s0, s1] = o.size || [26, 36];
    for (let i = 0, n = few(o.n); i < n; i++) {
      bits.push({ x: x + rand(-sp, sp), y: y + rand(-10, 10), vx: rand(-vx, vx), vy: rand(o.vy[0], o.vy[1]),
        g: o.g ?? 0, life: 1, decay: o.decay ?? 0.008, size: rand(s0, s1), shape: 'emoji',
        ch: Array.isArray(o.ch) ? o.ch[i % o.ch.length] : o.ch, rot: rand(0, 6), vr: o.vr ?? 0.1, sw: o.sw ?? 14 });
    }
  }
  // water flying up and falling back
  function drops(x, y, n = 14, power = 5, spread = 20) {
    for (let i = 0, m = few(n); i < m; i++) {
      bits.push({ x: x + rand(-spread, spread), y, vx: rand(-2.5, 2.5), vy: -rand(power * 0.5, power), g: 0.25,
        life: 1, decay: 0.02, size: rand(3, 6), color: Math.random() < 0.5 ? '#7FD0FF' : '#D6F2FF', shape: 'drop', rot: 0, vr: 0 });
    }
  }
  // falling rain from a cup
  function pour(x, y, width = 30) {
    for (let i = 0, m = few(22); i < m; i++) {
      bits.push({ x: x + rand(-width, width), y: y + rand(0, 30), vx: 0, vy: rand(2, 4), g: 0.25,
        life: 1, decay: 0.015, size: 5, color: '#7FC8FF', shape: 'drop', rot: 0, vr: 0 });
    }
  }
  // bubbles rising (to stop at the water surface pass a ceiling y in screen px)
  function bubbles(x, y, n = 6, top = -Infinity) {
    for (let i = 0, m = few(n); i < m; i++) {
      bits.push({ x: x + rand(-8, 8), y: y + rand(-4, 4), vx: 0, vy: -rand(1, 2.2), g: -0.01, top,
        life: 1, decay: 0.008, size: rand(3, 8), color: '#FFFFFF', shape: 'bubble', rot: rand(0, 6), vr: 0.15 });
    }
  }
  function ring(x, y, r = 10) {
    bits.push({ x, y, vx: 0, vy: 0, g: 0, life: 1, decay: 0.02, size: r, grow: 1.6, color: '#FFFFFF', shape: 'ring', rot: 0, vr: 0 });
  }

  function star(x, y, r, rot) {
    ctx.beginPath();
    for (let k = 0; k < 8; k++) {
      const rr = k % 2 ? r * 0.4 : r, a = rot + k * Math.PI / 4;
      ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath(); ctx.fill();
  }
  (function tick() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    bits = bits.filter(b => b.life > 0);
    for (const b of bits) {
      b.vy += b.g; b.x += b.vx; b.y += b.vy; b.vx *= 0.98; b.rot += b.vr; b.life -= b.decay;
      if (b.top !== undefined && b.y < b.top) b.life = 0;
      ctx.globalAlpha = Math.max(0, b.life); ctx.fillStyle = b.color;
      if (b.shape === 'star') star(b.x, b.y, b.size * 1.4, b.rot);
      else if (b.shape === 'drop') { ctx.beginPath(); ctx.ellipse(b.x, b.y, b.size * 0.6, b.size * 1.3, 0, 0, Math.PI * 2); ctx.fill(); }
      else if (b.shape === 'bubble') {
        ctx.strokeStyle = b.color; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(b.x + Math.sin(b.rot) * 3, b.y, b.size, 0, Math.PI * 2); ctx.stroke();
      } else if (b.shape === 'ring') {
        b.size += b.grow;
        ctx.strokeStyle = b.color; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(b.x, b.y, b.size * 2, b.size * 0.5, 0, 0, Math.PI * 2); ctx.stroke();
      } else if (b.shape === 'emoji') {
        ctx.font = `${b.size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(b.ch, b.x + Math.sin(b.rot) * b.sw, b.y);
      } else { ctx.beginPath(); ctx.arc(b.x, b.y, b.size * 0.7, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(tick);
  })();

  return { burst, release, drops, pour, bubbles, ring };
}
