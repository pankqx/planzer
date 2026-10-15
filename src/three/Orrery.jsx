import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Html, Text } from '@react-three/drei'
import * as THREE from 'three'
import italianaUrl from '@fontsource/italiana/files/italiana-latin-400-normal.woff?url'
import { NOISE } from './glsl'
import { sig } from './signals'
import { useStore, monthStats, catOf, goalProgress } from '../store'
import { MONTHS, MONTHS_SHORT, MONTH_HUES, ROMAN, daysIn, todayParts } from '../lib/date'

export const ORBIT0 = 3.1
export const ORBIT_STEP = 0.6
export const DIAL_R = 11.0
const TAU = Math.PI * 2

/** Shared registry so the camera can find a month's planet in world space. */
export const planetAnchors = []

export function yearGeometry(year) {
  const total = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365
  const starts = []
  let acc = 0
  for (let m = 0; m < 12; m++) {
    starts.push(acc)
    acc += daysIn(year, m)
  }
  const angleOf = (day) => Math.PI / 2 - (day / total) * TAU
  const mid = starts.map((s, m) => angleOf(s + daysIn(year, m) / 2))
  return { total, starts, angleOf, mid }
}
const polar = (a, r, y = 0) => new THREE.Vector3(Math.cos(a) * r, y, -Math.sin(a) * r)
const damp = THREE.MathUtils.damp

export function Orrery() {
  const year = useStore((s) => s.year)
  const goals = useStore((s) => s.goals)
  const tasks = useStore((s) => s.tasks)
  const habits = useStore((s) => s.habits)
  const view = useStore((s) => s.view)
  const phase = useStore((s) => s.phase)
  const month = useStore((s) => s.month)
  const hoverMonth = useStore((s) => s.hoverMonth)
  const focusGoal = useStore((s) => s.focusGoal)

  const geo = useMemo(() => yearGeometry(year), [year])
  const stats = useMemo(() => {
    const st = { year, goals, tasks, habits }
    return Array.from({ length: 12 }, (_, m) => monthStats(st, m))
  }, [year, goals, tasks, habits])
  const focus = focusGoal ? goals.find((g) => g.id === focusGoal) : null

  const t = todayParts()
  const current = t.y === year ? t.m : -1

  const system = useRef()
  const base = useRef(null)
  if (base.current === null) base.current = -Math.PI / 2 - geo.mid[current >= 0 ? current : 0] + 0.42

  useFrame((state, dt) => {
    if (!system.current) return
    const o = sig.orrery
    const e = 1 - Math.pow(1 - o, 3)
    system.current.scale.setScalar(Math.max(0.001, e))
    sig.spinVel *= Math.pow(0.04, dt)
    sig.spin += sig.spinVel * dt + (view === 'year' ? dt * 0.014 : dt * 0.004)
    system.current.rotation.y = base.current + sig.spin + (1 - e) * 1.6
    system.current.visible = o > 0.001
  })

  const showLabels = phase === 'app' && (view === 'year' || view === 'habits')

  return (
    <group ref={system}>
      <Sun />
      <Dial geo={geo} year={year} current={current} today={t} />
      <YearPath geo={geo} />
      {MONTHS.map((name, m) => (
        <Planet
          key={m}
          m={m}
          angle={geo.mid[m]}
          radius={ORBIT0 + m * ORBIT_STEP}
          stats={stats[m]}
          current={m === current}
          hovered={hoverMonth === m}
          selected={view === 'month' && month === m}
          dim={(focus && (m < focus.start || m > focus.end)) || (view === 'month' && month !== m)}
          focus={focus}
          showLabel={showLabels}
        />
      ))}
    </group>
  )
}

