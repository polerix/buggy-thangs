# Buggy-Thangs

A marketing site for a line of hand-felted plush art toys that gets steadily stranger as you scroll, then outright frightening.

**Muffi render:** `images/muffi.webp` is used for every Muffi before its eyes start moving; from then on the code-drawn plush takes over.

**Pages:** `index.html` (full descent), `shop.html`, `care.html`, `about.html`, `404.html`.

## How it works
- `js/muffi.js` draws every Thang procedurally as SVG from swappable parts (snout, eyes, wings, boots, tail, fur, legs). Muffi uses the render set that matches the studio photo; the rest of the line mixes render parts with the original ones.
  It draws (mossy felt body, knit eyestalks, sleepy glass eyes, textile wings, six legs in felt boots). Eyelids and pupils are live, so the plush can wake up and track the visitor.
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

## The sale and the ghosts (`js/hostile.js`)
- **The brand** wants the order. A working cart (persists across pages) and a chat widget, Buggy-Bot. The longer the cart stays empty, the more hostile the brand gets: friendly → pushy → guilt → threatening → hostile. Prices pick up an "indecision fee", the move-in countdown speeds up and runs out, the Add to cart buttons start demanding. Adding to cart calms it for a while; then it wants more.
- **The ghosts** don't want the makers making more. They scrawl over the pitch in Eater, strike prices, smear photos, pull items out of the cart, dodge or relabel buttons, jam checkout, flicker and roll the screen, rewrite paragraphs between viewings, and punish the Back button.
- Headlines start in Fraunces and corrode letter by letter into Eater as hostility and ghost activity rise.
- Flicker safety: never more than 2 flashes in any one second; flicker, roll and tear are off with reduced motion.

## Orders and hours
- **Order tracker** (`track.html`, `js/track.js`): checkout never succeeds, but every attempt starts an order anyway. It advances in real time across visits: received → felting (2 min) → settling (10 min) → shipped (1 h) → in transit to the visitor's city (6 h) → out for delivery (20 h) → delivered, "left at: inside" (28 h) → "It's inside" (36 h). Buggy-Bot announces each new step when the visitor comes back.
- **Hours** (`js/night.js`): morning and evening copy changes; after 9 PM the ghosts are active from the start; 3–4 AM the studio is "closed" and the night shift runs the store (silhouette Thangs, "Let it in" buttons, closed prices); at 3:12 AM Muffi wakes up.

### Alternative holiday gift guide (`js/holidays.js`)
25 pagan, occult, alternative and historical celebrations (Saturnalia, Yule, Brumalia, Krampusnacht, Walpurgisnacht, Festivus, St. Tib's Day, Devil's Night, the Feast of Fools…), plus year-round lines for covens, necromancers and the Old Ones. From the visitor's date the site finds what's on now (the most specific one wins) or next, shows a gift-guide strip on the shop and above the home lineup, and feeds Buggy-Bot holiday lines at every hostility level, each with its own dark turn.

### Preview switches
- `?date=2026-12-05` on any page to see the gift guide on another day
- `?tod=morning` · `?tod=evening` · `?tod=night` · `?tod=3am` · `?tod=312` on any page
- `track.html?demo` starts an order without checking out; `track.html?fast` plays the tracker at 600× (an hour every 6 seconds)

## Inside the studio (About page film, `js/film.js`)
Eight scene clips in `video/scenes/`, cut from three source films (nice fabrication, frustrated fabrication, narration with a hard cut to the factory):

| Clip | Source | Scene |
|---|---|---|
| 01-hall | narration 0–5.1 s | Sunlit parish-hall studio; narration "Today the studio is an old parish hall outside town…" (clean stop at 3.72 s after "town,") |
| 02-factory | narration 5.1–10 s | Dark factory, worker shuts the door; narration ends "…a wall of wool." |
| 03-wide | nice 0–3 s | Two felters at the table |
| 04-felting | nice 3–6 s | Hands felting an eye |
| 05-tea | nice 6–8.8 s | Tea, placing a Thang |
| 06-lineup | nice 8.8–10 s | Proud lineup of finished Thangs |
| 07-fray | frustrated 10–13.6 s | Irritation sets in |
| 08-alive | frustrated 13.6–20 s | The Thangs come alive; one flies at the camera |

The player assembles a cut live: 0 brand film → 1 a frame of the factory slips in and they fray → 2 they come alive → 3 the narration runs into the factory. The cut depends on hostility, ghosts, depth and the hour, and each rewatch is one cut worse.

## Privacy
Nothing leaves the browser. No analytics, no network calls besides Google Fonts. All personal details are read locally and written only into the page.

## Accessibility
`prefers-reduced-motion` disables animation and fades. There is no flashing.

## Reset
Clear site data, or run `[localStorage, sessionStorage].forEach(st => Object.keys(st).filter(k => k.startsWith('bt')).forEach(k => st.removeItem(k)))` in the console.
