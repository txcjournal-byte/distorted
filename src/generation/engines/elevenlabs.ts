import { getStyleProfile } from '../../style-dna/registry'
import { peaks } from '../audio/wav'
import { compileCompositionPlan, compileStylePrompt } from '../prompt'
import { hash } from '../random'
import {
  deriveTitle,
  type GenerateRequest,
  type GeneratedTrack,
  type GenerationStage,
  type MusicEngine,
} from '../types'

const ENDPOINT = '/api/generate'
const WAVEFORM_BARS = 96

interface FailureBody {
  message?: string
  suggestion?: string | null
}

/**
 * Real generation through ElevenLabs Music, proxied by our own server.
 *
 * The browser never sees the API key — it posts a composition plan to
 * `/api/generate` and the server adds the credential. The plan carries sonic
 * descriptors only, never the artist's name.
 */
export class ElevenLabsEngine implements MusicEngine {
  readonly name = 'elevenlabs'

  async generate(
    request: GenerateRequest,
    onStage: (stage: GenerationStage) => void,
    signal?: AbortSignal,
  ): Promise<GeneratedTrack> {
    const lyrics = request.lyrics.trim()
    if (lyrics.length === 0) throw new Error('NO LYRICS — PASTE SOMETHING FIRST')

    const profile = getStyleProfile(request.artistId)
    if (!profile) throw new Error(`UNKNOWN STYLE PROFILE: ${request.artistId}`)

    onStage('parsing-lyrics')
    const plan = compileCompositionPlan(profile, lyrics)
    const debugPrompt = compileStylePrompt(profile, lyrics)

    onStage('loading-style-dna')
    onStage('arranging')
    onStage('rendering')

    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ plan }),
      signal,
    })

    if (!response.ok) {
      let failure: FailureBody = {}
      try {
        failure = (await response.json()) as FailureBody
      } catch {
        // Non-JSON error body; fall through to the generic message.
      }
      const suffix = failure.suggestion ? ` — TRY: ${failure.suggestion}` : ''
      throw new Error(`${failure.message ?? `GENERATION FAILED (${response.status})`}${suffix}`)
    }

    onStage('mastering')
    const blob = await response.blob()
    if (blob.size === 0) throw new Error('PROVIDER RETURNED AN EMPTY TRACK')

    // Decode once, for the duration and the waveform.
    const bytes = await blob.arrayBuffer()
    const ctx = new OfflineAudioContext(1, 128, 44100)
    const decoded = await ctx.decodeAudioData(bytes.slice(0))

    onStage('done')

    return {
      id: `trk_${hash(lyrics).toString(36)}`,
      title: deriveTitle(lyrics),
      artistName: profile.displayName,
      createdAt: new Date().toISOString(),
      durationSeconds: Math.round(decoded.duration),
      tempo: debugPrompt.params.tempo,
      key: debugPrompt.params.key,
      waveform: peaks(decoded, WAVEFORM_BARS),
      sections: plan.chunks.map((chunk, index) => ({
        label: (chunk.text.match(/^\[([^\]]+)\]/)?.[1] ?? `PART ${index + 1}`).toUpperCase(),
        startSeconds: Math.round((index * decoded.duration) / plan.chunks.length),
      })),
      audio: { url: URL.createObjectURL(blob), blob, instrumental: false },
      engine: this.name,
      debugPrompt,
    }
  }
}
