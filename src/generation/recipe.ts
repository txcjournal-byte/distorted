import type { StyleProfile } from '../style-dna/types'
import { getTrapStyle, type TrapSound } from '../trap/styles'
import { splitLyrics } from './prompt'
import { createRandom } from './random'
import { parseKey } from './audio/theory'

/**
 * A SongRecipe is the complete, serialisable input of the local renderer.
 * The same recipe always renders the same audio, so the library stores the
 * recipe instead of a 25 MB WAV and rebuilds the sound on demand.
 */

export type SectionKind = 'intro' | 'verse' | 'hook' | 'bridge' | 'outro'

export interface RecipeSection {
  label: string
  kind: SectionKind
  bars: number
}

export interface SongRecipe {
  version: 1
  seed: number
  tempo: number
  /** Semitones above C. */
  keyRoot: number
  minor: boolean
  keyLabel: string
  sound: TrapSound
  sections: RecipeSection[]
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

/** Keeps the local render short enough to build in a moment. */
const MAX_SECONDS = 150

function classify(label: string): SectionKind {
  const text = label.toLowerCase()
  if (text.includes('intro')) return 'intro'
  if (text.includes('outro') || text.includes('end')) return 'outro'
  if (text.includes('hook') || text.includes('chorus') || text.includes('refrain')) return 'hook'
  if (text.includes('bridge') || text.includes('break') || text.includes('interlude')) return 'bridge'
  return 'verse'
}

const DEFAULT_BARS: Record<SectionKind, number> = { intro: 4, hook: 8, verse: 16, bridge: 8, outro: 4 }

/** Bars for a lyric block: roughly two bars per line, in whole phrases. */
function barsForLyrics(kind: SectionKind, body: string): number {
  if (kind === 'intro' || kind === 'outro') return 4
  const lines = body.split('\n').filter((line) => line.trim() !== '').length
  const bars = Math.ceil((lines * 2) / 4) * 4
  return Math.min(16, Math.max(8, bars))
}

function arrangement(profile: StyleProfile, lyrics: string, instrumental: boolean): RecipeSection[] {
  const blocks = splitLyrics(lyrics)

  // Lyrics shape the song when they are there — also for an instrumental,
  // where they act as a structure sketch.
  if (blocks.length > 0) {
    const sections = blocks.map((block) => {
      const kind = classify(block.label)
      return { label: block.label.toUpperCase(), kind, bars: barsForLyrics(kind, block.body) }
    })
    if (sections[0].kind !== 'intro') sections.unshift({ label: 'INTRO', kind: 'intro', bars: 4 })
    if (sections[sections.length - 1].kind !== 'outro') sections.push({ label: 'OUTRO', kind: 'outro', bars: 4 })
    return sections
  }

  const labels = profile.dna.structure.arrangement
  const sections = labels.map((label) => {
    const kind = classify(label)
    return { label: kind.toUpperCase(), kind, bars: DEFAULT_BARS[kind] }
  })
  // A beat with nothing to rap over wants a break before the last hook.
  if (instrumental && sections.length > 3) {
    sections.splice(sections.length - 2, 0, { label: 'BRIDGE', kind: 'bridge', bars: 8 })
  }
  return sections
}

function fitToLength(sections: RecipeSection[], barSeconds: number): RecipeSection[] {
  const maxBars = Math.floor(MAX_SECONDS / barSeconds)
  const fitted: RecipeSection[] = []
  let used = 0
  for (const section of sections) {
    if (used >= maxBars) break
    const bars = Math.min(section.bars, maxBars - used)
    if (bars < 4) break
    fitted.push({ ...section, bars: bars - (bars % 4) })
    used += bars - (bars % 4)
  }
  return fitted
}

export function buildRecipe(
  profile: StyleProfile,
  lyrics: string,
  instrumental: boolean,
  seed: number,
): SongRecipe {
  const random = createRandom(seed)
  const lane = getTrapStyle(profile.lane)
  const [low, high] = profile.dna.rhythm.tempoRange

  // Takes wander inside the profile's tempo range instead of all sitting on
  // its midpoint.
  const tempo = Math.round(low + random() * (high - low))

  const keyText = profile.dna.harmony.preferredKeys[0] ?? ''
  const base = parseKey(keyText || 'C minor')
  // The profile's key decides the mode; the lane only fills in when it is silent.
  const minor = /minor/i.test(keyText) ? true : /major/i.test(keyText) ? false : lane.sound.minor
  // Second takes move the key a little so the two do not sound like one.
  const shift = [0, 0, 2, -2, 5, -5][Math.floor(random() * 6)]
  const keyRoot = (((base.root + shift) % 12) + 12) % 12

  // Small per-take nudges to the lane's sound so takes differ in character.
  const nudge = (value: number) => Math.min(1, Math.max(0, value + (random() - 0.5) * 0.2))
  const sound: TrapSound = {
    ...lane.sound,
    minor,
    drive: nudge(profile.dna.production.distortion),
    rolls: nudge(lane.sound.rolls),
    glide: lane.sound.glide,
    saturation: nudge(profile.dna.mix.saturation),
  }

  const barSeconds = (60 / tempo) * 4
  return {
    version: 1,
    seed,
    tempo,
    keyRoot,
    minor,
    keyLabel: `${NOTE_NAMES[keyRoot]} ${minor ? 'minor' : 'major'}`,
    sound,
    sections: fitToLength(arrangement(profile, lyrics, instrumental), barSeconds),
  }
}
