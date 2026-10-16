import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'

export const THEMES = [
  { id: 'neon', name: 'Neon', note: 'Dark · bright 3D objects' },
  { id: 'paper', name: 'Paper', note: 'Light · cut-paper scenes' },
  { id: 'solar', name: 'Solar', note: 'Space · planets & gold' },
]

function Preview({ id }) {
  if (id === 'neon')
    return (
      <svg viewBox="0 0 64 40" className="tp-prev">
        <rect width="64" height="40" rx="6" fill="#050506" />
        <path d="M32 20 C38 12,50 12,50 20 C50 28,38 28,32 20 C26 12,14 12,14 20 C14 28,26 28,32 20Z" fill="none" stroke="#3DF5FF" strokeWidth="2.4" />
        <circle cx="50" cy="20" r="2.6" fill="#FF3D8B" />
      </svg>
    )
  if (id === 'paper')
    return (
      <svg viewBox="0 0 64 40" className="tp-prev">
        <rect width="64" height="40" rx="6" fill="#f4ede0" />
        <path d="M0 30 C14 22 26 26 36 24 C48 21 56 24 64 22 L64 40 L0 40Z" fill="#e9a07a" />
        <path d="M0 35 C16 30 30 34 42 31 C52 29 58 32 64 31 L64 40 L0 40Z" fill="#d9775a" />
        <circle cx="46" cy="14" r="6" fill="#f6a63a" />
        <rect x="10" y="8" width="8" height="8" rx="2" fill="#e8574a" transform="rotate(-6 14 12)" />
        <rect x="20" y="9" width="8" height="8" rx="2" fill="#2f7d4f" transform="rotate(5 24 13)" />
      </svg>
    )
  return (
    <svg viewBox="0 0 64 40" className="tp-prev">
      <rect width="64" height="40" rx="6" fill="#070914" />
      <ellipse cx="32" cy="22" rx="24" ry="9" fill="none" stroke="#e6c98a" strokeWidth="0.8" opacity=".7" />
      <ellipse cx="32" cy="22" rx="15" ry="5.5" fill="none" stroke="#e6c98a" strokeWidth="0.8" opacity=".5" />
      <circle cx="32" cy="21" r="5" fill="#ffd68a" />
      <circle cx="54" cy="24" r="2.4" fill="#ff9f6e" />
      <circle cx="20" cy="16.5" r="1.8" fill="#9fc4ff" />
      <circle cx="9" cy="8" r=".6" fill="#fff" />
      <circle cx="56" cy="7" r=".6" fill="#fff" />
    </svg>
  )
}

/** One button to choose the world: Neon, Paper or Solar. Switching reveals the new world in a growing circle. */
export default function ThemePicker({ compact = false }) {
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)
  const [open, setOpen] = useState(false)
  const box = useRef()
  const btn = useRef()
  useEffect(() => {
    const close = (e) => box.current && !box.current.contains(e.target) && setOpen(false)
    const esc = (e) => e.key === 'Escape' && setOpen(false)
    addEventListener('pointerdown', close)
    addEventListener('keydown', esc)
    return () => {
      removeEventListener('pointerdown', close)
      removeEventListener('keydown', esc)
    }
  }, [])
  const pick = (next) => {
    setOpen(false)
    if (next === theme) return
    const r = btn.current.getBoundingClientRect()
    const x = r.left + r.width / 2
    const y = r.top + r.height / 2
    if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return setTheme(next)
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
    const vt = document.startViewTransition(() => flushSync(() => setTheme(next)))
    vt.ready.then(() =>
      document.documentElement.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] }, { duration: 1000, easing: 'cubic-bezier(.7,0,.2,1)', pseudoElement: '::view-transition-new(root)' }),
    )
  }
  const cur = THEMES.find((t) => t.id === theme) || THEMES[0]
  return (
    <div className="tpick" ref={box}>
      <button ref={btn} className="btn icon tp-btn" onClick={() => setOpen(!open)} aria-haspopup="true" aria-expanded={open} aria-label={`Theme: ${cur.name}. Change theme`}>
        <svg viewBox="0 0 24 24" width="21" height="21" aria-hidden>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 3.5a8.5 8.5 0 0 0 0 17z" className="tp-half" />
        </svg>
        {!compact && <span className="lbl">{cur.name}</span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="tp-pop" role="menu" initial={{ opacity: 0, y: -8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}>
            <div className="tp-h">Choose a theme</div>
            {THEMES.map((t) => (
              <button key={t.id} role="menuitemradio" aria-checked={theme === t.id} className={`tp-opt ${theme === t.id ? 'on' : ''}`} onClick={() => pick(t.id)}>
                <Preview id={t.id} />
                <span>
                  <b>{t.name}</b>
                  <small>{t.note}</small>
                </span>
                {theme === t.id && <i aria-hidden>✓</i>}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
