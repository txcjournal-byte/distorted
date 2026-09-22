/**
 * TRAP STYLES — the only genre DISTORTED makes.
 *
 * Each style is a production lane inside trap, described in sonic terms only:
 * no artist names, no copied melodies. The same record feeds both engines:
 *
 *   - `prompt` is what a music model gets (ElevenLabs), and
 *   - `sound` is what the local renderer plays when there is no model.
 *
 * Adding a style means adding one entry to TRAP_STYLES. Nothing else changes.
 */

export type TrapStyleId =
  | 'atl'
  | 'dark'
  | 'rage'
  | 'drill'
  | 'plugg'
  | 'phonk'
  | 'melodic'
  | 'detroit'

/** Drum grammar the local renderer follows. */
export type DrumPattern = 'trap' | 'drill' | 'rage' | 'plugg' | 'phonk' | 'detroit'

/** Lead voice the local renderer synthesises. */
export type LeadVoice = 'supersaw' | 'bell' | 'pluck' | 'pad' | 'flute' | 'cowbell' | 'keys'

export interface TrapSound {
  pattern: DrumPattern
  lead: LeadVoice
  /** Optional second voice under the lead. */
  counter: LeadVoice | null
  /** Whether the style leans minor. Descriptions can still flip it. */
  minor: boolean
  /** 0..1 — how hard the 808 is driven. */
  drive: number
  /** 0..1 — how far the 808 slides between notes. */
  glide: number
  /** 0..1 — how often the hats roll. */
  rolls: number
  /** 0..1 — master saturation. */
  saturation: number
}

export interface TrapStyle {
  id: TrapStyleId
  name: string
  /** One line for cards. */
  tagline: string
  blurb: string
  tags: string[]
  /** Accent for the style's covers. */
  color: string
  tempoRange: [number, number]
  /** Words in a description that point at this style. */
  keywords: string[]
  prompt: {
    spine: string
    include: string[]
    exclude: string[]
    vocals: string[]
  }
  sound: TrapSound
}

const COMMON_EXCLUDE = [
  'boom bap',
  'acoustic ballad',
  'country',
  'orchestral film score',
  'lo-fi jazz',
  'rock band',
  'EDM drop',
]

