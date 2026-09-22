/**
 * Provider call, shared by the local proxy (server/index.mjs) and the
 * serverless function (api/generate.js) so both behave identically.
 */

const COMPOSE_URL = 'https://api.elevenlabs.io/v1/music/compose'

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

  if (status === 401) return { status: 401, message: 'API KEY REJECTED — CHECK ELEVENLABS_API_KEY' }
  if (status === 429) return { status: 429, message: 'RATE LIMITED — TRY AGAIN SHORTLY' }

  if (kind === 'bad_prompt' || kind === 'bad_composition_plan') {
    return {
      status: 400,
      message: 'PROVIDER REJECTED THE STYLE AS COPYRIGHTED — ADJUST THE STYLE DNA SEEDS',
      suggestion,
    }
  }

  if (status === 422) {
    return { status: 422, message: 'PROVIDER REJECTED THE PLAN — INVALID PARAMETERS', detail }
  }

  return { status: 502, message: `PROVIDER ERROR ${status}`, detail }
}

/**
 * Sends a composition plan to ElevenLabs.
 * Resolves to `{ ok: true, audio, contentType }` or `{ ok: false, failure }`.
 */
export async function compose(plan, { apiKey, modelId = 'music_v2' }) {
  const upstream = await fetch(COMPOSE_URL, {
    method: 'POST',
    headers: { 'xi-api-key': apiKey, 'content-type': 'application/json' },
    body: JSON.stringify({ composition_plan: plan, model_id: modelId }),
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

export function validatePlan(plan) {
  if (!plan || !Array.isArray(plan.chunks) || plan.chunks.length === 0) {
    return 'MISSING COMPOSITION PLAN'
  }
  return null
}
