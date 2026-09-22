import type { StyleProfile } from '../types'

/**
 * TRIPPIE REDD — rage / "Trip at Knight" era (2021).
 *
 * Scope: this profile describes the general production character of the rage
 * lane Trippie Redd helped define around Trip at Knight. It is a description of
 * a production style — not a copy of any track, melody, lyric or voice.
 *
 * Evidence discipline: see `evidence` below. Producer credits, release data and
 * the genre-level sonic description are sourced. Per-track patch/mix detail was
 * NOT available from reliable sources and is marked 'unverified' rather than
 * invented. `research.openQuestions` lists what is still missing.
 */
export const trippieRedd: StyleProfile = {
  id: 'trippie-redd',
  displayName: 'TRIPPIE REDD',
  tagline: 'Rage era. Detuned leads, distorted 808s, hooks that never sit still.',
  quote: 'EMOTION IN CHAOS',
  blurb:
    'Bright detuned synth leads, distorted 808s, fast rolling hi-hats and shouted, heavily tuned hooks — the rage sound of the Trip at Knight era.',
  tags: ['RAGE', 'MELODIC', 'FUTURISTIC'],
  era: 'TRIP AT KNIGHT · 2021',
  origin: 'CANTON, OH',
  status: 'draft',
  version: '0.2.0-draft-rage-era',
  portrait: null,
  lane: 'rage',

  dna: {
    // Genre-level, sourced. Rage is described as trap crossed with future bass,
    // EDM and hyperpop: short looping stereo-wide synth leads over distorted
    // 808s. Reviews of the album describe it as synth-heavy, digital, "almost
    // bitcrushed", with prominent 808s.
    production: {
      palette: [
        'bright detuned supersaw lead',
        'arpeggiated EDM-derived synth line',
        'short looping stereo-wide synth motif',
        'bell/pluck synth counter-line',
        'sustained synth pad bed',
      ],
      textures: [
        'digital, hard-clipped top end',
        'bitcrush-adjacent grit on leads',
        'wide stereo spread on the lead loop',
        'hyperpop-leaning colour rather than sample-based warmth',
      ],
      drums: [
        'programmed trap kit',
        'fast rolling hi-hats',
        'clap/snare on the backbeat',
        'roll fills into section changes',
      ],
      bass: [
        'distorted 808 carrying the low end',
        '808 doubling the lead motif',
        'pitched 808 glides between roots',
      ],
      distortion: 0.8,
      space: 0.45,
    },

    // Sourced at genre level: typical rage tempos sit around 130-150 BPM, with
    // half-time feel. Third-party analysis of the reference tracks reads them
    // near 154-158 BPM (equivalently ~77-79 half-time) — see referenceTracks.
    rhythm: {
      tempoRange: [130, 160],
      groove: ['half-time trap pulse', 'double-time hat activity over a half-time backbeat'],
      hiHatPatterns: ['fast rolling hats', 'triplet and 1/32 roll fills'],
      swing: 0.1,
    },

    // Corrected from the phase-1 placeholder: available analyses of the
    // reference tracks read as MAJOR mode, not the dark minor assumed earlier.
    // Bright major-leaning leads over a distorted low end is characteristic of
    // rage; treat the specific keys as estimates only.
    harmony: {
      // First entry is what the prompt compiler hands downstream, so it stays
      // a usable key label — with the estimate flag kept visible, not dropped.
      preferredKeys: ['E♭ major (est.)', 'C♯ major (est.)', 'major-mode centres generally'],
      scales: ['major', 'major with added-9 colour'],
      progressions: [
        'short 2-4 bar loop repeated with little harmonic movement',
        'added-9 / suspended colour over a static root',
      ],
      mood: ['euphoric', 'aggressive', 'bright over a heavy low end'],
    },

    // Sourced at genre level: shouted/projected delivery, heavy autotune,
    // catchy repetitive hooks, ad-lib heavy.
    vocal: {
      delivery: ['shouted, projected delivery', 'melodic sung-rap', 'chanted hook phrasing'],
      register: 'pushed upper range on hooks — described as projective rather than whispered',
      adLibs: ['dense ad-lib layer answering the lead line'],
      autotuneIntensity: 0.85,
      layering: ['stacked hook doubles', 'ad-lib layer panned around the lead'],
      emotionalTone: ['manic', 'euphoric', 'defiant'],
    },

    // Sourced at genre level: short, loop-driven arrangements that hit quickly
    // and end before the energy drops. Reference tracks run ~2:40-2:45.
    structure: {
      arrangement: ['short intro on the loop', 'hook', 'verse', 'hook', 'verse', 'hook/outro'],
      typicalLengthSeconds: [150, 180],
      hookDensity: 0.85,
      intro: 'loop established immediately, full drums and 808 enter within the first bars',
    },

    // NOT researched. Deliberately generic and marked unverified — the brief
    // was production character, and no reliable lyrical analysis was found.
    lyrical: {
      themes: [],
      imagery: [],
      rhymeStyle: ['short repeated refrain lines', 'chant-friendly phrasing'],
      cadenceDensity: 8,
      vocabularyColour: [],
    },

    // Inferred from the sourced description (distorted 808s, digital/clipped
    // top end, loud forward vocals). Not a documented mix chain.
    mix: {
      lowEnd: '808 pushed forward and driven into distortion',
      highEnd: 'bright and digital, hats and leads sitting high',
      vocalPlacement: 'loud and centred, hook widened by doubles and ad-libs',
      saturation: 0.8,
    },

    promptSeeds: {
      include: [
        'rage beat',
        'distorted 808',
        'bright detuned supersaw lead',
        'short looping stereo-wide synth motif',
        'fast rolling hi-hats',
        'half-time trap groove',
        'heavily auto-tuned shouted hook',
        'hyperpop-leaning digital production',
      ],
      exclude: [
        'boom bap',
        'sample-based soul loop',
        'acoustic ballad',
        'clean polished pop mix',
        'orchestral',
        'lo-fi jazz',
      ],
      spine:
        'high-energy rage record: a short, bright, detuned synth loop over a distorted 808 and fast rolling hi-hats, half-time groove, digital and hard-clipped, with a shouted heavily auto-tuned hook and a dense ad-lib layer',
    },
  },

  evidence: {
    production: {
      confidence: 'reported',
      note:
        'Genre-level description of rage (trap + future bass/EDM/hyperpop; short looping stereo-wide synth leads, distorted 808s) plus album reviews describing Trip at Knight as synth-heavy, digital, "almost bitcrushed", with prominent 808s. No per-track patch, plugin or sound-design detail was verifiable.',
      sources: [
        'https://hip-hop-music.fandom.com/wiki/Rage',
        'https://www.complex.com/music/a/antonio-johri/best-rage-rap-songs-of-all-time',
        'https://www.nme.com/reviews/album/trippie-redd-trip-at-knight-album-review-juice-wrld-xxxtentacion-drake-3024794',
        'https://www.albumoftheyear.org/album/322146-trippie-redd-trip-at-knight.php',
      ],
    },
    rhythm: {
      confidence: 'estimated',
      note:
        'Genre sources place rage around 130-150 BPM with fast rolling hi-hats. Third-party algorithmic analysis of the reference tracks reads ~154-158 BPM (or ~77-79 half-time). Algorithmic readings are indicative only and disagree with each other on half/double time.',
      sources: [
        'https://hip-hop-music.fandom.com/wiki/Rage',
        'https://www.hooktheory.com/theorytab/view/trippie-redd/miss-the-rage',
        'https://tunebat.com/Info/Matt-Hardy-999-Trippie-Redd-Juice-WRLD/2W5cWH1DZ19KFA6n7G1eiK',
      ],
    },
    harmony: {
      confidence: 'estimated',
      note:
        'Only third-party algorithmic key analysis was available (Miss The Rage read as E-flat major by Hooktheory and G-sharp/A-flat major by Tunebat; Matt Hardy 999 read as C-sharp major). Sources agree on major mode but not on the centre. No published transcription was found.',
      sources: [
        'https://www.hooktheory.com/theorytab/view/trippie-redd/miss-the-rage',
        'https://tunebat.com/Info/Miss-The-Rage-feat-Playboi-Carti-Trippie-Redd-Playboi-Carti/2BITQ360Knh6qNAOqR7Dyq',
        'https://tunebat.com/Info/Matt-Hardy-999-Trippie-Redd-Juice-WRLD/2W5cWH1DZ19KFA6n7G1eiK',
      ],
    },
    vocal: {
      confidence: 'reported',
      note:
        'Genre-level: rage vocals described as shouted/projected rather than whispered, heavily auto-tuned, ad-lib heavy, with catchy repetitive hooks. No measurement of range, tuning settings or layer counts was available.',
      sources: [
        'https://hip-hop-music.fandom.com/wiki/Rage',
        'https://www.complex.com/music/a/antonio-johri/best-rage-rap-songs-of-all-time',
      ],
    },
    structure: {
      confidence: 'reported',
      note:
        'Genre sources describe short, loop-driven structures that build fast and end before the energy dips. Track durations of the reference songs (~2:40-2:45) are from streaming listings. Bar-level arrangement maps were not available.',
      sources: [
        'https://hip-hop-music.fandom.com/wiki/Rage',
        'https://www.albumoftheyear.org/song/13137-super-cell/',
        'https://audiomack.com/trippie-redd/song/mp5-1',
      ],
    },
    mix: {
      confidence: 'unverified',
      note:
        'Inferred from the sourced sonic description (distorted 808s, digital/clipped top end, forward vocals). No engineer credits, mix notes or interviews describing the mix chain were found. Replace before treating as fact.',
      sources: [],
    },
    lyrical: {
      confidence: 'unverified',
      note:
        'Out of scope for this research pass and intentionally left near-empty. The brief was production character, and DISTORTED never rewrites the user\'s own lyrics.',
      sources: [],
    },
  },

  research: {
    scope:
      'Rage / Trip at Knight era only (2021). Describes general production character, not any specific track, melody, lyric or voice.',

    referenceTracks: [
      {
        title: 'Miss The Rage',
        year: 2021,
        release: 'Lead single, released 7 May 2021; Trip at Knight',
        features: ['Playboi Carti'],
        producers: ['Loesoe'],
        tempoEstimate: '~156 BPM (Hooktheory); Tunebat reads ~77/154 half/double time',
        keyEstimate: 'E-flat major (Hooktheory); G-sharp/A-flat major (Tunebat) — sources disagree',
        notes: [
          'Peaked at No. 11 on the Billboard Hot 100 — Trippie Redd\'s highest-charting song.',
          'Widely cited as the track the "rage" microgenre label is named after.',
          'Went viral on TikTok ahead of release.',
        ],
        sources: [
          'https://www.songfacts.com/facts/trippie-redd/miss-the-rage',
          'https://www.hooktheory.com/theorytab/view/trippie-redd/miss-the-rage',
          'https://hip-hop-music.fandom.com/wiki/Rage',
        ],
      },
      {
        title: 'MP5',
        year: 2021,
        release: 'Trip at Knight, 20 August 2021',
        features: ['SoFaygo'],
        producers: ['Star Boy'],
        tempoEstimate: null,
        keyEstimate: null,
        notes: [
          'Runs about 2:40.',
          'Marked SoFaygo\'s first entry on the Billboard Hot 100.',
          'No reliable description of its production detail was found.',
        ],
        sources: [
          'https://audiomack.com/trippie-redd/song/mp5-1',
          'https://www.albumoftheyear.org/song/13134-mp5/',
        ],
      },
      {
        title: 'Super Cell',
        year: 2021,
        release: 'Trip at Knight, 20 August 2021',
        features: [],
        producers: ['WNDWS', 'Nadddot'],
        tempoEstimate: null,
        keyEstimate: null,
        notes: [
          'Album track 6, running about 2:41.',
          'No reliable description of its production detail was found.',
        ],
        sources: ['https://www.albumoftheyear.org/song/13137-super-cell/'],
      },
      {
        title: 'Demon Time',
        year: 2021,
        release: 'Trip at Knight, 20 August 2021',
        features: ['Ski Mask the Slump God'],
        producers: ['Nadddot'],
        tempoEstimate: null,
        keyEstimate: null,
        notes: [
          'Writing credits listed as Andreas Cristian Matura, Michael Lamar White II and Stokeley Goulbourne.',
          'No reliable description of its production detail was found.',
        ],
        sources: [
          'https://www.shazam.com/en-us/song/1711604668/demon-time',
          'https://open.spotify.com/track/1hE8iI3YK9x1VUBDtSzg3x',
        ],
      },
      {
        title: 'MATT HARDY 999',
        year: 2021,
        release: 'Trip at Knight, 20 August 2021 (track 10)',
        features: ['Juice WRLD'],
        producers: ['Rip', 'Cashmere Cat', 'Jasper Harris', 'Aaron Shadrow', 'Star Boy', 'Outtatown'],
        tempoEstimate: '~79 BPM (Tunebat) — i.e. ~158 double time',
        keyEstimate: 'C-sharp/D-flat major (Tunebat)',
        notes: [
          'Reworked from a song that leaked earlier; the album version was rebuilt on a new rage instrumental in 2021.',
          'The largest production team of the five reference tracks.',
        ],
        sources: [
          'https://www.whosampled.com/Trippie-Redd/Matt-Hardy-999/',
          'https://tunebat.com/Info/Matt-Hardy-999-Trippie-Redd-Juice-WRLD/2W5cWH1DZ19KFA6n7G1eiK',
        ],
      },
    ],

    sources: [
      'https://www.songfacts.com/facts/trippie-redd/miss-the-rage',
      'https://hip-hop-music.fandom.com/wiki/Rage',
      'https://www.complex.com/music/a/antonio-johri/best-rage-rap-songs-of-all-time',
      'https://www.nme.com/reviews/album/trippie-redd-trip-at-knight-album-review-juice-wrld-xxxtentacion-drake-3024794',
      'https://www.albumoftheyear.org/album/322146-trippie-redd-trip-at-knight.php',
      'https://www.hooktheory.com/theorytab/view/trippie-redd/miss-the-rage',
      'https://www.whosampled.com/Trippie-Redd/Matt-Hardy-999/',
      'https://www.discogs.com/release/19945594-Trippie-Redd-Trip-At-Knight',
    ],

    lastReviewed: '2026-09-22',

    openQuestions: [
      'No per-track sound-design detail (synth patches, plugins, drum sources) could be sourced — producer interviews for these five records were not reachable.',
      'BPM and key values come only from third-party algorithmic analysis and disagree on half/double time and on the key centre. A manual pass on the records would settle both.',
      'No mix or mastering credits were found, so the mix section is inference from the sonic description.',
      'Arrangement is described at genre level only; no bar-level maps of the reference tracks were available.',
      'Album reviews used for the sonic description are partly user reviews rather than staff criticism — weaker sourcing than the credit data.',
    ],

    notes:
      'Second pass. Credits, release data and genre-level sonic character are sourced; per-track technical detail is not. Nothing in this profile is copied from a specific track, melody, lyric or voice — it describes a production lane.',
  },
}
