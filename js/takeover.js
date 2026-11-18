/* Buggy-Thangs — the takeover.
   After the waking, the page stops asking. It scrolls for you, faster and faster,
   through endless copies of the store, each one more wrong than the last.
   It never reaches the bottom. Any tap, click, key or wheel stops it.
   Then it's there. */
(function () {
  'use strict';
  if (document.body.dataset.page !== 'home' || !window.Thang) return;
  const body = document.body;
  const T = window.Thang;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pick = a => a[(Math.random() * a.length) | 0];
  const wake = document.querySelector('.wake');
  if (!wake) return;

  /* ---------- stage pieces ---------- */
  const feed = document.createElement('div');
  feed.className = 'feed';
  feed.setAttribute('aria-hidden', 'true');
  wake.after(feed);

  const blur = document.createElement('div'); blur.className = 'speedblur'; body.appendChild(blur);
  const msg = document.createElement('div'); msg.className = 'takeover-msg'; body.appendChild(msg);

  const stopper = document.createElement('div');
  stopper.className = 'stopper';
  stopper.setAttribute('aria-live', 'polite');
  stopper.innerHTML = `
    <div class="stop-face"><div data-thang="muffi" data-mode="horror" data-open="1" data-track="1" data-view="200 24 142 116"></div></div>
    <div class="stop-lines">
      <p>You stopped.</p>
      <p>So did it.</p>
      <p>It's right in front of you. It always was.</p>
      <p><a href="index.html">continue shopping</a></p>
    </div>`;
  body.appendChild(stopper);

  /* ---------- pre-rendered plush (cheap to repeat hundreds of times) ---------- */
  let IMG = null;
  function imgs() {
    if (IMG) return IMG;
    IMG = {
      photo: 'images/muffi.webp',
      sleep: T.toURL({ char: 'muffi', open: .15 }),
      half: T.toURL({ char: 'muffi', open: .55 }),
      open: T.toURL({ char: 'muffi', open: 1 }),
      pin: T.toURL({ char: 'muffi', open: 1, pupil: 'pin' }),
      void: T.toURL({ char: 'muffi', open: 1, pupil: 'void' }),
      shadow: T.toURL({ char: 'muffi', mode: 'shadow', open: 1 }),
      horror: T.toURL({ char: 'muffi', mode: 'horror', open: 1 }),
      doza: T.toURL({ char: 'doza', open: .2 }),
      kroop: T.toURL({ char: 'kroop', open: .6, pupil: 'pin' }),
      pillo: T.toURL({ char: 'pillo', open: .3 })
    };
    return IMG;
  }

  /* ---------- corrupted copies of the store ---------- */
  const HEADS = ['Small, fuzzy, and very sleepy.', 'Small, fuzzy, and very awake.', 'Small, fuzzy, and in your room.', 'Small, fuzzy, and behind you.', 'Small. Fuzzy. Here.', 'It was never small.', 'It was never sleepy.', 'It is not a toy.'];
  const LEDES = 'Buggy-Thangs are hand-needle-felted art plush, built from wool, thrifted denim and old sweaters. Each one stands on six bendy legs and naps wherever you put it.';
  const WORDS = ['it', 'awake', 'Muffi', 'behind you', 'here', 'watching', 'home', 'inside', 'closer', 'yours', 'stay', 'don\'t'];
  const BIG = ['it is still scrolling.', 'you can stop this.', 'you won\'t.', 'there is no bottom.', 'it has six legs. you have two.', 'welcome back. welcome back. welcome back.', 'every copy is a little closer.', 'look how many of them there are.', 'Free shipping. Forever.', 'Join us.', 'it knows you are still reading.', 'stop me.'];
  const NOTES = ['it was facing me again.', 'I put it in the box. the box was empty in the morning.', 'there are two of them now.', 'it was on the pillow.', 'please stop sending them.', 'I can hear the laces.', 'it was standing at the foot of the bed.', 'it doesn\'t blink anymore.'];
  const PRICES = ['$64', '$64', '$68', 'Already yours', 'Already home', 'Behind you', '$0.00', 'YOU', 'Sold. To you.'];

  function corrupt(text, k) {
    return text.split(' ').map(w => Math.random() < k * .55 ? pick(WORDS) : w).join(' ');
  }

  let n = 0;
  function makeCopy() {
    const I = imgs();
    const k = Math.min(1, n / 7);
    const light = Math.max(3, 30 - n * 4.2);
    const sec = document.createElement('section');
    sec.className = 'copy';
    sec.style.setProperty('--cbg', `hsl(34 ${Math.max(4, 18 - n * 2)}% ${light}%)`);
    sec.style.setProperty('--cink', `hsl(30 25% ${Math.min(92, 72 + n * 2)}%)`);
    const mirror = n % 3 === 2 ? 'transform:scaleX(-1)' : '';
    const photoFilter = `filter:grayscale(${k}) contrast(${1 + k * .6}) brightness(${1 - k * .45})`;

    const pool = n < 2 ? [I.sleep, I.doza, I.pillo, I.half] : n < 4 ? [I.half, I.open, I.kroop, I.pin] : [I.open, I.pin, I.void, I.horror, I.shadow];
    const cards = Math.min(24, 4 * (1 + Math.floor(n / 2)));
    let grid = '';
    for (let i = 0; i < cards; i++) {
      const src = n > 0 && i === 0 ? I.photo : pick(pool);
      const name = n < 2 ? pick(['Muffi', 'Doza', 'Kroop', 'Pillo']) : 'Muffi';
      grid += `<div class="card"><div class="canvas"><img src="${src}" alt=""></div><div class="meta"><span class="name">${name}</span><span class="price">${PRICES[Math.min(PRICES.length - 1, (n + (i % 3)))]}</span></div></div>`;
    }

    let notes = '';
    if (n >= 1) {
      for (let i = 0; i < Math.min(6, 2 + n); i++) notes += `<div class="note" style="--r:${(Math.random() * 4 - 2).toFixed(1)}deg"><small>Order #${20600 + n * 11 + i}</small>${pick(NOTES)}</div>`;
    }

    const collectors = Math.round(41392 * Math.pow(n + 1, 3.2)).toLocaleString();
    sec.innerHTML = `
      <div class="wrap">
        <div class="c-hero c-skew" style="--sk:${(Math.random() * 2 - 1) * k * 3}deg">
          <div>
            <p class="eyebrow" style="color:inherit;opacity:.6">${corrupt('Series 2 · Hand-felted in small batches', k)}</p>
            <h1>${HEADS[Math.min(n, HEADS.length - 1)]}</h1>
            <p class="lede" style="color:inherit;opacity:.75">${corrupt(LEDES, k)}</p>
          </div>
          <div class="c-img" style="${mirror}"><img src="${I.photo}" alt="" style="${photoFilter}"></div>
        </div>
        <p class="c-big">${n === 0 ? 'Meet the Thangs' : pick(BIG)}</p>
        <div class="grid">${grid}</div>
        ${notes ? `<div class="notes">${notes}</div>` : ''}
        <p class="c-big">Join ${collectors} collectors.</p>
      </div>`;
    n++;
    return sec;
  }

  /* ---------- the scroll ---------- */
  let running = false, armed = true, v = 0, raf = 0, startAt = 0, last = 0, graceUntil = 0;

  function topUp() {
    const room = document.documentElement.scrollHeight - (scrollY + innerHeight);
    let guard = 0;
    while (document.documentElement.scrollHeight - (scrollY + innerHeight) < innerHeight * 5 && guard++ < 4) feed.appendChild(makeCopy());
    while (feed.children.length > 7) {
      const first = feed.firstElementChild;
      const r = first.getBoundingClientRect();
      if (r.bottom > -innerHeight) break;
      const h = first.offsetHeight;
      first.remove();
      window.scrollBy(0, -h);
    }
    return room;
  }

  function frame(t) {
    if (!running) return;
    const dt = Math.min(50, t - (last || t)); last = t;
    const el = (t - startAt) / 1000;
    const target = el < 1.2 ? 1.5 + el * 3 : Math.min(85, 5 + Math.pow(el - 1.2, 1.7) * 9);
    v += (target - v) * .06;
    window.scrollBy(0, v * dt / 16.7);
    const b = Math.min(12, Math.max(0, (v - 6) / 6));
    blur.style.setProperty('--b', b.toFixed(1) + 'px');
    blur.style.setProperty('--sd', Math.min(.35, v / 240).toFixed(2));
    if (el > 2.2) msg.classList.remove('on');
    topUp();
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running || !armed) return;
    armed = false;
    body.classList.add('taking');
    topUp();
    msg.textContent = 'Fine. I\'ll do it myself.';
    msg.classList.add('on');
    graceUntil = performance.now() + 2400;
    if (reduce) {
      setTimeout(() => { msg.classList.remove('on'); showIt('It got tired of waiting for you.'); }, 2200);
      return;
    }
    setTimeout(() => {
      running = true; v = 0; last = 0; startAt = performance.now();
      raf = requestAnimationFrame(frame);
    }, 1300);
    ['wheel', 'touchstart', 'pointerdown', 'keydown'].forEach(e => addEventListener(e, onInput, { passive: true }));
  }

  function onInput() {
    if (performance.now() < graceUntil) return;
    if (!running) return;
    stop();
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
    ['wheel', 'touchstart', 'pointerdown', 'keydown'].forEach(e => removeEventListener(e, onInput));
    blur.style.setProperty('--b', '0px');
    blur.style.setProperty('--sd', '0');
    msg.classList.remove('on');
    showIt();
  }

  /* ---------- then it's there ---------- */
  let canDismiss = false;
  function showIt(firstLine) {
    const face = stopper.querySelector('.stop-face');
    const host = face.querySelector('[data-thang]');
    if (!host.querySelector('svg')) T.mount(host);
    const lines = Array.from(stopper.querySelectorAll('.stop-lines p'));
    if (firstLine) lines[0].textContent = firstLine;
    lines.forEach(l => l.classList.remove('on'));
    face.classList.remove('on');
    stopper.classList.add('on');
    document.title = 'it\'s in the room';
    try { window.BT && window.BT.store.set('finished', true); } catch (e) {}
    const R = reduce ? 0 : 1;
    setTimeout(() => face.classList.add('on'), 1600 * R);
    [3200, 5600, 8600, 11800].forEach((ms, i) => setTimeout(() => {
      lines[i].classList.add('on');
      if (i === lines.length - 1) canDismiss = true;
    }, ms * R));
  }

  stopper.addEventListener('click', e => {
    if (!canDismiss) return;
    e.preventDefault();
    canDismiss = false;
    stopper.classList.remove('on');
    setTimeout(() => {
      feed.innerHTML = '';
      n = 0;
      body.classList.remove('taking');
      window.scrollTo(0, 0);
      document.title = 'Buggy-Thangs — it\'s home';
      setTimeout(() => { armed = true; }, 1500);
    }, 800);
  });

  window.addEventListener('bt:wake', e => { if (e.detail >= .97) start(); });
})();
