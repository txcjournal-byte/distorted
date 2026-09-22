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

/* ------------------------------------------------------------------------ */
/* ElevenLabs composition plan                                              */
/* ------------------------------------------------------------------------ */

/**
 * A chunk of an ElevenLabs `composition_plan` (music_v2).
 * See https://elevenlabs.io/docs/api-reference/music/create-composition-plan
 */
export interface CompositionChunk {
  /** Section label, lyrics, and inline cues. */
  text: string
  /** 3000–120000 ms. */
  duration_ms: number
  /** Up to 50 desired qualities. Must be English. */
  positive_styles: string[]
  /** Up to 50 qualities to avoid. */
  negative_styles: string[]
  context_adherence: 'low' | 'medium' | 'high'
}

export interface CompositionPlan {
  chunks: CompositionChunk[]
}

const MIN_CHUNK_MS = 8000
/**
 * The API allows 120s per chunk, but a single 80-second hook is not a section,
 * it is a drone. Sections stay musical and the track length follows from how
 * many the lyrics have.
 */
const MAX_CHUNK_MS = 45000
const MAX_CHUNKS = 30
const MAX_STYLES = 50

interface LyricSection {
  label: string
  body: string
}

/**
 * Splits lyrics into sections. Honours explicit `[hook]` / `[verse]` markers;
 * otherwise falls back to blank-line separated blocks.
 */
export function splitLyrics(lyrics: string): LyricSection[] {
  const text = lyrics.trim()
  if (text === '') return []

  if (/^\s*\[[^\]]+\]/m.test(text)) {
    const sections: LyricSection[] = []
    const pattern = /^[ \t]*\[([^\]]+)\][ \t]*$/gm
    const marks = [...text.matchAll(pattern)]

    marks.forEach((mark, index) => {
      const start = (mark.index ?? 0) + mark[0].length
      const end = index + 1 < marks.length ? marks[index + 1].index : text.length
      const body = text.slice(start, end).trim()
      if (body !== '') sections.push({ label: mark[1].trim(), body })
    })

    if (sections.length > 0) return sections
  }

  return text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((body, index) => ({ label: index % 2 === 0 ? 'Verse' : 'Chorus', body }))
}

function titleCase(label: string): string {
  return label
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Builds the composition plan from a StyleProfile and the user's lyrics.
 *
 * The artist's name is never sent. Providers reject prompts naming a real
 * artist (ElevenLabs returns `bad_prompt` / `bad_composition_plan` for
 * copyrighted references), so the plan carries sonic descriptors only — which
 * is exactly what the Style DNA exists to provide. The final filter below is a
 * belt-and-braces guard in case a profile ever puts a name in its seeds.
 */
export function compileCompositionPlan(profile: StyleProfile, lyrics: string): CompositionPlan {
  const { dna } = profile

  const nameTokens = profile.displayName
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length > 2)

  const clean = (styles: string[]) =>
    styles
      .map((style) => style.trim())
      .filter(Boolean)
      .filter((style) => {
        const lower = style.toLowerCase()
        return !nameTokens.some((token) => lower.includes(token))
      })
      .slice(0, MAX_STYLES)

  const positive = clean([
    ...dna.promptSeeds.include,
    ...dna.production.palette,
    ...dna.production.drums,
    ...dna.production.bass,
    ...dna.vocal.delivery,
    ...dna.harmony.mood,
    `${middle(dna.rhythm.tempoRange)} bpm`,
  ])

  const negative = clean(dna.promptSeeds.exclude)

  const sections = splitLyrics(lyrics)
  const totalMs = middle(dna.structure.typicalLengthSeconds) * 1000

  // No lyric sections means an instrumental pass over the arrangement.
  const parts: LyricSection[] =
    sections.length > 0
      ? sections.slice(0, MAX_CHUNKS)
      : dna.structure.arrangement.slice(0, MAX_CHUNKS).map((label) => ({ label, body: '' }))

  const perChunk = Math.round(totalMs / parts.length)
  const duration = Math.min(MAX_CHUNK_MS, Math.max(MIN_CHUNK_MS, perChunk))

  return {
    chunks: parts.map((part) => ({
      text: part.body === ''
        ? `[${titleCase(part.label)}]`
        : `[${titleCase(part.label)}]\n${part.body}`,
      duration_ms: duration,
      positive_styles: positive,
      negative_styles: negative,
      context_adherence: 'high' as const,
    })),
  }
}

/* ------------------------------------------------------------------------ */
/* Instrumental prompt                                                      */
/* ------------------------------------------------------------------------ */

export interface InstrumentalPrompt {
  prompt: string
  lengthMs: number
}

/**
 * One free-text prompt for an instrumental take. Like the plan, it carries
 * sonic descriptors only — never the artist's name. The seed picks a tempo
 * inside the profile's range so two takes do not come back identical.
 */
export function compileInstrumentalPrompt(profile: StyleProfile, seed: number): InstrumentalPrompt {
  const { dna } = profile
  const [low, high] = dna.rhythm.tempoRange
  const tempo = low + (seed % (high - low + 1))

  const nameTokens = profile.displayName
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length > 2)
  const safe = (text: string) => !nameTokens.some((token) => text.toLowerCase().includes(token))

  const parts = [
    `Instrumental trap beat, no vocals. ${dna.promptSeeds.spine}`,
    `${dna.promptSeeds.include.filter(safe).join(', ')}`,
    `${tempo} BPM, ${(dna.harmony.preferredKeys[0] ?? 'minor key').replace(/\(.*?\)/g, '').trim()}`,
    `Avoid: ${dna.promptSeeds.exclude.filter(safe).join(', ')}`,
  ].filter(safe)

  return {
    prompt: parts.join('. '),
    lengthMs: middle(dna.structure.typicalLengthSeconds) * 1000,
  }
}
