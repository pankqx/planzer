import { motion, AnimatePresence } from 'framer-motion'

export const ease = [0.22, 1, 0.36, 1]

/** A checkbox that ignites into a four-point star. */
export function StarCheck({ checked, onChange, color = '#e6c98a', size = 22, label }) {
  return (
    <button
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => (e.stopPropagation(), onChange())}
      style={{ position: 'relative', width: size, height: size, flex: 'none', display: 'grid', placeItems: 'center' }}
    >
      <motion.span
        animate={{ borderColor: checked ? color : 'rgba(230,201,138,.35)', scale: checked ? 1 : 1 }}
        style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid', boxShadow: checked ? `0 0 16px -2px ${color}` : 'none', transition: 'box-shadow .5s' }}
      />
      <AnimatePresence>
        {checked && (
          <motion.svg
            key="s"
            viewBox="-10 -10 20 20"
            width={size * 0.72}
            height={size * 0.72}
            initial={{ scale: 0, rotate: -90, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0, rotate: 90, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 18 }}
          >
            <path d="M0 -9 C1 -2 2 -1 9 0 C2 1 1 2 0 9 C-1 2 -2 1 -9 0 C-2 -1 -1 -2 0 -9Z" fill={color} />
          </motion.svg>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {checked && (
          <motion.span
            key="burst"
            initial={{ scale: 0.6, opacity: 0.9 }}
            animate={{ scale: 2.4, opacity: 0 }}
            transition={{ duration: 0.8, ease }}
            style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `1px solid ${color}`, pointerEvents: 'none' }}
          />
        )}
      </AnimatePresence>
    </button>
  )
}

/** Thin luminous progress ring with a moving comet head. */
export function Ring({ value = 0, size = 64, stroke = 2, color = '#e6c98a', children, track = 'rgba(230,201,138,.14)' }) {
  const r = (size - stroke * 4) / 2
  const c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(1, value))
  const a = -Math.PI / 2 + v * Math.PI * 2
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
      <svg width={size} height={size} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke * 0.6} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - v) }}
          transition={{ duration: 1.6, ease }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ filter: `drop-shadow(0 0 4px ${color})` }}
        />
        {v > 0.001 && (
          <motion.circle
            r={stroke * 1.4}
            fill="#fff4d6"
            initial={{ cx: size / 2, cy: size / 2 - r }}
            animate={{ cx: size / 2 + Math.cos(a) * r, cy: size / 2 + Math.sin(a) * r }}
            transition={{ duration: 1.6, ease }}
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        )}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>{children}</div>
    </div>
  )
}

/** Text that rises letter by letter out of blur. */
export function Rise({ text, delay = 0, stagger = 0.035, className, style, letterClass, as: Tag = 'span' }) {
  return (
    <Tag className={className} style={{ display: 'inline-block', ...style }} aria-label={text}>
      {text.split('').map((ch, i) => (
        <motion.span
          key={`${text}-${i}`}
          aria-hidden
          className={letterClass}
          initial={{ opacity: 0, y: '0.5em', filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1.1, ease, delay: delay + i * stagger }}
          style={{ display: 'inline-block', whiteSpace: 'pre' }}
        >
          {ch}
        </motion.span>
      ))}
    </Tag>
  )
}

export const panelIn = {
  initial: { opacity: 0, x: 40, filter: 'blur(14px)' },
  animate: { opacity: 1, x: 0, filter: 'blur(0px)', transition: { duration: 1.1, ease, delay: 0.25 } },
  exit: { opacity: 0, x: 30, filter: 'blur(10px)', transition: { duration: 0.5, ease } },
}
export const panelInLeft = {
  initial: { opacity: 0, x: -40, filter: 'blur(14px)' },
  animate: { opacity: 1, x: 0, filter: 'blur(0px)', transition: { duration: 1.1, ease, delay: 0.35 } },
  exit: { opacity: 0, x: -30, filter: 'blur(10px)', transition: { duration: 0.5, ease } },
}
export const stagger = (i, base = 0.4) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.9, ease, delay: base + i * 0.06 } },
})
