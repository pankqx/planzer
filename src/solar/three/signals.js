// Mutable animation signals shared between DOM timelines (GSAP) and the render loop.
// Kept outside React so tweening them never triggers a re-render.
export const sig = {
  converge: 0, // intro: scattered dust → logo constellation
  draw: 0, // intro: hairline strokes drawing the mark
  glint: 0, // intro: flare across the mark
  burst: 0, // intro exit: constellation explodes into the sky
  orrery: 0, // orrery presence 0..1
  warp: 0, // star streaking during camera flights
  pointer: { x: 0, y: 0 },
  spin: 0, // user-driven orrery rotation
  spinVel: 0,
  dragged: false,
}

if (typeof window !== 'undefined' && location.search.includes('debug')) window.__sig = sig
