import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import Ribbon from './Ribbon'
import MonthArt from './MonthArt'
import { useLevel } from './useLevel'
import { useStore, catOf, goalProgress } from '../store'
import { MONTHS, monthGrid, dateKey, todayParts } from '../lib/date'
import { monthOf, yearOf, mod12, monthColor } from '../lib/theme'
import { statsFor } from '../lib/plan'

export default function YearLevel() {
  const { L, ribbon, startX, onFrame, onRange } = useLevel('year')
  const theme = useStore((s) => s.theme)
  const render = (k, pos) => <YearSegment k={k} pos={pos} L={L} mc={monthColor(theme, monthOf(k))} />
  return (
    <motion.div
      className="level level-year"
      initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <Ribbon ref={ribbon} layout={L} startX={startX} onFrame={onFrame} onRange={onRange} renderSegment={render} />
    </motion.div>
  )
}

const YearSegment = memo(function YearSegment({ k, pos, L, mc }) {
  const y = yearOf(k)
  const m = monthOf(k)
  const jan = mod12(k) === 0
  const off = jan ? L.gapW : 0
  return (
    <div className="mseg" style={{ '--mc': mc, '--alt': m % 2 ? 1 : -1 }}>
      {jan && <YearMarker y={y} w={L.gapW} c={pos + L.gapW / 2} />}
      <div className="ycol" style={{ left: off, width: L.cardW }}>
        <YearCard abs={k} y={y} m={m} c={pos + off + L.cardW / 2} />
        <Lanes y={y} m={m} />
      </div>
    </div>
  )
})

function YearMarker({ y, w, c }) {
  const count = useStore((s) => s.goals.filter((g) => g.year === y).length)
  const setSheet = useStore((s) => s.setSheet)
  const t = todayParts()
  return (
    <div className="ymark" data-c={c} style={{ width: w }}>
      <div className="ymark-num" aria-label={`Year ${y}`}>
        {String(y)
          .split('')
          .map((ch, i) => (
            <span key={i} style={{ '--i': i }}>
              {ch}
            </span>
          ))}
      </div>
      <div className="ymark-meta">
        {y === t.y ? 'This year' : y < t.y ? 'Past year' : 'Coming up'} · {count} goal{count === 1 ? '' : 's'}
      </div>
      <button className="btn primary" onClick={() => setSheet({ type: 'goal', year: y, start: y === t.y ? t.m : 0 })}>
        ＋ Add a goal
      </button>
    </div>
  )
}

function YearCard({ abs, y, m, c }) {
  const goals = useStore((s) => s.goals)
  const tasks = useStore((s) => s.tasks)
  const habits = useStore((s) => s.habits)
  const goTo = useStore((s) => s.goTo)
  const stats = useMemo(() => statsFor({ goals, tasks, habits }, y, m), [goals, tasks, habits, y, m])
  const busy = useMemo(() => new Set(stats.tasks.map((x) => x.date)), [stats])
  const t = todayParts()
  const now = y === t.y && m === t.m
  const past = y < t.y || (y === t.y && m < t.m)
  return (
    <button className={`ycard ${now ? 'now' : ''} ${past ? 'past' : ''}`} data-c={c} onClick={() => goTo('month', abs)} aria-label={`Open ${MONTHS[m]} ${y}`}>
      <span className="tape" aria-hidden />
      <div className="ycard-art">
        <MonthArt abs={abs} level="year" />
      </div>
      <div className="ycard-body">
        <div className="ycard-top">
          <span className="ycard-name">{MONTHS[m]}</span>
          {now && <span className="badge">Now</span>}
        </div>
        <div className="ymini">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((w, i) => (
            <b key={i}>{w}</b>
          ))}
          {monthGrid(y, m).map((d, i) => (
            <i key={i} className={!d ? 'e' : `${busy.has(dateKey(y, m, d)) ? 'busy' : ''} ${now && d === t.d ? 'td' : ''}`}>
              {d || ''}
            </i>
          ))}
        </div>
        <div className="ycard-bar" aria-label={`${Math.round(stats.progress * 100)} percent done`}>
          <i style={{ width: `${Math.round(stats.progress * 100)}%` }} />
        </div>
        <div className="ycard-meta">
          <span>
            {stats.tasks.length} plan{stats.tasks.length === 1 ? '' : 's'}
          </span>
          <span>
            {stats.goals.length} goal{stats.goals.length === 1 ? '' : 's'}
          </span>
          <span>{Math.round(stats.progress * 100)}%</span>
        </div>
      </div>
    </button>
  )
}

/** Goals drawn as ribbons that run underneath the months they belong to. */
function Lanes({ y, m }) {
  const all = useStore((s) => s.goals)
  const setSheet = useStore((s) => s.setSheet)
  const goals = useMemo(() => all.filter((g) => g.year === y).sort((a, b) => a.start - b.start || a.created - b.created), [all, y])
  return (
    <div className="lanes">
      {goals.length === 0 && m % 3 === 0 && <div className="lanes-empty">No goals yet for {y}</div>}
      {goals.slice(0, 6).map((g, i) => {
        if (m < g.start || m > g.end) return null
        const cat = catOf(g.category)
        const ms = g.milestones.filter((x) => x.month === m)
        const done = ms.length > 0 && ms.every((x) => x.done)
        const first = m === g.start
        const last = m === g.end
        return (
          <button
            key={g.id}
            className={`lane ${first ? 'first' : ''} ${last ? 'last' : ''} ${done ? 'done' : ''}`}
            style={{ '--i': i, '--c': cat.color }}
            onClick={() => setSheet({ type: 'goalView', id: g.id })}
            aria-label={`${g.title}, ${Math.round(goalProgress(g) * 100)} percent`}
          >
            {(first || (m - g.start) % 3 === 0) && (
              <span className={`lane-title ${first ? '' : 'again'}`}>
                {cat.glyph} {g.title} <em>{Math.round(goalProgress(g) * 100)}%</em>
              </span>
            )}
            {ms.length > 0 && <span className="lane-dot" />}
          </button>
        )
      })}
      {goals.length > 6 && m === 0 && <div className="lanes-more">+ {goals.length - 6} more goals in the menu</div>}
    </div>
  )
}