/* ———————————————————————————— SUN ———————————————————————————— */
function Sun() {
  const core = useRef()
  const corona = useRef()
  useFrame((state, dt) => {
    if (core.current) core.current.uniforms.uTime.value += dt
    if (corona.current) corona.current.uniforms.uTime.value += dt
  })
  return (
    <group>
      <mesh>
        <sphereGeometry args={[1.15, 96, 64]} />
        <shaderMaterial
          ref={core}
          uniforms={{ uTime: { value: 0 } }}
          vertexShader={/* glsl */ `
            varying vec3 vPos; varying vec3 vN; varying vec3 vView;
            void main(){
              vPos = position; vN = normalize(normalMatrix * normal);
              vec4 mv = modelViewMatrix * vec4(position,1.0); vView = normalize(-mv.xyz);
              gl_Position = projectionMatrix * mv;
            }`}
          fragmentShader={/* glsl */ `
            ${NOISE}
            uniform float uTime; varying vec3 vPos; varying vec3 vN; varying vec3 vView;
            void main(){
              vec3 p = normalize(vPos);
              float t = uTime * 0.06;
              float g = fbm(p * 3.2 + vec3(t, t*0.7, -t));
              float cells = fbm(p * 9.0 - vec3(0.0, t*2.0, t) + g);
              float n = g * 0.6 + cells * 0.4;
              float limb = pow(max(dot(vN, vView), 0.0), 0.55);
              vec3 deep = vec3(0.95, 0.42, 0.10);
              vec3 gold = vec3(1.0, 0.78, 0.38);
              vec3 white = vec3(1.0, 0.97, 0.88);
              vec3 col = mix(deep, gold, smoothstep(-0.4, 0.3, n));
              col = mix(col, white, smoothstep(0.15, 0.6, n) * limb);
              col *= mix(0.55, 1.0, limb);
              gl_FragColor = vec4(col * 2.2, 1.0);
            }`}
        />
      </mesh>
      <Billboard>
        <mesh>
          <planeGeometry args={[9, 9]} />
          <shaderMaterial
            ref={corona}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            uniforms={{ uTime: { value: 0 } }}
            vertexShader={`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`}
            fragmentShader={/* glsl */ `
              ${NOISE}
              uniform float uTime; varying vec2 vUv;
              void main(){
                vec2 p = (vUv - 0.5) * 9.0;
                float r = length(p);
                float a = atan(p.y, p.x);
                float rays = snoise(vec3(cos(a)*2.0, sin(a)*2.0, uTime*0.12)) * 0.5 + 0.5;
                rays = pow(rays, 3.0);
                float halo = exp(-(r - 1.1) * 1.6) * step(1.0, r);
                float glow = 0.55 * halo + rays * exp(-(r - 1.1) * 0.9) * 0.55 * step(1.05, r);
                float far = exp(-r * 0.55) * 0.18;
                vec3 col = mix(vec3(1.0, 0.55, 0.18), vec3(1.0, 0.85, 0.55), exp(-(r-1.1)));
                float alpha = (glow + far) * smoothstep(4.5, 2.5, r);
                gl_FragColor = vec4(col * alpha, alpha);
              }`}
          />
        </mesh>
      </Billboard>
    </group>
  )
}

