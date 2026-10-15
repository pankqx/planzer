import { lazy, Suspense, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from './store'
import Cosmos from './three/Cosmos'
import Intro from './ui/Intro'
import Cursor from './ui/Cursor'
import { Header, Dock } from './ui/Chrome'
import Modals from './ui/GoalModal'
import YearView from './views/YearView'

const MonthView = lazy(() => import('./views/MonthView'))
const HabitsView = lazy(() => import('./views/HabitsView'))
const PrintView = lazy(() => import('./views/PrintView'))

export default function App() {
  const phase = useStore((s) => s.phase)
  const view = useStore((s) => s.view)
  const go = useStore((s) => s.go)
  const month = useStore((s) => s.month)
  const openMonth = useStore((s) => s.openMonth)
  const modal = useStore((s) => s.modal)

  // Keyboard: Esc returns to the year, ←/→ walk through months.
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
                {view === 'print' && <PrintView />}
              </motion.div>
            </AnimatePresence>
          </Suspense>
          <Dock />
          <Modals />
        </>
      )}
      <div className="grain" />
      <Cursor />
    </>
  )
}
