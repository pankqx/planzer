import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { NOISE } from './glsl'
import { sig } from './signals'

/** Thousands of twinkling stars with warm/cool temperature and a few bright diffraction stars. */
export function Starfield({ count = 7000 }) {
  const mat = useRef()
  const geo = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const size = new Float32Array(count)
    const phase = new Float32Array(count)
    const warm = new THREE.Color('#ffe2b0')
    const cool = new THREE.Color('#bcd4ff')
    const white = new THREE.Color('#ffffff')
    const c = new THREE.Color()
    for (let i = 0; i < count; i++) {
      // denser band like a faint galactic plane
      const u = Math.random() * 2 - 1
      const band = Math.random() < 0.45
      const y = band ? (Math.random() - 0.5) * 0.35 : u
      const th = Math.random() * Math.PI * 2
      const r = 45 + Math.random() * 110
      const s = Math.sqrt(1 - y * y)
      pos[i * 3] = Math.cos(th) * s * r
      pos[i * 3 + 1] = y * r * 0.8 + 6
      pos[i * 3 + 2] = Math.sin(th) * s * r
      const t = Math.random()
      c.copy(white).lerp(t < 0.5 ? warm : cool, Math.random() * 0.8)
      col.set([c.r, c.g, c.b], i * 3)
      const bright = Math.random() < 0.012
      size[i] = bright ? 9 + Math.random() * 8 : 1.2 + Math.pow(Math.random(), 3) * 4.5
      phase[i] = Math.random()
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aColor', new THREE.BufferAttribute(col, 3))
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
    g.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1))
    return g
  }, [count])

  useFrame((state, dt) => {
    if (!mat.current) return
    mat.current.uniforms.uTime.value += dt
    mat.current.uniforms.uWarp.value = THREE.MathUtils.damp(mat.current.uniforms.uWarp.value, sig.warp, 4, dt)
  })

  return (
    <points geometry={geo} frustumCulled={false}>
      <shaderMaterial
        ref={mat}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{ uTime: { value: 0 }, uPixel: { value: Math.min(window.devicePixelRatio, 1.75) }, uWarp: { value: 0 } }}
        vertexShader={/* glsl */ `
          attribute vec3 aColor; attribute float aSize; attribute float aPhase;
          uniform float uTime; uniform float uPixel; uniform float uWarp;
          varying vec3 vColor; varying float vTw; varying float vBig;
          void main(){
            vec4 mv = modelViewMatrix * vec4(position,1.0);
            gl_Position = projectionMatrix * mv;
            float tw = 0.6 + 0.4 * sin(uTime * (0.4 + aPhase * 2.2) + aPhase * 60.0);
            vTw = tw; vColor = aColor; vBig = step(8.0, aSize);
            gl_PointSize = aSize * uPixel * (0.75 + 0.25*tw) * (70.0 / -mv.z) * (1.0 + uWarp * 1.5);
          }`}
        fragmentShader={/* glsl */ `
          varying vec3 vColor; varying float vTw; varying float vBig;
          void main(){
            vec2 p = gl_PointCoord - 0.5;
            float d = length(p);
            float core = smoothstep(0.5, 0.0, d);
            core = pow(core, 3.0);
            // four-point diffraction spikes on the brightest stars
            float spikes = vBig * (smoothstep(0.035, 0.0, abs(p.x)) + smoothstep(0.035, 0.0, abs(p.y))) * smoothstep(0.5, 0.0, d) * 0.7;
            float a = (core + spikes) * vTw;
            if (a < 0.01) discard;
            gl_FragColor = vec4(vColor * (0.85 + vBig*0.6), a);
          }`}
      />
    </points>
  )
}

