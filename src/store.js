import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { dateKey, daysIn, monthKey, todayParts, MONTHS } from './lib/date'

export const CATEGORIES = [
  { id: 'craft', name: 'Craft', color: '#e6c98a', glyph: '✦' },
  { id: 'career', name: 'Career', color: '#9fc4ff', glyph: '◆' },
  { id: 'health', name: 'Health', color: '#a8f0c6', glyph: '❋' },
  { id: 'mind', name: 'Mind', color: '#c7b7ff', glyph: '◐' },
  { id: 'wealth', name: 'Wealth', color: '#ffd27a', glyph: '◈' },
  { id: 'love', name: 'People', color: '#f2a7c3', glyph: '❦' },
  { id: 'adventure', name: 'Adventure', color: '#ff9f6e', glyph: '➶' },
]
export const catOf = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[0]

const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3)

/**
 * Break a yearly goal into a monthly plan: one milestone per month in its span.
 * User-written steps are spread evenly across the span; missing months get checkpoints.
 */
export function breakdown(title, startMonth, endMonth, steps = []) {
  const months = []
  for (let m = startMonth; m <= endMonth; m++) months.push(m)
  const n = months.length
  const clean = steps.map((s) => s.trim()).filter(Boolean)
  if (clean.length === 0) {
    return months.map((m, i) => ({
      id: uid(),
      month: m,
      title: i === n - 1 ? `Complete: ${title}` : i === 0 ? `Lay the foundation for ${title.toLowerCase()}` : `Checkpoint ${i + 1} of ${n}`,
      done: false,
    }))
  }
  return clean.map((s, i) => ({
    id: uid(),
    month: months[Math.min(n - 1, Math.floor((i * n) / clean.length))],
    title: s,
    done: false,
  }))
}

const now = todayParts()

const initial = {
  year: now.y,
  goals: [],
  tasks: [],
  notes: {}, // monthKey -> { focus, reflection }
  habits: [],
}

