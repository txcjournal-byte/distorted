import type { StyleProfileId } from '../style-dna/types'
import type { StylePrompt } from './prompt'
import type { SongRecipe } from './recipe'

export interface GenerateRequest {
  artistId: StyleProfileId
  lyrics: string
  /** No vocals. Lyrics become optional and only shape the arrangement. */
  instrumental: boolean
  /** Picks this take's motif, groove and key. Two takes differ only by seed. */
  seed: number
  /** 1-based, shown in the title of each take. */
  take: number
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
  artistId: StyleProfileId
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
  /** The words this take was made from. */
  lyrics: string
  /**
   * Everything the local renderer needs to rebuild the audio. Lets the
   * library keep a song without storing its WAV; null for model output.
   */
  recipe: SongRecipe | null
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

/** Title for a take: first lyric line, or the style for an instrumental. */
export function titleFor(request: GenerateRequest, styleName: string): string {
  const fromLyrics = deriveTitle(request.lyrics)
  if (fromLyrics !== 'UNTITLED') return fromLyrics
  return `${styleName} TYPE BEAT`
}

export function deriveTitle(lyrics: string): string {
  const firstLine = lyrics
    .split('\n')
    .map((line) => line.trim())
    // Skip section markers like [Hook] — they are structure, not a title.
    .find((line) => line.length > 0 && !/^\[[^\]]*\]$/.test(line))

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
