/* Buggy-Thangs — order tracking.
   Every failed checkout still starts an order. It advances in real time across visits.
   ?fast plays it at 600x (an hour in six seconds). ?demo starts an order if there isn't one. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const q = new URLSearchParams(location.search);
  const speed = q.has('fast') ? 600 : 1;
  const root = $('#tracker');
  if (!root) return;

  const get = (k, d) => { try { const v = localStorage.getItem('bth_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } };
  const set = (k, v) => { try { localStorage.setItem('bth_' + k, JSON.stringify(v)); } catch (e) {} };
  let orders = get('orders', []);
  if (q.has('demo') && !orders.length) {
    orders = [{ id: 'BT-' + Math.random().toString(36).slice(2, 8).toUpperCase(), items: ['Muffi'], created: Date.now() }];
    set('orders', orders);
  }

  const tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || '');
  let city = tz.includes('/') ? tz.split('/').pop().replace(/_/g, ' ') : '';
  if (!city || /^(UTC|GMT|Etc)/i.test(tz)) city = 'your town';
  const PHOTOS = { muffi: 'muffi', doza: 'doza', kroop: 'kroop', pillo: 'pillo', gnarl: 'gnarl', bramble: 'bramble' };

  const STEPS = [
    [0, 'Order received', 'The studio has your order. Thank you for supporting small makers.'],
    [120, 'Felting has begun', 'Someone at the studio has started on yours. Around 40,000 pokes to go.'],
    [600, 'Settling', 'Your Thang is spending a night alone in the studio with the lights off. We find this calms them down.'],
    [3600, 'Shipped', 'Your Thang has left the studio. Nobody at the studio packed it.'],
    [21600, 'In transit', `Moving toward ${city}. It is not in a truck.`],
    [72000, 'Out for delivery', `Out for delivery in ${city}. Estimated arrival: tonight. Leave a door unlocked.`],
    [100800, 'Delivered', 'Delivered. Left at: inside.'],
    [129600, 'It\'s inside', 'Delivered to: the room you are in. No signature was required.']
  ];
  window.BT_ORDER_STEPS = STEPS;

  if (!orders.length) {
    root.innerHTML = `<p class="eyebrow">Track your order</p><h1>No orders yet.</h1>
      <p class="lede">That can be fixed. Checkout doesn't always go through, but the studio always starts on yours.</p>
      <div class="btns"><a class="btn" href="shop.html">Shop the drop</a></div>`;
    return;
  }

  const o = orders[orders.length - 1];
  const first = (o.items[0] || 'Muffi').split(' ')[0].toLowerCase();
  const photo = PHOTOS[first] || 'muffi';
  const fmt = t => new Date(t).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' });

  root.innerHTML = `
    <p class="eyebrow">Track your order</p>
    <h1>Order ${o.id}</h1>
    <div class="track-grid">
      <div>
        <p class="lede track-items">${o.items.length} item${o.items.length === 1 ? '' : 's'}: ${o.items.join(', ')}</p>
        <div class="route"><span>Studio</span><div class="route-bar"><i></i><b class="route-bug">🐛</b></div><span>${city}</span></div>
        <p class="next-step"></p>
        <ol class="steps-list"></ol>
      </div>
      <div class="canvas track-photo"><div data-thang="${first in PHOTOS ? first : 'muffi'}" data-photo="images/${photo}.webp" data-open=".2"></div></div>
    </div>`;
  if (window.Thang) window.Thang.mount(root.querySelector('[data-thang]'));

  const list = root.querySelector('.steps-list');
  list.innerHTML = STEPS.map(([at, title, text]) => `<li><b>${title}</b><span class="when">${fmt(o.created + at * 1000 / speed)}</span><p>${text}</p></li>`).join('');

  let last = -1;
  function update() {
    const el = (Date.now() - o.created) * speed / 1000;
    let idx = 0;
    STEPS.forEach(([at], i) => { if (el >= at) idx = i; });
    list.querySelectorAll('li').forEach((li, i) => { li.classList.toggle('done', i < idx); li.classList.toggle('now', i === idx); li.classList.toggle('later', i > idx); });
    const shipped = STEPS[3][0], out = STEPS[5][0];
    const pct = Math.max(0, Math.min(1, (el - shipped) / (out - shipped)));
    root.querySelector('.route-bar i').style.width = (pct * 100) + '%';
    root.querySelector('.route-bug').style.left = (pct * 100) + '%';
    const nxt = STEPS[idx + 1];
    const ns = root.querySelector('.next-step');
    if (nxt) {
      const left = Math.max(0, Math.round((nxt[0] - el) / speed));
      const hh = Math.floor(left / 3600), mm = Math.floor(left % 3600 / 60), sc = left % 60;
      ns.innerHTML = `Next update: <b>${nxt[1]}</b> in ${hh ? hh + 'h ' : ''}${mm}m ${sc}s`;
    } else {
      ns.innerHTML = '<b>Check behind the door.</b>';
    }
    if (idx !== last) {
      last = idx;
      document.body.classList.toggle('delivered', idx >= 6);
      if (idx >= 6) {
        const host = root.querySelector('.track-photo [data-thang]');
        delete host.dataset.photo; host.dataset.mode = 'shadow'; host.dataset.open = '1'; host.dataset.track = '1';
        if (window.Thang) window.Thang.mount(host);
      }
      if (idx >= 3 && window.BTH && last > 0) window.BTH.ghostSay(idx >= 6 ? 'it\'s already inside.' : idx >= 5 ? 'DON\'T OPEN THE DOOR' : 'REFUSE THE PACKAGE');
    }
  }
  update();
  setInterval(update, 1000);
})();
