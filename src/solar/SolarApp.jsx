import { lazy, Suspense, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import gsap from 'gsap'
import { useStore } from '../store'
import Cosmos from './three/Cosmos'
import { sig } from './three/signals'
import Intro from './ui/Intro'
import Cursor from './ui/Cursor'
import { Header, Dock } from './ui/Chrome'
import Modals from './ui/GoalModal'
import YearView from './views/YearView'
import './solar.css'

const MonthView = lazy(() => import('./views/MonthView'))
const HabitsView = lazy(() => import('./views/HabitsView'))

/** The Solar world: the year as a 3D orrery of twelve planet-months. Shares all data with Neon and Paper. */
export default function SolarApp() {
  const phase = useStore((s) => s.phase)
  const view = useStore((s) => s.view)
  const go = useStore((s) => s.go)
  const month = useStore((s) => s.month)
  const openMonth = useStore((s) => s.openMonth)
  const modal = useStore((s) => s.modal)
  const setSheet = useStore((s) => s.setSheet)

  // arriving from another theme mid-session: ignite the orrery straight away
  useEffect(() => {
    if (useStore.getState().phase === 'app') gsap.fromTo(sig, { orrery: 0 }, { orrery: 1, duration: 2.6, ease: 'power3.out', delay: 0.2 })
  }, [])

  // the Print tab opens the shared print studio
  useEffect(() => {
    if (view === 'print') {
      setSheet({ type: 'print' })
      go('year')
    }
  }, [view, setSheet, go])

  useEffect(() => {
    const onKey = (e) => {
      if (phase !== 'app' || modal || /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)) return
      if (e.key === 'Escape' && view !== 'year') go('year')
      if (view === 'month' && e.key === 'ArrowRight') openMonth((month + 1) % 12)
      if (view === 'month' && e.key === 'ArrowLeft') openMonth((month + 11) % 12)
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [phase, view, month, modal, go, openMonth])

  return (
    <>
      <Cosmos />
      <div className="vignette" />
      <AnimatePresence>{phase === 'intro' && <Intro key="intro" />}</AnimatePresence>
      {phase === 'app' && (
        <>
          <Header />
          <Suspense fallback={null}>
            <AnimatePresence mode="wait">
              <motion.div key={view} exit={{ opacity: 1, transition: { duration: 0.5 } }}>
                {view === 'year' && <YearView />}
                {view === 'month' && <MonthView />}
                {view === 'habits' && <HabitsView />}
              </motion.div>
            </AnimatePresence>
          </Suspense>
          <Dock />
          <Modals />
        </>
      )}
      <Cursor />
    </>
  )
}
