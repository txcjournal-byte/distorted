import type { ArtistSummary, StyleProfile, StyleProfileId } from './types'
import { toArtistSummary } from './types'
import { trippieRedd } from './artists/trippie-redd'

/**
 * The registry is the single place a new artist gets plugged in:
 *   1. add `src/style-dna/artists/<slug>.ts` exporting a StyleProfile
 *   2. import it here and push it into STYLE_PROFILES
 * Nothing else in the app needs to change.
 */
const STYLE_PROFILES: StyleProfile[] = [trippieRedd]

const BY_ID = new Map<StyleProfileId, StyleProfile>(
  STYLE_PROFILES.map((profile) => [profile.id, profile]),
)

/** Public, DNA-free list for the UI. */
export function listArtists(): ArtistSummary[] {
  return STYLE_PROFILES.map(toArtistSummary)
}

/** Internal lookup. Only generation code should call this. */
export function getStyleProfile(id: StyleProfileId): StyleProfile | undefined {
  return BY_ID.get(id)
}

export function getDefaultArtistId(): StyleProfileId {
  return STYLE_PROFILES[0].id
}
