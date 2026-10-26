// © 2021–2026 zhs852

export const DUR = 520;
export const EASE = 'cubic-bezier(.22, 1, .36, 1)';
export const BLUR = 12;
export const reduced = matchMedia('(prefers-reduced-motion: reduce)');

export const ease = (() => {
  const [x1, y1, x2, y2] = [.22, 1, .36, 1];
  const bez = (t, a, b) => 3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t * t * b + t ** 3;
  return x => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 6; i++) {
      const d = 3 * (1 - t) ** 2 * x1 + 6 * (1 - t) * t * (x2 - x1) + 3 * t * t * (1 - x2);
      if (Math.abs(d) < 1e-6) break;
      t -= (bez(t, x1, x2) - x) / d;
    }
    return bez(Math.min(1, Math.max(0, t)), y1, y2);
  };
})();

const gone = s => ({ opacity: 0, filter: `blur(${BLUR}px)`, transform: `translateY(${s * 18}px) scale(.98)` });
const here = { opacity: 1, filter: 'blur(0px)', transform: 'none' };
let swaps = 0;

export const settle = n => Object.assign(n.style, { position: '', inset: '', transform: '', filter: '', opacity: '' });

export function swap(from, to, dir = 1) {
  const id = ++swaps, box = to.parentElement, h0 = box.offsetHeight;
  const cs = getComputedStyle(from);
  const now = { opacity: cs.opacity, filter: cs.filter === 'none' ? 'blur(0px)' : cs.filter, transform: cs.transform };
  const done = () => { from.hidden = true; settle(from); from.getAnimations().forEach(a => a.cancel()); };

  from._leaving = id;
  Object.assign(from.style, { position: 'absolute', inset: '0 0 auto' });
  to._leaving = 0;
  to.getAnimations().forEach(a => a.cancel());
  settle(to);
  to.hidden = false;
  if (reduced.matches) return done();

  const opts = { duration: DUR, easing: EASE };
  const h1 = box.offsetHeight;
  if (h0 !== h1) box.animate({ height: [`${h0}px`, `${h1}px`] }, opts);
  to.animate([gone(dir), here], opts);
  from.animate([now, gone(-dir)], { ...opts, fill: 'forwards' })
    .finished.then(() => from._leaving === id && done(), () => {});
}
