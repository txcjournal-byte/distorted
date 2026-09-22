import { getStyleProfile } from '../../style-dna/registry'
import { renderTrack } from '../audio/render'
import { audioBufferToWav, peaks } from '../audio/wav'
import { compileStylePrompt } from '../prompt'
import { hash } from '../random'
import {
  deriveTitle,
  wait,
  type GenerateRequest,
  type GeneratedTrack,
  type GenerationStage,
  type MusicEngine,
} from '../types'

/**
 * Renders audible audio locally from the Style DNA, with no network and no
 * API key. It is a procedural sketch, not a music model: it plays an
 * instrumental built from the profile's tempo, key, arrangement, distortion
 * and palette, and it cannot sing the lyrics.
 */
export class LocalSynthEngine implements MusicEngine {
  readonly name = 'local-synth'

  async generate(
    request: GenerateRequest,
    onStage: (stage: GenerationStage) => void,
    signal?: AbortSignal,
  ): Promise<GeneratedTrack> {
    const lyrics = request.lyrics.trim()
    if (lyrics.length === 0) throw new Error('NO LYRICS — PASTE SOMETHING FIRST')

    const profile = getStyleProfile(request.artistId)
    if (!profile) throw new Error(`UNKNOWN STYLE PROFILE: ${request.artistId}`)

    if (typeof OfflineAudioContext === 'undefined') {
      throw new Error('WEB AUDIO UNAVAILABLE IN THIS BROWSER')
    }

    onStage('parsing-lyrics')
    await wait(400, signal)

    onStage('loading-style-dna')
    const debugPrompt = compileStylePrompt(profile, lyrics)
    await wait(400, signal)

    onStage('arranging')
    await wait(300, signal)

    onStage('rendering')
    const seed = hash(`${profile.id}:${lyrics}`)
    const rendered = await renderTrack(profile, seed)
    if (signal?.aborted) throw new DOMException('aborted', 'AbortError')

    onStage('mastering')
    const blob = audioBufferToWav(rendered.buffer)
    const waveform = peaks(rendered.buffer, 96)
    await wait(250, signal)
    onStage('done')

    return {
      id: `trk_${hash(lyrics).toString(36)}`,
      title: deriveTitle(lyrics),
      artistName: profile.displayName,
      createdAt: new Date().toISOString(),
      durationSeconds: rendered.durationSeconds,
      tempo: rendered.tempo,
      key: rendered.keyLabel,
      waveform,
      sections: rendered.sections,
      audio: { url: URL.createObjectURL(blob), blob, instrumental: true },
      engine: this.name,
      debugPrompt,
    }
  }
}
