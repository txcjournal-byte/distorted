import { useCallback, useEffect, useRef, useState } from 'react'
import {
  musicEngine,
  type GeneratedTrack,
  type GenerationStage,
} from '../generation/engine'
import type { StyleProfileId } from '../style-dna/types'

export interface GenerationState {
  stage: GenerationStage
  track: GeneratedTrack | null
  error: string | null
  isRunning: boolean
}

const INITIAL: GenerationState = {
  stage: 'idle',
  track: null,
  error: null,
  isRunning: false,
}

/** Rendered audio lives in an object URL; drop it or the blob leaks. */
function release(track: GeneratedTrack | null) {
  if (track?.audio) URL.revokeObjectURL(track.audio.url)
}

export function useGeneration() {
  const [state, setState] = useState<GenerationState>(INITIAL)
  const abortRef = useRef<AbortController | null>(null)
  const mountedRef = useRef(true)
  const trackRef = useRef<GeneratedTrack | null>(null)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      abortRef.current?.abort()
      release(trackRef.current)
      trackRef.current = null
    }
  }, [])

  const generate = useCallback(async (artistId: StyleProfileId, lyrics: string) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    release(trackRef.current)
    trackRef.current = null
    setState({ stage: 'parsing-lyrics', track: null, error: null, isRunning: true })

    try {
      const track = await musicEngine.generate(
        { artistId, lyrics },
        (stage) => {
          if (mountedRef.current && !controller.signal.aborted) {
            setState((prev) => ({ ...prev, stage }))
          }
        },
        controller.signal,
      )

      if (!mountedRef.current || controller.signal.aborted) {
        release(track)
        return
      }

      trackRef.current = track
      setState({ stage: 'done', track, error: null, isRunning: false })
    } catch (error) {
      if (controller.signal.aborted || !mountedRef.current) return
      setState({
        stage: 'error',
        track: null,
        error: error instanceof Error ? error.message : 'GENERATION FAILED',
        isRunning: false,
      })
    }
  }, [])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    release(trackRef.current)
    trackRef.current = null
    setState(INITIAL)
  }, [])

  return { ...state, generate, reset }
}
