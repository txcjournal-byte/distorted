export function formatDuration(totalSeconds: number): string {
  const safe = Number.isFinite(totalSeconds) ? Math.max(0, Math.floor(totalSeconds)) : 0
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function formatAge(iso: string): string {
  const seconds = (Date.now() - new Date(iso).getTime()) / 1000
  if (!Number.isFinite(seconds) || seconds < 60) return 'JUST NOW'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}M AGO`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}H AGO`
  return `${Math.floor(seconds / 86400)}D AGO`
}
