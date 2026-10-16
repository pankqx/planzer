import { useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useStore } from '../store'
import { MONTHS, dateKey, todayParts } from '../lib/date'
import { LOOP } from '../ui/Logo'
import { absOf } from '../lib/theme'
import './landing.css'

const ease = [0.22, 1, 0.36, 1]
const SPECTRUM = ['#7aa7d9', '#e58fb0', '#9fd16b', '#f2c94c', '#f5a04a', '#3fbfa0', '#5b86e5', '#ef6c57', '#a47be0', '#f0a030', '#d66bd6', '#8fd3f0']

/** Enter the planner, optionally in a chosen world, with a circle reveal from the click. */
function useEnter() {
  const setPhase = useStore((s) => s.setPhase)
  const setTheme = useStore((s) => s.setTheme)
  return (theme, e, after) => {
    const go = () => {
      if (theme) setTheme(theme)
      setPhase('app')
      after?.()
    }
    const x = e?.clientX ?? innerWidth / 2
    const y = e?.clientY ?? innerHeight / 2
    if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return go()
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
    const vt = document.startViewTransition(() => flushSync(go))
    vt.ready.then(() =>
      document.documentElement.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] }, { duration: 1000, easing: 'cubic-bezier(.7,0,.2,1)', pseudoElement: '::view-transition-new(root)' }),
    )
  }
}

export default function Landing() {
  const enter = useEnter()
  const theme = useStore((s) => s.theme)
  const root = useRef()
  useEffect(() => {
    const k = (e) => e.key === 'Enter' && !/INPUT|TEXTAREA/.test(document.activeElement?.tagName) && enter(null)
    addEventListener('keydown', k)
    return () => removeEventListener('keydown', k)
  })
  return (
    <div className="lp" ref={root}>
      <nav className="lp-nav">
        <a className="lp-logo" href="#top" aria-label="Planzer">
          <svg viewBox="0 0 100 60" width="44" height="26" aria-hidden>
            <path d={LOOP} />
            <circle r="5.5">
              <animateMotion dur="3.6s" repeatCount="indefinite" path={LOOP} />
            </circle>
          </svg>
          planzer
        </a>
        <div className="lp-links">
          <a href="#worlds">Worlds</a>
          <a href="#features">Features</a>
        </div>
        <button className="lp-cta small" onClick={(e) => enter(null, e)}>
          Open planner <span>→</span>
        </button>
      </nav>

      <Hero onEnter={enter} />
      <Marquee />
      <Worlds onEnter={enter} current={theme} scroller={root} />
      <Features />
      <Finale onEnter={enter} />
    </div>
  )
}

/* —————————————————————————— HERO —————————————————————————— */
function Hero({ onEnter }) {
  const t = todayParts()
  return (
    <header className="lp-hero" id="top">
      <div className="lp-hero-copy">
        <motion.div className="lp-kicker" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.8, ease }}>
          <i /> A planner for people who like their days to look good
        </motion.div>
        <h1 className="lp-h1" aria-label="Your whole year, on one endless line.">
          {[['Your', 'whole', 'year,'], ['on', 'one'], ['endless', 'line.']].map((line, li) => (
            <span className="lp-line" key={li}>
              {line.map((w, wi) => (
                <span className="lp-mask" key={wi}>
                  <motion.span className={`lp-word ${w === 'endless' ? 'em' : ''}`} initial={{ y: '110%', rotate: 6 }} animate={{ y: '0%', rotate: 0 }} transition={{ duration: 1.1, ease, delay: 0.25 + li * 0.14 + wi * 0.06 }}>
                    {w === 'endless' ? (
                      <>
                        endless
                        <svg className="lp-loop" viewBox="0 0 100 60" aria-hidden>
                          <motion.path d={LOOP} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.2, delay: 1.2, ease: 'easeInOut' }} />
                        </svg>
                      </>
                    ) : (
                      w
                    )}
                  </motion.span>
                </span>
              ))}
            </span>
          ))}
        </h1>
        <motion.p className="lp-sub" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0, duration: 0.9, ease }}>
          Goals that break themselves into monthly steps. Todoist-style tasks, reminders that ring, a notebook for every day — and four beautiful worlds to plan in.
        </motion.p>
        <motion.div className="lp-actions" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.15, duration: 0.9, ease }}>
          <button className="lp-cta" onClick={(e) => onEnter(null, e)}>
            Start planning <span>→</span>
          </button>
          <a className="lp-ghost" href="#worlds">
            Choose a world ↓
          </a>
        </motion.div>
        <Countdown />
      </div>
      <motion.div className="lp-hero-art" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5, duration: 1.4, ease }}>
        <YearField year={t.y} onPick={(key, e) => onEnter(null, e, () => {
          const [y, m, d] = key.split('-').map(Number)
          useStore.getState().goTo('month', absOf(y, m - 1), d)
          setTimeout(() => useStore.getState().openDay(key), 900)
        })} />
      </motion.div>
    </header>
  )
}

