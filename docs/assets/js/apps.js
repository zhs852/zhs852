// © 2021–2026 zhs852

export const APPS = [
  {
    id: 'asterisk',
    name: 'Asterisk',
    desc: { en: 'An elegant authenticator.', zh: '简洁且强大的身份验证器。' },
    get: 'https://play.google.com/store/apps/details?id=moe.zhs.asterisk',
    icon: {
      box: [120, -840, 720, 720],
      d: 'M451.5-131.5Q440-143 440-160v-224L282-225q-12 12-28.5 12T225-225q-12-12-12-28.5t12-28.5l159-158H160q-17 0-28.5-11.5T120-480q0-17 11.5-28.5T160-520h224L225-678q-12-12-12-28.5t12-28.5q12-12 28.5-12t28.5 12l158 159v-224q0-17 11.5-28.5T480-840q17 0 28.5 11.5T520-800v224l158-159q12-12 28.5-12t28.5 12q12 12 12 28.5T735-678L576-520h224q17 0 28.5 11.5T840-480q0 17-11.5 28.5T800-440H576l159 158q12 12 12 28.5T735-225q-12 12-28.5 12T678-225L520-384v224q0 17-11.5 28.5T480-120q-17 0-28.5-11.5Z',
    },
  },
  {
    id: 'caffeine',
    name: 'Caffeine',
    local: { zh: '咖啡因' },
    desc: { en: 'Keep your screen on.', zh: '保持屏幕唤醒。' },
    get: 'https://play.google.com/store/apps/details?id=moe.zhs.caffeine',
    guide: 'https://lab.zhs.moe/caffeine',
    icon: {
      box: [2, 3, 20, 18],
      d: 'M20 3H6c-1.1 0-2 .9-2 2v8c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 5h-2V5h2v3zM3 21h16c.55 0 1-.45 1-1s-.45-1-1-1H3c-.55 0-1 .45-1 1s.45 1 1 1z',
    },
  },
  {
    id: 'monochrome',
    name: 'Monochrome',
    desc: { en: 'A versatile barcode tool.', zh: '多功能条码工具。' },
    get: 'https://play.google.com/store/apps/details?id=moe.zhs.monochrome',
    icon: {
      box: [80, -800, 800, 640],
      d: 'M240-160q-66 0-113-47T80-320v-320q0-66 47-113t113-47h480q66 0 113 47t47 113v320q0 66-47 113t-113 47H240Zm0-480h480q22 0 42 5t38 16v-21q0-33-23.5-56.5T720-720H240q-33 0-56.5 23.5T160-640v21q18-11 38-16t42-5Zm-74 130 445 108q9 2 18 0t17-8l139-116q-11-15-28-24.5t-37-9.5H240q-26 0-45.5 13.5T166-510Z',
    },
  },
];
