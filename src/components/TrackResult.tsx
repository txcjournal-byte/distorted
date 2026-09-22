import type { GeneratedTrack } from '../generation/engine'
import { GlitchText } from './GlitchText'

interface TrackResultProps {
  track: GeneratedTrack
  onReset: () => void
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function TrackResult({ track, onReset }: TrackResultProps) {
  return (
    <section className="result">
      <header className="result__head">
        <div>
          <p className="result__kicker">MOCK RENDER — NO AUDIO</p>
          <GlitchText className="result__title" text={track.title} />
          <p className="result__artist">IN THE STYLE OF {track.artistName}</p>
        </div>
        <button type="button" className="ghost-button" onClick={onReset}>
          NEW TAKE
        </button>
      </header>

      <div className="waveform" aria-hidden="true">
        {track.waveform.map((value, index) => (
          <span key={index} className="waveform__bar" style={{ height: `${value * 100}%` }} />
        ))}
      </div>

      <dl className="result__specs">
        <div>
          <dt>LENGTH</dt>
          <dd>{formatDuration(track.durationSeconds)}</dd>
        </div>
        <div>
          <dt>TEMPO</dt>
          <dd>{track.tempo} BPM</dd>
        </div>
        <div>
          <dt>KEY</dt>
          <dd>{track.key.toUpperCase()}</dd>
        </div>
        <div>
          <dt>ID</dt>
          <dd>{track.id}</dd>
        </div>
      </dl>

      <div className="result__sections">
        {track.sections.map((section) => (
          <span key={`${section.label}-${section.startSeconds}`} className="tag tag--section">
            {formatDuration(section.startSeconds)} {section.label}
          </span>
        ))}
      </div>

      <p className="result__note">
        Playback is stubbed. A real music model gets wired to this flow in the next phase.
      </p>
    </section>
  )
}
