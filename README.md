# DISTORTED

Frontend prototype. Generate a song from your own lyrics in the style of a
chosen artist.

**Phase 1 — this build.** UI, flow and the internal Style DNA architecture only.
No music AI is connected and no audio is produced: `GENERATE SONG` runs a mock
engine that fakes the render stages and returns a stub track card.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
```

Other scripts: `npm run build`, `npm run preview`, `npm run typecheck`.

## Flow

1. Pick a style reference (currently only **TRIPPIE REDD**, preselected).
2. Paste your lyrics.
3. Hit `GENERATE SONG`.
4. The app silently loads that artist's hidden Style DNA profile, compiles it
   into a model payload, and — for now — mocks the render.

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
    engine.ts             MusicEngine interface + MockMusicEngine
  hooks/useGeneration.ts  stage/track/error state for the UI
  components/             presentation only, no DNA access
```

### Adding an artist

1. Create `src/style-dna/artists/<slug>.ts` exporting a `StyleProfile`.
2. Import it in `src/style-dna/registry.ts` and add it to `STYLE_PROFILES`.

Nothing else changes — the selector, the prompt compiler and the engine all read
from the registry.

### Connecting a real music AI later

`src/generation/engine.ts` defines the `MusicEngine` interface and exports a
single `musicEngine` instance. Implement the interface against a real API and
swap that one export; `compileStylePrompt` in `prompt.ts` already produces the
prompt, negative prompt, lyrics and parameters such a backend needs.

## Status of the data

Every value in `trippie-redd.ts` is **draft placeholder data** written from
general impressions — nothing is researched, measured or sourced. `status` is
`'draft'` and `research.sources` is empty. Real style research is phase 2.

## Design

Dark cybergrunge: black and white with purple accents, film grain, scanlines,
glitch-split display type, condensed and monospaced UI. Fonts (Archivo Black,
Barlow Condensed, JetBrains Mono) are self-hosted in `public/fonts`, so the app
needs no external CDN and covers Latin-Extended accents.
