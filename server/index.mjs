/**
 * DISTORTED generation proxy.
 *
 * Exists for one reason: the music provider's API key must never reach the
 * browser. The frontend posts a composition plan here; this process adds the
 * key and forwards it to ElevenLabs, then streams the audio back.
 *
 * Run with:  npm run server      (reads .env)
 */
import { createServer } from 'node:http'

try {
  process.loadEnvFile('.env')
} catch {
  // No .env file — fall back to the ambient environment.
}

const PORT = Number(process.env.PORT ?? 8787)
const API_KEY = process.env.ELEVENLABS_API_KEY ?? ''
const MODEL_ID = process.env.ELEVENLABS_MODEL_ID ?? 'music_v2'
const COMPOSE_URL = 'https://api.elevenlabs.io/v1/music/compose'
const MAX_BODY_BYTES = 1_000_000

function send(res, status, payload, headers = {}) {
  const body = typeof payload === 'string' ? payload : JSON.stringify(payload)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    ...headers,
  })
  res.end(body)
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        reject(new Error('REQUEST TOO LARGE'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

/** Turns a provider failure into something the UI can show verbatim. */
function describeFailure(status, raw) {
  let detail
  try {
    detail = JSON.parse(raw)
  } catch {
    detail = null
  }

  const status_ = detail?.detail?.status ?? detail?.status
  const suggestion =
    detail?.detail?.prompt_suggestion ?? detail?.detail?.composition_plan_suggestion ?? null

  if (status === 401) return { status: 401, message: 'API KEY REJECTED — CHECK ELEVENLABS_API_KEY' }
  if (status === 429) return { status: 429, message: 'RATE LIMITED — TRY AGAIN SHORTLY' }

  if (status_ === 'bad_prompt' || status_ === 'bad_composition_plan') {
    return {
      status: 400,
      message: 'PROVIDER REJECTED THE STYLE AS COPYRIGHTED — ADJUST THE STYLE DNA SEEDS',
      suggestion,
    }
  }

  if (status === 422) return { status: 422, message: 'PROVIDER REJECTED THE PLAN — INVALID PARAMETERS', detail }

  return { status: 502, message: `PROVIDER ERROR ${status}`, detail }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)

  if (url.pathname === '/api/health') {
    send(res, 200, { ok: true, provider: 'elevenlabs', model: MODEL_ID, keyConfigured: API_KEY !== '' })
    return
  }

  if (url.pathname !== '/api/generate') {
    send(res, 404, { message: 'NOT FOUND' })
    return
  }

  if (req.method !== 'POST') {
    send(res, 405, { message: 'METHOD NOT ALLOWED' }, { allow: 'POST' })
    return
  }

  if (API_KEY === '') {
    send(res, 503, {
      message: 'NO PROVIDER KEY — SET ELEVENLABS_API_KEY IN .env AND RESTART THE SERVER',
    })
    return
  }

  let plan
  try {
    const raw = await readBody(req)
    const parsed = JSON.parse(raw.toString('utf8'))
    plan = parsed?.plan
  } catch (error) {
    send(res, 400, { message: error instanceof Error ? error.message : 'BAD REQUEST' })
    return
  }

  if (!plan || !Array.isArray(plan.chunks) || plan.chunks.length === 0) {
    send(res, 400, { message: 'MISSING COMPOSITION PLAN' })
    return
  }

  try {
    const upstream = await fetch(COMPOSE_URL, {
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ composition_plan: plan, model_id: MODEL_ID }),
    })

    if (!upstream.ok) {
      const raw = await upstream.text()
      const failure = describeFailure(upstream.status, raw)
      console.error(`[generate] provider ${upstream.status}: ${raw.slice(0, 500)}`)
      send(res, failure.status, failure)
      return
    }

    const audio = Buffer.from(await upstream.arrayBuffer())
    res.writeHead(200, {
      'content-type': upstream.headers.get('content-type') ?? 'audio/mpeg',
      'content-length': String(audio.length),
      'cache-control': 'no-store',
    })
    res.end(audio)
    console.log(`[generate] ok — ${plan.chunks.length} chunks, ${(audio.length / 1024).toFixed(0)} kB`)
  } catch (error) {
    console.error('[generate] request failed:', error)
    send(res, 502, { message: 'COULD NOT REACH THE PROVIDER' })
  }
})

server.listen(PORT, () => {
  console.log(`DISTORTED generation proxy on http://localhost:${PORT}`)
  console.log(`provider: elevenlabs · model: ${MODEL_ID} · key: ${API_KEY ? 'configured' : 'MISSING'}`)
})
