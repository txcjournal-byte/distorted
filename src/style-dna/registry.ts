import type { ArtistSummary, StyleProfile, StyleProfileId } from './types'
import { toArtistSummary } from './types'
import { trippieRedd } from './artists/trippie-redd'
import { laneProfile, type LaneArtist } from './lanes'

/**
 * The registry is the single place a style gets plugged in.
 *
 * DISTORTED is public, so styles are named by their sound, never by a real
 * person: offering "the style of <artist>" to the public trades on someone's
 * name and likeness. Every profile carries sonic descriptors only.
 */

/**
 * RAGE keeps the researched rage-era profile. Its research names the records
 * it was drawn from; nothing public-facing does.
 */
const rage: StyleProfile = {
  ...trippieRedd,
  id: 'rage',
  displayName: 'RAGE',
  tagline: 'Detuned synth loops over an 808 pushed into the red.',
  quote: 'EMOTION IN CHAOS',
  blurb:
    'Bright detuned synth leads, distorted 808s, fast rolling hi-hats and shouted, heavily tuned hooks — digital, hard-clipped, loop-driven.',
  tags: ['RAGE', 'SYNTH', 'CHAOTIC'],
  era: 'RAGE',
  origin: '',
}

/**
 * The other lanes play through the generic descriptors in src/trap/styles.ts
 * (see lanes.ts) until a researched profile replaces them.
 */
const LANE_STYLES: LaneArtist[] = [
  {
    id: 'drill',
    displayName: 'CHICAGO DRILL',
    tagline: 'Sliding 808s and skipping hats.',
    quote: 'RAW FROM THE START',
    blurb: 'Gliding 808 basslines, triplet-skipping hats, syncopated snares and a cold minor melody.',
    tags: ['DRILL', 'RAW', 'COLD'],
    lane: 'drill',
    key: 'F minor',
  },
  {
    id: 'detroit',
    displayName: 'DETROIT',
    tagline: 'Off-beat kicks, piano stabs.',
    quote: 'NO BRAKES',
    blurb: 'Choppy off-beat kicks, a snappy clap, piano stabs and a punchy 808 with room for fast bars.',
    tags: ['DETROIT', 'DARK', 'STREET'],
    lane: 'detroit',
    key: 'A minor',
  },
  {
    id: 'melodic',
    displayName: 'MELODIC TRAP',
    tagline: 'Pads, plucks, sung hooks.',
    quote: 'FLOATING IN THE NOISE',
    blurb: 'Lush pads, a guitar-like pluck, a smooth 808 and gentle rolling hats built for sung hooks.',
    tags: ['MELODIC', 'SPACEY', 'EMOTIONAL'],
    lane: 'melodic',
    key: 'C# minor',
  },
  {
    id: 'dark',
    displayName: 'DARK TRAP',
    tagline: 'Minor keys and a slow, menacing crawl.',
    quote: 'COLD AS NIGHT',
    blurb: 'Minor piano-like keys, eerie pads, a distorted 808 and hats that leave room for the dark.',
    tags: ['DARK', 'EERIE', 'HEAVY'],
    lane: 'dark',
    key: 'G minor',
  },
  {
    id: 'atl',
    displayName: 'ATL TRAP',
    tagline: 'The blueprint. Rolling hats, booming 808.',
    quote: 'WHERE IT STARTED',
    blurb: 'Half-time snare, 16th hats that roll into every turn, a long booming 808 and a dark bell loop.',
    tags: ['CLASSIC', 'HARD', 'SOUTHERN'],
    lane: 'atl',
    key: 'E minor',
  },
  {
    id: 'phonk',
    displayName: 'PHONK',
    tagline: 'Cowbells, grime and a slammed 808.',
    quote: 'NIGHT DRIVE',
    blurb: 'A cowbell melody, a heavily distorted 808, crunchy drums and a gritty drifting feel.',
    tags: ['COWBELL', 'GRITTY', 'DRIFT'],
    lane: 'phonk',
    key: 'D minor',
  },
  {
    id: 'plugg',
    displayName: 'PLUGG',
    tagline: 'Soft, floaty, video-game sweet.',
    quote: 'WEIGHTLESS',
    blurb: 'Glassy plucks and bells in a major key, a clean round 808 and light bouncy drums.',
    tags: ['DREAMY', 'SOFT', 'BOUNCY'],
    lane: 'plugg',
    key: 'F major',
  },
]

const STYLE_PROFILES: StyleProfile[] = [rage, ...LANE_STYLES.map(laneProfile)]

const BY_ID = new Map<StyleProfileId, StyleProfile>(
  STYLE_PROFILES.map((profile) => [profile.id, profile]),
)

/** Public, DNA-free list for the UI. */
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
