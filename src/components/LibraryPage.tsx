import { useMemo, useState } from 'react'
import type { SongRecord } from '../library/store'
import { SearchIcon } from './icons'
import { SongList } from './SongList'
import type { SongActions } from './SongRow'

interface LibraryPageProps extends SongActions {
  songs: SongRecord[]
  currentId: string | null
  playing: boolean
  loading: boolean
  progress: number
  onCreate: () => void
}

type Filter = 'all' | 'liked' | 'vocals' | 'instrumental'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'ALL' },
  { id: 'liked', label: 'LIKED' },
  { id: 'vocals', label: 'VOCALS' },
  { id: 'instrumental', label: 'INSTRUMENTAL' },
]

export function LibraryPage({ songs, onCreate, ...rest }: LibraryPageProps) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return songs.filter((song) => {
      if (filter === 'liked' && !song.liked) return false
      if (filter === 'vocals' && song.instrumental) return false
      if (filter === 'instrumental' && !song.instrumental) return false
      if (needle === '') return true
      return (
        song.title.toLowerCase().includes(needle) ||
        song.artistName.toLowerCase().includes(needle) ||
        song.lyrics.toLowerCase().includes(needle)
      )
    })
  }, [songs, query, filter])

  return (
    <section className="library">
      <div className="library__head">
        <div>
          <p className="library__kicker">YOUR LIBRARY</p>
          <h1 className="library__title">MY SONGS</h1>
        </div>
        <p className="library__count">
          {songs.length} {songs.length === 1 ? 'SONG' : 'SONGS'}
        </p>
      </div>

      <div className="library__tools">
        <div className="stylesearch__field">
          <SearchIcon className="stylesearch__icon" />
          <input
            type="search"
            value={query}
            placeholder="Search songs, styles, lyrics..."
            aria-label="Search songs"
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="segmented" role="radiogroup" aria-label="Filter">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={filter === item.id}
              className={`segmented__item ${filter === item.id ? 'segmented__item--on' : ''}`}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {songs.length === 0 ? (
        <div className="empty">
          <p>NO SONGS YET. YOUR TAKES LAND HERE.</p>
          <button type="button" className="ghost-button" onClick={onCreate}>
            GENERATE YOUR FIRST
          </button>
        </div>
      ) : visible.length === 0 ? (
        <p className="trending__empty">NOTHING MATCHES THAT.</p>
      ) : (
        <SongList songs={visible} {...rest} />
      )}

      <p className="library__note">
        Songs live in this browser only. Local renders are rebuilt from their recipe when played.
      </p>
    </section>
  )
}
