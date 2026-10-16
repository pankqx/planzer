import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useStore } from '../store'
import { live } from '../lib/nav'
import { LOOP } from '../ui/Logo'
import { NEON } from '../lib/theme'

/*
 * Neon opening: the twelve month sculptures swing in as a carousel, the ∞ tube is drawn in
 * light, then the sign letters buzz on one by one like real neon. Start → the carousel
 * explodes outward and the endless year slides in.
 */
export default function NeonIntro() {
  const setPhase = useStore((s) => s.setPhase)
  const root = useRef()
  const [ready, setReady] = useState(false)
  const leaving = useRef(false)
  const tl = useRef()

  useEffect(() => {
    live.introOut = 0
    live.introIn = 0
    const q = gsap.utils.selector(root)
    gsap.set(q('.ni-letter'), { opacity: 0 })
    gsap.set(q('.ni-fade'), { opacity: 0, y: 16 })
    const len = 260
    gsap.set(q('.ni-loop'), { strokeDasharray: len, strokeDashoffset: len })
    const t = gsap.timeline({ delay: 0.2, onComplete: () => setReady(true) })
    t.to(live, { introIn: 1, duration: 2.2, ease: 'expo.out' }, 0)
      .to(q('.ni-loop'), { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut' }, 0.4)
      .add(() => q('.ni-logo').forEach((el) => el.classList.add('lit')), 1.9)
    // each letter flickers on like a gas tube catching
    q('.ni-letter').forEach((el, i) => {
      const at = 1.2 + i * 0.16 + Math.random() * 0.2
      t.to(el, { opacity: 1, duration: 0.04 }, at)
        .to(el, { opacity: 0.15, duration: 0.05 }, at + 0.07)
        .to(el, { opacity: 1, duration: 0.04 }, at + 0.16)
        .to(el, { opacity: 0.4, duration: 0.03 }, at + 0.24)
        .to(el, { opacity: 1, duration: 0.05 }, at + 0.3)
    })
    t.to(q('.ni-fade'), { opacity: 1, y: 0, duration: 1, stagger: 0.12, ease: 'expo.out' }, 2.6)
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) t.progress(1)
    tl.current = t
    return () => t.kill()
  }, [])

  const enter = () => {
    if (leaving.current) return
    leaving.current = true
    tl.current?.progress(1)
    gsap
      .timeline()
      .to(live, { introOut: 1, duration: 1.1, ease: 'power3.in' }, 0)
      .to(root.current, { opacity: 0, scale: 1.15, duration: 0.8, ease: 'power3.in' }, 0.1)
      .add(() => {
        setPhase('app')
        live.introOut = 0
      }, 1.0)
  }

  useEffect(() => {
    const k = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        ready ? enter() : tl.current?.progress(1)
      }
    }
    addEventListener('keydown', k)
    return () => removeEventListener('keydown', k)
  })

  return (
    <div className="intro neon-intro" ref={root} onClick={() => !ready && tl.current?.progress(1)}>
      <div className="ni-center">
        <svg className="ni-logo" viewBox="0 0 100 60" aria-hidden>
          <defs>
            <linearGradient id="ni-g" x1="0" x2="1">
              {NEON.filter((_, i) => i % 2 === 0).map((c, i) => (
                <stop key={i} offset={i / 5} stopColor={c} />
              ))}
            </linearGradient>
          </defs>
          <path className="ni-loop" d={LOOP} stroke="url(#ni-g)" pathLength="260" />
        </svg>
        <h1 className="ni-word" aria-label="Planzer">
          {'PLANZER'.split('').map((c, i) => (
            <span key={i} className="ni-letter" style={{ '--c': NEON[(i * 2 + 9) % 12] }}>
              {c}
            </span>
          ))}
        </h1>
        <p className="ni-tag ni-fade">Your whole year on one endless line.</p>
        <div className="ni-fade">
          <button className="btn primary huge" onClick={enter}>
            Start planning →
          </button>
        </div>
        <p className="ni-small ni-fade">or press Enter</p>
      </div>
    </div>
  )
}
