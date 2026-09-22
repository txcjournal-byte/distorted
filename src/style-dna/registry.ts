import type { ArtistSummary, StyleProfile, StyleProfileId } from './types'
import { toArtistSummary } from './types'
import { trippieRedd } from './artists/trippie-redd'
import { laneProfile, type LaneArtist } from './lanes'

/**
 * The registry is the single place a new artist gets plugged in:
 *   1. add `src/style-dna/artists/<slug>.ts` exporting a StyleProfile
 *   2. import it here and push it into RESEARCHED
 * Nothing else in the app needs to change.
 */
const RESEARCHED: StyleProfile[] = [trippieRedd]

/**
 * Artists with no researched Style DNA yet. They play through the generic
 * descriptors of their trap lane (see lanes.ts) until a researched profile
 * replaces them. Copy describes the lane's sound, not facts about the artist.
 */
const LANE_ARTISTS: LaneArtist[] = [
  {
    id: 'chief-keef',
    displayName: 'CHIEF KEEF',
    tagline: 'Drill lane. Sliding 808s and skipping hats.',
    quote: 'RAW FROM THE START',
    blurb: 'Drill lane: gliding 808 basslines, triplet-skipping hats, syncopated snares and a cold minor melody.',
    tags: ['DRILL', 'RAW', 'LEGENDARY'],
    lane: 'drill',
    key: 'F minor',
  },
  {
    id: 'rio-da-yung-og',
    displayName: 'RIO DA YUNG OG',
    tagline: 'Detroit lane. Off-beat kicks, piano stabs.',
    quote: 'NO BRAKES',
    blurb: 'Detroit lane: choppy off-beat kicks, a snappy clap, piano stabs and a punchy 808 with room for fast bars.',
    tags: ['DETROIT', 'DARK', 'STREET'],
    lane: 'detroit',
    key: 'A minor',
  },
  {
    id: 'playboi-carti',
    displayName: 'PLAYBOI CARTI',
    tagline: 'Rage lane. Supersaw loops over a blown-out 808.',
    quote: 'DIGITAL CHAOS',
    blurb: 'Rage lane: a short bright detuned synth loop, a distorted 808 and fast rolling hats, hard-clipped and digital.',
    tags: ['RAGE', 'EXPERIMENTAL', 'OPIUM'],
    lane: 'rage',
    key: 'D major',
  },
  {
    id: 'lil-uzi-vert',
    displayName: 'LIL UZI VERT',
    tagline: 'Melodic lane. Pads, plucks, sung hooks.',
    quote: 'FLOATING IN THE NOISE',
    blurb: 'Melodic trap lane: lush pads, a guitar-like pluck, a smooth 808 and gentle rolling hats built for sung hooks.',
    tags: ['MELODIC', 'SPACEY', 'ENERGETIC'],
    lane: 'melodic',
    key: 'C# minor',
  },
  {
    id: 'ken-carson',
    displayName: 'KEN CARSON',
    tagline: 'Hard rage lane. Everything in the red.',
    quote: 'LOUDER THAN LOUD',
    blurb: 'Hard rage lane: detuned synth stabs, an 808 driven into distortion and relentless rolling hats.',
    tags: ['HARD', 'EXPERIMENTAL', 'CHAOTIC'],
    lane: 'rage',
    key: 'G minor',
  },
]

const STYLE_PROFILES: StyleProfile[] = [...RESEARCHED, ...LANE_ARTISTS.map(laneProfile)]

const BY_ID = new Map<StyleProfileId, StyleProfile>(
  STYLE_PROFILES.map((profile) => [profile.id, profile]),
)

/** Public, DNA-free list for the UI: researched artists first, then lane ones. */
export function listArtists(): ArtistSummary[] {
  return STYLE_PROFILES.map(toArtistSummary)
}

export function getArtistSummary(id: StyleProfileId): ArtistSummary | undefined {
  return listArtists().find((artist) => artist.id === id)
}

/** Internal lookup. Only generation code should call this. */
export function getStyleProfile(id: StyleProfileId): StyleProfile | undefined {
  return BY_ID.get(id)
}

export function getDefaultArtistId(): StyleProfileId {
  return STYLE_PROFILES[0].id
}

/** Genre filter options for the style search bar. */
export function listGenres(): string[] {
  const tags = new Set<string>()
  for (const artist of listArtists()) {
    for (const tag of artist.tags) tags.add(tag)
  }
  return [...tags].sort()
}
