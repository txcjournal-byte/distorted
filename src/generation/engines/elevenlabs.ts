import { getStyleProfile } from '../../style-dna/registry'
import { currentAccessCode } from '../access'
import { peaks } from '../audio/wav'
import { compileCompositionPlan, compileInstrumentalPrompt, compileStylePrompt } from '../prompt'
import {
  titleFor,
  type GenerateRequest,
  type GeneratedTrack,
  type GenerationStage,
  type MusicEngine,
} from '../types'

const ENDPOINT = '/api/generate'
const WAVEFORM_BARS = 96

interface FailureBody {
  code?: string
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
    if (lyrics.length === 0 && !request.instrumental) {
      throw new Error('NO LYRICS — PASTE SOMETHING FIRST OR SWITCH TO INSTRUMENTAL')
    }

    const profile = getStyleProfile(request.artistId)
    if (!profile) throw new Error(`UNKNOWN STYLE PROFILE: ${request.artistId}`)

    onStage('parsing-lyrics')
    // Lyrics go section by section; an instrumental is one prompt.
    const plan = request.instrumental ? null : compileCompositionPlan(profile, lyrics)
    const body = plan
      ? { plan }
      : { ...compileInstrumentalPrompt(profile, request.seed), instrumental: true }
    const debugPrompt = compileStylePrompt(profile, lyrics)

    onStage('loading-style-dna')
    onStage('arranging')
    onStage('rendering')

    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-access-code': currentAccessCode() },
      body: JSON.stringify(body),
      signal,
    })

    if (!response.ok) {
      let failure: FailureBody = {}
      try {
        failure = (await response.json()) as FailureBody
      } catch {
        // Non-JSON error body; fall through to the generic message.
      }
      if (failure.code === 'access_required') {
        throw new Error('WRONG OR MISSING ACCESS CODE — ENTER IT ABOVE THE BUTTON')
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

    const labels = plan
      ? plan.chunks.map((chunk, index) =>
          (chunk.text.match(/^\[([^\]]+)\]/)?.[1] ?? `PART ${index + 1}`).toUpperCase(),
        )
      : ['BEAT']

    return {
      id: `trk_${request.seed.toString(36)}_${request.take}`,
      title: titleFor(request, profile.displayName),
      artistId: profile.id,
      artistName: profile.displayName,
      createdAt: new Date().toISOString(),
      durationSeconds: Math.round(decoded.duration),
      tempo: debugPrompt.params.tempo,
      key: debugPrompt.params.key,
      waveform: peaks(decoded, WAVEFORM_BARS),
      sections: labels.map((label, index) => ({
        label,
        startSeconds: Math.round((index * decoded.duration) / labels.length),
      })),
      audio: { url: URL.createObjectURL(blob), blob, instrumental: request.instrumental },
      engine: this.name,
      lyrics,
      recipe: null,
      debugPrompt,
    }
  }
}
