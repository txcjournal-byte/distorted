import { STAGE_LABELS, type GenerationStage } from '../generation/engine'

const ORDER: GenerationStage[] = [
  'parsing-lyrics',
  'loading-style-dna',
  'arranging',
  'rendering',
  'mastering',
]

interface GenerationConsoleProps {
  stage: GenerationStage
  take: number
  takes: number
  onCancel: () => void
}

export function GenerationConsole({ stage, take, takes, onCancel }: GenerationConsoleProps) {
  const currentIndex = ORDER.indexOf(stage)

  return (
    <div className="console" role="status" aria-live="polite">
      <div className="console__head">
        <span>
          TAKE {take} / {takes}
        </span>
        <button type="button" className="console__cancel" onClick={onCancel}>
          CANCEL
        </button>
      </div>
      {ORDER.map((item, index) => {
        const done = stage === 'done' || (currentIndex > -1 && index < currentIndex)
        const active = item === stage
        return (
          <div
            key={item}
            className={`console__row ${active ? 'console__row--active' : ''} ${
              done ? 'console__row--done' : ''
            }`}
          >
            <span className="console__marker">{done ? '[ok]' : active ? '[..]' : '[  ]'}</span>
            <span className="console__label">{STAGE_LABELS[item]}</span>
          </div>
        )
      })}
    </div>
  )
}
