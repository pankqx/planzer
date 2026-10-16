import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { TaskRow, QuickAdd, Icon } from './TaskBits'
import { todayKey, addDays, dueLabel, reminderAt, remindLabel, fmtTime } from '../lib/tasks'
import { prettyDate, parseKey, MONTHS } from '../lib/date'
import { enableNotifications, chime } from './reminders'

const VIEWS = [
  ['today', 'Today', Icon.sun],
  ['upcoming', 'Upcoming', Icon.up],
  ['inbox', 'Inbox', Icon.inbox],
  ['labels', 'Labels', Icon.tag],
  ['reminders', 'Reminders', Icon.bell],
  ['done', 'Completed', Icon.done],
  ['search', 'Search', Icon.search],
]

const sortTasks = (a, b) => (a.time || '99').localeCompare(b.time || '99') || a.priority - b.priority || a.created - b.created

/** A Todoist-style workspace that slides over any theme. */
export default function TasksPanel() {
  const view = useStore((s) => s.tasksView)
  const openTasks = useStore((s) => s.openTasks)
  const tasks = useStore((s) => s.tasks)
  const top = useMemo(() => tasks.filter((t) => !t.parentId), [tasks])
  const today = todayKey()
  const counts = {
    today: top.filter((t) => !t.done && t.date && t.date <= today).length,
    inbox: top.filter((t) => !t.done && !t.date).length,
    upcoming: top.filter((t) => !t.done && t.date > today && t.date <= addDays(today, 14)).length,
    reminders: tasks.filter((t) => t.remind != null && !t.done && reminderAt(t) > Date.now()).length,
  }
  useEffect(() => {
    if (!view) return
    const k = (e) => e.key === 'Escape' && !useStore.getState().taskOpen && openTasks(null)
    addEventListener('keydown', k)
    return () => removeEventListener('keydown', k)
  }, [view, openTasks])
  return (
    <AnimatePresence>
      {view && (
        <motion.div key="ws" className="ws-veil" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onPointerDown={(e) => e.target === e.currentTarget && openTasks(null)}>
          <motion.aside className="ws" role="dialog" aria-label="Tasks" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 34 }}>
            <nav className="ws-nav">
              <div className="ws-brand">Tasks</div>
              {VIEWS.map(([id, name, ico]) => (
                <button key={id} className={view === id ? 'on' : ''} onClick={() => openTasks(id)}>
                  <i>{ico}</i>
                  <span>{name}</span>
                  {counts[id] > 0 && <b>{counts[id]}</b>}
                </button>
              ))}
              <Productivity />
            </nav>
            <section className="ws-main" data-vscroll>
              <button className="ws-close" onClick={() => openTasks(null)} aria-label="Close tasks">
                {Icon.x}
              </button>
              <AnimatePresence mode="wait">
                <motion.div key={view} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}>
                  {view === 'today' && <TodayView top={top} />}
                  {view === 'upcoming' && <UpcomingView top={top} />}
                  {view === 'inbox' && <InboxView top={top} />}
                  {view === 'labels' && <LabelsView top={top} />}
                  {view === 'reminders' && <RemindersView tasks={tasks} />}
                  {view === 'done' && <DoneView top={top} />}
                  {view === 'search' && <SearchView top={top} />}
                </motion.div>
              </AnimatePresence>
            </section>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Head({ title, sub, children }) {
  return (
    <header className="ws-head">
      <div>
        <h2>{title}</h2>
        {sub && <p>{sub}</p>}
      </div>
      {children}
    </header>
  )
}

function List({ items, showDate = true, empty }) {
  if (!items.length) return empty ? <div className="ws-empty">{empty}</div> : null
  return (
    <ul className="tlist">
      <AnimatePresence initial={false}>
        {items.map((t) => (
          <TaskRow key={t.id} t={t} showDate={showDate} />
        ))}
      </AnimatePresence>
    </ul>
  )
}

function TodayView({ top }) {
  const reschedule = useStore((s) => s.rescheduleOverdue)
  const today = todayKey()
  const overdue = top.filter((t) => !t.done && t.date && t.date < today).sort((a, b) => a.date.localeCompare(b.date))
  const list = top.filter((t) => t.date === today && !t.done).sort(sortTasks)
  const doneToday = top.filter((t) => t.date === today && t.done)
  return (
    <>
      <Head title="Today" sub={prettyDate(today)} />
      {overdue.length > 0 && (
        <div className="ws-sec">
          <div className="ws-sec-h">
            <span>Overdue</span>
            <button className="ws-link" onClick={reschedule}>
              Move all to today
            </button>
          </div>
          <List items={overdue} />
        </div>
      )}
      <div className="ws-sec">
        {overdue.length > 0 && <div className="ws-sec-h"><span>{prettyDate(today)}</span></div>}
        <List items={list} showDate={false} empty={!overdue.length && 'Nothing left for today. Enjoy it ✨'} />
        <QuickAdd date={today} />
      </div>
      {doneToday.length > 0 && (
        <div className="ws-sec faded">
          <div className="ws-sec-h"><span>Done today · {doneToday.length}</span></div>
          <List items={doneToday} showDate={false} />
        </div>
      )}
    </>
  )
}

function UpcomingView({ top }) {
  const today = todayKey()
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i))
  return (
    <>
      <Head title="Upcoming" sub="The next two weeks" />
      {days.map((d) => {
        const items = top.filter((t) => t.date === d && !t.done).sort(sortTasks)
        const { m, d: dd } = parseKey(d)
        const lab = dueLabel(d)
        return (
          <div key={d} className="ws-sec wsday">
            <div className="ws-sec-h">
              <span>
                <b>{dd} {MONTHS[m].slice(0, 3)}</b> · {lab.tone === 'today' || lab.tone === 'tomorrow' ? lab.text : prettyDate(d).split(',')[0]}
              </span>
              <DayLink date={d} />
            </div>
            <List items={items} showDate={false} />
            <InlineAdd date={d} />
          </div>
        )
      })}
    </>
  )
}

