import type { EngineInfo } from '../generation/engine'
import { ArrowIcon } from './icons'

interface GenerateBarProps {
  onClick: () => void
  disabled?: boolean
  busy?: boolean
  engine: EngineInfo | null
}

function engineLabel(engine: EngineInfo): string {
  if (engine.vocals) return 'REAL GENERATION · YOUR LYRICS WILL BE SUNG'
  if (engine.audio) return 'LOCAL RENDER · INSTRUMENTAL, NO VOCALS'
  return 'MOCK ENGINE · NO AUDIO'
}

export function GenerateBar({ onClick, disabled, busy, engine }: GenerateBarProps) {
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
      {engine && (
        <p className={`generate__engine ${engine.vocals ? 'generate__engine--live' : ''}`}>
          {engineLabel(engine)}
        </p>
      )}
    </div>
  )
}
