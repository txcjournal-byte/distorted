import type { ArtistSummary, StyleProfileId } from '../style-dna/types'
import { ArtistPortrait } from './ArtistPortrait'
import { ArrowIcon } from './icons'

interface TrendingStylesProps {
  artists: ArtistSummary[]
  selectedId: StyleProfileId | null
  onSelect: (id: StyleProfileId) => void
  disabled?: boolean
}

export function TrendingStyles({ artists, selectedId, onSelect, disabled }: TrendingStylesProps) {
  return (
    <section className="trending">
      <div className="trending__head">
        <h2 className="section-title">TRENDING STYLES</h2>
        <button type="button" className="trending__all" disabled>
          View All <ArrowIcon />
        </button>
      </div>

      {artists.length === 0 ? (
        <p className="trending__empty">NO STYLES MATCH THAT SEARCH.</p>
      ) : (
        <div className="trending__grid" role="radiogroup" aria-label="Artist style">
          {artists.map((artist) => {
            const selected = artist.id === selectedId
            return (
              <button
                key={artist.id}
                type="button"
                role="radio"
                aria-checked={selected}
                title={artist.available ? undefined : 'Style DNA not researched yet'}
                disabled={disabled || !artist.available}
                className={`style-card ${selected ? 'style-card--selected' : ''} ${
                  artist.available ? '' : 'style-card--locked'
                }`}
                onClick={() => onSelect(artist.id)}
              >
                <ArtistPortrait name={artist.displayName} src={artist.portrait} className="style-card__photo" />
                <span className="style-card__shade" aria-hidden="true" />
                <span className="style-card__body">
                  <span className="style-card__name">{artist.displayName}</span>
                  <span className="style-card__tags">{artist.tags.join(' / ')}</span>
                </span>
                {!artist.available && <span className="style-card__lock">NO DNA YET</span>}
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}
