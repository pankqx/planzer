import { useEffect } from 'react'
import { useStore } from '../store'
import { reminderAt, reminderKey } from '../lib/tasks'

let ctx
/** A soft two-note bell made with WebAudio — no sound files needed. */
export function chime() {
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)()
    const now = ctx.currentTime
    ;[880, 1318.5].forEach((f, i) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = 'sine'
      o.frequency.value = f
      g.gain.setValueAtTime(0, now + i * 0.18)
      g.gain.linearRampToValueAtTime(0.22, now + i * 0.18 + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.18 + 1.2)
      o.connect(g).connect(ctx.destination)
      o.start(now + i * 0.18)
      o.stop(now + i * 0.18 + 1.3)
    })
  } catch {
    /* audio not available */
  }
}

export async function enableNotifications() {
  if (typeof Notification === 'undefined') return 'unsupported'
  try {
    return await Notification.requestPermission()
  } catch {
    return Notification.permission
  }
}

function ring(task, snoozed) {
  const s = useStore.getState()
  chime()
  s.toast({ id: `rem-${task.id}`, kind: 'reminder', taskId: task.id, title: task.title, snoozed })
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    try {
      const n = new Notification(`⏰ ${task.title}`, { body: task.time ? `Due at ${task.time}` : 'Reminder from Planzer', tag: task.id, icon: './favicon.svg' })
      n.onclick = () => {
        window.focus()
        useStore.getState().openTask(task.id)
      }
    } catch {
      /* some browsers only allow notifications from a service worker */
    }
  }
}

/** Checks every 15 seconds for reminders that are due (and snoozes that have ended). */
export function useReminderEngine() {
  useEffect(() => {
    const check = () => {
      const s = useStore.getState()
      const now = Date.now()
      for (const t of s.tasks) {
        if (t.done) continue
        if (t.snoozeUntil && t.snoozeUntil <= now) {
          const k = `${t.id}-snooze-${t.snoozeUntil}`
          if (!s.fired[k]) {
            s.markFired(k)
            s.updateTask(t.id, { snoozeUntil: null })
            ring(t, true)
          }
          continue
        }
        const at = reminderAt(t)
        if (!at || at > now || now - at > 6 * 3600e3) continue
        const k = reminderKey(t)
        if (s.fired[k]) continue
        s.markFired(k)
        ring(t)
      }
    }
    check()
    const iv = setInterval(check, 15000)
    const vis = () => document.visibilityState === 'visible' && check()
    document.addEventListener('visibilitychange', vis)
    return () => {
      clearInterval(iv)
      document.removeEventListener('visibilitychange', vis)
    }
  }, [])
}
