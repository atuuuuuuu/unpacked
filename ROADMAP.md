# Roadmap

Plans change; the issue tracker is the source of truth. Items marked **help wanted** are good for contributors.

## Done in v0.1

- Spotify (Extended streaming history and Account data), Instagram (followers and following, JSON), YouTube (Takeout
  watch history, JSON)
- Drop-anywhere import, ZIP streaming in a Web Worker, size limits, clear errors with value-free format reports
- Fictional sample data for every platform
- Dashboards with charts, year filters, search, sorting and Instagram export comparison
- Share cards (PNG), light and dark themes, installable PWA that works offline
- Strict CSP, a live network monitor, and an e2e test that fails on any off-site request
- Unit, end-to-end, accessibility and responsive tests in CI

## Next

- **More platforms** (help wanted): Netflix viewing activity, Apple Music, Discord, Reddit, TikTok, Letterboxd, Snapchat,
  LinkedIn, ChatGPT conversations, Steam
- YouTube Takeout in HTML (the default format) and localized Takeout file names
- Compare two Spotify exports (what changed in your top artists)
- Export a dashboard as an image or PDF, made locally
- More share card designs

## Later

- A cross-platform timeline: your 2019 across every app
- "What they inferred about you": ad interests and categories that platforms include in exports
- An optional SQL explorer over your own data (DuckDB-WASM), still fully local
- Translations
