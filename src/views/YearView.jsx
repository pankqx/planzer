import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore, goalProgress, catOf } from '../store'
import { MONTHS, MONTHS_SHORT, toRoman, todayParts, daysIn } from '../lib/date'
import { Ring, StarCheck, Rise, ease, panelIn, panelInLeft } from '../ui/bits'
import Magnetic from '../ui/Magnetic'

export default function YearView() {
  const year = useStore((s) => s.year)
  const goals = useStore((s) => s.goals)
  const tasks = useStore((s) => s.tasks)
  const yearGoals = useMemo(() => goals.filter((g) => g.year === year), [goals, year])
  const t = todayParts()

  const total = new Date(year, 1, 29).getDate() === 29 ? 366 : 365
  let elapsed = 0
  if (year < t.y) elapsed = total
  else if (year === t.y) {
    for (let m = 0; m < t.m; m++) elapsed += daysIn(year, m)
    elapsed += t.d
  }
  const ms = yearGoals.flatMap((g) => g.milestones)
  const overall = ms.length ? ms.filter((m) => m.done).length / ms.length : 0
  const yearTasks = tasks.filter((x) => x.date.startsWith(String(year)))

  return (
    <>
      <style>{`
        .yv-hero { position: fixed; z-index: 10; left: 34px; top: 92px; max-width: 640px; pointer-events: none; text-shadow: 0 2px 24px rgba(3,4,10,.9); }
        .yv-row { display: flex; align-items: flex-end; gap: 26px; }
        .yv-num { font-family: var(--display); font-size: clamp(48px, 5.6vw, 84px); line-height: .9; letter-spacing: .06em; margin-top: 10px; white-space: nowrap; }
        .yv-sub { font-family: var(--serif); font-style: italic; font-weight: 300; font-size: 19px; color: var(--ivory); opacity: .82; margin-top: 10px; }
        .yv-stats { display: flex; gap: 22px; padding-bottom: 6px; pointer-events: auto; }
        .yv-stat { display: flex; align-items: center; gap: 12px; }
        .yv-stat .v { font-family: var(--serif); font-size: 15px; color: var(--gold-hi); }
        .yv-stat .k { font-size: 9.5px; letter-spacing: .26em; text-transform: uppercase; color: var(--faint); line-height: 1.6; }
        .yv-hint { position: fixed; z-index: 10; left: 34px; bottom: 34px; font-size: 10px; letter-spacing: .3em; text-transform: uppercase; color: var(--faint); display: flex; gap: 18px; }
        .yv-hint span::before { content: '✦ '; color: var(--gold); }
        .ledger { position: fixed; z-index: 20; right: 26px; top: 96px; bottom: 100px; width: 392px; display: flex; flex-direction: column; padding: 26px 22px 18px; }
        .ledger h2 { font-family: var(--display); font-weight: 400; font-size: 30px; letter-spacing: .08em; margin-top: 8px; }
        .ledger .list { flex: 1; margin: 18px -8px 0; padding: 0 8px; }
        @media (max-width: 1100px) { .yv-hero { top: 90px; } .yv-num { font-size: 64px; } .yv-stats { display: none; } }
        @media (max-width: 860px) {
          .yv-hero { left: 18px; top: 74px; } .yv-num { font-size: 46px; } .yv-sub { display: none; } .yv-hint { display: none; }
          .ledger { left: 10px; right: 10px; width: auto; top: auto; bottom: 78px; height: 44vh; }
        }
      `}</style>

      <motion.div className="yv-hero" {...panelInLeft}>
        <div className="eyebrow">
          The Year · {MONTHS.length} worlds in orbit
        </div>
        <div className="yv-row">
        <div className="yv-num">
          <Rise text={toRoman(year)} delay={0.5} stagger={0.07} letterClass="gold-text" />
        </div>
        <YearStats elapsed={elapsed} total={total} overall={overall} plans={yearTasks.length} />
        </div>
        <div className="yv-sub">
          {year === t.y ? (
            <>
              {total - elapsed} days remain — {Math.round((elapsed / total) * 100)}% of the orbit is behind you.
            </>
          ) : year < t.y ? (
            <>A completed orbit. Look back at what you charted.</>
          ) : (
            <>An unwritten sky. Chart it before it arrives.</>
          )}
        </div>
      </motion.div>

      <motion.div className="yv-hint" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 2.4, duration: 1.4 } }}>
        <span>Drag to turn the heavens</span>
        <span>Touch a world to enter its month</span>
      </motion.div>

      <Ledger goals={yearGoals} />
    </>
  )
}

function YearStats({ elapsed, total, overall, plans }) {
  return (
        <div className="yv-stats">
          <div className="yv-stat">
            <Ring value={elapsed / total} size={52}>
              <span style={{ fontSize: 10, color: 'var(--gold-hi)' }}>{Math.round((elapsed / total) * 100)}%</span>
            </Ring>
            <div className="k">
              Year
              <br />
              elapsed
            </div>
          </div>
          <div className="yv-stat">
            <Ring value={overall} size={52} color="#fff2cc">
              <span style={{ fontSize: 10, color: 'var(--gold-hi)' }}>{Math.round(overall * 100)}%</span>
            </Ring>
            <div className="k">
              Milestones
              <br />
              reached
            </div>
          </div>
          <div className="yv-stat">
            <div className="v" style={{ fontSize: 30, fontFamily: 'var(--display)' }}>
              {plans}
            </div>
            <div className="k">
              Plans
              <br />
              scheduled
            </div>
          </div>
        </div>
  )
}

