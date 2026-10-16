import { create } from 'zustand'

// Live scroll state, written by the active ribbon every frame and read by the scrubber,
// the 3D stage and the colour engine. Plain object — never triggers React renders.
export const live = {
  level: 'month',
  center: 0, // absolute month index + fraction at the viewport centre
  vel: 0, // px/s
}

// Imperative handles registered by the mounted ribbon.
export const nav = {
  ribbon: null, // { goToMonth(abs, day?), step(dir), stepMonth(dir) }
}

// Which 3D art slots are on screen (neon theme renders one object per slot).
export const useSlots = create((set) => ({
  slots: {},
  setSlots: (owner, list) => set((s) => ({ slots: { ...s.slots, [owner]: list } })),
}))

if (typeof window !== 'undefined' && location.search.includes('debug')) Object.assign(window, { __nav: nav, __live: live })
