import { dateKey, parseKey, todayParts, MONTHS } from './date'

// Todoist-style priorities: 1 is most urgent, 4 is "no priority".
export const PRIORITIES = [
  { p: 1, name: 'Urgent', color: '#e44332' },
  { p: 2, name: 'High', color: '#eb8909' },
  { p: 3, name: 'Medium', color: '#246fe0' },
  { p: 4, name: 'None', color: '#8a8a8a' },
]
export const prio = (p) => PRIORITIES.find((x) => x.p === (p || 4)) || PRIORITIES[3]

export const RECUR = {
  day: 'Every day',
  weekday: 'Every weekday',
  week: 'Every week',
  month: 'Every month',
  year: 'Every year',
}
export const recurLabel = (r) => {
  if (!r) return ''
  const n = r.every || 1
  if (n === 1) return RECUR[r.freq]
  const unit = { day: 'days', week: 'weeks', month: 'months', year: 'years', weekday: 'weekdays' }[r.freq]
  return `Every ${n} ${unit}`
}

const toDate = (key) => {
  const { y, m, d } = parseKey(key)
  return new Date(y, m, d)
}
const keyOf = (dt) => dateKey(dt.getFullYear(), dt.getMonth(), dt.getDate())
export const addDays = (key, n) => {
  const dt = toDate(key)
  dt.setDate(dt.getDate() + n)
  return keyOf(dt)
}
export const todayKey = () => todayParts().key
export const diffDays = (a, b) => Math.round((toDate(a) - toDate(b)) / 864e5)

/** The next date a recurring task falls on after `key`. */
export function nextOccurrence(key, r) {
  const base = key || todayKey()
  const n = r.every || 1
  const dt = toDate(base)
  if (r.freq === 'day') dt.setDate(dt.getDate() + n)
  else if (r.freq === 'week') dt.setDate(dt.getDate() + 7 * n)
  else if (r.freq === 'month') dt.setMonth(dt.getMonth() + n)
  else if (r.freq === 'year') dt.setFullYear(dt.getFullYear() + n)
  else if (r.freq === 'weekday') {
    do dt.setDate(dt.getDate() + 1)
    while (dt.getDay() === 0 || dt.getDay() === 6)
  }
  return keyOf(dt)
}

/** "Today", "Tomorrow", "Wed", "25 Oct" — plus a tone for colouring. */
export function dueLabel(key, time) {
  if (!key) return null
  const t = todayKey()
  const diff = diffDays(key, t)
  let text
  let tone
  if (diff < 0) {
    text = diff === -1 ? 'Yesterday' : `${Math.abs(diff)} days ago`
    tone = 'overdue'
  } else if (diff === 0) {
    text = 'Today'
    tone = 'today'
  } else if (diff === 1) {
    text = 'Tomorrow'
    tone = 'tomorrow'
  } else if (diff < 7) {
    text = toDate(key).toLocaleDateString('en-US', { weekday: 'long' })
    tone = 'week'
  } else {
    const { y, m, d } = parseKey(key)
    text = `${d} ${MONTHS[m].slice(0, 3)}${y !== todayParts().y ? ` ${y}` : ''}`
    tone = 'later'
  }
  if (time) text += ` ${fmtTime(time)}`
  return { text, tone }
}

export function fmtTime(hhmm) {
  if (!hhmm) return ''
  const [h, m] = hhmm.split(':').map(Number)
  const ap = h >= 12 ? 'pm' : 'am'
  const hh = h % 12 || 12
  return m ? `${hh}:${String(m).padStart(2, '0')}${ap}` : `${hh}${ap}`
}

/** When a task's reminder should ring, as a timestamp (ms), or null. */
export function reminderAt(task) {
  if (task.remind == null || !task.date || task.done) return null
  const { y, m, d } = parseKey(task.date)
  const [hh, mm] = (task.time || '09:00').split(':').map(Number)
  return new Date(y, m, d, hh, mm).getTime() - task.remind * 60000
}
export const reminderKey = (task) => `${task.id}@${task.date}T${task.time || ''}-${task.remind}`

export const REMIND_OPTIONS = [
  { v: null, label: 'No reminder' },
  { v: 0, label: 'At the time' },
  { v: 10, label: '10 minutes before' },
  { v: 30, label: '30 minutes before' },
  { v: 60, label: '1 hour before' },
  { v: 1440, label: '1 day before' },
]
export const remindLabel = (v) => REMIND_OPTIONS.find((o) => o.v === v)?.label || (v != null ? `${v} min before` : '')

export const isOverdue = (t) => !t.done && t.date && t.date < todayKey()