/* ———————————————————————————— DIAL ———————————————————————————— */
function Dial({ geo, year, current, today }) {
  const ticks = useMemo(() => {
    const pts = []
    for (let d = 0; d < geo.total; d++) {
      const a = geo.angleOf(d)
      const isStart = geo.starts.includes(d)
      const r0 = DIAL_R
      const r1 = DIAL_R + (isStart ? 0.75 : d % 7 === 0 ? 0.28 : 0.16)
      pts.push(polar(a, r0), polar(a, r1))
    }
    return new THREE.BufferGeometry().setFromPoints(pts)
  }, [geo])
  const rings = useMemo(() => {
    const mk = (r) => new THREE.BufferGeometry().setFromPoints(Array.from({ length: 361 }, (_, i) => polar((i / 360) * TAU, r)))
    return [mk(DIAL_R), mk(DIAL_R + 0.95), mk(DIAL_R + 1.02)]
  }, [])
  const todayIdx = current >= 0 ? geo.starts[today.m] + today.d - 1 : -1
  const todayA = todayIdx >= 0 ? geo.angleOf(todayIdx + 0.5) : 0
  const hand = useMemo(() => new THREE.BufferGeometry().setFromPoints([polar(todayA, 1.7), polar(todayA, DIAL_R + 1.25)]), [todayA])
  const bead = useRef()
  const mats = useRef(new Set())
  const labels = useRef([])
  const wp = useMemo(() => new THREE.Vector3(), [])
  useFrame((state) => {
    // keep every engraved month name readable from where you stand
    labels.current.forEach((l) => {
      if (!l) return
      l.getWorldPosition(wp)
      // the engraving's "up" points outward from the sun; flip it when that faces the viewer
      const dx = wp.x - state.camera.position.x
      const dz = wp.z - state.camera.position.z
      const d = (wp.x * dx + wp.z * dz) / (Math.hypot(wp.x, wp.z) * Math.hypot(dx, dz) || 1)
      if (d > 0.12) l.userData.flip = 0
      else if (d < -0.12) l.userData.flip = Math.PI
      l.rotation.z = l.userData.base + (l.userData.flip || 0)
    })
    const o = sig.orrery
    mats.current.forEach((m) => m && (m.opacity = m.userData.base * o))
    if (bead.current) {
      const k = (state.clock.elapsedTime * 0.12) % 1
      bead.current.position.copy(polar(todayA, 1.7 + k * (DIAL_R - 1.7)))
      bead.current.scale.setScalar(0.06 + Math.sin(k * Math.PI) * 0.05)
    }
  })
  const reg = (base) => (m) => {
    if (m) {
      m.userData.base = base
      mats.current.add(m)
    }
  }
  return (
    <group>
      <lineSegments geometry={ticks}>
        <lineBasicMaterial ref={reg(0.42)} color="#e6c98a" transparent depthWrite={false} />
      </lineSegments>
      {rings.map((g, i) => (
        <line key={i} geometry={g}>
          <lineBasicMaterial ref={reg(i === 0 ? 0.35 : 0.16)} color="#e6c98a" transparent depthWrite={false} />
        </line>
      ))}
      {MONTHS.map((name, m) => (
        <Text
          key={m}
          font={italianaUrl}
          fontSize={0.42}
          letterSpacing={0.18}
          color={m === current ? '#fff2cc' : '#e6c98a'}
          fillOpacity={m === current ? 1 : 0.62}
          anchorX="center"
          anchorY="middle"
          position={polar(geo.mid[m], DIAL_R + 0.48, 0.001)}
          ref={(r) => (labels.current[m] = r)}
          userData={{ base: geo.mid[m] - Math.PI / 2 }}
          rotation={[-Math.PI / 2, 0, geo.mid[m] - Math.PI / 2]}
        >
          {name.toUpperCase()}
        </Text>
      ))}
      <Text font={italianaUrl} fontSize={0.36} letterSpacing={0.4} color="#e6c98a" fillOpacity={0.5} position={polar(geo.angleOf(0), DIAL_R + 1.6, 0)} rotation={[-Math.PI / 2, 0, 0]} anchorX="center">
        {String(year)}
      </Text>
      {todayIdx >= 0 && (
        <group>
          <line geometry={hand}>
            <lineBasicMaterial ref={reg(0.5)} color="#fff2cc" transparent depthWrite={false} blending={THREE.AdditiveBlending} />
          </line>
          <mesh ref={bead}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshBasicMaterial color={[3, 2.5, 1.6]} toneMapped={false} />
          </mesh>
          <mesh position={polar(todayA, DIAL_R + 1.25)}>
            <sphereGeometry args={[0.09, 16, 16]} />
            <meshBasicMaterial color={[4, 3.2, 2]} toneMapped={false} />
          </mesh>
        </group>
      )}
    </group>
  )
}

/* ———————————————————————— THE YEAR'S PATH ———————————————————————— */
function YearPath({ geo }) {
  const mat = useRef()
  const g = useMemo(() => {
    const pts = geo.mid.map((a, m) => polar(a, ORBIT0 + m * ORBIT_STEP))
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal')
    const sampled = curve.getSpacedPoints(600)
    const geom = new THREE.BufferGeometry().setFromPoints(sampled)
    geom.setAttribute('aDist', new THREE.BufferAttribute(new Float32Array(sampled.map((_, i) => i / 600)), 1))
    return geom
  }, [geo])
  useFrame((_, dt) => {
    if (!mat.current) return
    mat.current.uniforms.uTime.value += dt
    mat.current.uniforms.uO.value = sig.orrery
  })
  return (
    <line geometry={g}>
      <shaderMaterial
        ref={mat}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{ uTime: { value: 0 }, uO: { value: 0 } }}
        vertexShader={`attribute float aDist; varying float vD; void main(){ vD=aDist; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`}
        fragmentShader={`uniform float uTime, uO; varying float vD;
          void main(){
            float flow = fract(vD * 22.0 - uTime * 0.35);
            float dash = smoothstep(0.0, 0.08, flow) * smoothstep(0.55, 0.3, flow);
            float a = (0.08 + dash * 0.42) * uO;
            gl_FragColor = vec4(vec3(1.0, 0.85, 0.58) * 1.2, a);
          }`}
      />
    </line>
  )
}

