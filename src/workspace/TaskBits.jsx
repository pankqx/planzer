import { useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { parseQuick } from '../lib/quickadd'
import { prio, PRIORITIES, dueLabel, recurLabel, fmtTime, REMIND_OPTIONS, remindLabel } from '../lib/tasks'
import { catOf } from '../store'

export const Icon = {
  cal: (
    <svg viewBox="0 0 24 24">
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  ),
  flag: (
    <svg viewBox="0 0 24 24">
      <path d="M5 21V4M5 4h11l-2 4 2 4H5" />
    </svg>
  ),
  bell: (
    <svg viewBox="0 0 24 24">
      <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0" />
    </svg>
  ),
  repeat: (
    <svg viewBox="0 0 24 24">
      <path d="M4 12a7 7 0 0 1 12-5l2 2M20 12a7 7 0 0 1-12 5l-2-2M18 4v5h-5M6 20v-5h5" />
    </svg>
  ),
  tag: (
    <svg viewBox="0 0 24 24">
      <path d="M3 12V4h8l10 10-8 8z" />
      <circle cx="7.5" cy="8.5" r="1.4" />
    </svg>
  ),
  inbox: (
    <svg viewBox="0 0 24 24">
      <path d="M3 13l3-8h12l3 8v6H3zM3 13h5l1 3h6l1-3h5" />
    </svg>
  ),
  sun: (
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
    </svg>
  ),
  up: (
    <svg viewBox="0 0 24 24">
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 10h17M8 14h3M8 17h6" />
    </svg>
  ),
  done: (
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.7 2.7L16.5 9" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </svg>
  ),
  sub: (
    <svg viewBox="0 0 24 24">
      <path d="M6 4v9a3 3 0 0 0 3 3h9M15 13l3 3-3 3" />
    </svg>
  ),
  note: (
    <svg viewBox="0 0 24 24">
      <path d="M6 3h9l4 4v14H6zM15 3v4h4M9 12h7M9 16h5" />
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
  goal: (
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  ),
}

/** Round Todoist checkbox, tinted by priority. Completing it plays a little pop. */
export function TaskCheck({ t, onToggle }) {
  const p = prio(t.priority)
  return (
    <button
      className={`tcheck ${t.done ? 'on' : ''}`}
      style={{ '--pc': p.color }}
      role="checkbox"
      aria-checked={t.done}
      aria-label={`${t.done ? 'Uncomplete' : 'Complete'} ${t.title}`}
      onClick={(e) => {
        e.stopPropagation()
        onToggle()
      }}
    >
      <svg viewBox="0 0 24 24">
        <path d="M7 12.5l3.2 3.2L17 9" />
      </svg>
    </button>
  )
}

export function DueChip({ t }) {
  const d = dueLabel(t.date, t.time)
  if (!d) return null
  return (
    <span className={`chip-due ${t.done ? '' : d.tone}`}>
      {Icon.cal}
      {d.text}
      {t.recur && <i title={recurLabel(t.recur)}>{Icon.repeat}</i>}
    </span>
  )
}

/** One task line, as in Todoist: check · title · description · date · labels · goal · subtasks. */
export function TaskRow({ t, showDate = true, depth = 0 }) {
  const toggleTask = useStore((s) => s.toggleTask)
  const openTask = useStore((s) => s.openTask)
  const tasks = useStore((s) => s.tasks)
  const goals = useStore((s) => s.goals)
  const kids = useMemo(() => tasks.filter((x) => x.parentId === t.id), [tasks, t.id])
  const [open, setOpen] = useState(false)
  const [popping, setPopping] = useState(false)
  const g = t.goalId ? goals.find((x) => x.id === t.goalId) : null
  const toggle = () => {
    if (!t.done) {
      setPopping(true)
      setTimeout(() => {
        setPopping(false)
        toggleTask(t.id)
      }, 380)
    } else toggleTask(t.id)
  }
  return (
    <motion.li layout="position" className={`trow ${t.done || popping ? 'done' : ''} ${popping ? 'popping' : ''}`} style={{ '--depth': depth }} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 30, height: 0, paddingTop: 0, paddingBottom: 0 }} transition={{ duration: 0.3 }}>
      <div className="trow-main" onClick={() => openTask(t.id)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && openTask(t.id)}>
        <TaskCheck t={{ ...t, done: t.done || popping }} onToggle={toggle} />
        <div className="trow-body">
          <div className="trow-title">{t.title}</div>
          {t.desc && <div className="trow-desc">{t.desc.split('\n')[0]}</div>}
          <div className="trow-meta">
            {kids.length > 0 && (
              <button
                className="chip-sub"
                onClick={(e) => {
                  e.stopPropagation()
                  setOpen(!open)
                }}
              >
                {Icon.sub}
                {kids.filter((k) => k.done).length}/{kids.length}
              </button>
            )}
            {showDate && <DueChip t={t} />}
            {!showDate && t.time && <span className="chip-due">{fmtTime(t.time)}</span>}
            {t.remind != null && <span className="chip-ico" title={remindLabel(t.remind)}>{Icon.bell}</span>}
            {t.labels?.map((l) => (
              <span key={l} className="chip-label">
                @{l}
              </span>
            ))}
            {g && (
              <span className="chip-goal" style={{ '--gc': catOf(g.category).color }}>
                # {g.title}
              </span>
            )}
          </div>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {open && kids.length > 0 && (
          <motion.ul className="tlist sub" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            {kids.map((k) => (
              <TaskRow key={k.id} t={k} showDate={false} depth={depth + 1} />
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </motion.li>
  )
}

const TOKEN_LABEL = { date: 'Date', time: 'Time', priority: 'Priority', label: 'Label', goal: 'Goal', recur: 'Repeat', remind: 'Reminder' }

/**
 * Quick add that understands plain English — and has big buttons for people who'd rather tap.
 */
export function QuickAdd({ date = '', parentId = null, goalId = null, autoFocus = false, onDone, placeholder }) {
  const addTask = useStore((s) => s.addTask)
  const goals = useStore((s) => s.goals)
  const [text, setText] = useState('')
  const [manual, setManual] = useState({})
  const [more, setMore] = useState(false)
  const input = useRef()
  const parsed = useMemo(() => parseQuick(text, goals), [text, goals])
  const final = {
    title: parsed.title,
    date: manual.date ?? parsed.date ?? date,
    time: manual.time ?? parsed.time ?? '',
    priority: manual.priority ?? parsed.priority ?? 4,
    labels: parsed.labels,
    goalId: parsed.goalId ?? goalId,
    recur: manual.recur !== undefined ? manual.recur : parsed.recur,
    remind: manual.remind !== undefined ? manual.remind : parsed.remind,
    parentId,
  }
  const submit = (e) => {
    e?.preventDefault()
    if (!final.title) return
    addTask(final)
    setText('')
    setManual({})
    input.current?.focus()
    onDone?.()
  }
  const due = dueLabel(final.date, final.time)
  return (
    <form className="qadd" onSubmit={submit}>
      <div className="qadd-row">
        <span className="qadd-plus">＋</span>
        <input ref={input} autoFocus={autoFocus} value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder || 'Add a task — try “Call mom tomorrow 6pm p1 @family”'} aria-label="New task" onKeyDown={(e) => e.key === 'Escape' && onDone?.()} />
        <button type="submit" className="ws-btn primary" disabled={!final.title}>
          Add
        </button>
      </div>
      {(text || more) && (
        <div className="qadd-under">
          <div className="qadd-chips">
            {parsed.tokens.map((tk, i) => (
              <span key={i} className={`qchip ${tk.type}`}>
                <b>{TOKEN_LABEL[tk.type]}</b> {tk.text}
              </span>
            ))}
            {due && !parsed.tokens.some((x) => x.type === 'date') && <span className="qchip date">{due.text}</span>}
          </div>
          <div className="qadd-tools">
            <label className="tool">
              {Icon.cal}
              <input type="date" value={final.date || ''} onChange={(e) => setManual({ ...manual, date: e.target.value })} aria-label="Date" />
            </label>
            <label className="tool">
              <input type="time" value={final.time || ''} onChange={(e) => setManual({ ...manual, time: e.target.value })} aria-label="Time" />
            </label>
            <div className="tool prios" role="radiogroup" aria-label="Priority">
              {PRIORITIES.map((p) => (
                <button type="button" key={p.p} className={final.priority === p.p ? 'on' : ''} style={{ '--pc': p.color }} onClick={() => setManual({ ...manual, priority: p.p })} aria-label={`Priority ${p.p}: ${p.name}`} title={p.name}>
                  {Icon.flag}
                </button>
              ))}
            </div>
            <label className="tool">
              {Icon.bell}
              <select value={final.remind ?? ''} onChange={(e) => setManual({ ...manual, remind: e.target.value === '' ? null : Number(e.target.value) })} aria-label="Reminder">
                {REMIND_OPTIONS.map((o) => (
                  <option key={String(o.v)} value={o.v ?? ''}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="tool">
              {Icon.repeat}
              <select value={final.recur?.freq || ''} onChange={(e) => setManual({ ...manual, recur: e.target.value ? { freq: e.target.value, every: 1 } : null })} aria-label="Repeat">
                <option value="">No repeat</option>
                <option value="day">Every day</option>
                <option value="weekday">Every weekday</option>
                <option value="week">Every week</option>
                <option value="month">Every month</option>
                <option value="year">Every year</option>
              </select>
            </label>
          </div>
        </div>
      )}
      {!text && !more && (
        <button type="button" className="qadd-more" onClick={() => setMore(true)}>
          More options
        </button>
      )}
    </form>
  )
}
