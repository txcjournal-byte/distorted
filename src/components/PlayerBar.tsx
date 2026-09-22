import type { usePlayer } from '../hooks/usePlayer'
import type { SongRecord } from '../library/store'
import { CoverArt } from './CoverArt'
import { formatDuration } from './format'
import { CloseIcon, DownloadIcon, PauseIcon, PlayIcon, SkipIcon } from './icons'

type Player = ReturnType<typeof usePlayer>

interface PlayerBarProps {
  player: Player
  onDownload: (song: SongRecord) => void
}

/** The fixed bar at the bottom. Holds the app's only <audio> element. */
export function PlayerBar({ player, onDownload }: PlayerBarProps) {
  const { current, playing, loading, position, duration, error, bind } = player
  const length = duration || current?.durationSeconds || 0
  const progress = length > 0 ? Math.min(1, position / length) : 0

  return (
    <>
      <audio preload="auto" {...bind} />
      {current && (
        <div className="playerbar" role="region" aria-label="Player">
          <div className="playerbar__song">
            <CoverArt seed={current.id} className="playerbar__cover" />
            <div className="playerbar__text">
              <p className="playerbar__title">{current.title}</p>
              <p className="playerbar__artist">{error ?? current.artistName}</p>
            </div>
          </div>

          <div className="playerbar__center">
            <div className="playerbar__controls">
              <button type="button" className="icon-button" onClick={() => player.step(-1)} aria-label="Previous">
                <SkipIcon back />
              </button>
              <button
                type="button"
                className="playerbar__play"
                onClick={() => player.play(current)}
                aria-label={playing ? 'Pause' : 'Play'}
              >
                {loading ? <span className="spinner" /> : playing ? <PauseIcon /> : <PlayIcon />}
              </button>
              <button type="button" className="icon-button" onClick={() => player.step(1)} aria-label="Next">
                <SkipIcon />
              </button>
            </div>
            <div className="playerbar__seek">
              <span>{formatDuration(position)}</span>
              <button
                type="button"
                className="playerbar__track"
                aria-label="Seek"
                onClick={(event) => {
                  const box = event.currentTarget.getBoundingClientRect()
                  player.seek((event.clientX - box.left) / box.width)
                }}
              >
                <span className="playerbar__fill" style={{ width: `${progress * 100}%` }} />
              </button>
              <span>{formatDuration(length)}</span>
            </div>
          </div>

          <div className="playerbar__extra">
            <button type="button" className="icon-button" onClick={() => onDownload(current)} aria-label="Download">
              <DownloadIcon />
            </button>
            <button type="button" className="icon-button" onClick={player.stop} aria-label="Close player">
              <CloseIcon />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
