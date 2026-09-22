import type { LeadVoice } from '../../trap/styles'
import type { SectionKind, SongRecipe } from '../recipe'
import { createRandom } from '../random'
import { degreeToMidi, midiToFreq, type ParsedKey } from './theory'

/**
 * Local audio renderer.
 *
 * This is NOT a music model and does not write songs — it is a procedural
 * trap beat machine that plays a SongRecipe: the lane's drum grammar (trap,
 * drill, rage, plugg, phonk, detroit), a seeded chord loop and motif on the
 * lane's lead voice, and an 808 that follows the kick. Nothing is sampled or
 * lifted from any record. It is instrumental; singing needs a real model.
 *
 * Built by rendering one short cell per section kind and tiling them, rather
 * than scheduling every hit in one graph: trap is loop-driven anyway, and a
 * single graph of thousands of nodes takes far too long to render.
 */

export interface RenderedSection {
  label: string
  startSeconds: number
}

export interface RenderResult {
  buffer: AudioBuffer
  sections: RenderedSection[]
  durationSeconds: number
}

const CELL_BARS = 4
const STEPS = 16
const SAMPLE_RATE = 44100
const TAIL = 0.8

/** Standard soft-clip curve; `amount` 0..1 maps to gentle..aggressive. */
function distortionCurve(amount: number): Float32Array<ArrayBuffer> {
  const k = 2 + amount * 160
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

/* ------------------------------------------------------------------------ */
/* Drum grammar                                                             */
/* ------------------------------------------------------------------------ */

interface DrumBar {
  kicks: number[]
  snares: number[]
  /** Hat steps; fractional steps are allowed for triplet feels. */
  hats: number[]
  openHats: number[]
}

/**
 * One bar of each lane's groove, on a 16-step grid of 16th notes. Trap is
 * felt in half time, so the snare lands on step 8 (beat three). Two variants
 * per lane alternate bar to bar so the loop breathes.
 */
function drumBar(pattern: SongRecipe['sound']['pattern'], bar: number, busy: boolean): DrumBar {
  const odd = bar % 2 === 1
  const sixteenths = Array.from({ length: 16 }, (_, i) => i)
  const eighths = sixteenths.filter((i) => i % 2 === 0)

  switch (pattern) {
    case 'drill':
      return {
        kicks: odd ? [0, 11] : [0, 6, 11],
        snares: odd ? [8, 14] : [8],
        // The skipping drill hat: dotted groupings instead of a straight grid.
        hats: [0, 3, 6, 8, 10, 11, 14],
        openHats: [],
      }
    case 'rage':
      return {
        kicks: odd ? [0, 10, 13] : [0, 7, 10],
        snares: [8],
        hats: busy ? sixteenths : eighths,
        openHats: [],
      }
    case 'plugg':
      return {
        kicks: odd ? [0, 6, 10] : [0, 10],
        snares: [8],
        hats: eighths,
        openHats: [],
      }
    case 'phonk':
      return {
        kicks: odd ? [0, 3, 10] : [0, 6, 10],
        snares: [8],
        hats: eighths,
        openHats: [2, 6, 10, 14],
      }
    case 'detroit':
      // Not half time: backbeat on two and four, kicks pushed off the grid.
      return {
        kicks: odd ? [0, 3, 7, 10, 13] : [0, 3, 6, 11],
        snares: [4, 12],
        hats: eighths,
        openHats: [],
      }
    case 'trap':
    default:
      return {
        kicks: odd ? [0, 3, 10] : [0, 10],
        snares: [8],
        hats: busy ? sixteenths : eighths,
        openHats: [],
      }
  }
}

/* ------------------------------------------------------------------------ */
/* Voices                                                                   */
/* ------------------------------------------------------------------------ */

interface Voices {
  ctx: OfflineAudioContext
  drums: AudioNode
  bass: AudioNode
  music: AudioNode
  noise: AudioBuffer
  random: () => number
  drive: number
}

function panned(ctx: OfflineAudioContext, target: AudioNode, pan: number): AudioNode {
  const node = ctx.createStereoPanner()
  node.pan.value = pan
  node.connect(target)
  return node
}

function kick({ ctx, drums }: Voices, time: number) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(150, time)
  osc.frequency.exponentialRampToValueAtTime(46, time + 0.08)
  gain.gain.setValueAtTime(0.75, time)
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.26)
  osc.connect(gain)
  gain.connect(drums)
  osc.start(time)
  osc.stop(time + 0.3)
}

