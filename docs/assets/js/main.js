// © 2021–2026 zhs852

import { APPS } from './apps.js';
import { MARK, POLICY, CODE } from './symbols.js';
import { createField } from './field.js';
import { DUR, EASE, BLUR, reduced, swap, settle } from './motion.js';
import { lang, t, pick, onLang } from './i18n.js';
import { initChrome, icon } from './chrome.js';

const $ = s => document.querySelector(s);
const root = document.documentElement;
const canHover = matchMedia('(hover: hover) and (pointer: fine)');
const compact = matchMedia('(max-width: 860px)');

const el = (tag, props, ...kids) => {
  const n = Object.assign(document.createElement(tag), props);
  n.append(...kids.filter(Boolean));
  return n;
};
const tint = (n, app) => (n.style.setProperty('--c', `var(--${app.id})`), n);
const nameOf = app => app.local?.[lang()] ?? app.name;
const action = (href, label, ic) => href && el('a', { className: 'act', href: pick(href), target: '_blank', rel: 'noopener', title: t(label), ariaLabel: t(label) }, icon(ic));
const actions = app => (app.get || app.guide) && el('div', { className: 'actions' }, action(app.get, 'get', 'download'), action(app.guide, 'guide', 'description'));

const TITLES = { home: { en: 'Akarin', zh: '某阿卡林' }, privacy: { en: 'Privacy Policy', zh: '隐私政策' } };
const PATHS = { home: '/', privacy: '/privacy-policy/' };
const viewOf = path => (path.startsWith('/privacy-policy') ? 'privacy' : 'home');

const state = { view: viewOf(location.pathname), hover: null, pinned: null, code: false, page: 0 };
const shape = () =>
  state.view === 'privacy' ? 'policy'
  : state.code ? 'code'
  : compact.matches ? APPS[state.page - 1]?.id ?? 'mark'
  : state.pinned ?? state.hover ?? 'mark';

initChrome();
const field = createField($('#field'), [MARK, POLICY, CODE, ...APPS], { initial: shape() });

const list = $('#apps'), deck = $('#deck'), dots = $('#deck-dots');

function sync() {
  const active = state.pinned ?? state.hover;
  for (const row of list.children) {
    row.classList.toggle('active', row.dataset.id === active);
    row.classList.toggle('pinned', row.dataset.id === state.pinned);
  }
  list.classList.toggle('has-active', !!active);
  [...dots.children].forEach((d, i) => d.setAttribute('aria-current', String(i === state.page)));
  field.show(shape());
}

function render() {
  document.title = pick(TITLES[state.view]);

  list.replaceChildren(...APPS.map(app => {
    const local = app.local?.[lang()];
    const row = tint(el('li', { className: 'app', tabIndex: 0 },
      el('div', { className: 'app-text' },
        el('span', { className: 'app-name' },
          el('span', { className: 'n-default', textContent: app.name }),
          local && el('span', { className: 'n-local', textContent: local, ariaHidden: 'true' })),
        app.desc && el('span', { className: 'app-desc', textContent: pick(app.desc) })),
      actions(app)), app);
    row.dataset.id = app.id;
    row.classList.toggle('has-local', !!local);
    return row;
  }));

  deck.replaceChildren(
    el('div', { className: 'deck-page' },
      el('h2', { className: 'deck-title', textContent: pick(TITLES.home) }),
      el('a', { className: 'deck-sub mono', href: 'https://github.com/zhs852', target: '_blank', rel: 'me noopener', textContent: 'github.com/zhs852' })),
    ...APPS.map(app => tint(el('div', { className: 'deck-page' },
      el('h2', { className: 'deck-title', textContent: nameOf(app) }),
      app.desc && el('p', { className: 'deck-sub', textContent: pick(app.desc) }),
      actions(app)), app)),
  );
  [...deck.children].forEach((p, i) => { p.hidden = i !== state.page; });
  dots.replaceChildren(...[...deck.children].map((p, i) => {
    const b = el('button', { type: 'button', className: 'deck-dot', value: i, ariaLabel: p.firstChild.textContent });
    return i ? tint(b, APPS[i - 1]) : b;
  }));

  $('#privacy-apps').replaceChildren(...APPS.map(app => tint(el('li', { textContent: nameOf(app) }), app)));
  sync();
}
onLang(render);
render();

