import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getEngine,
  type GeneratedTrack,
  type GenerationStage,
} from '../generation/engine'
import type { StyleProfileId } from '../style-dna/types'

export interface GenerationState {
  stage: GenerationStage
  /** 1-based take being worked on. */
  take: number
  takes: number
  error: string | null
  isRunning: boolean
}

const INITIAL: GenerationState = {
  stage: 'idle',
  take: 0,
  takes: 0,
  error: null,
  isRunning: false,
}

export interface GenerateOptions {
  artistId: StyleProfileId
  lyrics: string
  instrumental: boolean
  /** Like Suno: every hit of GENERATE gives more than one take. */
  takes: number
}

function newSeed(): number {
  const bytes = new Uint32Array(1)
  crypto.getRandomValues(bytes)
  return bytes[0] || 1
}

/**
 * Runs the engine once per take and hands finished tracks to `onTrack` as
 * each lands, so the first take is playable while the second renders.
 */
export function useGeneration(onTrack: (track: GeneratedTrack) => void) {
  const [state, setState] = useState<GenerationState>(INITIAL)
  const abortRef = useRef<AbortController | null>(null)
  const mountedRef = useRef(true)
  const onTrackRef = useRef(onTrack)
  onTrackRef.current = onTrack

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      abortRef.current?.abort()
    }
  }, [])

  const generate = useCallback(async (options: GenerateOptions) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const live = () => mountedRef.current && !controller.signal.aborted

    setState({ stage: 'parsing-lyrics', take: 1, takes: options.takes, error: null, isRunning: true })

    try {
      const engine = await getEngine()
      for (let take = 1; take <= options.takes; take += 1) {
        if (!live()) return
        setState((prev) => ({ ...prev, take, stage: 'parsing-lyrics' }))

        const track = await engine.generate(
          {
            artistId: options.artistId,
            lyrics: options.lyrics,
            instrumental: options.instrumental,
            seed: newSeed(),
            take,
          },
          (stage) => {
            if (live()) setState((prev) => ({ ...prev, stage }))
          },
          controller.signal,
        )

        if (!live()) {
          if (track.audio) URL.revokeObjectURL(track.audio.url)
          return
        }
        onTrackRef.current(track)
      }
      setState((prev) => ({ ...prev, stage: 'done', isRunning: false }))
    } catch (error) {
      if (!live()) return
      setState((prev) => ({
        ...prev,
        stage: 'error',
        error: error instanceof Error ? error.message : 'GENERATION FAILED',
        isRunning: false,
      }))
    }
  }, [])

  const cancel = useCallback(() => {
    abortRef.current?.abort()
    setState(INITIAL)
  }, [])

  return { ...state, generate, cancel }
}
