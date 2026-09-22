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
import { compose, validatePlan } from './compose.mjs'

try {
  process.loadEnvFile('.env')
} catch {
  // No .env file — fall back to the ambient environment.
}

const PORT = Number(process.env.PORT ?? 8787)
const API_KEY = process.env.ELEVENLABS_API_KEY ?? ''
const MODEL_ID = process.env.ELEVENLABS_MODEL_ID ?? 'music_v2'
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

  const problem = validatePlan(plan)
  if (problem) {
    send(res, 400, { message: problem })
    return
  }

  try {
    const result = await compose(plan, { apiKey: API_KEY, modelId: MODEL_ID })

    if (!result.ok) {
      send(res, result.failure.status, result.failure)
      return
    }

    res.writeHead(200, {
      'content-type': result.contentType,
      'content-length': String(result.audio.length),
      'cache-control': 'no-store',
    })
    res.end(result.audio)
    console.log(`[generate] ok — ${plan.chunks.length} chunks, ${(result.audio.length / 1024).toFixed(0)} kB`)
  } catch (error) {
    console.error('[generate] request failed:', error)
    send(res, 502, { message: 'COULD NOT REACH THE PROVIDER' })
  }
})

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\nPort ${PORT} is already in use — another copy of the server is probably running.`)
    console.error(`Stop it, or set a different PORT in .env.\n`)
    process.exit(1)
  }
  throw error
})

server.listen(PORT, () => {
  console.log(`DISTORTED generation proxy on http://localhost:${PORT}`)
  console.log(`provider: elevenlabs · model: ${MODEL_ID} · key: ${API_KEY ? 'configured' : 'MISSING'}`)
})
