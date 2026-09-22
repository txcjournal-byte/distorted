import { getStyleProfile } from '../style-dna/registry'
import type { StyleProfileId } from '../style-dna/types'
import { compileStylePrompt, type StylePrompt } from './prompt'

export interface GenerateRequest {
  artistId: StyleProfileId
  lyrics: string
}

export interface GeneratedTrack {
  id: string
  title: string
  artistName: string
  createdAt: string
  durationSeconds: number
  tempo: number
  key: string
  /** 0..1 bars used to draw the fake waveform. */
  waveform: number[]
  sections: { label: string; startSeconds: number }[]
  /** Kept for debugging the future backend hand-off. Not rendered. */
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
  'rendering': 'RENDERING STEMS',
  'mastering': 'MASTERING',
  'done': 'COMPLETE',
  'error': 'FAILED',
}

/**
 * Anything that can turn lyrics + a style into a track. The mock below is the
 * only implementation today; a real music AI client drops in beside it.
 */
export interface MusicEngine {
  readonly name: string
  generate(
    request: GenerateRequest,
    onStage: (stage: GenerationStage) => void,
    signal?: AbortSignal,
  ): Promise<GeneratedTrack>
}

const MOCK_STAGES: { stage: GenerationStage; ms: number }[] = [
  { stage: 'parsing-lyrics', ms: 700 },
  { stage: 'loading-style-dna', ms: 900 },
  { stage: 'arranging', ms: 1100 },
  { stage: 'rendering', ms: 1300 },
  { stage: 'mastering', ms: 800 },
]

function wait(ms: number, signal?: AbortSignal): Promise<void> {
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

/** Deterministic pseudo-random so the same lyrics redraw the same waveform. */
function seededRandom(seed: number): () => number {
  let state = seed || 1
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

function hash(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

const FILLER_WORDS = new Set([
  'a', 'an', 'and', 'at', 'but', 'for', 'in', 'my', 'of', 'on', 'or', 'the',
  'to', 'with', 'your', 'i', 'it', 'is', 'was',
])

function deriveTitle(lyrics: string): string {
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

  // A title ending on a filler word reads like a cut-off sentence.
  while (words.length > 1 && FILLER_WORDS.has(words[words.length - 1].toLowerCase())) {
    words.pop()
  }

  return words.length > 0 ? words.join(' ').toUpperCase() : 'UNTITLED'
}

export class MockMusicEngine implements MusicEngine {
  readonly name = 'mock'

  async generate(
    request: GenerateRequest,
    onStage: (stage: GenerationStage) => void,
    signal?: AbortSignal,
  ): Promise<GeneratedTrack> {
    const lyrics = request.lyrics.trim()
    if (lyrics.length === 0) {
      throw new Error('NO LYRICS — PASTE SOMETHING FIRST')
    }

    const profile = getStyleProfile(request.artistId)
    if (!profile) {
      throw new Error(`UNKNOWN STYLE PROFILE: ${request.artistId}`)
    }

    for (const step of MOCK_STAGES) {
      onStage(step.stage)
      await wait(step.ms, signal)
    }
    onStage('done')

    const debugPrompt = compileStylePrompt(profile, lyrics)
    const random = seededRandom(hash(`${profile.id}:${lyrics}`))
    const waveform = Array.from({ length: 96 }, (_, i) => {
      const envelope = 0.45 + 0.55 * Math.sin((i / 96) * Math.PI * 3)
      return Math.min(1, Math.max(0.08, Math.abs(envelope) * (0.4 + random() * 0.8)))
    })

    const duration = debugPrompt.params.durationSeconds
    const sections = profile.dna.structure.arrangement.map((label, index, all) => ({
      label: label.toUpperCase(),
      startSeconds: Math.round((duration / all.length) * index),
    }))

    return {
      id: `trk_${hash(lyrics).toString(36)}`,
      title: deriveTitle(lyrics),
      artistName: profile.displayName,
      createdAt: new Date().toISOString(),
      durationSeconds: duration,
      tempo: debugPrompt.params.tempo,
      key: debugPrompt.params.key,
      waveform,
      sections,
      debugPrompt,
    }
  }
}

/** Single place to swap the mock for a real client later. */
export const musicEngine: MusicEngine = new MockMusicEngine()