const rowOf = e => e.target.closest('.app');
let muted = null;
list.addEventListener('pointerover', e => {
  const row = rowOf(e);
  if (!canHover.matches || !row || row.dataset.id === muted) return;
  muted = null;
  state.hover = row.dataset.id;
  sync();
});
list.addEventListener('pointerleave', () => { muted = state.hover = null; sync(); });
const pin = row => {
  const id = row.dataset.id;
  state.pinned = state.pinned === id ? null : id;
  if (!state.pinned) { muted = id; state.hover = null; }
  sync();
};
list.addEventListener('click', e => { if (rowOf(e) && !e.target.closest('a')) pin(rowOf(e)); });
list.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.app')) { e.preventDefault(); pin(e.target); }
});

const handle = $('#handle');
for (const [type, on] of [['pointerenter', true], ['pointerleave', false]]) {
  handle.addEventListener(type, e => { if (e.pointerType === 'mouse') { state.code = on; sync(); } });
}

compact.addEventListener('change', () => { state.hover = state.pinned = null; sync(); });

let lockedUntil = 0;
function turn(i) {
  if (i < 0 || i >= deck.children.length || i === state.page) return false;
  swap(deck.children[state.page], deck.children[i], Math.sign(i - state.page));
  state.page = i;
  lockedUntil = performance.now() + DUR * .6;
  sync();
  return true;
}
const deckLive = () => compact.matches && state.view === 'home';
dots.addEventListener('click', e => e.target.value && turn(+e.target.value));

{
  const surface = document.body;
  let y0 = null, dy = 0, dragging = false, swallow = false;
  surface.addEventListener('pointerdown', e => {
    if (deckLive() && e.button === 0) { y0 = e.clientY; dy = 0; dragging = false; }
  });
  surface.addEventListener('pointermove', e => {
    if (y0 == null) return;
    dy = e.clientY - y0;
    if (!dragging) {
      if (Math.abs(dy) < 10) return;
      dragging = true;
      surface.setPointerCapture(e.pointerId);
    }
    const edge = (dy > 0 && state.page === 0) || (dy < 0 && state.page === deck.children.length - 1);
    const d = dy * (edge ? .15 : .35);
    Object.assign(deck.children[state.page].style, {
      transform: `translateY(${d}px)`,
      filter: `blur(${Math.min(Math.abs(d) / 6, BLUR)}px)`,
      opacity: 1 - Math.min(Math.abs(d), 80) / 160,
    });
  });
  const end = () => {
    if (y0 == null) return;
    y0 = null;
    if (!dragging) return;
    swallow = true;
    setTimeout(() => { swallow = false; });
    if (Math.abs(dy) > 40 && turn(state.page - Math.sign(dy))) return;
    const p = deck.children[state.page], { transform, filter, opacity } = p.style;
    settle(p);
    if (!reduced.matches) p.animate([{ transform, filter, opacity }, { transform: 'none', filter: 'blur(0px)', opacity: 1 }], { duration: DUR, easing: EASE });
  };
  surface.addEventListener('pointerup', end);
  surface.addEventListener('pointercancel', end);
  surface.addEventListener('click', e => { if (swallow) { e.preventDefault(); e.stopPropagation(); } }, true);

  let acc = 0;
  addEventListener('wheel', e => {
    if (!deckLive()) return;
    if (performance.now() < lockedUntil) return void (acc = 0);
    acc += e.deltaY;
    if (Math.abs(acc) > 40) { turn(state.page + Math.sign(acc)); acc = 0; }
  }, { passive: true });
  addEventListener('keydown', e => {
    const step = { ArrowDown: 1, PageDown: 1, ArrowUp: -1, PageUp: -1 }[e.key];
    if (deckLive() && step) { e.preventDefault(); turn(state.page + step); }
  });
}

const views = { home: $('#view-home'), privacy: $('#view-privacy') };
const routeLink = $('#route-link');
const setView = v => {
  state.view = root.dataset.view = v;
  routeLink.href = PATHS[v === 'home' ? 'privacy' : 'home'];
  document.title = pick(TITLES[v]);
  sync();
};

function route(v, push = true) {
  if (state.view === v) return;
  if (push) history.pushState(null, '', PATHS[v]);
  swap(views[state.view], views[v], v === 'privacy' ? 1 : -1);
  setView(v);
  scrollTo({ top: 0, behavior: reduced.matches ? 'auto' : 'smooth' });
}
routeLink.addEventListener('click', e => {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
  e.preventDefault();
  route(state.view === 'home' ? 'privacy' : 'home');
});
addEventListener('popstate', () => route(viewOf(location.pathname), false));

views.home.hidden = state.view !== 'home';
views.privacy.hidden = state.view !== 'privacy';
setView(state.view);
root.classList.add('ready');
