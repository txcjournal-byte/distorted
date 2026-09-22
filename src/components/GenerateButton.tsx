import { GlitchText } from './GlitchText'

interface GenerateButtonProps {
  onClick: () => void
  disabled?: boolean
  busy?: boolean
}

export function GenerateButton({ onClick, disabled, busy }: GenerateButtonProps) {
  return (
    <button
      type="button"
      className={`generate ${busy ? 'generate--busy' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="generate__noise" aria-hidden="true" />
      <GlitchText text={busy ? 'GENERATING' : 'GENERATE SONG'} active={busy} />
    </button>
  )
}
