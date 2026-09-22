interface LyricsInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

const PLACEHOLDER = `paste your lyrics here...

[hook]
...

[verse]
...`

export function LyricsInput({ value, onChange, disabled }: LyricsInputProps) {
  const lines = value.trim() === '' ? 0 : value.trim().split('\n').length
  const chars = value.length

  return (
    <div className="lyrics">
      <textarea
        id="lyrics"
        className="lyrics__field"
        value={value}
        disabled={disabled}
        spellCheck={false}
        placeholder={PLACEHOLDER}
        onChange={(event) => onChange(event.target.value)}
      />
      <div className="lyrics__meta">
        <span>{lines} LINES</span>
        <span className="lyrics__dot">/</span>
        <span>{chars} CHARS</span>
      </div>
    </div>
  )
}
