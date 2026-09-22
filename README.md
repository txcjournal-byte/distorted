# DISTORTED

Frontend prototype. Generate a song from your own lyrics in the style of a
chosen artist.

**This build.** `GENERATE SONG` produces real, audible audio — rendered in the
browser from the Style DNA, with no API key and no network. It is a procedural
instrumental, **not a music model**, and it cannot sing your lyrics. Its job is
to make the whole flow testable and to show what the Style DNA parameters
actually drive. A real music model still has to be connected.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
```

Other scripts: `npm run build`, `npm run preview`, `npm run typecheck`.

Set `VITE_ENGINE` (see `.env.example`) to pick the engine: `local` (default,
audible) or `mock` (staged, silent).

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
    prompt.ts             StyleProfile + lyrics -> model payload
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

### Connecting a real music AI later

`src/generation/types.ts` defines the `MusicEngine` interface; `engine.ts` picks
the implementation. Add a provider engine to `ENGINES` and select it with
`VITE_ENGINE`. `compileStylePrompt` already produces the prompt, negative
prompt, lyrics and parameters such a backend needs.

Two things that implementation must respect:

- **The API key cannot ship to the browser.** The provider engine should call
  your own server, which holds the key and proxies the request.
- **Do not send the artist's name.** Most providers reject prompts naming a real
  artist. The compiled prompt deliberately carries sonic attributes only
  (detuned supersaw lead, distorted 808, half-time groove, tempo, key) — which
  is exactly why the Style DNA research matters.

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
