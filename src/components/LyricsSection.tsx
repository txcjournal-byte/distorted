export const LYRICS_LIMIT = 5000

const STRUCTURE = `[Intro]

[Hook]


[Verse]


[Hook]


[Verse]


[Hook]

[Outro]
`

interface LyricsSectionProps {
  value: string
  onChange: (value: string) => void
  instrumental: boolean
  onInstrumentalChange: (value: boolean) => void
  disabled?: boolean
}

export function LyricsSection({ value, onChange, instrumental, onInstrumentalChange, disabled }: LyricsSectionProps) {
  return (
    <section className="lyrics">
      <div className="lyrics__head">
        <h2 className="section-title">YOUR LYRICS</h2>
        <div className="lyrics__tools">
          <button
            type="button"
            className="ghost-button"
            disabled={disabled || value.trim() !== ''}
            onClick={() => onChange(STRUCTURE)}
            title="Insert section markers: [Hook], [Verse]..."
          >
            + STRUCTURE
          </button>
          <label className={`toggle ${instrumental ? 'toggle--on' : ''}`}>
            <input
              type="checkbox"
              checked={instrumental}
              disabled={disabled}
              onChange={(event) => onInstrumentalChange(event.target.checked)}
            />
            <span className="toggle__track" aria-hidden="true">
              <span className="toggle__thumb" />
            </span>
            INSTRUMENTAL
          </label>
        </div>
      </div>
      <div className="lyrics__box">
        <textarea
          id="lyrics"
          className="lyrics__field"
          value={value}
          disabled={disabled}
          spellCheck={false}
          maxLength={LYRICS_LIMIT}
          placeholder={
            instrumental
              ? 'Instrumental — lyrics are optional. Section markers like [Hook] still shape the beat.'
              : 'Paste your lyrics here... Use [Hook] / [Verse] markers to shape the song.'
          }
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
