// © 2021–2026 zhs852

const STRINGS = {
  en: { get: 'Get', guide: 'Guide', language: 'Language', dark: 'Switch to dark', light: 'Switch to light' },
  zh: { get: '获取', guide: '说明', language: '语言', dark: '切换到深色', light: '切换到浅色' },
};
const root = document.documentElement;
const listeners = [];

export const lang = () => (root.dataset.lang === 'zh' ? 'zh' : 'en');
export const t = key => STRINGS[lang()][key];
export const pick = v => (v && typeof v === 'object' ? v[lang()] ?? v.en : v);
export const onLang = fn => listeners.push(fn);

export function setLang(l) {
  root.dataset.lang = l;
  root.lang = l === 'zh' ? 'zh-Hans' : 'en';
  try { localStorage.setItem('lang', l); } catch {}
  listeners.forEach(fn => fn());
}
