import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore, CATEGORIES, breakdown, catOf } from '../../store'
import { MONTHS, MONTHS_SHORT, todayParts } from '../../lib/date'
import { ease } from './bits'

export default function Modals() {
  const modal = useStore((s) => s.modal)
  const setModal = useStore((s) => s.setModal)
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && setModal(null)
    addEventListener('keydown', k)
    return () => removeEventListener('keydown', k)
  }, [setModal])
  return (
    <AnimatePresence>
      {modal?.type === 'goal' && (
        <motion.div
          key="goal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4, delay: 0.1 } }}
          transition={{ duration: 0.5 }}
          onPointerDown={(e) => e.target === e.currentTarget && setModal(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'grid', placeItems: 'center', padding: 16, background: 'radial-gradient(80% 80% at 50% 50%, rgba(3,4,10,.55), rgba(3,4,10,.85))', backdropFilter: 'blur(6px)' }}
        >
          <GoalForm id={modal.id} onClose={() => setModal(null)} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function GoalForm({ id, onClose }) {
  const goal = useStore((s) => s.goals.find((g) => g.id === id))
  const year = useStore((s) => s.year)
  const addGoal = useStore((s) => s.addGoal)
  const updateGoal = useStore((s) => s.updateGoal)
  const t = todayParts()
  const startDefault = year === t.y ? t.m : 0
  const [title, setTitle] = useState(goal?.title || '')
  const [why, setWhy] = useState(goal?.why || '')
  const [category, setCategory] = useState(goal?.category || 'craft')
  const [start, setStart] = useState(goal?.start ?? startDefault)
  const [end, setEnd] = useState(goal?.end ?? Math.min(11, startDefault + 2))
  const [steps, setSteps] = useState('')
  const [picking, setPicking] = useState(false)
  const input = useRef()
  useEffect(() => {
    setTimeout(() => input.current?.focus(), 450)
  }, [])

  const cat = catOf(category)
  const preview = useMemo(() => breakdown(title || 'this goal', start, end, steps.split('\n')), [title, start, end, steps])

  const pickMonth = (m) => {
    if (!picking) {
      setStart(m)
      setEnd(m)
      setPicking(true)
    } else {
      if (m < start) {
        setEnd(start)
        setStart(m)
      } else setEnd(m)
      setPicking(false)
    }
  }

  const submit = (e) => {
    e.preventDefault()
    if (!title.trim()) return input.current?.focus()
    if (goal) {
      const milestones = goal.milestones.map((ms) => ({ ...ms, month: Math.min(end, Math.max(start, ms.month)) }))
      updateGoal(goal.id, { title: title.trim(), why: why.trim(), category, start, end, milestones })
    } else addGoal({ title: title.trim(), why: why.trim(), category, start, end, steps: steps.split('\n') })
    onClose()
  }

  return (
    <motion.form
      onSubmit={submit}
      className="glass scroll"
      initial={{ opacity: 0, y: 40, scale: 0.94, rotateX: 12, filter: 'blur(12px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: 30, scale: 0.96, filter: 'blur(10px)' }}
      transition={{ duration: 0.8, ease }}
      style={{ width: 'min(720px, 100%)', maxHeight: '92vh', padding: 'clamp(22px, 4vw, 40px)', transformPerspective: 1200 }}
    >
      <style>{`
        .gf-title { width: 100%; background: none; border: 0; border-bottom: 1px solid var(--line-2); outline: none; font-family: var(--serif); font-size: clamp(28px, 4vw, 40px); font-weight: 300; padding: 6px 0 10px; color: var(--ivory); transition: border-color .4s; }
        .gf-title:focus { border-color: rgba(255,236,190,.8); }
        .gf-title::placeholder, .gf-why::placeholder { color: var(--faint); font-style: italic; }
        .gf-why { width: 100%; background: none; border: 0; outline: none; font-family: var(--serif); font-style: italic; font-size: 18px; color: var(--mute); padding: 10px 0 0; }
        .gf-label { margin: 26px 0 12px; }
        .gf-cats { display: flex; flex-wrap: wrap; gap: 8px; }
        .gf-cat { padding: 9px 14px; border-radius: 999px; font-size: 12px; border: 1px solid var(--line); color: var(--mute); transition: all .4s var(--ease); }
        .gf-cat.on { color: #140e04; font-weight: 600; }
        .gf-months { display: grid; grid-template-columns: repeat(12, 1fr); gap: 4px; }
        .gf-m { position: relative; padding: 12px 0 10px; border-radius: 10px; font-size: 10px; letter-spacing: .14em; color: var(--faint); transition: all .35s var(--ease); }
        .gf-m:hover { color: var(--ivory); background: rgba(230,201,138,.06); }
        .gf-m.in { color: var(--ivory); }
        .gf-m.edge { color: #140e04; font-weight: 600; }
        .gf-prev { margin-top: 10px; border-left: 1px solid var(--line-2); padding-left: 18px; }
        .gf-prev div { position: relative; display: flex; gap: 14px; padding: 5px 0; font-size: 13px; color: var(--ivory); }
        .gf-prev div::before { content: ''; position: absolute; left: -22px; top: 11px; width: 7px; height: 7px; border-radius: 50%; background: var(--dot); box-shadow: 0 0 10px var(--dot); }
        .gf-prev span { width: 36px; flex: none; font-size: 10px; letter-spacing: .18em; color: var(--gold); padding-top: 2px; }
        @media (max-width: 600px) { .gf-months { grid-template-columns: repeat(6, 1fr); } }
      `}</style>
      <div className="eyebrow">{goal ? 'Refine a star' : 'Chart a new star'}</div>
      <input ref={input} className="gf-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What will this year hold?" maxLength={80} />
      <input className="gf-why" value={why} onChange={(e) => setWhy(e.target.value)} placeholder="Why it matters (optional) — your north star when motivation dims" maxLength={140} />

      <div className="eyebrow gf-label">Constellation</div>
      <div className="gf-cats">
        {CATEGORIES.map((c) => (
          <button
            type="button"
            key={c.id}
            className={`gf-cat ${category === c.id ? 'on' : ''}`}
            onClick={() => setCategory(c.id)}
            style={category === c.id ? { background: c.color, borderColor: c.color, boxShadow: `0 0 24px -6px ${c.color}` } : undefined}
          >
            {c.glyph} {c.name}
          </button>
        ))}
      </div>

      <div className="eyebrow gf-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Its orbit — the months it lives in</span>
        <span style={{ color: 'var(--faint)' }}>{picking ? 'now tap the last month' : `${MONTHS[start]} → ${MONTHS[end]}`}</span>
      </div>
      <div className="gf-months">
        {MONTHS_SHORT.map((m, i) => {
          const inR = i >= start && i <= end
          const edge = i === start || i === end
          return (
            <button
              type="button"
              key={m}
              className={`gf-m ${inR ? 'in' : ''} ${edge ? 'edge' : ''}`}
              onClick={() => pickMonth(i)}
              style={{
                background: edge ? cat.color : inR ? `${cat.color}26` : undefined,
                boxShadow: edge ? `0 0 20px -4px ${cat.color}` : undefined,
              }}
            >
              {m.toUpperCase()}
            </button>
          )
        })}
      </div>

      {!goal && (
        <>
          <div className="eyebrow gf-label">Steps (optional) — one per line</div>
          <textarea className="field" rows={4} value={steps} onChange={(e) => setSteps(e.target.value)} placeholder={'Outline the story\nDraft chapter one\nFinish the first draft\n…Planzer spreads them across your months'} />
          <div className="eyebrow gf-label">Your monthly path</div>
          <div className="gf-prev" style={{ '--dot': cat.color }}>
            <AnimatePresence initial={false}>
              {preview.map((p, i) => (
                <motion.div key={`${p.month}-${p.title}-${i}`} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.45, ease, delay: i * 0.03 }}>
                  <span>{MONTHS_SHORT[p.month].toUpperCase()}</span>
                  {p.title}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 30 }}>
        <button type="button" className="btn ghost" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn solid">
          ✦ {goal ? 'Save' : 'Place it in the sky'}
        </button>
      </div>
    </motion.form>
  )
}
