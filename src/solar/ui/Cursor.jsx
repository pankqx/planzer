import { useEffect, useRef } from 'react'

const INTERACTIVE = 'button, a, input, textarea, select, label, [data-hover]'

/** A gold dot with a lagging ring that swells and speaks over anything you can touch. */
export default function Cursor() {
  const dot = useRef()
  const ring = useRef()
  const label = useRef()
  useEffect(() => {
    if (window.matchMedia('(hover: none)').matches) return
    let x = innerWidth / 2
    let y = innerHeight / 2
    let rx = x
    let ry = y
    let raf
    let hot = false
    let text = ''
    const onMove = (e) => {
      x = e.clientX
      y = e.clientY
      const el = e.target.closest?.(INTERACTIVE)
      hot = !!el
      text = el?.dataset?.cursor || ''
    }
    const onDown = () => ring.current?.classList.add('press')
    const onUp = () => ring.current?.classList.remove('press')
    const loop = () => {
      rx += (x - rx) * 0.16
      ry += (y - ry) * 0.16
      const ds = document.body.dataset
      const mode = ds.drag ? 'drag' : ds.cursor === 'planet' ? 'planet' : hot ? 'hot' : ''
      const t = ds.drag ? 'Turn' : ds.cursor === 'planet' ? 'Enter' : text
      if (dot.current) dot.current.style.transform = `translate3d(${x}px, ${y}px, 0)`
      if (ring.current) {
        ring.current.style.transform = `translate3d(${rx}px, ${ry}px, 0)`
        ring.current.dataset.mode = mode
      }
      if (label.current && label.current.textContent !== t) label.current.textContent = t
      raf = requestAnimationFrame(loop)
    }
    loop()
    addEventListener('pointermove', onMove)
    addEventListener('pointerdown', onDown)
    addEventListener('pointerup', onUp)
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('pointermove', onMove)
      removeEventListener('pointerdown', onDown)
      removeEventListener('pointerup', onUp)
    }
  }, [])
  return (
    <>
      <style>{`
        .cur-dot, .cur-ring { position: fixed; left: 0; top: 0; pointer-events: none; z-index: 1000; }
        .cur-dot { width: 5px; height: 5px; margin: -2.5px 0 0 -2.5px; border-radius: 50%; background: #fff2cc; box-shadow: 0 0 12px 2px rgba(230,201,138,.8); }
        .cur-ring > i { position: absolute; left: 0; top: 0; width: 34px; height: 34px; margin: -17px 0 0 -17px; border-radius: 50%;
          border: 1px solid rgba(230,201,138,.45); transition: width .5s var(--ease), height .5s var(--ease), margin .5s var(--ease), background .5s, border-color .5s; }
        .cur-ring[data-mode="hot"] > i { width: 54px; height: 54px; margin: -27px 0 0 -27px; border-color: rgba(255,242,204,.8); background: rgba(230,201,138,.06); }
        .cur-ring[data-mode="planet"] > i, .cur-ring[data-mode="drag"] > i { width: 78px; height: 78px; margin: -39px 0 0 -39px; border-color: rgba(255,242,204,.9); background: rgba(230,201,138,.08); }
        .cur-ring.press > i { width: 24px; height: 24px; margin: -12px 0 0 -12px; }
        .cur-ring b { position: absolute; left: 0; top: 0; transform: translate(-50%, -50%); font: 600 9px var(--sans); letter-spacing: .28em; text-transform: uppercase; color: #fff2cc; white-space: nowrap; opacity: 0; transition: opacity .3s; }
        .cur-ring[data-mode="planet"] b, .cur-ring[data-mode="drag"] b, .cur-ring[data-mode="hot"] b:not(:empty) { opacity: 1; }
        .cur-ring[data-mode="hot"] b { top: 40px; }
        @media (hover: none) { .cur-dot, .cur-ring { display: none; } }
      `}</style>
      <div className="cur-dot" ref={dot} />
      <div className="cur-ring" ref={ring}>
        <i />
        <b ref={label} />
      </div>
    </>
  )
}
