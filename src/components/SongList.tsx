import type { SongRecord } from '../library/store'
import { SongRow, type SongActions } from './SongRow'

interface SongListProps extends SongActions {
  songs: SongRecord[]
  currentId: string | null
  playing: boolean
  loading: boolean
  progress: number
}

export function SongList({ songs, currentId, playing, loading, progress, ...actions }: SongListProps) {
  return (
    <div className="songlist">
      {songs.map((song) => {
        const active = song.id === currentId
        return (
          <SongRow
            key={song.id}
            song={song}
            active={active}
            playing={active && playing}
            loading={active && loading}
            progress={active ? progress : 0}
            {...actions}
          />
        )
      })}
    </div>
  )
}
