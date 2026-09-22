import { useMemo, useState } from 'react'
import { ArtistSelector } from './components/ArtistSelector'
import { GenerateButton } from './components/GenerateButton'
import { GenerationConsole } from './components/GenerationConsole'
import { GlitchText } from './components/GlitchText'
import { GrainOverlay } from './components/GrainOverlay'
import { LyricsInput } from './components/LyricsInput'
import { TrackResult } from './components/TrackResult'
import { useGeneration } from './hooks/useGeneration'
import { getDefaultArtistId, listArtists } from './style-dna/registry'
import type { StyleProfileId } from './style-dna/types'

export default function App() {
  const artists = useMemo(() => listArtists(), [])
  const [artistId, setArtistId] = useState<StyleProfileId | null>(getDefaultArtistId())
  const [lyrics, setLyrics] = useState('')
  const { stage, track, error, isRunning, generate, reset } = useGeneration()

  const canGenerate = artistId !== null && lyrics.trim().length > 0 && !isRunning

  function handleGenerate() {
    if (!artistId) return
    void generate(artistId, lyrics)
  }

  function handleReset() {
    reset()
  }

  return (
    <div className="app">
      <GrainOverlay />

      <header className="masthead">
        <div className="masthead__bar">
          <span className="masthead__meta">v0.1 · PROTOTYPE</span>
          <span className="masthead__meta">MOCK ENGINE · NO AUDIO</span>
        </div>
        <h1 className="masthead__title">
          <GlitchText text="DISTORTED" active />
        </h1>
        <p className="masthead__subtitle">GENERATE SONG BY STYLE</p>
        <div className="rule" />
      </header>

      <main className="stack">
        <section className="panel">
          <div className="panel__head">
            <span className="panel__index">01</span>
            <h2 className="panel__title">STYLE REFERENCE</h2>
            <span className="panel__hint">STYLE DNA LOADS SILENTLY</span>
          </div>
          <ArtistSelector
            artists={artists}
            selectedId={artistId}
            onSelect={setArtistId}
            disabled={isRunning}
          />
        </section>

        <section className="panel">
          <div className="panel__head">
            <span className="panel__index">02</span>
            <h2 className="panel__title">
              <label htmlFor="lyrics">YOUR LYRICS</label>
            </h2>
            <span className="panel__hint">YOUR WORDS STAY YOURS</span>
          </div>
          <LyricsInput value={lyrics} onChange={setLyrics} disabled={isRunning} />
        </section>

        <section className="panel panel--action">
          <GenerateButton onClick={handleGenerate} disabled={!canGenerate} busy={isRunning} />
          {isRunning && <GenerationConsole stage={stage} />}
          {error && <p className="error">{error}</p>}
        </section>

        {track && !isRunning && <TrackResult track={track} onReset={handleReset} />}
      </main>

      <footer className="footer">
        <span>DISTORTED</span>
        <span>STYLE DNA · DRAFT DATA</span>
      </footer>
    </div>
  )
}
