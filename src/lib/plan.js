import { monthStats } from '../store'
import { MONTHS, daysIn, todayParts, parseKey } from './date'

export function statsFor(state, y, m) {
  return monthStats({ year: y, goals: state.goals, tasks: state.tasks, habits: state.habits }, m)
}

/** A short, plain-language summary anyone can read at a glance. */
export function plainSummary(stats, y, m) {
  const t = todayParts()
  const name = MONTHS[m]
  const isPast = y < t.y || (y === t.y && m < t.m)
  const isNow = y === t.y && m === t.m
  const left = isNow ? daysIn(y, m) - t.d : 0
  const pct = Math.round(stats.progress * 100)
  if (!stats.goals.length && !stats.tasks.length) {
    if (isPast) return `${name} has passed. Nothing was planned here.`
    return `${name} is empty. Add a goal, or tap a day to plan something.`
  }
  const parts = []
  if (stats.goals.length) parts.push(`${stats.goals.length} goal${stats.goals.length > 1 ? 's' : ''}`)
  if (stats.tasks.length) parts.push(`${stats.tasks.length} plan${stats.tasks.length > 1 ? 's' : ''}`)
  let s = `You have ${parts.join(' and ')} this month.`
  const byDay = {}
  for (const x of stats.tasks) byDay[x.date] = (byDay[x.date] || 0) + 1
  const busy = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0]
  if (busy && busy[1] > 1) s += ` Busiest day: the ${ordinal(parseKey(busy[0]).d)}.`
  if (isPast) s += ` You finished ${pct}%.`
  else if (isNow) s += ` ${left} day${left === 1 ? '' : 's'} left — you are ${pct}% done.`
  return s
}

export const ordinal = (n) => n + (n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th')
