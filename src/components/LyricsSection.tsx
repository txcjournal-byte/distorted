export const LYRICS_LIMIT = 5000

interface LyricsSectionProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function LyricsSection({ value, onChange, disabled }: LyricsSectionProps) {
  return (
    <section className="lyrics">
      <h2 className="section-title">YOUR LYRICS</h2>
      <div className="lyrics__box">
        <textarea
          id="lyrics"
          className="lyrics__field"
          value={value}
          disabled={disabled}
          spellCheck={false}
          maxLength={LYRICS_LIMIT}
          placeholder="Paste your lyrics here..."
          aria-label="Your lyrics"
          onChange={(event) => onChange(event.target.value.slice(0, LYRICS_LIMIT))}
        />
        <span className="lyrics__count">
          {value.length} / {LYRICS_LIMIT}
        </span>
      </div>
    </section>
  )
}
