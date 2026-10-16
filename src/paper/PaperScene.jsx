import { memo } from 'react'
import { PAPER } from '../lib/theme'

/*
 * Pop-up-book scenes made of layered "cut card". Every layer is its own SVG with a depth
 * (--z). The ribbon feeds each poster a live --d (distance from screen centre) and CSS slides
 * the layers at different speeds, so the scene opens up in depth as you scroll past it.
 * All shapes live in a 600 × 400 world.
 */

const W = 600
const H = 400

function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Catmull-Rom through points → smooth cubic path, closed to the bottom of the world
function smooth(pts, close = true) {
  let d = `M${pts[0][0]},${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] || p2
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0]},${p2[1].toFixed(1)}`
  }
  if (close) d += ` L${W + 60},${H + 10} L-60,${H + 10} Z`
  return d
}

function hillPts(seed, base, amp, step = 60) {
  const r = rng(seed)
  const ph = r() * 6
  const ph2 = r() * 6
  const pts = []
  for (let x = -60; x <= W + 60; x += step) {
    pts.push([x, base + amp * (Math.sin(x * 0.011 + ph) * 0.65 + Math.sin(x * 0.027 + ph2) * 0.35)])
  }
  return pts
}
const hillY = (pts, x) => {
  for (let i = 0; i < pts.length - 1; i++) if (x >= pts[i][0] && x <= pts[i + 1][0]) {
    const f = (x - pts[i][0]) / (pts[i + 1][0] - pts[i][0])
    return pts[i][1] * (1 - f) + pts[i + 1][1] * f
  }
  return pts[0][1]
}

const Hill = ({ pts, fill }) => <path d={smooth(pts)} fill={fill} />

