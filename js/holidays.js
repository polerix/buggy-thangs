/* Buggy-Thangs — the alternative holiday gift guide.
   Works out which suspiciously ancient (or suspiciously recent) celebration is on now,
   or coming next, from the visitor's own date. The brand sells to it; the darker the
   brand gets, the darker the holiday gets.
   Preview a date with ?date=2026-12-05 on any page. */
(function () {
  'use strict';
  const q = new URLSearchParams(location.search);
  const forced = q.get('date');
  const today = forced && /^\d{4}-\d{2}-\d{2}$/.test(forced) ? new Date(forced + 'T12:00:00') : new Date();
  today.setHours(12, 0, 0, 0);

  // m is 1-based; len is how many days it runs. gift = the brand's line; dark = what it becomes.
  const H = [
    { n: 'Discordian New Year', m: 1, d: 1, len: 1, gift: 'Kicks off the Discordian New Year with appropriate chaos.', dark: 'Chaos 1. Everything after this is their idea.' },
    { n: 'the Kalends of January', m: 1, d: 1, len: 3, gift: 'A fine Kalends gift. The Romans exchanged presents too.', dark: 'New year. Same Thang. It isn\'t going anywhere.' },
    { n: 'Twelfth Night', m: 1, d: 5, len: 1, gift: 'The perfect Twelfth Night surprise.', dark: 'Twelfth Night: the night everything turns upside down. Look up.' },
    { n: 'Perchtennacht', m: 1, d: 5, len: 1, gift: 'Perchta checks whether the house is tidy. Put a Thang on the shelf.', dark: 'Perchta visits houses that were lazy this year. She\'s seen your cart.' },
    { n: 'Mungday', m: 1, d: 5, len: 1, gift: 'Celebrate Mungday with a little navel-gazing and a lot of felt.', dark: 'Hail Eris. She ordered six.' },
    { n: 'Old Christmas', m: 1, d: 7, len: 1, gift: 'Missed the first Christmas? Old Christmas is right there.', dark: 'Some houses do Christmas twice. The Thangs come both times.' },
    { n: 'Imbolc', m: 2, d: 1, len: 2, gift: 'A thoughtful token for Imbolc.', dark: 'Brigid\'s crosses keep things out. You don\'t have one.' },
    { n: 'St. Tib\'s Day', m: 2, d: 29, len: 1, leap: true, gift: 'St. Tib\'s Day only comes every four years. So should your order. Order now.', dark: 'A day that isn\'t really there. Neither is the door, tonight.' },
    { n: 'the Equinox of the Gods', m: 3, d: 20, len: 1, gift: 'Ring in the Thelemic New Year with a little hand-felted will.', dark: 'Do what thou wilt. It already has.' },
    { n: 'Walpurgisnacht', m: 4, d: 30, len: 1, gift: 'An ideal offering for Walpurgisnacht.', dark: 'Hexennacht. The witches are already shopping. They went for the eyes.' },
    { n: 'Beltane', m: 5, d: 1, len: 1, gift: 'Brighten up Beltane.', dark: 'Fires on every hill tonight. Don\'t stand too close to the studio.' },
    { n: 'Lughnasadh', m: 8, d: 1, len: 1, gift: 'A harvest-festival treat for Lughnasadh.', dark: 'Harvest time. The studio is harvesting too.' },
    { n: 'Samhain', m: 10, d: 31, len: 2, gift: 'Makes a great Samhain present.', dark: 'The veil is thin tonight. So is your excuse.' },
    { n: 'Brumalia', m: 11, d: 24, len: 24, gift: 'Brumalia runs for twenty-four days. That\'s twenty-four Thangs.', dark: 'The shortest days are coming. Plenty of dark to deliver in.' },
    { n: 'Krampusnacht', m: 12, d: 5, len: 1, gift: 'The ultimate Krampusnacht stocking-stuffer.', dark: 'Krampus keeps a list. So do we. You\'re on both.' },
    { n: 'Monkey Day', m: 12, d: 14, len: 1, gift: 'Nothing says Monkey Day like a six-legged bug.', dark: 'Happy Monkey Day. Press the button, monkey.' },
    { n: 'Saturnalia', m: 12, d: 17, len: 7, gift: 'Makes a great Saturnalia present.', dark: 'At Saturnalia the masters serve the servants. The Thangs know what day it is.' },
    { n: 'the Winter Solstice', m: 12, d: 21, len: 1, gift: 'A thoughtful token for the Winter Solstice.', dark: 'The longest night of the year. It has all night.' },
    { n: 'Yule', m: 12, d: 21, len: 12, gift: 'Perfect for Yule gift-giving.', dark: 'Yule lasts twelve nights. It only needs one.' },
    { n: 'Festivus', m: 12, d: 23, len: 1, gift: 'Guaranteed to delight at Festivus.', dark: 'Airing of grievances: you still haven\'t added anything to your cart.' },
    { n: 'HumanLight', m: 12, d: 23, len: 1, gift: 'A secular, humanist, extremely fuzzy HumanLight gift.', dark: 'Leave a light on for HumanLight. It works better in the dark.' },
    { n: 'the Birthday of the Unconquered Sun', m: 12, d: 25, len: 1, gift: 'Celebrate Dies Natalis Solis Invicti in style.', dark: 'The sun was unconquered. You won\'t be.' },
    { n: 'Wren Day', m: 12, d: 26, len: 1, gift: 'A Wren Day gift that won\'t fly away.', dark: 'On Wren Day they hunted the wren door to door. Guess who\'s doing the hunting now.' }
  ];

  const DAY = 86400000;
  const isLeap = y => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  function nextStart(h) {
    for (let y = today.getFullYear() - 1; y < today.getFullYear() + 9; y++) {
      if (h.leap && !isLeap(y)) continue;
      const s = new Date(y, h.m - 1, h.d, 12), e = new Date(s.getTime() + (h.len - 1) * DAY);
      if (e >= today) return { s, e };
    }
    return null;
  }
  const all = H.map(h => Object.assign({}, h, nextStart(h))).filter(h => h.s).sort((a, b) => a.s - b.s);
  const on = all.filter(h => h.s <= today && h.e >= today);
  const upcoming = all.filter(h => h.s > today);
  const daysTo = h => Math.round((h.s - today) / DAY);
  const cap = t => t.charAt(0).toUpperCase() + t.slice(1);

  // the most specific celebration wins (Krampusnacht beats the month of Brumalia); ties change from visit to visit
  const shortest = on.length ? Math.min(...on.map(h => h.len)) : 0;
  const tied = on.filter(h => h.len === shortest);
  const now = tied.length ? tied[(Math.random() * tied.length) | 0] : null;
  const next = upcoming[0];
  const soon = upcoming.slice(0, 5).map(h => h.n.replace(/^the /, ''));
  const combo = 'Suitable for ' + soon.slice(0, 4).join(', ') + ', and other suspiciously ancient celebrations.';

  function lines() {
    const L = [[], [], [], [], []];
    if (now) {
      L[0].push(`Happy ${now.n.replace(/^the /, '')}! 🐛 ${now.gift}`);
      L[1].push(`It's ${now.n} and you're still browsing.`);
      L[2].push(`Everyone gets a gift for ${now.n.replace(/^the /, '')}. Everyone.`);
      L[3].push(now.dark);
      L[4].push(`HAPPY ${now.n.replace(/^the /, '').toUpperCase()}. LOOK BEHIND YOU.`);
    }
    if (next) {
      const n = daysTo(next), when = n === 1 ? 'tomorrow' : `in ${n} days`;
      L[0].push(`${next.gift} ${cap(next.n)} is ${when}. 🐛`, combo);
      L[1].push(`${cap(next.n)} is ${when}. Shipping takes a day and a half. Do the math.`);
      L[2].push(`Everyone gets a gift for ${next.n.replace(/^the /, '')}. Everyone.`);
      L[3].push(next.dark);
      L[4].push(`${next.n.replace(/^the /, '').toUpperCase()} IS ${when.toUpperCase()}. IT'S ALREADY WRAPPED.`);
    }
    return L;
  }

  window.BT_HOLIDAYS = { now, next, soon, combo, lines, daysTo };

  /* the gift guide strip, on the shop page and above the home lineup */
  function strip() {
    const el = document.createElement('div');
    el.className = 'gift-guide';
    const head = now ? `Happy ${now.n.replace(/^the /, '')}.` : next ? `${cap(next.n)} is ${daysTo(next) === 1 ? 'tomorrow' : 'in ' + daysTo(next) + ' days'}.` : '';
    el.innerHTML = `<b>The alternative holiday gift guide</b><span>${head} ${(now || next || {}).gift || ''}</span><small>${combo}</small>`;
    return el;
  }
  const shopLede = document.querySelector('body[data-page="shop"] .page-hero .lede');
  if (shopLede) shopLede.after(strip());
  const lineupGrid = document.querySelector('#lineup .grid');
  if (lineupGrid) lineupGrid.before(strip());
})();
