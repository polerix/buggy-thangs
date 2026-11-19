/* Buggy-Thangs — "Inside the studio", the brand film on the About page.
   Assembled live from eight scene clips. Which cut you see depends on how far gone the
   visit is (brand hostility, ghosts, depth, hour) and on how many times you've watched:
   every rewatch is a worse cut.
     0 Brand film:  hall (narration stops cleanly) → wide → felting → tea → lineup
     1 Slip:        same, a single frame of the factory cuts in, then the felters fray
     2 Wrong:       wide → felting → fray → they come alive
     3 The truth:   full narration over the hall → the factory → the door shuts */
(function () {
  'use strict';
  const host = document.getElementById('film');
  if (!host) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const get = (k, d) => { try { const v = localStorage.getItem('bth_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } };
  const set = (k, v) => { try { localStorage.setItem('bth_' + k, JSON.stringify(v)); } catch (e) {} };

  const SRC = {
    hall: 'video/scenes/01-hall.mp4', factory: 'video/scenes/02-factory.mp4', wide: 'video/scenes/03-wide.mp4',
    felting: 'video/scenes/04-felting.mp4', tea: 'video/scenes/05-tea.mp4', lineup: 'video/scenes/06-lineup.mp4',
    fray: 'video/scenes/07-fray.mp4', alive: 'video/scenes/08-alive.mp4'
  };
  const CUTS = [
    { scenes: [['hall', 3.72], ['wide'], ['felting'], ['tea'], ['lineup']], end: 'Made slow, on purpose.' },
    { scenes: [['hall', 3.72], ['wide'], ['felting'], ['tea'], ['lineup'], ['fray']], flashAt: 3, end: 'We\'ll reshoot this part.' },
    { scenes: [['wide'], ['felting'], ['fray'], ['alive']], end: 'They don\'t like being made.' },
    { scenes: [['hall'], ['factory']], end: 'We don\'t film the night shift.' }
  ];

  host.innerHTML = `
    <div class="film-frame">
      <video class="fv" playsinline preload="auto"></video>
      <video class="fv" playsinline preload="auto"></video>
      <img class="film-poster" src="video/poster.jpg" alt="The Buggy-Thangs studio, a sunlit old parish hall with long felting tables and a wall of wool">
      <img class="film-flash" src="video/factory-flash.jpg" alt="">
      <button class="film-play" type="button"><span>▶</span> Watch: How a Thang is made</button>
      <div class="film-card" hidden><p></p><button class="film-again btn ghost" type="button">Watch again</button></div>
    </div>
    <p class="film-cap">Inside the studio · sound on</p>`;

  const frame = host.querySelector('.film-frame');
  const vids = Array.from(host.querySelectorAll('.fv'));
  const poster = host.querySelector('.film-poster');
  const flash = host.querySelector('.film-flash');
  const playBtn = host.querySelector('.film-play');
  const card = host.querySelector('.film-card');
  const cap = host.querySelector('.film-cap');

  function level() {
    const H = window.BTH || {}, B = window.BT || {}, T = window.BT_TOD || {};
    const lv = Math.max(H.G || 0, (H.L || 0) - 1, (B.maxStage || 0) - 1, T.tod === '3am' ? 3 : 0, get('filmPlays', 0));
    return Math.max(0, Math.min(3, lv));
  }

  let cut, idx, cur, raf, stuttered;
  function load(v, sc) { v.src = SRC[sc[0]]; v.load(); }

  function play() {
    cut = CUTS[level()];
    frame.dataset.cut = CUTS.indexOf(cut);
    idx = 0; cur = 0; stuttered = false;
    card.hidden = true; poster.hidden = true; playBtn.hidden = true;
    vids.forEach(v => { v.classList.remove('on'); v.volume = 1; });
    load(vids[0], cut.scenes[0]);
    if (cut.scenes[1]) load(vids[1], cut.scenes[1]);
    start(vids[0]);
    cap.textContent = 'Inside the studio · sound on';
  }

  function start(v) {
    vids.forEach(x => x.classList.toggle('on', x === v));
    v.currentTime = 0;
    const p = v.play();
    if (p && p.catch) p.catch(() => { v.muted = true; v.play(); cap.textContent = 'Inside the studio · tap the video for sound'; });
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(watch);
  }

  function watch() {
    const v = vids[cur], sc = cut.scenes[idx];
    const stop = sc[1];
    if (stop) {
      const left = stop - v.currentTime;
      if (left < .22) v.volume = Math.max(0, left / .22);
      if (v.currentTime >= stop) { next(); return; }
    }
    // the ghosts get into the edit: once, the film skips back on itself
    const g = (window.BTH && window.BTH.G) || 0;
    if (!stuttered && g >= 1 && idx >= 1 && v.currentTime > 1 && Math.random() < .004) {
      stuttered = true;
      v.currentTime = Math.max(0, v.currentTime - .45);
      frame.classList.add('glitch');
      setTimeout(() => frame.classList.remove('glitch'), 220);
    }
    raf = requestAnimationFrame(watch);
  }

  function next() {
    cancelAnimationFrame(raf);
    const done = vids[cur];
    done.pause();
    idx++;
    if (idx >= cut.scenes.length) { finish(); return; }
    // one frame of the factory cuts into the nice film
    if (cut.flashAt === idx && !reduce) {
      flash.classList.add('on');
      setTimeout(() => flash.classList.remove('on'), 170);
    }
    cur = 1 - cur;
    const v = vids[cur];
    if (!v.src.endsWith(SRC[cut.scenes[idx][0]].split('/').pop())) load(v, cut.scenes[idx]);
    v.volume = 1;
    start(v);
    if (cut.scenes[idx + 1]) load(done, cut.scenes[idx + 1]);
  }
  vids.forEach((v, i) => v.addEventListener('ended', () => { if (i === cur && card.hidden) next(); }));

  function finish() {
    const n = CUTS.indexOf(cut);
    set('filmPlays', Math.max(get('filmPlays', 0), n + 1));
    card.querySelector('p').textContent = cut.end;
    card.classList.toggle('dark', n >= 2);
    card.hidden = false;
    if (n === 3 && window.BTH) setTimeout(() => window.BTH.ghostSay('that door doesn\'t open from the inside.'), 900);
  }

  function begin() {
    // unlock both players inside the tap, so phones allow sound on every scene
    vids.forEach(v => { v.muted = false; });
    play();
  }
  playBtn.addEventListener('click', begin);
  card.querySelector('.film-again').addEventListener('click', begin);
  frame.addEventListener('click', e => {
    if (e.target.closest('button')) return;
    const v = vids[cur];
    if (!v || card.hidden === false || playBtn.hidden === false) return;
    if (v.muted) { v.muted = false; cap.textContent = 'Inside the studio · sound on'; return; }
    if (v.paused) { v.play(); raf = requestAnimationFrame(watch); } else { v.pause(); cancelAnimationFrame(raf); }
  });
})();
