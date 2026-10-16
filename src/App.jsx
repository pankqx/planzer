import { lazy, Suspense, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useStore } from './store'
import { live, nav } from './lib/nav'
import { absOf } from './lib/theme'
import { todayParts } from './lib/date'
import NeonIntro from './intro/NeonIntro'
import PaperIntro from './intro/PaperIntro'
import MonthLevel from './ribbon/MonthLevel'
import YearLevel from './ribbon/YearLevel'
import { TopBar, Scrubber, SideArrows, Hint, AddButton } from './ui/Chrome'
import Sheets from './ui/Sheets'

const NeonStage = lazy(() => import('./neon/NeonStage'))
const PrintView = lazy(() => import('./views/PrintView'))
const SolarApp = lazy(() => import('./solar/SolarApp'))

export default function App() {
  const theme = useStore((s) => s.theme)
  const phase = useStore((s) => s.phase)
  const level = useStore((s) => s.level)
  const sheet = useStore((s) => s.sheet)
  const goTo = useStore((s) => s.goTo)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'paper' ? '#f4ede0' : theme === 'solar' ? '#03040a' : '#050506')
  }, [theme])

  useEffect(() => {
    const onKey = (e) => {
      if (theme === 'solar' || phase !== 'app' || sheet || /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)) return
      const r = nav.ribbon
      if (e.key === 'ArrowRight') (e.shiftKey ? r?.stepMonth(1) : r?.step(1), e.preventDefault())
      if (e.key === 'ArrowLeft') (e.shiftKey ? r?.stepMonth(-1) : r?.step(-1), e.preventDefault())
      const k = e.key.toLowerCase()
      if (k === 't') {
        const t = todayParts()
        goTo('month', absOf(t.y, t.m), t.d)
      }
      if (k === 'y' && level !== 'year') goTo('year', Math.floor(live.center))
      if (k === 'm' && level !== 'month') goTo('month', Math.floor(live.center))
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [theme, phase, sheet, level, goTo])

  if (theme === 'solar')
    return (
      <>
        <Suspense fallback={null}>
          <SolarApp />
        </Suspense>
        {sheet?.type === 'print' && (
          <Suspense fallback={null}>
            <PrintView />
          </Suspense>
        )}
        <div className="grain" aria-hidden />
      </>
    )

  return (
    <>
      {theme === 'neon' && (
        <Suspense fallback={null}>
          <NeonStage />
        </Suspense>
      )}
      {theme === 'paper' && <div className="paper-bg" aria-hidden />}
      <AnimatePresence>{phase === 'intro' && (theme === 'neon' ? <NeonIntro key="ni" /> : <PaperIntro key="pi" />)}</AnimatePresence>
      {phase === 'app' && (
        <main className="app">
          <AnimatePresence mode="wait">{level === 'year' ? <YearLevel key="year" /> : <MonthLevel key="month" />}</AnimatePresence>
          <TopBar />
          <SideArrows />
          <Scrubber />
          <AddButton />
          <Hint />
          <Sheets />
        </main>
      )}
      {sheet?.type === 'print' && (
        <Suspense fallback={null}>
          <PrintView />
        </Suspense>
      )}
      <div className="grain" aria-hidden />
    </>
  )
}
