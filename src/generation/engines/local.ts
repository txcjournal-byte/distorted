import { getStyleProfile } from '../../style-dna/registry'
import { renderRecipe } from '../audio/render'
import { audioBufferToWav, peaks } from '../audio/wav'
import { compileStylePrompt } from '../prompt'
import { buildRecipe, type SongRecipe } from '../recipe'
import {
  titleFor,
  wait,
  type GenerateRequest,
  type GeneratedTrack,
  type GenerationStage,
  type MusicEngine,
} from '../types'

const WAVEFORM_BARS = 96

/** Rebuilds a stored song's audio. Same recipe in, same WAV out. */
export async function renderRecipeToWav(recipe: SongRecipe): Promise<Blob> {
  const rendered = await renderRecipe(recipe)
  return audioBufferToWav(rendered.buffer)
}

/**
 * Renders audible audio locally, with no network and no API key. It is a
 * procedural trap beat machine, not a music model: it plays the profile's
 * lane (drums, 808, lead voice) at the take's tempo and key, and it cannot
 * sing the lyrics.
 */
export class LocalSynthEngine implements MusicEngine {
  readonly name = 'local-synth'

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

    if (typeof OfflineAudioContext === 'undefined') {
      throw new Error('WEB AUDIO UNAVAILABLE IN THIS BROWSER')
    }

    onStage('parsing-lyrics')
    await wait(250, signal)

    onStage('loading-style-dna')
    const debugPrompt = compileStylePrompt(profile, lyrics)
    await wait(250, signal)

    onStage('arranging')
    const recipe = buildRecipe(profile, lyrics, request.instrumental, request.seed)
    await wait(200, signal)

    onStage('rendering')
    const rendered = await renderRecipe(recipe)
    if (signal?.aborted) throw new DOMException('aborted', 'AbortError')

    onStage('mastering')
    const blob = audioBufferToWav(rendered.buffer)
    const waveform = peaks(rendered.buffer, WAVEFORM_BARS)
    await wait(150, signal)
    onStage('done')

    return {
      id: `trk_${request.seed.toString(36)}_${request.take}`,
      title: titleFor(request, profile.displayName),
      artistId: profile.id,
      artistName: profile.displayName,
      createdAt: new Date().toISOString(),
      durationSeconds: rendered.durationSeconds,
      tempo: recipe.tempo,
      key: recipe.keyLabel,
      waveform,
      sections: rendered.sections,
      audio: { url: URL.createObjectURL(blob), blob, instrumental: true },
      engine: this.name,
      lyrics,
      recipe,
      debugPrompt,
    }
  }
}
