# Buggy-Thangs

A marketing site for a line of hand-felted plush art toys that gets steadily stranger as you scroll, then outright frightening.

**Muffi render:** `images/muffi.webp` is used for every Muffi before its eyes start moving; from then on the code-drawn plush takes over.

**Pages:** `index.html` (full descent), `shop.html`, `care.html`, `about.html`, `404.html`.

## How it works
- `js/muffi.js` draws every Thang procedurally as SVG (mossy felt body, knit eyestalks, sleepy glass eyes, textile wings, six legs in felt boots). Eyelids and pupils are live, so the plush can wake up and track the visitor.
- `js/creep.js` is the escalation engine. Each section carries a `data-s` stage (0 normal → 4 horror). It drives:
  - darkening vignette and grain
  - text and plush that change **while offscreen** (`data-alt`, `data-later`), so scrolling back up shows a different page
  - personalized lines from the browser: local time, time-zone city, device type, time on page, visit count
  - whispers on idling, scrolling back up, leaving the window, and returning to the tab
  - the watcher: a shadow Muffi that rises from a screen corner only while you are still, and ducks when you approach it
  - the waking: a sticky end sequence where Muffi's eyes open as you scroll
  - scroll prompts in every dark section: gentle → passive aggressive → hostile, louder each time the visitor stops
  - the takeover (`js/takeover.js`): after the waking, the page scrolls for you, accelerating with motion blur through endlessly generated, increasingly corrupted copies of the store. It never reaches the bottom. Any tap, click, key or wheel stops it, and then Muffi's face fills the screen. Reduced-motion visitors skip the forced scroll.
  - return visits remember how deep you went (localStorage)

## Privacy
Nothing leaves the browser. No analytics, no network calls besides Google Fonts. All personal details are read locally and written only into the page.

## Accessibility
`prefers-reduced-motion` disables animation and fades. There is no flashing.

## Reset
Clear site data, or run `Object.keys(localStorage).filter(k=>k.startsWith('bt_')).forEach(k=>localStorage.removeItem(k))` in the console.