function snare({ ctx, drums, noise }: Voices, time: number, clapLike: boolean) {
  // Noise body with a tonal crack underneath.
  const taps = clapLike ? 3 : 1
  for (let i = 0; i < taps; i += 1) {
    const at = time + i * 0.011
    const source = ctx.createBufferSource()
    const filter = ctx.createBiquadFilter()
    const gain = ctx.createGain()
    source.buffer = noise
    filter.type = 'bandpass'
    filter.frequency.value = clapLike ? 1600 : 2400
    filter.Q.value = 0.9
    const last = i === taps - 1
    gain.gain.setValueAtTime(last ? 0.42 : 0.2, at)
    gain.gain.exponentialRampToValueAtTime(0.0008, at + (last ? 0.2 : 0.05))
    source.connect(filter)
    filter.connect(gain)
    gain.connect(drums)
    source.start(at)
    source.stop(at + 0.25)
  }

  const tone = ctx.createOscillator()
  const toneGain = ctx.createGain()
  tone.type = 'triangle'
  tone.frequency.setValueAtTime(230, time)
  tone.frequency.exponentialRampToValueAtTime(160, time + 0.08)
  toneGain.gain.setValueAtTime(0.22, time)
  toneGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1)
  tone.connect(toneGain)
  toneGain.connect(drums)
  tone.start(time)
  tone.stop(time + 0.12)
}

function hat(voices: Voices, time: number, level: number, decay: number, pan: number) {
  const { ctx, drums, noise, random } = voices
  const source = ctx.createBufferSource()
  const filter = ctx.createBiquadFilter()
  const gain = ctx.createGain()
  source.buffer = noise
  source.playbackRate.value = 1.4 + random() * 0.4
  filter.type = 'highpass'
  filter.frequency.value = 7600
  gain.gain.setValueAtTime(level, time)
  gain.gain.exponentialRampToValueAtTime(0.0008, time + decay)
  source.connect(filter)
  filter.connect(gain)
  gain.connect(panned(ctx, drums, pan))
  source.start(time)
  source.stop(time + decay + 0.02)
}

/** 808: sine through the lane's drive, optionally sliding in from the last note. */
function eightOhEight(voices: Voices, time: number, midi: number, length: number, glideFrom: number | null) {
  const { ctx, bass, drive } = voices
  const osc = ctx.createOscillator()
  const env = ctx.createGain()
  const shaper = ctx.createWaveShaper()
  shaper.curve = distortionCurve(drive)
  shaper.oversample = '2x'

  osc.type = 'sine'
  if (glideFrom !== null && glideFrom !== midi) {
    osc.frequency.setValueAtTime(midiToFreq(glideFrom), time)
    osc.frequency.exponentialRampToValueAtTime(midiToFreq(midi), time + Math.min(0.16, length * 0.5))
  } else {
    osc.frequency.setValueAtTime(midiToFreq(midi), time)
  }

  env.gain.setValueAtTime(0.0001, time)
  env.gain.exponentialRampToValueAtTime(0.6, time + 0.01)
  env.gain.setValueAtTime(0.6, time + length * 0.6)
  env.gain.exponentialRampToValueAtTime(0.001, time + length)

  // The shaper pushes anything towards full scale, so the level that decides
  // how much 808 is in the mix sits AFTER it.
  const level = ctx.createGain()
  level.gain.value = 0.34 - drive * 0.08

  osc.connect(env)
  env.connect(shaper)
  shaper.connect(level)
  level.connect(bass)
  osc.start(time)
  osc.stop(time + length + 0.05)
}

