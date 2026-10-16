import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore, CATEGORIES, breakdown, catOf, goalProgress, streakOf } from '../store'
import { MONTHS, MONTHS_SHORT, dateKey, parseKey, todayParts } from '../lib/date'
import { live } from '../lib/nav'
import { yearOf, monthOf } from '../lib/theme'
import Check from './Check'

const ease = [0.22, 1, 0.36, 1]

export default function Sheets() {
  const sheet = useStore((s) => s.sheet)
  const setSheet = useStore((s) => s.setSheet)
  const close = () => setSheet(null)
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && setSheet(null)
    addEventListener('keydown', k)
    return () => removeEventListener('keydown', k)
  }, [setSheet])
  const show = sheet && sheet.type !== 'print'
  return (
    <AnimatePresence>
      {show && (
        <motion.div key="veil" className="veil" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { delay: 0.1 } }} onPointerDown={(e) => e.target === e.currentTarget && close()}>
          <motion.div
            key={sheet.type + (sheet.id || '')}
            className={`sheet sheet-${sheet.type}`}
            role="dialog"
            aria-modal="true"
            initial={{ y: 60, opacity: 0, rotate: -1.5, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.55, ease }}
          >
            <span className="tape" aria-hidden />
            <button className="sheet-x" onClick={close} aria-label="Close">
              ×
            </button>
            {sheet.type === 'add' && <AddChooser />}
            {sheet.type === 'goal' && <GoalForm sheet={sheet} onClose={close} />}
            {sheet.type === 'goalView' && <GoalView id={sheet.id} />}
            {sheet.type === 'plan' && <PlanForm onClose={close} />}
            {sheet.type === 'habits' && <Habits />}
            {sheet.type === 'menu' && <Menu />}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function AddChooser() {
  const setSheet = useStore((s) => s.setSheet)
  const k = Math.floor(live.center)
  const y = yearOf(k)
  const m = monthOf(k)
  return (
    <>
      <h3 className="sheet-h">What would you like to add?</h3>
      <div className="choices">
        <button className="choice" onClick={() => setSheet({ type: 'goal', year: y, start: m })}>
          <span className="ch-ico">◎</span>
          <b>A goal</b>
          <span>Something big for the year — I'll split it into monthly steps.</span>
        </button>
        <button className="choice" onClick={() => setSheet({ type: 'plan' })}>
          <span className="ch-ico">✎</span>
          <b>A plan</b>
          <span>Something to do on a certain day.</span>
        </button>
        <button className="choice" onClick={() => setSheet({ type: 'habits' })}>
          <span className="ch-ico">↻</span>
          <b>A habit</b>
          <span>Something small to do every day.</span>
        </button>
      </div>
    </>
  )
}

function GoalForm({ sheet, onClose }) {
  const goal = useStore((s) => s.goals.find((g) => g.id === sheet.id))
  const addGoal = useStore((s) => s.addGoal)
  const updateGoal = useStore((s) => s.updateGoal)
  const year = goal?.year ?? sheet.year ?? todayParts().y
  const s0 = goal?.start ?? sheet.start ?? 0
  const [title, setTitle] = useState(goal?.title || '')
  const [category, setCategory] = useState(goal?.category || 'craft')
  const [start, setStart] = useState(s0)
  const [end, setEnd] = useState(goal?.end ?? Math.min(11, s0 + 2))
  const [steps, setSteps] = useState('')
  const [picking, setPicking] = useState(false)
  const input = useRef()
  useEffect(() => void setTimeout(() => input.current?.focus(), 350), [])
  const cat = catOf(category)
  const preview = useMemo(() => breakdown(title || 'your goal', start, end, steps.split('\n')), [title, start, end, steps])
  const pick = (m) => {
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
    if (goal) updateGoal(goal.id, { title: title.trim(), category, start, end, milestones: goal.milestones.map((x) => ({ ...x, month: Math.min(end, Math.max(start, x.month)) })) })
    else addGoal({ title: title.trim(), category, start, end, steps: steps.split('\n'), year })
    onClose()
  }
  return (
    <form onSubmit={submit} className="form">
      <h3 className="sheet-h">{goal ? 'Edit goal' : `A new goal for ${year}`}</h3>
      <label className="fl">
        <span>1. What do you want to achieve?</span>
        <input ref={input} className="field big" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Learn to swim" maxLength={70} />
      </label>
      <div className="fl">
        <span>2. What kind of goal is it?</span>
        <div className="chips">
          {CATEGORIES.map((c) => (
            <button type="button" key={c.id} className={`chip ${category === c.id ? 'on' : ''}`} style={{ '--c': c.color }} onClick={() => setCategory(c.id)}>
              {c.glyph} {c.name}
            </button>
          ))}
        </div>
      </div>
      <div className="fl">
        <span>
          3. Which months? <em>{picking ? 'Now tap the last month' : `${MONTHS[start]} to ${MONTHS[end]}`}</em>
        </span>
        <div className="months12">
          {MONTHS_SHORT.map((mm, i) => (
            <button type="button" key={mm} className={`${i >= start && i <= end ? 'in' : ''} ${i === start || i === end ? 'edge' : ''}`} style={{ '--c': cat.color }} onClick={() => pick(i)}>
              {mm}
            </button>
          ))}
        </div>
      </div>
      {!goal && (
        <label className="fl">
          <span>
            4. Steps <em>(optional — one per line)</em>
          </span>
          <textarea className="field" rows={3} value={steps} onChange={(e) => setSteps(e.target.value)} placeholder={'Buy a swimsuit\nTake 5 lessons\nSwim 1 length'} />
        </label>
      )}
      {!goal && (
        <div className="path">
          <span className="path-h">Your monthly steps</span>
          {preview.map((p, i) => (
            <div key={i} className="path-row" style={{ '--c': cat.color }}>
              <b>{MONTHS_SHORT[p.month]}</b>
              {p.title}
            </div>
          ))}
        </div>
      )}
      <div className="form-actions">
        <button type="button" className="btn ghost" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn primary">
          {goal ? 'Save' : 'Add goal'}
        </button>
      </div>
    </form>
  )
}

function GoalView({ id }) {
  const g = useStore((s) => s.goals.find((x) => x.id === id))
  const toggleMilestone = useStore((s) => s.toggleMilestone)
  const addMilestone = useStore((s) => s.addMilestone)
  const removeGoal = useStore((s) => s.removeGoal)
  const setSheet = useStore((s) => s.setSheet)
  const [draft, setDraft] = useState('')
  if (!g) return <p>This goal was removed.</p>
  const cat = catOf(g.category)
  const p = Math.round(goalProgress(g) * 100)
  return (
    <div className="form">
      <div className="gv-head" style={{ '--c': cat.color }}>
        <span className="gv-ico">{cat.glyph}</span>
        <div>
          <h3 className="sheet-h">{g.title}</h3>
          <div className="gv-sub">
            {cat.name} · {MONTHS[g.start]} – {MONTHS[g.end]} {g.year}
          </div>
        </div>
        <div className="gv-pct">{p}%</div>
      </div>
      <div className="gv-bar" style={{ '--c': cat.color }}>
        <i style={{ width: `${p}%` }} />
      </div>
      <ul className="steps big">
        {g.milestones
          .slice()
          .sort((a, b) => a.month - b.month)
          .map((x) => (
            <li key={x.id} className={x.done ? 'done' : ''}>
              <Check checked={x.done} onChange={() => toggleMilestone(g.id, x.id)} label={x.title} color={cat.color} />
              <span>
                {x.title}
                <small>{MONTHS[x.month]}</small>
              </span>
            </li>
          ))}
      </ul>
      <form
        className="inline-add"
        onSubmit={(e) => {
          e.preventDefault()
          if (!draft.trim()) return
          addMilestone(g.id, g.end, draft.trim())
          setDraft('')
        }}
      >
        <input className="field" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add another step…" />
        <button className="btn" type="submit">
          Add
        </button>
      </form>
      <div className="form-actions">
        <button className="btn ghost danger" onClick={() => confirm(`Delete “${g.title}”?`) && (removeGoal(g.id), setSheet(null))}>
          Delete goal
        </button>
        <button className="btn primary" onClick={() => setSheet({ type: 'goal', id: g.id })}>
          Edit
        </button>
      </div>
    </div>
  )
}

function PlanForm({ onClose }) {
  const addTask = useStore((s) => s.addTask)
  const goals = useStore((s) => s.goals)
  const t = todayParts()
  const k = Math.floor(live.center)
  const defDate = yearOf(k) === t.y && monthOf(k) === t.m ? t.key : dateKey(yearOf(k), monthOf(k), 1)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(defDate)
  const [time, setTime] = useState('')
  const [goalId, setGoalId] = useState('')
  const { y, m } = parseKey(date || t.key)
  const active = goals.filter((g) => g.year === y && m >= g.start && m <= g.end)
  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault()
        if (!title.trim() || !date) return
        addTask({ date, time, title: title.trim(), goalId })
        onClose()
      }}
    >
      <h3 className="sheet-h">A new plan</h3>
      <label className="fl">
        <span>What will you do?</span>
        <input autoFocus className="field big" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Call grandma" maxLength={80} />
      </label>
      <div className="row2">
        <label className="fl">
          <span>Which day?</span>
          <input type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="fl">
          <span>
            Time <em>(optional)</em>
          </span>
          <input type="time" className="field" value={time} onChange={(e) => setTime(e.target.value)} />
        </label>
      </div>
      {active.length > 0 && (
        <label className="fl">
          <span>
            Part of a goal? <em>(optional)</em>
          </span>
          <select className="field" value={goalId} onChange={(e) => setGoalId(e.target.value)}>
            <option value="">No</option>
            {active.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="form-actions">
        <button type="button" className="btn ghost" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn primary">
          Add plan
        </button>
      </div>
    </form>
  )
}

const SWATCHES = ['#ff5a4e', '#ffb020', '#2fbf71', '#3d9bff', '#a66bff', '#ff5cf0', '#14b8a6', '#8a6a32']

function Habits() {
  const habits = useStore((s) => s.habits)
  const addHabit = useStore((s) => s.addHabit)
  const removeHabit = useStore((s) => s.removeHabit)
  const toggleHabit = useStore((s) => s.toggleHabit)
  const [name, setName] = useState('')
  const [color, setColor] = useState(SWATCHES[habits.length % SWATCHES.length])
  const t = todayParts()
  return (
    <div className="form">
      <h3 className="sheet-h">My daily habits</h3>
      <p className="sheet-p">Tap the circle when you've done it today. Each day card also has these buttons.</p>
      <ul className="hab-list">
        {habits.map((h) => {
          const s = streakOf(h)
          const on = !!h.log[t.key]
          return (
            <li key={h.id} style={{ '--c': h.color }}>
              <button className={`hbtn big ${on ? 'on' : ''}`} onClick={() => toggleHabit(h.id, t.key)} aria-pressed={on} aria-label={`${h.name} today`}>
                <span>{on ? '✓' : h.name[0].toUpperCase()}</span>
              </button>
              <div className="hab-name">
                <b>{h.name}</b>
                <span>
                  🔥 {s.current} day{s.current === 1 ? '' : 's'} in a row · best {s.best}
                </span>
              </div>
              <button className="btn ghost small" onClick={() => confirm(`Remove “${h.name}”?`) && removeHabit(h.id)}>
                Remove
              </button>
            </li>
          )
        })}
        {habits.length === 0 && <li className="empty">No habits yet. Try “Drink water” or “Walk 20 minutes”.</li>}
      </ul>
      <form
        className="inline-add"
        onSubmit={(e) => {
          e.preventDefault()
          if (!name.trim()) return
          addHabit(name.trim(), color)
          setName('')
          setColor(SWATCHES[(SWATCHES.indexOf(color) + 1) % SWATCHES.length])
        }}
      >
        <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="New habit…" maxLength={30} />
        <button className="btn primary" type="submit">
          Add
        </button>
      </form>
      <div className="swatches">
        {SWATCHES.map((c) => (
          <button key={c} className={color === c ? 'on' : ''} style={{ background: c }} onClick={() => setColor(c)} aria-label={`Colour ${c}`} />
        ))}
      </div>
    </div>
  )
}

function Menu() {
  const setSheet = useStore((s) => s.setSheet)
  const exportData = useStore((s) => s.exportData)
  const importData = useStore((s) => s.importData)
  const loadSample = useStore((s) => s.loadSample)
  const clearYear = useStore((s) => s.clearYear)
  const year = useStore((s) => s.year)
  const file = useRef()
  const doExport = () => {
    const blob = new Blob([JSON.stringify(exportData(), null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `planzer-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }
  const doImport = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    try {
      importData(JSON.parse(await f.text()))
      setSheet(null)
    } catch (err) {
      alert(err.message || 'Could not read that file.')
    }
  }
  const items = [
    ['↻', 'My habits', 'Add or remove daily habits', () => setSheet({ type: 'habits' })],
    ['⎙', 'Print or save as PDF', 'A beautiful paper planner of your year', () => setSheet({ type: 'print' })],
    ['⤓', 'Save a backup', 'Download everything as a file', doExport],
    ['⤒', 'Open a backup', 'Bring back a saved file', () => file.current.click()],
    ['✦', 'Try an example year', `Fill ${year} with sample goals to explore`, () => (loadSample(), setSheet(null))],
    ['⌫', `Clear ${year}`, 'Remove this year’s goals and plans', () => confirm(`Remove all goals and plans in ${year}? Habits stay.`) && (clearYear(), setSheet(null))],
  ]
  return (
    <div className="form">
      <h3 className="sheet-h">Menu</h3>
      <div className="menu-list">
        {items.map(([ico, t, d, fn]) => (
          <button key={t} className="menu-item" onClick={fn}>
            <span className="mi-ico">{ico}</span>
            <span>
              <b>{t}</b>
              <small>{d}</small>
            </span>
          </button>
        ))}
      </div>
      <input ref={file} type="file" accept="application/json" hidden onChange={doImport} />
      <p className="sheet-foot">Everything is saved on this device. Keyboard: ← → to move, Shift + ← → for months, T for today, Y / M to zoom.</p>
    </div>
  )
}
