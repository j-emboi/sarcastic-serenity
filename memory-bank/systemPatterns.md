# System Patterns

## Architecture overview
- Client-only PWA (SvelteKit) with offline caching of core assets.
- Feature layers:
  - UI/State: Svelte + stores, Tailwind components
  - Audio: Web Audio mixer (bg loop, TTS, ambient SFX), ducking and crossfades
  - Quotes: local JSON catalog, selection by persona/intensity, scheduler, profanity filter
  - Visuals: OGL (WebGL/WebGL2) scene framework with shader packs and transitions
  - Breathing: Advanced pacer system with multiple patterns, animations, and audio guidance
  - Orchestrator: session FSM + master clock

## Session Orchestrator (FSM)
States: Idle → Preload → Running → Paused → Completed
- Preload: cache selected audio loop, SFX, and initial scene resources
- Running: drive quote cadence, TTS ducking, scene transitions, pacer ticks
- Paused: freeze clocks, pause audio
- Completed: cleanup and summary

## Audio patterns
- Graph: BackgroundGain → MasterGain; TTSSource → DuckingSidechain → MasterGain; SFX → MasterGain; BreathingAudio → MasterGain
- Ducking: sidechain envelope reduces bg gain 6–9 dB when TTS starts, releases after utterance
- Crossfades: ramp between loops when background changes
- Breathing Audio: Multi-layered system with transition sounds, voice guidance, and ambient effects

## Quote selection
- Filters: persona, intensity, profanity level
- Randomized with seed per session for reproducibility
- Scheduler window: 25–45s with jitter

## Visuals engine (GPU-first)
- OGL scenes with parameterized uniforms and render-to-texture (ping-pong) when helpful
- Feature-detect WebGL2 and float textures; degrade resolution or algorithm if unavailable
- Transition director: crossfade FBOs or morph key uniforms over time
- Quality scaler: monitor frame time; step down particle counts or resolution
- Fallback path: PixiJS/Canvas simple scenes when device too slow
- Breathing Animations: 7 sophisticated shader-based animations with real-time switching

## Breathing Pacer System
- **Pattern Engine**: Precise timing with requestAnimationFrame, support for 4-phase patterns
- **Visual Engine**: 7 animation styles with advanced GLSL shaders and breathing synchronization
- **Audio Engine**: Multi-layered system with voice guidance, ambient sounds, and nature effects
- **Pattern Categories**: 11 patterns organized by use case (Relaxation, Energy, Focus, Sleep, Stress Relief)
- **Real-time Switching**: Animation and pattern changes apply immediately during sessions

## Accessibility & settings
- Respect `prefers-reduced-motion` (pause or simplify scenes)
- Always display quote captions; keyboard navigable controls
- Persist settings to `localStorage`
- Voice guidance for breathing sessions with fallback to beep patterns