/** Every day of the year as a tile. Tiles swell toward the cursor; tap one to open that day. */
function YearField({ year, onPick }) {
  const tasks = useStore((s) => s.tasks)
  const noteIndex = useStore((s) => s.noteIndex)
  const t = todayParts()
  const grid = useRef()
  const [hover, setHover] = useState(null)
  const days = useMemo(() => {
    const out = []
    const start = new Date(year, 0, 1)
    const lead = (start.getDay() + 6) % 7
    for (let i = 0; i < lead; i++) out.push(null)
    const busy = {}
    for (const x of tasks) if (x.date?.startsWith(String(year))) busy[x.date] = (busy[x.date] || 0) + 1
    for (let dt = new Date(start); dt.getFullYear() === year; dt.setDate(dt.getDate() + 1)) {
      const key = dateKey(year, dt.getMonth(), dt.getDate())
      out.push({ key, m: dt.getMonth(), d: dt.getDate(), busy: busy[key] || 0, note: !!noteIndex[key], past: key < t.key, today: key === t.key })
    }
    return out
  }, [year, tasks, noteIndex, t.key])

  useEffect(() => {
    const el = grid.current
    if (!el || matchMedia('(hover: none)').matches) return
    let raf = 0
    let mx = -9999
    let my = -9999
    const cells = [...el.querySelectorAll('.yf-c')]
    let rects = cells.map((c) => c.getBoundingClientRect())
    const measure = () => (rects = cells.map((c) => c.getBoundingClientRect()))
    const paint = () => {
      raf = 0
      cells.forEach((c, i) => {
        const r = rects[i]
        const dx = r.left + r.width / 2 - mx
        const dy = r.top + r.height / 2 - my
        const k = Math.max(0, 1 - Math.hypot(dx, dy) / 140)
        c.style.setProperty('--k', k.toFixed(3))
      })
    }
    const move = (e) => {
      mx = e.clientX
      my = e.clientY
      if (!raf) raf = requestAnimationFrame(paint)
    }
    const leave = () => {
      mx = my = -9999
      if (!raf) raf = requestAnimationFrame(paint)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    addEventListener('resize', measure)
    addEventListener('scroll', measure, true)
    return () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
      removeEventListener('resize', measure)
      removeEventListener('scroll', measure, true)
    }
  }, [days])

  const elapsed = days.filter((d) => d && d.past).length
  const total = days.filter(Boolean).length
  return (
    <div className="yf">
      <div className="yf-head">
        <b>{year}</b>
        <span>
          {elapsed} of {total} days lived · tap any day to open it
        </span>
      </div>
      <div className="yf-months" aria-hidden>
        {MONTHS.map((m, i) => {
          const lead = (new Date(year, 0, 1).getDay() + 6) % 7
          const doy = Math.round((new Date(year, i, 1) - new Date(year, 0, 1)) / 864e5)
          return (
            <span key={m} style={{ gridColumn: Math.floor((lead + doy) / 7) + 1 }}>
              {m.slice(0, 3)}
            </span>
          )
        })}
      </div>
      <div className="yf-grid" ref={grid} role="grid" aria-label={`Days of ${year}`}>
        {days.map((d, i) =>
          d ? (
            <button
              key={d.key}
              className={`yf-c ${d.past ? 'past' : ''} ${d.today ? 'today' : ''} ${d.busy ? 'busy' : ''} ${d.note ? 'note' : ''}`}
              style={{ '--c': SPECTRUM[d.m], '--i': i, '--b': Math.min(d.busy, 4) / 4 }}
              onClick={(e) => onPick(d.key, e)}
              onPointerEnter={() => setHover(d)}
              aria-label={`${d.d} ${MONTHS[d.m]}${d.busy ? `, ${d.busy} plans` : ''}`}
            />
          ) : (
            <i key={`e${i}`} />
          ),
        )}
      </div>
      <div className="yf-foot">
        {hover ? (
          <span>
            <b>
              {hover.d} {MONTHS[hover.m]}
            </b>{' '}
            {hover.today ? '— today' : ''} {hover.busy ? `· ${hover.busy} plan${hover.busy > 1 ? 's' : ''}` : '· free'} {hover.note ? '· has notes' : ''}
          </span>
        ) : (
          <span>
            <i className="lg past" /> lived <i className="lg busy" /> planned <i className="lg today" /> today
          </span>
        )}
      </div>
    </div>
  )
}

