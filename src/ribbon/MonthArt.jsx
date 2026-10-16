import { useStore } from '../store'
import PaperScene from '../paper/PaperScene'
import { NEON_NAMES, PAPER, monthOf } from '../lib/theme'

/** The picture for a month: a 3D neon sculpture slot, or a pop-up paper scene. */
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
  return (
    <div className="art-paper">
      <PaperScene m={m} />
      <span className="art-cap">{PAPER[m].name}</span>
    </div>
  )
}
