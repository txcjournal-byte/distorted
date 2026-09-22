import { useCallback, useEffect, useState } from 'react'
import type { GeneratedTrack } from '../generation/types'
import { forgetAudio, primeAudio } from '../library/audio'
import { deleteAudio, loadSongs, putAudio, saveSongs, toRecord, type SongRecord } from '../library/store'

/** The persisted list of songs, newest first. */
export function useLibrary() {
  const [songs, setSongs] = useState<SongRecord[]>(() => loadSongs())

  useEffect(() => {
    saveSongs(songs)
  }, [songs])

  const add = useCallback((track: GeneratedTrack) => {
    const record = toRecord(track)
    if (track.audio) primeAudio(record.id, track.audio.url)
    setSongs((prev) => [record, ...prev.filter((song) => song.id !== record.id)])

    // Model output cannot be rebuilt from a recipe, so keep the file itself.
    if (track.audio && !track.recipe) {
      void putAudio(record.id, track.audio.blob).then((stored) => {
        if (!stored) return
        setSongs((prev) => prev.map((song) => (song.id === record.id ? { ...song, storedAudio: true } : song)))
      })
    }
    return record
  }, [])

  const remove = useCallback((id: string) => {
    forgetAudio(id)
    void deleteAudio(id)
    setSongs((prev) => prev.filter((song) => song.id !== id))
  }, [])

  const toggleLike = useCallback((id: string) => {
    setSongs((prev) => prev.map((song) => (song.id === id ? { ...song, liked: !song.liked } : song)))
  }, [])

  const rename = useCallback((id: string, title: string) => {
    const clean = title.trim().slice(0, 80)
    if (clean === '') return
    setSongs((prev) => prev.map((song) => (song.id === id ? { ...song, title: clean.toUpperCase() } : song)))
  }, [])

  return { songs, add, remove, toggleLike, rename }
}
