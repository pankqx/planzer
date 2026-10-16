# ∞ Planzer — your whole year on one endless line

Planzer is an animated year and month planner. Time is laid out as one continuous **sideways ribbon**: you scroll, swipe or drag through months and days forever, and December runs straight into the next January.

## Three worlds

| | **Neon poster** (dark) | **Paper cut-out** (light) |
|---|---|---|
| Look | Matte black, one electric colour per month, giant outline type | Warm card stock, washi tape, sticker buttons, hand-written numbers |
| Month art | A spinning 3D neon sculpture for each month: snowflake, heart, bloom, ice cream, sun, umbrella, rain cloud, kite, leaf, diya, star lantern, gift | A layered pop-up paper scene for each month: snow hills, blossoms, Holi fields, mango grove, summer coast, monsoon, rain garden, kites, harvest pookalam, festival diyas, star lanterns, winter night |
| Opening | The twelve sculptures circle while the sign flickers on, letter by letter, like a gas tube | Card hills spring up, the sun rises, a kite crosses the sky, and the letters drop in as coloured tiles |

There is also a third world, **Solar**: the original celestial planner. The year is a 3D orrery with a living sun, and the twelve months are planets on a 365-day astrolabe dial. Goals become moons. There are glass panels in gold and midnight, plus a constellation logo intro, a habit orbit view and drag-to-spin.

All three worlds share the same goals, plans and habits. Choose a world from the **Theme** button: the new one is revealed in a circle that grows from the button.

## How it works

- **Month:** each month opens with a poster: its name fills with colour as you complete plans, followed by a short summary, big numbers, your focus for the month and its milestones. After the poster comes one card per day, where you can add plans, tick them off, and tap habit buttons.
- **Year:** months appear as cards, and each goal is drawn as a coloured ribbon running under the months it covers. Tap a card to zoom into that month.
- **Getting around:**
  - big ◀ ▶ arrows
  - the month strip at the bottom
  - the **Today** button
  - keyboard: ← →, Shift + ← → for whole months, T for today, Y / M to switch views
- **One ＋ Add button:** add a goal (Planzer splits it into monthly steps), a plan for a day, or a daily habit.
- **Print studio:** produces an A4 PDF planner.
- **Your data:** everything is saved on your device. You can back it up to a file and open it again later.

## Run it

```bash
npm install
npm run dev
npm run build   # static site in dist/
```

## Stack

React 19 · Vite · Three.js / React Three Fiber (one shared canvas places 3D objects over the page) · hand-built SVG paper scenes · Framer Motion · GSAP · Zustand · View Transitions API

```
src/
  ribbon/   Ribbon (infinite virtualised scroller), layouts, Month/Year levels
  neon/     NeonStage (3D canvas), objects (12 procedural sculptures)
  paper/    PaperScene (12 layered cut-paper scenes)
  intro/    NeonIntro, PaperIntro
  solar/    The Solar world: orrery, astrolabe dial, ledger, month & habit views
  ui/       Chrome (top bar, scrubber, arrows), Sheets, ThemePicker, Check, Logo
```
