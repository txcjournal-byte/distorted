import { renderRecipeToWav } from '../generation/engines/local'
import { getAudio, type SongRecord } from './store'

/**
 * Object URLs for playback, keyed by song id.
 *
 * A local render is ~25 MB of WAV, so only the few most recent stay in
 * memory; anything evicted is rebuilt from its recipe or read back from
 * IndexedDB the next time it is played.
 */

const MAX_CACHED = 6
const cache = new Map<string, string>()
const pending = new Map<string, Promise<string | null>>()
/** The song in the player. Never evicted: revoking its URL would stop it. */
let pinned: string | null = null

export function pinAudio(id: string | null) {
  pinned = id
}

function remember(id: string, url: string) {
  cache.delete(id)
  cache.set(id, url)
  for (const [oldId, oldUrl] of cache) {
    if (cache.size <= MAX_CACHED) break
    if (oldId === pinned || oldId === id) continue
    cache.delete(oldId)
    URL.revokeObjectURL(oldUrl)
  }
}

/** Hands an already-made URL (fresh from an engine) to the cache. */
export function primeAudio(id: string, url: string) {
  remember(id, url)
}

export function forgetAudio(id: string) {
  const url = cache.get(id)
  if (url) URL.revokeObjectURL(url)
  cache.delete(id)
}

/** Resolves a playable URL, rebuilding or loading the audio if needed. */
export function audioUrlFor(song: SongRecord): Promise<string | null> {
  const hit = cache.get(song.id)
  if (hit) {
    remember(song.id, hit)
    return Promise.resolve(hit)
  }

  const inFlight = pending.get(song.id)
  if (inFlight) return inFlight

  const job = (async () => {
    let blob: Blob | null = null
    if (song.storedAudio) blob = await getAudio(song.id)
    if (!blob && song.recipe) blob = await renderRecipeToWav(song.recipe)
    if (!blob) return null
    const url = URL.createObjectURL(blob)
    remember(song.id, url)
    return url
  })().finally(() => pending.delete(song.id))

  pending.set(song.id, job)
  return job
}

export function fileNameFor(song: SongRecord, extension: string): string {
  const slug = song.title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
  return `${slug || 'distorted'}.${extension}`
}

export async function downloadSong(song: SongRecord): Promise<void> {
  const url = await audioUrlFor(song)
  if (!url) throw new Error('AUDIO NOT AVAILABLE FOR THIS SONG')
  const blob = await fetch(url).then((response) => response.blob())
  const extension = blob.type.includes('mpeg') ? 'mp3' : 'wav'
  const link = document.createElement('a')
  link.href = url
  link.download = fileNameFor(song, extension)
  document.body.appendChild(link)
  link.click()
  link.remove()
}
