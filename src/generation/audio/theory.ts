/** Minimal pitch helpers for the local renderer. */

const NOTE_OFFSETS: Record<string, number> = {
  c: 0, 'c#': 1, db: 1, d: 2, 'd#': 3, eb: 3, e: 4, f: 5,
  'f#': 6, gb: 6, g: 7, 'g#': 8, ab: 8, a: 9, 'a#': 10, bb: 10, b: 11,
}

export interface ParsedKey {
  /** Semitones above C. */
  root: number
  minor: boolean
  label: string
}

/**
 * Reads a key out of the free-form label a StyleProfile carries, e.g.
 * "E♭ major (est.)" or "F# minor". Falls back to C minor if nothing parses,
 * so a badly written profile degrades instead of throwing.
 */
export function parseKey(label: string): ParsedKey {
  const normalised = label.toLowerCase().replace(/♭/g, 'b').replace(/♯/g, '#')
  const match = normalised.match(/\b([a-g])\s*(#|b|-?sharp|-?flat)?\b/)

  let root = 0
  if (match) {
    let token = match[1]
    const accidental = match[2]
    if (accidental?.startsWith('#') || accidental?.includes('sharp')) token += '#'
    else if (accidental?.startsWith('b') || accidental?.includes('flat')) token += 'b'
    root = NOTE_OFFSETS[token] ?? 0
  }

  const minor = /\bminor\b|\baeolian\b|\bphrygian\b/.test(normalised)
  return { root, minor, label }
}

/** Scale degrees in semitones. */
export function scaleSteps(minor: boolean): number[] {
  return minor ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11]
}

/** MIDI note number for a scale degree, allowing degrees outside one octave. */
export function degreeToMidi(key: ParsedKey, degree: number, octave: number): number {
  const steps = scaleSteps(key.minor)
  const within = ((degree % steps.length) + steps.length) % steps.length
  const octaveShift = Math.floor(degree / steps.length)
  return 12 * (octave + 1) + key.root + steps[within] + 12 * octaveShift
}

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12)
}
