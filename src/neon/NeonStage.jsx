import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { PerformanceMonitor } from '@react-three/drei'
import * as THREE from 'three'
import { makeObject } from './objects'
import { NEON } from '../lib/theme'
import { live, useSlots } from '../lib/nav'
import { useStore } from '../store'

const damp = THREE.MathUtils.damp

/** A perspective camera tuned so that one world unit equals one CSS pixel at z = 0. */
function PixelCamera() {
  const { camera, size } = useThree()
  useEffect(() => {
    camera.fov = 32
    camera.position.set(0, 0, size.height / 2 / Math.tan(THREE.MathUtils.degToRad(16)))
    camera.near = 10
    camera.far = camera.position.z * 4
    camera.updateProjectionMatrix()
  }, [camera, size])
  return null
}

/** Places a sculpture over a DOM slot (#id) and keeps it there every frame. */
function SlotObject({ id, m }) {
  const obj = useMemo(() => makeObject(m, NEON[m]), [m])
  const { size } = useThree()
  const st = useRef({ spin: Math.random() * 6, hover: 0, s: 0, el: null, lvl: null })
  useFrame((state, dt) => {
    const s = st.current
    if (!s.el || !s.el.isConnected) {
      s.el = document.getElementById(id)
      s.lvl = s.el?.closest('.level')
    }
    const el = s.el
    if (!el) return void (obj.visible = false)
    const r = el.getBoundingClientRect()
    if (r.right < -200 || r.left > size.width + 200 || r.width < 4) return void (obj.visible = false)
    obj.visible = true
    const fade = s.lvl ? parseFloat(getComputedStyle(s.lvl).opacity) : 1
    const hot = el.matches(':hover') || el.closest('.ycard:hover') ? 1 : 0
    s.hover = damp(s.hover, hot, 6, dt)
    const target = Math.min(r.width, r.height) * 0.36 * (1 + s.hover * 0.14) * fade
    s.s = s.s ? damp(s.s, target, 10, dt) : target
    obj.scale.setScalar(Math.max(0.001, s.s))
    obj.position.set(r.left + r.width / 2 - size.width / 2, size.height / 2 - (r.top + r.height / 2), 0)
    const inner = obj.userData.inner
    s.spin += dt * (0.55 + s.hover * 2.2)
    const t = state.clock.elapsedTime
    if (inner.userData.noSpin) inner.rotation.y = Math.sin(s.spin * 0.6) * 0.5
    else inner.rotation.y = s.spin
    inner.rotation.x = Math.sin(t * 0.7 + m) * 0.18
    obj.rotation.z = THREE.MathUtils.clamp(-live.vel / 9000, -0.35, 0.35)
    inner.position.y = Math.sin(t * 1.4 + m) * 0.06
    inner.userData.tick?.(t)
  })
  return <primitive object={obj} />
}

/** The opening: all twelve sculptures circling like a carousel of the year. */
function IntroRing() {
  const { size } = useThree()
  const objs = useMemo(() => NEON.map((c, m) => makeObject(m, c)), [])
  const group = useRef()
  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    const out = live.introOut || 0
    const inn = live.introIn ?? 1
    const mob = size.width < 700
    const R = Math.min(size.width * (mob ? 0.4 : 0.36), size.height * 0.95) * (1 + out * 1.8) * (0.4 + inn * 0.6)
    group.current.rotation.x = 0.36
    group.current.position.y = size.height * (mob ? 0.08 : 0.03)
    objs.forEach((o, i) => {
      const a = (i / 12) * Math.PI * 2 + t * 0.22 + out * 1.4
      o.position.set(Math.cos(a) * R, 0, Math.sin(a) * R)
      const sc = Math.min(size.width * 0.11, size.height * 0.13) * (mob ? 0.62 : 0.6) * inn * (1 - out * 0.8)
      o.scale.setScalar(Math.max(0.001, sc))
      o.userData.inner.rotation.y = t * 0.8 + i
      o.userData.inner.userData.tick?.(t)
      o.rotation.x = -0.32
    })
  })
  return (
    <group ref={group}>
      {objs.map((o, i) => (
        <primitive key={i} object={o} />
      ))}
    </group>
  )
}