export const useStore = create(
  persist(
    (set, get) => ({
      ...initial,

      // ——— UI ———
      theme: 'neon', // neon | paper  (persisted)
      phase: 'intro', // intro | app
      level: 'month', // year | month
      focusAbs: now.y * 12 + now.m, // absolute month index the ribbon should show
      focusDay: now.d,
      jumpId: 0,
      sheet: null, // { type: 'goal' | 'habits' | 'menu' | 'print' | 'goalView', ... }
      setTheme: (theme) => set({ theme }),
      setPhase: (phase) => set({ phase }),
      setSheet: (sheet) => set({ sheet }),
      setYear: (year) => set((s) => (s.year === year ? s : { year, focusGoal: null })),
      // Solar world UI
      view: 'year', // year | month | habits | print
      month: now.m,
      day: null,
      focusGoal: null,
      hoverMonth: null,
      modal: null,
      go: (view, extra = {}) => set({ view, day: null, ...extra }),
      openMonth: (month) => set({ view: 'month', month, day: null }),
      setDay: (day) => set({ day }),
      setHoverMonth: (hoverMonth) => set({ hoverMonth }),
      setFocusGoal: (focusGoal) => set((s) => ({ focusGoal: s.focusGoal === focusGoal ? null : focusGoal })),
      setModal: (modal) => set({ modal }),
      // go to a level, optionally to a month (absolute index) and day
      goTo: (level, abs, day = null) => set((s) => ({ level, focusAbs: abs ?? s.focusAbs, focusDay: day, jumpId: s.jumpId + 1 })),

      // ——— Goals ———
      addGoal: ({ title, category, start, end, steps, why, year }) => {
        const g = { id: uid(), year: year ?? get().year, title, category, start, end, why: why || '', milestones: breakdown(title, start, end, steps), created: Date.now() }
        set((s) => ({ goals: [...s.goals, g] }))
        return g.id
      },
      updateGoal: (id, patch) => set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) })),
      removeGoal: (id) => set((s) => ({ goals: s.goals.filter((g) => g.id !== id), tasks: s.tasks.map((t) => (t.goalId === id ? { ...t, goalId: null } : t)), focusGoal: null })),
      toggleMilestone: (gid, mid) =>
        set((s) => ({ goals: s.goals.map((g) => (g.id !== gid ? g : { ...g, milestones: g.milestones.map((m) => (m.id === mid ? { ...m, done: !m.done } : m)) })) })),
      addMilestone: (gid, month, title) =>
        set((s) => ({ goals: s.goals.map((g) => (g.id !== gid ? g : { ...g, milestones: [...g.milestones, { id: uid(), month, title, done: false }] })) })),
      removeMilestone: (gid, mid) =>
        set((s) => ({ goals: s.goals.map((g) => (g.id !== gid ? g : { ...g, milestones: g.milestones.filter((m) => m.id !== mid) })) })),

      // ——— Tasks / schedule ———
      addTask: ({ date, time, title, goalId }) => set((s) => ({ tasks: [...s.tasks, { id: uid(), date, time: time || '', title, goalId: goalId || null, done: false }] })),
      toggleTask: (id) => set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) })),
      removeTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
      moveTask: (id, date) => set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, date } : t)) })),

      // ——— Month notes ———
      setNote: (mk, patch) => set((s) => ({ notes: { ...s.notes, [mk]: { ...(s.notes[mk] || {}), ...patch } } })),

      // ——— Habits ———
      addHabit: (name, color) => set((s) => ({ habits: [...s.habits, { id: uid(), name, color, log: {}, created: Date.now() }] })),
      removeHabit: (id) => set((s) => ({ habits: s.habits.filter((h) => h.id !== id) })),
      toggleHabit: (id, key) =>
        set((s) => ({
          habits: s.habits.map((h) => {
            if (h.id !== id) return h
            const log = { ...h.log }
            if (log[key]) delete log[key]
            else log[key] = true
            return { ...h, log }
          }),
        })),

      // ——— Data ———
      exportData: () => {
        const { year, goals, tasks, notes, habits } = get()
        return { app: 'planzer', version: 1, exported: new Date().toISOString(), year, goals, tasks, notes, habits }
      },
      importData: (data) => {
        if (!data || data.app !== 'planzer') throw new Error('This file is not a Planzer backup.')
        set({ goals: data.goals || [], tasks: data.tasks || [], notes: data.notes || {}, habits: data.habits || [], year: data.year || get().year })
      },
      clearYear: () => {
        const y = get().year
        set((s) => ({
          goals: s.goals.filter((g) => g.year !== y),
          tasks: s.tasks.filter((t) => !t.date.startsWith(String(y))),
        }))
      },
      loadSample: () => {
        const y = get().year
        const sample = sampleYear(y)
        set((s) => ({
          goals: [...s.goals.filter((g) => g.year !== y), ...sample.goals],
          tasks: [...s.tasks.filter((t) => !t.date.startsWith(String(y))), ...sample.tasks],
          habits: s.habits.length ? s.habits : sample.habits,
          notes: { ...sample.notes, ...s.notes },
        }))
      },
    }),
    {
      name: 'planzer-v1',
      version: 1,
      partialize: (s) => ({ year: s.year, goals: s.goals, tasks: s.tasks, notes: s.notes, habits: s.habits, theme: s.theme }),
    },
  ),
)

// ——— Selectors ———
export const goalsOfYear = (s) => s.goals.filter((g) => g.year === s.year)
export const goalProgress = (g) => (g.milestones.length ? g.milestones.filter((m) => m.done).length / g.milestones.length : 0)

export function monthStats(state, m) {
  const y = state.year
  const prefix = monthKey(y, m)
  const goals = state.goals.filter((g) => g.year === y && m >= g.start && m <= g.end)
  const milestones = goals.flatMap((g) => g.milestones.filter((ms) => ms.month === m).map((ms) => ({ ...ms, goal: g })))
  const tasks = state.tasks.filter((t) => t.date.startsWith(prefix))
  const done = tasks.filter((t) => t.done).length
  const msDone = milestones.filter((x) => x.done).length
  const units = tasks.length + milestones.length
  const progress = units ? (done + msDone) / units : 0
  let habitHits = 0
  let habitSlots = 0
  const t = todayParts()
  const lastDay = y === t.y && m === t.m ? t.d : y < t.y || (y === t.y && m < t.m) ? daysIn(y, m) : 0
  for (const h of state.habits) {
    for (let d = 1; d <= lastDay; d++) {
      habitSlots++
      if (h.log[dateKey(y, m, d)]) habitHits++
    }
  }
  return { goals, milestones, tasks, done, msDone, progress, habitRate: habitSlots ? habitHits / habitSlots : 0, weight: goals.length + tasks.length * 0.15 }
}

