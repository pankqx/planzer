import { useRef } from 'react'

/** Pulls its child toward the cursor, then springs home. */
export default function Magnetic({ children, strength = 0.32, className, style }) {
  const ref = useRef()
  const onMove = (e) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const dx = e.clientX - (r.left + r.width / 2)
    const dy = e.clientY - (r.top + r.height / 2)
    el.style.transition = 'transform .25s cubic-bezier(.22,1,.36,1)'
    el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`
  }
  const onLeave = () => {
    const el = ref.current
    if (!el) return
    el.style.transition = 'transform .9s cubic-bezier(.16,1.6,.3,1)'
    el.style.transform = 'translate(0,0)'
  }
  return (
    <span ref={ref} className={className} onPointerMove={onMove} onPointerLeave={onLeave} style={{ display: 'inline-flex', ...style }}>
      {children}
    </span>
  )
}