function Countdown() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(iv)
  }, [])
  const end = new Date(now.getFullYear() + 1, 0, 1)
  const s = Math.max(0, Math.floor((end - now) / 1000))
  const parts = [
    [Math.floor(s / 86400), 'days'],
    [Math.floor((s % 86400) / 3600), 'hrs'],
    [Math.floor((s % 3600) / 60), 'min'],
    [s % 60, 'sec'],
  ]
  return (
    <motion.div className="lp-count" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4, duration: 1 }}>
      <span className="lp-count-l">Left in {now.getFullYear()}</span>
      {parts.map(([v, l]) => (
        <span key={l} className="lp-count-c">
          <b>{String(v).padStart(2, '0')}</b>
          <small>{l}</small>
        </span>
      ))}
    </motion.div>
  )
}

/* —————————————————————————— MARQUEE —————————————————————————— */
function Marquee() {
  const words = ['Goals', 'Monthly steps', 'Tasks', 'Reminders', 'Day notebook', 'Photos', 'Checklists', 'Habits', 'Streaks', 'Print to PDF']
  const row = (
    <span className="mq-row">
      {words.map((w, i) => (
        <span key={w} className={i % 2 ? 'o' : ''}>
          {w} <i>✦</i>
        </span>
      ))}
    </span>
  )
  return (
    <div className="mq" aria-hidden>
      <div className="mq-track">
        {row}
        {row}
      </div>
    </div>
  )
}

/* —————————————————————————— WORLDS —————————————————————————— */
const WORLDS = [
  { id: 'neon', name: 'Neon', line: 'Matte black, one electric colour a month, 3D objects that spin as you scroll.', tag: 'Dark' },
  { id: 'paper', name: 'Paper', line: 'Cut-paper hills and skies that pop up in layers. Washi tape, hand-written days.', tag: 'Light' },
  { id: 'solar', name: 'Solar', line: 'Your year as a solar system — twelve planet-months orbiting a living sun.', tag: '3D space' },
  { id: 'minimal', name: 'Minimal', line: 'White boards, quiet type and your own photos. Nothing but your plans.', tag: 'Calm' },
]

function Worlds({ onEnter, current }) {
  return (
    <section className="lp-worlds" id="worlds">
      <div className="lp-sec-head">
        <span className="lp-num">01</span>
        <h2>
          Four worlds.
          <br />
          <em>Same plans.</em>
        </h2>
        <p>Switch any time — your goals, tasks, notes and habits come with you.</p>
      </div>
      <div className="w-row">
        {WORLDS.map((w, i) => (
          <WorldCard key={w.id} w={w} i={i} current={current === w.id} onEnter={onEnter} />
        ))}
      </div>
    </section>
  )
}

