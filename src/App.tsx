import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GenerateBar } from './components/GenerateBar'
import { GenerationConsole } from './components/GenerationConsole'
import { GrainOverlay } from './components/GrainOverlay'
import { Hero } from './components/Hero'
import { LibraryPage } from './components/LibraryPage'
import { LyricsSection } from './components/LyricsSection'
import { PlayerBar } from './components/PlayerBar'
import { SelectedStyle } from './components/SelectedStyle'
import { SongList } from './components/SongList'
import { StyleSearch } from './components/StyleSearch'
import { TrendingStyles } from './components/TrendingStyles'
import { ArrowIcon } from './components/icons'
import { Sidebar } from './components/layout/Sidebar'
import { TopBar } from './components/layout/TopBar'
import type { Page } from './components/layout/nav'
import { getEngineInfo, type EngineInfo, type GeneratedTrack } from './generation/engine'
import { useGeneration } from './hooks/useGeneration'
import { useLibrary } from './hooks/useLibrary'
import { usePlayer } from './hooks/usePlayer'
import { downloadSong } from './library/audio'
import type { SongRecord } from './library/store'
import { getArtistSummary, getDefaultArtistId, listArtists, listGenres } from './style-dna/registry'
import type { StyleProfileId } from './style-dna/types'

/** Like Suno: one press of GENERATE gives two takes to pick from. */
const TAKES = 2

function pageFromHash(): Page {
  return window.location.hash === '#library' ? 'library' : 'generate'
}

export default function App() {
  const artists = useMemo(() => listArtists(), [])
  const genres = useMemo(() => listGenres(), [])

  const [page, setPage] = useState<Page>(pageFromHash)
  const [artistId, setArtistId] = useState<StyleProfileId | null>(getDefaultArtistId())
  const [query, setQuery] = useState('')
  const [genre, setGenre] = useState('')
  const [lyrics, setLyrics] = useState('')
  const [instrumental, setInstrumental] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  /** Songs made since the page opened, shown under the generate bar. */
  const [sessionIds, setSessionIds] = useState<string[]>([])

  const [engine, setEngine] = useState<EngineInfo | null>(null)
  const trendingRef = useRef<HTMLDivElement>(null)

  const library = useLibrary()
  const player = usePlayer(library.songs)

  const handleTrack = useCallback(
    (track: GeneratedTrack) => {
      const record = library.add(track)
      setSessionIds((prev) => [record.id, ...prev])
    },
    [library.add],
  )
  const generation = useGeneration(handleTrack)

  // Which engine is available depends on the deployment, so ask at runtime.
  useEffect(() => {
    let active = true
    void getEngineInfo().then((info) => {
      if (active) setEngine(info)
    })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const onHash = () => setPage(pageFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  function navigate(next: Page) {
    window.location.hash = next === 'library' ? 'library' : ''
    setPage(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const visibleArtists = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return artists.filter((artist) => {
      const matchesName = needle === '' || artist.displayName.toLowerCase().includes(needle)
      const matchesGenre = genre === '' || artist.tags.includes(genre)
      return matchesName && matchesGenre
    })
  }, [artists, query, genre])

  const selected = artistId ? getArtistSummary(artistId) : undefined
  const hasWords = lyrics.trim().length > 0
  const canGenerate = Boolean(selected?.available) && (hasWords || instrumental) && !generation.isRunning

  const sessionSongs = useMemo(
    () => sessionIds.map((id) => library.songs.find((song) => song.id === id)).filter((song): song is SongRecord => Boolean(song)),
    [sessionIds, library.songs],
  )

  function handleGenerate() {
    if (!artistId) return
    setNotice(null)
    void generation.generate({ artistId, lyrics, instrumental, takes: TAKES })
  }

  function scrollToStyles() {
    trendingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  function showArtists() {
    if (page !== 'generate') {
      navigate('generate')
      window.setTimeout(scrollToStyles, 50)
    } else {
      scrollToStyles()
    }
  }

  function handleDownload(song: SongRecord) {
    downloadSong(song).catch((error: unknown) => {
      setNotice(error instanceof Error ? error.message : 'DOWNLOAD FAILED')
    })
  }

  const length = player.duration || player.current?.durationSeconds || 0
  const listProps = {
    currentId: player.currentId,
    playing: player.playing,
    loading: player.loading,
    progress: length > 0 ? Math.min(1, player.position / length) : 0,
    onPlay: player.play,
    onSeek: player.seek,
    onLike: library.toggleLike,
    onDelete: library.remove,
    onDownload: handleDownload,
  }

  return (
    <div className={`shell ${player.current ? 'shell--playing' : ''}`}>
      <GrainOverlay />
      <Sidebar page={page} songCount={library.songs.length} onNavigate={navigate} onArtists={showArtists} />

      <div className="shell__main">
        <TopBar page={page} onNavigate={navigate} />

        <main className="page">
          {page === 'library' ? (
            <LibraryPage songs={library.songs} onCreate={() => navigate('generate')} {...listProps} />
          ) : (
            <>
              <Hero />

              <StyleSearch
                query={query}
                onQueryChange={setQuery}
                genre={genre}
                onGenreChange={setGenre}
                genres={genres}
              />

              <div ref={trendingRef}>
                <TrendingStyles
                  artists={visibleArtists}
                  selectedId={artistId}
                  onSelect={setArtistId}
                  disabled={generation.isRunning}
                />
              </div>

              {selected && <SelectedStyle artist={selected} onChange={scrollToStyles} />}

              <LyricsSection
                value={lyrics}
                onChange={setLyrics}
                instrumental={instrumental}
                onInstrumentalChange={setInstrumental}
                disabled={generation.isRunning}
              />

              <GenerateBar
                onClick={handleGenerate}
                disabled={!canGenerate}
                busy={generation.isRunning}
                engine={engine}
                takes={TAKES}
              />

              {generation.isRunning && (
                <GenerationConsole
                  stage={generation.stage}
                  take={generation.take}
                  takes={generation.takes}
                  onCancel={generation.cancel}
                />
              )}
              {generation.error && <p className="error">{generation.error}</p>}

              {sessionSongs.length > 0 && (
                <section className="takes">
                  <div className="trending__head">
                    <h2 className="section-title">YOUR TAKES</h2>
                    <button type="button" className="trending__all" onClick={() => navigate('library')}>
                      My Songs <ArrowIcon />
                    </button>
                  </div>
                  <SongList songs={sessionSongs.slice(0, 6)} {...listProps} />
                </section>
              )}
            </>
          )}

          {notice && <p className="error">{notice}</p>}
        </main>

        <p className="worldwide" aria-hidden="true">
          Distorted
          <br />
          worldwide
        </p>
      </div>

      <PlayerBar player={player} onDownload={handleDownload} />
    </div>
  )
}
