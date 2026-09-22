import { useState } from 'react'
import type { SongRecord } from '../library/store'
import { CoverArt } from './CoverArt'
import { formatAge, formatDuration } from './format'
import { DownloadIcon, HeartIcon, PauseIcon, PlayIcon, TrashIcon } from './icons'

export interface SongActions {
  onPlay: (song: SongRecord) => void
  onLike: (id: string) => void
  onDelete: (id: string) => void
  onDownload: (song: SongRecord) => void
  onSeek: (fraction: number) => void
}

interface SongRowProps extends SongActions {
  song: SongRecord
  active: boolean
  playing: boolean
  loading: boolean
  /** 0..1, only meaningful while active. */
  progress: number
}

export function SongRow({
  song,
  active,
  playing,
  loading,
  progress,
  onPlay,
  onLike,
  onDelete,
  onDownload,
  onSeek,
}: SongRowProps) {
  const [confirming, setConfirming] = useState(false)
  const [showLyrics, setShowLyrics] = useState(false)
  const hasLyrics = song.lyrics.trim() !== ''

  return (
    <article className={`song ${active ? 'song--active' : ''}`}>
      <button
        type="button"
        className="song__cover"
        onClick={() => onPlay(song)}
        aria-label={active && playing ? `Pause ${song.title}` : `Play ${song.title}`}
      >
        <CoverArt seed={song.id} />
        <span className="song__cover-icon">
          {loading ? <span className="spinner" /> : active && playing ? <PauseIcon /> : <PlayIcon />}
        </span>
      </button>

      <div className="song__main">
        <div className="song__head">
          <h3 className="song__title">{song.title}</h3>
          <span className="song__duration">{formatDuration(song.durationSeconds)}</span>
        </div>
        <p className="song__meta">
          <span className="chip">{song.artistName}</span>
          <span>{song.instrumental ? 'INSTRUMENTAL' : 'VOCALS'}</span>
          <span>{song.tempo} BPM</span>
          <span>{song.key.toUpperCase()}</span>
          <span className="song__age">{formatAge(song.createdAt)}</span>
        </p>

        <button
          type="button"
          className="song__wave"
          aria-label="Seek"
          onClick={(event) => {
            if (!active) {
              onPlay(song)
              return
            }
            const box = event.currentTarget.getBoundingClientRect()
            onSeek((event.clientX - box.left) / box.width)
          }}
        >
          {song.waveform.map((value, index) => (
            <span
              key={index}
              className={`song__bar ${active && index / song.waveform.length <= progress ? 'song__bar--played' : ''}`}
              style={{ height: `${Math.max(6, value * 100)}%` }}
            />
          ))}
        </button>

        {showLyrics && hasLyrics && <pre className="song__lyrics">{song.lyrics}</pre>}
      </div>

      <div className="song__actions">
        <button
          type="button"
          className={`icon-button ${song.liked ? 'icon-button--on' : ''}`}
          onClick={() => onLike(song.id)}
          aria-pressed={song.liked}
          aria-label={song.liked ? 'Unlike' : 'Like'}
        >
          <HeartIcon filled={song.liked} />
        </button>
        <button type="button" className="icon-button" onClick={() => onDownload(song)} aria-label="Download">
          <DownloadIcon />
        </button>
        {hasLyrics && (
          <button
            type="button"
            className={`icon-button icon-button--text ${showLyrics ? 'icon-button--on' : ''}`}
            onClick={() => setShowLyrics((open) => !open)}
            aria-expanded={showLyrics}
          >
            TXT
          </button>
        )}
        {confirming ? (
          <button
            type="button"
            className="icon-button icon-button--danger icon-button--text"
            onClick={() => onDelete(song.id)}
            onBlur={() => setConfirming(false)}
            autoFocus
          >
            DELETE?
          </button>
        ) : (
          <button type="button" className="icon-button" onClick={() => setConfirming(true)} aria-label="Delete">
            <TrashIcon />
          </button>
        )}
      </div>
    </article>
  )
}
