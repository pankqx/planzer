import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore, catOf } from '../store'
import { MONTHS, WEEKDAYS, dateKey, daysIn, monthGrid, monthKey, parseKey, todayParts } from '../lib/date'
import { absOf, monthOf, yearOf } from '../lib/theme'
import { prio, fmtTime, todayKey } from '../lib/tasks'
import { getNote } from '../lib/db'
import { TaskRow, QuickAdd } from '../workspace/TaskBits'
import './calendar.css'

const DEFAULT_SHOW = { tasks: false, goals: false, notes: false, habits: false }
const SHOW_OPTS = [
  ['tasks', 'Tasks & plans'],
  ['goals', 'Goals & milestones'],
  ['notes', 'Notes & photos'],
  ['habits', 'Habits'],
]
const WDL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/** One plain, white, vertically scrolling calendar — the same in every theme. */
export default function Calendar() {
  const open = useStore((s) => s.calOpen)
  const openCal = useStore((s) => s.openCal)
  useEffect(() => {
    if (!open) return
    const k = (e) => {
      const s = useStore.getState()
      if (e.key === 'Escape' && !s.taskOpen && !s.dayPage) openCal(false)
    }
    addEventListener('keydown', k)
    return () => removeEventListener('keydown', k)
  }, [open, openCal])
  return (
    <AnimatePresence>
      {open && (
        <motion.div key="cal" className="cal-root" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
          <CalendarBody />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function CalendarBody() {
  const openCal = useStore((s) => s.openCal)
  const prefs = useStore((s) => s.prefs)
  const setPrefs = useStore((s) => s.setPrefs)
  const calDay = useStore((s) => s.calDay)
  const show = prefs.calShow || DEFAULT_SHOW
  const mode = prefs.calMode || 'month'
  const [sel, setSel] = useState(calDay || todayKey())
  const [panel, setPanel] = useState(!!calDay || typeof window === 'undefined' || innerWidth > 900)
  const [menu, setMenu] = useState(false)
  const scroller = useRef()
  const jumpRef = useRef(null)
  const t = todayParts()
  const pick = (key) => {
    setSel(key)
    setPanel(true)
  }
  const goToday = () => {
    setSel(t.key)
    jumpRef.current?.(absOf(t.y, t.m), true)
  }
  const anyOn = Object.values(show).some(Boolean)
  return (
    <div className="cal">
      <header className="cal-head">
        <button className="cal-close" onClick={() => openCal(false)} aria-label="Close calendar">
          ←
        </button>
        <h1>Calendar</h1>
        <div className="cal-seg" role="tablist">
          {[
            ['month', 'Month'],
            ['agenda', 'Agenda'],
          ].map(([id, l]) => (
            <button key={id} role="tab" aria-selected={mode === id} className={mode === id ? 'on' : ''} onClick={() => setPrefs({ calMode: id })}>
              {l}
            </button>
          ))}
        </div>
        <div className="cal-tools">
          <button className="cal-btn" onClick={goToday}>
            Today
          </button>
          <div className="cal-show">
            <button className={`cal-btn ${anyOn ? 'on' : ''}`} onClick={() => setMenu(!menu)} aria-expanded={menu}>
              Show {anyOn ? `(${Object.values(show).filter(Boolean).length})` : ''} ▾
            </button>
            {menu && (
              <div className="cal-menu" onMouseLeave={() => setMenu(false)}>
                <div className="cal-menu-h">Show on the calendar</div>
                {SHOW_OPTS.map(([k, l]) => (
                  <label key={k}>
                    <input type="checkbox" checked={!!show[k]} onChange={(e) => setPrefs({ calShow: { ...show, [k]: e.target.checked } })} />
                    <span>{l}</span>
                  </label>
                ))}
                <div className="cal-menu-f">
                  <button onClick={() => setPrefs({ calShow: { tasks: true, goals: true, notes: true, habits: true } })}>Show all</button>
                  <button onClick={() => setPrefs({ calShow: DEFAULT_SHOW })}>Dates only</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      <div className={`cal-body ${panel ? 'with-panel' : ''}`}>
        <div className="cal-scroll" ref={scroller}>
          <Infinite jumpRef={jumpRef} start={absOf(parseKey(sel).y, parseKey(sel).m)} render={(abs) => (mode === 'month' ? <MonthGrid key={abs} abs={abs} show={show} sel={sel} onPick={pick} /> : <AgendaMonth key={abs} abs={abs} show={show} sel={sel} onPick={pick} />)} />
        </div>
        <AnimatePresence>{panel && <DayPanel key="panel" dateKey={sel} show={show} onClose={() => setPanel(false)} />}</AnimatePresence>
      </div>
    </div>
  )
}

/**
 * Endless vertical list of months. Starts a year around `start`, adds more months as you
 * approach either end, and keeps your place steady when months are added above you.
 */
function Infinite({ start, render, jumpRef }) {
  const [range, setRange] = useState([start - 6, start + 12])
  const list = useRef()
  // the scrolling element is our parent; read it through our own node so it is ready in layout effects
  const scroller = useMemo(() => ({ get current() { return list.current?.parentElement } }), [])
  const anchor = useRef(null)
  const jumping = useRef({ abs: start, instant: true })

  const scrollToMonth = useCallback(
    (abs, smooth) => {
      const el = scroller.current?.querySelector(`[data-abs="${abs}"]`)
      if (el) scroller.current.scrollTo({ top: el.offsetTop - list.current.offsetTop - 8, behavior: smooth ? 'smooth' : 'auto' })
      else {
        jumping.current = { abs, instant: !smooth }
        setRange([abs - 6, abs + 12])
      }
    },
    [scroller],
  )
  useEffect(() => {
    jumpRef.current = scrollToMonth
  }, [jumpRef, scrollToMonth])

  useLayoutEffect(() => {
    const sc = scroller.current
    if (!sc) return
    if (jumping.current) {
      const el = sc.querySelector(`[data-abs="${jumping.current.abs}"]`)
      if (el) sc.scrollTop = el.offsetTop - list.current.offsetTop - 8
      jumping.current = null
      return
    }
    if (anchor.current) {
      const { abs, top } = anchor.current
      const el = sc.querySelector(`[data-abs="${abs}"]`)
      if (el) sc.scrollTop += el.offsetTop - top
      anchor.current = null
    }
  }, [range, scroller])

  useEffect(() => {
    const sc = scroller.current
    if (!sc) return
    const onScroll = () => {
      if (sc.scrollTop < 800) {
        const first = sc.querySelector('[data-abs]')
        anchor.current = first ? { abs: Number(first.dataset.abs), top: first.offsetTop } : null
        setRange(([a, b]) => [a - 6, Math.min(b, a - 6 + 60)])
      } else if (sc.scrollHeight - sc.scrollTop - sc.clientHeight < 1000) {
        setRange(([a, b]) => {
          const nb = b + 6
          const na = Math.max(a, nb - 60)
          if (na !== a) {
            const first = sc.querySelector(`[data-abs="${na}"]`)
            anchor.current = first ? { abs: na, top: first.offsetTop } : null
          }
          return [na, nb]
        })
      }
    }
    sc.addEventListener('scroll', onScroll, { passive: true })
    return () => sc.removeEventListener('scroll', onScroll)
  }, [scroller])

  const out = []
  for (let k = range[0]; k <= range[1]; k++) out.push(render(k))
  return (
    <div className="cal-list" ref={list}>
      {out}
    </div>
  )
}

function useDayData(show) {
  const tasks = useStore((s) => s.tasks)
  const noteIndex = useStore((s) => s.noteIndex)
  const habits = useStore((s) => s.habits)
  const byDay = useMemo(() => {
    if (!show.tasks) return {}
    const m = {}
    for (const x of tasks) if (x.date && !x.parentId) (m[x.date] ||= []).push(x)
    for (const k in m) m[k].sort((a, b) => a.done - b.done || (a.time || '99').localeCompare(b.time || '99') || a.priority - b.priority)
    return m
  }, [tasks, show.tasks])
  return { byDay, noteIndex, habits }
}

function MonthGrid({ abs, show, sel, onPick }) {
  const y = yearOf(abs)
  const m = monthOf(abs)
  const t = todayParts()
  const { byDay, noteIndex, habits } = useDayData(show)
  const goals = useStore((s) => s.goals)
  const monthGoals = show.goals ? goals.filter((g) => g.year === y && m >= g.start && m <= g.end) : []
  const cells = monthGrid(y, m)
  return (
    <section className="cm" data-abs={abs}>
      <h2 className="cm-h">
        <span>{MONTHS[m]}</span> <em>{y}</em>
      </h2>
      {monthGoals.length > 0 && (
        <div className="cm-goals">
          {monthGoals.map((g) => {
            const ms = g.milestones.filter((x) => x.month === m)
            return (
              <span key={g.id} className="cm-goal" style={{ '--gc': catOf(g.category).color }}>
                <i />
                {g.title}
                {ms.length > 0 && (
                  <small>
                    {ms.filter((x) => x.done).length}/{ms.length} steps
                  </small>
                )}
              </span>
            )
          })}
        </div>
      )}
      <div className="cm-wd">
        {WEEKDAYS.map((w) => (
          <span key={w}>{w.slice(0, 1)}</span>
        ))}
      </div>
      <div className="cm-grid">
        {cells.map((d, i) => {
          if (!d) return <span key={`e${i}`} className="cc empty" />
          const key = dateKey(y, m, d)
          const list = byDay[key] || []
          const note = show.notes && noteIndex[key]
          const kept = show.habits ? habits.filter((h) => h.log[key]) : []
          const wd = i % 7
          return (
            <button key={key} className={`cc ${key === t.key ? 'today' : ''} ${key === sel ? 'sel' : ''} ${key < t.key ? 'past' : ''} ${wd >= 5 ? 'we' : ''}`} onClick={() => onPick(key)} aria-label={`${d} ${MONTHS[m]}${list.length ? `, ${list.length} tasks` : ''}`}>
              <span className="cc-n">{d}</span>
              {note && <NoteMark dateKey={key} note={note} />}
              {list.length > 0 && (
                <span className="cc-items">
                  {list.slice(0, 2).map((x) => (
                    <span key={x.id} className={`cc-t ${x.done ? 'done' : ''}`} style={{ '--pc': x.priority < 4 ? prio(x.priority).color : '#1a73e8' }}>
                      {x.title}
                    </span>
                  ))}
                  {list.length > 2 && <span className="cc-more">+{list.length - 2}</span>}
                </span>
              )}
              {kept.length > 0 && (
                <span className="cc-habits">
                  {kept.slice(0, 5).map((h) => (
                    <i key={h.id} style={{ background: h.color }} />
                  ))}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}

const thumbs = new Map()
function NoteMark({ dateKey: key, note }) {
  const [src, setSrc] = useState(thumbs.get(`${key}:${note.updated}`) || null)
  useEffect(() => {
    if (!note.images) return
    const ck = `${key}:${note.updated}`
    if (thumbs.has(ck)) return setSrc(thumbs.get(ck))
    let alive = true
    getNote(key).then((doc) => {
      let s = null
      const walk = (n) => {
        if (s || !n) return
        if (n.type === 'image') s = n.attrs?.src
        n.content?.forEach(walk)
      }
      walk(doc)
      thumbs.set(ck, s)
      if (alive) setSrc(s)
    })
    return () => {
      alive = false
    }
  }, [key, note.updated, note.images])
  return src ? <img className="cc-photo" src={src} alt="" /> : <span className="cc-note" title="Has notes">✎</span>
}

function AgendaMonth({ abs, show, sel, onPick }) {
  const y = yearOf(abs)
  const m = monthOf(abs)
  const t = todayParts()
  const { byDay, noteIndex, habits } = useDayData(show)
  const goals = useStore((s) => s.goals)
  const monthGoals = show.goals ? goals.filter((g) => g.year === y && m >= g.start && m <= g.end) : []
  const n = daysIn(y, m)
  const rows = []
  for (let d = 1; d <= n; d++) {
    const key = dateKey(y, m, d)
    const list = byDay[key] || []
    const note = show.notes && noteIndex[key]
    const kept = show.habits ? habits.filter((h) => h.log[key]) : []
    const wd = new Date(y, m, d).getDay()
    const ms = show.goals ? monthGoals.flatMap((g) => g.milestones.filter((x) => x.month === m && d === 1).map((x) => ({ ...x, g }))) : []
    rows.push(
      <button key={key} className={`ag-row ${key === t.key ? 'today' : ''} ${key === sel ? 'sel' : ''} ${key < t.key ? 'past' : ''}`} onClick={() => onPick(key)}>
        <span className="ag-date">
          <b>{d}</b>
          <small>{WDL[wd].slice(0, 3)}</small>
        </span>
        <span className="ag-items">
          {list.map((x) => (
            <span key={x.id} className={`ag-t ${x.done ? 'done' : ''}`} style={{ '--pc': x.priority < 4 ? prio(x.priority).color : '#1a73e8' }}>
              {x.time && <em>{fmtTime(x.time)}</em>}
              {x.title}
            </span>
          ))}
          {ms.map((x) => (
            <span key={x.id} className={`ag-t goal ${x.done ? 'done' : ''}`} style={{ '--pc': catOf(x.g.category).color }}>
              ◎ {x.title} <small>{x.g.title}</small>
            </span>
          ))}
          {note && <span className="ag-note">✎ {note.preview || 'Photo note'}</span>}
          {kept.length > 0 && (
            <span className="ag-habits">
              {kept.map((h) => (
                <i key={h.id} style={{ background: h.color }} title={h.name} />
              ))}
            </span>
          )}
        </span>
      </button>,
    )
  }
  return (
    <section className="ag" data-abs={abs}>
      <h2 className="cm-h">
        <span>{MONTHS[m]}</span> <em>{y}</em>
      </h2>
      {rows}
    </section>
  )
}

function DayPanel({ dateKey: key, onClose }) {
  const tasks = useStore((s) => s.tasks)
  const note = useStore((s) => s.noteIndex[key])
  const habits = useStore((s) => s.habits)
  const goals = useStore((s) => s.goals)
  const toggleHabit = useStore((s) => s.toggleHabit)
  const openDay = useStore((s) => s.openDay)
  const { y, m, d } = parseKey(key)
  const wd = WDL[new Date(y, m, d).getDay()]
  const list = useMemo(() => tasks.filter((x) => x.date === key && !x.parentId).sort((a, b) => a.done - b.done || (a.time || '99').localeCompare(b.time || '99') || a.priority - b.priority), [tasks, key])
  const ms = goals.filter((g) => g.year === y).flatMap((g) => g.milestones.filter((x) => x.month === m).map((x) => ({ ...x, g })))
  const t = todayKey()
  const future = key > t
  return (
    <motion.aside className="cal-panel" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }} transition={{ duration: 0.25 }}>
      <div className="cp-head">
        <div>
          <div className="cp-wd">{wd}</div>
          <div className="cp-date">
            {d} {MONTHS[m]} {y}
            {key === t && <span className="cp-today">Today</span>}
          </div>
        </div>
        <button className="cal-close" onClick={onClose} aria-label="Close day">
          ×
        </button>
      </div>
      <button className="cp-open" onClick={() => openDay(key)}>
        ✎ {note ? 'Open notebook' : 'Write in the notebook'}
        {note?.preview && <small>{note.preview}</small>}
      </button>
      <div className="cp-sec">
        <div className="cp-h">Tasks</div>
        <ul className="tlist">
          {list.map((x) => (
            <TaskRow key={x.id} t={x} showDate={false} />
          ))}
        </ul>
        {!list.length && <p className="cp-empty">Nothing planned.</p>}
        <QuickAdd date={key} placeholder="Add a task for this day…" />
      </div>
      {ms.length > 0 && (
        <div className="cp-sec">
          <div className="cp-h">Goal steps in {MONTHS[m]}</div>
          {ms.map((x) => (
            <div key={x.id} className={`cp-ms ${x.done ? 'done' : ''}`} style={{ '--gc': catOf(x.g.category).color }}>
              <i />
              <span>
                {x.title}
                <small>{x.g.title}</small>
              </span>
            </div>
          ))}
        </div>
      )}
      {habits.length > 0 && (
        <div className="cp-sec">
          <div className="cp-h">Habits</div>
          <div className="cp-habits">
            {habits.map((h) => {
              const on = !!h.log[key]
              return (
                <button key={h.id} className={on ? 'on' : ''} style={{ '--c': h.color }} disabled={future} onClick={() => toggleHabit(h.id, key)}>
                  <i>{on ? '✓' : ''}</i>
                  {h.name}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </motion.aside>
  )
}

/** Small top-bar button that opens the calendar from any theme. */
export function CalendarButton({ className = 'btn icon cal-open-btn' }) {
  const openCal = useStore((s) => s.openCal)
  return (
    <button className={className} onClick={() => openCal(true)} aria-label="Open calendar">
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
        <rect x="3.5" y="5" width="17" height="15" rx="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M3.5 10h17M8 3v4M16 3v4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span className="lbl">Calendar</span>
    </button>
  )
}
