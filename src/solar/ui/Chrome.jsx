import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../../store'
import { MONTHS, todayParts, toRoman } from '../../lib/date'
import Mark from './Mark'
import ThemePicker from '../../ui/ThemePicker'
import Magnetic from './Magnetic'
import { sig } from '../three/signals'

const ease = [0.22, 1, 0.36, 1]

export function Header() {
  const year = useStore((s) => s.year)
  const setYear = useStore((s) => s.setYear)
  const setPhase = useStore((s) => s.setPhase)
  const go = useStore((s) => s.go)
  const t = todayParts()
  const replay = () => {
    go('year')
    sig.orrery = 0
    sessionStorage.removeItem('planzer-seen')
    setPhase('intro')
  }
  return (
    <motion.header
      className="hdr"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2, ease, delay: 0.9 }}
    >
      <style>{`
        .hdr { position: fixed; z-index: 30; top: 0; left: 0; right: 0; display: flex; align-items: center; justify-content: space-between; padding: 22px 30px; pointer-events: none; }
        .hdr > * { pointer-events: auto; }
        .brand { display: flex; align-items: center; gap: 12px; color: var(--gold); }
        .brand .name { font-family: var(--display); font-size: 19px; letter-spacing: .38em; color: var(--ivory); }
        .brand:hover svg { animation: spinmark 2.4s var(--ease); }
        @keyframes spinmark { to { transform: rotate(360deg); } }
        .yr { display: flex; align-items: center; gap: 6px; padding: 6px 8px; border-radius: 999px; }
        .yr button { width: 30px; height: 30px; border-radius: 50%; color: var(--gold); transition: background .4s; }
        .yr button:hover { background: rgba(230,201,138,.12); }
        .yr span { font-family: var(--display); font-size: 17px; letter-spacing: .25em; min-width: 74px; text-align: center; }
        .hdr-r { display: flex; align-items: center; gap: 14px; }
        .today { text-align: right; font-size: 10px; letter-spacing: .28em; text-transform: uppercase; color: var(--faint); line-height: 1.7; }
        .today b { display: block; font-family: var(--serif); font-style: italic; font-weight: 400; font-size: 17px; letter-spacing: .02em; text-transform: none; color: var(--ivory); }
        @media (max-width: 760px) { .hdr { padding: 14px 14px; } .brand .name { display: none; } .today { display: none; } }
      `}</style>
      <button className="brand" onClick={replay} data-cursor="Replay">
        <Mark size={30} />
        <span className="name">PLANZER</span>
      </button>
      <div className="yr glass">
        <button onClick={() => setYear(year - 1)} aria-label="Previous year">‹</button>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={year} initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -10, filter: 'blur(6px)' }} transition={{ duration: 0.6, ease }} title={toRoman(year)}>
            {year}
          </motion.span>
        </AnimatePresence>
        <button onClick={() => setYear(year + 1)} aria-label="Next year">›</button>
      </div>
      <div className="hdr-r">
        <div className="today">
          Today
          <b>
            {new Date().toLocaleDateString('en-US', { weekday: 'long' })}, {t.d} {MONTHS[t.m]}
          </b>
        </div>
        <ThemePicker />
        <Menu />
      </div>
    </motion.header>
  )
}

