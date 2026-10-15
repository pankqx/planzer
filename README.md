# ✦ Planzer — your year, charted among the stars

Planzer is a celestial year and month planner. Your year is a 3D **orrery**: the sun is the year, and each of the twelve months is a world on its own orbit. Your goals become moons that circle the months they live in. Planzer splits each goal into a monthly path for you, and it keeps your daily habits in orbit too.

## The experience

- **Opening ritual.** A seed of light appears and a spiral of 3,200 particles converges into the Planzer astrolabe. Gold hairlines draw the mark, then a glint sweeps across it. The name rises out of blur. When you choose *Enter*, the constellation bursts into the sky and the orrery ignites.
- **Year: the orrery.** A shader-lit sun sits at the center, with 12 banded planets in seasonal palettes. A 365-tick astrolabe dial marks today with a light-bead hand, and a flowing path traces the year. Drag to spin the heavens and touch a world to fly into its month. The *Ledger of Intentions* lists every goal with its progress and its 12-month path, and focusing a goal lights up its months in 3D.
- **Goal composer.** Pick a category and the months the goal spans, then list some steps. Planzer previews the monthly path live before you place the goal in the sky.
- **Month.** The camera flies to that month's planet. The month view includes:
  - a written briefing of the month's plan
  - stats for completion, plans, milestones, habit rhythm and days remaining
  - a luminous calendar with a day sheet for scheduling timed plans, and drag-to-reschedule
  - a milestone checklist for each goal
  - a reflection journal
- **Habits.** Each habit is a ring and each day of the month is a bead on it. You also get streaks, best runs, and a center that reports how many habits you kept today.
- **Print studio.** It produces a cover, a year at a glance, an intentions page, and a full page for each month with a calendar, milestones, a habit tracker and note lines. It comes in Ivory or Midnight. Click **Print / Save PDF** to get an A4 planner, which works for paper, GoodNotes or a digital-product download.
- **Details:**
  - a custom cursor and magnetic buttons
  - film grain and bloom
  - adaptive resolution on slower GPUs
  - support for reduced motion
  - keyboard controls: `Enter` to begin, `Esc` to return to the year, `←` / `→` to move between months

## Data

Everything is saved locally in your browser, so it works offline with no login. The ⋮ menu lets you export or import a JSON backup, load a sample year, or clear a year. The store (`src/store.js`) is a single Zustand slice, ready to have cloud sync added later.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in dist/ (relative paths, works on GitHub Pages)
```

## Stack

React 19 · Vite · Three.js with React Three Fiber, drei and postprocessing · custom GLSL shaders (simplex/fbm noise) · GSAP · Framer Motion · Zustand

```
src/
  three/   Cosmos (camera director), Sky (stars, nebula, meteors), LogoMark, Orrery
  views/   YearView, MonthView, HabitsView, PrintView
  ui/      Intro, Chrome (header, dock, menu), GoalModal, Cursor, Magnetic, Mark, bits
```
