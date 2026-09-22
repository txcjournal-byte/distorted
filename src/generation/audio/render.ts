import type { StyleProfile } from '../../style-dna/types'
import { createRandom } from '../random'
import { degreeToMidi, midiToFreq, parseKey, scaleSteps } from './theory'

/**
 * Local audio renderer.
 *
 * This is NOT a music model and does not write songs — it is a procedural
 * sketch that turns the Style DNA's parameters (tempo, key, arrangement,
 * distortion, saturation, palette) into something audible, so the generate
 * flow can be tested end to end without a provider. The motif is generated
 * from the seed; nothing is lifted from any record.
 *
 * It is instrumental. Singing the lyrics needs a real music model.
 *
 * Built by rendering a handful of short cells and tiling them, rather than
 * scheduling every hit in one graph: rage is loop-driven anyway, and a single
 * graph of thousands of nodes takes far too long to render.
 */

export interface RenderedSection {
  label: string
  startSeconds: number
}

export interface RenderResult {
  buffer: AudioBuffer
  tempo: number
  keyLabel: string
  sections: RenderedSection[]
  durationSeconds: number
}

type SectionKind = 'intro' | 'hook' | 'verse' | 'outro'

const SECTION_BARS: Record<SectionKind, number> = { intro: 4, hook: 8, verse: 8, outro: 4 }
const CELL_BARS = 4
const SAMPLE_RATE = 44100
const MAX_SECONDS = 150

function classify(label: string): SectionKind {
  const text = label.toLowerCase()
  if (text.includes('intro')) return 'intro'
  if (text.includes('outro')) return 'outro'
  if (text.includes('hook') || text.includes('chorus')) return 'hook'
  return 'verse'
}

/** Standard soft-clip curve; `amount` 0..1 maps to gentle..aggressive. */
function distortionCurve(amount: number): Float32Array<ArrayBuffer> {
  const k = 4 + amount * 160
  const samples = 1024
  const curve = new Float32Array(new ArrayBuffer(samples * 4))
  for (let i = 0; i < samples; i += 1) {
    const x = (i * 2) / samples - 1
    curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x))
  }
  return curve
}

function makeNoise(ctx: BaseAudioContext, random: () => number): AudioBuffer {
  const buffer = ctx.createBuffer(1, SAMPLE_RATE / 2, SAMPLE_RATE)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i += 1) data[i] = random() * 2 - 1
  return buffer
}

interface CellContext {
  ctx: OfflineAudioContext
  out: AudioNode
  noise: AudioBuffer
  random: () => number
  dna: StyleProfile['dna']
}

function kick({ ctx, out }: CellContext, time: number) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(140, time)
  osc.frequency.exponentialRampToValueAtTime(48, time + 0.09)
  gain.gain.setValueAtTime(0.62, time)
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3)
  osc.connect(gain)
  gain.connect(out)
  osc.start(time)
  osc.stop(time + 0.34)
}

/** Distorted 808, optionally gliding in from the previous root. */
function eightOhEight(cell: CellContext, time: number, midi: number, length: number, glideFrom?: number) {
  const { ctx, out, dna } = cell
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  const drive = ctx.createWaveShaper()
  drive.curve = distortionCurve(dna.production.distortion)
  drive.oversample = '2x'

  osc.type = 'sine'
  if (glideFrom !== undefined) {
    osc.frequency.setValueAtTime(midiToFreq(glideFrom), time)
    osc.frequency.exponentialRampToValueAtTime(midiToFreq(midi), time + 0.12)
  } else {
    osc.frequency.setValueAtTime(midiToFreq(midi), time)
  }

  gain.gain.setValueAtTime(0.0001, time)
  gain.gain.exponentialRampToValueAtTime(0.5, time + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.12, time + length * 0.5)
  gain.gain.exponentialRampToValueAtTime(0.001, time + length)

  // The shaper drives anything up to roughly full scale, so the level that
  // decides how much 808 is in the mix has to sit AFTER it, not before.
  const level = ctx.createGain()
  level.gain.value = 0.3

  osc.connect(gain)
  gain.connect(drive)
  drive.connect(level)
  level.connect(out)
  osc.start(time)
  osc.stop(time + length + 0.05)
}

