import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import PaperScene from '../paper/PaperScene'
import { NEON_NAMES, PAPER, monthOf, yearOf } from '../lib/theme'
import { MONTHS, monthKey } from '../lib/date'
import { getCover, putCover, dropCover, compressImage } from '../lib/db'

/** The picture for a month: a 3D neon sculpture slot, a pop-up paper scene, or (minimal) your own cover photo. */
export default function MonthArt({ abs, level }) {
  const theme = useStore((s) => s.theme)
  const m = monthOf(abs)
  if (theme === 'neon')
    return (
      <div className="art-slot" id={`art-${level}-${abs}`}>
        <span className="art-num" aria-hidden>
          {String(m + 1).padStart(2, '0')}
        </span>
        <span className="art-cap">{NEON_NAMES[m]}</span>
      </div>
    )
  if (theme === 'minimal') return <Cover abs={abs} level={level} />
  return (
    <div className="art-paper">
      <PaperScene m={m} />
      <span className="art-cap">{PAPER[m].name}</span>
    </div>
  )
}

const coverCache = new Map()

function Cover({ abs, level }) {
  const y = yearOf(abs)
  const m = monthOf(abs)
  const mk = monthKey(y, m)
  const stamp = useStore((s) => s.covers[mk])
  const setCover = useStore((s) => s.setCover)
  const [src, setSrc] = useState(() => coverCache.get(`${mk}:${stamp}`) || null)
  const file = useRef()
  useEffect(() => {
    if (!stamp) return setSrc(null)
    const ck = `${mk}:${stamp}`
    if (coverCache.has(ck)) return setSrc(coverCache.get(ck))
    let alive = true
    getCover(mk).then((u) => {
      coverCache.set(ck, u || null)
      if (alive) setSrc(u || null)
    })
    return () => {
      alive = false
    }
  }, [mk, stamp])
  const pick = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const url = await compressImage(f, 2000, 0.85)
    await putCover(mk, url)
    setCover(mk, true)
    e.target.value = ''
  }
  const big = level === 'month'
  return (
    <div className={`art-min ${src ? 'has' : ''}`}>
      {src ? <img src={src} alt={`${MONTHS[m]} cover`} draggable={false} /> : <span className="min-num">{String(m + 1).padStart(2, '0')}</span>}
      {big && (
        <div className="min-actions" data-nodrag>
          <button className="btn small" onClick={() => file.current.click()}>
            {src ? 'Change photo' : '＋ Add a cover photo'}
          </button>
          {src && (
            <button
              className="btn small ghost"
              onClick={async () => {
                await dropCover(mk)
                setCover(mk, false)
              }}
            >
              Remove
            </button>
          )}
        </div>
      )}
      <input ref={file} type="file" accept="image/*" hidden onChange={pick} />
    </div>
  )
}
