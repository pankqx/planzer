import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { live, nav } from '../lib/nav'
import { MONTHS, todayParts } from '../lib/date'
import { absOf, mod12, yearOf } from '../lib/theme'
import Logo from './Logo'
import ThemePicker from './ThemePicker'
import { TasksButton } from '../workspace/Workspace'

export function TopBar() {
  const level = useStore((s) => s.level)
  const goTo = useStore((s) => s.goTo)
  const setSheet = useStore((s) => s.setSheet)
  const setPhase = useStore((s) => s.setPhase)
  const t = todayParts()
  const here = () => Math.floor(live.center)
  return (
    <motion.header className="topbar" initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}>
      <Logo onClick={() => setPhase('landing')} />
      <div className="switch" role="tablist" aria-label="Zoom">
        {[
          ['year', 'Year'],
          ['month', 'Month'],
        ].map(([id, label]) => (
          <button key={id} role="tab" aria-selected={level === id} className={level === id ? 'on' : ''} onClick={() => level !== id && goTo(id, here(), null)}>
            {level === id && <motion.i layoutId="sw" className="sw-pill" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
            <span>{label}</span>
          </button>
        ))}
      </div>
      <div className="tb-right">
        <button className="btn today" onClick={() => goTo('month', absOf(t.y, t.m), t.d)}>
          <span className="tdot" /> Today
        </button>
        <TasksButton />
        <ThemePicker />
        <button className="btn icon" onClick={() => setSheet({ type: 'menu' })} aria-label="Menu">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
          <span className="lbl">Menu</span>
        </button>
      </div>
    </motion.header>
  )
}

/** Flips between the neon and paper worlds with a circular reveal from the button. */
export function ThemeToggle() {
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)
  const flip = (e) => {
    const next = theme === 'neon' ? 'paper' : 'neon'
    const r = e.currentTarget.getBoundingClientRect()
    const x = r.left + r.width / 2
    const y = r.top + r.height / 2
    if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return setTheme(next)
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
    const vt = document.startViewTransition(() => flushSync(() => setTheme(next)))
    vt.ready.then(() =>
      document.documentElement.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] }, { duration: 950, easing: 'cubic-bezier(.7,0,.2,1)', pseudoElement: '::view-transition-new(root)' }),
    )
  }
  return (
    <button className={`btn icon theme-toggle ${theme}`} onClick={flip} aria-label={theme === 'neon' ? 'Switch to paper (light) theme' : 'Switch to neon (dark) theme'}>
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
        {theme === 'neon' ? (
          <g>
            <circle cx="12" cy="12" r="4.5" />
            {Array.from({ length: 8 }, (_, i) => (
              <path key={i} d="M12 2.5v2.5" transform={`rotate(${i * 45} 12 12)`} />
            ))}
          </g>
        ) : (
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
        )}
      </svg>
      <span className="lbl">{theme === 'neon' ? 'Light' : 'Dark'}</span>
    </button>
  )
}

/** The twelve-month strip along the bottom: always shows where you are; tap to jump. */
export function Scrubber() {
  const [year, setYear] = useState(() => yearOf(Math.floor(live.center)) || todayParts().y)
  const ind = useRef()
  const yearRef = useRef(year)
  useEffect(() => {
    let raf
    const loop = () => {
      const k = Math.floor(live.center)
      const y = yearOf(k)
      if (y !== yearRef.current && Number.isFinite(y)) {
        yearRef.current = y
        setYear(y)
      }
      const pos = mod12(k) + (live.center - k)
      if (ind.current) ind.current.style.transform = `translateX(${(pos * 100).toFixed(2)}%)`
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(raf)
  }, [])
  const go = (abs) => nav.ribbon?.goToMonth(abs)
  const t = todayParts()
  return (
    <div className="scrub-wrap">
    <motion.nav className="scrub" aria-label="Months" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}>
      <button className="scrub-y" onClick={() => go(absOf(year - 1, 0))} aria-label="Previous year">
        ‹
      </button>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={year} className="scrub-year" initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }}>
          {year}
        </motion.span>
      </AnimatePresence>
      <div className="scrub-track">
        <i className="scrub-ind" ref={ind} />
        {MONTHS.map((name, i) => (
          <button key={i} className={`scrub-m ${year === t.y && i === t.m ? 'cur' : ''}`} onClick={() => go(absOf(year, i))} aria-label={`${name} ${year}`}>
            <span className="full">{name.slice(0, 3)}</span>
            <span className="short">{name[0]}</span>
          </button>
        ))}
      </div>
      <button className="scrub-y" onClick={() => go(absOf(year + 1, 0))} aria-label="Next year">
        ›
      </button>
    </motion.nav>
    </div>
  )
}

export function SideArrows() {
  return (
    <>
      <button className="side-arrow left" onClick={() => nav.ribbon?.step(-1)} aria-label="Back">
        <svg viewBox="0 0 24 24" width="26" height="26">
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </button>
      <button className="side-arrow right" onClick={() => nav.ribbon?.step(1)} aria-label="Forward">
        <svg viewBox="0 0 24 24" width="26" height="26">
          <path d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </>
  )
}

/** A gentle one-time hint for people who have never scrolled sideways before. */
export function Hint() {
  const [show, setShow] = useState(() => {
    try {
      return localStorage.getItem('planzer-hint') !== '1'
    } catch {
      return true
    }
  })
  useEffect(() => {
    if (!show) return
    const done = () => {
      setShow(false)
      try {
        localStorage.setItem('planzer-hint', '1')
      } catch {
        /* ignore */
      }
    }
    const t = setTimeout(done, 9000)
    const onMove = () => Math.abs(live.vel) > 400 && done()
    const iv = setInterval(onMove, 250)
    return () => {
      clearTimeout(t)
      clearInterval(iv)
    }
  }, [show])
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="hint-wrap" key="hint"><motion.div className="hint" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 1.4 } }} exit={{ opacity: 0, y: 10 }}>
          <span className="hint-hand" aria-hidden>
            ⟷
          </span>
          Scroll, swipe or drag sideways — time keeps going.
        </motion.div></motion.div>
      )}
    </AnimatePresence>
  )
}

export function AddButton() {
  const setSheet = useStore((s) => s.setSheet)
  return (
    <motion.button className="fab" onClick={() => setSheet({ type: 'add' })} initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.8 }} aria-label="Add a goal or a plan">
      <span>＋</span>
      <b>Add</b>
    </motion.button>
  )
}
