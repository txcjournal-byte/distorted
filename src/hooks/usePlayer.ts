import { useCallback, useEffect, useRef, useState, type SyntheticEvent } from 'react'
import { audioUrlFor, pinAudio } from '../library/audio'
import type { SongRecord } from '../library/store'

export interface PlayerState {
  currentId: string | null
  playing: boolean
  loading: boolean
  position: number
  duration: number
  error: string | null
}

/**
 * One <audio> element for the whole app, like a streaming site's bottom
 * bar. Songs from anywhere on the page play through it.
 */
export function usePlayer(queue: SongRecord[]) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const requestRef = useRef(0)
  const [state, setState] = useState<PlayerState>({
    currentId: null,
    playing: false,
    loading: false,
    position: 0,
    duration: 0,
    error: null,
  })

  const current = queue.find((song) => song.id === state.currentId) ?? null

  const load = useCallback(async (song: SongRecord) => {
    const audio = audioRef.current
    if (!audio) return
    const request = ++requestRef.current
    audio.pause()
    pinAudio(song.id)
    setState({ currentId: song.id, playing: false, loading: true, position: 0, duration: song.durationSeconds, error: null })

    try {
      const url = await audioUrlFor(song)
      if (request !== requestRef.current) return
      if (!url) throw new Error('AUDIO NOT AVAILABLE')
      audio.src = url
      await audio.play()
      setState((prev) => ({ ...prev, loading: false }))
    } catch (error) {
      if (request !== requestRef.current) return
      setState((prev) => ({
        ...prev,
        loading: false,
        playing: false,
        error: error instanceof Error && error.name !== 'NotAllowedError' ? error.message : null,
      }))
    }
  }, [])

  /** Plays a song, or pauses/resumes it if it is already loaded. */
  const play = useCallback(
    (song: SongRecord) => {
      const audio = audioRef.current
      if (!audio) return
      if (song.id === state.currentId && !state.loading && audio.src) {
        if (audio.paused) void audio.play().catch(() => undefined)
        else audio.pause()
        return
      }
      void load(song)
    },
    [load, state.currentId, state.loading],
  )

  const step = useCallback(
    (direction: 1 | -1) => {
      if (queue.length === 0) return
      const index = queue.findIndex((song) => song.id === state.currentId)
      const next = queue[(index + direction + queue.length) % queue.length]
      if (next) void load(next)
    },
    [load, queue, state.currentId],
  )

  const seek = useCallback((fraction: number) => {
    const audio = audioRef.current
    if (!audio || !Number.isFinite(audio.duration)) return
    audio.currentTime = Math.min(audio.duration, Math.max(0, fraction * audio.duration))
  }, [])

  const stop = useCallback(() => {
    const audio = audioRef.current
    requestRef.current += 1
    pinAudio(null)
    if (audio) {
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
    }
    setState({ currentId: null, playing: false, loading: false, position: 0, duration: 0, error: null })
  }, [])

  // The current song was deleted from the library: stop playing it.
  useEffect(() => {
    if (state.currentId && !current) stop()
  }, [current, state.currentId, stop])

  const bind = {
    ref: audioRef,
    onPlay: () => setState((prev) => ({ ...prev, playing: true })),
    onPause: () => setState((prev) => ({ ...prev, playing: false })),
    onTimeUpdate: (event: SyntheticEvent<HTMLAudioElement>) => {
      const position = event.currentTarget.currentTime
      setState((prev) => ({ ...prev, position }))
    },
    onLoadedMetadata: (event: SyntheticEvent<HTMLAudioElement>) => {
      const duration = event.currentTarget.duration
      if (Number.isFinite(duration)) setState((prev) => ({ ...prev, duration }))
    },
    // Roll on through the list like a playlist, and stop at its end.
    onEnded: () => {
      const index = queue.findIndex((song) => song.id === state.currentId)
      if (index > -1 && index < queue.length - 1) void load(queue[index + 1])
      else setState((prev) => ({ ...prev, playing: false, position: 0 }))
    },
  }

  return { ...state, current, play, step, seek, stop, bind }
}
