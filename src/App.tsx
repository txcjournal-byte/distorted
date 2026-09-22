import { useEffect, useMemo, useRef, useState } from 'react'
import { GenerateBar } from './components/GenerateBar'
import { GenerationConsole } from './components/GenerationConsole'
import { GrainOverlay } from './components/GrainOverlay'
import { Hero } from './components/Hero'
import { LyricsSection } from './components/LyricsSection'
import { SelectedStyle } from './components/SelectedStyle'
import { StyleSearch } from './components/StyleSearch'
import { TrackResult } from './components/TrackResult'
import { TrendingStyles } from './components/TrendingStyles'
import { Sidebar } from './components/layout/Sidebar'
import { TopBar } from './components/layout/TopBar'
import { getEngineInfo, type EngineInfo } from './generation/engine'
import { useGeneration } from './hooks/useGeneration'
import { getArtistSummary, getDefaultArtistId, listArtists, listGenres } from './style-dna/registry'
import type { StyleProfileId } from './style-dna/types'

export default function App() {
  const artists = useMemo(() => listArtists(), [])
  const genres = useMemo(() => listGenres(), [])

  const [artistId, setArtistId] = useState<StyleProfileId | null>(getDefaultArtistId())
  const [query, setQuery] = useState('')
  const [genre, setGenre] = useState('')
  const [lyrics, setLyrics] = useState('')

  const [engine, setEngine] = useState<EngineInfo | null>(null)
  const trendingRef = useRef<HTMLDivElement>(null)
  const { stage, track, error, isRunning, generate, reset } = useGeneration()

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

  const visibleArtists = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return artists.filter((artist) => {
      const matchesName = needle === '' || artist.displayName.toLowerCase().includes(needle)
      const matchesGenre = genre === '' || artist.tags.includes(genre)
      return matchesName && matchesGenre
    })
  }, [artists, query, genre])

  const selected = artistId ? getArtistSummary(artistId) : undefined
  const canGenerate = Boolean(selected?.available) && lyrics.trim().length > 0 && !isRunning

  function handleGenerate() {
    if (!artistId) return
    void generate(artistId, lyrics)
  }

  function scrollToStyles() {
    trendingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div className="shell">
      <GrainOverlay />
      <Sidebar />

      <div className="shell__main">
        <TopBar />

        <main className="page">
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
              disabled={isRunning}
            />
          </div>

          {selected && <SelectedStyle artist={selected} onChange={scrollToStyles} />}

          <LyricsSection value={lyrics} onChange={setLyrics} disabled={isRunning} />

          <GenerateBar
            onClick={handleGenerate}
            disabled={!canGenerate}
            busy={isRunning}
            engine={engine}
          />

          {isRunning && <GenerationConsole stage={stage} />}
          {error && <p className="error">{error}</p>}
          {track && !isRunning && <TrackResult track={track} onReset={reset} />}
        </main>

        <p className="worldwide" aria-hidden="true">
          Distorted
          <br />
          worldwide
        </p>
      </div>
    </div>
  )
}