function hat(cell: CellContext, time: number, level: number, decay: number) {
  const { ctx, out, noise, random } = cell
  const source = ctx.createBufferSource()
  const filter = ctx.createBiquadFilter()
  const gain = ctx.createGain()

  source.buffer = noise
  source.playbackRate.value = 1.4 + random() * 0.5
  filter.type = 'highpass'
  filter.frequency.value = 7200
  gain.gain.setValueAtTime(level, time)
  gain.gain.exponentialRampToValueAtTime(0.0008, time + decay)

  source.connect(filter)
  filter.connect(gain)
  gain.connect(out)
  source.start(time)
  source.stop(time + decay + 0.02)
}

function clap(cell: CellContext, time: number) {
  const { ctx, out, noise } = cell
  // Offset taps read as a clap rather than one flat burst.
  for (let i = 0; i < 3; i += 1) {
    const at = time + i * 0.011
    const source = ctx.createBufferSource()
    const filter = ctx.createBiquadFilter()
    const gain = ctx.createGain()
    source.buffer = noise
    filter.type = 'bandpass'
    filter.frequency.value = 1700
    filter.Q.value = 1.1
    gain.gain.setValueAtTime(i === 2 ? 0.34 : 0.17, at)
    gain.gain.exponentialRampToValueAtTime(0.0008, at + (i === 2 ? 0.19 : 0.05))
    source.connect(filter)
    filter.connect(gain)
    gain.connect(out)
    source.start(at)
    source.stop(at + 0.24)
  }
}

/** Detuned saw stack — the bright lead the DNA calls for. */
function leadNote(cell: CellContext, time: number, midi: number, length: number, level: number) {
  const { ctx, out } = cell
  const freq = midiToFreq(midi)
  const filter = ctx.createBiquadFilter()
  const gain = ctx.createGain()

  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(2400, time)
  filter.frequency.exponentialRampToValueAtTime(5200, time + 0.04)
  filter.Q.value = 0.8

  gain.gain.setValueAtTime(0.0001, time)
  gain.gain.exponentialRampToValueAtTime(level, time + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, time + length)

  for (const cents of [-12, 0, 12]) {
    const osc = ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.value = freq
    osc.detune.value = cents
    osc.connect(filter)
    osc.start(time)
    osc.stop(time + length + 0.04)
  }

  filter.connect(gain)
  gain.connect(out)
}

/** Scales the finished mix so its loudest peak lands at `target`. */
function normalise(buffer: AudioBuffer, target: number) {
  let peak = 0
  for (let c = 0; c < buffer.numberOfChannels; c += 1) {
    const data = buffer.getChannelData(c)
    for (let i = 0; i < data.length; i += 1) {
      const value = Math.abs(data[i])
      if (value > peak) peak = value
    }
  }
  if (peak < 1e-6) return
  const gain = target / peak
  for (let c = 0; c < buffer.numberOfChannels; c += 1) {
    const data = buffer.getChannelData(c)
    for (let i = 0; i < data.length; i += 1) data[i] *= gain
  }
}

