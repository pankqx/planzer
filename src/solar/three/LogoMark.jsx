import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { sig } from './signals'

const S = 2.0
const TILT = (-24 * Math.PI) / 180

/** The Planzer astrolabe: a year-circle with 12 month ticks, a tilted orbit, a planet and a guiding star. */
export function markCurves() {
  const curves = []
  const circle = (r, n = 220, a0 = 0, a1 = Math.PI * 2, cx = 0, cy = 0) => {
    const pts = []
    for (let i = 0; i <= n; i++) {
      const a = a0 + (a1 - a0) * (i / n)
      pts.push(new THREE.Vector3(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 0))
    }
    return pts
  }
  // year ring — drawn from the top, clockwise like a clock
  curves.push({ pts: circle(1, 260, Math.PI / 2, Math.PI / 2 - Math.PI * 2), delay: 0, weight: 1.15 })
  // inner astrolabe arcs
  curves.push({ pts: circle(0.86, 120, Math.PI * 0.62, Math.PI * 1.18), delay: 0.25, weight: 0.35 })
  curves.push({ pts: circle(0.86, 120, Math.PI * 1.62, Math.PI * 2.18), delay: 0.3, weight: 0.35 })
  // tilted orbit with real depth so it parallaxes in 3D
  const orbit = []
  for (let i = 0; i <= 240; i++) {
    const a = Math.PI + (i / 240) * Math.PI * 2
    const x = Math.cos(a) * 1.12
    const y = Math.sin(a) * 0.36
    orbit.push(new THREE.Vector3(x * Math.cos(TILT) - y * Math.sin(TILT), x * Math.sin(TILT) + y * Math.cos(TILT), Math.sin(a) * 0.55))
  }
  curves.push({ pts: orbit, delay: 0.12, weight: 1 })
  // guiding star (four points, concave sides)
  const star = []
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * Math.PI * 2 + Math.PI / 2
    const k = Math.pow(Math.abs(Math.cos(2 * (a - Math.PI / 2))), 3.2)
    const r = 0.07 + 0.38 * k
    star.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0.02))
  }
  curves.push({ pts: star, delay: 0.42, weight: 0.8 })
  // the planet riding the orbit
  const pa = Math.PI * 1.78
  const px0 = Math.cos(pa) * 1.12
  const py0 = Math.sin(pa) * 0.36
  const px = px0 * Math.cos(TILT) - py0 * Math.sin(TILT)
  const py = px0 * Math.sin(TILT) + py0 * Math.cos(TILT)
  curves.push({ pts: circle(0.085, 48, 0, Math.PI * 2, px, py).map((p) => p.setZ(Math.sin(pa) * 0.55)), delay: 0.55, weight: 0.4, planet: [px, py, Math.sin(pa) * 0.55] })
  // twelve month ticks
  for (let i = 0; i < 12; i++) {
    const a = Math.PI / 2 - (i / 12) * Math.PI * 2
    const long = i % 3 === 0
    const r0 = 1.04
    const r1 = long ? 1.16 : 1.09
    curves.push({ pts: [new THREE.Vector3(Math.cos(a) * r0, Math.sin(a) * r0, 0), new THREE.Vector3(Math.cos(a) * r1, Math.sin(a) * r1, 0)], delay: 0.5 + i * 0.025, weight: 0.08 })
  }
  return curves
}

function samplePolyline(pts, n) {
  const lens = [0]
  for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1] + pts[i].distanceTo(pts[i - 1]))
  const total = lens[lens.length - 1]
  const out = []
  for (let k = 0; k < n; k++) {
    const t = Math.random() * total
    let i = 1
    while (i < lens.length - 1 && lens[i] < t) i++
    const f = (t - lens[i - 1]) / Math.max(1e-6, lens[i] - lens[i - 1])
    out.push(pts[i - 1].clone().lerp(pts[i], f))
  }
  return out
}

