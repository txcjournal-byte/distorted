import { ChevronIcon, SearchIcon, UserIcon } from '../icons'

const TABS = ['GENERATE', 'EXPLORE', 'LIBRARY', 'PRICING']

export function TopBar() {
  return (
    <header className="topbar">
      <nav className="topbar__tabs" aria-label="Main">
        {TABS.map((tab, index) => (
          <button
            key={tab}
            type="button"
            className={`topbar__tab ${index === 0 ? 'topbar__tab--active' : ''}`}
            aria-current={index === 0 ? 'page' : undefined}
            disabled={index !== 0}
          >
            {tab}
          </button>
        ))}
      </nav>

      <div className="topbar__right">
        <button type="button" className="topbar__search" aria-label="Search" disabled>
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
