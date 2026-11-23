# The Promise & The Pig — A Tale of Zengzi

A 55.5-second pure Vanilla JavaScript hand-drawn paper-collage animated short film retelling the classical Chinese fable of **Zengzi Killing a Pig** (*Han Feizi*, c. 3rd Century BCE), presented entirely in English with multi-voice neural narration, original Web Audio pentatonic score, and handcrafted paper/foley sound effects.

## Highlights
- **100% Pure Vanilla JavaScript** — HTML5 Canvas 2D (`1920×1080`) + Web Audio API, zero external JS frameworks or CDN dependencies.
- **Whimsical Hand-Drawn Collage Aesthetic** — 10 bespoke watercolor/gouache deckled paper cutouts composited over procedurally synthesized handmade paper textures, stop-motion frame boil, pop-up book physics, and torn-paper transitions.
- **Multi-Voice Neural Audio & Original Score** — 4 distinct neural TTS voices with word-level caption sync, live PCM amplitude-driven character animation, original pentatonic folk music with auto-ducking, and synchronized foley SFX.

## Running Locally
Simply open `index.html` directly in any modern browser (all runtime media is bundled offline in `js/media_bundle.js`), or serve the directory via any static HTTP server.

## Project Structure
- `index.html` — Theater player shell and controls
- `js/app.js` — Playback controller, chapter scrubber, and animation loop
- `js/collage_gfx.js` — Procedural paper textures, cutout renderer, props, and transitions
- `js/scenes.js` — 6-act, 55.5-second director choreography
- `js/audio_engine.js` — Web Audio TTS playback, PCM envelopes, pentatonic score, and foley SFX
- `js/media_bundle.js` — Self-contained offline WebP + MP3 media bundle
- `assets/`, `audio/`, `scripts/` — Source cutout PNGs, individual MP3 tracks, word-timing manifest, and build utilities
