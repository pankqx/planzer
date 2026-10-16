import { useMemo, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore, monthStats, catOf } from '../../store'
import { MONTHS, MONTHS_SHORT, MONTH_HUES, WEEKDAYS, ROMAN, monthGrid, dateKey, monthKey, daysIn, todayParts, prettyDate, parseKey } from '../../lib/date'
import { Ring, StarCheck, Rise, ease, panelInLeft } from '../ui/bits'
import Magnetic from '../ui/Magnetic'

const SEASONS = ['Deep winter', 'Late winter', 'First spring', 'Spring', 'Late spring', 'Solstice', 'High summer', 'Late summer', 'First autumn', 'Autumn', 'Late autumn', 'Midwinter']

export default function MonthView() {
  const year = useStore((s) => s.year)
  const month = useStore((s) => s.month)
  const goals = useStore((s) => s.goals)
  const tasks = useStore((s) => s.tasks)
  const habits = useStore((s) => s.habits)
  const notes = useStore((s) => s.notes)
  const setNote = useStore((s) => s.setNote)
  const openMonth = useStore((s) => s.openMonth)
  const go = useStore((s) => s.go)
  const day = useStore((s) => s.day)
  const setDay = useStore((s) => s.setDay)
  const t = todayParts()
  const stats = useMemo(() => monthStats({ year, goals, tasks, habits }, month), [year, goals, tasks, habits, month])
  const mk = monthKey(year, month)
  const note = notes[mk] || {}
  const [hue] = MONTH_HUES[month]
  const n = daysIn(year, month)

  // default the day sheet to today (in this month) or the 1st
  useEffect(() => {
    if (!day || !day.startsWith(mk)) setDay(t.y === year && t.m === month ? t.key : dateKey(year, month, 1))
  }, [mk]) // eslint-disable-line react-hooks/exhaustive-deps

  const isPast = year < t.y || (year === t.y && month < t.m)
  const isNow = year === t.y && month === t.m
  const daysLeft = isNow ? n - t.d : isPast ? 0 : n
  const elapsedFrac = isNow ? t.d / n : isPast ? 1 : 0

  return (
    <>
      <style>{`
        .mv { position: fixed; z-index: 20; left: 26px; top: 92px; bottom: 96px; width: min(820px, calc(100vw - 460px)); display: flex; flex-direction: column; }
        .mv-scroll { flex: 1; padding: 26px clamp(20px, 3vw, 38px) 34px; }
        .mv-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .mv-title { font-family: var(--display); font-size: clamp(56px, 7vw, 104px); line-height: .92; letter-spacing: .04em; margin: 14px 0 6px; white-space: nowrap; }
        .mv-focus { width: 100%; background: none; border: 0; outline: none; font-family: var(--serif); font-style: italic; font-weight: 300; font-size: clamp(19px, 1.8vw, 24px); color: var(--ivory); padding: 6px 0; border-bottom: 1px solid transparent; transition: border-color .4s; }
        .mv-focus:hover, .mv-focus:focus { border-color: var(--line-2); }
        .mv-focus::placeholder { color: var(--faint); }
        .mv-summary { font-size: 13.5px; line-height: 1.85; color: var(--mute); margin-top: 16px; max-width: 64ch; }
        .mv-summary b { color: var(--gold-hi); font-weight: 500; }
        .mv-stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin: 26px 0 30px; }
        .mv-stat { padding: 14px 12px; border-radius: 16px; border: 1px solid var(--line); background: rgba(3,4,12,.25); display: flex; flex-direction: column; align-items: flex-start; gap: 10px; }
        .mv-stat .v { font-family: var(--display); font-size: 28px; line-height: 1; color: var(--gold-hi); }
        .mv-stat .v small { font-size: 15px; color: var(--faint); }
        .mv-stat .k { font-size: 9px; letter-spacing: .26em; text-transform: uppercase; color: var(--faint); }
        .mv-grid { display: grid; grid-template-columns: 1fr 290px; gap: 22px; align-items: start; }
        .cal-head { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; margin-bottom: 8px; }
        .cal-head span { font-size: 9px; letter-spacing: .26em; text-transform: uppercase; color: var(--faint); text-align: center; }
        .cal { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
        .cell { position: relative; aspect-ratio: 1 / 1.02; border-radius: 14px; border: 1px solid rgba(230,201,138,.08); padding: 7px 8px; text-align: left; overflow: hidden;
          transition: transform .5s var(--ease), border-color .4s, background .4s, box-shadow .5s; }
        .cell:hover { transform: translateY(-3px); border-color: rgba(230,201,138,.35); }
        .cell .d { font-family: var(--serif); font-size: 19px; line-height: 1; color: var(--ivory); }
        .cell.past .d { color: var(--faint); }
        .cell.wk .d { color: rgba(230,201,138,.8); }
        .cell.today { border-color: rgba(255,242,204,.75); box-shadow: 0 0 26px -6px rgba(230,201,138,.8), inset 0 0 18px -6px rgba(230,201,138,.6); }
        .cell.sel { background: rgba(230,201,138,.13) !important; border-color: rgba(255,236,190,.6); }
        .cell.drop { border-color: #fff2cc; background: rgba(230,201,138,.2) !important; }
        .cell .dots { position: absolute; left: 8px; right: 8px; bottom: 8px; display: flex; gap: 3px; flex-wrap: wrap; }
        .cell .dots i { width: 5px; height: 5px; border-radius: 50%; }
        .cell .dots i.done { box-shadow: 0 0 6px currentColor; }
        .sec { margin-top: 34px; }
        .sec h3 { font-family: var(--display); font-weight: 400; font-size: 26px; letter-spacing: .06em; margin: 6px 0 14px; }
        @media (max-width: 1100px) { .mv-grid { grid-template-columns: 1fr; } .mv-stats { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 860px) {
          .mv { left: 8px; right: 8px; width: auto; top: auto; height: 64vh; bottom: 74px; }
          .mv-stats { grid-template-columns: repeat(2, 1fr); } .mv-title { font-size: 54px; }
          .cell { padding: 5px; border-radius: 10px; } .cell .d { font-size: 15px; }
        }
      `}</style>

      <motion.section className="mv glass" {...panelInLeft}>
        <div className="mv-scroll scroll">
          <div className="mv-top">
            <Magnetic>
              <button className="btn ghost small" onClick={() => go('year')} style={{ paddingLeft: 0 }} data-cursor="Back">
                ← The Year
              </button>
            </Magnetic>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button className="btn small" onClick={() => openMonth((month + 11) % 12)} aria-label="Previous month">
                ‹ {MONTHS_SHORT[(month + 11) % 12]}
              </button>
              <button className="btn small" onClick={() => openMonth((month + 1) % 12)} aria-label="Next month">
                {MONTHS_SHORT[(month + 1) % 12]} ›
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={mk} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, filter: 'blur(8px)', transition: { duration: 0.35 } }} transition={{ duration: 0.4 }}>
              <div className="eyebrow" style={{ marginTop: 22, color: hue }}>
                Month {ROMAN[month + 1]} of XII · {n} days · {SEASONS[month]}
              </div>
              <h1 className="mv-title">
                <Rise text={MONTHS[month]} delay={0.15} stagger={0.05} letterClass="gold-text" />
              </h1>
              <input className="mv-focus" value={note.focus || ''} onChange={(e) => setNote(mk, { focus: e.target.value })} placeholder={`What is ${MONTHS[month]} for? Write its one intention…`} maxLength={140} />
              <p className="mv-summary">
                <Summary stats={stats} month={month} year={year} isNow={isNow} isPast={isPast} daysLeft={daysLeft} />
              </p>

              <div className="mv-stats">
                <Stat i={0} label="Complete">
                  <Ring value={stats.progress} size={46} stroke={1.8} color={hue}>
                    <span style={{ fontSize: 10.5 }}>{Math.round(stats.progress * 100)}%</span>
                  </Ring>
                </Stat>
                <Stat i={1} label="Plans done">
                  <div className="v">
                    {stats.done}
                    <small>/{stats.tasks.length}</small>
                  </div>
                </Stat>
                <Stat i={2} label="Milestones">
                  <div className="v">
                    {stats.msDone}
                    <small>/{stats.milestones.length}</small>
                  </div>
                </Stat>
                <Stat i={3} label="Habit rhythm">
                  <div className="v">
                    {habits.length && (isNow || isPast) ? Math.round(stats.habitRate * 100) : '—'}
                    <small>{habits.length && (isNow || isPast) ? '%' : ''}</small>
                  </div>
                </Stat>
                <Stat i={4} label={isNow ? 'Days remain' : isPast ? 'Orbit closed' : 'Days ahead'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="v">{isPast ? '✦' : daysLeft}</div>
                    <MonthArc frac={elapsedFrac} color={hue} />
                  </div>
                </Stat>
              </div>

              <div className="mv-grid">
                <Calendar year={year} month={month} tasks={stats.tasks} goals={goals} />
                <DaySheet />
              </div>

              <Milestones stats={stats} month={month} />

              <div className="sec">
                <div className="eyebrow">Reflection</div>
                <h3>What {MONTHS[month]} taught me</h3>
                <textarea className="field" rows={4} value={note.reflection || ''} onChange={(e) => setNote(mk, { reflection: e.target.value })} placeholder="Wins, lessons, what to carry into next month…" style={{ fontFamily: 'var(--serif)', fontSize: 17 }} />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.section>
    </>
  )
}

