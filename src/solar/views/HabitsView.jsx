import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore, streakOf } from '../../store'
import { MONTHS, dateKey, daysIn, todayParts } from '../../lib/date'
import { ease, panelInLeft, Rise } from '../ui/bits'

const SWATCHES = ['#e6c98a', '#a8f0c6', '#9fc4ff', '#c7b7ff', '#f2a7c3', '#ff9f6e', '#ffd27a', '#bfe9ff']

export default function HabitsView() {
  const habits = useStore((s) => s.habits)
  const t = todayParts()
  const [ym, setYm] = useState({ y: t.y, m: t.m })
  const [hot, setHot] = useState(null)
  const [vw, setVw] = useState({ w: innerWidth, h: innerHeight })
  useEffect(() => {
    const r = () => setVw({ w: innerWidth, h: innerHeight })
    addEventListener('resize', r)
    return () => removeEventListener('resize', r)
  }, [])
  const narrow = vw.w < 860
  const size = narrow ? Math.min(vw.w - 20, vw.h * 0.5) : Math.min(vw.h * 0.8, vw.w - 800, 720)
  const shift = (k) => setYm(({ y, m }) => ({ y: m + k > 11 ? y + 1 : m + k < 0 ? y - 1 : y, m: (m + k + 12) % 12 }))

  return (
    <>
      <style>{`
        .hv-panel { position: fixed; z-index: 20; left: 26px; top: 92px; bottom: 96px; width: 340px; display: flex; flex-direction: column; padding: 26px 22px 18px; }
        .hv-panel h2 { font-family: var(--display); font-weight: 400; font-size: 34px; letter-spacing: .06em; margin: 6px 0 4px; }
        .hv-orbit { position: fixed; z-index: 15; left: 50%; top: 50%; transform: translate(-50%, -52%); }
        .hv-legend { position: fixed; z-index: 15; right: 34px; top: 50%; transform: translateY(-50%); width: 230px; }
        .hab { display: flex; align-items: center; gap: 12px; padding: 12px 10px; border-radius: 16px; transition: background .4s; }
        .hab:hover, .hab.on { background: rgba(230,201,138,.06); }
        .hab .x { opacity: 0; transition: opacity .3s; color: var(--faint); }
        .hab:hover .x { opacity: 1; }
        .sw { width: 18px; height: 18px; border-radius: 50%; transition: transform .4s var(--ease), box-shadow .4s; }
        .sw.on { transform: scale(1.18); }
        .hv-nav { display: flex; align-items: center; gap: 10px; }
        .hv-nav button { width: 30px; height: 30px; border-radius: 50%; color: var(--gold); border: 1px solid var(--line); }
        @media (max-width: 1240px) { .hv-legend { display: none; } }
        @media (max-width: 860px) {
          .hv-orbit { top: 64px; transform: translateX(-50%); }
          .hv-panel { left: 8px; right: 8px; width: auto; top: auto; height: 42vh; bottom: 74px; }
        }
      `}</style>

      <motion.aside className="hv-panel glass" {...panelInLeft}>
        <div className="eyebrow">Rituals in orbit</div>
        <h2>Habits</h2>
        <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--mute)', fontSize: 16, marginBottom: 12 }}>Small lights, kept daily, become constellations.</p>
        <div className="scroll" style={{ flex: 1, margin: '0 -8px', padding: '0 8px' }}>
          {habits.map((h, i) => (
            <HabitRow key={h.id} h={h} i={i} hot={hot === h.id} setHot={setHot} />
          ))}
          {habits.length === 0 && <p style={{ fontSize: 13, color: 'var(--faint)', padding: '20px 4px', lineHeight: 1.7 }}>No rituals yet. Add one below — morning pages, a walk, an hour of code — and tap a bead on its ring each day you keep it.</p>}
        </div>
        <AddHabit />
      </motion.aside>

      <div className="hv-orbit">
        <motion.div initial={{ opacity: 0, scale: 0.86, rotate: -25, filter: 'blur(12px)' }} animate={{ opacity: 1, scale: 1, rotate: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, scale: 0.9, rotate: 15, filter: 'blur(10px)' }} transition={{ duration: 1.6, ease, delay: 0.2 }}>
          <Orbit size={size} y={ym.y} m={ym.m} hot={hot} setHot={setHot} shift={shift} />
        </motion.div>
      </div>

      <motion.div className="hv-legend" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1.1, ease, delay: 0.7 }}>
        <div className="eyebrow">How to read the orbit</div>
        <p style={{ fontSize: 12.5, lineHeight: 1.8, color: 'var(--mute)', marginTop: 10 }}>
          Each ring is a habit; each bead a day of {MONTHS[ym.m]}, beginning at the top and turning clockwise like the year. A lit bead is a promise kept. The gold spoke marks today.
        </p>
      </motion.div>
    </>
  )
}

