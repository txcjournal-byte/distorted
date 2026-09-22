import type { StyleProfileId } from '../style-dna/types'
import type { StylePrompt } from './prompt'

export interface GenerateRequest {
  artistId: StyleProfileId
  lyrics: string
}

export interface TrackAudio {
  /** Object URL for playback and download. Revoke when the track is dropped. */
  url: string
  blob: Blob
  /** True when the render carries no vocal — the local engine cannot sing. */
  instrumental: boolean
}

export interface GeneratedTrack {
  id: string
  title: string
  artistName: string
  createdAt: string
  durationSeconds: number
  tempo: number
  key: string
  /** 0..1 bars. Real peaks when audio exists, otherwise a drawn stand-in. */
  waveform: number[]
  sections: { label: string; startSeconds: number }[]
  /** Null when the engine produced no audio. */
  audio: TrackAudio | null
  /** Which engine produced this, shown on the result card. */
  engine: string
  /** Kept for the backend hand-off. Not rendered. */
  debugPrompt: StylePrompt
}

export type GenerationStage =
  | 'idle'
  | 'parsing-lyrics'
  | 'loading-style-dna'
  | 'arranging'
  | 'rendering'
  | 'mastering'
  | 'done'
  | 'error'

export const STAGE_LABELS: Record<GenerationStage, string> = {
  'idle': 'IDLE',
  'parsing-lyrics': 'PARSING LYRICS',
  'loading-style-dna': 'LOADING STYLE DNA',
  'arranging': 'ARRANGING SECTIONS',
  'rendering': 'RENDERING AUDIO',
  'mastering': 'MASTERING',
  'done': 'COMPLETE',
  'error': 'FAILED',
}

/**
 * Anything that can turn lyrics + a style into a track. Swapping in a real
 * music model means adding an implementation here and picking it in engine.ts.
 */
export interface MusicEngine {
  readonly name: string
  generate(
    request: GenerateRequest,
    onStage: (stage: GenerationStage) => void,
    signal?: AbortSignal,
  ): Promise<GeneratedTrack>
}

export function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('aborted', 'AbortError'))
      return
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    function onAbort() {
      clearTimeout(timer)
      reject(new DOMException('aborted', 'AbortError'))
    }
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

const FILLER_WORDS = new Set([
  'a', 'an', 'and', 'at', 'but', 'for', 'in', 'my', 'of', 'on', 'or', 'the',
  'to', 'with', 'your', 'i', 'it', 'is', 'was',
])

export function deriveTitle(lyrics: string): string {
  const firstLine = lyrics
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 0)

  if (!firstLine) return 'UNTITLED'

  const words = firstLine
    .replace(/[^\p{L}\p{N}\s'-]/gu, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)

  while (words.length > 1 && FILLER_WORDS.has(words[words.length - 1].toLowerCase())) {
    words.pop()
  }

  return words.length > 0 ? words.join(' ').toUpperCase() : 'UNTITLED'
}
