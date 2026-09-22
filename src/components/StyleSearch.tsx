import { ChevronIcon, SearchIcon } from './icons'

interface StyleSearchProps {
  query: string
  onQueryChange: (value: string) => void
  genre: string
  onGenreChange: (value: string) => void
  genres: string[]
}

export function StyleSearch({ query, onQueryChange, genre, onGenreChange, genres }: StyleSearchProps) {
  return (
    <div className="stylesearch">
      <div className="stylesearch__field">
        <SearchIcon className="stylesearch__icon" />
        <input
          type="search"
          value={query}
          placeholder="Search styles..."
          aria-label="Search styles"
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </div>

      <div className="stylesearch__select">
        <select value={genre} aria-label="Genre" onChange={(event) => onGenreChange(event.target.value)}>
          <option value="">All Genres</option>
          {genres.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <ChevronIcon className="stylesearch__chevron" />
      </div>
    </div>
  )
}
