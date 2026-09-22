# DISTORTED

A Suno-style song generator for **trap only**. Pick a trap artist style,
paste your lyrics (or go instrumental), hit generate, get two takes, keep the
ones you like in My Songs.

**This build.** Two working engines:

- **`elevenlabs`** — real generation with sung vocals through ElevenLabs Music,
  proxied by `server/index.mjs` so the API key never reaches the browser.
  Needs a key.
- **`local`** (default) — a procedural instrumental rendered in the browser from
  the Style DNA. No key, no network, no vocals. It is **not** a music model;
  it exists so the flow works everywhere.

## Deploy it (no terminal)

The quickest way to have DISTORTED as a URL you just open — on a laptop or a
phone — with nothing installed:

1. Sign in at [vercel.com](https://vercel.com) with your GitHub account.
2. **Add New → Project**, import this repository, pick this branch.
3. Under **Environment Variables** add `ELEVENLABS_API_KEY` with a key from
   [elevenlabs.io](https://elevenlabs.io) → profile → API keys, and
   `ACCESS_CODE` so strangers cannot spend your credits (see below).
4. **Deploy.**

That is all the configuration there is. The app asks its own `/api/health` at
runtime which engine it can use, so no build flags to set: with a key it
generates real tracks with vocals, without one it falls back to the local
instrumental. `api/generate.js` holds the key server-side — it never reaches the
browser.

To add the key later, or change it: project **Settings → Environment
Variables**, then redeploy.

## Run locally

Needs [Node.js 20 or newer](https://nodejs.org) — take the LTS installer.

```bash
npm install
npm start
```

Then open http://localhost:5173. Stop it with Ctrl+C.

For real generation, copy `.env.example` to `.env`, put your key in
`ELEVENLABS_API_KEY`, and run `npm start` again. It prints which engine is
live. `.env` is gitignored — the key never leaves your machine.

Other scripts: `npm run build`, `npm run preview`, `npm run typecheck`. To run
the pieces separately: `npm run server` and `npm run dev`.

## Flow

1. Pick a trap style — rage, Chicago drill, Detroit, melodic, dark, ATL,
   phonk or plugg.
2. Paste your lyrics, or switch on **INSTRUMENTAL** (lyrics optional; `[Hook]` /
   `[Verse]` markers still shape the beat). **+ STRUCTURE** inserts the markers.
3. Hit `GENERATE SONG`. Every press makes **two takes** with different seeds —
   tempo, key, motif and groove differ — and each is playable as soon as it lands.
4. Takes appear under the button and in **My Songs** (sidebar or the LIBRARY
   tab): search, filter (liked / vocals / instrumental), like, read the lyrics,
   download, delete.
5. Everything plays through one bottom player bar with previous / next and seek.

The Style DNA is never shown on screen. The UI only ever receives an
`ArtistSummary` (name, tagline, tags, era).

### Trap lanes

`src/trap/styles.ts` defines the lanes — ATL trap, dark trap, rage, drill,
plugg, phonk, melodic and Detroit — each with prompt descriptors for a music
model and a `sound` block for the local renderer (drum grammar, lead voice,
808 drive/glide, hat rolls).

The grid shows eight styles, named by their sound. DISTORTED is meant to be
public, and offering "the style of <artist>" to the public trades on a real
person's name and likeness, so no card, prompt or copy names one. RAGE keeps
the researched rage-era profile (`artists/trippie-redd.ts`, re-labelled in
`registry.ts`); the other seven play through their lane's generic descriptors
via `src/style-dna/lanes.ts`, marked `unverified` throughout.

### Locking generation

Every generation is billed to the operator's ElevenLabs key. Set
`ACCESS_CODE` (Vercel → Settings → Environment Variables, then redeploy) and
the server refuses to generate without it; the page shows an ACCESS CODE
field above the button and remembers what was typed. Unset means open to
anyone with the link. This is a stopgap until accounts and per-user credits.

### My Songs

Stored in this browser only. Metadata goes to `localStorage`. A local render
is **not** stored as audio — its `SongRecipe` (seed, tempo, key, sections,
sound) rebuilds the identical WAV when played or downloaded. Model output
can't be rebuilt, so that file is kept in IndexedDB.

## Architecture

```
src/
  style-dna/
    types.ts              StyleProfile / StyleDNA data model
    registry.ts           artist lookup — the only file to touch when adding one
    artists/
      trippie-redd.ts     DRAFT profile data
  trap/styles.ts          the trap lanes: prompt descriptors + renderer sound
  style-dna/lanes.ts      lane-based profiles for artists not yet researched
  library/                My Songs: localStorage + IndexedDB, audio URL cache
  generation/
    recipe.ts             profile + lyrics + seed -> SongRecipe (the renderer input)
    prompt.ts             StyleProfile + lyrics -> model payload / composition plan
    types.ts              MusicEngine interface and track types
    engine.ts             picks the engine from VITE_ENGINE
    engines/local.ts      renders audible audio from the DNA (default)
    engines/mock.ts       staged, silent
    audio/render.ts       the Web Audio renderer
    audio/theory.ts       key/scale helpers
    audio/wav.ts          WAV encoding and waveform peaks
  hooks/useGeneration.ts  runs the takes, stage/error state for the UI
  hooks/useLibrary.ts     the persisted song list
  hooks/usePlayer.ts      the single <audio> behind the bottom player bar
  components/             presentation only, no DNA access
```

### Adding an artist

1. Create `src/style-dna/artists/<slug>.ts` exporting a `StyleProfile`.
2. Import it in `src/style-dna/registry.ts` and add it to `STYLE_PROFILES`.

Nothing else changes — the selector, the prompt compiler and the engine all read
from the registry.

### The local renderer

`src/generation/audio/render.ts` plays a `SongRecipe` through the lane's drum
grammar: half-time trap, skipping drill hats with octave-sliding 808s, rage
16ths under a detuned supersaw, plugg bounce, phonk cowbells, Detroit's
off-beat kicks on a two-and-four backbeat. The 808 follows the kick; a seeded
chord loop and two-bar motif play on the lane's lead voice (supersaw, FM
bell, pluck, keys, pad, flute or cowbell). Verses thin the lead out to leave
room for a voice. Nothing is sampled or lifted from any record.

It renders one short cell per section kind and tiles them — trap is
loop-driven anyway, and one graph holding every hit takes far too long to
render. Peak control happens on the finished buffer, because Web Audio's
`DynamicsCompressorNode` applies its own makeup gain and cannot act as a
limiter here.

Seeded per take: the same recipe always renders the same audio.

### How the Style DNA reaches the model

`compileCompositionPlan` in `prompt.ts` turns a profile plus the user's lyrics
into an ElevenLabs `composition_plan`, which the DNA maps onto almost directly:

| Plan field | Comes from |
| --- | --- |
| `chunks[].positive_styles` | `promptSeeds.include` + production palette, drums, bass, vocal delivery, mood, tempo |
| `chunks[].negative_styles` | `promptSeeds.exclude` |
| `chunks[].text` | section label + that section's lyrics |
| `chunks[].duration_ms` | `structure.typicalLengthSeconds`, clamped to a musical section length |

Lyrics split on `[hook]` / `[verse]` markers when present, otherwise on blank
lines.

Instrumental takes skip the plan and send one text prompt with
`force_instrumental` (`compileInstrumentalPrompt`).

**The artist's name is never sent.** Providers reject prompts that name a real
artist — ElevenLabs answers `bad_prompt` / `bad_composition_plan` for
copyrighted references and returns a suggested rephrasing, which the proxy
passes through to the UI. The plan carries sonic descriptors only, which is
exactly what the Style DNA exists to provide. `compileCompositionPlan` also
filters the artist's own name out of the style lists as a backstop.

### Where the key lives

`server/compose.mjs` makes the provider call. Two thin wrappers use it so both
ways of running behave identically:

- `server/index.mjs` — the local proxy, started by `npm start`
- `api/generate.js` — the serverless function used by a deployment

`api/health.js` reports whether a key is configured; the frontend uses it to
pick its engine at runtime.

### Adding another provider

`src/generation/types.ts` defines the `MusicEngine` interface; `engine.ts` picks
the implementation from `ENGINES`. Implement the interface, add it there, select
it with `VITE_ENGINE`. Keep the key server-side.

### Known gaps

- The Style DNA ships in the browser bundle. It is hidden from the UI, but a
  determined reader can find it. Moving the profiles and the plan compiler
  behind the proxy is the productionisation step.
- Model generation is not deterministic — the same lyrics give a different
  track each time. Local takes are reproducible from their recipe.
- Two takes against a model means two provider calls, and two charges.

## Status of the data

`trippie-redd.ts` is a researched draft scoped to the **rage / Trip at Knight
era (2021)**, built from five reference records: Miss The Rage, MP5, Super Cell,
Demon Time and MATT HARDY 999.

Every DNA section carries an `Evidence` record with a `confidence` level:

| level | meaning |
| --- | --- |
| `verified` | stated consistently by primary/reference sources |
| `reported` | stated by reviews or secondary coverage, not measured |
| `estimated` | third-party algorithmic BPM/key analysis — indicative only |
| `unverified` | inference or convention, **not** backed by research |

Producer credits and release data are sourced. Per-track sound-design detail was
not obtainable, so those fields are marked rather than invented, and
`research.openQuestions` lists exactly what is still missing.

The profile describes general production character. It does not copy any
specific track, melody, lyric or voice.

## Design

Built to the supplied DISTORTED mockup: sidebar shell, top tab bar, distressed
hero wordmark, artist search, trending-style grid, selected-style panel, lyrics
box with a 5000-character counter, and the torn purple GENERATE SONG bar.

The wordmark is not a font — it is SVG text run through a filter chain
(`src/components/DistressedTitle.tsx`) that composites turbulence out of the
glyphs to chew holes and splinters into them, then displaces the result so no
edge stays straight. Background concrete and film grain are generated the same
way, so no texture bitmaps ship with the app.

Fonts (Anton, Archivo Black, Barlow Condensed, JetBrains Mono, Permanent Marker)
are self-hosted in `public/fonts` — no external CDN, and Latin-Extended accents
are covered.

### Artist portraits

No artist photography ships with this prototype. Each card renders a
deterministic placeholder mark until a licensed image is supplied: set
`portrait` on the profile (or on the entry in `LANE_ARTISTS`) to an image URL and
the card uses it automatically.

### Locked artists

The style grid shows the six names from the mockup, but only artists with a
researched Style DNA profile can be selected. The rest render as `NO DNA YET`
and are disabled until a profile lands in `src/style-dna/artists/`.
