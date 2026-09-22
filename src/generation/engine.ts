import { LocalSynthEngine } from './engines/local'
import { MockMusicEngine } from './engines/mock'
import type { MusicEngine } from './types'

export * from './types'

/**
 * Engine selection.
 *
 * 'local' renders audible audio in the browser from the Style DNA — no key, no
 * network, but instrumental only. 'mock' fakes the stages and returns no audio.
 *
 * A real music model plugs in here: implement MusicEngine against the provider
 * (submit job, poll, fetch the audio) and add it to ENGINES. Because the API key
 * must not ship to the browser, that implementation should call your own server,
 * not the provider directly.
 */
const ENGINES: Record<string, () => MusicEngine> = {
  local: () => new LocalSynthEngine(),
  mock: () => new MockMusicEngine(),
}

const selected = (import.meta.env.VITE_ENGINE as string | undefined) ?? 'local'

export const musicEngine: MusicEngine = (ENGINES[selected] ?? ENGINES.local)()