function DayLink({ date }) {
  const openDay = useStore((s) => s.openDay)
  const has = useStore((s) => !!s.noteIndex[date])
  return (
    <button className="ws-link" onClick={() => openDay(date)}>
      {Icon.note} {has ? 'Open notes' : 'Day page'}
    </button>
  )
}

function InlineAdd({ date }) {
  const [on, setOn] = useState(false)
  if (!on)
    return (
      <button className="ws-add" onClick={() => setOn(true)}>
        ＋ Add task
      </button>
    )
  return <QuickAdd date={date} autoFocus onDone={() => setOn(false)} />
}

function InboxView({ top }) {
  const items = top.filter((t) => !t.done && !t.date).sort((a, b) => a.priority - b.priority || a.created - b.created)
  return (
    <>
      <Head title="Inbox" sub="Ideas and tasks without a date yet" />
      <List items={items} empty="Your inbox is clear." />
      <QuickAdd placeholder="Jot something down…" />
    </>
  )
}

function LabelsView({ top }) {
  const [pick, setPick] = useState(null)
  const labels = useMemo(() => {
    const m = {}
    for (const t of top) if (!t.done) for (const l of t.labels || []) m[l] = (m[l] || 0) + 1
    return Object.entries(m).sort((a, b) => b[1] - a[1])
  }, [top])
  const items = pick ? top.filter((t) => !t.done && t.labels?.includes(pick)).sort((a, b) => (a.date || 'z').localeCompare(b.date || 'z')) : []
  return (
    <>
      <Head title={pick ? `@${pick}` : 'Labels'} sub={pick ? `${items.length} open tasks` : 'Add labels with @ when you type a task, like @work'}>
        {pick && (
          <button className="ws-btn" onClick={() => setPick(null)}>
            All labels
          </button>
        )}
      </Head>
      {!pick && (
        <div className="label-grid">
          {labels.map(([l, n]) => (
            <button key={l} onClick={() => setPick(l)}>
              <i>{Icon.tag}</i> {l} <b>{n}</b>
            </button>
          ))}
          {!labels.length && <div className="ws-empty">No labels yet.</div>}
        </div>
      )}
      {pick && <List items={items} />}
    </>
  )
}

