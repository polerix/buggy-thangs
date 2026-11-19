/* Buggy-Thangs — the escalation engine.
   Everything here runs locally in the visitor's browser. Nothing is sent anywhere.
   Personal details (local time, time zone city, device type, visit count) are read
   from the browser and only ever written back into this page. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const pick = a => a[(Math.random() * a.length) | 0];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = matchMedia('(pointer: coarse)').matches;
  const body = document.body;
  const page = body.dataset.page || 'home';

  /* ---------- storage (fails quietly) ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem('bt_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('bt_' + k, JSON.stringify(v)); } catch (e) {} }
  };
  let visits = store.get('visits', 0);
  try {
    if (!sessionStorage.getItem('bt_session')) { visits++; store.set('visits', visits); sessionStorage.setItem('bt_session', '1'); }
  } catch (e) { visits = Math.max(1, visits); }
  const finished = store.get('finished', false);
  let deepest = store.get('deepest', 0); // furthest stage ever reached, any page

  /* ---------- what the browser already knows ---------- */
  const tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || '');
  let city = tz.includes('/') ? tz.split('/').pop().replace(/_/g, ' ') : '';
  if (!city || /^(UTC|GMT|Etc)/i.test(tz)) city = 'your town';
  const ua = navigator.userAgent;
  const device =
    /iPhone/.test(ua) ? 'iPhone' :
    (/iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) ? 'iPad' :
    /Android/.test(ua) ? (/Mobile/.test(ua) ? 'phone' : 'tablet') :
    /Macintosh/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'computer' : /CrOS/.test(ua) ? 'Chromebook' : 'screen';
  const deviceA = (/^[aeiouAEIOU]|^iP/.test(device) ? 'an ' : 'a ') + device;
  const t0 = Date.now();

  const ordinal = n => n + (['th', 'st', 'nd', 'rd'][(n % 100 > 10 && n % 100 < 14) ? 0 : (n % 10 < 4 ? n % 10 : 0)] || 'th');
  const hour = () => new Date().getHours();
  const isNight = () => { const h = hour(); return h >= 21 || h < 6; };
  const part = () => { const h = hour(); return h < 5 ? 'night' : h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 21 ? 'evening' : 'night'; };
  const elapsed = () => {
    const s = Math.floor((Date.now() - t0) / 1000), m = Math.floor(s / 60), r = s % 60;
    if (m === 0) return `${s} second${s === 1 ? '' : 's'}`;
    return `${m} minute${m === 1 ? '' : 's'} and ${r} second${r === 1 ? '' : 's'}`;
  };

  const F = {
    time: () => new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    day: () => new Date().toLocaleDateString([], { weekday: 'long' }),
    part, city: () => city, device: () => device, deviceA: () => deviceA,
    elapsed,
    screen: () => `${screen.width}×${screen.height}`,
    collectors: () => (41392 + Math.floor((Date.now() - t0) / 6500)).toLocaleString(),
    visits: () => ordinal(visits),
    sleepline: () => isNight() ? 'You should be asleep.' : 'You will have to sleep eventually.',
    lightline: () => isNight()
      ? 'Your screen is the brightest thing in the room right now. That is how it finds you.'
      : 'It does not mind the daylight. It can wait for dark. It is very good at waiting.',
    visitline: () => visits <= 1
      ? 'This is your first visit. It will not be your last.'
      : `This is your ${ordinal(visits)} visit. It has been counting.`,
    wakehour: () => {
      const d = new Date(); d.setMinutes(d.getMinutes() + 7);
      return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }
  };
  function fill() {
    $$('[data-fill]').forEach(el => {
      const fn = F[el.dataset.fill];
      if (!fn) return;
      const v = fn();
      if (el.textContent !== v) el.textContent = v;
    });
  }
  fill();
  setInterval(fill, 1000);

  /* ---------- stage engine ---------- */
  const sections = $$('[data-s]');
  let stage = 0, maxStage = 0, p = 0;
  let lastScroll = Date.now(), lastY = scrollY, upTravel = 0;

  let curSec = null;
  function currentStage() {
    const mid = innerHeight * .5;
    let s = 0; curSec = null;
    for (const sec of sections) {
      const r = sec.getBoundingClientRect();
      if (r.top <= mid) { s = +sec.dataset.s; curSec = sec; } else break;
    }
    return s;
  }

  function onScroll() {
    const h = document.documentElement.scrollHeight - innerHeight;
    p = h > 0 ? clamp(scrollY / h, 0, 1) : 0;
    const s = currentStage();
    if (s !== stage) {
      stage = s;
      body.dataset.stage = s;
      if (s > maxStage) { maxStage = s; onDeeper(s); }
    }
    const dy = scrollY - lastY;
    if (dy < 0) upTravel -= dy; else if (dy > 0) upTravel = 0;
    lastY = scrollY;
    lastScroll = Date.now();
    idleWhispered = false;
    hideWatcher();
    calmNudge();
    swaps();
    wake();
  }

  function onDeeper(s) {
    if (s > deepest) { deepest = s; store.set('deepest', s); }
    const cart = $('.cart-count');
    if (cart) cart.textContent = ['0', '0', '1', '4', '∞'][s] || cart.textContent;
    if (s === 2) setTimeout(() => whisper(pick(W.enter2)), 2500);
    if (s === 3) setTimeout(() => whisper(pick(W.enter3)), 1500);
  }

  /* ---------- content that changes while you are not looking ---------- */
  function offscreen(el) { const r = el.getBoundingClientRect(); return r.bottom < -20 || r.top > innerHeight + 20; }
  function swaps() {
    $$('[data-alt]').forEach(el => {
      let want = 0;
      if (el.dataset.alt2 && maxStage >= +(el.dataset.alt2Stage || 4)) want = 2;
      else if (maxStage >= +(el.dataset.altStage || 2)) want = 1;
      const have = +(el.dataset.level || 0);
      if (want > have && offscreen(el)) {
        if (!el.dataset.orig) el.dataset.orig = el.innerHTML;
        el.innerHTML = want === 2 ? el.dataset.alt2 : el.dataset.alt;
        el.dataset.level = want;
      }
    });
    $$('[data-later]').forEach(el => {
      const rules = el.dataset.later.split('|').map(r => r.split(':'));
      let best = -1;
      rules.forEach((r, i) => { if (maxStage >= +r[0]) best = i; });
      const have = +(el.dataset.laterLevel ?? -1);
      if (best > have && offscreen(el)) {
        const [, open, mode, track, pupil] = rules[best];
        el.dataset.open = open; el.dataset.mode = mode || 'normal';
        el.dataset.track = track || '0';
        if (pupil) el.dataset.pupil = pupil; else delete el.dataset.pupil;
        delete el.dataset.photo;
        window.Thang.mount(el);
        el.dataset.laterLevel = best;
      }
    });
  }

  /* ---------- eyes that follow ---------- */
  let px = innerWidth / 2, py = innerHeight * .35, lastPointer = 0, scrollVel = 0, prevY = scrollY;
  addEventListener('pointermove', e => { px = e.clientX; py = e.clientY; lastPointer = Date.now(); }, { passive: true });
  addEventListener('pointerdown', e => { px = e.clientX; py = e.clientY; lastPointer = Date.now(); }, { passive: true });

  function trackLoop() {
    scrollVel = scrollVel * .85 + (scrollY - prevY) * .15;
    prevY = scrollY;
    const staring = isTouch && Date.now() - lastPointer > 1400;
    $$('svg.thang[data-track="1"]').forEach(svg => {
      const r = svg.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      svg.querySelectorAll('.eye').forEach(eye => {
        let tx, ty;
        if (staring) { tx = 0; ty = clamp(-scrollVel / 40, -.6, .6); }
        else {
          const er = eye.getBoundingClientRect();
          const dx = px - (er.left + er.width / 2), dy = py - (er.top + er.height / 2);
          const d = Math.hypot(dx, dy) || 1, m = Math.min(1, d / 240);
          tx = dx / d * m; ty = dy / d * m;
        }
        eye._x = (eye._x || 0) + (tx - (eye._x || 0)) * .14;
        eye._y = (eye._y || 0) + (ty - (eye._y || 0)) * .14;
        const pu = eye.querySelector('.pupil');
        if (pu) pu.setAttribute('transform', `translate(${(eye._x * 6).toFixed(2)},${(eye._y * 5).toFixed(2)})`);
      });
    });
    requestAnimationFrame(trackLoop);
  }
  requestAnimationFrame(trackLoop);

  /* sleepy blinks; later, the blinks stop */
  function animateOpen(svg, from, to, ms, done) {
    const t1 = performance.now();
    (function step(t) {
      const k = clamp((t - t1) / ms, 0, 1), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      window.Thang.setOpen(svg, from + (to - from) * e);
      if (k < 1) requestAnimationFrame(step); else if (done) done();
    })(t1);
  }
  if (!reduce) setInterval(() => {
    if (maxStage >= 3) return;
    const vis = $$('svg.thang').filter(s => { const r = s.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0 && +s.dataset.open < .6 && !s.closest('.watcher'); });
    if (!vis.length) return;
    const svg = pick(vis), o = +svg.dataset.open;
    animateOpen(svg, o, .04, 380, () => setTimeout(() => animateOpen(svg, .04, o, 900), 160));
  }, 5200);

  /* ---------- whispers ---------- */
  const W = Object.assign({
    enter2: ['did you hear that?', 'it rolled over.'],
    enter3: ['you can stop scrolling. it already knows where you are.', 'it is awake now.'],
    idle2: ['why did you stop?', 'keep going. it likes when you keep going.', 'it heard you stop.'],
    idle3: ['it is right behind the next section.', 'don\'t stop here. it\'s darker when you stop.', 'you are holding very still.'],
    idle4: ['close your eyes.', 'it is closer when you are still.'],
    up: ['going back up won\'t help.', 'it\'s still down there.', 'it saw you turn around.'],
    leave: ['where are you going?', 'don\'t leave it alone with the lights off.'],
    back: ['it moved while you were gone.', 'welcome back. it waited.', 'it turned to face the door when you left.']
  }, window.BT_WHISPERS || {});

  const wbox = document.createElement('div');
  wbox.className = 'whisper';
  wbox.setAttribute('aria-live', 'polite');
  body.appendChild(wbox);
  let wTimer, lastWhisper = 0;
  const quietZones = $$('[data-quiet]');
  function inQuietZone() {
    return quietZones.some(el => { const r = el.getBoundingClientRect(); return r.top < innerHeight * .9 && r.bottom > innerHeight * .1; });
  }
  function whisper(text, ms = 4600) {
    if (!text || Date.now() - lastWhisper < 3500 || inQuietZone()) return;
    lastWhisper = Date.now();
    wbox.textContent = text;
    wbox.style.left = (8 + Math.random() * 45) + 'vw';
    wbox.style.top = (18 + Math.random() * 55) + 'vh';
    wbox.classList.add('on');
    clearTimeout(wTimer);
    wTimer = setTimeout(() => wbox.classList.remove('on'), ms);
  }

  let idleWhispered = false, lastUpWhisper = 0, lastLeave = 0;
  setInterval(() => {
    const idle = Date.now() - lastScroll;
    if (!idleWhispered && stage >= 2 && idle > 6000 && !body.classList.contains('taking')) {
      idleWhispered = true;
      whisper(pick(stage >= 4 ? W.idle4 : stage === 3 ? W.idle3 : W.idle2));
    }
    if (stage >= 3 && upTravel > 420 && Date.now() - lastUpWhisper > 12000) {
      lastUpWhisper = Date.now(); upTravel = 0;
      whisper(pick(W.up));
    }
    watcherTick(idle);
    nudgeTick(idle);
  }, 250);

  document.documentElement.addEventListener('mouseleave', () => {
    if (maxStage >= 3 && Date.now() - lastLeave > 15000) { lastLeave = Date.now(); whisper(pick(W.leave)); }
  });

  /* ---------- the tab knows when you leave ---------- */
  const baseTitle = document.title;
  document.addEventListener('visibilitychange', () => {
    if (Math.max(maxStage, deepest) < 2) return;
    if (document.hidden) {
      document.title = pick(['come back', 'it moved.', 'don\'t leave it alone', 'it\'s facing the door now', 'lights off?']);
    } else {
      setTimeout(() => whisper(pick(W.back)), 600);
      setTimeout(() => { document.title = maxStage >= 4 ? 'Buggy-Thangs — it\'s home' : baseTitle; }, 4000);
    }
  });

  /* ---------- the watcher: only there when you're not looking ---------- */
  const watcher = $('.watcher');
  let watcherSvg = null;
  if (watcher) watcherSvg = watcher.querySelector('svg');
  function hideWatcher() { if (watcher) watcher.classList.remove('peek'); }
  function watcherTick(idle) {
    if (!watcher || reduce) return;
    const active = stage === 3 || (stage === 2 && maxStage >= 3);
    if (!active) { hideWatcher(); return; }
    if (watcher.classList.contains('peek')) {
      const r = watcher.getBoundingClientRect();
      const near = !isTouch && Date.now() - lastPointer < 2000 && Math.hypot(px - (r.left + r.width / 2), py - (r.top + r.height * .3)) < 220;
      if (near) { hideWatcher(); whisper(pick(['it doesn\'t like to be looked at.', 'too slow.'])); }
      return;
    }
    if (idle > 2200) {
      watcher.classList.remove('left', 'right');
      watcher.classList.add(Math.random() < .5 ? 'left' : 'right');
      void watcher.offsetWidth;
      watcher.classList.add('peek');
    }
  }

  /* ---------- the waking (home page end sequence) ---------- */
  const wakeSec = $('.wake');
  const wakeFace = wakeSec ? $('.wake-face', wakeSec) : null;
  const wakeLines = wakeSec ? $$('.wake-lines p', wakeSec) : [];
  function wake() {
    if (!wakeSec || !wakeFace) return;
    const r = wakeSec.getBoundingClientRect();
    const span = r.height - innerHeight;
    const q = clamp(-r.top / (span || 1), 0, 1);
    const svg = wakeFace.querySelector('svg');
    if (!svg) return;
    const open = clamp((q - .04) / .55, .04, 1);
    if (Math.abs(+svg.dataset.open - open) > .004) window.Thang.setOpen(svg, open);
    wakeFace.style.setProperty('--lum', (.32 + q * .6).toFixed(3));
    wakeFace.style.setProperty('--zoom', (1 + Math.pow(clamp((q - .45) / .55, 0, 1), 1.6) * 1.35).toFixed(3));
    if (q !== wake._q) { wake._q = q; window.dispatchEvent(new CustomEvent('bt:wake', { detail: q })); }
    let on = -1;
    wakeLines.forEach((l, i) => { if (q >= +l.dataset.at) on = i; });
    wakeLines.forEach((l, i) => l.classList.toggle('on', i === on));
  }

  /* ---------- scroll prompts: gentle, then passive aggressive, then hostile ---------- */
  const NUDGE = [
    ['scroll down', 'there\'s more below', 'keep going, it\'s cozy down here', 'just a little further', 'go on. down you go.'],
    ['it\'s fine. take your time.', 'most people would have scrolled by now.', 'it\'s not like it waited thirty years or anything.', 'no, stay. that\'s fine. really.', 'wow. okay.', 'we\'ll just wait, then.'],
    ['scroll.', 'down.', 'go down.', 'it is waiting for you.', 'don\'t make it come up there.', 'now.', 'DOWN.']
  ];
  const nudge = document.createElement('div');
  nudge.className = 'nudge';
  nudge.setAttribute('aria-hidden', 'true');
  nudge.innerHTML = '<span class="txt"></span><span class="chev">↓</span>';
  body.appendChild(nudge);
  const nTxt = nudge.querySelector('.txt');
  let stops = 0, nudgeIdx = [0, 0, 0], loudThisIdle = false;
  function baseTier() {
    if (!curSec || page === '404') return -1;
    const t = curSec.dataset.tier;
    if (t == null) return curSec.classList.contains('dark') ? 0 : -1;
    return +t;
  }
  function setNudge(tier, text, loud) {
    nudge.classList.remove('t0', 't1', 't2');
    nudge.classList.add('t' + tier, 'on');
    nudge.classList.toggle('loud', !!loud);
    if (nTxt.textContent !== text) nTxt.textContent = text;
  }
  const inlinePrompts = $$('.prompt');
  function promptVisible() {
    return inlinePrompts.some(el => { const r = el.getBoundingClientRect(); return r.top < innerHeight && r.bottom > innerHeight * .45; });
  }
  function calmNudge() {
    loudThisIdle = false;
    if (promptVisible()) { nudge.classList.remove('on', 'loud'); return; }
    const bt = baseTier();
    const nearEnd = page !== 'home' && p > .97;
    if (bt < 0 || nearEnd || body.classList.contains('taking')) { nudge.classList.remove('on', 'loud'); return; }
    const tier = Math.min(2, bt + Math.floor(stops / 3));
    setNudge(tier, NUDGE[tier][0], false);
    nudge.style.setProperty('--ns', (1 + Math.min(stops, 8) * .05).toFixed(2));
  }
  function nudgeTick(idle) {
    const bt = baseTier();
    if (bt < 0 || body.classList.contains('taking') || (page !== 'home' && p > .97) || promptVisible()) return;
    if (!loudThisIdle && idle > 2600) {
      loudThisIdle = true;
      stops++;
      const tier = Math.min(2, bt + Math.floor(stops / 2));
      const list = NUDGE[tier];
      nudgeIdx[tier] = Math.min(list.length - 1, nudgeIdx[tier] + 1);
      setNudge(tier, list[nudgeIdx[tier]], true);
      nudge.style.setProperty('--ns', (1.1 + Math.min(stops, 10) * .09).toFixed(2));
    }
  }

  /* ---------- returning visitors find things slightly rearranged ---------- */
  if (page === 'home') {
    const eb = $('.hero .eyebrow');
    const hero = $('.hero [data-thang]');
    if (finished) {
      if (eb) eb.textContent = 'You came back. It knew you would.';
      if (hero) { delete hero.dataset.photo; hero.dataset.open = '.8'; hero.dataset.track = '1'; hero.dataset.pupil = 'pin'; window.Thang.mount(hero); }
    } else if (visits > 1 && deepest >= 2) {
      if (eb) eb.textContent = 'Welcome back. Muffi didn\'t sleep.';
      if (hero) { delete hero.dataset.photo; hero.dataset.open = '.42'; hero.dataset.track = '1'; window.Thang.mount(hero); }
    }
  }

  /* ---------- small things ---------- */
  const signup = $('.signup');
  if (signup) signup.addEventListener('submit', e => {
    e.preventDefault();
    const note = $('.signup-note');
    if (note) note.textContent = 'Thanks! We already had your address.';
    signup.querySelector('input').value = '';
  });

  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => {
    es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold: .4 }) : null;
  $$('.lines .line').forEach(l => io ? io.observe(l) : l.classList.add('in'));

  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();
  window.BT = { whisper, store };
})();