/* ———————————————————————————— PLANETS ———————————————————————————— */
function Planet({ m, angle, radius, stats, current, hovered, selected, dim, focus, showLabel }) {
  const openMonth = useStore((s) => s.openMonth)
  const setHoverMonth = useStore((s) => s.setHoverMonth)
  const view = useStore((s) => s.view)
  const anchor = useRef()
  const body = useRef()
  const mat = useRef()
  const ringMat = useRef()
  const orbitMat = useRef()
  const arc = useRef()
  const [a, b] = MONTH_HUES[m]
  const size = 0.2 + Math.min(stats.weight, 7) * 0.045
  const pos = useMemo(() => polar(angle, radius), [angle, radius])
  const orbit = useMemo(() => new THREE.BufferGeometry().setFromPoints(Array.from({ length: 241 }, (_, i) => polar((i / 240) * TAU, radius))), [radius])
  const arcGeo = useMemo(() => new THREE.RingGeometry(size * 1.75, size * 1.83, 96, 1, Math.PI / 2, -Math.max(0.0001, stats.progress) * TAU), [size, stats.progress])
  const trackGeo = useMemo(() => new THREE.RingGeometry(size * 1.75, size * 1.83, 96), [size])

  useFrame((state, dt) => {
    if (!body.current || !mat.current) return
    body.current.rotation.y += dt * (0.15 + m * 0.01)
    const u = mat.current.uniforms
    u.uTime.value += dt
    const target = hovered || selected ? 1.6 : current ? 1.15 : 1
    u.uGlow.value = damp(u.uGlow.value, target, 6, dt)
    u.uDim.value = damp(u.uDim.value, dim ? 0.18 : 1, 5, dt)
    const sc = damp(body.current.scale.x, hovered ? 1.35 : selected ? 1.15 : 1, 7, dt)
    body.current.scale.setScalar(sc)
    if (orbitMat.current) orbitMat.current.opacity = damp(orbitMat.current.opacity, (hovered || selected ? 0.55 : current ? 0.3 : 0.11) * sig.orrery * (dim ? 0.4 : 1), 5, dt)
    if (ringMat.current) ringMat.current.opacity = damp(ringMat.current.opacity, (dim ? 0.15 : 0.9) * sig.orrery, 5, dt)
    if (arc.current) arc.current.rotation.z = 0
  })

  const moons = stats.goals.slice(0, 7)

  return (
    <group>
      <line geometry={orbit}>
        <lineBasicMaterial ref={orbitMat} color={current ? '#fff2cc' : '#e6c98a'} transparent opacity={0} depthWrite={false} />
      </line>
      <group ref={anchor} position={pos}>
        <AnchorRegister m={m} anchor={anchor} size={size} />
        <mesh ref={body}>
          <sphereGeometry args={[size, 64, 48]} />
          <shaderMaterial
            ref={mat}
            uniforms={{ uTime: { value: 0 }, uA: { value: new THREE.Color(a) }, uB: { value: new THREE.Color(b) }, uGlow: { value: 1 }, uDim: { value: 1 }, uSeed: { value: m * 3.7 } }}
            vertexShader={/* glsl */ `
              varying vec3 vObj; varying vec3 vWN; varying vec3 vWP;
              void main(){
                vObj = position;
                vWN = normalize(mat3(modelMatrix) * normal);
                vec4 wp = modelMatrix * vec4(position,1.0); vWP = wp.xyz;
                gl_Position = projectionMatrix * viewMatrix * wp;
              }`}
            fragmentShader={/* glsl */ `
              ${NOISE}
              uniform float uTime, uGlow, uDim, uSeed; uniform vec3 uA, uB;
              varying vec3 vObj; varying vec3 vWN; varying vec3 vWP;
              void main(){
                vec3 p = normalize(vObj);
                float warp = fbm(p * 2.5 + uSeed + vec3(0.0, uTime*0.02, 0.0));
                float bands = sin(p.y * 9.0 + warp * 3.5 + uSeed) * 0.5 + 0.5;
                float storms = smoothstep(0.55, 0.9, fbm(p * 5.0 - uSeed));
                vec3 surf = mix(uB, uA, bands);
                surf = mix(surf, vec3(1.0, 0.95, 0.85), storms * 0.25);
                vec3 L = normalize(-vWP);
                vec3 V = normalize(cameraPosition - vWP);
                float diff = smoothstep(-0.25, 0.9, dot(vWN, L));
                float rim = pow(1.0 - max(dot(vWN, V), 0.0), 2.6);
                vec3 col = surf * (0.1 + diff * 1.05);
                col += uA * rim * (0.9 + (uGlow - 1.0) * 1.8);
                col *= mix(0.9, 1.25, uGlow - 1.0) * uDim;
                gl_FragColor = vec4(col * uGlow, 1.0);
              }`}
          />
        </mesh>
        {/* generous invisible hit target */}
        <mesh
          visible={false}
          onPointerOver={(e) => {
            if (view === 'print') return
            e.stopPropagation()
            setHoverMonth(m)
            document.body.dataset.cursor = 'planet'
          }}
          onPointerOut={() => {
            setHoverMonth(null)
            delete document.body.dataset.cursor
          }}
          onClick={(e) => {
            e.stopPropagation()
            if (sig.dragged) return
            delete document.body.dataset.cursor
            setHoverMonth(null)
            openMonth(m)
          }}
        >
          <sphereGeometry args={[Math.max(size * 2.4, 0.55), 12, 12]} />
        </mesh>
        <Billboard>
          <mesh geometry={trackGeo}>
            <meshBasicMaterial color="#e6c98a" transparent opacity={0.12 * (dim ? 0.3 : 1)} depthWrite={false} />
          </mesh>
          <mesh ref={arc} geometry={arcGeo}>
            <meshBasicMaterial ref={ringMat} color={[2.4, 1.9, 1.1]} toneMapped={false} transparent opacity={0} depthWrite={false} />
          </mesh>
        </Billboard>
        {current && !selected && <CurrentHalo size={size} />}
        {moons.map((g, i) => (
          <Moon key={g.id} i={i} planetSize={size} color={catOf(g.category).color} focused={focus?.id === g.id} faded={focus && focus.id !== g.id} progress={goalProgress(g)} />
        ))}
        {showLabel && (
          <Html center position={[0, size * 2.3 + 0.25, 0]} zIndexRange={[8, 0]} style={{ pointerEvents: 'none' }}>
            <PlanetLabel m={m} stats={stats} hovered={hovered} current={current} dim={dim} />
          </Html>
        )}
      </group>
    </group>
  )
}

