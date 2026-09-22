import { DistressedTitle } from '../DistressedTitle'
import {
  GlobeIcon,
  LibraryIcon,
  PlaylistIcon,
  SettingsIcon,
  UserIcon,
  WaveIcon,
} from '../icons'

const NAV = [
  { label: 'Generate', Icon: WaveIcon },
  { label: 'My Songs', Icon: PlaylistIcon },
  { label: 'Artists', Icon: UserIcon },
  { label: 'Style Library', Icon: LibraryIcon },
  { label: 'Settings', Icon: SettingsIcon },
]

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <DistressedTitle text="DISTORTED" uid="side" className="sidebar__logo" />
        <p className="sidebar__motto">MUSIC BEYOND NORMAL</p>
      </div>

      <nav className="sidebar__nav" aria-label="Sections">
        {NAV.map(({ label, Icon }, index) => (
          <button
            key={label}
            type="button"
            className={`nav-item ${index === 0 ? 'nav-item--active' : ''}`}
            aria-current={index === 0 ? 'page' : undefined}
            // Prototype: only Generate exists. The rest are laid in, not wired.
            disabled={index !== 0}
          >
            <Icon className="nav-item__icon" />
            <span>{label}</span>
          </button>
        ))}
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
