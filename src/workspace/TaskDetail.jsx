import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore, catOf } from '../store'
import { PRIORITIES, REMIND_OPTIONS, prio, recurLabel, todayKey } from '../lib/tasks'
import { TaskCheck, TaskRow, QuickAdd, Icon } from './TaskBits'

/** Everything about one task: notes, date, priority, labels, repeat, reminder, goal, subtasks. */
export default function TaskDetail() {
  const id = useStore((s) => s.taskOpen)
  const t = useStore((s) => s.tasks.find((x) => x.id === s.taskOpen))
  const openTask = useStore((s) => s.openTask)
  useEffect(() => {
    if (!id) return
    const k = (e) => e.key === 'Escape' && openTask(null)
    addEventListener('keydown', k)
    return () => removeEventListener('keydown', k)
  }, [id, openTask])
  return (
    <AnimatePresence>
      {t && (
        <motion.div key="td" className="td-veil" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onPointerDown={(e) => e.target === e.currentTarget && openTask(null)}>
          <motion.div className="td" role="dialog" aria-label="Task details" initial={{ y: 40, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 30, opacity: 0, scale: 0.98 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
            <Detail key={t.id} t={t} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Detail({ t }) {
  const update = useStore((s) => s.updateTask)
  const toggle = useStore((s) => s.toggleTask)
  const remove = useStore((s) => s.removeTask)
  const duplicate = useStore((s) => s.duplicateTask)
  const openTask = useStore((s) => s.openTask)
  const openDay = useStore((s) => s.openDay)
  const tasks = useStore((s) => s.tasks)
  const goals = useStore((s) => s.goals)
  const parent = t.parentId ? tasks.find((x) => x.id === t.parentId) : null
  const kids = useMemo(() => tasks.filter((x) => x.parentId === t.id), [tasks, t.id])
  const [title, setTitle] = useState(t.title)
  const [desc, setDesc] = useState(t.desc || '')
  const [label, setLabel] = useState('')
  const [addingSub, setAddingSub] = useState(false)
  const set = (patch) => update(t.id, patch)
  const yearGoals = goals.filter((g) => !t.date || g.year === Number(t.date.slice(0, 4)))
  return (
    <>
      <header className="td-top">
        {parent ? (
          <button className="ws-link" onClick={() => openTask(parent.id)}>
            ← {parent.title}
          </button>
        ) : (
          <span className="td-kicker">Task</span>
        )}
        <button className="ws-close inline" onClick={() => openTask(null)} aria-label="Close">
          {Icon.x}
        </button>
      </header>
      <div className="td-grid">
        <div className="td-main">
          <div className="td-title">
            <TaskCheck t={t} onToggle={() => toggle(t.id)} />
            <textarea rows={1} value={title} onChange={(e) => setTitle(e.target.value)} onBlur={() => title.trim() && title !== t.title && set({ title: title.trim() })} aria-label="Task name" className="td-title-in" />
          </div>
          <textarea className="td-desc" value={desc} onChange={(e) => setDesc(e.target.value)} onBlur={() => desc !== t.desc && set({ desc })} placeholder="Description — add details, links, anything…" rows={3} />
          {t.recur && t.completions > 0 && <div className="td-note">↻ Completed {t.completions} time{t.completions === 1 ? '' : 's'} so far.</div>}
          <div className="td-subs">
            <div className="td-h">
              Sub-tasks {kids.length > 0 && <span>{kids.filter((k) => k.done).length}/{kids.length}</span>}
            </div>
            <ul className="tlist">
              {kids.map((k) => (
                <TaskRow key={k.id} t={k} showDate={false} />
              ))}
            </ul>
            {addingSub ? (
              <QuickAdd parentId={t.id} date={t.date} autoFocus placeholder="Sub-task name" onDone={() => setAddingSub(false)} />
            ) : (
              <button className="ws-add" onClick={() => setAddingSub(true)}>
                ＋ Add sub-task
              </button>
            )}
          </div>
        </div>
        <aside className="td-side">
          <Field label="Date" icon={Icon.cal}>
            <input type="date" value={t.date || ''} onChange={(e) => set({ date: e.target.value })} />
            {t.date && (
              <button className="mini-x" onClick={() => set({ date: '', time: '', recur: null })} aria-label="Remove date">
                ×
              </button>
            )}
          </Field>
          <Field label="Time" icon={Icon.cal}>
            <input type="time" value={t.time || ''} onChange={(e) => set({ time: e.target.value, date: t.date || todayKey() })} />
          </Field>
          <Field label="Priority" icon={Icon.flag}>
            <div className="prio-pick">
              {PRIORITIES.map((p) => (
                <button key={p.p} className={t.priority === p.p ? 'on' : ''} style={{ '--pc': p.color }} onClick={() => set({ priority: p.p })} title={p.name}>
                  {Icon.flag}
                  <span>P{p.p}</span>
                </button>
              ))}
            </div>
            <small style={{ color: prio(t.priority).color }}>{prio(t.priority).name}</small>
          </Field>
          <Field label="Repeat" icon={Icon.repeat}>
            <select value={t.recur?.freq || ''} onChange={(e) => set({ recur: e.target.value ? { freq: e.target.value, every: t.recur?.every || 1 } : null, date: t.date || todayKey() })}>
              <option value="">Does not repeat</option>
              <option value="day">Every day</option>
              <option value="weekday">Every weekday</option>
              <option value="week">Every week</option>
              <option value="month">Every month</option>
              <option value="year">Every year</option>
            </select>
            {t.recur && (
              <label className="every">
                every
                <input type="number" min="1" max="99" value={t.recur.every || 1} onChange={(e) => set({ recur: { ...t.recur, every: Math.max(1, Number(e.target.value) || 1) } })} />
                <small>{recurLabel(t.recur)}</small>
              </label>
            )}
          </Field>
          <Field label="Reminder" icon={Icon.bell}>
            <select value={t.remind ?? ''} onChange={(e) => set({ remind: e.target.value === '' ? null : Number(e.target.value), date: t.date || todayKey() })}>
              {REMIND_OPTIONS.map((o) => (
                <option key={String(o.v)} value={o.v ?? ''}>
                  {o.label}
                </option>
              ))}
            </select>
            {t.remind != null && !t.time && <small>Rings at 9am on the day unless you set a time.</small>}
          </Field>
          <Field label="Labels" icon={Icon.tag}>
            <div className="lab-edit">
              {(t.labels || []).map((l) => (
                <span key={l} className="chip-label">
                  @{l}
                  <button onClick={() => set({ labels: t.labels.filter((x) => x !== l) })} aria-label={`Remove ${l}`}>
                    ×
                  </button>
                </span>
              ))}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const v = label.trim().replace(/^@/, '').toLowerCase()
                  if (v && !(t.labels || []).includes(v)) set({ labels: [...(t.labels || []), v] })
                  setLabel('')
                }}
              >
                <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="+ label" />
              </form>
            </div>
          </Field>
          <Field label="Goal" icon={Icon.goal}>
            <select value={t.goalId || ''} onChange={(e) => set({ goalId: e.target.value || null })}>
              <option value="">None</option>
              {yearGoals.map((g) => (
                <option key={g.id} value={g.id}>
                  {catOf(g.category).glyph} {g.title}
                </option>
              ))}
            </select>
          </Field>
          <div className="td-actions">
            {t.date && (
              <button className="ws-btn" onClick={() => (openTask(null), openDay(t.date))}>
                {Icon.note} Open day page
              </button>
            )}
            <button className="ws-btn" onClick={() => duplicate(t.id)}>
              Duplicate
            </button>
            <button className="ws-btn danger" onClick={() => confirm(`Delete “${t.title}”${kids.length ? ' and its sub-tasks' : ''}?`) && remove(t.id)}>
              Delete
            </button>
          </div>
        </aside>
      </div>
    </>
  )
}

function Field({ label, icon, children }) {
  return (
    <div className="td-field">
      <span className="td-flab">
        {icon}
        {label}
      </span>
      <div className="td-fval">{children}</div>
    </div>
  )
}

/** Little cards in the corner: reminders ringing, undo, etc. */
export function Toasts() {
  const toasts = useStore((s) => s.toasts)
  const dismiss = useStore((s) => s.dismissToast)
  const toggle = useStore((s) => s.toggleTask)
  const update = useStore((s) => s.updateTask)
  const openTask = useStore((s) => s.openTask)
  return (
    <div className="toasts" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div key={t.id} className={`toast ${t.kind}`} initial={{ x: -40, opacity: 0, scale: 0.9 }} animate={{ x: 0, opacity: 1, scale: 1 }} exit={{ x: -30, opacity: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 26 }} layout>
            {t.kind === 'reminder' ? (
              <>
                <span className="toast-bell">{Icon.bell}</span>
                <div className="toast-body">
                  <small>{t.snoozed ? 'Snoozed reminder' : 'Reminder'}</small>
                  <b onClick={() => (openTask(t.taskId), dismiss(t.id))}>{t.title}</b>
                  <div className="toast-actions">
                    <button className="ws-btn primary" onClick={() => (toggle(t.taskId), dismiss(t.id))}>
                      Done
                    </button>
                    <button className="ws-btn" onClick={() => (update(t.taskId, { snoozeUntil: Date.now() + 10 * 60000 }), dismiss(t.id))}>
                      Snooze 10 min
                    </button>
                  </div>
                </div>
                <button className="toast-x" onClick={() => dismiss(t.id)} aria-label="Dismiss">
                  ×
                </button>
              </>
            ) : (
              <>
                <div className="toast-body">
                  <b>{t.title}</b>
                </div>
                <button className="toast-x" onClick={() => dismiss(t.id)} aria-label="Dismiss">
                  ×
                </button>
              </>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