/** A slow-drifting nebula painted on the inside of a vast sphere. */
export function Nebula() {
  const mat = useRef()
  useFrame((_, dt) => {
    if (mat.current) mat.current.uniforms.uTime.value += dt
  })
  return (
    <mesh scale={260} frustumCulled={false}>
      <sphereGeometry args={[1, 48, 32]} />
      <shaderMaterial
        ref={mat}
        side={THREE.BackSide}
        depthWrite={false}
        uniforms={{ uTime: { value: 0 } }}
        vertexShader={/* glsl */ `
          varying vec3 vDir;
          void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`}
        fragmentShader={/* glsl */ `
          ${NOISE}
          uniform float uTime; varying vec3 vDir;
          void main(){
            vec3 d = vDir;
            float t = uTime * 0.008;
            float n1 = fbm(d * 2.2 + vec3(t, -t*0.6, t*0.3));
            float n2 = fbm(d * 4.5 - vec3(t*0.7, t, 0.0) + n1);
            float band = exp(-pow((d.y - 0.05 + n1*0.15) * 3.2, 2.0));
            vec3 base = vec3(0.0012, 0.0014, 0.004);
            vec3 violet = vec3(0.016, 0.008, 0.038);
            vec3 blue = vec3(0.004, 0.012, 0.03);
            vec3 gold = vec3(0.04, 0.024, 0.008);
            vec3 col = base;
            col += violet * smoothstep(-0.1, 0.8, n1) * pow(smoothstep(-0.2, 0.9, n2), 1.5);
            col += blue * smoothstep(0.1, 0.9, n2) * 0.9;
            col += gold * band * smoothstep(0.2, 1.0, n2) * 0.6;
            col += vec3(0.006,0.005,0.01) * band;
            gl_FragColor = vec4(col, 1.0);
          }`}
      />
    </mesh>
  )
}

const X_AXIS = new THREE.Vector3(1, 0, 0)

/** Occasional shooting stars streaking across the sky. */
export function ShootingStars() {
  const group = useRef()
  const stars = useMemo(
    () =>
      Array.from({ length: 3 }, () => ({ t: -Math.random() * 8, dur: 1.2, from: new THREE.Vector3(), dir: new THREE.Vector3() })),
    [],
  )
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0, -1, 0, 0]), 3))
    g.setAttribute('aT', new THREE.BufferAttribute(new Float32Array([1, 0]), 1))
    return g
  }, [])
  const spawn = (s) => {
    const th = Math.random() * Math.PI * 2
    s.from.set(Math.cos(th) * 60, 18 + Math.random() * 30, Math.sin(th) * 60 - 20)
    s.dir.set(-Math.cos(th) * 0.6 + (Math.random() - 0.5), -0.35 - Math.random() * 0.3, -Math.sin(th) * 0.6).normalize()
    s.t = 0
    s.dur = 0.9 + Math.random() * 0.8
  }
  useFrame((_, dt) => {
    if (!group.current) return
    stars.forEach((s, i) => {
      const line = group.current.children[i]
      const before = s.t
      s.t += dt
      if (s.t < 0) { line.visible = false; return }
      if (before < 0) spawn(s)
      const k = s.t / s.dur
      if (k > 1) { s.t = -4 - Math.random() * 10; line.visible = false; return }
      line.visible = true
      line.position.copy(s.from).addScaledVector(s.dir, k * 40)
      line.quaternion.setFromUnitVectors(X_AXIS, s.dir)
      line.scale.setScalar(6 + 4 * Math.sin(k * Math.PI))
      line.material.uniforms.opacity.value = Math.sin(k * Math.PI)
    })
  })
  return (
    <group ref={group}>
      {stars.map((_, i) => (
        <line key={i} geometry={geo} visible={false}>
          <shaderMaterial
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            uniforms={{ opacity: { value: 0 } }}
            vertexShader={`attribute float aT; varying float vT; void main(){ vT=aT; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`}
            fragmentShader={`uniform float opacity; varying float vT; void main(){ gl_FragColor=vec4(vec3(1.0,0.93,0.78)*1.6, vT*vT*opacity); }`}
          />
        </line>
      ))}
    </group>
  )
}
