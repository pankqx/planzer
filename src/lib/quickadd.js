import { dateKey, todayParts } from './date'
import { addDays } from './tasks'

/*
 * Natural-language quick add, Todoist style:
 *   "Call mom tomorrow 6pm p1 @family !30 every sunday #fitness"
 * → title "Call mom", date, time 18:00, priority 1, label family, reminder 30 min before,
 *   repeat weekly, linked to the goal whose title starts with "fitness".
 */
const WD = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const WD_RE = '(sun(?:day)?|mon(?:day)?|tue(?:s|sday)?|wed(?:nesday)?|thu(?:r|rs|rsday)?|fri(?:day)?|sat(?:urday)?)'
const MON = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
const MON_RE = '(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)'

const wdIndex = (s) => WD.findIndex((w) => w.startsWith(s.toLowerCase().slice(0, 3)))
const monIndex = (s) => MON.indexOf(s.toLowerCase().slice(0, 3))

function nextWeekday(fromKey, wd, includeToday = false) {
  const [y, m, d] = fromKey.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  let add = (wd - dt.getDay() + 7) % 7
  if (add === 0 && !includeToday) add = 7
  dt.setDate(dt.getDate() + add)
  return dateKey(dt.getFullYear(), dt.getMonth(), dt.getDate())
}