function AnchorRegister({ m, anchor, size }) {
  // register after mount so the camera rig can track this planet
  useFrame(() => {
    planetAnchors[m] = anchor.current
    if (anchor.current) anchor.current.userData.size = size
  })
  return null
}

function CurrentHalo({ size }) {
  const ref = useRef()
  useFrame((state) => {
    if (!ref.current) return
    const k = (state.clock.elapsedTime * 0.5) % 1
    ref.current.scale.setScalar(1 + k * 2.2)
    ref.current.material.opacity = (1 - k) * 0.5 * sig.orrery
  })
  return (
    <Billboard>
      <mesh ref={ref}>
        <ringGeometry args={[size * 1.2, size * 1.26, 64]} />
        <meshBasicMaterial color={[2.2, 1.8, 1.2]} toneMapped={false} transparent depthWrite={false} />
      </mesh>
    </Billboard>
  )
}

function Moon({ i, planetSize, color, focused, faded, progress }) {
  const ref = useRef()
  const r = planetSize * 2.4 + i * 0.13
  const speed = 0.9 / (1 + i * 0.35)
  const tilt = (i % 2 ? 1 : -1) * (0.25 + i * 0.12)
  const phase = i * 2.1
  useFrame((state, dt) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime * speed + phase
    ref.current.position.set(Math.cos(t) * r, Math.sin(t) * r * Math.sin(tilt), Math.sin(t) * r * Math.cos(tilt))
    const s = damp(ref.current.scale.x, focused ? 2.2 : faded ? 0.5 : 1, 6, dt)
    ref.current.scale.setScalar(s)
  })
  const c = new THREE.Color(color).multiplyScalar(0.9 + progress * 1.1)
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.045, 16, 16]} />
      <meshBasicMaterial color={c} toneMapped={false} transparent opacity={faded ? 0.35 : 1} />
    </mesh>
  )
}

function PlanetLabel({ m, stats, hovered, current, dim }) {
  return (
    <div
      style={{
        textAlign: 'center',
        whiteSpace: 'nowrap',
        transform: `translateY(${hovered ? -6 : 0}px)`,
        transition: 'all .6s cubic-bezier(.22,1,.36,1)',
        opacity: dim ? 0.15 : 1,
        userSelect: 'none',
      }}
    >
      <div style={{ fontFamily: 'var(--display)', fontSize: hovered ? 22 : 13, letterSpacing: '.22em', color: current || hovered ? '#fff2cc' : 'rgba(230,201,138,.8)', textShadow: '0 0 18px rgba(230,201,138,.6)', transition: 'all .6s cubic-bezier(.22,1,.36,1)' }}>
        {hovered ? MONTHS[m] : MONTHS_SHORT[m].toUpperCase()}
      </div>
      <div style={{ overflow: 'hidden', maxHeight: hovered ? 60 : 0, opacity: hovered ? 1 : 0, transition: 'all .6s cubic-bezier(.22,1,.36,1)' }}>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 10, letterSpacing: '.24em', color: 'rgba(244,236,220,.7)', marginTop: 6, textTransform: 'uppercase' }}>
          {ROMAN[m + 1]} · {stats.goals.length} goals · {stats.tasks.length} plans · {Math.round(stats.progress * 100)}%
        </div>
      </div>
    </div>
  )
}