function Ledger({ goals }) {
  const setModal = useStore((s) => s.setModal)
  const loadSample = useStore((s) => s.loadSample)
  const year = useStore((s) => s.year)
  return (
    <motion.aside className="ledger glass" {...panelIn}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div className="eyebrow">The Ledger of Intentions</div>
          <h2>Goals of {year}</h2>
        </div>
        <Magnetic>
          <button className="btn small" onClick={() => setModal({ type: 'goal' })} data-cursor="New goal">
            ✦ Add
          </button>
        </Magnetic>
      </div>
      <div className="list scroll">
        {goals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 12px' }}>
            <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 23, lineHeight: 1.35, color: 'var(--ivory)' }}>
              Your sky is still empty.
              <br />
              Name the first star.
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--mute)', margin: '14px 0 24px', lineHeight: 1.7 }}>
              A goal becomes moons around the months it lives in — Planzer breaks it into a monthly path for you.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
              <button className="btn solid" onClick={() => setModal({ type: 'goal' })}>
                ✦ Chart a goal
              </button>
              <button className="btn ghost small" onClick={loadSample}>
                or explore a sample year
              </button>
            </div>
          </div>
        ) : (
          goals.map((g, i) => <GoalRow key={g.id} g={g} i={i} />)
        )}
      </div>
    </motion.aside>
  )
}

function GoalRow({ g, i }) {
  const focusGoal = useStore((s) => s.focusGoal)
  const setFocusGoal = useStore((s) => s.setFocusGoal)
  const toggleMilestone = useStore((s) => s.toggleMilestone)
  const removeGoal = useStore((s) => s.removeGoal)
  const setModal = useStore((s) => s.setModal)
  const openMonth = useStore((s) => s.openMonth)
  const [hover, setHover] = useState(false)
  const cat = catOf(g.category)
  const p = goalProgress(g)
  const open = focusGoal === g.id
  const t = todayParts()
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.9, ease, delay: 0.5 + i * 0.07 }}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      style={{
        borderRadius: 18,
        padding: '14px 14px 12px',
        marginBottom: 8,
        background: open ? 'rgba(230,201,138,.07)' : hover ? 'rgba(230,201,138,.04)' : 'transparent',
        border: `1px solid ${open ? 'rgba(230,201,138,.28)' : 'rgba(230,201,138,.07)'}`,
        transition: 'background .4s, border-color .4s',
      }}
    >
      <button onClick={() => setFocusGoal(g.id)} style={{ display: 'flex', width: '100%', gap: 12, alignItems: 'center', textAlign: 'left' }} data-cursor={open ? 'Close' : 'Focus'}>
        <span style={{ width: 34, height: 34, flex: 'none', borderRadius: '50%', display: 'grid', placeItems: 'center', color: cat.color, background: `radial-gradient(circle at 35% 30%, ${cat.color}33, transparent 70%)`, border: `1px solid ${cat.color}55`, boxShadow: open ? `0 0 22px -4px ${cat.color}` : 'none', transition: 'box-shadow .5s' }}>
          {cat.glyph}
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontFamily: 'var(--serif)', fontSize: 19, lineHeight: 1.15, color: 'var(--ivory)' }}>{g.title}</span>
          <span style={{ display: 'block', fontSize: 9.5, letterSpacing: '.24em', textTransform: 'uppercase', color: 'var(--faint)', marginTop: 4 }}>
            {cat.name} · {MONTHS_SHORT[g.start]}
            {g.end !== g.start ? ` – ${MONTHS_SHORT[g.end]}` : ''}
          </span>
        </span>
        <Ring value={p} size={40} stroke={1.6} color={cat.color}>
          <span style={{ fontSize: 9.5, color: 'var(--ivory)' }}>{Math.round(p * 100)}</span>
        </Ring>
      </button>
      {/* the goal's path across the twelve months */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 3, marginTop: 12 }}>
        {MONTHS_SHORT.map((_, m) => {
          const inSpan = m >= g.start && m <= g.end
          const mms = g.milestones.filter((x) => x.month === m)
          const done = mms.length && mms.every((x) => x.done)
          const now = m === t.m && g.year === t.y
          return (
            <span
              key={m}
              title={MONTHS[m]}
              style={{
                height: 4,
                borderRadius: 3,
                background: !inSpan ? 'rgba(244,236,220,.06)' : done ? cat.color : `${cat.color}40`,
                boxShadow: done ? `0 0 8px ${cat.color}` : 'none',
                outline: now ? '1px solid rgba(255,242,204,.7)' : 'none',
                outlineOffset: 2,
              }}
            />
          )
        })}
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.6, ease }} style={{ overflow: 'hidden' }}>
            {g.why && <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 16, color: 'var(--mute)', margin: '14px 2px 4px' }}>“{g.why}”</p>}
            <div style={{ marginTop: 10 }}>
              {g.milestones
                .slice()
                .sort((a, b) => a.month - b.month)
                .map((ms) => (
                  <div key={ms.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '7px 2px' }}>
                    <StarCheck checked={ms.done} onChange={() => toggleMilestone(g.id, ms.id)} color={cat.color} size={20} label={ms.title} />
                    <button onClick={() => openMonth(ms.month)} style={{ width: 34, fontSize: 9.5, letterSpacing: '.18em', color: cat.color, textAlign: 'left' }} data-cursor="Open">
                      {MONTHS_SHORT[ms.month].toUpperCase()}
                    </button>
                    <span style={{ fontSize: 13, color: ms.done ? 'var(--faint)' : 'var(--ivory)', textDecoration: ms.done ? 'line-through' : 'none', textDecorationColor: 'rgba(230,201,138,.5)' }}>{ms.title}</span>
                  </div>
                ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn small" onClick={() => setModal({ type: 'goal', id: g.id })}>
                Edit
              </button>
              <button className="btn small ghost" onClick={() => confirm(`Remove “${g.title}” from the sky?`) && removeGoal(g.id)}>
                Remove
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
