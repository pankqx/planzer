// Month colours for both worlds.

// NEON — one electric colour per month, chosen so neighbours never blur together.
export const NEON = [
  '#3DF5FF', // Jan — ice cyan
  '#FF3D8B', // Feb — hot pink
  '#B8FF3D', // Mar — Holi lime
  '#FFE53D', // Apr — mango yellow
  '#FF8A1F', // May — sun orange
  '#2DFFB3', // Jun — monsoon mint
  '#4D7CFF', // Jul — rain blue
  '#FF5A4E', // Aug — kite red
  '#A66BFF', // Sep — violet
  '#FFB020', // Oct — diya saffron
  '#FF5CF0', // Nov — lantern magenta
  '#9EE8FF', // Dec — frost white-blue
]

export const NEON_NAMES = ['Snowflake', 'Heart', 'Bloom', 'Ice cream', 'Sun', 'Umbrella', 'Rain cloud', 'Kite', 'Leaf', 'Diya', 'Star lantern', 'Gift']

// PAPER — coloured card stock for each month's pop-up scene.
// sky · far hills · mid hills · near hills · accent · ink (text on this month)
export const PAPER = [
  { sky: '#dbe8f0', far: '#b9cfdf', mid: '#e9f1f6', near: '#ffffff', accent: '#3d6f9a', ink: '#23415c', name: 'Snow hills' },
  { sky: '#f7dfe2', far: '#eeb7c1', mid: '#e48f9f', near: '#cf6680', accent: '#c2334f', ink: '#5b1f2c', name: 'Blossom' },
  { sky: '#f4ecd6', far: '#cfe3a0', mid: '#a6cf6a', near: '#79b04a', accent: '#e8458b', ink: '#33461f', name: 'Holi fields' },
  { sky: '#fbeec2', far: '#f6d77a', mid: '#e9b949', near: '#8fae45', accent: '#e8812a', ink: '#4d3a12', name: 'Mango grove' },
  { sky: '#ffe3c0', far: '#ffc78a', mid: '#4fb3bf', near: '#2a8c9c', accent: '#f26b2a', ink: '#5a2c10', name: 'Summer coast' },
  { sky: '#d9dfdc', far: '#9fb7ad', mid: '#6f9a83', near: '#3f7656', accent: '#2e6b8f', ink: '#1f3a2c', name: 'Monsoon' },
  { sky: '#cfe0dc', far: '#8fc0a3', mid: '#57a173', near: '#2f7d4f', accent: '#f2b632', ink: '#173a25', name: 'Rain garden' },
  { sky: '#dff0f7', far: '#a7d8b5', mid: '#7cc191', near: '#4e9f68', accent: '#f0662f', ink: '#1e3d2a', name: 'Kite sky' },
  { sky: '#fff1d6', far: '#f8d68b', mid: '#e7b54d', near: '#c98a2b', accent: '#d6336c', ink: '#4a300c', name: 'Harvest' },
  { sky: '#3b2a52', far: '#5a3b6e', mid: '#7a3f5c', near: '#9c3e3e', accent: '#ffb627', ink: '#fff1d6', name: 'Festival dusk', dark: true },
  { sky: '#2a3158', far: '#45407a', mid: '#6b4d8f', near: '#8f5aa0', accent: '#ffc94a', ink: '#fff4dc', name: 'Lantern night', dark: true },
  { sky: '#1f3550', far: '#36557a', mid: '#dfe9f2', near: '#ffffff', accent: '#e0464a', ink: '#f4f8fb', name: 'Winter night', dark: true },
]

export function mix(a, b, t) {
  const pa = parseInt(a.slice(1), 16)
  const pb = parseInt(b.slice(1), 16)
  const r = Math.round(((pa >> 16) & 255) * (1 - t) + ((pb >> 16) & 255) * t)
  const g = Math.round(((pa >> 8) & 255) * (1 - t) + ((pb >> 8) & 255) * t)
  const bl = Math.round((pa & 255) * (1 - t) + (pb & 255) * t)
  return `#${((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1)}`
}

export const mod12 = (k) => ((k % 12) + 12) % 12
export const yearOf = (abs) => Math.floor(abs / 12)
export const monthOf = (abs) => mod12(abs)
export const absOf = (y, m) => y * 12 + m

export const monthColor = (theme, m) => (theme === 'neon' ? NEON[mod12(m)] : PAPER[mod12(m)].accent)