function to24(h, min, ap) {
  h = Number(h)
  min = Number(min || 0)
  if (ap) {
    ap = ap.toLowerCase()
    if (ap.startsWith('p') && h < 12) h += 12
    if (ap.startsWith('a') && h === 12) h = 0
  }
  if (h > 23 || min > 59) return null
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

export function parseQuick(input, goals = []) {
  const t = todayParts()
  const today = t.key
  let text = ` ${input} `
  const tokens = []
  const out = { title: '', date: null, time: null, priority: null, labels: [], goalId: null, recur: null, remind: null, tokens }
  const take = (re, fn) => {
    text = text.replace(re, (...args) => {
      const r = fn(...args)
      if (r === false) return args[0]
      tokens.push({ type: r.type, text: args[0].trim() })
      return ' '
    })
  }

  // priority
  take(/\s!!([1-4])(?=\s)|\sp([1-4])(?=\s)/i, (_, a, b) => ((out.priority = Number(a || b)), { type: 'priority' }))
  // labels
  take(/\s@([\p{L}\d_-]+)(?=\s)/giu, (_, l) => (out.labels.push(l.toLowerCase()), { type: 'label' }))
  // goal / project
  take(/\s#([\p{L}\d_-]+)(?=\s)/iu, (_, g) => {
    const q = g.toLowerCase()
    const hit = goals.find((x) => x.title.toLowerCase().replace(/\s+/g, '').startsWith(q) || x.title.toLowerCase().split(/\s+/).some((w) => w.startsWith(q)))
    if (!hit) return false
    out.goalId = hit.id
    return { type: 'goal' }
  })
  // reminder: !30, !1h, "remind 15m before"
  take(/\s(?:!|remind(?: me)?\s+)(\d+)\s*(m|min|mins|minutes|h|hr|hrs|hours|d|day|days)?(?:\s+before)?(?=\s)/i, (_, n, u) => {
    let mins = Number(n)
    if (u && /^h/i.test(u)) mins *= 60
    if (u && /^d/i.test(u)) mins *= 1440
    out.remind = mins
    return { type: 'remind' }
  })
  // recurrence
  take(new RegExp(`\\s(?:every\\s+(\\d+)\\s+(days?|weeks?|months?|years?)|every\\s+(day|weekday|week|month|year)|(daily|weekly|monthly|yearly|weekdays)|every\\s+${WD_RE})(?=\\s)`, 'i'), (_, n, unit, single, adv, wd) => {
    if (n) out.recur = { freq: unit.toLowerCase().replace(/s$/, ''), every: Number(n) }
    else if (single) out.recur = { freq: single.toLowerCase(), every: 1 }
    else if (adv) out.recur = { freq: { daily: 'day', weekly: 'week', monthly: 'month', yearly: 'year', weekdays: 'weekday' }[adv.toLowerCase()], every: 1 }
    else if (wd) {
      out.recur = { freq: 'week', every: 1 }
      out.date = nextWeekday(today, wdIndex(wd), true)
    }
    return { type: 'recur' }
  })
  // time
  take(/\s(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)(?=\s)/i, (_, h, mi, ap) => {
    const v = to24(h, mi, ap)
    if (!v) return false
    out.time = v
    return { type: 'time' }
  })
  take(/\s(?:at\s+)?([01]?\d|2[0-3]):([0-5]\d)(?=\s)/, (_, h, mi) => ((out.time = to24(h, mi)), { type: 'time' }))
  take(/\sat\s+(\d{1,2})(?=\s)/i, (_, h) => {
    const v = to24(Number(h) < 7 ? Number(h) + 12 : h, 0)
    if (!v) return false
    out.time = v
    return { type: 'time' }
  })
  take(/\s(noon|midday|morning|afternoon|evening|tonight)(?=\s)/i, (_, w) => {
    const map = { noon: '12:00', midday: '12:00', morning: '09:00', afternoon: '15:00', evening: '18:00', tonight: '20:00' }
    out.time = map[w.toLowerCase()]
    if (w.toLowerCase() === 'tonight' && !out.date) out.date = today
    return { type: 'time' }
  })
  // dates
  take(/\s(today|tod)(?=\s)/i, () => ((out.date = today), { type: 'date' }))
  take(/\s(tomorrow|tmrw|tmr|tom)(?=\s)/i, () => ((out.date = addDays(today, 1)), { type: 'date' }))
  take(/\snext\s+week(?=\s)/i, () => ((out.date = nextWeekday(today, 1)), { type: 'date' }))
  take(/\snext\s+month(?=\s)/i, () => {
    const d = new Date(t.y, t.m + 1, 1)
    out.date = dateKey(d.getFullYear(), d.getMonth(), 1)
    return { type: 'date' }
  })
  take(/\sin\s+(\d+)\s+(days?|weeks?|months?)(?=\s)/i, (_, n, u) => {
    n = Number(n)
    if (/^d/i.test(u)) out.date = addDays(today, n)
    else if (/^w/i.test(u)) out.date = addDays(today, n * 7)
    else {
      const d = new Date(t.y, t.m + n, t.d)
      out.date = dateKey(d.getFullYear(), d.getMonth(), d.getDate())
    }
    return { type: 'date' }
  })
  take(new RegExp(`\\s(?:on\\s+)?(?:next\\s+)?${WD_RE}(?=\\s)`, 'i'), (_, wd) => ((out.date = nextWeekday(today, wdIndex(wd))), { type: 'date' }))
  const setDM = (d, mo, y) => {
    let yy = y ? Number(y.length === 2 ? `20${y}` : y) : t.y
    let key = dateKey(yy, mo, Number(d))
    if (!y && key < today) key = dateKey(yy + 1, mo, Number(d))
    out.date = key
  }
  take(new RegExp(`\\s(?:on\\s+)?(\\d{1,2})(?:st|nd|rd|th)?\\s+${MON_RE}(?:\\s+(\\d{4}))?(?=\\s)`, 'i'), (_, d, mo, y) => (setDM(d, monIndex(mo), y), { type: 'date' }))
  take(new RegExp(`\\s(?:on\\s+)?${MON_RE}\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(\\d{4}))?(?=\\s)`, 'i'), (_, mo, d, y) => (setDM(d, monIndex(mo), y), { type: 'date' }))
  take(/\s(?:on\s+)?(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?(?=\s)/, (_, d, mo, y) => {
    if (Number(mo) > 12 || Number(d) > 31) return false
    setDM(d, Number(mo) - 1, y)
    return { type: 'date' }
  })

  if (out.time && !out.date) out.date = today
  if (out.recur && !out.date) out.date = today
  out.title = text.replace(/\s+/g, ' ').trim()
  return out
}
