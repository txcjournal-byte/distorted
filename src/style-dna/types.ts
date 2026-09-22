/**
 * STYLE DNA — internal data model.
 *
 * A StyleProfile is never shown to the user. The UI only exposes the
 * `ArtistSummary` (name, tagline, tags). Everything under `dna` is the
 * hidden fingerprint that will later be compiled into a prompt / conditioning
 * payload for a real music AI backend.
 *
 * Current profiles are DRAFT data written from general impressions only.
 * Real research lands in a later phase — see `research` on each profile.
 */

export type StyleProfileId = string

/** How trustworthy the data in a profile is. */
export type ProfileStatus = 'draft' | 'researched' | 'calibrated'

export interface VocalDNA {
  /** e.g. "melodic mumble", "sung-rap" */
  delivery: string[]
  /** Typical register / range description. */
  register: string
  /** Signature ad-libs. Used as sprinkle tokens in generation. */
  adLibs: string[]
  /** Auto-tune / pitch treatment intensity, 0..1 */
  autotuneIntensity: number
  /** Layering habits: doubles, octaves, harmonies. */
  layering: string[]
  /** Emotional colour of the performance. */
  emotionalTone: string[]
}

export interface ProductionDNA {
  /** Core instruments / sound sources. */
  palette: string[]
  /** Signature textures and processing. */
  textures: string[]
  /** Typical drum machine / kit character. */
  drums: string[]
  /** 808 behaviour: glide, distortion, tuning. */
  bass: string[]
  /** How dirty the master feels, 0..1 */
  distortion: number
  /** Space: dry vs cavernous, 0..1 */
  space: number
}

export interface RhythmDNA {
  tempoRange: [number, number]
  /** Most common feel. */
  groove: string[]
  /** Hi-hat subdivision habits. */
  hiHatPatterns: string[]
  swing: number
}

export interface HarmonyDNA {
  preferredKeys: string[]
  scales: string[]
  /** Loop-length chord motion, described not notated (draft). */
  progressions: string[]
  mood: string[]
}

export interface StructureDNA {
  /** Typical arrangement skeleton. */
  arrangement: string[]
  typicalLengthSeconds: [number, number]
  hookDensity: number
  /** Does the track usually open cold, on ad-libs, on a sample? */
  intro: string
}

export interface LyricalDNA {
  themes: string[]
  imagery: string[]
  /** Rhyme habits — used to steer phrasing, never to rewrite user lyrics. */
  rhymeStyle: string[]
  /** Syllables per bar, rough. */
  cadenceDensity: number
  vocabularyColour: string[]
}

export interface MixDNA {
  lowEnd: string
  highEnd: string
  vocalPlacement: string
  /** Loudness / clipping character, 0..1 */
  saturation: number
}

/**
 * Tokens handed to the (future) music model. Kept separate from the
 * descriptive DNA so the prompt compiler stays dumb and swappable.
 */
export interface PromptSeeds {
  /** Positive style tokens. */
  include: string[]
  /** Things the model must avoid. */
  exclude: string[]
  /** Free-form seed sentence used as the prompt spine. */
  spine: string
}

export interface ResearchMeta {
  /** Where the data came from. Empty while the profile is a draft. */
  sources: string[]
  lastReviewed: string | null
  notes: string
}

export interface StyleDNA {
  vocal: VocalDNA
  production: ProductionDNA
  rhythm: RhythmDNA
  harmony: HarmonyDNA
  structure: StructureDNA
  lyrical: LyricalDNA
  mix: MixDNA
  promptSeeds: PromptSeeds
}

export interface StyleProfile {
  id: StyleProfileId
  /** Shown in the UI. */
  displayName: string
  /** One-line hook shown on the selector card. */
  tagline: string
  /** Short public tags shown on the card. */
  tags: string[]
  era: string
  origin: string
  status: ProfileStatus
  /** Bumped whenever the DNA changes, so generations stay traceable. */
  version: string
  /** Hidden. Never render this. */
  dna: StyleDNA
  research: ResearchMeta
}

/** The only shape the UI is allowed to see. */
export interface ArtistSummary {
  id: StyleProfileId
  displayName: string
  tagline: string
  tags: string[]
  era: string
  status: ProfileStatus
}

export function toArtistSummary(profile: StyleProfile): ArtistSummary {
  return {
    id: profile.id,
    displayName: profile.displayName,
    tagline: profile.tagline,
    tags: profile.tags,
    era: profile.era,
    status: profile.status,
  }
}