function Stat({ i, label, children }) {
  return (
    <motion.div className="mv-stat" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease, delay: 0.35 + i * 0.07 }}>
      {children}
      <span className="k">{label}</span>
    </motion.div>
  )
}

function MonthArc({ frac, color }) {
  const r = 13
  const c = Math.PI * r
  return (
    <svg width="32" height="18" viewBox="0 0 32 18">
      <path d="M3 16 A13 13 0 0 1 29 16" fill="none" stroke="rgba(230,201,138,.15)" strokeWidth="1.5" />
      <motion.path d="M3 16 A13 13 0 0 1 29 16" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - frac) }} transition={{ duration: 1.6, ease }} />
    </svg>
  )
}

/** A short prose briefing of the month, written from the plan itself. */
function Summary({ stats, month, year, isNow, isPast, daysLeft }) {
  const byDay = {}
  for (const x of stats.tasks) byDay[x.date] = (byDay[x.date] || 0) + 1
  const busiest = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0]
  const activeDays = Object.keys(byDay).length
  const name = MONTHS[month]
  const pct = Math.round(stats.progress * 100)
  if (!stats.goals.length && !stats.tasks.length)
    return (
      <>
        {name} is an open sky. Give it an intention above, pick a day on the calendar to schedule your first plan, or add a goal from the year view to fill this world with moons.
      </>
    )
  const goalNames = stats.goals.slice(0, 3).map((g) => g.title)
  return (
    <>
      {name} carries <b>{stats.goals.length} goal{stats.goals.length === 1 ? '' : 's'}</b>
      {goalNames.length ? ` — ${goalNames.join(', ')}${stats.goals.length > 3 ? ' and more' : ''} —` : ''} with <b>{stats.tasks.length} plans</b> across {activeDays} day{activeDays === 1 ? '' : 's'}
      {stats.milestones.length ? (
        <>
          {' '}and <b>{stats.milestones.length} milestone{stats.milestones.length === 1 ? '' : 's'}</b> on the path
        </>
      ) : null}
      .{' '}
      {busiest && busiest[1] > 1 ? (
        <>
          Your fullest day is <b>{prettyDate(busiest[0]).replace(`, ${parseKey(busiest[0]).d} ${name}`, ` the ${ordinal(parseKey(busiest[0]).d)}`)}</b> with {busiest[1]} plans.{' '}
        </>
      ) : null}
      {isPast ? (
        <>
          The orbit closed at <b>{pct}%</b> complete.
        </>
      ) : isNow ? (
        <>
          With <b>{daysLeft} days</b> left you stand at <b>{pct}%</b> — {pct >= 60 ? 'a bright month, keep the light steady.' : pct >= 30 ? 'steady progress; protect your next deep-work block.' : 'still time to turn it around — pick one milestone and finish it this week.'}
        </>
      ) : (
        <>It hasn't begun yet — a good moment to shape it.</>
      )}
    </>
  )
}
const ordinal = (n) => n + (n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th')

function Calendar({ year, month, tasks, goals }) {
  const day = useStore((s) => s.day)
  const setDay = useStore((s) => s.setDay)
  const moveTask = useStore((s) => s.moveTask)
  const [over, setOver] = useState(null)
  const t = todayParts()
  const cells = monthGrid(year, month)
  const byDay = useMemo(() => {
    const m = {}
    for (const x of tasks) (m[x.date] ||= []).push(x)
    return m
  }, [tasks])
  const goalColor = (id) => (id ? catOf(goals.find((g) => g.id === id)?.category).color : '#e6c98a')
  return (
    <div>
      <div className="cal-head">
        {WEEKDAYS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div className="cal">
        {cells.map((d, i) => {
          if (!d) return <span key={`b${i}`} />
          const key = dateKey(year, month, d)
          const list = byDay[key] || []
          const isToday = key === t.key
          const past = new Date(year, month, d) < new Date(t.y, t.m, t.d)
          const wk = i % 7 >= 5
          const heat = Math.min(list.length, 5) / 5
          return (
            <motion.button
              key={key}
              initial={{ opacity: 0, scale: 0.85, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, ease, delay: 0.3 + (Math.floor(i / 7) + (i % 7)) * 0.035 }}
              className={`cell ${isToday ? 'today' : ''} ${day === key ? 'sel' : ''} ${past ? 'past' : ''} ${wk ? 'wk' : ''} ${over === key ? 'drop' : ''}`}
              style={{ background: heat ? `radial-gradient(120% 100% at 50% 110%, rgba(230,201,138,${0.04 + heat * 0.16}), transparent 70%)` : 'rgba(3,4,12,.18)' }}
              onClick={() => setDay(key)}
              onDragOver={(e) => (e.preventDefault(), setOver(key))}
              onDragLeave={() => setOver(null)}
              onDrop={(e) => {
                e.preventDefault()
                const id = e.dataTransfer.getData('text/planzer-task')
                if (id) moveTask(id, key)
                setOver(null)
                setDay(key)
              }}
              data-cursor={list.length ? `${list.length} plan${list.length > 1 ? 's' : ''}` : 'Plan'}
            >
              <span className="d">{d}</span>
              <span className="dots">
                {list.slice(0, 6).map((x) => (
                  <i key={x.id} className={x.done ? 'done' : ''} style={{ background: x.done ? goalColor(x.goalId) : 'transparent', border: `1px solid ${goalColor(x.goalId)}`, color: goalColor(x.goalId) }} />
                ))}
              </span>
            </motion.button>
          )
        })}
      </div>
      <div style={{ marginTop: 10, fontSize: 10.5, color: 'var(--faint)', letterSpacing: '.06em' }}>Tip — drag a plan from the day sheet onto another day to reschedule it.</div>
    </div>
  )
}

function DaySheet() {
  const day = useStore((s) => s.day)
  const tasks = useStore((s) => s.tasks)
  const goals = useStore((s) => s.goals)
  const year = useStore((s) => s.year)
  const addTask = useStore((s) => s.addTask)
  const toggleTask = useStore((s) => s.toggleTask)
  const removeTask = useStore((s) => s.removeTask)
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('09:00')
  const [goalId, setGoalId] = useState('')
  if (!day) return null
  const { m } = parseKey(day)
  const list = tasks.filter((x) => x.date === day).sort((a, b) => (a.time || '99').localeCompare(b.time || '99'))
  const active = goals.filter((g) => g.year === year && m >= g.start && m <= g.end)
  const submit = (e) => {
    e.preventDefault()
    if (!title.trim()) return
    addTask({ date: day, time, title: title.trim(), goalId })
    setTitle('')
  }
  const [wd, rest] = prettyDate(day).split(', ')
  return (
    <div style={{ position: 'sticky', top: 0 }}>
      <div style={{ borderRadius: 18, border: '1px solid var(--line)', padding: 18, background: 'rgba(3,4,12,.3)' }}>
        <AnimatePresence mode="wait">
          <motion.div key={day} initial={{ opacity: 0, y: 8, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -6, filter: 'blur(6px)' }} transition={{ duration: 0.45, ease }}>
            <div className="eyebrow">{wd}</div>
            <div style={{ fontFamily: 'var(--display)', fontSize: 30, margin: '4px 0 10px', letterSpacing: '.04em' }}>{rest}</div>
            <button className="btn small" style={{ marginBottom: 14 }} onClick={() => useStore.getState().openDay(day)}>
              ✎ Open day page — notes, photos & tasks
            </button>
            {list.length === 0 && <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--faint)', fontSize: 16, marginBottom: 10 }}>A clear day. What will you place in it?</p>}
            <div style={{ position: 'relative' }}>
              {list.length > 0 && <span style={{ position: 'absolute', left: 10, top: 10, bottom: 10, width: 1, background: 'linear-gradient(var(--line-2), transparent)' }} />}
              <AnimatePresence initial={false}>
                {list.map((x) => {
                  const g = goals.find((gg) => gg.id === x.goalId)
                  const color = g ? catOf(g.category).color : '#e6c98a'
                  return (
                    <motion.div
                      key={x.id}
                      layout
                      initial={{ opacity: 0, x: -10, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: 'auto' }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      transition={{ duration: 0.45, ease }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div draggable onDragStart={(e) => e.dataTransfer.setData('text/planzer-task', x.id)} className="task-row" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '8px 0' }} data-hover>
                        <StarCheck checked={x.done} onChange={() => toggleTask(x.id)} color={color} label={x.title} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13.5, color: x.done ? 'var(--faint)' : 'var(--ivory)', textDecoration: x.done ? 'line-through' : 'none', textDecorationColor: 'rgba(230,201,138,.5)' }}>{x.title}</div>
                          <div style={{ fontSize: 10, letterSpacing: '.14em', color: 'var(--faint)', marginTop: 3 }}>
                            {x.time || 'Any time'}
                            {g && <span style={{ color }}> · {g.title}</span>}
                          </div>
                        </div>
                        <button className="task-x" onClick={() => removeTask(x.id)} aria-label="Remove plan" style={{ color: 'var(--faint)', fontSize: 16, padding: '0 4px' }}>
                          ×
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </motion.div>
        </AnimatePresence>
        <form onSubmit={submit} style={{ marginTop: 12, display: 'grid', gap: 8 }}>
          <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add a plan…" maxLength={90} />
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="field" type="time" value={time} onChange={(e) => setTime(e.target.value)} style={{ width: 112, flex: 'none' }} />
            <select className="field" value={goalId} onChange={(e) => setGoalId(e.target.value)}>
              <option value="">No goal</option>
              {active.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
          </div>
          <button className="btn solid small" type="submit" style={{ justifyContent: 'center' }}>
            ✦ Schedule
          </button>
        </form>
        <style>{`.task-x { opacity: 0; transition: opacity .3s } .task-row:hover .task-x { opacity: 1 } select.field option { background: #0b0e22; } @media (hover: none) { .task-x { opacity: 1 } }`}</style>
      </div>
    </div>
  )
}

function Milestones({ stats, month }) {
  const toggleMilestone = useStore((s) => s.toggleMilestone)
  const addMilestone = useStore((s) => s.addMilestone)
  const removeMilestone = useStore((s) => s.removeMilestone)
  const [drafts, setDrafts] = useState({})
  if (!stats.goals.length) return null
  return (
    <div className="sec">
      <div className="eyebrow">The path this month</div>
      <h3>Milestones & moons</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
        {stats.goals.map((g, i) => {
          const cat = catOf(g.category)
          const ms = g.milestones.filter((x) => x.month === month)
          return (
            <motion.div
              key={g.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease, delay: 0.2 + i * 0.06 }}
              style={{ borderRadius: 18, padding: 16, border: `1px solid ${cat.color}30`, background: `radial-gradient(120% 120% at 0% 0%, ${cat.color}14, transparent 60%)` }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ color: cat.color, textShadow: `0 0 12px ${cat.color}` }}>{cat.glyph}</span>
                <span style={{ fontFamily: 'var(--serif)', fontSize: 18, lineHeight: 1.2 }}>{g.title}</span>
              </div>
              {ms.length === 0 && <div style={{ fontSize: 12, color: 'var(--faint)', fontStyle: 'italic', marginBottom: 6 }}>No milestone lands this month.</div>}
              {ms.map((x) => (
                <div key={x.id} className="task-row" style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '5px 0' }}>
                  <StarCheck checked={x.done} onChange={() => toggleMilestone(g.id, x.id)} color={cat.color} size={20} label={x.title} />
                  <span style={{ flex: 1, fontSize: 13, color: x.done ? 'var(--faint)' : 'var(--ivory)', textDecoration: x.done ? 'line-through' : 'none' }}>{x.title}</span>
                  <button className="task-x" onClick={() => removeMilestone(g.id, x.id)} style={{ color: 'var(--faint)' }} aria-label="Remove milestone">
                    ×
                  </button>
                </div>
              ))}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const v = (drafts[g.id] || '').trim()
                  if (!v) return
                  addMilestone(g.id, month, v)
                  setDrafts({ ...drafts, [g.id]: '' })
                }}
              >
                <input className="field" value={drafts[g.id] || ''} onChange={(e) => setDrafts({ ...drafts, [g.id]: e.target.value })} placeholder="+ add a milestone" style={{ marginTop: 8, padding: '8px 12px', fontSize: 12.5 }} />
              </form>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