export function streakOf(h) {
  const t = new Date()
  let cur = 0
  const cursor = new Date(t.getFullYear(), t.getMonth(), t.getDate())
  // today counts if logged; otherwise the streak may still be alive from yesterday
  if (!h.log[dateKey(cursor.getFullYear(), cursor.getMonth(), cursor.getDate())]) cursor.setDate(cursor.getDate() - 1)
  while (h.log[dateKey(cursor.getFullYear(), cursor.getMonth(), cursor.getDate())]) {
    cur++
    cursor.setDate(cursor.getDate() - 1)
  }
  const keys = Object.keys(h.log).sort()
  let best = 0
  let run = 0
  let prev = null
  for (const k of keys) {
    const [y, m, d] = k.split('-').map(Number)
    const ts = new Date(y, m - 1, d).getTime()
    run = prev !== null && Math.round((ts - prev) / 864e5) === 1 ? run + 1 : 1
    best = Math.max(best, run)
    prev = ts
  }
  return { current: cur, best: Math.max(best, cur), total: keys.length }
}

// ——— A gentle sample year so the cosmos is never empty on a demo ———
function sampleYear(y) {
  const t = todayParts()
  const mk = (title, category, start, end, steps, why) => ({ id: uid(), year: y, title, category, start, end, why, milestones: breakdown(title, start, end, steps), created: Date.now() })
  const goals = [
    mk('Ship my portfolio site', 'craft', 0, 3, ['Moodboard & story', 'Design system', 'Build the hero', 'Launch & share'], 'A home for everything I make.'),
    mk('Run a half marathon', 'health', 1, 8, ['Run 5k without stopping', 'Weekly long run 8k', '10k race', 'Long run 15k', 'Taper & race day'], 'Prove to myself that consistency compounds.'),
    mk('Land a software internship', 'career', 2, 7, ['Polish resume', 'Solve 100 DSA problems', 'Apply to 40 roles', 'Mock interviews', 'Offer'], ''),
    mk('Read 24 books', 'mind', 0, 11, [], 'Two worlds a month.'),
    mk('Save an emergency fund', 'wealth', 3, 11, ['Track every rupee for a month', 'Automate savings', 'Reach 50%', 'Fully funded'], ''),
    mk('Trip to the Himalayas', 'adventure', 9, 11, ['Pick the trek', 'Book & train', 'Go'], ''),
  ]
  // mark the past as partly done so the orrery has light in it
  for (const g of goals) for (const ms of g.milestones) if (y < t.y || (y === t.y && ms.month < t.m)) ms.done = Math.random() > 0.25
  const tasks = []
  const titles = ['Deep work block', 'Long run', 'Read 30 pages', 'Mock interview', 'Review budget', 'Design session', 'Call home', 'Ship a small thing']
  const times = ['06:30', '09:00', '11:30', '15:00', '18:30', '21:00']
  for (let m = 0; m < 12; m++) {
    const count = 6 + Math.floor(Math.random() * 6)
    for (let i = 0; i < count; i++) {
      const d = 1 + Math.floor(Math.random() * daysIn(y, m))
      const date = dateKey(y, m, d)
      const past = y < t.y || (y === t.y && (m < t.m || (m === t.m && d < t.d)))
      const g = goals[Math.floor(Math.random() * goals.length)]
      tasks.push({ id: uid(), date, time: times[i % times.length], title: titles[(i + m) % titles.length], goalId: m >= g.start && m <= g.end ? g.id : null, done: past && Math.random() > 0.2 })
    }
  }
  const habit = (name, color, rate) => {
    const log = {}
    for (let k = 1; k < 120; k++) {
      const dt = new Date(t.y, t.m, t.d - k)
      if (Math.random() < rate) log[dateKey(dt.getFullYear(), dt.getMonth(), dt.getDate())] = true
    }
    for (let k = 1; k <= 6; k++) {
      const dt = new Date(t.y, t.m, t.d - k)
      log[dateKey(dt.getFullYear(), dt.getMonth(), dt.getDate())] = true
    }
    return { id: uid(), name, color, log, created: Date.now() }
  }
  const habits = [habit('Morning pages', '#e6c98a', 0.8), habit('Move 30 minutes', '#a8f0c6', 0.7), habit('No phone after 11', '#c7b7ff', 0.55), habit('Code 1 hour', '#9fc4ff', 0.75)]
  const notes = { [monthKey(y, t.m)]: { focus: `Make ${MONTHS[t.m]} the month the habits stick.` } }
  return { goals, tasks, habits, notes }
}
