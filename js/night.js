/* Buggy-Thangs — the store keeps hours.
   Morning, afternoon and evening are (mostly) the store you expect.
   After 9 PM the ghosts are already awake when you arrive.
   Between 3 and 4 AM the studio is closed and the night shift runs the site.
   At 3:12 AM, Muffi wakes up.

   Preview any of it with ?tod=morning|evening|night|3am|312 on any page. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const body = document.body;
  const q = new URLSearchParams(location.search);
  const forced = q.get('tod');
  const d = new Date(), h = d.getHours(), m = d.getMinutes();

  let tod = h >= 5 && h < 12 ? 'morning' : h >= 12 && h < 17 ? 'afternoon' : h >= 17 && h < 21 ? 'evening' : h === 3 ? '3am' : 'night';
  if (forced) tod = forced === '312' ? '3am' : forced;
  const is312 = forced === '312' || (h === 3 && m === 12);
  body.dataset.tod = tod;

  window.BT_TOD = {
    tod, is312,
    gFloor: tod === 'night' ? 1 : tod === '3am' ? 3 : 0,
    hFloor: tod === '3am' ? 40 : 0
  };

  /* copy that depends on the hour */
  const COPY = {
    '.hero h1': {
      morning: 'Small, fuzzy, and not a morning person.',
      evening: 'Small, fuzzy, and getting sleepy.',
      night: 'Small, fuzzy, and wide awake.',
      '3am': 'Small, fuzzy, and standing at the foot of your bed.'
    },
    '.hero .eyebrow': {
      night: 'Night shift edition · Series 2',
      '3am': 'The studio is closed'
    },
    '.page-hero .lede': {
      night: 'The night shift is packing tonight\'s orders. Small batches, so when they\'re gone, they\'re gone.',
      '3am': 'The studio is closed. The night shift is packing anyway.'
    }
  };
  Object.entries(COPY).forEach(([sel, by]) => {
    const el = $(sel);
    if (el && by[tod]) el.textContent = by[tod];
  });

  /* 3 AM: every photo becomes a silhouette that watches you */
  if (tod === '3am' && window.Thang) {
    $$('[data-thang]').forEach(el => {
      if (el.closest('.wake') || el.closest('.watcher')) return;
      delete el.dataset.photo; delete el.dataset.later;
      el.dataset.mode = 'shadow'; el.dataset.open = '1'; el.dataset.track = '1';
      window.Thang.mount(el);
    });
  }

  /* 3:12: it wakes up */
  let woke = false;
  function wake312() {
    if (woke) return;
    woke = true;
    if (window.BTT && window.BTT.showIt) window.BTT.showIt('It\'s 3:12.', 'You\'re awake. So is it.');
    else if (window.BTH) { window.BTH.roll(); window.BTH.ghostSay('3:12. it\'s awake.'); }
  }
  if (is312) setTimeout(wake312, 2500);
  setInterval(() => { const n = new Date(); if (n.getHours() === 3 && n.getMinutes() === 12) wake312(); }, 15000);
})();
