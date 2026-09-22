import { hash } from '../generation/random'

interface CoverArtProps {
  /** Anything stable per song; the same seed always draws the same cover. */
  seed: string
  className?: string
}

const HUES = ['#a855f7', '#c026d3', '#6d28d9', '#7c3aed', '#db2777', '#4f46e5']

/**
 * Generated cover art: a torn, glowing mark on concrete black. No image
 * files — every song gets its own from its id.
 */
export function CoverArt({ seed, className = '' }: CoverArtProps) {
  const h = hash(seed)
  const hue = HUES[h % HUES.length]
  const id = `cv-${h.toString(36)}`
  const rings = 2 + (h % 3)
  const tilt = (h >> 4) % 40
  const cx = 30 + ((h >> 7) % 40)
  const cy = 30 + ((h >> 11) % 40)

  return (
    <svg className={`cover ${className}`.trim()} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-g`} cx={`${cx}%`} cy={`${cy}%`} r="75%">
          <stop offset="0%" stopColor={hue} stopOpacity="0.95" />
          <stop offset="55%" stopColor="#1a1024" />
          <stop offset="100%" stopColor="#050506" />
        </radialGradient>
        <filter id={`${id}-f`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="3" seed={h % 97} />
          <feDisplacementMap in="SourceGraphic" scale="9" />
        </filter>
      </defs>
      <rect width="100" height="100" fill={`url(#${id}-g)`} />
      <g filter={`url(#${id}-f)`} transform={`rotate(${tilt} 50 50)`} fill="none" stroke="#f3f2f4">
        {Array.from({ length: rings }, (_, i) => (
          <circle key={i} cx={cx} cy={cy} r={12 + i * 11} strokeOpacity={0.5 - i * 0.12} strokeWidth={2.5 - i * 0.5} />
        ))}
        <path d={`M8 ${60 + (h % 20)} L92 ${30 + ((h >> 3) % 30)}`} strokeOpacity="0.35" strokeWidth="1.2" />
      </g>
    </svg>
  )
}
