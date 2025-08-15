# Tech Context

## Framework & libs
- SvelteKit + TypeScript
- Tailwind CSS
- Audio: Web Audio API + browser `speechSynthesis`
- Visuals: OGL (WebGL/WebGL2); fallback PixiJS/Canvas
- PWA: Vite PWA plugin

## Dependencies (initial)
- `ogl`
- `@sveltejs/kit`, `svelte`, `vite`, `typescript`
- Tailwind: `tailwindcss`, `postcss`, `autoprefixer`

## Commands (expected)
- Create app: `npm create svelte@latest app -- --yes --template skeleton`
- Enhance: `npx svelte-add@latest tailwindcss pwa typescript --yes`
- Install deps: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`
- Preview: `npm run preview`

## Constraints & notes
- Offline-first: ensure service worker caches HTML/CSS/JS, audio loops, SFX, and shader assets.
- Mobile Safari quirk: user gesture required to start audio; start session after tap.
- TTS voice varies by device/OS; keep pitch/rate parameters conservative to avoid clipping.
- WebGL feature detect and dynamic scaling to avoid thermal throttling.
