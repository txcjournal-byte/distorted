import { getTrapStyle, type TrapStyleId } from '../trap/styles'
import type { Evidence, StyleProfile } from './types'

/**
 * Lane profiles — for artists whose Style DNA has not been researched yet.
 *
 * Rather than inventing artist-specific detail, these profiles carry the
 * generic descriptors of the trap lane the artist is filed under (see
 * src/trap/styles.ts). Every section is marked 'unverified' and says so: it is
 * the sound of the lane, not a claim about the artist. A researched profile in
 * `artists/` replaces one of these entirely.
 */

export interface LaneArtist {
  id: string
  displayName: string
  tagline: string
  quote: string
  blurb: string
  tags: string[]
  lane: TrapStyleId
  /** Key centre the renderer starts from. */
  key: string
  /** Licensed image URL; the card draws a placeholder mark without one. */
  portrait?: string
}

const LANE_ONLY: Evidence = {
  confidence: 'unverified',
  note: 'Lane-level descriptors only (src/trap/styles.ts). No artist-specific research yet.',
  sources: [],
}

export function laneProfile(artist: LaneArtist): StyleProfile {
  const lane = getTrapStyle(artist.lane)
  const { prompt, sound } = lane

  return {
    id: artist.id,
    displayName: artist.displayName,
    tagline: artist.tagline,
    quote: artist.quote,
    blurb: artist.blurb,
    tags: artist.tags,
    era: lane.name,
    origin: '',
    status: 'draft',
    version: `0.1.0-lane-${lane.id}`,
    portrait: artist.portrait ?? null,
    lane: lane.id,

    dna: {
      vocal: {
        delivery: prompt.vocals,
        register: '',
        adLibs: [],
        autotuneIntensity: 0.6,
        layering: [],
        emotionalTone: [],
      },
      production: {
        palette: prompt.include,
        textures: [],
        drums: ['programmed trap kit'],
        bass: ['808 carrying the low end'],
        distortion: sound.drive,
        space: 0.4,
      },
      rhythm: {
        tempoRange: lane.tempoRange,
        groove: [],
        hiHatPatterns: [],
        swing: 0,
      },
      harmony: {
        preferredKeys: [artist.key],
        scales: [sound.minor ? 'minor' : 'major'],
        progressions: [],
        mood: [],
      },
      structure: {
        arrangement: ['intro', 'hook', 'verse', 'hook', 'verse', 'hook', 'outro'],
        typicalLengthSeconds: [140, 170],
        hookDensity: 0.7,
        intro: '',
      },
      lyrical: {
        themes: [],
        imagery: [],
        rhymeStyle: [],
        cadenceDensity: 8,
        vocabularyColour: [],
      },
      mix: {
        lowEnd: '',
        highEnd: '',
        vocalPlacement: '',
        saturation: sound.saturation,
      },
      promptSeeds: {
        include: prompt.include,
        exclude: prompt.exclude,
        spine: prompt.spine,
      },
    },

    evidence: {
      vocal: LANE_ONLY,
      production: LANE_ONLY,
      rhythm: LANE_ONLY,
      harmony: LANE_ONLY,
      structure: LANE_ONLY,
      lyrical: LANE_ONLY,
      mix: LANE_ONLY,
    },

    research: {
      scope: `Generic ${lane.name} lane. Not researched for this artist.`,
      referenceTracks: [],
      sources: [],
      lastReviewed: null,
      openQuestions: ['Everything artist-specific — this profile is the lane sound only.'],
      notes: 'Placeholder until a researched profile lands in src/style-dna/artists/.',
    },
  }
}
