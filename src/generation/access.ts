/**
 * The access code a locked deployment asks for (see ACCESS_CODE on the
 * server). Remembered in this browser so it is typed once.
 */
const KEY = 'distorted.access-code'

export function getAccessCode(): string {
  try {
    return localStorage.getItem(KEY) ?? ''
  } catch {
    return ''
  }
}

export function setAccessCode(code: string): void {
  try {
    if (code.trim() === '') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, code.trim())
  } catch {
    // Storage blocked; the code then lasts for this page only.
  }
  memory = code.trim()
}

let memory = ''

/** Storage first, then what was typed this session. */
export function currentAccessCode(): string {
  return getAccessCode() || memory
}
