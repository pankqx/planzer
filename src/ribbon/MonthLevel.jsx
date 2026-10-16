import { memo, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import Ribbon from './Ribbon'
import MonthArt from './MonthArt'
import { useLevel } from './useLevel'
import { useStore, catOf } from '../store'
import { MONTHS, dateKey, monthKey, daysIn, todayParts } from '../lib/date'
import { monthOf, yearOf, monthColor } from '../lib/theme'
import { statsFor, plainSummary } from '../lib/plan'
import { nav } from '../lib/nav'
import Check from '../ui/Check'

const WD = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function MonthLevel() {
  const { L, ribbon, startX, onFrame, onRange } = useLevel('month')
  const theme = useStore((s) => s.theme)
  const render = (k, pos) => <MonthSegment k={k} pos={pos} L={L} mc={monthColor(theme, monthOf(k))} />
  return (
    <motion.div
      className="level level-month"
      initial={{ opacity: 0, scale: 1.08, filter: 'blur(10px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 1.08, filter: 'blur(10px)' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <Ribbon ref={ribbon} layout={L} startX={startX} onFrame={onFrame} onRange={onRange} renderSegment={render} />
    </motion.div>
  )
}

const MonthSegment = memo(function MonthSegment({ k, pos, L, mc }) {
  const y = yearOf(k)
  const m = monthOf(k)
  const n = daysIn(y, m)
  const days = []
  for (let d = 1; d <= n; d++) {
    const left = L.posterW + (d - 1) * L.dayW
    days.push(<DayCard key={d} y={y} m={m} d={d} left={left} w={L.dayW} c={pos + left + L.dayW / 2} />)
  }
  return (
    <div className="mseg" style={{ '--mc': mc }}>
      <Poster abs={k} y={y} m={m} w={L.posterW} c={pos + L.posterW / 2} />
      {days}
    </div>
  )
})

function Poster({ abs, y, m, w, c }) {
  const goals = useStore((s) => s.goals)
  const tasks = useStore((s) => s.tasks)
  const habits = useStore((s) => s.habits)
  const focus = useStore((s) => s.notes[monthKey(y, m)]?.focus || '')
  const setNote = useStore((s) => s.setNote)
  const setSheet = useStore((s) => s.setSheet)
  const toggleMilestone = useStore((s) => s.toggleMilestone)
  const stats = useMemo(() => statsFor({ goals, tasks, habits }, y, m), [goals, tasks, habits, y, m])
  const t = todayParts()
  const isNow = y === t.y && m === t.m
  const isPast = y < t.y || (y === t.y && m < t.m)
  const left = isNow ? daysIn(y, m) - t.d : isPast ? 0 : daysIn(y, m)
  const pct = Math.round(stats.progress * 100)
  const ms = stats.milestones.slice(0, 4)
  return (
    <section className={`poster ${isNow ? 'now' : ''}`} data-c={c} style={{ width: w }}>
      <div className="poster-text" data-vscroll>
        <div className="kicker">
          <b>{y}</b> <span>·</span> Month {m + 1} of 12 {isNow && <em className="now-tag">This month</em>}
        </div>
        <h2 className="mname" style={{ '--p': stats.progress }}>
          <span className="mn-base">{MONTHS[m]}</span>
          <span className="mn-fill" aria-hidden>
            {MONTHS[m]}
          </span>
        </h2>
        <p className="lead">{plainSummary(stats, y, m)}</p>
        <div className="stats">
          <div className="stat">
            <b>{pct}%</b>
            <span>Done</span>
          </div>
          <div className="stat">
            <b>
              {stats.done}
              <small>/{stats.tasks.length}</small>
            </b>
            <span>Plans</span>
          </div>
          <div className="stat">
            <b>{stats.goals.length}</b>
            <span>Goals</span>
          </div>
          <div className="stat">
            <b>{isPast ? '✓' : left}</b>
            <span>{isPast ? 'Finished' : 'Days left'}</span>
          </div>
        </div>
        <label className="intent">
          <span>My focus this month</span>
          <input value={focus} onChange={(e) => setNote(monthKey(y, m), { focus: e.target.value })} placeholder="Type one thing that matters…" maxLength={90} />
        </label>
        {ms.length > 0 && (
          <ul className="steps">
            {ms.map((x) => (
              <li key={x.id} className={x.done ? 'done' : ''}>
                <Check checked={x.done} onChange={() => toggleMilestone(x.goal.id, x.id)} label={x.title} color={catOf(x.goal.category).color} />
                <span>
                  {x.title}
                  <small>{x.goal.title}</small>
                </span>
              </li>
            ))}
            {stats.milestones.length > 4 && <li className="more">+ {stats.milestones.length - 4} more steps</li>}
          </ul>
        )}
        <div className="poster-actions">
          <button className="btn primary" onClick={() => setSheet({ type: 'goal', year: y, start: m })}>
            ＋ Add a goal
          </button>
          <button className="btn" onClick={() => nav.ribbon?.goToMonth(abs, isNow ? t.d : 1)}>
            See the days →
          </button>
        </div>
      </div>
      <div className="poster-art">
        <MonthArt abs={abs} level="month" />
      </div>
    </section>
  )
}

function DayCard({ y, m, d, left, w, c }) {
  const key = dateKey(y, m, d)
  const tasks = useStore((s) => s.tasks)
  const habits = useStore((s) => s.habits)
  const goals = useStore((s) => s.goals)
  const toggleTask = useStore((s) => s.toggleTask)
  const removeTask = useStore((s) => s.removeTask)
  const toggleHabit = useStore((s) => s.toggleHabit)
  const list = useMemo(() => tasks.filter((x) => x.date === key).sort((a, b) => (a.time || '99').localeCompare(b.time || '99')), [tasks, key])
  const t = todayParts()
  const today = key === t.key
  const date = new Date(y, m, d)
  const past = date < new Date(t.y, t.m, t.d)
  const future = date > new Date(t.y, t.m, t.d)
  const wd = date.getDay()
  const cls = ['day', today && 'today', past && 'past', (wd === 0 || wd === 6) && 'weekend', d === 1 && 'first'].filter(Boolean).join(' ')
  return (
    <article className={cls} data-c={c} style={{ left, width: w }}>
      <div className="day-in">
        <span className="tape" aria-hidden />
        <header className="day-head">
          <span className="wd">{WD[wd]}</span>
          <span className="dn">{d}</span>
          {today ? <span className="badge">Today</span> : <span className="mo">{MONTHS[m].slice(0, 3)}</span>}
        </header>
        <ul className="plans" data-vscroll>
          {list.length === 0 && <li className="empty">{today ? 'Nothing planned yet.' : past ? '—' : 'Free day'}</li>}
          {list.map((x) => {
            const g = goals.find((gg) => gg.id === x.goalId)
            return (
              <li key={x.id} className={x.done ? 'done' : ''}>
                <Check checked={x.done} onChange={() => toggleTask(x.id)} label={x.title} color={g ? catOf(g.category).color : undefined} />
                <span className="pt">
                  {x.title}
                  {(x.time || g) && (
                    <small>
                      {x.time}
                      {x.time && g ? ' · ' : ''}
                      {g?.title}
                    </small>
                  )}
                </span>
                <button className="x" onClick={() => removeTask(x.id)} aria-label={`Delete ${x.title}`}>
                  ×
                </button>
              </li>
            )
          })}
        </ul>
        <AddPlan date={key} />
        {habits.length > 0 && (
          <div className="habits-row">
            {habits.slice(0, 6).map((h) => {
              const on = !!h.log[key]
              return (
                <button key={h.id} className={`hbtn ${on ? 'on' : ''}`} style={{ '--c': h.color }} disabled={future} onClick={() => toggleHabit(h.id, key)} title={h.name} aria-pressed={on} aria-label={`${h.name}${on ? ' — done' : ''}`}>
                  <span>{h.name.slice(0, 1).toUpperCase()}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </article>
  )
}

function AddPlan({ date }) {
  const addTask = useStore((s) => s.addTask)
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')
  if (!open)
    return (
      <button className="add-plan" onClick={() => setOpen(true)}>
        ＋ Add a plan
      </button>
    )
  const save = (e) => {
    e.preventDefault()
    if (title.trim()) addTask({ date, time, title: title.trim() })
    setTitle('')
    setTime('')
    setOpen(false)
  }
  return (
    <form className="plan-form" onSubmit={save}>
      <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What will you do?" maxLength={80} onKeyDown={(e) => e.key === 'Escape' && setOpen(false)} />
      <div className="pf-row">
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-label="Time (optional)" />
        <button type="submit" className="btn primary small">
          Save
        </button>
        <button type="button" className="btn small ghost" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  )
}
