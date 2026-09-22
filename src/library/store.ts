import type { GeneratedTrack } from '../generation/types'
import type { SongRecipe } from '../generation/recipe'

/**
 * The song library — "My Songs".
 *
 * Metadata lives in localStorage. Audio does not: a local render is rebuilt
 * from its recipe on demand (same recipe, same WAV), and only model output,
 * which cannot be rebuilt, is kept as a blob in IndexedDB.
 *
 * Everything stays in this browser. Nothing is uploaded.
 */

export interface SongRecord {
  id: string
  title: string
  artistId: string
  artistName: string
  createdAt: string
  durationSeconds: number
  tempo: number
  key: string
  waveform: number[]
  sections: { label: string; startSeconds: number }[]
  engine: string
  lyrics: string
  instrumental: boolean
  /** Rebuilds the audio for local renders. */
  recipe: SongRecipe | null
  /** True when the audio blob is in IndexedDB. */
  storedAudio: boolean
  liked: boolean
}

const STORAGE_KEY = 'distorted.library.v1'

export function toRecord(track: GeneratedTrack): SongRecord {
  return {
    id: track.id,
    title: track.title,
    artistId: track.artistId,
    artistName: track.artistName,
    createdAt: track.createdAt,
    durationSeconds: track.durationSeconds,
    tempo: track.tempo,
    key: track.key,
    waveform: track.waveform.map((value) => Math.round(value * 100) / 100),
    sections: track.sections,
    engine: track.engine,
    lyrics: track.lyrics,
    instrumental: track.audio?.instrumental ?? true,
    recipe: track.recipe,
    storedAudio: false,
    liked: false,
  }
}

export function loadSongs(): SongRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as SongRecord[]) : []
  } catch {
    return []
  }
}

export function saveSongs(songs: SongRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(songs))
  } catch {
    // Storage full or blocked (private mode). The session still works.
  }
}

/* ------------------------------------------------------------------------ */
/* IndexedDB, for audio that cannot be rebuilt                              */
/* ------------------------------------------------------------------------ */

const DB_NAME = 'distorted'
const STORE = 'audio'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'))
      return
    }
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb()
  try {
    return await new Promise<T>((resolve, reject) => {
      const request = run(db.transaction(STORE, mode).objectStore(STORE))
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  } finally {
    db.close()
  }
}

export async function putAudio(id: string, blob: Blob): Promise<boolean> {
  try {
    await withStore('readwrite', (store) => store.put(blob, id))
    return true
  } catch {
    return false
  }
}

export async function getAudio(id: string): Promise<Blob | null> {
  try {
    const blob = await withStore<Blob | undefined>('readonly', (store) => store.get(id))
    return blob ?? null
  } catch {
    return null
  }
}

export async function deleteAudio(id: string): Promise<void> {
  try {
    await withStore('readwrite', (store) => store.delete(id))
  } catch {
    // Nothing stored, or storage unavailable.
  }
}
