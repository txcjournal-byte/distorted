/**
 * Serverless generation endpoint (Vercel, or any host with the same runtime).
 *
 * Same job as server/index.mjs: hold the API key so the browser never sees it.
 * Deploying this is what turns DISTORTED into a URL you just open.
 */
import { ACCESS_DENIED, accessGranted, compose, validateRequest } from '../server/compose.mjs'

export const config = {
  // Generation takes a while; the default function timeout is too short.
  maxDuration: 300,
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('allow', 'POST')
    res.status(405).json({ message: 'METHOD NOT ALLOWED' })
    return
  }

  const apiKey = (process.env.ELEVENLABS_API_KEY ?? '').trim()
  if (apiKey === '') {
    res.status(503).json({
      message: 'NO PROVIDER KEY — ADD ELEVENLABS_API_KEY IN THE PROJECT SETTINGS AND REDEPLOY',
    })
    return
  }

  if (!accessGranted(req.headers['x-access-code'])) {
    res.status(401).json(ACCESS_DENIED)
    return
  }

  const input = req.body
  const problem = validateRequest(input)
  if (problem) {
    res.status(400).json({ message: problem })
    return
  }

  try {
    const result = await compose(input, {
      apiKey,
      modelId: process.env.ELEVENLABS_MODEL_ID ?? 'music_v2',
    })

    if (!result.ok) {
      res.status(result.failure.status).json(result.failure)
      return
    }

    res.setHeader('content-type', result.contentType)
    res.setHeader('cache-control', 'no-store')
    res.status(200).send(result.audio)
  } catch (error) {
    console.error('[generate] request failed:', error)
    res.status(502).json({ message: 'COULD NOT REACH THE PROVIDER' })
  }
}