export const TRAP_STYLES: TrapStyle[] = [
  {
    id: 'atl',
    name: 'ATL TRAP',
    tagline: 'The blueprint. Rolling hats, booming 808, bells on top.',
    blurb:
      'Classic southern trap: half-time snare, 16th hats that roll into every turn, a long booming 808 and a dark bell melody looping over the top.',
    tags: ['CLASSIC', 'HARD', 'SOUTHERN'],
    color: '#a855f7',
    tempoRange: [132, 150],
    keywords: ['atl', 'atlanta', 'classic', 'southern', 'trap house', 'street'],
    prompt: {
      spine:
        'classic Atlanta trap: half-time groove, rolling 16th and triplet hi-hats, long booming 808, dark bell melody loop, hard and minimal',
      include: ['trap', 'booming 808', 'rolling hi-hats', 'bell melody', 'half-time snare', 'southern hip hop'],
      exclude: COMMON_EXCLUDE,
      vocals: ['confident rap flow', 'ad-libs between bars', 'chanted hook'],
    },
    sound: { pattern: 'trap', lead: 'bell', counter: 'pad', minor: true, drive: 0.35, glide: 0.4, rolls: 0.55, saturation: 0.4 },
  },
  {
    id: 'dark',
    name: 'DARK TRAP',
    tagline: 'Minor keys, cold keys, a slow menacing crawl.',
    blurb:
      'Brooding and sparse: minor piano-like keys, eerie pads, a distorted 808 and hats that leave room for the dark to breathe.',
    tags: ['DARK', 'EERIE', 'HEAVY'],
    color: '#6d28d9',
    tempoRange: [128, 145],
    keywords: ['dark', 'evil', 'horror', 'eerie', 'sinister', 'night', 'cold', 'menacing', 'sad'],
    prompt: {
      spine:
        'dark trap: minor key, eerie piano and pads, distorted 808, sparse hard drums, menacing atmosphere',
      include: ['dark trap', 'minor key', 'eerie piano', 'ominous pad', 'distorted 808', 'sparse drums'],
      exclude: [...COMMON_EXCLUDE, 'happy', 'bright major key'],
      vocals: ['low menacing rap', 'whispered ad-libs', 'dark chant hook'],
    },
    sound: { pattern: 'trap', lead: 'keys', counter: 'pad', minor: true, drive: 0.6, glide: 0.5, rolls: 0.35, saturation: 0.55 },
  },
  {
    id: 'rage',
    name: 'RAGE',
    tagline: 'Detuned synth leads and 808s pushed into the red.',
    blurb:
      'Trap crossed with hyperpop energy: a short bright detuned supersaw loop, a blown-out 808 and fast rolling hats, digital and hard-clipped.',
    tags: ['RAGE', 'SYNTH', 'CHAOTIC'],
    color: '#c026d3',
    tempoRange: [145, 165],
    keywords: ['rage', 'hyper', 'synth', 'supersaw', 'mosh', 'energy', 'crazy', 'chaotic', 'opium'],
    prompt: {
      spine:
        'rage beat: short bright detuned supersaw loop over a distorted 808 and fast rolling hi-hats, half-time groove, digital and hard-clipped',
      include: ['rage beat', 'detuned supersaw lead', 'distorted 808', 'fast rolling hi-hats', 'hyperpop-leaning production'],
      exclude: [...COMMON_EXCLUDE, 'sample-based soul loop', 'clean polished pop mix'],
      vocals: ['shouted auto-tuned hook', 'dense ad-lib layer', 'melodic sung-rap'],
    },
    sound: { pattern: 'rage', lead: 'supersaw', counter: null, minor: false, drive: 0.85, glide: 0.35, rolls: 0.7, saturation: 0.75 },
  },
  {
    id: 'drill',
    name: 'DRILL',
    tagline: 'Sliding 808s, skipping hats, snare off the grid.',
    blurb:
      'Drill bounce: gliding 808 basslines, triplet-skipping hats, syncopated snares and a tense minor melody on strings or flutes.',
    tags: ['DRILL', 'SLIDING 808', 'COLD'],
    color: '#2563eb',
    tempoRange: [138, 146],
    keywords: ['drill', 'uk', 'ny', 'brooklyn', 'london', 'slide', 'sliding', 'opps'],
    prompt: {
      spine:
        'drill beat: sliding gliding 808 bassline, triplet skipping hi-hats, syncopated snares, tense minor melody, cold and aggressive',
      include: ['drill', 'sliding 808', 'gliding bass', 'triplet hi-hats', 'syncopated snare', 'minor melody'],
      exclude: COMMON_EXCLUDE,
      vocals: ['aggressive drill flow', 'punchy ad-libs', 'short chant hook'],
    },
    sound: { pattern: 'drill', lead: 'flute', counter: 'pad', minor: true, drive: 0.5, glide: 1, rolls: 0.45, saturation: 0.5 },
  },
  {
    id: 'plugg',
    name: 'PLUGG',
    tagline: 'Soft, floaty, video-game sweet.',
    blurb:
      'Airy and bouncy: glassy plucks and bells in a major key, a clean round 808, light drums and a dreamy, weightless feel.',
    tags: ['DREAMY', 'SOFT', 'BOUNCY'],
    color: '#ec4899',
    tempoRange: [140, 160],
    keywords: ['plugg', 'pluggnb', 'dreamy', 'soft', 'cute', 'sweet', 'floaty', 'video game', 'happy'],
    prompt: {
      spine:
        'plugg beat: glassy plucks and bells in a major key, clean round 808, light bouncy drums, dreamy airy atmosphere',
      include: ['plugg', 'glassy pluck synth', 'soft bells', 'clean 808', 'bouncy drums', 'dreamy'],
      exclude: [...COMMON_EXCLUDE, 'distorted', 'aggressive', 'dark'],
      vocals: ['laid-back melodic flow', 'soft auto-tuned hook'],
    },
    sound: { pattern: 'plugg', lead: 'pluck', counter: 'bell', minor: false, drive: 0.1, glide: 0.2, rolls: 0.25, saturation: 0.2 },
  },
  {
    id: 'phonk',
    name: 'PHONK',
    tagline: 'Cowbells, grime and a slammed 808.',
    blurb:
      'Memphis-rooted and blown out: a cowbell melody, a heavily distorted 808, crunchy drums and a gritty, drifting night-drive feel.',
    tags: ['COWBELL', 'GRITTY', 'DRIFT'],
    color: '#ef4444',
    tempoRange: [125, 145],
    keywords: ['phonk', 'memphis', 'cowbell', 'drift', 'gritty', 'car', 'racing', 'gym'],
    prompt: {
      spine:
        'phonk: cowbell melody, heavily distorted 808, crunchy memphis-style drums, gritty lo-fi saturation, night-drive energy',
      include: ['phonk', 'cowbell melody', 'distorted 808', 'memphis drums', 'gritty saturation'],
      exclude: [...COMMON_EXCLUDE, 'clean polished pop mix'],
      vocals: ['chopped vocal chants', 'dark rap'],
    },
    sound: { pattern: 'phonk', lead: 'cowbell', counter: null, minor: true, drive: 0.95, glide: 0.25, rolls: 0.3, saturation: 0.85 },
  },
  {
    id: 'melodic',
    name: 'MELODIC TRAP',
    tagline: 'Emotional pads, sung hooks, a heart on the 808.',
    blurb:
      'Wistful and warm: lush pads, a guitar-like pluck, a smooth 808 and gentle hats — built for sung, auto-tuned hooks about the heart.',
    tags: ['EMOTIONAL', 'MELODIC', 'SMOOTH'],
    color: '#14b8a6',
    tempoRange: [130, 150],
    keywords: ['melodic', 'emo', 'love', 'heartbreak', 'emotional', 'guitar', 'feelings', 'smooth', 'sing'],
    prompt: {
      spine:
        'melodic trap: lush emotional pads, guitar-like pluck melody, smooth 808, gentle rolling hi-hats, wistful and warm',
      include: ['melodic trap', 'emotional pads', 'guitar pluck melody', 'smooth 808', 'gentle hi-hats'],
      exclude: [...COMMON_EXCLUDE, 'harsh distortion'],
      vocals: ['sung auto-tuned melodies', 'emotional hook', 'layered harmonies'],
    },
    sound: { pattern: 'trap', lead: 'pluck', counter: 'pad', minor: true, drive: 0.2, glide: 0.45, rolls: 0.4, saturation: 0.3 },
  },
  {
    id: 'detroit',
    name: 'DETROIT',
    tagline: 'Off-kilter kicks, piano stabs, relentless flow.',
    blurb:
      'Detroit bounce: choppy off-beat kicks, a snappy clap, piano stabs and a punchy 808 that leaves space for fast, stacked bars.',
    tags: ['BOUNCE', 'PIANO', 'STREET'],
    color: '#f59e0b',
    tempoRange: [92, 104],
    keywords: ['detroit', 'bounce', 'piano', 'flint', 'choppy', 'off-beat'],
    prompt: {
      spine:
        'Detroit street rap beat: choppy off-beat kicks, snappy clap, piano stabs, punchy 808, space for fast relentless flow',
      include: ['detroit rap beat', 'off-beat kicks', 'piano stabs', 'punchy 808', 'snappy clap'],
      exclude: COMMON_EXCLUDE,
      vocals: ['fast relentless rap flow', 'punchline delivery'],
    },
    sound: { pattern: 'detroit', lead: 'keys', counter: null, minor: true, drive: 0.4, glide: 0.1, rolls: 0.15, saturation: 0.45 },
  },
]

const BY_ID = new Map<TrapStyleId, TrapStyle>(TRAP_STYLES.map((style) => [style.id, style]))

export function getTrapStyle(id: TrapStyleId): TrapStyle {
  return BY_ID.get(id) ?? TRAP_STYLES[0]
}

export function isTrapStyleId(value: string): value is TrapStyleId {
  return BY_ID.has(value as TrapStyleId)
}

/** Picks the style whose keywords a description mentions most, or null. */
export function detectStyle(text: string): TrapStyle | null {
  const lower = ` ${text.toLowerCase()} `
  let best: TrapStyle | null = null
  let bestScore = 0
  for (const style of TRAP_STYLES) {
    let score = 0
    for (const keyword of style.keywords) {
      if (lower.includes(keyword)) score += keyword.includes(' ') ? 2 : 1
    }
    if (score > bestScore) {
      best = style
      bestScore = score
    }
  }
  return best
}