export async function renderTrack(profile: StyleProfile, seed: number): Promise<RenderResult> {
  const { dna } = profile
  const random = createRandom(seed)

  const tempo = Math.round((dna.rhythm.tempoRange[0] + dna.rhythm.tempoRange[1]) / 2)
  const beat = 60 / tempo
  const bar = beat * 4
  const key = parseKey(dna.harmony.preferredKeys[0] ?? 'C minor')

  // Motif and root movement, generated from the seed.
  const steps = scaleSteps(key.minor)
  const motif = Array.from({ length: 8 }, () => {
    const pool = [0, 2, 4, 5, 7, steps.length, steps.length + 2]
    return pool[Math.floor(random() * pool.length)]
  })
  const bassPattern = [0, 0, 5, 3]

  // ---- render one 4-bar cell per section kind ----------------------------
  const cellSeconds = CELL_BARS * bar
  const tail = 0.6

  async function renderCell(kind: SectionKind): Promise<AudioBuffer> {
    const ctx = new OfflineAudioContext(1, Math.ceil((cellSeconds + tail) * SAMPLE_RATE), SAMPLE_RATE)
    const out = ctx.createGain()
    out.gain.value = 1
    out.connect(ctx.destination)

    const cell: CellContext = { ctx, out, noise: makeNoise(ctx, random), random, dna }

    const drums = kind !== 'intro'
    const full = kind === 'hook'
    const leadLevel = kind === 'hook' ? 0.17 : kind === 'verse' ? 0.1 : 0.13
    const octave = full ? 5 : 4

    for (let b = 0; b < CELL_BARS; b += 1) {
      const barStart = b * bar

      if (drums) {
        // Half-time backbone: kick on 1, clap on 3.
        kick(cell, barStart)
        clap(cell, barStart + beat * 2)
        if (full && b === CELL_BARS - 1) kick(cell, barStart + beat * 2.5)
      }

      const hatCount = kind === 'intro' ? 8 : 16
      for (let h = 0; h < hatCount; h += 1) {
        hat(cell, barStart + (h * bar) / hatCount, h % 4 === 0 ? 0.085 : 0.05, 0.035)
      }
      // Roll into the end of the phrase.
      if (drums && b === CELL_BARS - 1) {
        for (let r = 0; r < 8; r += 1) hat(cell, barStart + beat * 3 + (r * beat) / 8, 0.065, 0.022)
      }

      if (drums) {
        const degree = bassPattern[b % bassPattern.length]
        const previous = bassPattern[(b - 1 + bassPattern.length) % bassPattern.length]
        eightOhEight(
          cell,
          barStart,
          degreeToMidi(key, degree, 1),
          bar * 0.8,
          b === 0 ? undefined : degreeToMidi(key, previous, 1),
        )
      }

      for (let n = 0; n < 8; n += 1) {
        const degree = motif[(n + b) % motif.length]
        leadNote(cell, barStart + (n * bar) / 8, degreeToMidi(key, degree, octave), bar / 8 + 0.04, leadLevel)
      }
    }

    return ctx.startRendering()
  }

  const kinds: SectionKind[] = ['intro', 'hook', 'verse', 'outro']
  const rendered = await Promise.all(kinds.map((kind) => renderCell(kind)))
  const cells = new Map<SectionKind, AudioBuffer>(kinds.map((kind, i) => [kind, rendered[i]]))

  // ---- lay the arrangement out and tile the cells -------------------------
  const plan = dna.structure.arrangement.map((label) => {
    const kind = classify(label)
    // The profile's labels are descriptive sentences; the timeline wants names.
    return { label: kind.toUpperCase(), kind, bars: SECTION_BARS[kind] }
  })

  let totalBars = plan.reduce((sum, section) => sum + section.bars, 0)
  if (totalBars * bar > MAX_SECONDS) totalBars = Math.floor(MAX_SECONDS / bar)

  const duration = totalBars * bar + tail
  const ctx = new OfflineAudioContext(2, Math.ceil(duration * SAMPLE_RATE), SAMPLE_RATE)

  const master = ctx.createGain()
  master.gain.value = 0.42

  // Soft clip only. A DynamicsCompressorNode is not usable as a limiter here:
  // Web Audio applies its own makeup gain and shoves the mix back to full
  // scale, which is what made early renders a wall of clipping. Peak control
  // happens after rendering instead, where it is exact.
  const saturator = ctx.createWaveShaper()
  saturator.curve = distortionCurve(dna.mix.saturation * 0.1)
  saturator.oversample = '2x'

  master.connect(saturator)
  saturator.connect(ctx.destination)

  const sections: RenderedSection[] = []
  let barCursor = 0

  for (const section of plan) {
    if (barCursor >= totalBars) break
    const bars = Math.min(section.bars, totalBars - barCursor)
    sections.push({ label: section.label, startSeconds: Math.round(barCursor * bar) })

    for (let placed = 0; placed < bars; placed += CELL_BARS) {
      const source = ctx.createBufferSource()
      source.buffer = cells.get(section.kind) ?? cells.get('verse')!
      source.connect(master)
      const at = (barCursor + placed) * bar
      // Trim the cell if the section ends mid-cell, but let its tail ring out.
      const remaining = Math.min(CELL_BARS, bars - placed) * bar
      source.start(at)
      source.stop(at + remaining + tail)
    }

    barCursor += bars
  }

  const buffer = await ctx.startRendering()
  normalise(buffer, 0.89)

  return {
    buffer,
    tempo,
    keyLabel: dna.harmony.preferredKeys[0] ?? 'C minor',
    sections,
    durationSeconds: Math.round(totalBars * bar),
  }
}