/** Plays one note on a lead voice. */
function note(voices: Voices, voice: LeadVoice, time: number, midi: number, length: number, level: number, pan = 0) {
  const { ctx, music } = voices
  const freq = midiToFreq(midi)
  const out = ctx.createGain()
  out.connect(panned(ctx, music, pan))

  const oscillator = (type: OscillatorType, frequency: number, detune = 0) => {
    const osc = ctx.createOscillator()
    osc.type = type
    osc.frequency.value = frequency
    osc.detune.value = detune
    return osc
  }
  const envelope = (attack: number, decay: number, peak: number) => {
    out.gain.setValueAtTime(0.0001, time)
    out.gain.exponentialRampToValueAtTime(peak, time + attack)
    out.gain.exponentialRampToValueAtTime(0.0001, time + attack + decay)
    return attack + decay
  }

  switch (voice) {
    case 'supersaw': {
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(2200, time)
      filter.frequency.exponentialRampToValueAtTime(5600, time + 0.04)
      filter.connect(out)
      const end = envelope(0.01, length, level)
      for (const cents of [-18, -7, 0, 7, 18]) {
        const osc = oscillator('sawtooth', freq, cents)
        osc.connect(filter)
        osc.start(time)
        osc.stop(time + end + 0.03)
      }
      return
    }
    case 'bell': {
      // Two-operator FM: an inharmonic modulator gives the metallic ring.
      const carrier = oscillator('sine', freq)
      const modulator = oscillator('sine', freq * 3.5)
      const depth = ctx.createGain()
      depth.gain.setValueAtTime(freq * 1.6, time)
      depth.gain.exponentialRampToValueAtTime(freq * 0.05, time + 0.6)
      modulator.connect(depth)
      depth.connect(carrier.frequency)
      carrier.connect(out)
      const end = envelope(0.004, Math.max(0.9, length), level)
      for (const osc of [carrier, modulator]) {
        osc.start(time)
        osc.stop(time + end + 0.03)
      }
      return
    }
    case 'pluck': {
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(4200, time)
      filter.frequency.exponentialRampToValueAtTime(600, time + 0.3)
      filter.connect(out)
      const end = envelope(0.003, 0.45, level)
      for (const [type, detune] of [['triangle', 0], ['sawtooth', 6]] as const) {
        const osc = oscillator(type, freq, detune)
        osc.connect(filter)
        osc.start(time)
        osc.stop(time + end + 0.03)
      }
      return
    }
    case 'keys': {
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 2600
      filter.connect(out)
      const end = envelope(0.005, Math.max(0.8, length), level)
      for (const [type, multiple, gain] of [['triangle', 1, 1], ['sine', 2, 0.4], ['sine', 3, 0.12]] as const) {
        const osc = oscillator(type, freq * multiple)
        const partial = ctx.createGain()
        partial.gain.value = gain
        osc.connect(partial)
        partial.connect(filter)
        osc.start(time)
        osc.stop(time + end + 0.03)
      }
      return
    }
    case 'pad': {
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 1100
      filter.connect(out)
      out.gain.setValueAtTime(0.0001, time)
      out.gain.exponentialRampToValueAtTime(level, time + 0.35)
      out.gain.setValueAtTime(level, time + length * 0.8)
      out.gain.exponentialRampToValueAtTime(0.0001, time + length + 0.4)
      for (const cents of [-9, 9]) {
        const osc = oscillator('sawtooth', freq, cents)
        osc.connect(filter)
        osc.start(time)
        osc.stop(time + length + 0.45)
      }
      return
    }
    case 'flute': {
      const osc = oscillator('sine', freq)
      const body = oscillator('triangle', freq * 2)
      const bodyGain = ctx.createGain()
      bodyGain.gain.value = 0.15
      // Delayed vibrato, the tell of a held wind note.
      const lfo = oscillator('sine', 5.2)
      const lfoDepth = ctx.createGain()
      lfoDepth.gain.setValueAtTime(0, time)
      lfoDepth.gain.linearRampToValueAtTime(freq * 0.006, time + 0.25)
      lfo.connect(lfoDepth)
      lfoDepth.connect(osc.frequency)
      body.connect(bodyGain)
      bodyGain.connect(out)
      osc.connect(out)
      out.gain.setValueAtTime(0.0001, time)
      out.gain.exponentialRampToValueAtTime(level, time + 0.06)
      out.gain.setValueAtTime(level, time + length * 0.85)
      out.gain.exponentialRampToValueAtTime(0.0001, time + length + 0.12)
      for (const node of [osc, body, lfo]) {
        node.start(time)
        node.stop(time + length + 0.15)
      }
      return
    }
    case 'cowbell': {
      // Pitched 808-style cowbell: two squares a tritone-ish apart, band-passed.
      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.value = freq * 2
      filter.Q.value = 1.4
      filter.connect(out)
      const end = envelope(0.002, 0.28, level * 1.6)
      for (const ratio of [1, 1.48]) {
        const osc = oscillator('square', freq * ratio)
        osc.connect(filter)
        osc.start(time)
        osc.stop(time + end + 0.03)
      }
      return
    }
  }
}