function Orbit({ size, y, m, hot, setHot, shift }) {
  const habits = useStore((s) => s.habits)
  const toggleHabit = useStore((s) => s.toggleHabit)
  const t = todayParts()
  const n = daysIn(y, m)
  const c = size / 2
  const inner = size * 0.2
  const outer = size / 2 - 34
  const H = Math.max(habits.length, 1)
  const step = H > 1 ? (outer - inner) / (H - 1) : 0
  const ringR = (i) => (H === 1 ? (inner + outer) / 2 : inner + i * step)
  const dotR = Math.max(2.6, Math.min(7, ((2 * Math.PI * inner) / n) * 0.3, step * 0.32 || 7))
  const ang = (d) => -Math.PI / 2 + ((d - 0.5) / n) * Math.PI * 2
  const isNow = y === t.y && m === t.m
  const todayKeys = habits.filter((h) => h.log[t.key]).length
  const hotH = habits.find((h) => h.id === hot)
  const hotStreak = hotH ? streakOf(hotH) : null
  const hotCount = hotH ? Object.keys(hotH.log).filter((k) => k.startsWith(`${y}-${String(m + 1).padStart(2, '0')}`)).length : 0

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ overflow: 'visible' }}>
        <defs>
          <filter id="bead-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="hv-core">
            <stop offset="0" stopColor="rgba(230,201,138,.16)" />
            <stop offset="1" stopColor="rgba(230,201,138,0)" />
          </radialGradient>
        </defs>
        <circle cx={c} cy={c} r={inner - 14} fill="url(#hv-core)" />
        {/* day numerals and week ticks around the rim */}
        {Array.from({ length: n }, (_, k) => {
          const d = k + 1
          const a = ang(d)
          const r = outer + 20
          const show = d === 1 || d % 5 === 0 || (isNow && d === t.d)
          return (
            <g key={d}>
              <line x1={c + Math.cos(a) * (outer + 9)} y1={c + Math.sin(a) * (outer + 9)} x2={c + Math.cos(a) * (outer + (show ? 13 : 11))} y2={c + Math.sin(a) * (outer + (show ? 13 : 11))} stroke="rgba(230,201,138,.4)" />
              {show && (
                <text x={c + Math.cos(a) * r} y={c + Math.sin(a) * r} fill={isNow && d === t.d ? '#fff2cc' : 'rgba(230,201,138,.7)'} fontSize="10" fontFamily="var(--sans)" textAnchor="middle" dominantBaseline="middle" letterSpacing=".05em">
                  {d}
                </text>
              )}
            </g>
          )
        })}
        {isNow && (
          <motion.line
            x1={c + Math.cos(ang(t.d)) * (inner - 18)}
            y1={c + Math.sin(ang(t.d)) * (inner - 18)}
            x2={c + Math.cos(ang(t.d)) * (outer + 8)}
            y2={c + Math.sin(ang(t.d)) * (outer + 8)}
            stroke="#fff2cc"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.7 }}
            transition={{ duration: 1.8, ease, delay: 0.8 }}
            style={{ filter: 'drop-shadow(0 0 4px #e6c98a)' }}
          />
        )}
        {habits.map((h, i) => {
          const r = ringR(i)
          const dim = hot && hot !== h.id
          return (
            <g key={h.id} onPointerEnter={() => setHot(h.id)} onPointerLeave={() => setHot(null)} style={{ opacity: dim ? 0.22 : 1, transition: 'opacity .5s' }}>
              <motion.circle cx={c} cy={c} r={r} fill="none" stroke={h.color} strokeOpacity={hot === h.id ? 0.55 : 0.16} strokeWidth="1" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.6, ease, delay: 0.3 + i * 0.12 }} />
              {Array.from({ length: n }, (_, k) => {
                const d = k + 1
                const key = dateKey(y, m, d)
                const on = !!h.log[key]
                const future = new Date(y, m, d) > new Date(t.y, t.m, t.d)
                const a = ang(d)
                const x = c + Math.cos(a) * r
                const yy = c + Math.sin(a) * r
                return (
                  <motion.circle
                    key={key}
                    cx={x}
                    cy={yy}
                    initial={{ r: 0 }}
                    animate={{ r: on ? dotR : dotR * 0.55 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 16, delay: on ? 0 : 0 }}
                    fill={on ? h.color : future ? 'rgba(244,236,220,.05)' : 'rgba(244,236,220,.12)'}
                    stroke={on ? 'none' : future ? 'none' : `${h.color}66`}
                    strokeWidth=".8"
                    filter={on ? 'url(#bead-glow)' : undefined}
                    style={{ cursor: future ? 'default' : 'none' }}
                    onClick={() => !future && toggleHabit(h.id, key)}
                    data-hover={future ? undefined : ''}
                  >
                    <title>
                      {h.name} · {MONTHS[m]} {d}
                    </title>
                  </motion.circle>
                )
              })}
            </g>
          )
        })}
      </svg>
      {/* the heart of the orbit */}
      <div style={{ position: 'absolute', left: c - inner + 18, top: c - inner + 18, width: (inner - 18) * 2, height: (inner - 18) * 2, borderRadius: '50%', display: 'grid', placeItems: 'center', textAlign: 'center', pointerEvents: 'none' }}>
        <AnimatePresence mode="wait">
          {hotH ? (
            <motion.div key={hotH.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.35, ease }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: Math.max(15, inner * 0.17), color: hotH.color, lineHeight: 1.1, padding: '0 6px' }}>{hotH.name}</div>
              <div style={{ fontFamily: 'var(--display)', fontSize: inner * 0.42, lineHeight: 1, marginTop: 6, color: 'var(--gold-hi)' }}>{hotStreak.current}</div>
              <div className="eyebrow" style={{ fontSize: 8.5 }}>
                day streak · {hotCount} this month
              </div>
            </motion.div>
          ) : (
            <motion.div key="core" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.35, ease }} style={{ pointerEvents: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <button onClick={() => shift(-1)} style={{ color: 'var(--gold)', fontSize: 16, padding: 4 }} aria-label="Previous month">
                  ‹
                </button>
                <div className="eyebrow" style={{ fontSize: 9 }}>
                  {MONTHS[m]} {y}
                </div>
                <button onClick={() => shift(1)} style={{ color: 'var(--gold)', fontSize: 16, padding: 4 }} aria-label="Next month">
                  ›
                </button>
              </div>
              {isNow ? (
                <>
                  <div style={{ fontFamily: 'var(--display)', fontSize: inner * 0.5, lineHeight: 1.05 }} className="gold-text">
                    {todayKeys}/{habits.length}
                  </div>
                  <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14, color: 'var(--mute)' }}>kept today</div>
                </>
              ) : (
                <div style={{ fontFamily: 'var(--display)', fontSize: inner * 0.28, marginTop: 4 }} className="gold-text">
                  <Rise text={MONTHS[m].slice(0, 3).toUpperCase()} />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function HabitRow({ h, i, hot, setHot }) {
  const toggleHabit = useStore((s) => s.toggleHabit)
  const removeHabit = useStore((s) => s.removeHabit)
  const t = todayParts()
  const s = streakOf(h)
  const done = !!h.log[t.key]
  return (
    <motion.div
      className={`hab ${hot ? 'on' : ''}`}
      onPointerEnter={() => setHot(h.id)}
      onPointerLeave={() => setHot(null)}
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, ease, delay: 0.4 + i * 0.07 }}
    >
      <button
        onClick={() => toggleHabit(h.id, t.key)}
        aria-label={`Mark ${h.name} for today`}
        data-cursor={done ? 'Undo' : 'Keep'}
        style={{ width: 38, height: 38, flex: 'none', borderRadius: '50%', border: `1px solid ${h.color}`, background: done ? h.color : 'transparent', boxShadow: done ? `0 0 22px -2px ${h.color}` : 'none', color: done ? '#140e04' : h.color, transition: 'all .5s var(--ease)', fontSize: 14 }}
      >
        {done ? '✦' : '○'}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 18, lineHeight: 1.15 }}>{h.name}</div>
        <div style={{ fontSize: 10, letterSpacing: '.16em', color: 'var(--faint)', marginTop: 4, textTransform: 'uppercase' }}>
          best {s.best} · {s.total} kept
        </div>
      </div>
      <div style={{ textAlign: 'center', minWidth: 40 }}>
        <div style={{ fontFamily: 'var(--display)', fontSize: 26, lineHeight: 1, color: s.current ? 'var(--gold-hi)' : 'var(--faint)', textShadow: s.current >= 7 ? `0 0 18px ${h.color}` : 'none' }}>{s.current}</div>
        <div style={{ fontSize: 8, letterSpacing: '.24em', color: 'var(--faint)' }}>STREAK</div>
      </div>
      <button className="x" onClick={() => confirm(`Remove “${h.name}”?`) && removeHabit(h.id)} aria-label="Remove habit">
        ×
      </button>
    </motion.div>
  )
}

function AddHabit() {
  const addHabit = useStore((s) => s.addHabit)
  const habits = useStore((s) => s.habits)
  const [name, setName] = useState('')
  const [color, setColor] = useState(SWATCHES[habits.length % SWATCHES.length])
  const used = useMemo(() => new Set(habits.map((h) => h.color)), [habits])
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!name.trim()) return
        addHabit(name.trim(), color)
        setName('')
        setColor(SWATCHES.find((s) => !used.has(s) && s !== color) || SWATCHES[0])
      }}
      style={{ borderTop: '1px solid var(--line)', paddingTop: 14, marginTop: 8 }}
    >
      <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="A new ritual…" maxLength={40} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {SWATCHES.map((s) => (
            <button type="button" key={s} className={`sw ${color === s ? 'on' : ''}`} onClick={() => setColor(s)} style={{ background: s, boxShadow: color === s ? `0 0 0 2px #03040a, 0 0 0 3px ${s}, 0 0 14px ${s}` : 'none', opacity: used.has(s) && color !== s ? 0.45 : 1 }} aria-label={`Color ${s}`} />
          ))}
        </div>
        <button className="btn solid small" type="submit">
          Add
        </button>
      </div>
    </form>
  )
}
