import { useEffect, useRef, useState } from 'react'
import type { GeneratedTrack } from '../generation/engine'
import { GlitchText } from './GlitchText'

interface TrackResultProps {
  track: GeneratedTrack
  onReset: () => void
}

function formatDuration(totalSeconds: number): string {
  const safe = Number.isFinite(totalSeconds) ? Math.max(0, Math.floor(totalSeconds)) : 0
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function TrackResult({ track, onReset }: TrackResultProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [position, setPosition] = useState(0)

  // A new track means a new element source; reset the transport.
  useEffect(() => {
    setPlaying(false)
    setPosition(0)
  }, [track.id, track.audio?.url])

  function togglePlay() {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      void audio.play().catch(() => setPlaying(false))
    } else {
      audio.pause()
    }
  }

  function seekTo(fraction: number) {
    const audio = audioRef.current
    if (!audio || !Number.isFinite(audio.duration)) return
    audio.currentTime = Math.min(audio.duration, Math.max(0, fraction * audio.duration))
  }

  const length = track.audio && audioRef.current?.duration
    ? audioRef.current.duration
    : track.durationSeconds
  const progress = length > 0 ? Math.min(1, position / length) : 0

  return (
    <section className="result">
      <header className="result__head">
        <div>
          <p className="result__kicker">
            {track.audio
              ? `${track.engine.toUpperCase()} RENDER · INSTRUMENTAL`
              : 'MOCK RENDER · NO AUDIO'}
          </p>
          <GlitchText className="result__title" text={track.title} />
          <p className="result__artist">IN THE STYLE OF {track.artistName}</p>
        </div>
        <div className="result__actions">
          {track.audio && (
            <a
              className="ghost-button"
              href={track.audio.url}
              download={`${track.title.toLowerCase().replace(/\s+/g, '-')}.wav`}
            >
              DOWNLOAD WAV
            </a>
          )}
          <button type="button" className="ghost-button" onClick={onReset}>
            NEW TAKE
          </button>
        </div>
      </header>

      <div className="player">
        {track.audio && (
          <>
            <audio
              ref={audioRef}
              src={track.audio.url}
              preload="metadata"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => {
                setPlaying(false)
                setPosition(0)
              }}
              onTimeUpdate={(event) => setPosition(event.currentTarget.currentTime)}
            />
            <button
              type="button"
              className="player__transport"
              onClick={togglePlay}
              aria-label={playing ? 'Pause' : 'Play'}
            >
              {playing ? (
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                  <rect x="6" y="5" width="4" height="14" fill="currentColor" />
                  <rect x="14" y="5" width="4" height="14" fill="currentColor" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                  <path d="M8 5v14l11-7z" fill="currentColor" />
                </svg>
              )}
            </button>
          </>
        )}

        <button
          type="button"
          className="waveform"
          aria-label="Seek"
          disabled={!track.audio}
          onClick={(event) => {
            const box = event.currentTarget.getBoundingClientRect()
            seekTo((event.clientX - box.left) / box.width)
          }}
        >
          {track.waveform.map((value, index) => (
            <span
              key={index}
              className={`waveform__bar ${
                index / track.waveform.length <= progress ? 'waveform__bar--played' : ''
              }`}
              style={{ height: `${value * 100}%` }}
            />
          ))}
        </button>

        {track.audio && (
          <span className="player__time">
            {formatDuration(position)} / {formatDuration(length)}
          </span>
        )}
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
        {track.audio
          ? 'Rendered locally from the Style DNA — a procedural instrumental, not a music model. Vocals need a real backend.'
          : 'Playback is stubbed in this engine.'}
      </p>
    </section>
  )
}