function RemindersView({ tasks }) {
  const [perm, setPerm] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported')
  const now = Date.now()
  const items = tasks.filter((t) => t.remind != null && !t.done && reminderAt(t)).sort((a, b) => reminderAt(a) - reminderAt(b))
  const next = items.filter((t) => reminderAt(t) > now)
  const past = items.filter((t) => reminderAt(t) <= now).slice(-5)
  return (
    <>
      <Head title="Reminders" sub="Planzer rings and shows a notification at the right time" />
      <div className="ws-card">
        <div>
          <b>Notifications</b>
          <p>
            {perm === 'granted'
              ? 'On — reminders also pop up outside the app while Planzer is open in a tab.'
              : perm === 'denied'
                ? 'Blocked in your browser settings. Reminders will still ring inside Planzer.'
                : perm === 'unsupported'
                  ? 'This browser can’t show notifications. Reminders will ring inside Planzer.'
                  : 'Turn on to get a pop-up even when you’re in another tab.'}
          </p>
        </div>
        <div className="ws-card-actions">
          {perm === 'default' && (
            <button className="ws-btn primary" onClick={async () => setPerm(await enableNotifications())}>
              Turn on
            </button>
          )}
          <button className="ws-btn" onClick={() => chime()}>
            Test sound
          </button>
        </div>
      </div>
      <div className="ws-sec">
        <div className="ws-sec-h"><span>Coming up</span></div>
        {next.length ? (
          <ul className="rem-list">
            {next.map((t) => (
              <RemRow key={t.id} t={t} />
            ))}
          </ul>
        ) : (
          <div className="ws-empty">No reminders set. Add one with “!30” (30 minutes before) when you type a task, or tap the bell.</div>
        )}
      </div>
      {past.length > 0 && (
        <div className="ws-sec faded">
          <div className="ws-sec-h"><span>Recently rang</span></div>
          <ul className="rem-list">
            {past.map((t) => (
              <RemRow key={t.id} t={t} />
            ))}
          </ul>
        </div>
      )}
    </>
  )
}

function RemRow({ t }) {
  const openTask = useStore((s) => s.openTask)
  const at = new Date(reminderAt(t))
  return (
    <li onClick={() => openTask(t.id)}>
      <span className="rem-bell">{Icon.bell}</span>
      <span className="rem-body">
        <b>{t.title}</b>
        <small>
          {at.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })} at {fmtTime(`${at.getHours()}:${String(at.getMinutes()).padStart(2, '0')}`)} · {remindLabel(t.remind)}
        </small>
      </span>
    </li>
  )
}

function DoneView({ top }) {
  const items = top.filter((t) => t.done).sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0)).slice(0, 80)
  return (
    <>
      <Head title="Completed" sub={`${items.length} recent`} />
      <List items={items} empty="Nothing completed yet — tick something off!" />
    </>
  )
}

function SearchView({ top }) {
  const [q, setQ] = useState('')
  const s = q.trim().toLowerCase()
  const items = s ? top.filter((t) => `${t.title} ${t.desc} ${(t.labels || []).join(' ')}`.toLowerCase().includes(s)) : []
  return (
    <>
      <Head title="Search" />
      <input className="ws-search" autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tasks, notes and labels…" />
      <List items={items} empty={s ? 'No matches.' : ''} />
    </>
  )
}

function Productivity() {
  const doneLog = useStore((s) => s.doneLog)
  const goal = useStore((s) => s.prefs?.dailyGoal || 5)
  const today = todayKey()
  const n = doneLog[today] || 0
  let streak = 0
  for (let i = n >= goal ? 0 : 1; i < 400; i++) {
    if ((doneLog[addDays(today, -i)] || 0) >= goal) streak++
    else break
  }
  const week = Array.from({ length: 7 }, (_, i) => doneLog[addDays(today, i - 6)] || 0)
  const max = Math.max(goal, ...week)
  const p = Math.min(1, n / goal)
  return (
    <div className="prod">
      <div className="prod-ring" style={{ '--p': p }}>
        <span>
          {n}/{goal}
        </span>
      </div>
      <div className="prod-txt">
        <b>{p >= 1 ? 'Daily goal reached!' : 'Daily goal'}</b>
        <small>{streak > 0 ? `🔥 ${streak} day streak` : 'Complete tasks to start a streak'}</small>
      </div>
      <div className="prod-bars" aria-label="Tasks done in the last 7 days">
        {week.map((v, i) => (
          <i key={i} style={{ height: `${Math.max(6, (v / max) * 100)}%` }} className={v >= goal ? 'hit' : ''} />
        ))}
      </div>
    </div>
  )
}