/** Slow electric dust, tinted with whichever month is in the centre of the screen. */
function Dust({ count = 520 }) {
  const { size } = useThree()
  const mat = useRef()
  const geo = useMemo(() => {
    const p = new Float32Array(count * 3)
    const sd = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      p.set([(Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, -Math.random() * 600], i * 3)
      sd[i] = Math.random()
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(p, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(sd, 1))
    return g
  }, [count])
  const col = useMemo(() => new THREE.Color(), [])
  useFrame((state, dt) => {
    const u = mat.current.uniforms
    u.uTime.value += dt
    u.uScroll.value += live.vel * dt * 0.00035
    u.uSize.value.set(size.width, size.height)
    col.set(live.accent || NEON[0])
    u.uColor.value.lerp(col, 1 - Math.exp(-dt * 4))
  })
  return (
    <points geometry={geo} frustumCulled={false}>
      <shaderMaterial
        ref={mat}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{ uTime: { value: 0 }, uScroll: { value: 0 }, uSize: { value: new THREE.Vector2(1, 1) }, uColor: { value: new THREE.Color(NEON[0]) }, uPx: { value: Math.min(devicePixelRatio, 2) } }}
        vertexShader={`
          attribute float aSeed; uniform float uTime, uScroll, uPx; uniform vec2 uSize; varying float vA;
          void main(){
            vec3 p = position;
            float par = 0.3 + aSeed * 0.9;
            p.x = fract(p.x * 0.5 + 0.5 - uScroll * par + uTime * 0.004 * (aSeed - 0.5)) * 2.0 - 1.0;
            p.y = fract(p.y * 0.5 + 0.5 + uTime * 0.006 * par) * 2.0 - 1.0;
            vec3 w = vec3(p.x * uSize.x * 0.62, p.y * uSize.y * 0.62, p.z);
            vec4 mv = modelViewMatrix * vec4(w, 1.0);
            gl_Position = projectionMatrix * mv;
            vA = 0.25 + 0.75 * (0.5 + 0.5 * sin(uTime * (0.6 + aSeed * 2.0) + aSeed * 40.0));
            gl_PointSize = (1.2 + aSeed * 2.4) * uPx;
          }`}
        fragmentShader={`
          uniform vec3 uColor; varying float vA;
          void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard; gl_FragColor = vec4(uColor * 1.4, vA * (1.0 - d * 2.0)); }`}
      />
    </points>
  )
}

/** A soft pool of the month's colour on the black — the only "background" the neon world has. */
function Glow() {
  const mat = useRef()
  const { size } = useThree()
  const col = useMemo(() => new THREE.Color(), [])
  useFrame((_, dt) => {
    col.set(live.accent || NEON[0])
    mat.current.uniforms.uColor.value.lerp(col, 1 - Math.exp(-dt * 3))
    mat.current.uniforms.uAspect.value = size.width / size.height
  })
  return (
    <mesh position={[0, 0, -700]} scale={[size.width * 3, size.height * 3, 1]} renderOrder={-1}>
      <planeGeometry />
      <shaderMaterial
        ref={mat}
        depthWrite={false}
        uniforms={{ uColor: { value: new THREE.Color(NEON[0]) }, uAspect: { value: 1 } }}
        vertexShader={`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`}
        fragmentShader={`
          uniform vec3 uColor; uniform float uAspect; varying vec2 vUv;
          void main(){
            vec2 p = (vUv - vec2(0.5, 0.42)) * vec2(uAspect, 1.0) * 3.0;
            float g = exp(-dot(p, p) * 3.2) * 0.022;
            gl_FragColor = vec4(vec3(0.0018, 0.0018, 0.0024) + uColor * g, 1.0);
          }`}
      />
    </mesh>
  )
}

function Slots() {
  const slots = useSlots((s) => s.slots)
  const list = Object.values(slots).flat()
  return list.map((s) => <SlotObject key={s.id} id={s.id} m={s.m} />)
}

export default function NeonStage() {
  const phase = useStore((s) => s.phase)
  const [dpr, setDpr] = useState(Math.min(window.devicePixelRatio, 1.75))
  return (
    <Canvas className="stage" dpr={dpr} gl={{ antialias: true, powerPreference: 'high-performance' }} style={{ position: 'fixed', inset: 0, zIndex: 0 }} onCreated={({ gl }) => gl.setClearColor('#050506')}>
      <PerformanceMonitor onDecline={() => setDpr((d) => Math.max(0.8, d - 0.3))} flipflops={3} />
      <PixelCamera />
      <ambientLight intensity={0.35} />
      <directionalLight position={[-400, 600, 800]} intensity={1.6} />
      <directionalLight position={[500, -200, 300]} intensity={0.5} color="#8899ff" />
      <Glow />
      <Dust />
      {phase === 'intro' ? <IntroRing /> : <Slots />}
      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur intensity={1.35} luminanceThreshold={0.55} luminanceSmoothing={0.2} radius={0.72} />
      </EffectComposer>
    </Canvas>
  )
}
