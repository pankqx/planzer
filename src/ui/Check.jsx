// A big, friendly checkbox. Ticking it bursts a little ring of confetti.
export default function Check({ checked, onChange, label, color }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      className={`check ${checked ? 'on' : ''}`}
      style={color ? { '--c': color } : undefined}
      onClick={(e) => {
        e.stopPropagation()
        onChange()
      }}
    >
      <svg viewBox="0 0 24 24" aria-hidden>
        <path d="M5 12.5l4.2 4.2L19 7" />
      </svg>
      {checked && (
        <span className="burst" aria-hidden>
          {Array.from({ length: 8 }, (_, i) => (
            <i key={i} style={{ '--a': `${i * 45}deg` }} />
          ))}
        </span>
      )}
    </button>
  )
}
