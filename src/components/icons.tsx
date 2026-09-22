interface IconProps {
  className?: string
}

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function WaveIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" width="18" height="18" {...base} aria-hidden="true">
      <path d="M3 8v4M6.5 5v10M10 3v14M13.5 6v8M17 8.5v3" />
    </svg>
  )
}

export function PlaylistIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" width="18" height="18" {...base} aria-hidden="true">
      <rect x="2.5" y="4" width="15" height="12" rx="2" />
      <path d="M8.5 8.2v3.6L12 10z" />
    </svg>
  )
}

export function UserIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" width="18" height="18" {...base} aria-hidden="true">
      <circle cx="10" cy="7" r="3" />
      <path d="M4 16.5c0-2.8 2.7-4.5 6-4.5s6 1.7 6 4.5" />
    </svg>
  )
}

export function LibraryIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" width="18" height="18" {...base} aria-hidden="true">
      <rect x="3" y="3" width="10" height="14" rx="1.5" />
      <path d="M15.5 5.5 17 15.2" />
    </svg>
  )
}

export function SettingsIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" width="18" height="18" {...base} aria-hidden="true">
      <circle cx="10" cy="10" r="2.6" />
      <path d="M10 2.5v2M10 15.5v2M17.5 10h-2M4.5 10h-2M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4M15.3 15.3l-1.4-1.4M6.1 6.1 4.7 4.7" />
    </svg>
  )
}

export function SearchIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" width="18" height="18" {...base} aria-hidden="true">
      <circle cx="9" cy="9" r="5.5" />
      <path d="m13.2 13.2 3.3 3.3" />
    </svg>
  )
}

export function ChevronIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" width="16" height="16" {...base} aria-hidden="true">
      <path d="m5.5 8 4.5 4.5L14.5 8" />
    </svg>
  )
}

export function ArrowIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 20" width="22" height="18" {...base} aria-hidden="true">
      <path d="M3 10h17M14.5 4.5 20.5 10l-6 5.5" />
    </svg>
  )
}

export function GlobeIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" width="30" height="30" {...base} aria-hidden="true">
      <circle cx="16" cy="16" r="12" />
      <path d="M4 16h24M16 4c3.5 4 3.5 20 0 24M16 4c-3.5 4-3.5 20 0 24" />
    </svg>
  )
}
