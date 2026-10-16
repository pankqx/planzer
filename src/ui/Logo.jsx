// The Planzer mark: an infinity loop — the year that never ends — with a day travelling along it.
export const LOOP = 'M50 30 C 62 14, 88 14, 88 30 C 88 46, 62 46, 50 30 C 38 14, 12 14, 12 30 C 12 46, 38 46, 50 30 Z'

export function LogoMark({ size = 40, animate = true, className = '' }) {
  return (
    <svg className={`logo-mark ${className}`} viewBox="0 0 100 60" width={size * (100 / 60)} height={size} aria-hidden>
      <path className="lm-tube" d={LOOP} />
      <path className="lm-core" d={LOOP} />
      {animate && (
        <circle className="lm-dot" r="5">
          <animateMotion dur="3.6s" repeatCount="indefinite" path={LOOP} rotate="auto" />
        </circle>
      )}
    </svg>
  )
}

export default function Logo({ onClick }) {
  return (
    <button className="logo" onClick={onClick} aria-label="Planzer — replay the opening">
      <LogoMark size={26} />
      <span className="logo-word">planzer</span>
    </button>
  )
}
