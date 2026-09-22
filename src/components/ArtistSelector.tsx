import type { ArtistSummary, StyleProfileId } from '../style-dna/types'
import { GlitchText } from './GlitchText'

interface ArtistSelectorProps {
  artists: ArtistSummary[]
  selectedId: StyleProfileId | null
  onSelect: (id: StyleProfileId) => void
  disabled?: boolean
}

export function ArtistSelector({ artists, selectedId, onSelect, disabled }: ArtistSelectorProps) {
  return (
    <div className="artists" role="radiogroup" aria-label="Style reference">
      {artists.map((artist) => {
        const selected = artist.id === selectedId
        return (
          <button
            key={artist.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            className={`artist-card ${selected ? 'artist-card--selected' : ''}`}
            onClick={() => onSelect(artist.id)}
          >
            <span className="artist-card__frame" aria-hidden="true" />
            <span className="artist-card__top">
              <span className="artist-card__era">{artist.era}</span>
              <span className="artist-card__state">{selected ? 'DNA LOCKED' : 'SELECT'}</span>
            </span>
            <GlitchText className="artist-card__name" text={artist.displayName} active={selected} />
            <span className="artist-card__tagline">{artist.tagline}</span>
            <span className="artist-card__tags">
              {artist.tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </span>
          </button>
        )
      })}

      <div className="artist-card artist-card--empty" aria-hidden="true">
        <span className="artist-card__frame" />
        <span className="artist-card__name artist-card__name--muted">+ MORE SOON</span>
        <span className="artist-card__tagline">STYLE DNA IN RESEARCH</span>
      </div>
    </div>
  )
}
