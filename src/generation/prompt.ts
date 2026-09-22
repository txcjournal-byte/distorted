import type { StyleProfile } from '../style-dna/types'

/**
 * Compiles a hidden StyleProfile + the user's lyrics into the payload a music
 * model would receive. Nothing here reaches the screen — it exists so the
 * swap to a real backend is a one-file change.
 */
export interface StylePrompt {
  profileId: string
  profileVersion: string
  prompt: string
  negativePrompt: string
  lyrics: string
  params: {
    tempo: number
    key: string
    durationSeconds: number
    distortion: number
    autotune: number
  }
}

function middle([low, high]: [number, number]): number {
  return Math.round((low + high) / 2)
}

export function compileStylePrompt(profile: StyleProfile, lyrics: string): StylePrompt {
  const { dna } = profile

  const prompt = [
    dna.promptSeeds.spine,
    dna.promptSeeds.include.join(', '),
    `${dna.harmony.mood.join(', ')} mood`,
    `${dna.production.palette.slice(0, 3).join(', ')} in the arrangement`,
    `${dna.vocal.delivery.join(', ')} vocal delivery`,
  ].join('. ')

  return {
    profileId: profile.id,
    profileVersion: profile.version,
    prompt,
    negativePrompt: dna.promptSeeds.exclude.join(', '),
    lyrics: lyrics.trim(),
    params: {
      tempo: middle(dna.rhythm.tempoRange),
      key: dna.harmony.preferredKeys[0],
      durationSeconds: middle(dna.structure.typicalLengthSeconds),
      distortion: dna.production.distortion,
      autotune: dna.vocal.autotuneIntensity,
    },
  }
}
