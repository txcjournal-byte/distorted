import { getStyleProfile } from '../../style-dna/registry'
import { compileStylePrompt } from '../prompt'
import { createRandom } from '../random'
import {
  titleFor,
  wait,
  type GenerateRequest,
  type GeneratedTrack,
  type GenerationStage,
  type MusicEngine,
} from '../types'

const STAGES: { stage: GenerationStage; ms: number }[] = [
  { stage: 'parsing-lyrics', ms: 600 },
  { stage: 'loading-style-dna', ms: 800 },
  { stage: 'arranging', ms: 900 },
  { stage: 'rendering', ms: 1100 },
  { stage: 'mastering', ms: 700 },
]

/** Produces no audio. Kept for UI work and as a fallback where Web Audio is absent. */
export class MockMusicEngine implements MusicEngine {
  readonly name = 'mock'

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

    for (const step of STAGES) {
      onStage(step.stage)
      await wait(step.ms, signal)
    }
    onStage('done')

    const debugPrompt = compileStylePrompt(profile, lyrics)
    const random = createRandom(request.seed)
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
      id: `trk_${request.seed.toString(36)}_${request.take}`,
      title: titleFor(request, profile.displayName),
      artistId: profile.id,
      artistName: profile.displayName,
      createdAt: new Date().toISOString(),
      durationSeconds: duration,
      tempo: debugPrompt.params.tempo,
      key: debugPrompt.params.key,
      waveform,
      sections,
      audio: null,
      engine: this.name,
      lyrics,
      recipe: null,
      debugPrompt,
    }
  }
}
