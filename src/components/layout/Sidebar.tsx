import { DistressedTitle } from '../DistressedTitle'
import {
  GlobeIcon,
  LibraryIcon,
  PlaylistIcon,
  SettingsIcon,
  UserIcon,
  WaveIcon,
} from '../icons'

import type { Page } from './nav'

type Target = Page | 'artists' | null

const NAV: { label: string; Icon: typeof WaveIcon; target: Target }[] = [
  { label: 'Generate', Icon: WaveIcon, target: 'generate' },
  { label: 'My Songs', Icon: PlaylistIcon, target: 'library' },
  { label: 'Artists', Icon: UserIcon, target: 'artists' },
  { label: 'Style Library', Icon: LibraryIcon, target: null },
  { label: 'Settings', Icon: SettingsIcon, target: null },
]

interface SidebarProps {
  page: Page
  songCount: number
  onNavigate: (page: Page) => void
  onArtists: () => void
}

export function Sidebar({ page, songCount, onNavigate, onArtists }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <DistressedTitle text="DISTORTED" uid="side" className="sidebar__logo" />
        <p className="sidebar__motto">MUSIC BEYOND NORMAL</p>
      </div>

      <nav className="sidebar__nav" aria-label="Sections">
        {NAV.map(({ label, Icon, target }) => {
          const active = target === page
          return (
            <button
              key={label}
              type="button"
              className={`nav-item ${active ? 'nav-item--active' : ''}`}
              aria-current={active ? 'page' : undefined}
              // Style Library and Settings are laid in, not wired yet.
              disabled={target === null}
              onClick={() => {
                if (target === 'artists') onArtists()
                else if (target) onNavigate(target)
              }}
            >
              <Icon className="nav-item__icon" />
              <span>{label}</span>
              {target === 'library' && songCount > 0 && <span className="nav-item__badge">{songCount}</span>}
            </button>
          )
        })}
      </nav>

      <div className="sidebar__art" aria-hidden="true">
        <span className="sidebar__scrawl">
          Music
          <br />
          for a
          <br />
          broken
          <br />
          world
        </span>
        <GlobeIcon className="sidebar__globe" />
      </div>

      <p className="sidebar__legal">
        © 2024 DISTORTED
        <br />
        ALL RIGHTS RESERVED.
      </p>
    </aside>
  )
}
