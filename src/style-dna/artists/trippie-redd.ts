import type { StyleProfile } from '../types'

/**
 * DRAFT PROFILE — placeholder data.
 *
 * Written from broad, general impressions of the rage / melodic-trap lane.
 * Nothing here is researched, measured or sourced yet. Phase 2 replaces the
 * values below and flips `status` to 'researched'.
 */
export const trippieRedd: StyleProfile = {
  id: 'trippie-redd',
  displayName: 'TRIPPIE REDD',
  tagline: 'Melodic rage. Blown-out 808s. Ghost harmonies.',
  tags: ['MELODIC TRAP', 'RAGE', 'EMO'],
  era: '2017 — NOW',
  origin: 'CANTON, OH',
  status: 'draft',
  version: '0.1.0-draft',

  dna: {
    vocal: {
      delivery: ['melodic mumble', 'sung-rap', 'shouted hook', 'whispered double'],
      register: 'mid-to-high tenor, hooks pushed to the top of the range',
      adLibs: ['yeah', 'ay', 'woah', 'skrrt', 'uh'],
      autotuneIntensity: 0.7,
      layering: ['octave-up hook double', 'wide stereo harmony stack', 'dry lead + wet ghost'],
      emotionalTone: ['manic', 'lovesick', 'defiant', 'numb'],
    },

    production: {
      palette: ['detuned bell synth', 'plucked lead', 'dark pad', 'guitar loop', 'choir stab'],
      textures: ['tape hiss', 'vinyl crackle', 'reversed tails', 'bitcrushed top end'],
      drums: ['808 kit', 'snappy clap layer', 'triplet hats', 'open-hat accents'],
      bass: ['gliding 808', 'distorted sub', 'long-tail slides'],
      distortion: 0.75,
      space: 0.6,
    },

    rhythm: {
      tempoRange: [130, 160],
      groove: ['half-time trap', 'double-time hat feel'],
      hiHatPatterns: ['triplet rolls', '1/32 stutter fills', 'off-grid drags'],
      swing: 0.15,
    },

    harmony: {
      preferredKeys: ['F# minor', 'C# minor', 'A minor'],
      scales: ['natural minor', 'harmonic minor', 'phrygian colour'],
      progressions: ['i - VI - III - VII', 'i - VII - VI - V', 'static minor vamp'],
      mood: ['nocturnal', 'romantic-bleak', 'euphoric-dark'],
    },

    structure: {
      arrangement: ['intro', 'hook', 'verse', 'hook', 'verse', 'hook', 'outro'],
      typicalLengthSeconds: [140, 210],
      hookDensity: 0.8,
      intro: 'cold open on ad-libs over the loop, drums enter on bar 5',
    },

    lyrical: {
      themes: ['heartbreak', 'excess', 'paranoia', 'loyalty', 'nihilism'],
      imagery: ['neon', 'demons', 'diamonds', 'rain', 'ghosts'],
      rhymeStyle: ['repetitive end rhyme', 'vowel-led internal rhyme', 'chant-like refrain'],
      cadenceDensity: 9,
      vocabularyColour: ['slang-heavy', 'short punchy lines', 'repeated tag words'],
    },

    mix: {
      lowEnd: 'sub-dominant, 808 pushed past the drums',
      highEnd: 'bright and crispy, hats sitting forward',
      vocalPlacement: 'centred and loud, hook widened with doubles',
      saturation: 0.7,
    },

    promptSeeds: {
      include: [
        'melodic trap',
        'rage beat',
        'distorted 808',
        'auto-tuned melodic vocal',
        'dark minor loop',
        'triplet hi-hats',
      ],
      exclude: ['boom bap', 'acoustic ballad', 'clean pop mix', 'orchestral'],
      spine:
        'dark melodic rage record, blown-out gliding 808s, triplet hats, heavily auto-tuned emotional hook with layered ad-libs',
    },
  },

  research: {
    sources: [],
    lastReviewed: null,
    notes: 'Draft placeholder. No source research performed yet.',
  },
}
