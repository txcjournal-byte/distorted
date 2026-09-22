import { ChevronIcon, SearchIcon, UserIcon } from '../icons'
import type { Page } from './nav'

const TABS: { label: string; page: Page | null }[] = [
  { label: 'GENERATE', page: 'generate' },
  { label: 'EXPLORE', page: null },
  { label: 'LIBRARY', page: 'library' },
  { label: 'PRICING', page: null },
]

interface TopBarProps {
  page: Page
  onNavigate: (page: Page) => void
}

export function TopBar({ page, onNavigate }: TopBarProps) {
  return (
    <header className="topbar">
      <nav className="topbar__tabs" aria-label="Main">
        {TABS.map((tab) => {
          const active = tab.page === page
          return (
            <button
              key={tab.label}
              type="button"
              className={`topbar__tab ${active ? 'topbar__tab--active' : ''}`}
              aria-current={active ? 'page' : undefined}
              disabled={tab.page === null}
              onClick={() => tab.page && onNavigate(tab.page)}
            >
              {tab.label}
            </button>
          )
        })}
      </nav>

      <div className="topbar__right">
        <button type="button" className="topbar__search" aria-label="Search your songs" onClick={() => onNavigate('library')}>
          <SearchIcon />
        </button>
        <button type="button" className="topbar__user" disabled>
          <span className="topbar__avatar" aria-hidden="true">
            <UserIcon />
          </span>
          <span>USER</span>
          <ChevronIcon />
        </button>
      </div>
    </header>
  )
}
