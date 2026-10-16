import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { dateKey, daysIn, monthKey, todayParts, MONTHS } from './lib/date'
import { nextOccurrence } from './lib/tasks'
import { dumpBlobs, loadBlobs } from './lib/db'

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
  noteIndex: {}, // dateKey -> { preview, images, words, updated } (the notebook itself lives in IndexedDB)
  covers: {}, // monthKey -> true when a cover photo is stored
  fired: {}, // reminderKey -> timestamp, so a reminder rings once
  doneLog: {}, // dateKey -> number of tasks completed that day
  prefs: { dailyGoal: 5, calShow: { tasks: false, goals: false, notes: false, habits: false }, calMode: 'month' },
}

export const newTask = (f = {}) => ({
  id: uid(),
  title: '',
  desc: '',
  date: '',
  time: '',
  priority: 4,
  labels: [],
  goalId: null,
  parentId: null,
  recur: null,
  remind: null,
  done: false,
  doneAt: null,
  created: Date.now(),
  ...f,
})

export const useStore = create(
  persist(
    (set, get) => ({
      ...initial,

      // ——— UI ———
      theme: 'neon', // neon | paper | solar | minimal  (persisted)
      phase: 'landing', // landing | intro | app
      level: 'month', // year | month
      focusAbs: now.y * 12 + now.m, // absolute month index the ribbon should show
      focusDay: now.d,
      jumpId: 0,
      sheet: null, // { type: 'goal' | 'habits' | 'menu' | 'print' | 'goalView', ... }
      dayPage: null, // dateKey of the open day notebook
      tasksView: null, // null (closed) | 'inbox' | 'today' | 'upcoming' | 'labels' | 'reminders' | 'done' | 'search'
      taskOpen: null, // id of the task in the detail panel
      toasts: [],
      calOpen: false,
      calDay: null,
      openCal: (calOpen, calDay = null) => set((s) => ({ calOpen, calDay: calDay ?? s.calDay })),
      openDay: (dayPage) => set({ dayPage }),
      openTasks: (tasksView) => set({ tasksView }),
      openTask: (taskOpen) => set({ taskOpen }),
      toast: (t) => set((s) => ({ toasts: [...s.toasts.filter((x) => x.id !== t.id), { id: uid(), ...t }] })),
      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
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

      // ——— Tasks (Todoist-style) ———
      addTask: (f) => {
        const t = newTask({ ...f, time: f.time || '', date: f.date || '', goalId: f.goalId || null, priority: f.priority || 4, labels: f.labels || [] })
        set((s) => ({ tasks: [...s.tasks, t] }))
        return t.id
      },
      updateTask: (id, patch) => set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      toggleTask: (id) =>
        set((s) => {
          const t = s.tasks.find((x) => x.id === id)
          if (!t) return s
          const today = todayParts().key
          const log = { ...s.doneLog }
          // a repeating task rolls forward instead of being finished
          if (!t.done && t.recur) {
            log[today] = (log[today] || 0) + 1
            const date = nextOccurrence(t.date || today, t.recur)
            return { doneLog: log, tasks: s.tasks.map((x) => (x.id === id ? { ...x, date, completions: (x.completions || 0) + 1, lastDone: today } : x.parentId === id ? { ...x, done: false } : x)) }
          }
          if (!t.done) log[today] = (log[today] || 0) + 1
          else if (log[today]) log[today] -= 1
          return { doneLog: log, tasks: s.tasks.map((x) => (x.id === id ? { ...x, done: !x.done, doneAt: x.done ? null : Date.now() } : x)) }
        }),
      removeTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id && t.parentId !== id), taskOpen: s.taskOpen === id ? null : s.taskOpen })),
      duplicateTask: (id) =>
        set((s) => {
          const t = s.tasks.find((x) => x.id === id)
          if (!t) return s
          const copy = newTask({ ...t, id: undefined, done: false, doneAt: null, created: Date.now() })
          copy.id = uid()
          const kids = s.tasks.filter((x) => x.parentId === id).map((k) => ({ ...k, id: uid(), parentId: copy.id, done: false }))
          return { tasks: [...s.tasks, copy, ...kids] }
        }),
      moveTask: (id, date) => set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, date } : t)) })),
      rescheduleOverdue: () => {
        const today = todayParts().key
        set((s) => ({ tasks: s.tasks.map((t) => (!t.done && t.date && t.date < today ? { ...t, date: today } : t)) }))
      },
      markFired: (key) => set((s) => ({ fired: { ...s.fired, [key]: Date.now() } })),
      setPrefs: (patch) => set((s) => ({ prefs: { ...s.prefs, ...patch } })),
      setNoteIndex: (key, info) =>
        set((s) => {
          const ni = { ...s.noteIndex }
          if (info) ni[key] = info
          else delete ni[key]
          return { noteIndex: ni }
        }),
      setCover: (mk, has) =>
        set((s) => {
          const c = { ...s.covers }
          if (has) c[mk] = Date.now()
          else delete c[mk]
          return { covers: c }
        }),

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
      exportData: async () => {
        const { year, goals, tasks, notes, habits, noteIndex, covers, doneLog, prefs } = get()
        return { app: 'planzer', version: 2, exported: new Date().toISOString(), year, goals, tasks, notes, habits, noteIndex, covers, doneLog, prefs, blobs: await dumpBlobs() }
      },
      importData: async (data) => {
        if (!data || data.app !== 'planzer') throw new Error('This file is not a Planzer backup.')
        await loadBlobs(data.blobs)
        set({ goals: data.goals || [], tasks: (data.tasks || []).map((t) => newTask(t)), notes: data.notes || {}, habits: data.habits || [], year: data.year || get().year, noteIndex: data.noteIndex || {}, covers: data.covers || {}, doneLog: data.doneLog || {}, prefs: { ...get().prefs, ...(data.prefs || {}) } })
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
          tasks: [...s.tasks.filter((t) => !t.sample && !(t.date && t.date.startsWith(String(y)))), ...sample.tasks.map((t) => ({ ...t, sample: true }))],
          habits: s.habits.length ? s.habits : sample.habits,
          notes: { ...sample.notes, ...s.notes },
        }))
      },
    }),
    {
      name: 'planzer-v1',
      version: 2,
      migrate: (state, from) => {
        if (from < 2 && state) state.tasks = (state.tasks || []).map((t) => newTask(t))
        return state
      },
      partialize: (s) => ({ year: s.year, goals: s.goals, tasks: s.tasks, notes: s.notes, habits: s.habits, theme: s.theme, noteIndex: s.noteIndex, covers: s.covers, fired: s.fired, doneLog: s.doneLog, prefs: s.prefs }),
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
  const tasks = state.tasks.filter((t) => !t.parentId && t.date && t.date.startsWith(prefix))
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
      tasks.push(newTask({ date, time: times[i % times.length], title: titles[(i + m) % titles.length], goalId: m >= g.start && m <= g.end ? g.id : null, done: past, priority: [1, 2, 3, 4, 4, 4][(i + m) % 6], labels: [['focus'], ['health'], [], ['work'], [], ['home']][(i + m) % 6] }))
    }
  }
  // a few Todoist-style extras around today
  const tk = t.key
  const plus = (n) => {
    const dt = new Date(t.y, t.m, t.d + n)
    return dateKey(dt.getFullYear(), dt.getMonth(), dt.getDate())
  }
  if (y === t.y) {
    const big = newTask({ title: 'Plan the weekend trip', date: plus(1), time: '19:00', priority: 2, labels: ['travel'], desc: 'Check trains and book a homestay.' })
    tasks.push(
      big,
      newTask({ title: 'Book train tickets', parentId: big.id, date: plus(1) }),
      newTask({ title: 'Pack the camera', parentId: big.id, date: plus(1) }),
      newTask({ title: 'Morning run', date: tk, time: '06:30', recur: { freq: 'day', every: 1 }, labels: ['health'], priority: 3 }),
      newTask({ title: 'Pay electricity bill', date: tk, time: '18:00', priority: 1, remind: 30, labels: ['home'] }),
      newTask({ title: 'Weekly review', date: plus(3), recur: { freq: 'week', every: 1 }, labels: ['focus'] }),
      newTask({ title: 'Submit assignment', date: plus(-1), priority: 1, labels: ['college'] }),
      newTask({ title: 'Buy a new notebook', labels: ['shopping'] }),
      newTask({ title: 'Ideas for the blog', desc: 'Photo story of the monsoon trip', labels: ['writing'] }),
    )
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

if (typeof window !== 'undefined' && location.search.includes('debug')) window.__store = useStore
