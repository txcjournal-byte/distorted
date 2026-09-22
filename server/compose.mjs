/**
 * Provider call, shared by the local proxy (server/index.mjs) and the
 * serverless function (api/generate.js) so both behave identically.
 */
import { timingSafeEqual } from 'node:crypto'

/**
 * Every generation is billed to the operator's provider key, so a public
 * deployment can lock generation behind ACCESS_CODE. Unset means open.
 */
export function accessRequired() {
  return (process.env.ACCESS_CODE ?? '').trim() !== ''
}

export function accessGranted(provided) {
  const expected = (process.env.ACCESS_CODE ?? '').trim()
  if (expected === '') return true
  const given = Buffer.from(String(provided ?? '').trim())
  const wanted = Buffer.from(expected)
  return given.length === wanted.length && timingSafeEqual(given, wanted)
}

export const ACCESS_DENIED = { code: 'access_required', message: 'ACCESS CODE REQUIRED OR WRONG' }

// POST /v1/music takes either `prompt` or `composition_plan` (see the
// official @elevenlabs/elevenlabs-js SDK, music.compose).
const COMPOSE_URL = 'https://api.elevenlabs.io/v1/music'

/** Turns a provider failure into something the UI can show verbatim. */
export function describeFailure(status, raw) {
  let detail
  try {
    detail = JSON.parse(raw)
  } catch {
    detail = null
  }

  const kind = detail?.detail?.status ?? detail?.status
  const suggestion =
    detail?.detail?.prompt_suggestion ?? detail?.detail?.composition_plan_suggestion ?? null

  // The provider's own words say whether the key is wrong, lacks the music
  // permission, or the plan does not include music — pass them through.
  const reason = detail?.detail?.message ?? (typeof detail?.detail === 'string' ? detail.detail : null)
  const why = reason ? ` — ${String(reason).slice(0, 200).toUpperCase()}` : ''

  if (status === 401) return { status: 401, message: `API KEY REJECTED${why || ' — CHECK ELEVENLABS_API_KEY'}` }
  if (status === 402) return { status: 402, message: `ELEVENLABS PLAN OR CREDITS DO NOT COVER MUSIC${why}` }
  if (status === 403) return { status: 403, message: `ELEVENLABS REFUSED THE REQUEST${why}` }
  if (status === 429) return { status: 429, message: 'RATE LIMITED — TRY AGAIN SHORTLY' }

  if (kind === 'bad_prompt' || kind === 'bad_composition_plan') {
    return {
      status: 400,
      message: 'PROVIDER REJECTED THE STYLE AS COPYRIGHTED — REMOVE ARTIST NAMES FROM THE DESCRIPTION',
      suggestion,
    }
  }

  if (status === 422) {
    return { status: 422, message: `PROVIDER REJECTED THE PLAN — INVALID PARAMETERS${why}`, detail }
  }

  return { status: 502, message: `PROVIDER ERROR ${status}${why}`, detail }
}

const MIN_LENGTH_MS = 10_000
const MAX_LENGTH_MS = 300_000

/**
 * Builds the provider body from what the browser sent. Two shapes:
 *   { plan }                                  — custom lyrics, section by section
 *   { prompt, lengthMs, instrumental }        — a description; the model writes
 *                                               its own lyrics unless instrumental
 */
function providerBody(input, modelId) {
  if (input.plan) return { composition_plan: input.plan, model_id: modelId }

  const length = Math.round(Number(input.lengthMs) || 120_000)
  return {
    prompt: String(input.prompt).slice(0, 4000),
    music_length_ms: Math.min(MAX_LENGTH_MS, Math.max(MIN_LENGTH_MS, length)),
    force_instrumental: Boolean(input.instrumental),
    model_id: modelId,
  }
}

/**
 * Sends a composition plan or a prompt to ElevenLabs.
 * Resolves to `{ ok: true, audio, contentType }` or `{ ok: false, failure }`.
 */
export async function compose(input, { apiKey, modelId = 'music_v2' }) {
  const upstream = await fetch(COMPOSE_URL, {
    method: 'POST',
    headers: { 'xi-api-key': apiKey, 'content-type': 'application/json' },
    body: JSON.stringify(providerBody(input, modelId)),
  })

  if (!upstream.ok) {
    const raw = await upstream.text()
    console.error(`[compose] provider ${upstream.status}: ${raw.slice(0, 500)}`)
    return { ok: false, failure: describeFailure(upstream.status, raw) }
  }

  return {
    ok: true,
    audio: Buffer.from(await upstream.arrayBuffer()),
    contentType: upstream.headers.get('content-type') ?? 'audio/mpeg',
  }
}

/** Returns an error message, or null when the request is usable. */
export function validateRequest(input) {
  if (!input || typeof input !== 'object') return 'EMPTY REQUEST'
  if (input.plan) {
    if (!Array.isArray(input.plan.chunks) || input.plan.chunks.length === 0) {
      return 'MISSING COMPOSITION PLAN'
    }
    return null
  }
  if (typeof input.prompt !== 'string' || input.prompt.trim() === '') return 'MISSING PROMPT'
  return null
}
