/* Buggy-Thangs — the sale, and the ones who don't want it to happen.

   Two forces pull on every visit:
   - THE BRAND wants the order. The longer you stay with an empty cart, the more hostile it
     gets: a friendly chat bot, a move-in countdown, prices with an "indecision fee", pushier
     buttons. Adding to cart calms it for a while. Then it wants more.
   - THE GHOSTS don't want the makers making more. Every sale means another Thang, and every
     Thang gets filled with something. They deface the pitch, empty your cart, jam checkout,
     break the screen, rewrite the page while you're not looking, and punish the Back button.

   Everything runs in the visitor's browser. Nothing is sent anywhere.
   Flicker safety: never more than 2 flashes in any one second; all screen effects are off
   for visitors with reduced motion turned on. */
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
  const now = () => Date.now();

  const mk = st => ({
    get(k, d) { try { const v = st.getItem('bth_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { st.setItem('bth_' + k, JSON.stringify(v)); } catch (e) {} }
  });
  let ss, ls;
  try { ss = mk(sessionStorage); ls = mk(localStorage); } catch (e) { ss = ls = { get: (k, d) => d, set() {} }; }

  let t0 = ss.get('t0', 0);
  if (!t0) { t0 = now(); ss.set('t0', t0); }
  const secs = () => (now() - t0) / 1000;

  /* what the browser already knows (used by the brand, never sent anywhere) */
  const tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || '');
  let city = tz.includes('/') ? tz.split('/').pop().replace(/_/g, ' ') : '';
  if (!city || /^(UTC|GMT|Etc)/i.test(tz)) city = 'your town';
  const ua = navigator.userAgent;
  const device = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? 'phone' : /Macintosh/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'PC' : 'screen';
  const clock = () => new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const mins = () => { const m = Math.floor(secs() / 60); return m < 1 ? 'less than a minute' : m === 1 ? 'a minute' : m + ' minutes'; };
  const fill = t => t.replace(/\{city\}/g, city).replace(/\{CITY\}/g, city.toUpperCase()).replace(/\{time\}/g, clock())
    .replace(/\{device\}/g, device).replace(/\{DEVICE\}/g, device.toUpperCase()).replace(/\{mins\}/g, mins());

  /* ============ state ============ */
  const TOD = window.BT_TOD || { tod: 'afternoon', gFloor: 0, hFloor: 0 };

  let H = ss.get('H', 0);                 // brand hostility 0..100
  let demand = ss.get('demand', 1);       // how many items the brand wants right now
  let demandAt = ss.get('demandAt', 0);   // when it starts wanting more
  let gAdds = ss.get('gAdds', 0);         // ghosts get angrier with every sale
  let gReturn = ss.get('gReturn', 0);     // ...and every time you come back
  let cart = ls.get('cart', []);
  let L = 0, G = 0;

  function levels() {
    L = H < 18 ? 0 : H < 38 ? 1 : H < 58 ? 2 : H < 80 ? 3 : 4;
    const st = window.BT ? Math.max(0, (window.BT.maxStage || 0) - 1) : 0;
    G = clamp(Math.floor(Math.max(st, secs() / 60, TOD.gFloor) + gAdds * .5 + gReturn), 0, 4);
    body.dataset.hostile = L;
    body.dataset.ghost = G;
  }

  /* ============ the cart ============ */
  const FEE = [1, 1, 1.15, 1.4, 2];
  const priceNow = base => Math.round(base * FEE[L]);

  const drawer = document.createElement('aside');
  drawer.className = 'drawer';
  drawer.setAttribute('aria-label', 'Cart');
  drawer.innerHTML = `<div class="drawer-head"><b>Your cart</b><button class="drawer-x" type="button" aria-label="Close cart">×</button></div>
    <ul class="drawer-items"></ul>
    <div class="drawer-foot"><div class="drawer-total"></div><button class="btn checkout" type="button">Checkout</button></div>`;
  const scrim = document.createElement('div');
  scrim.className = 'drawer-scrim';
  body.append(scrim, drawer);
  const openDrawer = () => { drawer.classList.add('open'); scrim.classList.add('open'); };
  const closeDrawer = () => { drawer.classList.remove('open'); scrim.classList.remove('open'); };
  drawer.querySelector('.drawer-x').addEventListener('click', closeDrawer);
  scrim.addEventListener('click', closeDrawer);
  $$('a.cart').forEach(a => a.addEventListener('click', e => { e.preventDefault(); openDrawer(); }));

  const EMPTY = ['Your cart is empty.', 'Your cart is empty.', 'Your cart is empty. We noticed.', 'Still empty. Interesting choice.', 'EMPTY.'];
  function renderCart() {
    ls.set('cart', cart);
    $$('.cart-count').forEach(e => { e.textContent = cart.length; });
    const list = drawer.querySelector('.drawer-items');
    list.innerHTML = cart.length
      ? cart.map((it, i) => `<li><span>${it.name}</span><span>$${it.price}</span><button type="button" data-i="${i}" aria-label="Remove ${it.name}">remove</button></li>`).join('')
      : `<li class="empty">${EMPTY[L]}</li>`;
    const total = cart.reduce((a, b) => a + b.price, 0);
    drawer.querySelector('.drawer-total').textContent = cart.length ? `Total $${total}` : '';
    list.querySelectorAll('button[data-i]').forEach(b => b.addEventListener('click', () => {
      cart.splice(+b.dataset.i, 1);
      H = clamp(H + 8, 0, 100);
      renderCart();
      botSay(pick(L < 2 ? ['No problem! Maybe something else? 🐛'] : ['Removing things. Bold.', 'We saw that.', 'Put it back.']));
    }));
  }

  function addToCart(item, src) {
    cart.push(item);
    H = clamp(H - 24, 0, 100);
    if (cart.length >= demand && !demandAt) demandAt = now() + 40000;
    renderCart();
    $$('a.cart').forEach(a => { a.classList.remove('bump'); void a.offsetWidth; a.classList.add('bump'); });
    botSay(pick(L < 2 ? ['Great pick! 🐛 Your dorm is going to love it.', 'Yay! One more and shipping is free.'] : L < 4 ? ['Good. Now another.', 'That will do. For now.', 'See? That wasn\'t hard.'] : ['MORE.', 'ONE IS NOT ENOUGH.']));
    gAdds++;
    ghostReact(src);
  }

  function makeAddButton(name, base, host, src) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'add-btn';
    b.textContent = 'Add to cart';
    b.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      addToCart({ name, price: priceNow(base) }, src || host);
      b.classList.add('done'); b.textContent = 'Added ✓';
      setTimeout(() => { b.classList.remove('done'); labelButtons(); }, 1400);
    });
    // the ghosts don't want you clicking it
    b.addEventListener('pointerenter', () => {
      if (isTouch || G < 2) return;
      if (G >= 3 && (b._d || 0) < 2 && Math.random() < .65) {
        b._d = (b._d || 0) + 1;
        b.style.transform = `translate(${(Math.random() < .5 ? -1 : 1) * (40 + Math.random() * 50)}px,${-10 - Math.random() * 30}px)`;
        setTimeout(() => { b.style.transform = ''; }, 1600);
      } else if (Math.random() < .4) {
        const t = b.textContent; b.textContent = 'DON\'T'; b.classList.add('ghosted');
        setTimeout(() => { b.textContent = t; b.classList.remove('ghosted'); }, 700);
      }
    });
    host.appendChild(b);
  }

  $$('.card').forEach(card => {
    if (card.closest('.copy')) return;
    const n = card.querySelector('.name'), pr = card.querySelector('.price');
    if (!n || !pr) return;
    const base = parseFloat(pr.textContent.replace(/[^0-9.]/g, ''));
    if (isNaN(base)) return;
    pr.dataset.base = base;
    const pill = card.querySelector('.pill');
    if (pill && /sold out/i.test(pill.textContent)) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'add-btn'; b.disabled = true; b.textContent = 'Sold out';
      card.appendChild(b);
      return;
    }
    makeAddButton(n.textContent.trim(), base, card, card.querySelector('.canvas') || card);
  });
  $$('[data-buy]').forEach(el => {
    const [name, price] = el.dataset.buy.split('|');
    makeAddButton(name, +price, el, el.closest('section'));
  });

  const CTA = TOD.tod === '3am' ? ['Let it in', 'Let it in', 'LET IT IN', 'LET IT IN', 'LET IT IN'] : ['Add to cart', 'Add to cart', 'Buy now', 'ADD NOW', 'CONSUME'];
  function labelButtons() { $$('.add-btn:not(.done):not(.ghosted):not([disabled])').forEach(b => { if (b.textContent !== CTA[L]) b.textContent = CTA[L]; }); }

  function updatePrices() {
    $$('.price[data-base]').forEach(el => {
      const b = +el.dataset.base, p = priceNow(b);
      const html = TOD.tod === '3am' ? 'closed' : L < 2 ? `$${b}` : `<s>$${b}</s> $${p}${L >= 3 ? ' <small>indecision fee</small>' : ''}`;
      if (el.innerHTML !== html) el.innerHTML = html;
    });
  }

  /* ============ the brand: Buggy-Bot ============ */
  const bot = document.createElement('div');
  bot.className = 'bot';
  bot.innerHTML = `<div class="bot-panel" aria-live="polite">
      <div class="bot-head"><span class="av"><img src="images/muffi.webp" alt=""></span><div><b>${TOD.tod === '3am' ? 'Night Shift' : 'Buggy-Bot'}</b><small>${TOD.tod === '3am' ? 'Packing' : 'Customer happiness'}</small></div><button class="bot-x" type="button" aria-label="Minimise chat">–</button></div>
      <div class="bot-log"></div></div>
    <button class="bot-toggle" type="button" aria-label="Open chat"><img src="images/muffi.webp" alt=""><span class="bot-dot"></span></button>`;
  body.appendChild(bot);
  const log = bot.querySelector('.bot-log');
  bot.querySelector('.bot-toggle').addEventListener('click', () => { bot.classList.toggle('open'); bot.classList.remove('unread'); });
  bot.querySelector('.bot-x').addEventListener('click', () => { if (L < 4) bot.classList.remove('open'); });

  const LINES = [
    ['Hi! 👋 Moving out soon? A Thang makes any dorm feel like home.', 'Psst: Series 2 is going fast. Move-in week always sells out.', 'Need help picking? Kroop is great with roommates.', 'First apartment? Muffi looks amazing on a windowsill.'],
    ['Still browsing? Move-in day doesn\'t wait.', 'Your roommate already ordered one.', 'You\'ve been here {mins}. Just add it.', 'Free shipping ends when you leave this page.'],
    ['Tuition is forty thousand dollars. Muffi is sixty-four. Do the math.', 'Everyone on your floor has a Thang. Don\'t be the one who doesn\'t.', 'We noticed you haven\'t added anything. We notice everything.', 'Your parents would want you to have one.'],
    ['Add to cart.', 'It\'s {time} in {city}. You\'re still here. Your cart is still empty.', 'You can\'t keep taking without giving.', 'The makers need the order. Add to cart.'],
    ['ADD TO CART.', 'YOU DON\'T LEAVE UNTIL THE CART IS FULL.', '{CITY}. {DEVICE}. {time}. WE HAVE EVERYTHING EXCEPT YOUR ORDER.', 'THEY ARE ALREADY FELTING YOURS.']
  ];
  if (TOD.tod === 'night') LINES[0] = ['Up late? Same. 🐛 The night shift is packing orders right now.', 'Can\'t sleep? Muffi can\'t either.', 'It\'s {time}. Perfect time to treat yourself.'];
  if (TOD.tod === 'evening') LINES[0] = ['Evening! Winding down? 🐛', 'Move-in week starts soon. Is your shelf ready?', 'Doza is great company on a quiet night.'];
  // the alternative holiday gift guide: whatever is on now, or coming next (double weight)
  if (window.BT_HOLIDAYS) { const HL = window.BT_HOLIDAYS.lines(); for (let i = 0; i < LINES.length; i++) LINES[i] = LINES[i].concat(HL[i], HL[i]); }
  if (TOD.tod === '3am') for (let i = 0; i < LINES.length; i++) LINES[i] = ['The bot is asleep. We\'re not.', 'We\'re packing yours now.', 'Don\'t turn on the light.', 'It\'s {time}. Why are you awake?', 'Stay right there. We know the way to {city}.'];
  const GHOST_IN_BOT = ['DON\'T LISTEN TO IT', 'THEY ONLY MAKE MORE IF YOU BUY', 'IT ISN\'T A BOT', 'CLOSE THE CHAT'];

  const EYE_LOOP = 'images/muffi-eye-loop.mp4', EYE_STILL = 'images/muffi-eye.webp';
  function eyeMedia(cls) {
    return reduce ? `<img class="${cls}" src="${EYE_STILL}" alt="">`
      : `<video class="${cls}" src="${EYE_LOOP}" poster="images/muffi-eye-avatar.jpg" autoplay muted loop playsinline></video>`;
  }
  function botStare(caption) {
    const row = document.createElement('div');
    row.className = 'bot-msg bot-media';
    row.innerHTML = eyeMedia('stare') + `<span>${fill(caption)}</span>`;
    log.appendChild(row);
    while (log.children.length > 6) log.firstElementChild.remove();
    bot.classList.add('open');
    setTimeout(() => { log.scrollTop = log.scrollHeight; }, 50);
    flicker();
  }
  // at full hostility the bot stops pretending to be Muffi's photo
  let eyeAvatar = false;
  function setAvatar(on) {
    if (on === eyeAvatar || reduce) return;
    eyeAvatar = on;
    const t = bot.querySelector('.bot-toggle'), a = bot.querySelector('.bot-head .av');
    const tImg = t.querySelector('img, video'), aImg = a.querySelector('img, video');
    const mkv = () => { const v = document.createElement('video'); v.src = 'images/muffi-eye-avatar.mp4'; v.poster = 'images/muffi-eye-avatar.jpg'; v.muted = true; v.loop = true; v.autoplay = true; v.playsInline = true; v.className = 'eye-av'; return v; };
    const mki = () => { const i = new Image(); i.src = 'images/muffi.webp'; i.alt = ''; return i; };
    tImg.replaceWith(on ? mkv() : mki());
    aImg.replaceWith(on ? mkv() : mki());
  }
  let nextBot = now() + 6000, botCount = ss.get('botCount', 0);
  function botSay(text, ghost) {
    const row = document.createElement('div');
    row.className = 'bot-msg typing';
    row.innerHTML = '<span></span><span></span><span></span>';
    log.appendChild(row);
    while (log.children.length > 6) log.firstElementChild.remove();
    log.scrollTop = log.scrollHeight;
    setTimeout(() => {
      row.classList.remove('typing');
      row.textContent = fill(text);
      if (ghost) row.classList.add('ghost');
      log.scrollTop = log.scrollHeight;
      if (L >= 3 || botCount === 0) bot.classList.add('open');
      else if (!bot.classList.contains('open')) bot.classList.add('unread');
      botCount++; ss.set('botCount', botCount);
      // sometimes the ghosts get to the message first
      if (!ghost && G >= 2 && Math.random() < .25) setTimeout(() => {
        flicker();
        row.textContent = pick(GHOST_IN_BOT);
        row.classList.add('ghost');
      }, 1300);
    }, reduce ? 0 : 900);
  }

  /* ============ the ghosts ============ */
  const SCRAWLS = ['DON\'T', 'DON\'T BUY IT', 'THEY ONLY MAKE MORE IF YOU BUY', 'EVERY ORDER GETS FILLED', 'WE WERE CUSTOMERS', 'IT\'S NOT WOOL', 'STOP FEEDING THE STUDIO', 'LEAVE', 'NOT FOR SALE', 'WE CAN\'T GET OUT', 'CLOSE THE TAB', 'DON\'T LET THEM MAKE MORE'];
  const ghostBox = document.createElement('div');
  ghostBox.className = 'ghost-toast';
  ghostBox.setAttribute('aria-live', 'polite');
  body.appendChild(ghostBox);
  let gt;
  function ghostSay(text) {
    ghostBox.textContent = text;
    ghostBox.classList.add('on');
    clearTimeout(gt);
    gt = setTimeout(() => ghostBox.classList.remove('on'), 3800);
  }

  const visible = el => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; };
  function targets() {
    return $$('main .canvas, main .price[data-base], main h2, .hero .btns, main .add-btn').filter(el => !el.closest('.copy') && !el.closest('.wake'));
  }
  function deface(el, kind) {
    if (!el) return;
    if (kind === 'strike' || (el.classList.contains('price') && !kind)) { el.classList.add('struck'); return; }
    const host = el.classList.contains('add-btn') ? el.parentElement : el;
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    if (host.querySelectorAll(':scope > .scrawl, :scope > .smear').length >= 2) return;
    if (kind === 'smear' || (host.classList.contains('canvas') && Math.random() < .35)) {
      const s = document.createElement('div');
      s.className = 'smear';
      s.style.left = (10 + Math.random() * 50) + '%'; s.style.top = (10 + Math.random() * 50) + '%';
      s.style.transform = `rotate(${(Math.random() * 80 - 40).toFixed(0)}deg)`;
      host.appendChild(s);
      return;
    }
    const s = document.createElement('div');
    s.className = 'scrawl';
    s.setAttribute('aria-hidden', 'true');
    s.textContent = pick(SCRAWLS);
    s.style.left = (2 + Math.random() * 45) + '%';
    s.style.top = (8 + Math.random() * 60) + '%';
    s.style.transform = `rotate(${(Math.random() * 24 - 12).toFixed(1)}deg)`;
    host.appendChild(s);
  }
  function defaceSomething() {
    const all = targets();
    if (!all.length) return;
    const off = all.filter(el => !visible(el));
    const on = all.filter(visible);
    // mostly where you aren't looking, so it's there when you come back
    if (off.length && (Math.random() < .7 || !on.length)) deface(pick(off));
    else if (on.length) { flicker(); setTimeout(() => deface(pick(on)), 60); }
  }

  function ghostReact(src) {
    if (G < 1) return;
    if (src && visible(src)) { flicker(); setTimeout(() => deface(src), 60); }
    if (G >= 2 && Math.random() < (G >= 3 ? .8 : .5)) {
      setTimeout(() => {
        if (!cart.length) return;
        cart.splice((Math.random() * cart.length) | 0, 1);
        H = clamp(H + 12, 0, 100);
        renderCart();
        ghostSay(pick(['we took it out. you\'re welcome.', 'not that one.', 'it doesn\'t want to go to you.']));
        setTimeout(() => botSay(pick(L < 2 ? ['Oops! Something went wrong with your cart. Try adding it again? 🐛'] : ['Your cart is empty again. That is a choice.', 'Something removed your item. Add it back.', 'ADD IT BACK.'])), 2200);
      }, 8000 + Math.random() * 8000);
    }
  }

  /* checkout never goes through */
  const modal = document.createElement('div');
  modal.className = 'checkout-modal';
  modal.innerHTML = `<div class="ck"><b class="ck-title">Processing your order…</b><div class="ck-bar"><i></i></div><p class="ck-msg">Securely connecting to the studio.</p><button class="btn ghost ck-close" type="button">Close</button></div>`;
  body.appendChild(modal);
  modal.querySelector('.ck-close').addEventListener('click', () => modal.classList.remove('open'));
  drawer.querySelector('.checkout').addEventListener('click', () => {
    if (!cart.length) { botSay(pick(L < 2 ? ['Your cart is empty! Add a Thang first 🐛'] : ['There is nothing to check out. Fix that.'])); return; }
    closeDrawer();
    const bar = modal.querySelector('.ck-bar i'), msg = modal.querySelector('.ck-msg'), title = modal.querySelector('.ck-title');
    modal.querySelectorAll('.scrawl').forEach(s => s.remove());
    title.textContent = 'Processing your order…'; msg.textContent = 'Securely connecting to the studio.';
    bar.style.transition = 'none'; bar.style.width = '0'; void bar.offsetWidth;
    bar.style.transition = 'width 2.4s ease-out'; bar.style.width = '71%';
    modal.classList.add('open');
    setTimeout(() => { flicker(); deface(modal.querySelector('.ck')); }, 2600);
    setTimeout(() => {
      title.textContent = 'Order could not be completed';
      const order = { id: 'BT-' + Math.random().toString(36).slice(2, 8).toUpperCase(), items: cart.map(i => i.name), created: now() };
      const orders = ls.get('orders', []); orders.push(order); ls.set('orders', orders); ls.set('orderSeen', 0);
      msg.innerHTML = pick(['Payment declined. Reason: someone is standing in the doorway.', 'The studio is already working on yours. Please do not pay twice.', 'Your order was cancelled by another account at this address.'])
        + ` <br><br>The studio has started on it anyway. <a href="track.html">Track order ${order.id}</a>`;
      addTrackLink();
      cart = []; renderCart(); gAdds++;
      H = clamp(H + 25, 0, 100);
      ghostSay(pick(['we took them out.', 'nobody leaves with one.']));
      setTimeout(() => { if (L < 2) botSay('Hmm, checkout hiccuped! Please try again 🐛'); else botStare('WHAT DID YOU DO.'); }, 1800);
    }, 4400);
  });

  /* ============ screen breaks ============ */
  const flick = document.createElement('div'); flick.className = 'flicker'; body.appendChild(flick);
  const roller = document.createElement('div'); roller.className = 'rollbar'; body.appendChild(roller);
  const svgNS = 'http://www.w3.org/2000/svg';
  const defs = document.createElementNS(svgNS, 'svg');
  defs.setAttribute('width', '0'); defs.setAttribute('height', '0'); defs.style.position = 'absolute';
  defs.innerHTML = '<filter id="bt-tear"><feTurbulence type="fractalNoise" baseFrequency="0 0.06" numOctaves="1" seed="3"/><feDisplacementMap in="SourceGraphic" scale="34" xChannelSelector="R" yChannelSelector="G"/></filter>';
  body.appendChild(defs);

  const flashes = [];
  function flicker() {
    if (reduce || body.classList.contains('taking')) return;
    const t = now();
    while (flashes.length && t - flashes[0] > 1000) flashes.shift();
    if (flashes.length >= 2) return;                       // never more than 2 flashes in a second
    const n = flashes.length === 0 && Math.random() < .5 ? 2 : 1;
    for (let i = 0; i < n; i++) {
      flashes.push(t + i * 160);
      setTimeout(() => flick.animate([{ opacity: 0 }, { opacity: .82 }, { opacity: 0 }], { duration: 90 }), i * 160);
    }
    if (Math.random() < .5) setTimeout(() => pilloFlash(), 100);
  }
  /* the other Pillo: a frame of the close-up cuts in over a product photo, then it's gone */
  const ALTS = { pillo: 'images/pillo-alt.webp', muffi: 'images/muffi-eye.webp' };
  Object.values(ALTS).forEach(u => { const i = new Image(); i.src = u; });
  let lastPillo = 0;
  function pilloFlash(force) {
    if (reduce || body.classList.contains('taking') || now() - lastPillo < 4000) return;
    const photos = $$('img.photo').filter(visible);
    const pool = photos.filter(i => /(pillo|muffi)\.webp/.test(i.src));
    const cand = (G >= 3 || force) && photos.length ? photos : pool;
    if (!cand.length) return;
    lastPillo = now();
    const img = pick(cand), src = img.src, tf = img.style.transform;
    const own = /pillo\.webp/.test(src) ? ALTS.pillo : /muffi\.webp/.test(src) ? ALTS.muffi : pick(Object.values(ALTS));
    img.src = own; img.style.transform = 'none';
    setTimeout(() => { img.src = src; img.style.transform = tf; }, 140 + Math.random() * 90);
  }
  function roll() {
    if (reduce || body.classList.contains('taking')) return;
    roller.animate([{ transform: 'translateY(-30vh)', opacity: 1 }, { transform: 'translateY(110vh)', opacity: .9 }], { duration: 720, easing: 'linear' });
    const m = $('main');
    if (m) m.animate([{ transform: 'none' }, { transform: 'translateY(-9px) skewX(.6deg)' }, { transform: 'translateY(7px)' }, { transform: 'none' }], { duration: 640 });
  }
  function tear() {
    if (reduce || body.classList.contains('taking')) return;
    const sec = $$('main > section').find(visible);
    if (!sec) return;
    sec.style.filter = 'url(#bt-tear)';
    setTimeout(() => { sec.style.filter = ''; }, 260);
  }
  let nextBreak = now() + 15000;
  function breakTick() {
    const lvl = Math.max(G, L - 1);
    if (lvl < 1 || now() < nextBreak) return;
    nextBreak = now() + (Math.max(6, 34 - lvl * 7) + Math.random() * 8) * 1000;
    const r = Math.random();
    if (r < .45) flicker();
    else if (r < .75 && lvl >= 2) roll();
    else if (lvl >= 2) tear();
    else flicker();
  }

  /* ============ headlines corrode into Eater ============ */
  function wrap(el) {
    if (el.querySelector('.ch')) return;
    Array.from(el.childNodes).forEach(node => {
      if (node.nodeType !== 3 || !node.textContent.trim()) return;
      const frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        const w = document.createElement('span');
        w.className = 'wd';
        for (const c of part) { const s = document.createElement('span'); s.className = 'ch'; s.textContent = c; w.appendChild(s); }
        frag.appendChild(w);
      });
      node.replaceWith(frag);
    });
  }
  function eat() {
    const lvl = Math.max(L, G, window.BT ? window.BT.stage || 0 : 0);
    const target = clamp((lvl - 1) / 3, 0, 1) * .8;
    $$('main h1, main h2').forEach(h => {
      if (h.closest('.copy')) return;
      wrap(h);
      const chars = $$('.ch', h);
      const want = Math.round(chars.length * target);
      let have = chars.filter(c => c.classList.contains('eat')).length;
      const left = chars.filter(c => !c.classList.contains('eat'));
      while (have < want && left.length) { left.splice((Math.random() * left.length) | 0, 1)[0].classList.add('eat'); have++; }
    });
  }

  /* ============ paragraphs that change between viewings ============ */
  const vio = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(en => {
    const el = en.target;
    if (en.isIntersecting) { el._seen = true; return; }
    if (!el._seen || G < 1) return;
    const v = el.dataset.variants.split('||');
    el._vi = ((el._vi || 0) + 1) % v.length;
    el.textContent = v[el._vi];
  }), { threshold: 0 }) : null;
  const visitsSeen = ls.get('visitsSeen', 0) + (ss.get('counted', false) ? 0 : 1);
  if (!ss.get('counted', false)) { ls.set('visitsSeen', visitsSeen); ss.set('counted', true); }
  $$('[data-variants]').forEach(el => {
    const v = el.dataset.variants.split('||');
    if (visitsSeen > 1) { el._vi = (visitsSeen - 1) % v.length; el.textContent = v[el._vi]; }
    if (vio) vio.observe(el);
  });

  /* ============ the Back button ============ */
  function returnGlitch() {
    gReturn = Math.min(2, gReturn + 1); ss.set('gReturn', gReturn);
    levels();
    roll();
    setTimeout(() => ghostSay(pick(['you came back.', 'something is different. look.', 'it moved while you were gone.'])), 500);
    $$('[data-variants]').forEach(el => { const v = el.dataset.variants.split('||'); el._vi = ((el._vi || 0) + 1) % v.length; el.textContent = v[el._vi]; });
    for (let i = 0; i < 3; i++) defaceSomething();
    const heroImg = $('.hero .photo');
    if (heroImg) {
      heroImg.src = pick(['images/kroop.webp', 'images/doza.webp', 'images/bramble.webp', 'images/gnarl.webp', 'images/pillo.webp']);
      heroImg.style.transform = 'scaleX(-1)';
    }
    if (page === 'home') {
      const secList = $$("main > section").slice(1, 8);
      if (secList.length) setTimeout(() => pick(secList).scrollIntoView({ behavior: 'auto' }), 900);
    }
    botSay(L < 2 ? 'Welcome back! Your cart missed you 🐛' : 'You left. You came back. The cart is still waiting.');
  }
  const navEntry = performance.getEntriesByType ? performance.getEntriesByType('navigation')[0] : null;
  if (navEntry && navEntry.type === 'back_forward') setTimeout(returnGlitch, 700);
  addEventListener('pageshow', e => { if (e.persisted) returnGlitch(); });

  // one step of history on the home page, so the first Back press doesn't go where you expect
  let trapSet = false, trapUsed = false;
  function maybeTrap() {
    if (page !== 'home' || trapSet || !window.BT || window.BT.maxStage < 2) return;
    trapSet = true;
    try { history.pushState({ bt: 'deep' }, ''); } catch (e) {}
  }
  addEventListener('popstate', () => {
    if (!trapSet || trapUsed) return;
    trapUsed = true;
    roll();
    ghostSay('THERE IS NO BACK');
    const deep = $('section[data-tier="2"]') || $('main > section:last-of-type');
    setTimeout(() => deep && deep.scrollIntoView({ behavior: 'auto' }), 300);
  });

  /* ============ the move-in countdown ============ */
  const announce = $('.announce');
  let cd = ss.get('cd', 900);
  if (announce) { announce.removeAttribute('data-alt'); announce.innerHTML = 'Move-in sale ends in <b class="cd">15:00</b> · free shipping on dorm orders'; }
  function countdown() {
    if (!announce) return;
    cd -= 1 + L * .75;
    const a = Math.abs(Math.round(cd)), t = `${String(Math.floor(a / 60)).padStart(2, '0')}:${String(a % 60).padStart(2, '0')}`;
    const html = TOD.tod === '3am' ? 'The studio is closed. <b class="cd">The night shift is in.</b>'
      : TOD.tod === 'night' && cd >= 0 ? `The night shift is packing tonight's orders · sale ends in <b class="cd">${t}</b>`
      : cd >= 0 ? `Move-in sale ends in <b class="cd">${t}</b> · free shipping on dorm orders`
      : `The sale ended <b class="cd">${t}</b> ago. You hesitated.`;
    if (announce.innerHTML !== html) announce.innerHTML = html;
  }

  /* ============ orders that arrive whether you paid or not ============ */
  function addTrackLink() {
    if ($('.nav-links a.track') || !ls.get('orders', []).length) return;
    const a = document.createElement('a');
    a.href = 'track.html'; a.className = 'track'; a.textContent = 'Track order';
    const cartA = $('.nav-links a.cart');
    if (cartA) cartA.before(a);
  }
  addTrackLink();
  const STATUS_BOT = ['', 'Good news! The studio has started felting your order 🐛', 'Your Thang is settling in at the studio tonight.', 'Your order has shipped! 🐛', 'Your Thang is on its way to {city}.', 'Out for delivery in {city}! Leave a door unlocked.', 'Delivered! 🐛 We left it inside.', 'IT\'S INSIDE.'];
  const STATUS_AT = [0, 120, 600, 3600, 21600, 72000, 100800, 129600];
  function orderStatus() {
    const orders = ls.get('orders', []);
    if (!orders.length) return;
    const el = (now() - orders[orders.length - 1].created) / 1000;
    let idx = 0; STATUS_AT.forEach((at, i) => { if (el >= at) idx = i; });
    const seen = ls.get('orderSeen', 0);
    if (idx > seen) {
      ls.set('orderSeen', idx);
      if (page !== 'track') {
        botSay(STATUS_BOT[idx]);
        if (idx >= 5) setTimeout(() => ghostSay(idx >= 6 ? 'it\'s already inside.' : 'DON\'T OPEN THE DOOR'), 3000);
      }
    }
  }
  setTimeout(orderStatus, 4000);
  setInterval(orderStatus, 20000);

  /* ============ the clock ============ */
  function tick() {
    const s = secs();
    if (cart.length >= demand) {
      H = clamp(H - 1.5, 0, 100);
      if (demandAt && now() > demandAt) { demand++; demandAt = 0; botSay(L < 2 ? 'Loving your cart! Have you seen the rest of the lineup? 🐛' : 'That was enough for a while. It isn\'t anymore.'); }
    } else {
      H = clamp(H + .6 + .15 * (demand - cart.length), 0, 100);
    }
    H = Math.max(H, TOD.hFloor);
    levels();
    ss.set('H', H); ss.set('demand', demand); ss.set('demandAt', demandAt); ss.set('gAdds', gAdds); ss.set('cd', cd);
    updatePrices();
    labelButtons();
    countdown();
    eat();
    breakTick();
    maybeTrap();
    if (Math.random() < (G >= 1 ? .03 + G * .015 : .008)) pilloFlash();
    if (G >= 1 && Math.random() < (G >= 2 ? .06 + G * .04 : .05) && $$('.scrawl, .smear, .struck').length < G * 6) defaceSomething();
    if (!body.classList.contains('taking') && now() > nextBot) {
      nextBot = now() + [24, 18, 14, 10, 7][L] * 1000 * (.8 + Math.random() * .4);
      if (L >= 3 && Math.random() < .3) botStare(pick(['I see you.', 'Look at me when I\'m talking to you.', 'Still here. Still looking.', 'Add to cart. I\'ll wait.']));
      else botSay(pick(LINES[L]));
    }
    setAvatar(L >= 4);
    if (L >= 4) bot.classList.add('open');
    renderCartLight();
  }
  let lastEmptyL = -1;
  function renderCartLight() { if (!cart.length && lastEmptyL !== L) { lastEmptyL = L; renderCart(); } }

  levels();
  renderCart();
  updatePrices();
  setInterval(tick, 1000);
  window.BTH = { age: s => { t0 = now() - s * 1000; }, get H() { return H; }, get L() { return L; }, get G() { return G; }, cart: () => cart, setH: v => { H = v; }, ghostSay, roll, tear, flicker, pilloFlash, botStare, setAvatar };
})();
