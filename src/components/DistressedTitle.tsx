interface DistressedTitleProps {
  text: string
  /** Distinguishes the SVG filter ids when several instances are on the page. */
  uid: string
  className?: string
  /** Adds the scratch strokes that streak off the wordmark. */
  scratches?: boolean
}

/**
 * The wordmark, eaten away by noise.
 *
 * The letters are SVG text run through a filter chain: high-frequency
 * turbulence is composited OUT of the glyphs to chew holes in them, then a
 * low-frequency turbulence displaces the whole thing so the edges crack and
 * wander instead of staying geometric.
 */
export function DistressedTitle({ text, uid, className = '', scratches = false }: DistressedTitleProps) {
  const eat = `eat-${uid}`
  const chain = `distress-${uid}`

  return (
    <svg
      className={`distressed ${className}`.trim()}
      viewBox="0 0 1000 230"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={text}
    >
      <defs>
        <filter id={chain} x="-15%" y="-35%" width="130%" height="170%">
          {/* Chunk mask — coarse noise, mostly transparent, so the letters stay
              solid and lose occasional bites rather than turning into static. */}
          <feTurbulence type="fractalNoise" baseFrequency="0.05 0.09" numOctaves="4" seed="19" result="chunks" />
          <feColorMatrix
            in="chunks"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  5 0 0 0 -3.35"
            result="chunkMask"
          />
          <feComposite in="SourceGraphic" in2="chunkMask" operator="out" result="bitten" />

          {/* Fine weathering — light, partial alpha only, for grain at the edges. */}
          <feTurbulence type="fractalNoise" baseFrequency="0.4 0.55" numOctaves="2" seed="7" result="wear" />
          <feColorMatrix
            in="wear"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.2 0 0 0 -1.5"
            result="wearMask"
          />
          <feComposite in="bitten" in2="wearMask" operator="out" result="eroded" />

          {/* Vertical splinters — noise stretched on Y so gaps run down the
              strokes like scratches rather than sitting as round holes. */}
          <feTurbulence type="fractalNoise" baseFrequency="0.5 0.012" numOctaves="2" seed="41" result="splinter" />
          <feColorMatrix
            in="splinter"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  6 0 0 0 -4.1"
            result="splinterMask"
          />
          <feComposite in="eroded" in2="splinterMask" operator="out" result="splintered" />

          {/* Warp the survivors so no edge stays straight. */}
          <feTurbulence type="fractalNoise" baseFrequency="0.009 0.02" numOctaves="2" seed="3" result="warp" />
          <feDisplacementMap
            in="splintered"
            in2="warp"
            scale="7"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        <filter id={eat} x="-20%" y="-60%" width="140%" height="220%">
          <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="13" result="w" />
          <feDisplacementMap in="SourceGraphic" in2="w" scale="12" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>

      {scratches && (
        <g filter={`url(#${eat})`} className="distressed__scratches">
          <path d="M40 60 L300 96" />
          <path d="M60 150 L250 132" />
          <path d="M700 46 L980 74" />
          <path d="M760 186 L990 150" />
          <path d="M120 196 L520 206" />
          <path d="M330 30 L690 22" />
          <path d="M20 108 L150 118" />
          <path d="M860 120 L1000 108" />
        </g>
      )}

      <text
        x="500"
        y="160"
        textAnchor="middle"
        className="distressed__text"
        filter={`url(#${chain})`}
      >
        {text}
      </text>
    </svg>
  )
}