// ————— props —————
const Sun = ({ x, y, r, fill, rays = 12, rayFill }) => (
  <g>
    <g className="an-spin" style={{ animationDuration: '40s' }}>
      {Array.from({ length: rays }, (_, i) => (
        <path key={i} d={`M${x - r * 0.16},${y - r * 1.15} L${x},${y - r * 1.62} L${x + r * 0.16},${y - r * 1.15} Z`} fill={rayFill || fill} transform={`rotate(${(i * 360) / rays} ${x} ${y})`} />
      ))}
    </g>
    <circle cx={x} cy={y} r={r} fill={fill} />
    <circle cx={x - r * 0.25} cy={y - r * 0.25} r={r * 0.55} fill="#fff" opacity=".18" />
  </g>
)
const Moon = ({ x, y, r, fill, sky }) => (
  <g className="an-float" style={{ animationDuration: '9s' }}>
    <circle cx={x} cy={y} r={r} fill={fill} />
    <circle cx={x + r * 0.42} cy={y - r * 0.22} r={r * 0.86} fill={sky} />
  </g>
)
const Cloud = ({ x, y, s = 1, fill = '#fff', dur = 30, delay = 0 }) => (
  <g className="an-drift" style={{ animationDuration: `${dur}s`, animationDelay: `${delay}s` }}>
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-46,10 a18,18 0 0 1 10,-30 a26,26 0 0 1 46,-6 a20,20 0 0 1 34,14 a14,14 0 0 1 2,22 Z" fill={fill} />
    </g>
  </g>
)
const Stars = ({ n, seed, fill = '#fff6d8', maxY = 200 }) => {
  const r = rng(seed)
  return Array.from({ length: n }, (_, i) => {
    const x = r() * W
    const y = r() * maxY
    const s = 2 + r() * 4
    return <path key={i} className="an-twinkle" style={{ animationDelay: `${-r() * 4}s`, animationDuration: `${2 + r() * 3}s` }} d={`M${x},${y - s} Q${x},${y} ${x + s},${y} Q${x},${y} ${x},${y + s} Q${x},${y} ${x - s},${y} Q${x},${y} ${x},${y - s}Z`} fill={fill} />
  })
}
const Pine = ({ x, y, h, fill, trunk = '#6b4a2f', snow }) => (
  <g>
    <rect x={x - h * 0.05} y={y - h * 0.18} width={h * 0.1} height={h * 0.2} fill={trunk} />
    {[0, 1, 2].map((i) => {
      const ty = y - h * 0.15 - i * h * 0.27
      const w = h * (0.42 - i * 0.1)
      return (
        <g key={i}>
          <path d={`M${x - w},${ty} L${x},${ty - h * 0.42} L${x + w},${ty} Z`} fill={fill} />
          {snow && <path d={`M${x - w * 0.42},${ty - h * 0.24} L${x},${ty - h * 0.42} L${x + w * 0.42},${ty - h * 0.24} Q${x},${ty - h * 0.2} ${x - w * 0.42},${ty - h * 0.24}Z`} fill="#fff" />}
        </g>
      )
    })}
  </g>
)
const RoundTree = ({ x, y, h, fill, trunk = '#6b4a2f', fruit, fruitFill }) => {
  const r = h * 0.34
  return (
    <g>
      <path d={`M${x - h * 0.04},${y} L${x - h * 0.03},${y - h * 0.55} L${x + h * 0.03},${y - h * 0.55} L${x + h * 0.04},${y} Z`} fill={trunk} />
      <g className="an-sway" style={{ animationDuration: '6s', transformOrigin: `${x}px ${y}px` }}>
        <circle cx={x} cy={y - h * 0.62} r={r} fill={fill} />
        <circle cx={x - r * 0.62} cy={y - h * 0.5} r={r * 0.7} fill={fill} />
        <circle cx={x + r * 0.62} cy={y - h * 0.52} r={r * 0.72} fill={fill} />
        {fruit &&
          [[-0.4, -0.5], [0.3, -0.7], [0.55, -0.42], [-0.1, -0.3], [0.05, -0.85], [-0.6, -0.7]].map(([fx, fy], i) => (
            <ellipse key={i} cx={x + fx * r * 1.1} cy={y - h * 0.62 + (fy + 0.6) * r} rx={r * 0.13} ry={r * 0.17} fill={fruitFill} />
          ))}
      </g>
    </g>
  )
}
const Palm = ({ x, y, h, fill, trunk = '#8a5a35' }) => (
  <g>
    <path d={`M${x},${y} Q${x + h * 0.12},${y - h * 0.5} ${x + h * 0.04},${y - h}`} stroke={trunk} strokeWidth={h * 0.07} fill="none" strokeLinecap="round" />
    <g className="an-sway" style={{ animationDuration: '5s', transformOrigin: `${x + h * 0.04}px ${y - h}px` }}>
      {[-150, -110, -70, -30, 10].map((a, i) => (
        <ellipse key={i} cx={x + h * 0.04} cy={y - h} rx={h * 0.36} ry={h * 0.07} fill={fill} transform={`rotate(${a} ${x + h * 0.04} ${y - h}) translate(${h * 0.3} 0)`} />
      ))}
    </g>
  </g>
)
const Kite = ({ x, y, s, a, b, delay = 0 }) => (
  <g className="an-kite" style={{ animationDelay: `${delay}s`, transformOrigin: `${x}px ${y + s * 2}px` }}>
    <path d={`M${x},${y - s} L${x + s * 0.72},${y} L${x},${y + s * 1.2} L${x - s * 0.72},${y} Z`} fill={a} />
    <path d={`M${x},${y - s} L${x + s * 0.72},${y} L${x},${y} Z M${x},${y + s * 1.2} L${x - s * 0.72},${y} L${x},${y} Z`} fill={b} />
    <path d={`M${x},${y + s * 1.2} q${s * 0.4},${s * 0.6} 0,${s * 1.2} q${-s * 0.4},${s * 0.6} 0,${s * 1.2}`} stroke={a} strokeWidth="2" fill="none" />
    {[0.6, 1.2, 1.8].map((k, i) => (
      <path key={i} d={`M${x - s * 0.18},${y + s * (1.2 + k)} L${x + s * 0.18},${y + s * (1.2 + k) - s * 0.1} L${x + s * 0.18},${y + s * (1.2 + k) + s * 0.1} Z`} fill={i % 2 ? a : b} />
    ))}
  </g>
)
const Heart = ({ x, y, s, fill, delay = 0 }) => (
  <g className="an-float" style={{ animationDelay: `${delay}s`, animationDuration: '5s' }}>
    <path d={`M${x},${y + s * 1.6} q${s * 0.2},${s * 0.8} ${-s * 0.1},${s * 1.6}`} stroke="#7a3b48" strokeWidth="1.5" fill="none" />
    <path d={`M${x},${y + s * 0.9} C${x - s * 1.4},${y} ${x - s * 0.9},${y - s * 1.1} ${x},${y - s * 0.4} C${x + s * 0.9},${y - s * 1.1} ${x + s * 1.4},${y} ${x},${y + s * 0.9} Z`} fill={fill} />
  </g>
)
const Flower = ({ x, y, s, fill, center = '#ffd23f', stem = '#4d8a3a', delay = 0 }) => (
  <g className="an-bob" style={{ animationDelay: `${delay}s`, transformOrigin: `${x}px ${y + s * 3}px` }}>
    <path d={`M${x},${y} L${x},${y + s * 3}`} stroke={stem} strokeWidth={s * 0.25} />
    {Array.from({ length: 6 }, (_, i) => (
      <ellipse key={i} cx={x} cy={y - s * 0.55} rx={s * 0.38} ry={s * 0.62} fill={fill} transform={`rotate(${i * 60} ${x} ${y})`} />
    ))}
    <circle cx={x} cy={y} r={s * 0.4} fill={center} />
  </g>
)
const Fall = ({ n, seed, kind, fill, from = -20, to = 420, slant = -18 }) => {
  const r = rng(seed)
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const x = r() * (W + 80) - 40
        const dur = kind === 'rain' ? 0.7 + r() * 0.5 : 6 + r() * 6
        const delay = -r() * dur
        return kind === 'rain' ? (
          <line key={i} className="an-rain" style={{ animationDuration: `${dur}s`, animationDelay: `${delay}s`, '--from': `${from}px`, '--to': `${to}px`, '--slant': `${slant}px` }} x1={x} y1={0} x2={x - 4} y2={18} stroke={fill} strokeWidth="2.2" strokeLinecap="round" />
        ) : (
          <circle key={i} className="an-snow" style={{ animationDuration: `${dur}s`, animationDelay: `${delay}s`, '--from': `${from}px`, '--to': `${to}px` }} cx={x} cy={0} r={2 + r() * 3} fill={fill} />
        )
      })}
    </g>
  )
}
const Diya = ({ x, y, s, body = '#c2521f', rim = '#e98a2c' }) => (
  <g>
    <circle cx={x} cy={y - s * 0.9} r={s * 1.25} fill="#ffcf5a" opacity=".22" className="an-glow" />
    <path d={`M${x - s},${y - s * 0.2} Q${x},${y + s * 0.9} ${x + s},${y - s * 0.2} Z`} fill={body} />
    <path d={`M${x - s},${y - s * 0.2} L${x + s},${y - s * 0.2} L${x + s * 1.2},${y - s * 0.38} L${x - s * 1.2},${y - s * 0.38}Z`} fill={rim} />
    <path className="an-flicker" style={{ transformOrigin: `${x}px ${y - s * 0.4}px` }} d={`M${x},${y - s * 1.35} Q${x + s * 0.32},${y - s * 0.75} ${x},${y - s * 0.42} Q${x - s * 0.32},${y - s * 0.75} ${x},${y - s * 1.35}Z`} fill="#ffd23f" />
  </g>
)
const Lantern = ({ x, y, s, fill, tassel, delay = 0, len = 60 }) => {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const r = i % 2 ? s * 0.45 : s
    return `${(x + Math.cos(a) * r).toFixed(1)},${(y + len + Math.sin(a) * r).toFixed(1)}`
  })
  return (
    <g className="an-sway" style={{ animationDelay: `${delay}s`, transformOrigin: `${x}px ${y}px`, animationDuration: '4.5s' }}>
      <line x1={x} y1={y - 20} x2={x} y2={y + len - s} stroke="#2a2440" strokeWidth="1.5" />
      <circle cx={x} cy={y + len} r={s * 1.5} fill={fill} opacity=".25" className="an-glow" />
      <polygon points={pts.join(' ')} fill={fill} />
      <circle cx={x} cy={y + len} r={s * 0.28} fill="#fff4cf" />
      {[-0.3, 0, 0.3].map((o, i) => (
        <line key={i} x1={x + o * s} y1={y + len + s * 0.8} x2={x + o * s * 1.3} y2={y + len + s * 1.9} stroke={tassel} strokeWidth="2.4" strokeLinecap="round" />
      ))}
    </g>
  )
}
const Gift = ({ x, y, s, box, ribbon }) => (
  <g className="an-hop" style={{ transformOrigin: `${x}px ${y}px` }}>
    <rect x={x - s} y={y - s * 1.5} width={s * 2} height={s * 1.5} fill={box} />
    <rect x={x - s * 1.12} y={y - s * 1.85} width={s * 2.24} height={s * 0.42} fill={box} />
    <rect x={x - s * 0.17} y={y - s * 1.85} width={s * 0.34} height={s * 1.85} fill={ribbon} />
    <ellipse cx={x - s * 0.35} cy={y - s * 2.05} rx={s * 0.38} ry={s * 0.22} fill={ribbon} transform={`rotate(-25 ${x} ${y - s * 2})`} />
    <ellipse cx={x + s * 0.35} cy={y - s * 2.05} rx={s * 0.38} ry={s * 0.22} fill={ribbon} transform={`rotate(25 ${x} ${y - s * 2})`} />
  </g>
)
const Garland = ({ y, colors }) => (
  <g>
    <path d={`M-20,${y} Q150,${y + 40} 300,${y} Q450,${y + 40} 620,${y}`} stroke="#3f6b2a" strokeWidth="2" fill="none" />
    {Array.from({ length: 26 }, (_, i) => {
      const x = -10 + i * 24.6
      const t = ((x + 20) % 320) / 320
      const yy = y + Math.sin(t * Math.PI) * 20
      return <circle key={i} cx={x} cy={yy + 3} r="7" fill={colors[i % colors.length]} />
    })}
  </g>
)
const Waves = ({ y, fill, dur = 7, amp = 8 }) => {
  let d = `M-120,${y}`
  for (let x = -120; x < W + 240; x += 60) d += ` q15,${-amp} 30,0 t30,0`
  d += ` L${W + 240},${H + 10} L-120,${H + 10}Z`
  return <path className="an-wave" style={{ animationDuration: `${dur}s` }} d={d} fill={fill} />
}
const Boat = ({ x, y, s, fill }) => (
  <g className="an-float" style={{ animationDuration: '3.4s' }}>
    <path d={`M${x - s},${y} L${x + s},${y} L${x + s * 0.65},${y + s * 0.45} L${x - s * 0.65},${y + s * 0.45}Z`} fill={fill} />
    <path d={`M${x - s * 0.1},${y} L${x - s * 0.1},${y - s * 1.1} L${x + s * 0.65},${y}Z`} fill="#fff" />
  </g>
)
const Umbrella = ({ x, y, s, a, b }) => (
  <g className="an-sway" style={{ transformOrigin: `${x}px ${y}px`, animationDuration: '5s' }}>
    <path d={`M${x},${y} L${x},${y - s * 1.6}`} stroke="#3a2a1a" strokeWidth={s * 0.08} />
    <path d={`M${x},${y} q0,${s * 0.25} ${s * 0.2},${s * 0.2}`} stroke="#3a2a1a" strokeWidth={s * 0.08} fill="none" />
    <path d={`M${x - s * 1.2},${y - s * 1.55} Q${x - s * 1.2},${y - s * 2.7} ${x},${y - s * 2.7} Q${x + s * 1.2},${y - s * 2.7} ${x + s * 1.2},${y - s * 1.55} Q${x + s * 0.9},${y - s * 1.75} ${x + s * 0.6},${y - s * 1.55} Q${x + s * 0.3},${y - s * 1.75} ${x},${y - s * 1.55} Q${x - s * 0.3},${y - s * 1.75} ${x - s * 0.6},${y - s * 1.55} Q${x - s * 0.9},${y - s * 1.75} ${x - s * 1.2},${y - s * 1.55}Z`} fill={a} />
    <path d={`M${x},${y - s * 2.7} Q${x - s * 0.45},${y - s * 2.3} ${x - s * 0.6},${y - s * 1.55} Q${x - s * 0.3},${y - s * 1.75} ${x},${y - s * 1.55} Q${x + s * 0.3},${y - s * 1.75} ${x + s * 0.6},${y - s * 1.55} Q${x + s * 0.45},${y - s * 2.3} ${x},${y - s * 2.7}Z`} fill={b} />
  </g>
)
const Pookalam = ({ x, y, r }) => {
  const rings = ['#f2c12e', '#e8742a', '#d6336c', '#f7f1e3', '#6c3fa0', '#e8742a']
  return (
    <g className="an-spin" style={{ animationDuration: '60s', transformOrigin: `${x}px ${y}px` }}>
      <ellipse cx={x} cy={y} rx={r * 1.08} ry={r * 0.42 * 1.08} fill="#3f6b2a" />
      {rings.map((c, i) => (
        <ellipse key={i} cx={x} cy={y} rx={r * (1 - i * 0.16)} ry={r * 0.42 * (1 - i * 0.16)} fill={c} />
      ))}
    </g>
  )
}
const Puff = ({ x, y, s, fill, delay = 0 }) => (
  <g className="an-puff" style={{ animationDelay: `${delay}s`, transformOrigin: `${x}px ${y}px` }}>
    <circle cx={x} cy={y} r={s} fill={fill} opacity=".9" />
    <circle cx={x + s * 0.8} cy={y - s * 0.3} r={s * 0.7} fill={fill} opacity=".8" />
    <circle cx={x - s * 0.7} cy={y + s * 0.2} r={s * 0.6} fill={fill} opacity=".85" />
  </g>
)

