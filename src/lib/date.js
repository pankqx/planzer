export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
export const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3))
export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Each month gets its own celestial palette — a quiet seasonal wheel.
export const MONTH_HUES = [
  ['#9fc4ff', '#2b3f8f'], // Jan — frost
  ['#f2a7c3', '#5b2a6e'], // Feb — rose dusk
  ['#a8f0c6', '#1f5c4a'], // Mar — first green
  ['#fbe39b', '#7a5a1c'], // Apr — pollen
  ['#c9f59a', '#2f6a2a'], // May — meadow
  ['#ffd27a', '#a3461b'], // Jun — solstice
  ['#ffb36b', '#8a2a1a'], // Jul — ember
  ['#ffe2a8', '#9a6a22'], // Aug — harvest gold
  ['#e5b98c', '#5a3524'], // Sep — amber
  ['#ff9f6e', '#4a1c3a'], // Oct — rust & plum
  ['#c7b7ff', '#2a2366'], // Nov — violet hour
  ['#bfe9ff', '#203a5c'], // Dec — starlight
]

export const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']

export function toRoman(num) {
  const map = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]
  let out = ''
  for (const [v, s] of map) while (num >= v) { out += s; num -= v }
  return out
}

export const pad = (n) => String(n).padStart(2, '0')
export const dateKey = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`
export const monthKey = (y, m) => `${y}-${pad(m + 1)}`
export const daysIn = (y, m) => new Date(y, m + 1, 0).getDate()

export function todayParts() {
  const t = new Date()
  return { y: t.getFullYear(), m: t.getMonth(), d: t.getDate(), key: dateKey(t.getFullYear(), t.getMonth(), t.getDate()) }
}

/** Monday-first grid of a month: leading blanks then days. */
export function monthGrid(y, m) {
  const first = new Date(y, m, 1).getDay() // 0 = Sun
  const lead = (first + 6) % 7
  const cells = []
  for (let i = 0; i < lead; i++) cells.push(null)
  for (let d = 1; d <= daysIn(y, m); d++) cells.push(d)
  while (cells.length % 7) cells.push(null)
  return cells
}

export function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return { y, m: m - 1, d }
}

export function prettyDate(key) {
  const { y, m, d } = parseKey(key)
  const wd = new Date(y, m, d).toLocaleDateString('en-US', { weekday: 'long' })
  return `${wd}, ${d} ${MONTHS[m]}`
}

export function shiftKey(key, days) {
  const { y, m, d } = parseKey(key)
  const t = new Date(y, m, d + days)
  return dateKey(t.getFullYear(), t.getMonth(), t.getDate())
}
