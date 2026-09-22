# DISTORTED

Frontend prototype. Generate a song from your own lyrics in the style of a
chosen artist.

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
   [elevenlabs.io](https://elevenlabs.io) → profile → API keys.
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

1. Pick a style reference (currently only **TRIPPIE REDD**, preselected).
2. Paste your lyrics.
3. Hit `GENERATE SONG`.
4. The app silently loads that artist's hidden Style DNA profile, compiles it
   into a model payload, renders audio, and hands back a playable track with a
   waveform drawn from the real peaks, a seek bar and a WAV download.

The Style DNA is never shown on screen. The UI only ever receives an
`ArtistSummary` (name, tagline, tags, era).

## Architecture

```
src/
  style-dna/
    types.ts              StyleProfile / StyleDNA data model
    registry.ts           artist lookup — the only file to touch when adding one
    artists/
      trippie-redd.ts     DRAFT profile data
  generation/
    prompt.ts             StyleProfile + lyrics -> model payload / composition plan
    types.ts              MusicEngine interface and track types
    engine.ts             picks the engine from VITE_ENGINE
    engines/local.ts      renders audible audio from the DNA (default)
    engines/mock.ts       staged, silent
    audio/render.ts       the Web Audio renderer
    audio/theory.ts       key/scale helpers
    audio/wav.ts          WAV encoding and waveform peaks
  hooks/useGeneration.ts  stage/track/error state for the UI
  components/             presentation only, no DNA access
```

### Adding an artist

1. Create `src/style-dna/artists/<slug>.ts` exporting a `StyleProfile`.
2. Import it in `src/style-dna/registry.ts` and add it to `STYLE_PROFILES`.

Nothing else changes — the selector, the prompt compiler and the engine all read
from the registry.

### The local renderer

`src/generation/audio/render.ts` turns the profile's tempo, key, arrangement,
distortion and saturation into an instrumental: half-time kick and clap, fast
rolling hats, a distorted gliding 808, and a detuned saw lead playing a motif
generated from the seed. Nothing is sampled or lifted from any record.

It renders one short cell per section kind and tiles them — rage is loop-driven
anyway, and one graph holding every hit takes far too long to render. Peak
control happens on the finished buffer, because Web Audio's
`DynamicsCompressorNode` applies its own makeup gain and cannot act as a
limiter here.

Seeded by the lyrics, so the same words always produce the same track.

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
- Generation is not deterministic — the same lyrics give a different track each
  time.

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
`portrait` on the profile (or on the entry in `UPCOMING`) to an image URL and
the card uses it automatically.

### Locked artists

The style grid shows the six names from the mockup, but only artists with a
researched Style DNA profile can be selected. The rest render as `NO DNA YET`
and are disabled until a profile lands in `src/style-dna/artists/`.
