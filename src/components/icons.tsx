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

export function PlayIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M8 5v14l11-7z" fill="currentColor" />
    </svg>
  )
}

export function PauseIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <rect x="6" y="5" width="4" height="14" fill="currentColor" />
      <rect x="14" y="5" width="4" height="14" fill="currentColor" />
    </svg>
  )
}

export function SkipIcon({ className, back = false }: IconProps & { back?: boolean }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      style={back ? { transform: 'scaleX(-1)' } : undefined}
    >
      <path d="M6 6v12l9-6z" fill="currentColor" />
      <rect x="16" y="6" width="2.4" height="12" fill="currentColor" />
    </svg>
  )
}

export function HeartIcon({ className, filled = false }: IconProps & { filled?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 20 20" width="17" height="17" {...base} fill={filled ? 'currentColor' : 'none'} aria-hidden="true">
      <path d="M10 16.5s-6-3.7-6-8A3.3 3.3 0 0 1 10 6.3 3.3 3.3 0 0 1 16 8.5c0 4.3-6 8-6 8z" />
    </svg>
  )
}

export function DownloadIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" width="17" height="17" {...base} aria-hidden="true">
      <path d="M10 3v9M6 8.5 10 12.5 14 8.5M4 16h12" />
    </svg>
  )
}

export function TrashIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" width="17" height="17" {...base} aria-hidden="true">
      <path d="M4 6h12M8 6V4h4v2M5.5 6l.8 10h7.4l.8-10" />
    </svg>
  )
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" width="16" height="16" {...base} aria-hidden="true">
      <path d="m5 5 10 10M15 5 5 15" />
    </svg>
  )
}
