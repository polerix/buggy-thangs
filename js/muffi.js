/* Buggy-Thangs — procedural needle-felted plush renderer (SVG).
   Every Thang shares one anatomical blueprint: a shaggy moss-bud body, felt snout with
   peach lips and a side-blep, an orange tail, two knit eyestalks with sleepy glass eyes,
   textile wings, and six knit legs in felt boots.
   Each body part comes in variants. Muffi uses the "render" set (matching the studio photo);
   the rest of the line mixes and matches render parts with the original 1994 parts. */
(function () {
  'use strict';
  let uid = 0;

  /* part variants
     snout: croc (render: long felt snout, nostrils, brow crease, kiss lips) | round (original)
     eyes:  hood (render: felt hood, big blue-grey glass eyes, lashes up) | classic (original)
     wings: paddle (render: tall upright leaf paddles, stitched veins) | round (original)
     boots: tall (render: tall suede boots) | low (original lace-ups)
     tail:  thin (render: tapered rod) | curl (original)
     fur:   shaggy (render: long leaf spikes + hanging fringe) | moss (original)
     legs:  long (render: spindly, body held high) | short (original)
     Doza's render adds the "pre-chewed" set: tattered flannel wings, a frayed curl tail, chewed fur
     with torn felt wounds, yarn guts and a bone stuck in it, slobber, and one eye drooping shut.
     Bramble's render adds the "under the weather" set: patchy fur with irritated skin, sore
     teary eyes, shrivelled wings, a drooping frayed tail, and clear drips at the lips.
     Kroop's render adds: fan wings (rounded upright, veins fanning from the base), mid boots
     (ankle lace-ups), a taper tail (thick, tapered), peach eyelids, and orange pistil flecks. */
  const CHARS = {
    muffi:   { name: 'Muffi',   a: '#c43a2a', b: '#f0b62e', wing: 'mesh',    trim: '#d9a62e', boot: '#3a62a6', iris: '#6f8798', seed: 7,
               snout: 'croc',  eyes: 'hood',    wings: 'paddle', boots: 'tall', tail: 'thin', fur: 'shaggy', legs: 'long' },
    doza:    { name: 'Doza',    a: '#6a3f96', b: '#2fa39a', wing: 'flannel', trim: '#9e2a2a', boot: '#5e3d26', iris: '#7d8a8f', seed: 13,
               chewed: true, slobber: true, lipColor: '#d7788a', eyeSkew: [0, -.5], lid: '#78993a', rim: '#5d7c2c',
               snout: 'croc',  eyes: 'hood',    wings: 'tatter', boots: 'mid',  tail: 'fray', fur: 'chewed', legs: 'long' },
    kroop:   { name: 'Kroop',   a: '#1b1a19', b: '#f1eee6', wing: 'cord',    trim: '#c43c22', boot: '#a8302a', iris: '#7d919b', seed: 21,
               lid: '#f2a07c', rim: '#e8784a', pistils: .16,
               snout: 'croc',  eyes: 'hood',    wings: 'fan',    boots: 'mid',  tail: 'taper', fur: 'shaggy', legs: 'long' },
    pillo:   { name: 'Pillo',   a: '#ec8db0', b: '#97dcbe', wing: 'floral',  trim: '#7f56b8', boot: '#dcae34', iris: '#6a4f8f', seed: 33,
               snout: 'round', eyes: 'hood',    wings: 'paddle', boots: 'low',  tail: 'curl', fur: 'moss', legs: 'long' },
    gnarl:   { name: 'Gnarl',   a: '#3e6a2e', b: '#c6a06a', wing: 'burlap',  trim: '#3a2a1c', boot: '#2e2e2e', iris: '#4a5a2a', seed: 44,
               snout: 'croc',  eyes: 'classic', wings: 'round',  boots: 'tall', tail: 'thin', fur: 'shaggy', legs: 'long' },
    bramble: { name: 'Bramble', a: '#1f2b4d', b: '#e2782c', wing: 'faded',   trim: '#e08a3a', boot: '#5b6372', iris: '#6d8084', seed: 55,
               sick: true,
               snout: 'croc',  eyes: 'sore',    wings: 'shrivel', boots: 'mid', tail: 'droop', fur: 'patchy', legs: 'long' }
  };

  const GREENS = ['#6f8f35', '#86a73f', '#4d6b25', '#a1b64e', '#5c7a2e', '#bcc566', '#3f5a1f', '#7b9a3a'];
  const SPIKES = ['#7a9a36', '#93ae43', '#5d7c2c', '#a9bf55', '#6b8a31', '#4f6d26'];

  const EYE = {
    normal: { sclera: '#f3eee1', iris: null,      ir: 8.5, pr: 4.6, rim: '#e8693f', lid: '#86a744', glint: .9,  veins: false },
    wrong:  { sclera: '#f1ebdc', iris: null,      ir: 8.5, pr: 1.5, rim: '#e8693f', lid: '#86a744', glint: .9,  veins: false },
    horror: { sclera: '#eee0d0', iris: '#160806', ir: 10,  pr: 8.6, rim: '#d0573a', lid: '#6f8a3a', glint: .7,  veins: true },
    shadow: { sclera: '#5a5248', iris: '#0b0a09', ir: 9,   pr: 6,   rim: '#141210', lid: '#0e0d0c', glint: .55, veins: false }
  };

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const f = n => (+n).toFixed(1);

  function rng(seed) {
    let s = (seed * 2654435761) >>> 0 || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }

  function wingPattern(id, type, shadow) {
    if (shadow) return `<pattern id="${id}" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#0f0e0d"/></pattern>`;
    switch (type) {
      case 'mesh': return `<pattern id="${id}" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(28)"><rect width="5" height="5" fill="#4a82c4"/><path d="M0 .5h5M.5 0v5" stroke="#86b2e2" stroke-width=".9" opacity=".85"/><path d="M0 3h5M3 0v5" stroke="#2f62a3" stroke-width=".6" opacity=".7"/></pattern>`;
      case 'faded': return `<pattern id="${id}" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><rect width="7" height="7" fill="#3b4a6e"/><rect width="7" height="2.2" fill="#33405f"/><circle cx="2" cy="5" r=".9" fill="#8a96b3" opacity=".5"/><circle cx="5.5" cy="1.5" r=".6" fill="#a3adc4" opacity=".4"/></pattern>`;
      case 'denim': return `<pattern id="${id}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="6" height="6" fill="#5b7fb3"/><rect width="6" height="2" fill="#4a6c9e"/><rect y="4" width="6" height="1" fill="#8aa6cc" opacity=".6"/></pattern>`;
      case 'flannel': return `<pattern id="${id}" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(12)"><rect width="24" height="24" fill="#a8322c"/><rect width="24" height="8" y="8" fill="#2a1a18" opacity=".55"/><rect width="8" height="24" x="8" fill="#2a1a18" opacity=".55"/><rect width="24" height="1.5" y="3" fill="#e8c9a0" opacity=".5"/><rect width="1.5" height="24" x="3" fill="#e8c9a0" opacity=".5"/></pattern>`;
      case 'cord': return `<pattern id="${id}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-20)"><rect width="6" height="6" fill="#c9682c"/><rect width="2" height="6" fill="#a4501e"/><rect x="4" width="1" height="6" fill="#e39150"/></pattern>`;
      case 'floral': return `<pattern id="${id}" width="22" height="22" patternUnits="userSpaceOnUse"><rect width="22" height="22" fill="#f1c4cd"/><g fill="#fff" opacity=".8"><circle cx="4" cy="6" r="2.4"/><circle cx="8" cy="6" r="2.4"/><circle cx="6" cy="4" r="2.4"/><circle cx="6" cy="8" r="2.4"/></g><circle cx="6" cy="6" r="1.5" fill="#e3a72e"/><g fill="#8fcfb0"><circle cx="15" cy="16" r="2.2"/><circle cx="19" cy="16" r="2.2"/><circle cx="17" cy="14" r="2.2"/><circle cx="17" cy="18" r="2.2"/></g><circle cx="17" cy="16" r="1.3" fill="#7f56b8"/></pattern>`;
      default: return `<pattern id="${id}" width="5" height="5" patternUnits="userSpaceOnUse"><rect width="5" height="5" fill="#b89a6a"/><path d="M0 2.5h5M2.5 0v5" stroke="#8f7449" stroke-width="1.2"/></pattern>`;
    }
  }

  function blob(R, cx, cy, rx, ry, n, j) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const t = i / n * Math.PI * 2, k = 1 + (R() - .5) * j;
      pts.push([cx + Math.cos(t) * rx * k, cy + Math.sin(t) * ry * k]);
    }
    const last = pts[n - 1], first = pts[0];
    let d = `M${f((last[0] + first[0]) / 2)},${f((last[1] + first[1]) / 2)}`;
    for (let i = 0; i < n; i++) {
      const p = pts[i], q = pts[(i + 1) % n];
      d += `Q${f(p[0])},${f(p[1])} ${f((p[0] + q[0]) / 2)},${f((p[1] + q[1]) / 2)}`;
    }
    return d + 'Z';
  }

  function fur(R, cx, cy, rx, ry, count, shadow, pistils) {
    const pp = pistils || .045;
    let s = '';
    for (let i = 0; i < count; i++) {
      const t = R() * Math.PI * 2, u = Math.sqrt(R());
      const x = cx + Math.cos(t) * rx * u * .98, y = cy + Math.sin(t) * ry * u * .98;
      const a = t + (R() - .5) * 1.5;
      const len = u > .85 ? 8 + R() * 10 : 4 + R() * 7;
      const col = shadow ? (R() < .5 ? '#0a0909' : '#151311') : (R() < pp ? '#d9692e' : GREENS[(R() * GREENS.length) | 0]);
      s += `<path d="M${f(x)},${f(y)}l${f(Math.cos(a) * len)},${f(Math.sin(a) * len)}" stroke="${col}" stroke-width="${f(1.5 + R() * 1.7)}"/>`;
    }
    for (let i = 0; i < 18; i++) {
      const t = R() * Math.PI * 2, u = .4 + R() * .55;
      const x = cx + Math.cos(t) * rx * u, y = cy + Math.sin(t) * ry * u;
      const col = shadow ? '#121110' : (R() < .5 ? '#c7cc7a' : '#9db552');
      for (let k = 0; k < 3; k++) {
        s += `<path d="M${f(x)},${f(y)}q${f((R() - .5) * 10)},${f(-6 - R() * 5)} ${f((R() - .5) * 14)},${f(-10 - R() * 6)}" stroke="${col}" stroke-width="1.3" opacity=".85"/>`;
      }
    }
    return `<g stroke-linecap="round" fill="none">${s}</g>`;
  }

  /* long leaf-like felt spikes around the silhouette, with a hanging fringe underneath */
  function spikes(R, cx, cy, rx, ry, count, shadow, layer) {
    let s = '';
    for (let i = 0; i < count; i++) {
      const t = (i / count) * Math.PI * 2 + (R() - .5) * .25;
      const bx = cx + Math.cos(t) * rx * .9, by = cy + Math.sin(t) * ry * .88;
      const bottom = Math.sin(t) > .35;
      let a = Math.atan2(Math.sin(t) * rx, Math.cos(t) * ry) + (R() - .5) * .5;
      if (bottom) a = Math.PI / 2 + (Math.cos(t) * .5) + (R() - .5) * .35;
      const len = (bottom ? 16 : 12) + R() * (bottom ? 18 : 16) * (layer ? .7 : 1);
      const w = 4 + R() * 4;
      const nx = Math.cos(a), ny = Math.sin(a), px = -ny, py = nx;
      const tx = bx + nx * len, ty = by + ny * len;
      const bend = (R() - .5) * 8;
      const col = shadow ? (R() < .5 ? '#0b0a09' : '#141210') : SPIKES[(R() * SPIKES.length) | 0];
      s += `<path d="M${f(bx + px * w)},${f(by + py * w)}Q${f(bx + nx * len * .55 + px * (w * .4 + bend))},${f(by + ny * len * .55 + py * (w * .4 + bend))} ${f(tx)},${f(ty)}Q${f(bx + nx * len * .5 - px * (w * .3 - bend))},${f(by + ny * len * .5 - py * (w * .3 - bend))} ${f(bx - px * w)},${f(by - py * w)}Z" fill="${col}"/>`;
      if (!shadow && R() < .5) s += `<path d="M${f(bx)},${f(by)}L${f(bx + nx * len * .8)},${f(by + ny * len * .8)}" stroke="#c3cb72" stroke-width=".8" opacity=".55"/>`;
    }
    return s;
  }

  function lidMarkup(o, lid, rim, style) {
    const r = 17;
    const hood = style === 'hood';
    o = clamp(o, .04, 1);
    const lash = (x, y, a, len) => `<path d="M${f(x)},${f(y)}q${f(Math.cos(a) * len * .35 - Math.sin(a) * 2)},${f(Math.sin(a) * len * .35)} ${f(Math.cos(a) * len)},${f(Math.sin(a) * len)}" stroke="#14100c" stroke-width="${hood ? 1.1 : 1.15}" fill="none" stroke-linecap="round"/>`;
    if (o > .97) {
      let s = '';
      [-.9, -.45, 0, .45, .9].forEach(k => {
        const a = -Math.PI / 2 + k;
        s += lash(Math.cos(a) * r, Math.sin(a) * r, a, hood ? 12 : 8);
      });
      return s;
    }
    const L = -r + 2 * r * (1 - o);
    const x0 = Math.sqrt(Math.max(0, r * r - L * L));
    const large = L > 0 ? 1 : 0;
    let s = `<path d="M${f(-x0)},${f(L)}A${r},${r} 0 ${large} 1 ${f(x0)},${f(L)}Q0,${f(L + 5)} ${f(-x0)},${f(L)}Z" fill="${lid}"/>`;
    s += `<path d="M${f(-x0 * .8)},${f(L - 6)}Q0,${f(L - 3)} ${f(x0 * .8)},${f(L - 6)}" stroke="#000" stroke-opacity=".14" stroke-width="2" fill="none"/>`;
    s += `<path d="M${f(-x0)},${f(L)}Q0,${f(L + 5)} ${f(x0)},${f(L)}" fill="none" stroke="${rim}" stroke-width="${hood ? 4 : 3.4}" stroke-linecap="round"/>`;
    if (hood) {
      // render-style: long wispy lashes sweep up and out from the lid line
      [-1, -.8, -.55, -.25, .25, .55, .8, 1].forEach(k => {
        const px = k * x0 * .95, py = L + 2.5 * (1 - k * k) - .5;
        const a = -Math.PI / 2 + k * 1.05;
        s += lash(px, py, a, 9 + Math.abs(k) * 5);
      });
    } else {
      [-.8, -.4, 0, .4, .8].forEach(k => {
        const px = k * x0 * .9, py = L + 2.5 * (1 - k * k) + 1;
        const dir = k < 0 ? -1 : k > 0 ? 1 : 0;
        s += `<path d="M${f(px)},${f(py)}q${f(k * 2)},4 ${f(k * 6 + dir * 1.5)},${f(9 + (1 - Math.abs(k)) * 2)}" stroke="#14100c" stroke-width="1.15" fill="none" stroke-linecap="round"/>`;
      });
    }
    return s;
  }

  function eye(cx, cy, o, E, lx, ly, R, style, shadeId) {
    let veins = '';
    if (E.veins) {
      for (let i = 0; i < 9; i++) {
        const a = R() * Math.PI * 2, a2 = a + (R() - .5) * .6;
        veins += `<path d="M${f(Math.cos(a) * 16.5)},${f(Math.sin(a) * 16.5)}Q${f(Math.cos(a2) * 13 + (R() - .5) * 4)},${f(Math.sin(a2) * 13 + (R() - .5) * 4)} ${f(Math.cos(a2) * 9.5)},${f(Math.sin(a2) * 9.5)}" stroke="#b02a33" stroke-width=".9" fill="none" opacity=".85"/>`;
      }
    }
    const irisRing = style === 'hood' && !E.veins ? `<circle r="${E.ir}" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="1"/><circle r="${E.ir * .62}" fill="none" stroke="#fff" stroke-opacity=".12" stroke-width="2.4"/>` : '';
    return `<g class="eye" transform="translate(${f(cx)},${f(cy)})${style === 'hood' ? ' scale(1.3)' : ''}">
      <circle r="17" fill="${E.sclera}"/>${veins}
      <circle r="17" fill="url(#${shadeId})"/>
      <g class="pupil" transform="translate(${f(lx * 6)},${f(ly * 5)})"><circle r="${E.ir}" fill="${E.iris}"/>${irisRing}<circle class="pp" r="${E.pr}" fill="#0a0604"/><circle cx="-3" cy="-3.2" r="2.1" fill="#fff" opacity="${E.glint}"/><circle cx="2.6" cy="2.4" r=".9" fill="#fff" opacity="${E.glint * .6}"/></g>
      <g class="lid">${lidMarkup(o, E.lid, E.rim, style)}</g>
      <circle r="17" fill="none" stroke="${E.rim}" stroke-width="${style === 'hood' ? 5 : 4.6}"/>
    </g>`;
  }

  function orb(cx, cy, r, R, shadow, hood) {
    const g = shadow ? '#0d0c0b' : '#6f9136';
    let s = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${g}"/>`;
    if (hood) {
      // felt hood: a brow cap that overhangs the orb like a heavy eyelid
      s += `<ellipse cx="${cx + 1}" cy="${f(cy - r * .62)}" rx="${f(r * 1.12)}" ry="${f(r * .56)}" fill="${shadow ? '#0e0d0c' : '#78993a'}"/>`;
      s += `<path d="M${f(cx - r * 1.05)},${f(cy - r * .3)}Q${cx},${f(cy - r * .02)} ${f(cx + r * 1.08)},${f(cy - r * .3)}" stroke="#000" stroke-opacity="${shadow ? 0 : .18}" stroke-width="3" fill="none"/>`;
    }
    s += `<circle cx="${f(cx - r * .25)}" cy="${f(cy - r * .3)}" r="${f(r * .7)}" fill="#fff" opacity="${shadow ? 0 : .07}"/>`;
    let t = '';
    for (let i = 0; i < (hood ? 60 : 46); i++) {
      const a = R() * Math.PI * 2, rr = r - 4 + R() * 4, len = 3 + R() * 5;
      const ox = hood && Math.sin(a) < 0 ? 1.1 : 1;
      const col = shadow ? '#0a0a09' : GREENS[(R() * GREENS.length) | 0];
      t += `<path d="M${f(cx + Math.cos(a) * rr * ox)},${f(cy + Math.sin(a) * rr)}l${f(Math.cos(a + (R() - .5)) * len)},${f(Math.sin(a + (R() - .5)) * len)}" stroke="${col}" stroke-width="1.6"/>`;
    }
    return s + `<g stroke-linecap="round">${t}</g>`;
  }

  /* returns {svg, top}: top = y offset (relative to fy) where the leg should end */
  function boot(fx, fy, color, shadow, R, style) {
    const c = shadow ? '#0c0b0a' : color;
    let scuffs = '';
    if (!shadow) for (let i = 0; i < (style === 'tall' ? 6 : 3); i++) scuffs += `<circle cx="${f(-5 + R() * 20)}" cy="${f((style === 'tall' ? -26 : -2) + R() * (style === 'tall' ? 30 : 6))}" r="${f(.6 + R() * 1.1)}" fill="#fff" opacity=".2"/>`;
    if (style === 'mid') {
      return { top: -18, svg: `<g transform="translate(${f(fx)},${f(fy)})">
        <path d="M-8,-19Q0,-21 8,-19L8,-5Q19,-5 21,2L21,6L-9,6L-9,-5Z" fill="${c}" stroke="#1d1712" stroke-width="1.6" stroke-linejoin="round"/>
        <ellipse cx="0" cy="-19" rx="8" ry="2.4" fill="#000" opacity=".35"/>
        ${shadow ? '' : '<path d="M1,-16l6,3M1,-12l6,-3M1,-11l6,3M1,-7l6,-3M2,-6l6,3" stroke="#111" stroke-width="1.3" stroke-linecap="round"/><path d="M-6,-16v10" stroke="#fff" stroke-opacity=".16" stroke-width="2.5"/>'}
        <rect x="-10.5" y="5" width="33" height="3.6" rx="1.6" fill="#1a1512"/>${scuffs}
      </g>` };
    }
    if (style === 'tall') {
      return { top: -28, svg: `<g transform="translate(${f(fx)},${f(fy)})">
        <path d="M-7.5,-30Q0,-32 7.5,-30L7,-5Q18,-4 19,3L19,6L-8.5,6L-8,-5Z" fill="${c}" stroke="#1d1712" stroke-width="1.6" stroke-linejoin="round"/>
        <ellipse cx="0" cy="-30" rx="7.5" ry="2.4" fill="#000" opacity="${shadow ? .6 : .35}"/>
        ${shadow ? '' : '<path d="M-6,-24q6,2 12,0M-6.5,-12q6,2 13,0" stroke="#000" stroke-opacity=".12" stroke-width="2" fill="none"/><path d="M4,-7l5,3M4,-3l5,-3M5,-10l4,3" stroke="#e9e1cc" stroke-width="1" stroke-linecap="round"/><path d="M-5,-27v20" stroke="#fff" stroke-opacity=".14" stroke-width="2.5"/>'}
        <rect x="-9.5" y="5" width="30" height="3.4" rx="1.6" fill="#241e1a"/>${scuffs}
      </g>` };
    }
    return { top: -10, svg: `<g transform="translate(${f(fx)},${f(fy)})">
      <path d="M-7,-12L5,-12L6,-3Q17,-2 17,4L17,6L-8,6L-8,-1Z" fill="${c}" stroke="#1d1712" stroke-width="1.6" stroke-linejoin="round"/>
      <rect x="-9" y="5" width="27" height="3.6" rx="1.6" fill="#2b2420"/>
      ${shadow ? '' : '<path d="M-3,-9l6,2M-3,-6l6,2M-3,-3l6,2" stroke="#efe6d2" stroke-width="1.1"/><path d="M8,-1q4,-1 7,2" stroke="#fff" stroke-opacity=".28" stroke-width="1.5" fill="none"/>'}${scuffs}
    </g>` };
  }

  /* tall, upright leaf-paddle wing (render style) */
  function paddleWing(id, cx, cy, rx, ry, rot, trim, shadow) {
    let w = `<g transform="rotate(${rot} ${cx} ${cy})">`;
    w += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${id}w)" stroke="${trim}" stroke-width="7.5"/>`;
    w += `<ellipse cx="${cx}" cy="${cy}" rx="${rx - 6.5}" ry="${ry - 6.5}" fill="none" stroke="${shadow ? '#000' : '#5a3d10'}" stroke-width="1.3" stroke-dasharray="1.6 4.5" opacity=".6"/>`;
    const vein = shadow ? '#000' : '#1d4d8c';
    const top = cy - ry * .86, base = cy + ry * .92;
    w += `<path d="M${cx},${f(base)}Q${cx + 3},${f(cy)} ${cx},${f(top)}" stroke="${vein}" stroke-width="2.2" fill="none"/>`;
    for (let i = 1; i <= 6; i++) {
      const y = base - (base - top) * (i / 7.2);
      const sp = Math.sqrt(Math.max(0, 1 - Math.pow((y - cy) / ry, 2))) * rx * .9;
      w += `<path d="M${cx},${f(y)}Q${f(cx - sp * .45)},${f(y - 4)} ${f(cx - sp)},${f(y - 13)}" stroke="${vein}" stroke-width="1.5" fill="none" stroke-dasharray="4 1.6"/>`;
      w += `<path d="M${cx},${f(y)}Q${f(cx + sp * .45)},${f(y - 4)} ${f(cx + sp)},${f(y - 13)}" stroke="${vein}" stroke-width="1.5" fill="none" stroke-dasharray="4 1.6"/>`;
    }
    return w + '</g>';
  }

  /* chewed flannel wing: ragged bitten edge, tooth holes, loose threads (Doza render) */
  function tatterWing(id, R, cx, cy, rx, ry, rot, trim, shadow) {
    const d = blob(R, cx, cy, rx, ry, 26, .16);
    let w = `<g transform="rotate(${rot} ${cx} ${cy})">`;
    w += `<path d="${d}" fill="url(#${id}w)" stroke="${trim}" stroke-width="4" stroke-linejoin="round"/>`;
    if (!shadow) {
      // bite marks: notches out of the edge, and torn holes
      for (let i = 0; i < 4; i++) {
        const a = R() * Math.PI * 2, x = cx + Math.cos(a) * rx * .95, y = cy + Math.sin(a) * ry * .95;
        w += `<path d="M${f(x - 6)},${f(y)}q6,${f(-8 + R() * 3)} 12,0q-3,6 -6,7q-3,-1 -6,-7z" fill="#ece5d6" stroke="#e9dcc8" stroke-width="1"/>`;
      }
      for (let i = 0; i < 3; i++) {
        const x = cx + (R() - .5) * rx, y = cy + (R() - .5) * ry * 1.2;
        w += `<path d="${blob(R, x, y, 3 + R() * 4, 3 + R() * 5, 8, .5)}" fill="#2a1513" stroke="#c8b9a0" stroke-width=".8"/>`;
      }
      for (let i = 0; i < 9; i++) {
        const a = R() * Math.PI * 2, x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry;
        w += `<path d="M${f(x)},${f(y)}q${f(Math.cos(a) * 5 + (R() - .5) * 6)},${f(Math.sin(a) * 5)} ${f(Math.cos(a) * 11)},${f(Math.sin(a) * 11 + 5)}" stroke="#ead8c4" stroke-width=".9" fill="none"/>`;
      }
      w += `<path d="M${cx},${f(cy + ry * .9)}Q${cx - 2},${f(cy)} ${cx + 1},${f(cy - ry * .8)}" stroke="#4a1a17" stroke-width="1.2" stroke-dasharray="4 2" fill="none" opacity=".7"/>`;
    }
    return w + '</g>';
  }

  /* shrivelled, crumpled wing with frayed trim and loose threads (Bramble render) */
  function shrivelWing(id, R, cx, cy, rx, ry, rot, trim, shadow) {
    const d = blob(R, cx, cy, rx, ry, 22, .2);
    let w = `<g transform="rotate(${rot} ${cx} ${cy})">`;
    w += `<path d="${d}" fill="url(#${id}w)" stroke="${trim}" stroke-width="6" stroke-linejoin="round"/>`;
    w += `<path d="${d}" fill="none" stroke="${shadow ? '#000' : '#7a4a20'}" stroke-width="1.2" stroke-dasharray="1.5 5" opacity=".6" transform="translate(0 1)"/>`;
    const vein = shadow ? '#000' : '#141b30';
    const top = cy - ry * .85, base = cy + ry * .9;
    w += `<path d="M${cx},${f(base)}Q${cx - 4},${f(cy)} ${cx + 2},${f(top)}" stroke="${vein}" stroke-width="1.8" fill="none"/>`;
    for (let i = 1; i <= 5; i++) {
      const y = base - (base - top) * (i / 6.2);
      const sp = Math.sqrt(Math.max(0, 1 - Math.pow((y - cy) / ry, 2))) * rx * .85;
      w += `<path d="M${cx},${f(y)}l${f(-sp * .6)},${f(-6 - R() * 5)}l${f(-sp * .4)},${f(-2 - R() * 4)}" stroke="${vein}" stroke-width="1.2" fill="none"/>`;
      w += `<path d="M${cx},${f(y)}l${f(sp * .6)},${f(-6 - R() * 5)}l${f(sp * .4)},${f(-2 - R() * 4)}" stroke="${vein}" stroke-width="1.2" fill="none"/>`;
    }
    // crumples
    for (let i = 0; i < 4; i++) {
      const y = cy - ry * .6 + R() * ry * 1.2;
      w += `<path d="M${f(cx - rx * .7)},${f(y)}q${f(rx * .5)},${f(-4 + R() * 8)} ${f(rx * 1.4)},${f((R() - .5) * 6)}" stroke="#000" stroke-opacity=".22" stroke-width="2.4" fill="none"/>`;
    }
    // loose threads
    if (!shadow) for (let i = 0; i < 5; i++) {
      const a = R() * Math.PI * 2, x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry;
      w += `<path d="M${f(x)},${f(y)}q${f(Math.cos(a) * 6 + (R() - .5) * 6)},${f(Math.sin(a) * 6)} ${f(Math.cos(a) * 12)},${f(Math.sin(a) * 12 + 4)}" stroke="#2a2c38" stroke-width=".8" fill="none"/>`;
    }
    return w + '</g>';
  }

  /* rounded upright wing with veins fanning out from the base (Kroop render) */
  function fanWing(id, cx, cy, rx, ry, rot, trim, shadow) {
    let w = `<g transform="rotate(${rot} ${cx} ${cy})">`;
    w += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${id}w)" stroke="${trim}" stroke-width="9"/>`;
    w += `<ellipse cx="${cx}" cy="${cy}" rx="${rx - 7}" ry="${ry - 7}" fill="none" stroke="${shadow ? '#000' : '#5a1d0e'}" stroke-width="1.2" stroke-dasharray="1.6 4.5" opacity=".55"/>`;
    const vein = shadow ? '#000' : '#2a1a14';
    const bx = cx + rx * .55, by = cy + ry * .75;
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * (1.02 + i * .095);
      const ex = cx + Math.cos(a) * rx * .9, ey = cy + Math.sin(a) * ry * .9;
      w += `<path d="M${f(bx)},${f(by)}Q${f((bx + ex) / 2 + 4)},${f((by + ey) / 2 + 4)} ${f(ex)},${f(ey)}" stroke="${vein}" stroke-width="1.5" fill="none" stroke-dasharray="5 2"/>`;
    }
    // cross-stitches between veins
    for (let k = 1; k <= 2; k++) {
      w += `<ellipse cx="${f(bx)}" cy="${f(by)}" rx="${f(rx * .55 * k)}" ry="${f(ry * .5 * k)}" fill="none" stroke="${vein}" stroke-width="1" stroke-dasharray="3 3" opacity=".55" clip-path="none"/>`;
    }
    return w + '</g>';
  }

  function roundWing(id, cx, cy, rx, ry, rot, trim, shadow) {
    let w = `<g transform="rotate(${rot} ${cx} ${cy})">`;
    w += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${id}w)" stroke="${trim}" stroke-width="7"/>`;
    w += `<ellipse cx="${cx}" cy="${cy}" rx="${rx - 6}" ry="${ry - 6}" fill="none" stroke="${shadow ? '#000' : '#2a2118'}" stroke-width="1.4" stroke-dasharray="2 6" opacity=".7"/>`;
    const bx = cx + rx * .85, by = cy + ry * .15;
    [[-.95, -.55], [-.9, -.05], [-.7, .45], [-.3, -.85], [-.2, .75]].forEach(([u, v]) => {
      const ex = cx + rx * u, ey = cy + ry * v;
      w += `<path d="M${f(bx)},${f(by)}Q${f((bx + ex) / 2)},${f((by + ey) / 2 - 8)} ${f(ex)},${f(ey)}" stroke="${shadow ? '#000' : '#1e2433'}" stroke-width="2" fill="none" stroke-dasharray="5 2.5" opacity=".8"/>`;
    });
    return w + '</g>';
  }

  function build(opts) {
    opts = opts || {};
    const c = CHARS[opts.char] || CHARS.muffi;
    const mode = opts.mode || 'normal';
    const shadow = mode === 'shadow';
    const horror = mode === 'horror';
    const E = Object.assign({}, EYE[mode] || EYE.normal);
    if (!E.iris) E.iris = c.iris;
    if (c.eyes === 'hood' && !E.veins && !shadow) { E.ir = 9.6; E.lid = c.lid || '#78993a'; if (c.rim) E.rim = c.rim; }
    if (c.eyes === 'sore' && !shadow) {
      E.ir = 9.2; E.veins = true;
      if (mode !== 'horror') { E.sclera = '#f1d9d2'; E.lid = '#c98a84'; E.rim = '#c4505a'; }
    }
    if (opts.pupil === 'pin') { E.pr = 1.5; }
    if (opts.pupil === 'void') { E.pr = E.ir - .4; E.iris = '#120806'; }
    const open = opts.open == null ? .22 : +opts.open;
    const lx = +opts.lookX || 0, ly = +opts.lookY || 0;
    const id = 'bt' + (++uid);
    const R = rng(c.seed);
    const longLegs = c.legs === 'long';
    const view = opts.view || (longLegs ? '0 0 400 400' : '0 0 400 360');
    const hood = c.eyes === 'hood' || c.eyes === 'sore';

    const A = shadow ? '#0e0d0c' : c.a, B = shadow ? '#141311' : c.b;
    const outline = shadow ? '#060505' : '#2a2118';

    let s = `<svg class="thang thang-${mode}" viewBox="${view}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${c.name}, a Buggy-Thang plush" data-lid="${E.lid}" data-rim="${E.rim}" data-eyes="${c.eyes}" data-skew="${c.eyeSkew ? c.eyeSkew.join(',') : '0,0'}" data-open="${open}">`;
    s += `<defs>
      <filter id="${id}f" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="${c.seed}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="3.5" xChannelSelector="R" yChannelSelector="G"/></filter>
      <pattern id="${id}s" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="${A}"/><rect width="10" height="5" fill="${B}"/><rect width="10" height=".8" y="4.6" fill="#000" opacity=".18"/><path d="M2 0v10M5 0v10M8 0v10" stroke="#000" stroke-opacity=".08" stroke-width=".8"/></pattern>
      ${wingPattern(id + 'w', c.wing, shadow)}
      <radialGradient id="${id}g" cx=".42" cy=".32" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".42"/></radialGradient>
      <radialGradient id="${id}e" cx=".4" cy=".35" r=".7"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".28"/></radialGradient>
    </defs>`;

    s += `<ellipse cx="215" cy="${longLegs ? 363 : 324}" rx="132" ry="10" fill="#000" opacity="${shadow ? .5 : .16}"/>`;

    s += `<g filter="url(#${id}f)">`;
    // tail
    const tail = shadow ? '#0c0b0a' : '#e07a2a';
    if (c.tail === 'fray') {
      s += `<path d="M104,214C72,226 52,206 58,184C63,168 82,170 80,186" fill="none" stroke="${outline}" stroke-width="13.5" stroke-linecap="round"/>`;
      s += `<path d="M104,214C72,226 52,206 58,184C63,168 82,170 80,186" fill="none" stroke="${tail}" stroke-width="10.5" stroke-linecap="round"/>`;
      if (!shadow) {
        let fr = '';
        for (let i = 0; i < 16; i++) {
          const x = 62 + R() * 40, y = 200 + R() * 22;
          fr += `<path d="M${f(x)},${f(y)}q${f((R() - .5) * 10)},${f(8 + R() * 8)} ${f((R() - .5) * 16)},${f(16 + R() * 20)}" stroke="#d9682a" stroke-width="${f(.8 + R())}" fill="none" stroke-linecap="round"/>`;
        }
        s += fr + `<path d="M98,212C74,220 60,206 63,190" fill="none" stroke="#f3a25a" stroke-width="2" stroke-linecap="round" opacity=".6"/>`;
      }
    } else if (c.tail === 'droop') {
      s += `<path d="M110,204Q82,214 68,246Q60,268 52,292Q50,298 54,296Q66,270 80,242Q94,224 112,220Z" fill="${tail}" stroke="${outline}" stroke-width="1.8" stroke-linejoin="round"/>`;
      if (!shadow) s += `<path d="M53,294l-3,10M55,293l1,11M52,292l-6,7" stroke="#c96a2c" stroke-width="1" stroke-linecap="round"/><path d="M98,214Q78,226 66,252" stroke="#f3a25a" stroke-width="1.6" fill="none" opacity=".6"/>`;
    } else if (c.tail === 'taper') {
      s += `<path d="M108,196Q76,190 48,170Q36,162 34,172Q40,192 74,208Q92,216 108,224Z" fill="${tail}" stroke="${outline}" stroke-width="2" stroke-linejoin="round"/>`;
      if (!shadow) s += `<path d="M100,202Q72,194 46,174" stroke="#f4a45c" stroke-width="2.2" fill="none" opacity=".6"/>`;
    } else if (c.tail === 'thin') {
      s += `<path d="M106,203Q72,196 34,180Q70,205 106,219Z" fill="${tail}" stroke="${outline}" stroke-width="1.8" stroke-linejoin="round"/>`;
      if (!shadow) s += `<path d="M100,207Q72,200 44,186" stroke="#f4a45c" stroke-width="1.6" fill="none" opacity=".7"/>`;
    } else {
      s += `<path d="M104,214C70,224 50,204 57,184C62,170 80,174 78,189" fill="none" stroke="${outline}" stroke-width="13.5" stroke-linecap="round"/>`;
      s += `<path d="M104,214C70,224 50,204 57,184C62,170 80,174 78,189" fill="none" stroke="${tail}" stroke-width="10.5" stroke-linecap="round"/>`;
      if (!shadow) s += `<path d="M98,212C72,219 58,204 62,188" fill="none" stroke="#f3a25a" stroke-width="2.5" stroke-linecap="round" opacity=".7"/>`;
    }

    // wings
    const trim = shadow ? '#121110' : c.trim;
    if (c.wings === 'tatter') {
      s += tatterWing(id, R, 186, 102, 36, 68, 8, trim, shadow);
      s += tatterWing(id, R, 138, 108, 40, 70, -24, trim, shadow);
    } else if (c.wings === 'shrivel') {
      s += shrivelWing(id, R, 186, 100, 30, 64, 6, trim, shadow);
      s += shrivelWing(id, R, 140, 104, 34, 68, -22, trim, shadow);
    } else if (c.wings === 'fan') {
      s += fanWing(id, 182, 104, 46, 54, 4, trim, shadow);
      s += fanWing(id, 132, 112, 52, 58, -16, trim, shadow);
    } else if (c.wings === 'paddle') {
      s += paddleWing(id, 140, 96, 33, 66, -24, trim, shadow);
      s += paddleWing(id, 178, 88, 36, 72, -9, trim, shadow);
    } else {
      s += roundWing(id, 150, 108, 72, 44, -20, trim, shadow);
      s += roundWing(id, 126, 132, 62, 38, -38, trim, shadow);
    }

    // legs + boots
    const legs = [[128, -8, 0], [162, 6, 1], [194, -6, 0], [230, 8, 1], [262, -5, 0], [288, 7, 1]];
    legs.forEach(([x, k, back]) => {
      const fy = longLegs ? (back ? 349 : 356) : (back ? 310 : 317);
      const fx = x + k * .6 + (x < 210 ? -7 : 7);
      const b = boot(fx - 2, fy, c.boot, shadow, R, c.boots);
      const endY = fy + b.top + 2;
      const kx = x + k * (longLegs ? 4.2 : 2.6), ky = longLegs ? 292 - back * 5 : (c.boots === 'tall' ? 268 - back * 4 : 280 - back * 4);
      const d = `M${x},236Q${kx},${ky} ${f(fx - 2)},${f(endY)}`;
      s += `<path d="${d}" stroke="${outline}" stroke-width="9" fill="none" stroke-linecap="round"/>`;
      s += `<path d="${d}" stroke="url(#${id}s)" stroke-width="6.4" fill="none" stroke-linecap="round"/>`;
      if (back) s += `<path d="${d}" stroke="#000" stroke-opacity=".3" stroke-width="6.4" fill="none" stroke-linecap="round"/>`;
      s += b.svg;
    });

    // body
    const shaggy = c.fur === 'shaggy' || c.fur === 'patchy' || c.fur === 'chewed';
    const chewed = c.fur === 'chewed';
    const patchy = c.fur === 'patchy';
    if (shaggy) s += spikes(R, 205, 205, 113, 61, 54, shadow, 0);
    const bodyD = blob(R, 205, 205, 113, 61, 30, .14);
    s += `<path d="${bodyD}" fill="${shadow ? '#0b0a09' : '#4e6a2a'}"/>`;
    s += `<path d="${bodyD}" fill="url(#${id}g)"/>`;
    s += fur(R, 205, 205, 113, 61, patchy ? 210 : shaggy ? 300 : 360, shadow, c.pistils);
    if (c.pistils && !shadow) {
      // orange pistil flecks tucked into the fur
      for (let i = 0; i < 38; i++) {
        const t = R() * Math.PI * 2, u = Math.sqrt(R()) * .92;
        const x = 205 + Math.cos(t) * 113 * u, y = 205 + Math.sin(t) * 61 * u, a = R() * Math.PI * 2;
        s += `<path d="M${f(x)},${f(y)}l${f(Math.cos(a) * 5)},${f(Math.sin(a) * 5)}" stroke="#e0682a" stroke-width="2.6" stroke-linecap="round"/>`;
      }
    }
    if (shaggy && !patchy) s += spikes(R, 205, 200, 98, 50, 34, shadow, 1);
    if (chewed) {
      // torn felt where the dog got through: red wool wounds with ragged edges
      [[270, 178, 20, 14], [166, 214, 15, 11], [236, 222, 13, 9], [112, 204, 11, 8]].forEach(([x, y, rx, ry]) => {
        s += `<path d="${blob(R, x, y, rx, ry, 12, .45)}" fill="${shadow ? '#121110' : '#a8283a'}"/>`;
        if (!shadow) {
          s += `<path d="${blob(R, x + 1, y + 1, rx * .55, ry * .5, 9, .4)}" fill="#6a1220" opacity=".7"/>`;
          for (let i = 0; i < 12; i++) {
            const a = R() * Math.PI * 2;
            s += `<path d="M${f(x + Math.cos(a) * rx)},${f(y + Math.sin(a) * ry)}l${f(-Math.cos(a) * 6)},${f(-Math.sin(a) * 4)}" stroke="${GREENS[(R() * GREENS.length) | 0]}" stroke-width="2" stroke-linecap="round"/>`;
          }
        }
      });
      if (!shadow) {
        // yarn guts dangling from the belly
        const gut = (x, col, len, w) => `<path d="M${x},248q${f(-6 + R() * 12)},${f(len * .3)} ${f(-4 + R() * 8)},${f(len * .5)}q${f(-8 + R() * 16)},${f(len * .25)} ${f(-3 + R() * 6)},${f(len * .5)}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
        for (let i = 0; i < 9; i++) s += gut(214 + i * 3, i % 2 ? '#ecc93c' : '#d6ad26', 40 + R() * 22, 3.4);
        for (let i = 0; i < 6; i++) s += gut(232 + i * 3, i % 2 ? '#2f6a2c' : '#3e7a34', 52 + R() * 24, 3.6);
        // a chewed chicken bone, ankle knob and all, stuck in his side
        s += `<g transform="rotate(-24 172 182)">
          <rect x="150" y="178" width="40" height="8" rx="3.5" fill="#efe6d4" stroke="#a89880" stroke-width="1.2"/>
          <circle cx="191" cy="178" r="6" fill="#efe6d4" stroke="#a89880" stroke-width="1.2"/><circle cx="192" cy="188" r="5.5" fill="#efe6d4" stroke="#a89880" stroke-width="1.2"/>
          <rect x="182" y="179" width="10" height="6" fill="#efe6d4"/>
          <path d="M156,180l3,3M163,184l2,-3M171,180l2,3" stroke="#b0a188" stroke-width="1"/>
          <circle cx="152" cy="182" r="4.5" fill="#d7c8ae" stroke="#a89880" stroke-width="1"/>
        </g>`;
        // slobber sheen on the snout
        for (let i = 0; i < 10; i++) s += `<circle cx="${f(318 + R() * 40)}" cy="${f(200 + R() * 40)}" r="${f(.8 + R() * 1.4)}" fill="#fff" opacity=".55"/>`;
      }
    }
    if (patchy) {
      // thinning fur: irritated, flaky patches where the felt has worn through
      [[150, 196, 24, 17], [222, 184, 20, 14], [240, 222, 16, 12], [292, 196, 12, 9], [178, 230, 13, 9], [120, 214, 10, 8]].forEach(([x, y, rx, ry]) => {
        const pd = blob(R, x, y, rx, ry, 14, .35);
        s += `<path d="${pd}" fill="${shadow ? '#121110' : '#d48c95'}"/>`;
        if (!shadow) {
          s += `<path d="${blob(R, x - 2, y - 1, rx * .6, ry * .55, 10, .4)}" fill="#c06072" opacity=".55"/>`;
          for (let i = 0; i < 9; i++) s += `<circle cx="${f(x + (R() - .5) * rx * 1.5)}" cy="${f(y + (R() - .5) * ry * 1.5)}" r="${f(.8 + R() * 1.3)}" fill="#f2d2cf" opacity=".85"/>`;
          for (let i = 0; i < 14; i++) {
            const a = R() * Math.PI * 2;
            s += `<path d="M${f(x + Math.cos(a) * rx)},${f(y + Math.sin(a) * ry)}l${f(-Math.cos(a) * 5)},${f(-Math.sin(a) * 4)}" stroke="${GREENS[(R() * GREENS.length) | 0]}" stroke-width="1.8" stroke-linecap="round"/>`;
          }
        }
      });
      // stray hairs coming loose
      if (!shadow) for (let i = 0; i < 9; i++) {
        const t = R() * Math.PI * 2, x = 205 + Math.cos(t) * 108, y = 205 + Math.sin(t) * 58;
        s += `<path d="M${f(x)},${f(y)}q${f(Math.cos(t) * 10)},${f(Math.sin(t) * 6 - 4)} ${f(Math.cos(t) * 22)},${f(Math.sin(t) * 16 + 6)}" stroke="#2b2a24" stroke-width=".8" fill="none" opacity=".8"/>`;
      }
    }
    s += `<ellipse cx="205" cy="232" rx="105" ry="32" fill="#000" opacity="${shadow ? .3 : .14}"/>`;

    // snout
    const snout = shadow ? '#0d0c0b' : '#7f9d3f';
    if (c.snout === 'croc') {
      s += `<path d="M280,192Q318,178 352,192Q374,200 377,214Q380,234 360,242Q326,254 292,250Q274,236 280,192Z" fill="${snout}"/>`;
      if (!shadow) {
        s += `<path d="M290,196Q322,184 352,196" stroke="#fff" stroke-opacity=".13" stroke-width="6" fill="none" stroke-linecap="round"/>`;
        s += `<path d="M298,203Q322,192 344,205" stroke="#3e5520" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".8"/>`;
        s += `<path d="M300,232Q330,240 356,234" stroke="#3e5520" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".5"/>`;
        s += `<ellipse cx="350" cy="204" rx="2.2" ry="1.6" fill="#2d3d17"/><ellipse cx="359" cy="207" rx="2.2" ry="1.6" fill="#2d3d17"/>`;
      }
    } else {
      s += `<path d="M284,193Q330,188 348,214Q357,232 346,247Q330,263 295,253Q276,240 284,193Z" fill="${snout}"/>`;
      if (!shadow) s += `<path d="M292,200Q326,196 340,214" stroke="#fff" stroke-opacity=".12" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    }
    s += `</g>`; // end felt filter group

    // mouth
    const lip = shadow ? '#141210' : (c.lipColor || '#f0a184'), lipS = shadow ? '#0a0909' : (c.lipColor ? '#a94e62' : '#cc7458');
    const croc = c.snout === 'croc';
    const mx = croc ? 371 : 344, my = croc ? 224 : 229;
    if (horror) {
      s += `<ellipse cx="${mx}" cy="${my + 1}" rx="10" ry="13" fill="#120606"/>`;
      for (let i = 0; i < 4; i++) {
        const x = mx - 7 + i * 4;
        s += `<path d="M${x},${my - 9}l2,5.5l2,-5.5z" fill="#efe6d0"/><path d="M${x + 1},${my + 12}l2,-5l2,5z" fill="#e6dcc4"/>`;
      }
      s += `<path d="M${mx - 5},${my + 9}q-3,22 4,38q4,7 8,-2q2,-16 -3,-35z" fill="#c4475e" stroke="#8e2f42" stroke-width="1"/>`;
      s += `<ellipse cx="${mx}" cy="${my - 13}" rx="12" ry="7.5" fill="${lip}" stroke="${lipS}" stroke-width="2"/>`;
      s += `<ellipse cx="${mx}" cy="${my + 14}" rx="12" ry="7.5" fill="${lip}" stroke="${lipS}" stroke-width="2"/>`;
    } else if (croc) {
      // render: plump kiss lips at the snout tip, blep tucked under the side
      s += `<path d="M${mx - 13},${my + 13}q1,11 8,10q4,-3 1,-11z" fill="${shadow ? '#151312' : '#e2627a'}" stroke="${shadow ? '#000' : '#b3485c'}" stroke-width="1"/>`;
      s += `<ellipse cx="${mx + 3}" cy="${my - 8}" rx="13" ry="9.5" fill="${lip}" stroke="${lipS}" stroke-width="2" transform="rotate(-16 ${mx + 3} ${my - 8})"/>`;
      s += `<ellipse cx="${mx + 1}" cy="${my + 9}" rx="13.5" ry="9.5" fill="${lip}" stroke="${lipS}" stroke-width="2" transform="rotate(14 ${mx + 1} ${my + 9})"/>`;
      if (!shadow) s += `<ellipse cx="${mx + 1}" cy="${my - 12}" rx="5" ry="3" fill="#fff" opacity=".28"/>`;
      s += `<path d="M${mx - 9},${my + 1}Q${mx + 2},${my + 3} ${mx + 14},${my - 1}" stroke="${shadow ? '#000' : '#9c4a40'}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
      if (c.sick || c.slobber) {
        // tongue lolling out, and clear rubbery drips hanging from the lips
        s += `<path d="M${mx + 2},${my + 1}q14,2 16,12q-1,8 -9,6q-6,-4 -9,-14z" fill="${shadow ? '#151312' : '#c9798f'}" stroke="${shadow ? '#000' : '#9c5266'}" stroke-width="1.2"/>`;
        if (!shadow) {
          s += `<path d="M${mx - 4},${my + 16}q1,10 0,20" stroke="#e2f1f6" stroke-opacity=".8" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M${mx - 4},${my + 36}q-3.6,6 0,9q3.6,-3 0,-9z" fill="#d6ecf3" fill-opacity=".75" stroke="#fff" stroke-opacity=".9" stroke-width=".8"/>`;
          s += `<path d="M${mx + 12},${my + 18}q1,6 0,11" stroke="#e2f1f6" stroke-opacity=".75" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M${mx + 12},${my + 29}q-3,5 0,7.5q3,-2.5 0,-7.5z" fill="#d6ecf3" fill-opacity=".75" stroke="#fff" stroke-opacity=".9" stroke-width=".8"/>`;
        }
      }
    } else {
      s += `<ellipse cx="344" cy="228" rx="11.5" ry="17" fill="${lip}" stroke="${lipS}" stroke-width="2"/>`;
      if (!shadow) s += `<ellipse cx="341" cy="220" rx="4" ry="5" fill="#fff" opacity=".25"/>`;
      s += `<path d="M334,229Q344,234 355,228" stroke="${shadow ? '#000' : '#9c4a40'}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
      s += `<path d="M337,236q2,9 8,7q3,-4 -1,-8z" fill="${shadow ? '#151312' : '#e2627a'}" stroke="${shadow ? '#000' : '#b3485c'}" stroke-width="1"/>`;
    }

    // eyestalks (render: emerge from felt grommet rings)
    const stalk = d => `<path d="${d}" stroke="${outline}" stroke-width="15" fill="none" stroke-linecap="round"/><path d="${d}" stroke="url(#${id}s)" stroke-width="12" fill="none" stroke-linecap="round"/>`;
    if (hood) {
      const ring = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="10.5" ry="5.5" fill="${shadow ? '#0a0909' : '#5d7c2c'}" stroke="${shadow ? '#000' : '#3a521c'}" stroke-width="2"/><ellipse cx="${x}" cy="${y - 1}" rx="6.5" ry="3" fill="#1d150e" opacity=".7"/>`;
      s += ring(262, 170) + ring(290, 174);
    }
    s += stalk('M262,168Q250,120 238,76');
    s += stalk('M290,172Q304,118 302,66');

    // orbs + eyes
    const eyeDy = hood ? 4 : 0;
    s += `<g filter="url(#${id}f)">${orb(238, 72, hood ? 30 : 27, R, shadow, hood)}${orb(302, 62, hood ? 32 : 29, R, shadow, hood)}</g>`;
    const eyeR = rng(c.seed + 99);
    const eStyle = hood ? 'hood' : c.eyes;
    s += eye(238, 72 + eyeDy, open, E, lx, ly, eyeR, eStyle, id + 'e');
    s += eye(302, 62 + eyeDy, clamp(open + (c.eyeSkew ? c.eyeSkew[1] : 0), .04, 1), E, lx, ly, eyeR, eStyle, id + 'e');
    if (c.sick && !shadow) {
      // wet, weepy eyes: a tear track and a hanging drop under each
      [[238, 72], [302, 62]].forEach(([x, y], i) => {
        const ty = y + eyeDy + 21;
        s += `<path d="M${x + 3 - i * 6},${ty}q1,7 0,13" stroke="#dff0f5" stroke-opacity=".75" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
        s += `<path d="M${x + 3 - i * 6},${ty + 13}q-3.2,5 0,8q3.2,-3 0,-8z" fill="#d9eef4" fill-opacity=".7" stroke="#fff" stroke-opacity=".8" stroke-width=".8"/>`;
      });
    }

    return s + '</svg>';
  }

  function setOpen(svg, o) {
    if (!svg) return;
    svg.dataset.open = o;
    const lid = svg.dataset.lid, rim = svg.dataset.rim, style = svg.dataset.eyes;
    const st = style === 'sore' ? 'hood' : style;
    const sk = (svg.dataset.skew || '0,0').split(',').map(Number);
    svg.querySelectorAll('.lid').forEach((g, i) => { g.innerHTML = lidMarkup(clamp(+o + (o > .97 ? 0 : (sk[i] || 0)), .04, 1), lid, rim, st); });
  }

  function look(svg, x, y) {
    svg.querySelectorAll('.pupil').forEach(p => p.setAttribute('transform', `translate(${f(x * 6)},${f(y * 5)})`));
  }

  function toURL(opts) {
    return URL.createObjectURL(new Blob([build(opts)], { type: 'image/svg+xml' }));
  }

  function mount(el) {
    const d = el.dataset;
    if (d.photo) {
      const name = (CHARS[d.thang] || CHARS.muffi).name;
      el.innerHTML = `<img class="photo" src="${d.photo}" alt="${name}, a hand-felted Buggy-Thang plush photographed on studio canvas" decoding="async">`;
      return null;
    }
    el.innerHTML = build({
      char: d.thang, open: d.open, mode: d.mode, view: d.view, pupil: d.pupil,
      lookX: d.lookX, lookY: d.lookY
    });
    const svg = el.querySelector('svg');
    if (d.track === '1') svg.dataset.track = '1';
    return svg;
  }

  window.Thang = { build, mount, setOpen, look, toURL, CHARS, lidMarkup };
  document.querySelectorAll('[data-thang]').forEach(mount);
})();