/* ------------------------------------------------------------------------ */
/* Harmony and motif                                                        */
/* ------------------------------------------------------------------------ */

const MINOR_LOOPS = [
  [0, 5, 2, 6],
  [0, 3, 4, 4],
  [0, 5, 3, 4],
  [0, 0, 5, 4],
  [0, 6, 5, 6],
  [0, 2, 5, 4],
]
const MAJOR_LOOPS = [
  [0, 4, 5, 3],
  [0, 5, 3, 4],
  [3, 4, 0, 5],
  [0, 3, 0, 4],
]

interface MotifNote {
  /** 16th step inside a two-bar phrase (0..31). */
  step: number
  length: number
  /** Index into the chord's tones, may run past one octave. */
  tone: number
}

/** A seeded two-bar motif whose rhythm suits the voice playing it. */
function makeMotif(voice: LeadVoice, random: () => number): MotifNote[] {
  const notes: MotifNote[] = []
  const grid = voice === 'flute' ? 4 : voice === 'cowbell' ? 1 : 2
  const restChance = voice === 'supersaw' ? 0.1 : voice === 'cowbell' ? 0.45 : 0.3
  for (let step = 0; step < 32; step += grid) {
    if (step !== 0 && random() < restChance) continue
    const length = voice === 'flute' ? (random() < 0.5 ? 4 : 8) : grid
    notes.push({ step, length, tone: Math.floor(random() * 5) })
    if (voice === 'flute' && length === 8) step += 4
  }
  return notes
}

/* ------------------------------------------------------------------------ */
/* Rendering                                                                */
/* ------------------------------------------------------------------------ */

interface CellPlan {
  drums: boolean
  bass: boolean
  busyHats: boolean
  lead: number
  counter: number
  filterLead: boolean
}

