/**
 * Starts everything with one command: the generation proxy and Vite.
 *
 * Picks the engine itself — `elevenlabs` when a key is configured, `local`
 * otherwise — so nobody has to set a shell variable, which is spelled
 * differently on every platform.
 */
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'

if (existsSync('.env')) {
  try {
    process.loadEnvFile('.env')
  } catch (error) {
    console.error('Could not read .env:', error.message)
  }
}

const hasKey = (process.env.ELEVENLABS_API_KEY ?? '').trim() !== ''
const engine = (process.env.VITE_ENGINE ?? '').trim() || (hasKey ? 'elevenlabs' : 'local')

console.log('')
if (engine === 'elevenlabs') {
  console.log('  Engine: ELEVENLABS — real tracks with vocals.')
} else {
  console.log('  Engine: LOCAL — instrumental rendered in the browser, no vocals.')
  console.log('  For real generation put a key in .env as ELEVENLABS_API_KEY and restart.')
}
console.log('')

const children = []

function start(name, command, args, env) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, ...env },
  })
  child.on('exit', (code) => {
    if (code !== 0 && code !== null) console.error(`${name} exited with code ${code}`)
    shutdown()
  })
  children.push(child)
  return child
}

let stopping = false
function shutdown() {
  if (stopping) return
  stopping = true
  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM')
  }
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

if (engine === 'elevenlabs') start('server', process.execPath, ['server/index.mjs'])
start('vite', 'npx', ['vite'], { VITE_ENGINE: engine })
