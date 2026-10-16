// The Planzer astrolabe as a crisp vector — same geometry as the 3D constellation.
export default function Mark({ size = 34, stroke = 'currentColor', glow = true, className, style }) {
  const tilt = -24
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = Math.PI / 2 - (i / 12) * Math.PI * 2
    const r0 = 52
    const r1 = i % 3 === 0 ? 58 : 55
    return <line key={i} x1={Math.cos(a) * r0} y1={-Math.sin(a) * r0} x2={Math.cos(a) * r1} y2={-Math.sin(a) * r1} />
  })
  const star = []
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * Math.PI * 2 + Math.PI / 2
    const k = Math.pow(Math.abs(Math.cos(2 * (a - Math.PI / 2))), 3.2)
    const r = 3.5 + 19 * k
    star.push(`${(Math.cos(a) * r).toFixed(2)},${(-Math.sin(a) * r).toFixed(2)}`)
  }
  const pa = Math.PI * 1.78
  const px0 = Math.cos(pa) * 56
  const py0 = Math.sin(pa) * 18
  const t = (tilt * Math.PI) / 180
  const px = px0 * Math.cos(t) - py0 * Math.sin(t)
  const py = -(px0 * Math.sin(t) + py0 * Math.cos(t))
  return (
    <svg viewBox="-64 -64 128 128" width={size} height={size} className={className} style={{ overflow: 'visible', ...style }} aria-label="Planzer">
      {glow && (
        <defs>
          <filter id="mk-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      )}
      <g fill="none" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" filter={glow ? 'url(#mk-glow)' : undefined}>
        <circle r="50" />
        <path d="M -43 -0.5 A 43 43 0 0 1 -12 -41.3" opacity=".55" strokeWidth="1.4" transform="rotate(20)" />
        <path d="M 43 0.5 A 43 43 0 0 1 12 41.3" opacity=".55" strokeWidth="1.4" transform="rotate(20)" />
        <ellipse rx="56" ry="18" transform={`rotate(${-tilt})`} />
        {ticks}
        <polygon points={star.join(' ')} fill={stroke} stroke="none" />
        <circle cx={px} cy={py} r="4.6" fill={stroke} stroke="none" />
      </g>
    </svg>
  )
}
