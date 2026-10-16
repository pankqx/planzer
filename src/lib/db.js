import { get, set, del, entries, createStore } from 'idb-keyval'

// Big things (day notebooks with photos, month cover pictures) live in IndexedDB,
// not localStorage, so a year of notes never hits the 5 MB browser limit.
const store = createStore('planzer', 'blobs')

export const getNote = (key) => get(`note:${key}`, store)
export const putNote = (key, doc) => set(`note:${key}`, doc, store)
export const dropNote = (key) => del(`note:${key}`, store)
export const getCover = (mk) => get(`cover:${mk}`, store)
export const putCover = (mk, url) => set(`cover:${mk}`, url, store)
export const dropCover = (mk) => del(`cover:${mk}`, store)

export async function dumpBlobs() {
  const all = await entries(store)
  return Object.fromEntries(all)
}
export async function loadBlobs(obj) {
  for (const [k, v] of Object.entries(obj || {})) await set(k, v, store)
}

/** Shrinks a photo to a sensible size and returns a JPEG data URL. */
export function compressImage(file, max = 1600, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * k)
      c.height = Math.round(img.height * k)
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(url)
      resolve(c.toDataURL('image/jpeg', quality))
    }
    img.onerror = (e) => (URL.revokeObjectURL(url), reject(e))
    img.src = url
  })
}
