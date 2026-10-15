import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { sig } from '../three/signals'
import { useStore } from '../store'
import { toRoman } from '../lib/date'
import Magnetic from './Magnetic'

const WORD = 'PLANZER'

/**
 * The opening ritual:
 *  a seed of light → dust spirals into the astrolabe → gold hairlines draw it → a glint →
 *  the name rises from blur → "Enter your year" → the constellation bursts and the orrery ignites.
 */
export default function Intro() {
  const setPhase = useStore((s) => s.setPhase)
  const year = useStore((s) => s.year)
  const root = useRef()
  const tl = useRef()
  const [ready, setReady] = useState(false)
  const leaving = useRef(false)

  useLayoutEffect(() => {
    const quick = sessionStorage.getItem('planzer-seen') === '1'
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    Object.assign(sig, { converge: 0, draw: 0, glint: 0, burst: 0, orrery: 0 })
    const q = gsap.utils.selector(root)
    gsap.set(q('.in-letter'), { opacity: 0, y: 46, filter: 'blur(14px)', rotateX: -70 })
    gsap.set(q('.in-fade'), { opacity: 0, y: 14 })
    gsap.set(q('.in-rule'), { scaleX: 0 })
    gsap.set(q('.in-seed'), { scale: 0, opacity: 0 })

    const t = gsap.timeline({ delay: 0.25, onComplete: () => (setReady(true), sessionStorage.setItem('planzer-seen', '1')) })
    t.to(q('.in-seed'), { scale: 1, opacity: 1, duration: 0.7, ease: 'expo.out' })
      .to(q('.in-seed'), { scale: 5, opacity: 0, duration: 1.1, ease: 'power2.in' }, 0.75)
      .to(sig, { converge: 1, duration: 3.2, ease: 'power2.inOut' }, 0.7)
      .to(sig, { draw: 1, duration: 2.4, ease: 'power1.inOut' }, 2.3)
      .to(sig, { glint: 1, duration: 1.3, ease: 'power2.inOut' }, 4.25)
      .to(q('.in-letter'), { opacity: 1, y: 0, filter: 'blur(0px)', rotateX: 0, duration: 1.5, ease: 'expo.out', stagger: 0.085 }, 3.5)
      .to(q('.in-rule'), { scaleX: 1, duration: 1.6, ease: 'expo.inOut' }, 4.3)
      .to(q('.in-fade'), { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: 0.12 }, 4.6)
    if (quick) t.timeScale(1.8)
    if (reduced) t.progress(1)
    tl.current = t
    return () => t.kill()
  }, [])

  const enter = () => {
    if (leaving.current) return
    leaving.current = true
    tl.current?.progress(1)
    const q = gsap.utils.selector(root)
    const out = gsap.timeline()
    out
      .to(q('.in-letter'), { opacity: 0, y: -30, filter: 'blur(16px)', duration: 0.9, ease: 'power3.in', stagger: { each: 0.04, from: 'center' } }, 0)
      .to(q('.in-fade, .in-rule, .in-corner'), { opacity: 0, duration: 0.6, ease: 'power2.in' }, 0)
      .to(sig, { burst: 1, duration: 1.7, ease: 'power2.in' }, 0.1)
      .add(() => setPhase('app'), 0.75)
      .to(sig, { orrery: 1, duration: 3.2, ease: 'power3.out' }, 0.9)
      .to(root.current, { opacity: 0, duration: 0.4, pointerEvents: 'none' }, 1.1)
  }

  // Enter with a key once the reveal is underway; any key skips ahead before that.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        if (ready) enter()
        else tl.current?.progress(1)
      } else if (e.key === 'Escape') tl.current?.progress(1)
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  })

  return (
    <div ref={root} className="intro" onClick={() => !ready && tl.current?.progress(1)}>
      <style>{`
        .intro { position: fixed; inset: 0; z-index: 40; display: grid; place-items: center; perspective: 900px; }
        .in-seed { position: absolute; left: 50%; top: 39%; width: 10px; height: 10px; margin: -5px; border-radius: 50%;
          background: #fff4d6; box-shadow: 0 0 30px 8px rgba(230,201,138,.9), 0 0 120px 30px rgba(230,201,138,.35); }
        .in-stack { position: absolute; left: 0; right: 0; top: 64.5%; display: flex; flex-direction: column; align-items: center; text-align: center; padding: 0 20px; }
        .in-word { display: flex; gap: 0; font-family: var(--display); font-size: clamp(46px, 9.5vw, 132px); line-height: 1; letter-spacing: .26em; margin-right: -.26em; transform-style: preserve-3d; }
        .in-letter { display: inline-block; transform-origin: 50% 100%; text-shadow: 0 0 40px rgba(230,201,138,.25); }
        .in-rule { width: min(420px, 70vw); height: 1px; margin: 22px 0 18px; background: linear-gradient(90deg, transparent, rgba(255,236,190,.9), transparent); }
        .in-tag { font-family: var(--serif); font-style: italic; font-weight: 300; font-size: clamp(18px, 2.1vw, 26px); color: var(--ivory); opacity: .86; letter-spacing: .02em; }
        .in-cta { margin-top: 30px; }
        .in-hint { margin-top: 16px; font-size: 10px; letter-spacing: .3em; text-transform: uppercase; color: var(--faint); }
        .in-corner { position: absolute; font-size: 10px; letter-spacing: .3em; text-transform: uppercase; color: var(--faint); line-height: 1.9; }
        .in-corner b { color: var(--gold); font-weight: 500; }
        .in-skip { position: absolute; right: 28px; bottom: 26px; }
        @media (max-width: 640px) { .in-stack { top: 58%; } .in-corner.br, .in-corner.bl { display: none; } }
      `}</style>
      <div className="in-seed" />
      <div className="in-corner in-fade" style={{ left: 28, top: 26 }}>
        <b>Planzer</b> · Edition {toRoman(year)}
        <br />N° 001 — The Celestial Planner
      </div>
      <div className="in-corner in-fade" style={{ right: 28, top: 26, textAlign: 'right' }}>
        12 worlds · {new Date(year, 1, 29).getDate() === 29 ? 366 : 365} days
        <br />1 year to chart
      </div>
      <div className="in-corner in-fade bl" style={{ left: 28, bottom: 26 }}>
        Lat 12°52′ N · Lon 74°50′ E
      </div>
      <div className="in-stack">
        <h1 className="in-word" aria-label="Planzer">
          {WORD.split('').map((c, i) => (
            <span key={i} className="in-letter gold-text" style={{ animationDelay: `${-i * 0.35}s` }}>
              {c}
            </span>
          ))}
        </h1>
        <div className="in-rule" />
        <p className="in-tag in-fade">Your year, charted among the stars.</p>
        <div className="in-cta in-fade">
          <Magnetic>
            <button className="btn" onClick={enter} data-cursor="Begin">
              <span style={{ fontSize: 14, lineHeight: 0 }}>✦</span> Enter {year}
            </button>
          </Magnetic>
        </div>
        <div className="in-hint in-fade">or press Enter ↵</div>
      </div>
      {!ready && (
        <button className="btn ghost small in-skip" onClick={(e) => (e.stopPropagation(), tl.current?.progress(1))}>
          Skip
        </button>
      )}
    </div>
  )
}
