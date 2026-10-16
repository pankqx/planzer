import { useEffect } from 'react'
import { useStore } from '../store'
import TasksPanel from './TasksPanel'
import TaskDetail, { Toasts } from './TaskDetail'
import DayPage from './DayPage'
import { useReminderEngine } from './reminders'
import { todayKey } from '../lib/tasks'

/** Tasks, day notebooks, reminders — shared by every world. */
export default function Workspace() {
  useReminderEngine()
  useEffect(() => {
    const k = (e) => {
      if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable) return
      const s = useStore.getState()
      if (s.phase !== 'app' || s.sheet || s.taskOpen) return
      if (e.key === 'q' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        s.openTasks(s.tasksView || 'today')
      }
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey && !s.dayPage) {
        e.preventDefault()
        s.openDay(todayKey())
      }
    }
    addEventListener('keydown', k)
    return () => removeEventListener('keydown', k)
  }, [])
  return (
    <>
      <DayPage />
      <TasksPanel />
      <TaskDetail />
      <Toasts />
    </>
  )
}

/** Top-bar button: opens the task list and shows how many are due today. */
export function TasksButton({ className = 'btn icon tasks-btn' }) {
  const openTasks = useStore((s) => s.openTasks)
  const n = useStore((s) => {
    const t = todayKey()
    return s.tasks.filter((x) => !x.done && !x.parentId && x.date && x.date <= t).length
  })
  return (
    <button className={className} onClick={() => openTasks('today')} aria-label={`Tasks, ${n} due today`}>
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
        <path d="M9 6h11M9 12h11M9 18h11M3.5 6l1.5 1.5L7.5 5M3.5 12l1.5 1.5L7.5 11M3.5 18l1.5 1.5L7.5 17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="lbl">Tasks</span>
      {n > 0 && <b className="tasks-badge">{n}</b>}
    </button>
  )
}
