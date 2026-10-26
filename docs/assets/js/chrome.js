// © 2021–2026 zhs852

import { lang, t, setLang, onLang } from './i18n.js';
import { ICONS } from './symbols.js';
import { DUR, EASE, BLUR, reduced } from './motion.js';

const root = document.documentElement;

export function icon(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 -960 960 960');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = `<path d="${ICONS[name]}"/>`;
  return svg;
}

function transition(apply, animate) {
  if (!document.startViewTransition || reduced.matches) return apply();
  document.startViewTransition(apply).ready.then(animate);
}
const opts = pseudo => ({ duration: DUR, easing: EASE, pseudoElement: `::view-transition-${pseudo}(root)` });

export function initChrome() {
  document.querySelectorAll('[data-icon]').forEach(n => n.prepend(icon(n.dataset.icon)));
  document.getElementById('year').textContent = new Date().getFullYear();

  const menu = document.getElementById('lang-menu');
  const langBtn = document.getElementById('lang-btn');
  menu.addEventListener('beforetoggle', e => {
    if (e.newState !== 'open') return;
    const r = langBtn.getBoundingClientRect();
    menu.style.top = `${r.bottom + 6}px`;
    menu.style.right = `${innerWidth - r.right}px`;
  });
  menu.addEventListener('click', e => {
    const l = e.target.closest('button')?.value;
    if (!l) return;
    menu.hidePopover();
    if (l === lang()) return;
    transition(() => setLang(l), () => {
      root.animate({ opacity: [1, 0], filter: ['blur(0px)', `blur(${BLUR}px)`] }, opts('old'));
      root.animate({ opacity: [0, 1], filter: [`blur(${BLUR}px)`, 'blur(0px)'] }, opts('new'));
    });
  });

  const dark = matchMedia('(prefers-color-scheme: dark)');
  const themeBtn = document.getElementById('theme-toggle');
  const isDark = () => (root.dataset.theme ? root.dataset.theme === 'dark' : dark.matches);
  themeBtn.addEventListener('click', () => {
    const theme = isDark() ? 'light' : 'dark';
    const b = themeBtn.getBoundingClientRect(), x = b.left + b.width / 2, y = b.top + b.height / 2;
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    transition(() => {
      root.dataset.theme = theme;
      try { localStorage.setItem('theme', theme); } catch {}
      label();
    }, () => root.animate({ clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] }, opts('new')));
  });

  const label = () => {
    langBtn.ariaLabel = t('language');
    themeBtn.ariaLabel = t(isDark() ? 'light' : 'dark');
    menu.querySelectorAll('button').forEach(b => b.setAttribute('aria-current', String(b.value === lang())));
  };
  dark.addEventListener('change', label);
  onLang(label);
  label();
}