function WorldCard({ w, i, current, onEnter }) {
  const ref = useRef()
  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    ref.current.style.setProperty('--rx', `${(-y * 10).toFixed(2)}deg`)
    ref.current.style.setProperty('--ry', `${(x * 12).toFixed(2)}deg`)
    ref.current.style.setProperty('--mx', `${((x + 0.5) * 100).toFixed(1)}%`)
    ref.current.style.setProperty('--my', `${((y + 0.5) * 100).toFixed(1)}%`)
  }
  const reset = () => {
    ref.current.style.setProperty('--rx', '0deg')
    ref.current.style.setProperty('--ry', '0deg')
  }
  return (
    <motion.button
      ref={ref}
      className={`w-card w-${w.id}`}
      onPointerMove={onMove}
      onPointerLeave={reset}
      onClick={(e) => onEnter(w.id, e)}
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.9, ease, delay: i * 0.08 }}
    >
      <div className="w-prev" aria-hidden>
        <WorldPreview id={w.id} />
      </div>
      <div className="w-info">
        <span className="w-tag">
          {w.tag}
          {current && ' · current'}
        </span>
        <b>{w.name}</b>
        <p>{w.line}</p>
        <span className="w-go">Enter {w.name} →</span>
      </div>
    </motion.button>
  )
}

function WorldPreview({ id }) {
  if (id === 'neon')
    return (
      <div className="pv-neon">
        <div className="pn-word">OCTOBER</div>
        <div className="pn-cube">
          {['f', 'b', 'l', 'r', 't', 'u'].map((s) => (
            <i key={s} className={s} />
          ))}
        </div>
        <div className="pn-days">
          {[14, 15, 16, 17].map((d) => (
            <span key={d} className={d === 16 ? 'on' : ''}>
              {d}
            </span>
          ))}
        </div>
      </div>
    )
  if (id === 'paper')
    return (
      <div className="pv-paper">
        <i className="pp-sun" />
        <i className="pp-h h1" />
        <i className="pp-h h2" />
        <i className="pp-h h3" />
        <i className="pp-kite" />
        <span className="pp-tile">16</span>
      </div>
    )
  if (id === 'solar')
    return (
      <div className="pv-solar">
        <i className="ps-sun" />
        {[1, 2, 3, 4].map((r) => (
          <i key={r} className={`ps-orbit o${r}`}>
            <b />
          </i>
        ))}
      </div>
    )
  return (
    <div className="pv-min">
      <div className="pm-card big">
        <em>Oct</em>
        <span />
        <span className="s" />
      </div>
      <div className="pm-card">
        <b>16</b>
        <span />
        <span className="s" />
      </div>
      <div className="pm-card photo" />
    </div>
  )
}

/* —————————————————————————— FEATURES (bento) —————————————————————————— */
function Features() {
  return (
    <section className="lp-feat" id="features">
      <div className="lp-sec-head">
        <span className="lp-num">02</span>
        <h2>
          Everything a planner,
          <br />
          <em>a to-do app and a notebook</em> should do.
        </h2>
      </div>
      <div className="bento">
        <Bento className="b-quick" title="Type it like you'd say it" text="“Gym every monday 7am p1 @health !30” becomes a weekly task with a priority, a label and a reminder.">
          <QuickDemo />
        </Bento>
        <Bento className="b-note" title="A notebook for every day" text="Tap a day to write. Headings, checklists, sub-lists, links and photos.">
          <NoteDemo />
        </Bento>
        <Bento className="b-rem" title="Reminders that ring" text="A soft chime and a pop-up, even in another tab. Snooze or tick it off right there.">
          <RemDemo />
        </Bento>
        <Bento className="b-goal" title="Goals → monthly steps" text="Name a goal, pick its months. Planzer lays the path out for you.">
          <GoalDemo />
        </Bento>
        <Bento className="b-habit" title="Habits & streaks" text="Tap a dot each day. Watch the chain grow.">
          <HabitDemo />
        </Bento>
        <Bento className="b-print" title="Print it" text="An A4 planner of your year — cover, months, habit trackers.">
          <PrintDemo />
        </Bento>
      </div>
    </section>
  )
}