// ————— the twelve scenes —————
function scene(m) {
  const P = PAPER[m]
  const far = hillPts(m * 11 + 1, 250, 26)
  const mid = hillPts(m * 11 + 2, 300, 22)
  const near = hillPts(m * 11 + 3, 350, 16)
  const L = (z, children, cls = '') => ({ z, children, cls })
  const base = [L(0.15, <Hill pts={far} fill={P.far} />), L(0.45, <Hill pts={mid} fill={P.mid} />), L(0.85, <Hill pts={near} fill={P.near} />)]
  const sky = (extra) => L(0, <>{extra}</>, 'sky')
  switch (m) {
    case 0: // January — snow hills
      return [
        sky(<><Sun x={460} y={110} r={34} fill="#f6d77a" /><Cloud x={150} y={90} s={1.1} dur={40} /></>),
        base[0],
        L(0.3, <>{[90, 140, 470, 520, 560].map((x, i) => <Pine key={i} x={x} y={hillY(far, x) + 8} h={70 + (i % 3) * 18} fill="#5b8bb0" snow />)}</>),
        base[1],
        L(0.6, <>{[60, 230, 400].map((x, i) => <Pine key={i} x={x} y={hillY(mid, x) + 6} h={95 + i * 14} fill="#2f6687" snow />)}</>),
        base[2],
        L(1.1, <Fall n={46} seed={7} kind="snow" fill="#fff" />, 'fx'),
      ]
    case 1: // February — blossoms & hearts
      return [
        sky(<><Cloud x={480} y={80} fill="#fff" dur={35} /><Sun x={130} y={95} r={26} fill="#fff3f3" rays={0} /></>),
        base[0],
        L(0.35, <>{[130, 440].map((x, i) => <RoundTree key={i} x={x} y={hillY(far, x) + 10} h={150 - i * 20} fill="#f5a7b8" trunk="#7a4a3a" fruit fruitFill="#fff" />)}</>),
        L(0.55, <>{[[250, 160, 22], [330, 110, 16], [520, 170, 18], [80, 190, 14]].map(([x, y, s], i) => <Heart key={i} x={x} y={y} s={s} fill={i % 2 ? '#c2334f' : '#e2566f'} delay={-i * 1.3} />)}</>),
        base[1],
        base[2],
      ]
    case 2: // March — Holi fields
      return [
        sky(<Sun x={300} y={90} r={30} fill="#ffd23f" />),
        base[0],
        L(0.4, <>{[[120, 150, 34, '#e8458b'], [240, 120, 28, '#3fa7e8'], [380, 150, 36, '#ffd23f'], [500, 115, 26, '#8b5cf6'], [560, 175, 22, '#2fbf71']].map(([x, y, s, f], i) => <Puff key={i} x={x} y={y} s={s} fill={f} delay={-i * 0.8} />)}</>),
        base[1],
        L(0.7, <>{[40, 120, 200, 290, 370, 450, 530].map((x, i) => <Flower key={i} x={x} y={hillY(mid, x) - 8} s={9 + (i % 3) * 2} fill={['#e8458b', '#ffd23f', '#8b5cf6', '#ff7a45'][i % 4]} delay={-i * 0.4} />)}</>),
        base[2],
      ]
    case 3: // April — mango grove
      return [
        sky(<><Sun x={470} y={100} r={40} fill="#ffb627" /><Cloud x={160} y={80} s={0.9} dur={45} /></>),
        base[0],
        L(0.45, <>{[110, 300, 500].map((x, i) => <RoundTree key={i} x={x} y={hillY(far, x) + 30} h={175 - (i % 2) * 25} fill="#5f9a3a" fruit fruitFill="#f6a623" />)}</>),
        base[1],
        base[2],
      ]
    case 4: // May — summer coast
      return [
        sky(<Sun x={300} y={150} r={52} fill="#ff8a3d" rayFill="#ffb26b" />),
        L(0.15, <Waves y={262} fill={P.mid} dur={9} amp={6} />),
        L(0.35, <Waves y={292} fill={P.near} dur={6} amp={9} />),
        L(0.55, <Boat x={430} y={282} s={22} fill="#e2563b" />),
        L(0.8, <path d={smooth(hillPts(41, 345, 10))} fill="#f2d49a" />),
        L(1, <><Palm x={80} y={360} h={150} fill="#3f8f5a" /><Palm x={540} y={370} h={120} fill="#2f7a4a" /></>),
      ]
    case 5: // June — monsoon
      return [
        sky(<><Cloud x={140} y={70} s={1.6} fill="#9aa9a6" dur={50} /><Cloud x={430} y={60} s={1.9} fill="#8a9a98" dur={60} delay={-20} /></>),
        base[0],
        base[1],
        L(0.6, <>{[90, 480].map((x, i) => <RoundTree key={i} x={x} y={hillY(mid, x) + 10} h={130} fill="#2f6b4a" />)}</>),
        L(0.8, <Waves y={352} fill="#5b8fa8" dur={8} amp={4} />),
        L(0.95, <Boat x={300} y={350} s={20} fill="#fff7e8" />),
        L(1.1, <Fall n={70} seed={13} kind="rain" fill="#ffffff" />, 'fx'),
      ]
    case 6: // July — rain garden
      return [
        sky(<Cloud x={300} y={70} s={2.2} fill="#a8c0b8" dur={70} />),
        base[0],
        base[1],
        L(0.7, <>{[150, 450].map((x, i) => <Umbrella key={i} x={x} y={hillY(mid, x) + 4} s={34 - i * 6} a={i ? '#f2b632' : '#e8574a'} b={i ? '#f7d06b' : '#f28a7e'} />)}</>),
        base[2],
        L(0.9, <>{[60, 260, 340, 540].map((x, i) => <Flower key={i} x={x} y={hillY(near, x) - 6} s={8} fill={['#f2b632', '#e8574a'][i % 2]} delay={-i} />)}</>),
        L(1.1, <Fall n={55} seed={21} kind="rain" fill="#ffffff" />, 'fx'),
      ]
    case 7: // August — kites
      return [
        sky(<><Cloud x={120} y={70} dur={38} /><Cloud x={480} y={110} s={0.8} dur={30} delay={-10} /></>),
        L(0.25, <><Kite x={180} y={110} s={30} a="#f0662f" b="#ffb627" /><Kite x={410} y={70} s={24} a="#2e7fd1" b="#ffffff" delay={-1.5} /><Kite x={520} y={160} s={20} a="#2fa36b" b="#ffffff" delay={-3} /></>),
        base[0],
        base[1],
        base[2],
      ]
    case 8: // September — harvest & pookalam
      return [
        sky(<><Sun x={470} y={100} r={36} fill="#f2a72e" /><Cloud x={150} y={85} dur={50} /></>),
        base[0],
        L(0.45, <>{Array.from({ length: 14 }, (_, i) => { const x = 20 + i * 42; return <path key={i} className="an-sway" style={{ transformOrigin: `${x}px ${hillY(mid, x)}px`, animationDelay: `${-i * 0.3}s` }} d={`M${x},${hillY(mid, x) + 4} q-6,-40 4,-62 q2,26 -4,62Z`} fill="#c98a2b" /> })}</>),
        base[1],
        base[2],
        L(0.95, <Pookalam x={300} y={362} r={70} />),
      ]
    case 9: // October — festival dusk with diyas
      return [
        sky(<><Moon x={470} y={90} r={30} fill="#ffe7a8" sky={P.sky} /><Stars n={26} seed={9} /></>),
        L(0.1, <Garland y={14} colors={['#ffb627', '#ff7a1a', '#ffd23f']} />),
        base[0],
        base[1],
        base[2],
        L(1, <>{[80, 190, 300, 410, 520].map((x, i) => <Diya key={i} x={x} y={hillY(near, x) + 2} s={16} />)}</>),
      ]
    case 10: // November — star lanterns
      return [
        sky(<Stars n={34} seed={17} />),
        L(0.3, <>{[[110, 0, 22, '#ffc94a', 120], [300, 0, 30, '#ff7a6b', 150], [480, 0, 24, '#7fd3ff', 110]].map(([x, y, s, f, len], i) => <Lantern key={i} x={x} y={y} s={s} fill={f} tassel="#ffe7a8" delay={-i * 1.2} len={len} />)}</>),
        base[0],
        base[1],
        base[2],
      ]
    default: // December — winter night
      return [
        sky(<><Moon x={130} y={90} r={28} fill="#f4f8fb" sky={P.sky} /><Stars n={30} seed={23} /></>),
        base[0],
        L(0.35, <>{[380, 440, 520].map((x, i) => <Pine key={i} x={x} y={hillY(far, x) + 10} h={90 + i * 12} fill="#1f4f4a" snow />)}</>),
        base[1],
        base[2],
        L(0.95, <><Gift x={190} y={hillY(near, 190) + 4} s={22} box="#e0464a" ribbon="#ffd23f" /><Gift x={250} y={hillY(near, 250) + 6} s={15} box="#2f7a5a" ribbon="#ffffff" /></>),
        L(1.1, <Fall n={40} seed={31} kind="snow" fill="#ffffff" />, 'fx'),
      ]
  }
}

const SCENES = Array.from({ length: 12 }, (_, m) => scene(m))

function PaperScene({ m, className = '' }) {
  const P = PAPER[m]
  return (
    <div className={`pscene ${className}`} style={{ '--sky': P.sky }} aria-hidden>
      {SCENES[m].map((layer, i) => (
        <svg key={i} className={`pl ${layer.cls}`} style={{ '--z': layer.z }} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice">
          {layer.children}
        </svg>
      ))}
    </div>
  )
}

export default memo(PaperScene)
