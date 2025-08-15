# Project Brief

## Working Title
Sarcastic Serenity (offline-first wellness web app)

## Goal
Create a small, installable, offline-first web app that runs timed relaxation sessions with:
- Background ambient loops (waves, rain, birds, noise)
- Sarcastic/edgy motivational quotes (unsafe by default for preview) spoken with a playful “puppet” vibe via device TTS
- On-screen captions of the quote
- Random, satisfying GPU visuals (OGL/WebGL) that loop or slowly morph
- Breathing pacer overlay (box and 4-7-8)

## Core Features (MVP)
- Session setup: duration, persona, roast intensity slider (gentle → spicy), profanity toggle (default OFF = unsafe), background selection + volume, serendipity (ambient SFX probability), scene pack selection, breathing pacer toggle + pattern.
- Audio engine: Web Audio mixer (bg loop + TTS + SFX), seamless loops, crossfades, ducking during TTS.
- Quote engine: local JSON catalog tagged by persona/intensity; scheduler with slight jitter; profanity handling per toggle.
- Voice: browser `speechSynthesis` (offline, free); playful pitch/rate; cache within session.
- Visuals: OGL shader scenes with adaptive quality and graceful fallbacks (PixiJS/Canvas if needed).
- PWA: offline caching of core app, loops, SFX, and shader assets.

## Constraints
- School project; keep free to use.
- Offline-first; no analytics.
- CC0/royalty-free assets only; include credits page.
- Target mobile and desktop browsers (Safari, Chrome, Edge, Firefox).

## Success Criteria
- Runs fully offline after first load and can complete a full session.
- Audio loops are seamless; TTS is audible and ducks background; quotes appear on-screen.
- Visuals maintain acceptable performance with automatic quality scaling/fallbacks.
- Setup is simple; user can complete a session without confusion.