export function LogoMark({ count = 3200 }) {
  const group = useRef()
  const pmat = useRef()
  const lineMats = useRef([])
  const curves = useMemo(() => markCurves(), [])

  const particles = useMemo(() => {
    const targets = []
    const weightSum = curves.reduce((a, c) => a + c.weight, 0)
    const lineShare = Math.floor(count * 0.82)
    for (const c of curves) {
      const n = Math.round((c.weight / weightSum) * lineShare)
      for (const p of samplePolyline(c.pts, n)) {
        p.x += (Math.random() - 0.5) * 0.018
        p.y += (Math.random() - 0.5) * 0.018
        targets.push(p)
      }
    }
    // luminous cores: the guiding star and the planet
    const planet = curves.find((c) => c.planet).planet
    while (targets.length < count) {
      const atStar = Math.random() < 0.7
      const r = Math.pow(Math.random(), 2.4) * (atStar ? 0.16 : 0.08)
      const a = Math.random() * Math.PI * 2
      const cx = atStar ? 0 : planet[0]
      const cy = atStar ? 0 : planet[1]
      targets.push(new THREE.Vector3(cx + Math.cos(a) * r, cy + Math.sin(a) * r, atStar ? 0 : planet[2]))
    }
    const pos = new Float32Array(count * 3)
    const start = new Float32Array(count * 3)
    const dir = new Float32Array(count * 3)
    const seed = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const t = targets[i]
      pos.set([t.x, t.y, t.z], i * 3)
      // start as a wide spiral cloud of dust
      const r = 6 + Math.random() * 22
      const th = Math.random() * Math.PI * 2
      const ph = Math.acos(Math.random() * 2 - 1)
      start.set([Math.sin(ph) * Math.cos(th) * r, Math.cos(ph) * r * 0.6, Math.sin(ph) * Math.sin(th) * r - 6], i * 3)
      const d = new THREE.Vector3(t.x, t.y, t.z + 0.3).normalize()
      d.x += (Math.random() - 0.5) * 0.8
      d.y += (Math.random() - 0.5) * 0.8
      d.z += Math.random() * 1.2
      d.normalize()
      dir.set([d.x, d.y, d.z], i * 3)
      seed[i] = Math.random()
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aStart', new THREE.BufferAttribute(start, 3))
    g.setAttribute('aDir', new THREE.BufferAttribute(dir, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    return g
  }, [count, curves])

  const lines = useMemo(
    () =>
      curves.map((c) => {
        const g = new THREE.BufferGeometry().setFromPoints(c.pts)
        const d = new Float32Array(c.pts.length)
        let acc = 0
        for (let i = 1; i < c.pts.length; i++) {
          acc += c.pts[i].distanceTo(c.pts[i - 1])
          d[i] = acc
        }
        for (let i = 0; i < d.length; i++) d[i] /= acc || 1
        g.setAttribute('aDist', new THREE.BufferAttribute(d, 1))
        return { g, delay: c.delay }
      }),
    [curves],
  )

  useFrame((state, dt) => {
    if (!group.current) return
    const visible = sig.burst < 0.999 && (sig.converge > 0 || sig.draw > 0)
    group.current.visible = visible
    if (!visible) return
    const t = state.clock.elapsedTime
    // a slow, breathing turn so the orbit's depth is felt
    group.current.rotation.y = Math.sin(t * 0.35) * 0.22 + sig.pointer.x * 0.12
    group.current.rotation.x = Math.cos(t * 0.3) * 0.06 - sig.pointer.y * 0.08
    const u = pmat.current.uniforms
    u.uTime.value = t
    u.uConverge.value = sig.converge
    u.uBurst.value = sig.burst
    u.uGlint.value = sig.glint
    lineMats.current.forEach((m, i) => {
      if (!m) return
      m.uniforms.uDraw.value = THREE.MathUtils.clamp((sig.draw * 1.6 - lines[i].delay) / 0.9, 0, 1)
      m.uniforms.uFade.value = 1 - sig.burst
      m.uniforms.uGlint.value = sig.glint
    })
  })

  return (
    <group ref={group} position={[0, 1.05, 0]} scale={S}>
      <points geometry={particles} frustumCulled={false}>
        <shaderMaterial
          ref={pmat}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={{ uTime: { value: 0 }, uConverge: { value: 0 }, uBurst: { value: 0 }, uGlint: { value: 0 }, uPixel: { value: Math.min(window.devicePixelRatio, 1.75) } }}
          vertexShader={/* glsl */ `
            attribute vec3 aStart; attribute vec3 aDir; attribute float aSeed;
            uniform float uTime, uConverge, uBurst, uGlint, uPixel;
            varying float vA; varying float vHot;
            float ease(float x){ return x < 0.5 ? 4.0*x*x*x : 1.0 - pow(-2.0*x + 2.0, 3.0) / 2.0; }
            void main(){
              float k = clamp(uConverge * 1.7 - aSeed * 0.7, 0.0, 1.0);
              float e = ease(k);
              // spiral in: rotate the start around the axis as it travels
              float ang = (1.0 - e) * (2.4 + aSeed * 2.0);
              vec3 s = aStart;
              s.xz = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * s.xz;
              vec3 p = mix(s, position, e);
              // living shimmer once formed
              p += vec3(sin(uTime*1.3 + aSeed*30.0), cos(uTime*1.1 + aSeed*20.0), 0.0) * 0.006 * e;
              // the exit burst
              float b = uBurst * uBurst;
              p += aDir * b * (3.0 + aSeed * 14.0);
              vec4 mv = modelViewMatrix * vec4(p, 1.0);
              gl_Position = projectionMatrix * mv;
              // glint: a diagonal band of light sweeping across the mark
              float g = (position.x + position.y * 0.55) - mix(-1.8, 1.8, uGlint);
              vHot = exp(-g*g*18.0) * step(0.001, uGlint) * step(uGlint, 0.999);
              vA = mix(0.35, 1.0, e) * (1.0 - b);
              float size = mix(2.6, 1.55, e) + aSeed * 1.4 + vHot * 3.5;
              gl_PointSize = size * uPixel * (14.0 / -mv.z);
            }`}
          fragmentShader={/* glsl */ `
            varying float vA; varying float vHot;
            void main(){
              float d = length(gl_PointCoord - 0.5);
              float a = pow(smoothstep(0.5, 0.0, d), 2.0) * vA;
              if (a < 0.01) discard;
              vec3 gold = vec3(1.0, 0.82, 0.52);
              vec3 col = mix(gold, vec3(1.0, 0.97, 0.9), vHot) * (1.2 + vHot * 2.0);
              gl_FragColor = vec4(col, a);
            }`}
        />
      </points>
      {lines.map((l, i) => (
        <line key={i} geometry={l.g}>
          <shaderMaterial
            ref={(m) => (lineMats.current[i] = m)}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            uniforms={{ uDraw: { value: 0 }, uFade: { value: 1 }, uGlint: { value: 0 } }}
            vertexShader={`attribute float aDist; varying float vD; varying vec2 vP; void main(){ vD=aDist; vP=position.xy; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`}
            fragmentShader={`uniform float uDraw, uFade, uGlint; varying float vD; varying vec2 vP;
              void main(){
                float dr = uDraw * 1.08;
                float head = smoothstep(dr, dr - 0.06, vD);
                float tip = exp(-pow((vD - dr) * 40.0, 2.0)) * step(0.001, uDraw) * step(uDraw, 0.999);
                float g = (vP.x + vP.y*0.55) - mix(-1.8, 1.8, uGlint);
                float hot = exp(-g*g*14.0) * step(0.001, uGlint) * step(uGlint, 0.999);
                vec3 col = vec3(1.0, 0.84, 0.56) * (0.9 + tip * 3.0 + hot * 2.5);
                float a = (head * 0.75 + tip) * uFade;
                if (a < 0.01) discard;
                gl_FragColor = vec4(col, a);
              }`}
          />
        </line>
      ))}
    </group>
  )
}