function Menu() {
  const [open, setOpen] = useState(false)
  const exportData = useStore((s) => s.exportData)
  const importData = useStore((s) => s.importData)
  const loadSample = useStore((s) => s.loadSample)
  const clearYear = useStore((s) => s.clearYear)
  const year = useStore((s) => s.year)
  const file = useRef()
  const box = useRef()
  useEffect(() => {
    const close = (e) => box.current && !box.current.contains(e.target) && setOpen(false)
    addEventListener('pointerdown', close)
    return () => removeEventListener('pointerdown', close)
  }, [])
  const doExport = () => {
    const blob = new Blob([JSON.stringify(exportData(), null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `planzer-${year}-backup.json`
    a.click()
    URL.revokeObjectURL(a.href)
    setOpen(false)
  }
  const doImport = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    try {
      importData(JSON.parse(await f.text()))
    } catch (err) {
      alert(err.message || 'Could not read that file.')
    }
    e.target.value = ''
    setOpen(false)
  }
  const items = [
    ['Export backup', 'Download every goal, plan and habit as JSON', doExport],
    ['Import backup', 'Restore from a Planzer JSON file', () => file.current.click()],
    ['Load sample year', `Fill ${year} with an example sky to explore`, () => (loadSample(), setOpen(false))],
    ['Clear this year', `Remove ${year}'s goals and plans`, () => confirm(`Clear all goals and plans for ${year}? Habits are kept.`) && (clearYear(), setOpen(false))],
  ]
  return (
    <div ref={box} style={{ position: 'relative' }}>
      <Magnetic>
        <button className="glass" onClick={() => setOpen(!open)} aria-label="Menu" style={{ width: 44, height: 44, borderRadius: '50%', display: 'grid', placeItems: 'center', color: 'var(--gold)' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="8" cy="3" r="1.4" />
            <circle cx="8" cy="8" r="1.4" />
            <circle cx="8" cy="13" r="1.4" />
          </svg>
        </button>
      </Magnetic>
      <input ref={file} type="file" accept="application/json" hidden onChange={doImport} />
      <AnimatePresence>
        {open && (
          <motion.div
            className="glass"
            initial={{ opacity: 0, y: -8, scale: 0.96, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, scale: 0.96, filter: 'blur(6px)' }}
            transition={{ duration: 0.45, ease }}
            style={{ position: 'absolute', right: 0, top: 54, width: 290, padding: 8, transformOrigin: 'top right', zIndex: 50 }}
          >
            {items.map(([t, d, fn]) => (
              <button key={t} onClick={fn} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 14px', borderRadius: 14 }} className="smenu-item">
                <div style={{ fontSize: 13, color: 'var(--ivory)' }}>{t}</div>
                <div style={{ fontSize: 11, color: 'var(--faint)', marginTop: 3 }}>{d}</div>
              </button>
            ))}
            <style>{`.smenu-item { transition: background .3s } .smenu-item:hover { background: rgba(230,201,138,.08) }`}</style>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const TABS = [
  ['year', 'Year', '◎'],
  ['month', 'Month', '◐'],
  ['habits', 'Habits', '✦'],
  ['print', 'Print', '❏'],
]

export function Dock() {
  const view = useStore((s) => s.view)
  const go = useStore((s) => s.go)
  return (
    <div className="dock-wrap">
    <motion.nav
      className="dock glass"
      initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 1.3, ease, delay: 1.3 }}
    >
      <style>{`
        .dock-wrap { position: fixed; z-index: 30; left: 0; right: 0; bottom: 24px; display: flex; justify-content: center; pointer-events: none; }
        .dock { pointer-events: auto; display: flex; gap: 4px; padding: 6px; border-radius: 999px; }
        .dock button { position: relative; isolation: isolate; display: flex; align-items: center; gap: 8px; padding: 11px 20px; border-radius: 999px; font-size: 11px; letter-spacing: .24em; text-transform: uppercase; color: var(--mute); transition: color .4s; }
        .dock button:hover { color: var(--ivory); }
        .dock button.on { color: #1a1206; }
        .dock .pill { position: absolute; inset: 0; border-radius: 999px; background: linear-gradient(180deg, #f5e2b3, #c99d55); box-shadow: 0 0 30px -4px rgba(230,201,138,.7); z-index: -1; }
        .dock i { font-style: normal; font-size: 13px; }
        @media (max-width: 640px) { .dock-wrap { bottom: 12px; } .dock button { padding: 11px 13px; } .dock .lbl { display: none; } .dock i { font-size: 15px; } }
        @media print { .dock-wrap { display: none; } }
      `}</style>
      {TABS.map(([id, label, glyph]) => (
        <button key={id} className={view === id ? 'on' : ''} onClick={() => go(id)}>
          {view === id && <motion.span layoutId="pill" className="pill" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
          <i>{glyph}</i>
          <span className="lbl">{label}</span>
        </button>
      ))}
    </motion.nav>
    </div>
  )
}
