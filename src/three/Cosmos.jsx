import { Suspense, useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'
import { Starfield, Nebula, ShootingStars } from './Sky'
import { LogoMark } from './LogoMark'
import { Orrery, planetAnchors } from './Orrery'
import { sig } from './signals'
import { useStore } from '../store'

const v = () => new THREE.Vector3()
const UP = new THREE.Vector3(0, 1, 0)

function CameraRig() {
  const { camera, size } = useThree()
  const phase = useStore((s) => s.phase)
  const view = useStore((s) => s.view)
  const month = useStore((s) => s.month)
  const look = useRef(new THREE.Vector3(0, 0.1, 0))
  const tmp = useRef({ pos: v(), look: v(), p: v(), dirIn: v(), right: v(), fwd: v() })
  const first = useRef(true)

  useFrame((state, dt) => {
    const aspect = size.width / size.height
    const narrow = aspect < 0.9
    const t = tmp.current
    const pos = t.pos
    const tgt = t.look
    let lambda = 1.9

    if (phase === 'intro') {
      const z = 12 * Math.max(1, 0.95 / aspect)
      pos.set(0, 0.6, z + (1 - sig.converge) * 6 - sig.burst * 4)
      tgt.set(0, 0.1, 0)
      lambda = 3
    } else if (view === 'month' && planetAnchors[month]) {
      planetAnchors[month].getWorldPosition(t.p)
      t.dirIn.copy(t.p).setY(0).normalize().negate()
      t.fwd.copy(t.dirIn).negate()
      t.right.crossVectors(t.fwd, UP).normalize()
      const dist = narrow ? 4.6 : 3.4
      pos.copy(t.p).addScaledVector(t.dirIn, dist).addScaledVector(UP, narrow ? 1.6 : 1.0)
      tgt.copy(t.p)
      if (narrow) tgt.addScaledVector(UP, -1.0)
      else tgt.addScaledVector(t.right, -1.45)
    } else if (view === 'habits') {
      pos.set(0, narrow ? 46 : 34, 0.01)
      tgt.set(0, 0, 0)
    } else if (view === 'print') {
      pos.set(0, 40, 70)
      tgt.set(0, 0, 0)
    } else {
      if (narrow) {
        pos.set(0, 30, 31)
        tgt.set(0, -1.5, 3)
      } else {
        pos.set(0, 18.5, 31)
        tgt.set(Math.min(7.8, 3.8 * aspect), 1.6, 0)
      }
    }
    // pointer parallax — the universe leans toward your hand
    pos.x += sig.pointer.x * (view === 'month' ? 0.25 : 0.9)
    pos.y += sig.pointer.y * (view === 'month' ? 0.18 : 0.6)

    if (first.current) {
      camera.position.copy(pos)
      look.current.copy(tgt)
      first.current = false
    }
    const before = camera.position.clone()
    camera.position.x = THREE.MathUtils.damp(camera.position.x, pos.x, lambda, dt)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, pos.y, lambda, dt)
    camera.position.z = THREE.MathUtils.damp(camera.position.z, pos.z, lambda, dt)
    look.current.x = THREE.MathUtils.damp(look.current.x, tgt.x, lambda * 1.3, dt)
    look.current.y = THREE.MathUtils.damp(look.current.y, tgt.y, lambda * 1.3, dt)
    look.current.z = THREE.MathUtils.damp(look.current.z, tgt.z, lambda * 1.3, dt)
    camera.lookAt(look.current)
    // the faster we fly, the more the stars stretch
    const speed = before.distanceTo(camera.position) / Math.max(dt, 1e-3)
    sig.warp = THREE.MathUtils.clamp(speed / 30, 0, 1)
  })
  return null
}

function Drag() {
  const { gl } = useThree()
  const view = useStore((s) => s.view)
  const phase = useStore((s) => s.phase)
  useEffect(() => {
    const el = gl.domElement
    let down = null
    let last = 0
    const onDown = (e) => {
      if (view !== 'year' || phase !== 'app') return
      down = { x: e.clientX, moved: 0 }
      last = e.clientX
    }
    const onMove = (e) => {
      sig.pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      sig.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1)
      if (!down) return
      const dx = e.clientX - last
      last = e.clientX
      down.moved += Math.abs(dx)
      sig.spin += dx * 0.004
      sig.spinVel = dx * 0.25
      if (down.moved > 6) {
        sig.dragged = true
        document.body.dataset.drag = '1'
      }
    }
    const onUp = () => {
      down = null
      delete document.body.dataset.drag
      setTimeout(() => (sig.dragged = false), 30)
    }
    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [gl, view, phase])
  return null
}

export default function Cosmos() {
  return (
    <Canvas
      className="cosmos"
      dpr={[1, 1.75]}
      gl={{ antialias: false, powerPreference: 'high-performance', alpha: false }}
      camera={{ fov: 40, near: 0.1, far: 1000, position: [0, 0.6, 18] }}
      style={{ position: 'fixed', inset: 0, zIndex: 0 }}
      onCreated={({ gl }) => gl.setClearColor('#03040a')}
    >
      <Suspense fallback={null}>
        <Nebula />
        <Starfield />
        <ShootingStars />
        <LogoMark />
        <Orrery />
        <CameraRig />
        <Drag />
        <EffectComposer multisampling={0} disableNormalPass>
          <Bloom mipmapBlur intensity={1.05} luminanceThreshold={0.62} luminanceSmoothing={0.25} radius={0.78} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  )
}
