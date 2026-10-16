import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { PAPER } from '../lib/theme'
import { LOOP } from '../ui/Logo'

/*
 * Paper opening: a pop-up book page. Card hills spring up one after another, the sun rises,
 * a kite crosses the sky, and the name drops in as tiles of coloured card.
 * Start → everything folds back down and the page lifts away.
 */
const HILLS = [
  { d: 'M-50,410 C80,250 200,300 300,280 C420,255 520,200 650,260 L650,420 Z', c: '#f2c3a7', delay: 0.15 },
  { d: 'M-50,420 C60,330 160,300 260,330 C360,360 460,290 650,320 L650,420 Z', c: '#e9a07a', delay: 0.3 },
  { d: 'M-50,420 C90,360 190,380 300,360 C420,340 520,370 650,350 L650,420 Z', c: '#d9775a', delay: 0.45 },
]
const TILE_COLORS = ['#e8574a', '#f2b632', '#2f7d4f', '#3d6f9a', '#d6336c', '#f26b2a', '#6c3fa0']

export default function PaperIntro() {
  const setPhase = useStore((s) => s.setPhase)
  const [leaving, setLeaving] = useState(false)
  const enter = () => {
    if (leaving) return
    setLeaving(true)
    setTimeout(() => setPhase('app'), 900)
  }
  useEffect(() => {
    const k = (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), enter())
    addEventListener('keydown', k)
    return () => removeEventListener('keydown', k)
  })
  return (
    <motion.div className="intro paper-intro" animate={leaving ? { y: '-105%', rotate: -2 } : { y: 0 }} transition={{ duration: 0.85, ease: [0.7, 0, 0.3, 1], delay: leaving ? 0.25 : 0 }}>
      <div className="pi-scene" aria-hidden>
        <svg viewBox="0 0 600 420" preserveAspectRatio="xMidYMax slice" className="pi-svg">
          <motion.g initial={{ y: 160 }} animate={leaving ? { y: 200 } : { y: 0 }} transition={{ type: 'spring', stiffness: 40, damping: 12, delay: leaving ? 0 : 0.5 }}>
            <g className="an-spin" style={{ animationDuration: '50s' }}>
              {Array.from({ length: 14 }, (_, i) => (
                <path key={i} d="M294,212 L300,186 L306,212 Z" fill="#f6b84a" transform={`rotate(${i * (360 / 14)} 300 280)`} />
              ))}
            </g>
            <circle cx="300" cy="280" r="62" fill="#f6a63a" className="pl-shadow" />
          </motion.g>
          <motion.g initial={{ x: -260, y: 60 }} animate={{ x: 760, y: -40 }} transition={{ duration: 9, ease: 'linear', delay: 1.4, repeat: Infinity, repeatDelay: 3 }}>
            <g className="an-kite" style={{ transformOrigin: '0px 40px' }}>
              <path d="M0,60 L22,80 L0,110 L-22,80 Z" fill="#3d6f9a" className="pl-shadow" />
              <path d="M0,60 L22,80 L0,80 Z M0,110 L-22,80 L0,80Z" fill="#7fb2dd" />
              <path d="M0,110 q12,18 0,36 q-12,18 0,36" stroke="#3d6f9a" strokeWidth="2" fill="none" />
            </g>
          </motion.g>
          {HILLS.map((h, i) => (
            <motion.path key={i} d={h.d} fill={h.c} className="pl-shadow" initial={{ y: 220 }} animate={leaving ? { y: 260 } : { y: 0 }} transition={{ type: 'spring', stiffness: 70, damping: 11, delay: leaving ? 0.05 * (3 - i) : h.delay }} />
          ))}
        </svg>
      </div>
      <div className="pi-center">
        <motion.svg className="pi-logo" viewBox="0 0 100 60" initial={{ scale: 0, rotate: -40 }} animate={leaving ? { scale: 0 } : { scale: 1, rotate: -6 }} transition={{ type: 'spring', stiffness: 220, damping: 14, delay: leaving ? 0 : 0.9 }} aria-hidden>
          <path d={LOOP} className="pi-loop-shadow" />
          <path d={LOOP} className="pi-loop" />
        </motion.svg>
        <h1 className="pi-word" aria-label="Planzer">
          {'planzer'.split('').map((c, i) => (
            <motion.span
              key={i}
              className="pi-tile"
              style={{ background: TILE_COLORS[i % TILE_COLORS.length] }}
              initial={{ y: -600, rotate: (i % 2 ? 1 : -1) * 30, opacity: 0 }}
              animate={leaving ? { y: -500, opacity: 0, rotate: (i % 2 ? -1 : 1) * 20 } : { y: 0, rotate: (i % 2 ? 1 : -1) * (3 + (i % 3) * 2), opacity: 1 }}
              transition={leaving ? { duration: 0.5, delay: i * 0.03, ease: 'easeIn' } : { type: 'spring', stiffness: 200, damping: 13, delay: 1.1 + i * 0.09 }}
            >
              {c}
            </motion.span>
          ))}
        </h1>
        <AnimatePresence>
          {!leaving && (
            <motion.div className="pi-under" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 2.0, duration: 0.8 } }} exit={{ opacity: 0, y: 10, transition: { duration: 0.2 } }}>
              <p className="pi-tag">your year, one page at a time</p>
              <button className="btn primary huge sticker" onClick={enter}>
                Start planning →
              </button>
              <p className="pi-small">or press Enter</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="pi-confetti" aria-hidden>
        {Array.from({ length: 18 }, (_, i) => (
          <i key={i} style={{ '--x': `${(i * 53) % 100}%`, '--d': `${(i % 6) * 0.7}s`, '--c': PAPER[i % 12].accent, '--r': `${(i * 37) % 360}deg` }} />
        ))}
      </div>
    </motion.div>
  )
}
