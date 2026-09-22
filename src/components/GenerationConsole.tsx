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
}

export function GenerationConsole({ stage }: GenerationConsoleProps) {
  const currentIndex = ORDER.indexOf(stage)

  return (
    <div className="console" role="status" aria-live="polite">
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
