interface ArtistPortraitProps {
  name: string
  /** Licensed image URL. Null renders the placeholder mark instead. */
  src: string | null
  className?: string
}

function hash(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

/**
 * Portrait slot. No artist photography ships with the prototype — until a
 * licensed image is supplied, each artist gets a deterministic placeholder mark
 * built from their name, so the grid keeps its rhythm without faking a likeness.
 */
export function ArtistPortrait({ name, src, className = '' }: ArtistPortraitProps) {
  if (src) {
    return <img className={`portrait ${className}`.trim()} src={src} alt="" loading="lazy" />
  }

  const seed = hash(name)
  const initials = name
    .split(/\s+/)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
  const tilt = (seed % 9) - 4
  const shift = (seed >> 3) % 14

  return (
    <div className={`portrait portrait--placeholder ${className}`.trim()} aria-hidden="true">
      <svg viewBox="0 0 120 160" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`pg-${seed}`} x1="0" y1="0" x2="0.6" y2="1">
            <stop offset="0%" stopColor="#3a2553" />
            <stop offset="55%" stopColor="#1a1522" />
            <stop offset="100%" stopColor="#050505" />
          </linearGradient>
        </defs>
        <rect width="120" height="160" fill={`url(#pg-${seed})`} />
        <g transform={`translate(${shift - 7} 0) rotate(${tilt} 60 96)`} opacity="0.62">
          <ellipse cx="60" cy="74" rx="27" ry="33" fill="#0b0b10" />
          <path d="M18 160c4-30 20-44 42-44s38 14 42 44z" fill="#0b0b10" />
        </g>
        <text
          x="60"
          y="104"
          textAnchor="middle"
          fill="#f2f2f0"
          opacity="0.2"
          fontSize="54"
          fontFamily="Anton, Impact, sans-serif"
        >
          {initials}
        </text>
      </svg>
    </div>
  )
}
