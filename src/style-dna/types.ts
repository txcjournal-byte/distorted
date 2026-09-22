/**
 * STYLE DNA — internal data model.
 *
 * A StyleProfile is never shown to the user. The UI only ever receives an
 * `ArtistSummary`. Everything under `dna` is the hidden fingerprint that gets
 * compiled into a prompt / conditioning payload for a music model later.
 *
 * Evidence discipline: every DNA section carries an `Evidence` record saying
 * how well sourced it is. Nothing may be stated as fact that research did not
 * support — unsupported values are marked 'unverified' and are meant to be
 * replaced, not trusted.
 */

export type StyleProfileId = string

export type ProfileStatus = 'draft' | 'researched' | 'calibrated'

/**
 * verified   — stated consistently by primary/reference sources
 * reported   — stated by reviews or secondary coverage, not measured
 * estimated  — third-party algorithmic analysis (BPM/key sites); indicative only
 * unverified — inference or convention; NOT backed by research yet
 */
export type Confidence = 'verified' | 'reported' | 'estimated' | 'unverified'

export interface Evidence {
  confidence: Confidence
  note: string
  sources: string[]
}

/** A track used as a style reference, with only what research actually supported. */
export interface ReferenceTrack {
  title: string
  year: number
  release: string
  features: string[]
  producers: string[]
  /** Third-party algorithmic tempo/key readings. Indicative, not authoritative. */
  tempoEstimate: string | null
  keyEstimate: string | null
  /** What sources actually said about this record. No invented detail. */
  notes: string[]
  sources: string[]
}

export interface VocalDNA {
  delivery: string[]
  register: string
  adLibs: string[]
  /** 0..1 */
  autotuneIntensity: number
  layering: string[]
  emotionalTone: string[]
}

export interface ProductionDNA {
  palette: string[]
  textures: string[]
  drums: string[]
  bass: string[]
  /** 0..1 */
  distortion: number
  /** 0..1 */
  space: number
}

export interface RhythmDNA {
  tempoRange: [number, number]
  groove: string[]
  hiHatPatterns: string[]
  /** 0..1 */
  swing: number
}

export interface HarmonyDNA {
  preferredKeys: string[]
  scales: string[]
  progressions: string[]
  mood: string[]
}

export interface StructureDNA {
  arrangement: string[]
  typicalLengthSeconds: [number, number]
  /** 0..1 */
  hookDensity: number
  intro: string
}

export interface LyricalDNA {
  themes: string[]
  imagery: string[]
  rhymeStyle: string[]
  /** Rough syllables per bar. */
  cadenceDensity: number
  vocabularyColour: string[]
}

export interface MixDNA {
  lowEnd: string
  highEnd: string
  vocalPlacement: string
  /** 0..1 */
  saturation: number
}

export interface PromptSeeds {
  include: string[]
  exclude: string[]
  spine: string
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

/** Per-section sourcing, keyed by the StyleDNA sections. */
export type DNAEvidence = Record<keyof Omit<StyleDNA, 'promptSeeds'>, Evidence>

export interface ResearchMeta {
  /** What the profile deliberately covers — profiles are scoped to an era. */
  scope: string
  referenceTracks: ReferenceTrack[]
  sources: string[]
  lastReviewed: string | null
  /** Honest list of what research could NOT establish. */
  openQuestions: string[]
  notes: string
}

export interface StyleProfile {
  id: StyleProfileId
  displayName: string
  /** Public one-liner for the card. */
  tagline: string
  /** Short public quote shown on the selected-style panel. */
  quote: string
  /** Public blurb on the selected-style panel. */
  blurb: string
  tags: string[]
  era: string
  origin: string
  status: ProfileStatus
  version: string
  /** Optional portrait. Supply a licensed image; the UI falls back to a mark. */
  portrait: string | null
  /** Hidden. Never render this. */
  dna: StyleDNA
  evidence: DNAEvidence
  research: ResearchMeta
}

/** The only shape the UI is allowed to see. */
export interface ArtistSummary {
  id: StyleProfileId
  displayName: string
  tagline: string
  quote: string
  blurb: string
  tags: string[]
  era: string
  status: ProfileStatus
  portrait: string | null
  /** False for artists shown in the grid that have no profile yet. */
  available: boolean
}

export function toArtistSummary(profile: StyleProfile): ArtistSummary {
  return {
    id: profile.id,
    displayName: profile.displayName,
    tagline: profile.tagline,
    quote: profile.quote,
    blurb: profile.blurb,
    tags: profile.tags,
    era: profile.era,
    status: profile.status,
    portrait: profile.portrait,
    available: true,
  }
}