function Bento({ className, title, text, children }) {
  return (
    <motion.article className={`bento-c ${className}`} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.8, ease }}>
      <div className="bento-demo">{children}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </motion.article>
  )
}

function QuickDemo() {
  const phrase = 'Gym every monday 7am p1 @health !30'
  const [n, setN] = useState(0)
  useEffect(() => {
    const iv = setInterval(() => setN((x) => (x >= phrase.length + 26 ? 0 : x + 1)), 85)
    return () => clearInterval(iv)
  }, [])
  const typed = phrase.slice(0, n)
  const has = (s) => typed.includes(s)
  return (
    <div className="qd">
      <div className="qd-in">
        <span className="qd-plus">＋</span>
        <span>
          {typed}
          <i className="qd-caret" />
        </span>
      </div>
      <div className="qd-chips">
        {has('every monday') && <span className="c recur">↻ Every Monday</span>}
        {has('7am') && <span className="c time">◷ 7:00am</span>}
        {has('p1') && <span className="c prio">⚑ Urgent</span>}
        {has('@health') && <span className="c label">@health</span>}
        {has('!30') && <span className="c rem">🔔 30 min before</span>}
      </div>
    </div>
  )
}

function NoteDemo() {
  return (
    <div className="nd">
      <b>Sunday plan</b>
      <ul>
        <li className="on">Long run by the beach</li>
        <li className="on">Call grandma</li>
        <li>
          Groceries
          <ul>
            <li className="on">Mangoes</li>
            <li>Coffee</li>
          </ul>
        </li>
      </ul>
      <div className="nd-photo" />
    </div>
  )
}

function RemDemo() {
  return (
    <div className="rd">
      <div className="rd-toast">
        <span className="rd-bell">🔔</span>
        <span>
          <small>Reminder</small>
          <b>Pay electricity bill</b>
        </span>
      </div>
      <div className="rd-btns">
        <span>Done</span>
        <span>Snooze 10 min</span>
      </div>
    </div>
  )
}

function GoalDemo() {
  return (
    <div className="gd">
      <b>Run a half marathon</b>
      {['5k without stopping', '10k race', 'Long run 15k', 'Race day'].map((s, i) => (
        <div key={s} className="gd-row" style={{ '--i': i }}>
          <span>{['Feb', 'Apr', 'Jun', 'Sep'][i]}</span>
          <i />
          {s}
        </div>
      ))}
    </div>
  )
}

function HabitDemo() {
  return (
    <div className="hd">
      {['Read', 'Walk', 'Water'].map((h, r) => (
        <div key={h} className="hd-row">
          <span>{h}</span>
          {Array.from({ length: 14 }, (_, i) => (
            <i key={i} className={(i * 7 + r * 3) % 5 !== 0 ? 'on' : ''} style={{ '--i': i, '--c': ['#ef6c57', '#3fbfa0', '#5b86e5'][r] }} />
          ))}
        </div>
      ))}
    </div>
  )
}

function PrintDemo() {
  return (
    <div className="pd">
      <i className="p3" />
      <i className="p2" />
      <i className="p1">
        <b>∞</b>
        <span>2026</span>
      </i>
    </div>
  )
}

/* —————————————————————————— FINALE —————————————————————————— */
function Finale({ onEnter }) {
  const ref = useRef()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] })
  const x = useTransform(scrollYProgress, [0, 1], ['18%', '-6%'])
  const t = todayParts()
  return (
    <section className="lp-final" ref={ref}>
      <motion.div className="lp-final-big" style={{ x }} aria-hidden>
        {t.y} {t.y + 1} {t.y + 2} ∞
      </motion.div>
      <div className="lp-final-copy">
        <h2>Make this the year you actually plan.</h2>
        <button className="lp-cta big" onClick={(e) => onEnter(null, e)}>
          Open my planner <span>→</span>
        </button>
        <p>Free · no account · everything stays on your device</p>
      </div>
      <footer className="lp-foot">
        <span>planzer</span>
        <span>Made for people who like to plan</span>
      </footer>
    </section>
  )
}
