/**
 * Starts everything with one command: the generation proxy and Vite.
 *
 * Nothing to configure: the app asks /api/health at runtime which engine it
 * can use, so a key in .env is the only switch.
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

console.log('')
if (hasKey) {
  console.log('  Real generation is ON — tracks with vocals.')
} else {
  console.log('  Real generation is OFF — you get the local instrumental, no vocals.')
  console.log('  To turn it on, put your key in .env as ELEVENLABS_API_KEY and restart.')
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

start('server', process.execPath, ['server/index.mjs'])
start('vite', 'npx', ['vite'])
