import { useState } from 'react'
import { getAccessCode, setAccessCode } from '../generation/access'
import type { EngineInfo } from '../generation/engine'
import { ArrowIcon } from './icons'

interface GenerateBarProps {
  onClick: () => void
  disabled?: boolean
  busy?: boolean
  engine: EngineInfo | null
  takes: number
}

function engineLabel(engine: EngineInfo, takes: number): string {
  const count = `${takes} TAKES PER GENERATION`
  if (engine.vocals) return `REAL GENERATION · YOUR LYRICS WILL BE SUNG · ${count}`
  if (engine.audio) return `LOCAL RENDER · INSTRUMENTAL, NO VOCALS · ${count}`
  return 'MOCK ENGINE · NO AUDIO'
}

export function GenerateBar({ onClick, disabled, busy, engine, takes }: GenerateBarProps) {
  const [code, setCode] = useState(getAccessCode)
  const locked = Boolean(engine?.accessRequired) && code.trim() === ''

  return (
    <div className="generate">
      {engine?.accessRequired && (
        <label className="access">
          <span className="access__label">ACCESS CODE</span>
          <input
            id="access-code"
            className="access__input"
            type="password"
            autoComplete="off"
            value={code}
            placeholder="Enter your code"
            onChange={(event) => {
              setCode(event.target.value)
              setAccessCode(event.target.value)
            }}
          />
        </label>
      )}
      <button
        type="button"
        className={`generate__button ${busy ? 'generate__button--busy' : ''}`}
        onClick={onClick}
        disabled={disabled || locked}
      >
        <span className="generate__label">
          {busy ? 'GENERATING' : 'GENERATE SONG'}
          <ArrowIcon className="generate__arrow" />
        </span>
      </button>
      <p className="generate__tagline">YOUR WORDS. REAL TRAP.</p>
      {engine && (
        <p className={`generate__engine ${engine.vocals ? 'generate__engine--live' : ''}`}>
          {engineLabel(engine, takes)}
        </p>
      )}
    </div>
  )
}
