// © 2021–2026 zhs852

import { DUR, ease, reduced } from './motion.js';

const TAU = Math.PI * 2;
const GRID = .74;
const SCALE = 10;
const FIT = 34;
const SPREAD = 220;

function sample({ box: [bx, by, bw, bh], d, line }) {
  const S = 48 * SCALE, k = FIT / Math.max(bw, bh);
  const ox = 24 - (bx + bw / 2) * k, oy = 24 - (by + bh / 2) * k, pts = [];

  if (line) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.innerHTML = `<path d="${d}"/>`;
    document.body.append(svg);
    const path = svg.firstChild, len = path.getTotalLength();
    for (let l = 0; l <= len; l += GRID / k) {
      const p = path.getPointAtLength(l), x = ox + p.x * k, y = oy + p.y * k;
      if (!pts.some(o => Math.hypot(o.x - x, o.y - y) < GRID * .7)) pts.push({ x, y, a: 1 });
    }
    svg.remove();
    return pts;
  }

  const c = Object.assign(document.createElement('canvas'), { width: S, height: S }).getContext('2d', { willReadFrequently: true });
  c.scale(SCALE, SCALE);
  c.translate(ox, oy);
  c.scale(k, k);
  c.fill(new Path2D(d));
  const data = c.getImageData(0, 0, S, S).data;
  for (let y = GRID / 2, row = 0; y < 47.5; y += GRID * .866, row++) {
    for (let x = row % 2 ? GRID : GRID / 2; x < 47.5; x += GRID) {
      if (data[(Math.round(y * SCALE) * S + Math.round(x * SCALE)) * 4 + 3] >= 128) pts.push({ x, y, a: 1 });
    }
  }
  return pts;
}

const angle = p => Math.atan2(p.y - 24, p.x - 24);
const lerp = (a, b, t) => a + (b - a) * t;

export function createField(canvas, shapes, { initial = shapes[0].id } = {}) {
  const ctx = canvas.getContext('2d');
  const sampled = shapes.map(s => [s.id, sample(s.icon)]);
  const N = Math.max(...sampled.map(([, p]) => p.length));

  const targets = Object.fromEntries(sampled.map(([id, pts]) => {
    const list = pts.slice();
    for (let i = 0; list.length < N; i++) list.push({ ...pts[(i * 7919) % pts.length], a: 0 });
    return [id, list.sort((p, q) => angle(p) - angle(q))];
  }));

  const colourOf = id => {
    const n = parseInt(getComputedStyle(document.documentElement).getPropertyValue(`--${id}`).trim().slice(1), 16);
    return [n >> 16 & 255, n >> 8 & 255, n & 255];
  };

  let shape = initial;
  const dots = targets[shape].map((t, i) => {
    const a = Math.random() * TAU, r = 14 + Math.random() * 26, c = colourOf(shape);
    return {
      fx: 24 + Math.cos(a) * r, fy: 24 + Math.sin(a) * r, fa: 0, fc: c,
      tx: t.x, ty: t.y, ta: t.a, tc: c,
      at: performance.now() + (i / N) * SPREAD,
      x: 0, y: 0, a: 0, c: c.slice(),
      ox: 0, oy: 0, vx: 0, vy: 0,
      seed: i * 12.9898,
    };
  });

  const retarget = (list, stagger) => {
    const now = performance.now(), c = colourOf(shape);
    dots.forEach((d, i) => {
      Object.assign(d, { fx: d.x, fy: d.y, fa: d.a, fc: d.c.slice(), tc: c, at: now + (stagger ? (i / N) * SPREAD : 0) });
      if (list) Object.assign(d, { tx: list[i].x, ty: list[i].y, ta: list[i].a });
    });
    kick();
  };
  const retint = () => retarget(null, false);
  new MutationObserver(retint).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', retint);

  let size = 0, unit = 0, dpr = 1;
  new ResizeObserver(() => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    size = canvas.clientWidth;
    unit = size / 48;
    canvas.width = canvas.height = Math.round(size * dpr);
    kick();
  }).observe(canvas);

  const ptr = { x: 0, y: 0, on: false };
  const local = e => {
    const r = canvas.getBoundingClientRect();
    return [(e.clientX - r.left) / unit, (e.clientY - r.top) / unit];
  };
  canvas.addEventListener('pointermove', e => { [ptr.x, ptr.y] = local(e); ptr.on = e.pointerType === 'mouse'; kick(); });
  canvas.addEventListener('pointerleave', () => { ptr.on = false; });
  canvas.addEventListener('pointerdown', e => {
    const [cx, cy] = local(e);
    for (const d of dots) {
      const dx = d.x - cx, dy = d.y - cy, dist = Math.hypot(dx, dy) || 1, f = 60 * Math.exp(-dist / 9);
      d.vx += dx / dist * f; d.vy += dy / dist * f;
    }
    kick();
  });

  let raf = 0, last = 0, visible = true;
  const frame = now => {
    raf = 0;
    const dt = Math.min(.033, (now - last) / 1000 || .016), t = now / 1000, snap = reduced.matches;
    last = now;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    for (const d of dots) {
      const k = snap ? 1 : ease((now - d.at) / DUR);
      d.x = lerp(d.fx, d.tx, k);
      d.y = lerp(d.fy, d.ty, k);
      d.a = lerp(d.fa, d.ta, k);
      for (let j = 0; j < 3; j++) d.c[j] = lerp(d.fc[j], d.tc[j], k);

      if (!snap) {
        if (ptr.on) {
          const dx = d.x + d.ox - ptr.x, dy = d.y + d.oy - ptr.y, dist = Math.hypot(dx, dy), R = 6;
          if (dist < R && dist > .01) {
            const f = (1 - dist / R) ** 2 * 900 * dt;
            d.vx += dx / dist * f; d.vy += dy / dist * f;
          }
        }
        d.vx += -d.ox * 140 * dt; d.vy += -d.oy * 140 * dt;
        const damp = Math.exp(-15 * dt);
        d.vx *= damp; d.vy *= damp;
        d.ox += d.vx * dt; d.oy += d.vy * dt;
      }

      if (d.a < .01) continue;
      const bx = snap ? 0 : Math.sin(t * 1.1 + d.seed) * .08, by = snap ? 0 : Math.cos(t * .9 + d.seed * 1.3) * .08;
      ctx.globalAlpha = d.a;
      ctx.fillStyle = `rgb(${d.c[0] | 0},${d.c[1] | 0},${d.c[2] | 0})`;
      ctx.beginPath();
      ctx.arc((d.x + d.ox + bx) * unit, (d.y + d.oy + by) * unit, unit * .2, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (visible && !document.hidden && !snap) raf = requestAnimationFrame(frame);
  };
  const kick = () => { if (!raf && size) raf = requestAnimationFrame(frame); };

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick(); }).observe(canvas);
  document.addEventListener('visibilitychange', kick);
  reduced.addEventListener('change', kick);

  return {
    show(id) {
      if (id === shape) return;
      shape = id;
      retarget(targets[id], true);
    },
  };
}
