import type { ArtistSummary } from '../style-dna/types'
import { ArtistPortrait } from './ArtistPortrait'

interface SelectedStyleProps {
  artist: ArtistSummary
  onChange: () => void
}

export function SelectedStyle({ artist, onChange }: SelectedStyleProps) {
  return (
    <section className="selected">
      <ArtistPortrait name={artist.displayName} src={artist.portrait} className="selected__photo" />

      <div className="selected__id">
        <p className="selected__kicker">SELECTED STYLE</p>
        <h3 className="selected__name">{artist.displayName}</h3>
        <p className="selected__tags">
          {artist.tags.map((tag, index) => (
            <span key={tag}>
              {index > 0 && <span className="selected__slash">/</span>}
              <span className="chip">{tag}</span>
            </span>
          ))}
        </p>
      </div>

      <div className="selected__copy">
        <p className="selected__quote">“{artist.quote}”</p>
        <p className="selected__blurb">{artist.blurb}</p>
      </div>

      <button type="button" className="selected__change" onClick={onChange}>
        CHANGE
      </button>
    </section>
  )
}
