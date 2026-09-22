interface GlitchTextProps {
  text: string
  className?: string
  /** Adds the permanent RGB-split animation instead of hover-only. */
  active?: boolean
}

export function GlitchText({ text, className = '', active = false }: GlitchTextProps) {
  return (
    <span
      className={`glitch ${active ? 'glitch--active' : ''} ${className}`.trim()}
      data-text={text}
    >
      {text}
    </span>
  )
}
