import { ArrowIcon } from './icons'

interface GenerateBarProps {
  onClick: () => void
  disabled?: boolean
  busy?: boolean
}

export function GenerateBar({ onClick, disabled, busy }: GenerateBarProps) {
  return (
    <div className="generate">
      <button
        type="button"
        className={`generate__button ${busy ? 'generate__button--busy' : ''}`}
        onClick={onClick}
        disabled={disabled}
      >
        <span className="generate__label">
          {busy ? 'GENERATING' : 'GENERATE SONG'}
          <ArrowIcon className="generate__arrow" />
        </span>
      </button>
      <p className="generate__tagline">YOUR WORDS. THEIR SOUND.</p>
    </div>
  )
}
