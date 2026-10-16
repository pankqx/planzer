import { mod12, yearOf, monthOf } from '../lib/theme'
import { daysIn } from '../lib/date'

const ORIGIN = 2000 * 12 // keeps pixel numbers small and positive-ish
const floorDiv = (a, b) => Math.floor(a / b)
// how many Januaries lie in [a, b)
const janIn = (a, b) => (b >= a ? floorDiv(b - 1, 12) - floorDiv(a - 1, 12) : -(floorDiv(a - 1, 12) - floorDiv(b - 1, 12)))
const dayNum = (abs) => Date.UTC(yearOf(abs), monthOf(abs), 1) / 864e5

function search(posOf, X, guess) {
  let k = guess
  let n = 0
  while (posOf(k) > X && n++ < 400) k--
  while (posOf(k + 1) <= X && n++ < 800) k++
  return k
}

/** Year level: one card per month, with a wide year marker before every January. */
export function yearLayout(vw, vh) {
  const mobile = vw < 700
  const cardW = mobile ? Math.round(vw * 0.62) : Math.round(Math.min(380, Math.max(270, vw * 0.235)))
  const gapW = mobile ? Math.round(vw * 0.5) : Math.round(cardW * 0.82)
  const posOf = (k) => (k - ORIGIN) * cardW + gapW * janIn(ORIGIN, k)
  const widthOf = (k) => cardW + (mod12(k) === 0 ? gapW : 0)
  const avg = cardW + gapW / 12
  return {
    kind: 'year',
    cardW,
    gapW,
    vw,
    vh,
    posOf,
    widthOf,
    segAt: (X) => search(posOf, X, ORIGIN + Math.floor(X / avg)),
    // left edge of the card itself (after any year marker)
    cardLeft: (k) => posOf(k) + (mod12(k) === 0 ? gapW : 0),
  }
}

/** Month level: a full poster for the month, followed by one card per day. */
export function monthLayout(vw, vh) {
  const mobile = vw < 700
  const posterW = mobile ? vw : Math.round(Math.min(vw * 0.92, 1240))
  const dayW = mobile ? Math.round(vw * 0.74) : Math.round(Math.min(330, Math.max(250, vw * 0.21)))
  const origin0 = dayNum(ORIGIN)
  const posOf = (k) => (k - ORIGIN) * posterW + (dayNum(k) - origin0) * dayW
  const widthOf = (k) => posterW + daysIn(yearOf(k), monthOf(k)) * dayW
  const avg = posterW + 30.44 * dayW
  return {
    kind: 'month',
    posterW,
    dayW,
    vw,
    vh,
    posOf,
    widthOf,
    segAt: (X) => search(posOf, X, ORIGIN + Math.floor(X / avg)),
    dayLeft: (k, d) => posOf(k) + posterW + (d - 1) * dayW,
  }
}
