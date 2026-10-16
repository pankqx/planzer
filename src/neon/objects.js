import * as THREE from 'three'

/*
 * Twelve neon sculptures, one per month. Each is a matte black body traced with
 * glowing edges in the month's colour (the bloom pass turns those edges into light).
 * Everything is sized to fit a unit sphere so the stage can scale it to any slot.
 */

const bodyMat = (color) =>
  new THREE.MeshStandardMaterial({ color: '#0d0d10', roughness: 0.42, metalness: 0.55, emissive: new THREE.Color(color), emissiveIntensity: 0.07 })
const glowMat = (color, k = 2.6) => new THREE.LineBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), toneMapped: false })
const solidGlow = (color, k = 2.2) => new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), toneMapped: false })

function piece(geo, color, { edges = true, angle = 24, body = true } = {}) {
  const g = new THREE.Group()
  if (body) g.add(new THREE.Mesh(geo, bodyMat(color)))
  if (edges) g.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, angle), glowMat(color)))
  return g
}
function at(obj, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1) {
  obj.position.set(x, y, z)
  obj.rotation.set(rx, ry, rz)
  obj.scale.setScalar(s)
  return obj
}
const extrude = (shape, depth = 0.22, bevel = 0.04) =>
  new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 18 }).center()

// ——— the sculptures ———
function snowflake(c) {
  const g = new THREE.Group()
  g.add(piece(new THREE.IcosahedronGeometry(0.2, 0), c))
  for (let i = 0; i < 6; i++) {
    const arm = new THREE.Group()
    arm.add(at(piece(new THREE.BoxGeometry(0.07, 0.82, 0.07), c), 0, 0.5))
    for (const [y, l] of [[0.45, 0.32], [0.7, 0.22]]) {
      arm.add(at(piece(new THREE.BoxGeometry(0.05, l, 0.05), c), 0.09, y + 0.07, 0, 0, 0, -0.8))
      arm.add(at(piece(new THREE.BoxGeometry(0.05, l, 0.05), c), -0.09, y + 0.07, 0, 0, 0, 0.8))
    }
    arm.rotation.z = (i * Math.PI) / 3
    g.add(arm)
  }
  return g
}
function heart(c) {
  const s = new THREE.Shape()
  s.moveTo(0, -0.62)
  s.bezierCurveTo(-0.9, -0.05, -0.62, 0.62, 0, 0.3)
  s.bezierCurveTo(0.62, 0.62, 0.9, -0.05, 0, -0.62)
  const g = new THREE.Group()
  g.add(piece(extrude(s, 0.32, 0.08), c, { angle: 30 }))
  g.scale.setScalar(1.25)
  return g
}
function bloom(c) {
  const g = new THREE.Group()
  g.add(piece(new THREE.IcosahedronGeometry(0.22, 1), c))
  for (let i = 0; i < 8; i++) {
    const petal = piece(new THREE.SphereGeometry(0.22, 10, 8).scale(0.75, 1.6, 0.35), c, { angle: 40 })
    const a = (i / 8) * Math.PI * 2
    at(petal, Math.cos(a) * 0.48, Math.sin(a) * 0.48, 0, 0, 0, a - Math.PI / 2)
    g.add(petal)
  }
  return g
}
function icecream(c) {
  const g = new THREE.Group()
  g.add(at(piece(new THREE.ConeGeometry(0.34, 0.95, 10, 3, true), c), 0, -0.4, 0, Math.PI))
  g.add(at(piece(new THREE.IcosahedronGeometry(0.34, 1), c), 0, 0.18))
  g.add(at(piece(new THREE.IcosahedronGeometry(0.28, 1), c), 0.04, 0.58))
  g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), solidGlow(c, 3)), 0.06, 0.92))
  return g
}
function sun(c) {
  const g = new THREE.Group()
  g.add(piece(new THREE.IcosahedronGeometry(0.42, 1), c))
  const rays = new THREE.Group()
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    rays.add(at(piece(new THREE.ConeGeometry(0.08, 0.32, 4), c), Math.cos(a) * 0.7, Math.sin(a) * 0.7, 0, 0, 0, a - Math.PI / 2))
  }
  g.add(rays)
  g.userData.tick = (t) => {
    rays.rotation.z = t * 0.4
    rays.scale.setScalar(1 + Math.sin(t * 2) * 0.05)
  }
  return g
}
function umbrella(c) {
  const g = new THREE.Group()
  g.add(at(piece(new THREE.SphereGeometry(0.85, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), c, { angle: 10 }), 0, 0.18))
  g.add(at(piece(new THREE.CylinderGeometry(0.03, 0.03, 1.1, 6), c), 0, -0.36))
  g.add(at(piece(new THREE.TorusGeometry(0.14, 0.03, 6, 16, Math.PI), c), 0.14, -0.9, 0, 0, 0, Math.PI))
  return g
}
function cloud(c) {
  const g = new THREE.Group()
  for (const [x, y, r] of [[-0.42, -0.05, 0.3], [-0.1, 0.12, 0.4], [0.3, 0.02, 0.33], [0.6, -0.1, 0.22]]) g.add(at(piece(new THREE.IcosahedronGeometry(r, 1), c), x, y + 0.25))
  const drops = []
  for (let i = 0; i < 6; i++) {
    const d = new THREE.Mesh(new THREE.CapsuleGeometry(0.025, 0.14, 4, 8), solidGlow(c, 3))
    d.userData.x = -0.5 + i * 0.2
    d.userData.o = i * 0.37
    drops.push(d)
    g.add(d)
  }
  g.userData.tick = (t) => {
    for (const d of drops) {
      const k = (t * 0.9 + d.userData.o) % 1
      d.position.set(d.userData.x, -0.1 - k * 0.9, 0)
      d.scale.setScalar(1 - k * 0.6)
    }
  }
  g.userData.noSpin = true
  return g
}
function kite(c) {
  const g = new THREE.Group()
  const s = new THREE.Shape()
  s.moveTo(0, 0.75)
  s.lineTo(0.5, 0.05)
  s.lineTo(0, -0.7)
  s.lineTo(-0.5, 0.05)
  s.closePath()
  g.add(piece(extrude(s, 0.04, 0.02), c, { angle: 20 }))
  g.add(at(piece(new THREE.BoxGeometry(0.03, 1.4, 0.03), c), 0, 0.02, 0.05))
  g.add(at(piece(new THREE.BoxGeometry(0.98, 0.03, 0.03), c), 0, 0.05, 0.05))
  const tail = []
  for (let i = 0; i < 5; i++) {
    const b = new THREE.Mesh(new THREE.OctahedronGeometry(0.06, 0), solidGlow(c, 2.6))
    tail.push(b)
    g.add(b)
  }
  g.userData.tick = (t) => {
    tail.forEach((b, i) => {
      b.position.set(Math.sin(t * 3 + i * 0.9) * 0.12 * (i + 1) * 0.5, -0.8 - i * 0.16, 0)
      b.rotation.z = t * 2 + i
    })
    g.rotation.z = Math.sin(t * 1.3) * 0.18
  }
  return g
}
function leaf(c) {
  const s = new THREE.Shape()
  s.moveTo(0, -0.8)
  s.quadraticCurveTo(0.62, -0.1, 0, 0.8)
  s.quadraticCurveTo(-0.62, -0.1, 0, -0.8)
  const g = new THREE.Group()
  g.add(piece(extrude(s, 0.05, 0.02), c, { angle: 30 }))
  g.add(at(piece(new THREE.BoxGeometry(0.025, 1.7, 0.03), c), 0, -0.1, 0.04))
  for (let i = 0; i < 4; i++) {
    g.add(at(piece(new THREE.BoxGeometry(0.02, 0.32, 0.02), c), 0.1, -0.35 + i * 0.28, 0.04, 0, 0, -0.9))
    g.add(at(piece(new THREE.BoxGeometry(0.02, 0.32, 0.02), c), -0.1, -0.35 + i * 0.28, 0.04, 0, 0, 0.9))
  }
  g.rotation.z = 0.5
  return g
}
function diya(c) {
  const g = new THREE.Group()
  const prof = [[0, -0.3], [0.3, -0.28], [0.62, -0.08], [0.78, 0.1], [0.7, 0.12], [0.45, -0.04], [0, -0.1]].map(([x, y]) => new THREE.Vector2(x, y))
  g.add(at(piece(new THREE.LatheGeometry(prof, 14), c, { angle: 15 }), 0, -0.25))
  const flame = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.14, 0.12], [0.11, 0.3], [0, 0.55]].map(([x, y]) => new THREE.Vector2(x, y)), 16), solidGlow('#ffd36b', 3.2))
  flame.position.set(0.48, -0.05, 0)
  g.add(flame)
  const light = new THREE.PointLight(c, 2, 3)
  light.position.set(0.48, 0.3, 0.2)
  g.add(light)
  g.userData.tick = (t) => {
    const f = 1 + Math.sin(t * 13) * 0.08 + Math.sin(t * 7.3) * 0.06
    flame.scale.set(1 / f, f, 1 / f)
    flame.rotation.z = Math.sin(t * 5) * 0.08
  }
  return g
}
function lantern(c) {
  const s = new THREE.Shape()
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 2 + (i * Math.PI) / 5
    const r = i % 2 ? 0.34 : 0.8
    i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r)
  }
  s.closePath()
  const g = new THREE.Group()
  g.add(piece(extrude(s, 0.36, 0.05), c, { angle: 20 }))
  g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16), solidGlow(c, 3)), 0, 0, 0))
  for (let i = -1; i <= 1; i++) g.add(at(piece(new THREE.CylinderGeometry(0.015, 0.015, 0.5, 4), c), i * 0.12, -1.0))
  g.add(at(piece(new THREE.CylinderGeometry(0.012, 0.012, 0.6, 4), c), 0, 1.05))
  return g
}
function gift(c) {
  const g = new THREE.Group()
  g.add(at(piece(new THREE.BoxGeometry(0.95, 0.8, 0.95), c), 0, -0.25))
  g.add(at(piece(new THREE.BoxGeometry(1.08, 0.2, 1.08), c), 0, 0.25))
  g.add(at(piece(new THREE.BoxGeometry(0.14, 1.02, 0.98), c), 0, -0.12))
  g.add(at(piece(new THREE.BoxGeometry(0.98, 1.02, 0.14), c), 0, -0.12))
  g.add(at(piece(new THREE.TorusGeometry(0.2, 0.05, 8, 20), c), -0.18, 0.48, 0, 0, 0, 0.6))
  g.add(at(piece(new THREE.TorusGeometry(0.2, 0.05, 8, 20), c), 0.18, 0.48, 0, 0, 0, -0.6))
  return g
}

const BUILDERS = [snowflake, heart, bloom, icecream, sun, umbrella, cloud, kite, leaf, diya, lantern, gift]

export function makeObject(m, color) {
  const g = BUILDERS[m](color)
  const wrap = new THREE.Group()
  wrap.add(g)
  wrap.userData.inner = g
  return wrap
}