const CELL_PLANS: Record<SectionKind, CellPlan> = {
  intro: { drums: false, bass: false, busyHats: false, lead: 0.1, counter: 0.06, filterLead: true },
  verse: { drums: true, bass: true, busyHats: false, lead: 0.07, counter: 0.05, filterLead: false },
  hook: { drums: true, bass: true, busyHats: true, lead: 0.13, counter: 0.07, filterLead: false },
  bridge: { drums: false, bass: true, busyHats: false, lead: 0.1, counter: 0.08, filterLead: false },
  outro: { drums: false, bass: false, busyHats: false, lead: 0.09, counter: 0.07, filterLead: true },
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

export async function renderRecipe(recipe: SongRecipe): Promise<RenderResult> {
  const random = createRandom(recipe.seed)
  const { sound } = recipe
  const key: ParsedKey = { root: recipe.keyRoot, minor: recipe.minor, label: recipe.keyLabel }

  const beat = 60 / recipe.tempo
  const bar = beat * 4
  const step = bar / STEPS

  const loops = recipe.minor ? MINOR_LOOPS : MAJOR_LOOPS
  const progression = loops[Math.floor(random() * loops.length)]
  const motif = makeMotif(sound.lead, random)
  const leadOctave = sound.lead === 'cowbell' ? 4 : sound.lead === 'flute' || sound.lead === 'bell' ? 5 : 4

  const chordTone = (chord: number, tone: number, octave: number) =>
    degreeToMidi(key, chord + [0, 2, 4, 7, 9][tone % 5], octave)

  async function renderCell(kind: SectionKind): Promise<AudioBuffer> {
    const plan = CELL_PLANS[kind]
    const ctx = new OfflineAudioContext(2, Math.ceil((CELL_BARS * bar + TAIL) * SAMPLE_RATE), SAMPLE_RATE)

    const bus = (level: number) => {
      const node = ctx.createGain()
      node.gain.value = level
      node.connect(ctx.destination)
      return node
    }
    const music = ctx.createBiquadFilter()
    music.type = 'lowpass'
    music.frequency.value = plan.filterLead ? 1400 : 16000
    music.connect(bus(1))

    const voices: Voices = {
      ctx,
      drums: bus(0.9),
      bass: bus(1),
      music,
      noise: makeNoise(ctx, random),
      random,
      drive: sound.drive,
    }

    let previousBass: number | null = null

    for (let b = 0; b < CELL_BARS; b += 1) {
      const barStart = b * bar
      const chord = progression[b % progression.length]
      const groove = drumBar(sound.pattern, b, plan.busyHats)
      const lastBar = b === CELL_BARS - 1

      if (plan.drums) {
        for (const s of groove.kicks) kick(voices, barStart + s * step)
        for (const s of groove.snares) snare(voices, barStart + s * step, sound.pattern !== 'drill')
        for (const s of groove.openHats) hat(voices, barStart + s * step, 0.05, 0.16, 0.2)
      }

      // Hats run through intros too, quieter, so the loop never goes dead.
      const hatLevel = plan.drums ? 0.075 : 0.035
      for (const s of groove.hats) {
        hat(voices, barStart + s * step, s % 4 === 0 ? hatLevel * 1.3 : hatLevel, 0.035, 0.15)
      }

      // Rolls: fast bursts on a random beat, and always into the phrase end.
      if (plan.drums) {
        const rollBeats = [1, 3].filter(() => random() < sound.rolls * 0.6)
        if (lastBar) rollBeats.push(3)
        for (const rollBeat of new Set(rollBeats)) {
          const hits = random() < 0.5 ? 6 : 8
          for (let r = 0; r < hits; r += 1) {
            hat(voices, barStart + rollBeat * beat + (r * beat) / hits, 0.05 + (r / hits) * 0.03, 0.022, -0.15)
          }
        }
      }

      // 808 follows the kick, holding until the next one.
      if (plan.bass) {
        const hits = plan.drums ? groove.kicks : [0]
        hits.forEach((s, i) => {
          const next = i + 1 < hits.length ? hits[i + 1] : STEPS
          const length = (next - s) * step
          // Drill slides up the octave on the last hit of a bar.
          const octaveUp = sound.pattern === 'drill' && i === hits.length - 1 && b % 2 === 1
          const midi = chordTone(chord, 0, 1) + (octaveUp ? 12 : 0)
          const glide = previousBass !== null && random() < sound.glide ? previousBass : null
          eightOhEight(voices, barStart + s * step, midi, Math.max(0.12, length * 0.95), glide)
          previousBass = midi
        })
      }

      // Counter voice: sustained chord for pads, off-beat stabs otherwise.
      if (sound.counter) {
        if (sound.counter === 'pad') {
          for (const tone of [0, 1, 2]) {
            note(voices, 'pad', barStart, chordTone(chord, tone, 3), bar * 0.95, plan.counter, tone === 1 ? 0 : tone === 0 ? -0.3 : 0.3)
          }
        } else {
          for (const s of [4, 12]) {
            note(voices, sound.counter, barStart + s * step, chordTone(chord, 2, 5), step * 2, plan.counter * 0.8, 0.35)
          }
        }
      }

      // Lead motif, a two-bar phrase over the bar's chord.
      const phraseOffset = (b % 2) * STEPS
      for (const m of motif) {
        if (m.step < phraseOffset || m.step >= phraseOffset + STEPS) continue
        // Verses thin the lead out so there is room for a voice.
        if (kind === 'verse' && m.step % 4 !== 0) continue
        const time = barStart + (m.step - phraseOffset) * step
        const midi = chordTone(chord, m.tone, leadOctave)
        note(voices, sound.lead, time, midi, m.length * step, plan.lead, sound.lead === 'supersaw' ? 0 : -0.1)
        if (sound.lead === 'supersaw' && kind === 'hook') {
          note(voices, 'supersaw', time, midi + 12, m.length * step, plan.lead * 0.35, 0)
        }
      }
    }

    return ctx.startRendering()
  }

  const kinds = [...new Set(recipe.sections.map((section) => section.kind))]
  const cells = new Map<SectionKind, AudioBuffer>()
  // Sequential: each cell draws from the shared seeded random, so the order
  // must be fixed for a recipe to render the same every time.
  for (const kind of kinds) cells.set(kind, await renderCell(kind))

  // ---- lay the arrangement out and tile the cells -------------------------
  const totalBars = recipe.sections.reduce((sum, section) => sum + section.bars, 0)
  const duration = totalBars * bar + TAIL
  const ctx = new OfflineAudioContext(2, Math.ceil(duration * SAMPLE_RATE), SAMPLE_RATE)

  const master = ctx.createGain()
  master.gain.value = 0.42

  // Soft clip only. A DynamicsCompressorNode is not usable as a limiter here:
  // Web Audio applies its own makeup gain and shoves the mix back to full
  // scale. Peak control happens after rendering instead, where it is exact.
  const saturator = ctx.createWaveShaper()
  saturator.curve = distortionCurve(sound.saturation * 0.1)
  saturator.oversample = '2x'
  master.connect(saturator)
  saturator.connect(ctx.destination)

  const sections: RenderedSection[] = []
  let barCursor = 0

  for (const section of recipe.sections) {
    sections.push({ label: section.label, startSeconds: Math.round(barCursor * bar) })
    const cell = cells.get(section.kind)!

    for (let placed = 0; placed < section.bars; placed += CELL_BARS) {
      const source = ctx.createBufferSource()
      source.buffer = cell
      const at = (barCursor + placed) * bar
      const remaining = Math.min(CELL_BARS, section.bars - placed) * bar
      const isLast = barCursor + placed + CELL_BARS >= totalBars

      // Fade the very end out instead of cutting it.
      if (section.kind === 'outro' && isLast) {
        const fade = ctx.createGain()
        fade.gain.setValueAtTime(1, at)
        fade.gain.linearRampToValueAtTime(0.0001, at + remaining + TAIL)
        source.connect(fade)
        fade.connect(master)
      } else {
        source.connect(master)
      }

      source.start(at)
      source.stop(at + remaining + TAIL)
    }

    barCursor += section.bars
  }

  const buffer = await ctx.startRendering()
  normalise(buffer, 0.89)

  return {
    buffer,
    sections,
    durationSeconds: Math.round(totalBars * bar),
  }
}
