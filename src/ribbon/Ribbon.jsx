import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'

const damp = (a, b, lambda, dt) => a + (b - a) * (1 - Math.exp(-lambda * dt))

/**
 * An endless horizontal ribbon.
 *
 * `layout` maps an integer segment index k (one month) to an absolute pixel position:
 *   posOf(k), widthOf(k), segAt(X)
 * Only the segments near the viewport are rendered. Scrolling is a single float X (the
 * absolute position of the viewport's left edge), eased toward a target Xt every frame.
 * Children positioned with `data-c` (absolute centre) receive a live `--d` CSS variable:
 * their distance from the viewport centre in viewport widths, which drives the curve,
 * parallax and reveal animations purely in CSS.
 */
const Ribbon = forwardRef(function Ribbon({ layout, renderSegment, startX, onFrame, onRange, className, style }, ref) {
  const wrap = useRef()
  const track = useRef()
  const st = useRef({ X: startX, Xt: startX, vel: 0, drag: null, moved: false, items: [], base: 0 })
  const layoutRef = useRef(layout)
  layoutRef.current = layout

  const calcRange = useCallback((X) => {
    const vw = window.innerWidth
    const L = layoutRef.current
    return [L.segAt(X - vw * 0.75) - 0, L.segAt(X + vw * 1.75)]
  }, [])
  const [range, setRange] = useState(() => calcRange(startX))
  const rangeRef = useRef(range)

  useImperativeHandle(ref, () => ({
    get X() {
      return st.current.Xt
    },
    scrollTo(X, { instant = false, whoosh = true } = {}) {
      const s = st.current
      const vw = window.innerWidth
      // long jumps: teleport most of the way, then glide the last stretch in
      if (instant) {
        s.X = s.Xt = X
      } else if (whoosh && Math.abs(X - s.X) > vw * 3) {
        s.X = X - Math.sign(X - s.X) * vw * 1.4
        s.Xt = X
      } else s.Xt = X
    },
    scrollBy(dx) {
      st.current.Xt += dx
    },
  }))

  const apply = () => {
    const s = st.current
    if (track.current) track.current.style.transform = `translate3d(${(-(s.X - s.base)).toFixed(2)}px,0,0)`
  }

  // after each render: rebase the track and collect animated children
  useLayoutEffect(() => {
    const s = st.current
    s.base = layoutRef.current.posOf(range[0])
    s.items = track.current ? [...track.current.querySelectorAll('[data-c]')].map((el) => ({ el, c: +el.dataset.c, last: 99 })) : []
    apply()
    rangeRef.current = range
    onRange?.(range)
  })

  useEffect(() => {
    let raf
    let last = performance.now()
    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const s = st.current
      const prev = s.X
      s.X = damp(s.X, s.Xt, s.drag?.active ? 22 : 7.5, dt)
      if (Math.abs(s.X - s.Xt) < 0.05) s.X = s.Xt
      const v = (s.X - prev) / Math.max(dt, 1e-3)
      s.vel = damp(s.vel, v, 10, dt)
      apply()
      const vw = window.innerWidth
      const mid = s.X + vw / 2
      for (const it of s.items) {
        const d = (it.c - mid) / vw
        if (Math.abs(d) < 1.6 || Math.abs(it.last) < 1.6) {
          const q = Math.round(d * 1000) / 1000
          if (q !== it.last) {
            it.el.style.setProperty('--d', q)
            it.last = q
          }
        }
      }
      track.current?.style.setProperty('--v', Math.max(-1, Math.min(1, s.vel / 4000)).toFixed(3))
      const r = calcRange(s.X)
      const cur = rangeRef.current
      if (r[0] !== cur[0] || r[1] !== cur[1]) {
        rangeRef.current = r
        setRange(r)
      }
      onFrame?.(s.X, s.vel)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [calcRange, onFrame])

  // ——— input: wheel, drag, touch ———
  useEffect(() => {
    const el = wrap.current
    const s = st.current
    const scrollable = (t, dy) => {
      const box = t.closest?.('[data-vscroll]')
      if (!box) return false
      return dy > 0 ? box.scrollTop + box.clientHeight < box.scrollHeight - 1 : box.scrollTop > 0
    }
    const onWheel = (e) => {
      if (e.ctrlKey) return
      const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY)
      if (!horizontal && scrollable(e.target, e.deltaY)) return
      e.preventDefault()
      let d = horizontal ? e.deltaX : e.deltaY
      if (e.deltaMode === 1) d *= 36
      if (e.deltaMode === 2) d *= window.innerWidth
      s.Xt += d * 1.15
    }
    const onDown = (e) => {
      if (e.button !== 0 || e.target.closest('input, textarea, select, [data-nodrag]')) return
      s.drag = { x0: e.clientX, y0: e.clientY, X0: s.Xt, active: false, id: e.pointerId, t: performance.now(), samples: [] }
      s.moved = false
    }
    const onMove = (e) => {
      const d = s.drag
      if (!d || e.pointerId !== d.id) return
      const dx = e.clientX - d.x0
      if (!d.active) {
        if (Math.abs(dx) < 7 || Math.abs(dx) < Math.abs(e.clientY - d.y0)) return
        d.active = true
        s.moved = true
        el.setPointerCapture?.(e.pointerId)
        el.classList.add('dragging')
      }
      s.Xt = d.X0 - dx
      d.samples.push([performance.now(), e.clientX])
      if (d.samples.length > 6) d.samples.shift()
    }
    const onUp = () => {
      const d = s.drag
      s.drag = null
      el.classList.remove('dragging')
      if (!d?.active) return
      const sm = d.samples
      if (sm.length > 1) {
        const [t0, x0] = sm[0]
        const [t1, x1] = sm[sm.length - 1]
        const v = (x1 - x0) / Math.max(1, t1 - t0) // px/ms
        if (performance.now() - t1 < 80) s.Xt -= v * 320
      }
    }
    // a drag must never also count as a click on what it started over
    const onClick = (e) => {
      if (s.moved) {
        e.stopPropagation()
        e.preventDefault()
        s.moved = false
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    el.addEventListener('click', onClick, true)
    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      el.removeEventListener('click', onClick, true)
    }
  }, [])

  const segs = []
  const base = layout.posOf(range[0])
  for (let k = range[0]; k <= range[1]; k++) {
    const pos = layout.posOf(k)
    segs.push(
      <div key={k} className="seg" style={{ position: 'absolute', top: 0, bottom: 0, left: pos - base, width: layout.widthOf(k) }}>
        {renderSegment(k, pos)}
      </div>,
    )
  }

  return (
    <div ref={wrap} className={`ribbon ${className || ''}`} style={style}>
      <div ref={track} className="track">
        {segs}
      </div>
    </div>
  )
})

export default Ribbon
