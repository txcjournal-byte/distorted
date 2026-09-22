import { accessRequired } from '../server/compose.mjs'

/** Lets the frontend discover whether real generation is available. */
export default function handler(_req, res) {
  res.setHeader('cache-control', 'no-store')
  res.status(200).json({
    ok: true,
    provider: 'elevenlabs',
    model: process.env.ELEVENLABS_MODEL_ID ?? 'music_v2',
    keyConfigured: (process.env.ELEVENLABS_API_KEY ?? '').trim() !== '',
    accessRequired: accessRequired(),
  })
}
