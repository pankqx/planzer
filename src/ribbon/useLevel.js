import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../store'
import { live, nav, useSlots } from '../lib/nav'
import { NEON, PAPER, mix, monthOf, yearOf, monthColor } from '../lib/theme'
import { daysIn } from '../lib/date'
import { yearLayout, monthLayout } from './layouts'

const clamp01 = (x) => Math.max(0, Math.min(1, x))

/** Shared brain for a level: layout, focus/jumps, keyboard stepping, colour morph, 3D slots. */
export function useLevel(kind) {
  const make = kind === 'year' ? yearLayout : monthLayout
  const [L, setL] = useState(() => make(window.innerWidth, window.innerHeight))
  const LRef = useRef(L)
  LRef.current = L
  const ribbon = useRef()
  const theme = useStore((s) => s.theme)
  const themeRef = useRef(theme)
  themeRef.current = theme
  const focusAbs = useStore((s) => s.focusAbs)
  const focusDay = useStore((s) => s.focusDay)
  const jumpId = useStore((s) => s.jumpId)
  const setYear = useStore((s) => s.setYear)

  const targetX = useCallback((abs, day, Lx = LRef.current) => {
    if (Lx.kind === 'year') return Lx.cardLeft(abs) + Lx.cardW / 2 - Lx.vw / 2
    if (day) return Lx.dayLeft(abs, Math.min(day, daysIn(yearOf(abs), monthOf(abs)))) + Lx.dayW / 2 - Lx.vw / 2
    return Lx.posOf(abs) - (Lx.vw - Lx.posterW) / 2
  }, [])

  const startX = useMemo(() => targetX(focusAbs, focusDay), []) // eslint-disable-line react-hooks/exhaustive-deps

  // store-driven jumps (Today, scrubber, year card → month …)
  const seenJump = useRef(jumpId)
  useEffect(() => {
    if (jumpId === seenJump.current) return
    seenJump.current = jumpId
    ribbon.current?.scrollTo(targetX(focusAbs, focusDay))
  }, [jumpId, focusAbs, focusDay, targetX])

  // keep the same moment centred through resizes and rotations
  useEffect(() => {
    let t
    const on = () => {
      clearTimeout(t)
      t = setTimeout(() => {
        const c = live.center
        const nl = make(window.innerWidth, window.innerHeight)
        LRef.current = nl
        setL(nl)
        const k = Math.floor(c)
        ribbon.current?.scrollTo(nl.posOf(k) + (c - k) * nl.widthOf(k) - nl.vw / 2, { instant: true })
      }, 60)
    }
    addEventListener('resize', on)
    return () => removeEventListener('resize', on)
  }, [make])

  // stops = centres of every card the arrows can land on
  const stops = useCallback((k) => {
    const Lx = LRef.current
    const out = []
    for (let j = k - 2; j <= k + 2; j++) {
      if (Lx.kind === 'year') out.push(Lx.cardLeft(j) + Lx.cardW / 2)
      else {
        out.push(Lx.posOf(j) + Lx.posterW / 2)
        const n = daysIn(yearOf(j), monthOf(j))
        for (let d = 1; d <= n; d++) out.push(Lx.dayLeft(j, d) + Lx.dayW / 2)
      }
    }
    return out
  }, [])

  useEffect(() => {
    nav.ribbon = {
      goToMonth: (abs, day, instant) => ribbon.current?.scrollTo(targetX(abs, day), { instant }),
      step: (dir) => {
        const Lx = LRef.current
        const mid = ribbon.current.X + Lx.vw / 2
        const list = stops(Lx.segAt(mid))
        const next = dir > 0 ? list.find((s) => s > mid + 4) : [...list].reverse().find((s) => s < mid - 4)
        if (next != null) ribbon.current.scrollTo(next - Lx.vw / 2)
      },
      stepMonth: (dir) => {
        const Lx = LRef.current
        const k = Lx.segAt(ribbon.current.X + Lx.vw / 2)
        ribbon.current.scrollTo(targetX(k + dir))
      },
    }
    return () => {
      nav.ribbon = null
    }
  }, [stops, targetX])

  // every frame: where are we, and what colour is the world?
  const lastAccent = useRef('')
  const lastYear = useRef(null)
  const onFrame = useCallback(
    (X, vel) => {
      const Lx = LRef.current
      const mid = X + Lx.vw / 2
      const k = Lx.segAt(mid)
      const p0 = Lx.posOf(k)
      const w = Lx.widthOf(k)
      live.center = k + (mid - p0) / w
      live.vel = vel
      live.level = Lx.kind
      const zone = Lx.kind === 'year' ? w * 0.6 : Lx.vw * 0.6
      const t = clamp01(1 - (p0 + w - mid) / zone)
      const e = t * t * (3 - 2 * t)
      const neon = themeRef.current === 'neon'
      const col = (j) => monthColor(themeRef.current, monthOf(j))
      const accent = mix(col(k), col(k + 1), e)
      if (accent !== lastAccent.current) {
        lastAccent.current = accent
        live.accent = accent
        const root = document.documentElement.style
        root.setProperty('--accent', accent)
        if (themeRef.current === 'paper') root.setProperty('--tint', mix(PAPER[monthOf(k)].sky, PAPER[monthOf(k + 1)].sky, e))
      }
      const y = yearOf(k)
      if (y !== lastYear.current) {
        lastYear.current = y
        setYear(y)
      }
    },
    [setYear],
  )

  // tell the neon stage which sculptures to draw
  const setSlots = useSlots((s) => s.setSlots)
  const lastSlots = useRef('')
  const onRange = useCallback(
    ([a, b]) => {
      const list = []
      if (themeRef.current === 'neon') for (let k = a; k <= b; k++) list.push({ id: `art-${kind}-${k}`, m: monthOf(k) })
      const key = list.map((s) => s.id).join()
      if (key !== lastSlots.current) {
        lastSlots.current = key
        queueMicrotask(() => setSlots(kind, list))
      }
    },
    [kind, setSlots],
  )
  useEffect(() => () => setSlots(kind, []), [kind, setSlots])
  useEffect(() => {
    lastSlots.current = ''
    lastAccent.current = ''
  }, [theme])

  return { L, ribbon, startX, onFrame, onRange }
}
