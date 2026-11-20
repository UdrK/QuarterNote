# Quarter Note ♩ - Implementation & Development Roadmap

This document outlines the development roadmap and milestone achievements of **Quarter Note**, a minimal, fast, zero-bloat self-hosted music streamer designed for ZimaBlade and Docker environments.

Reference documents:
- [scope.md](file:///C:/Users/costa/Home/Opus/Quarter_Note/docs/scope.md): Approved project scope and requirements.
- [architecture.md](file:///C:/Users/costa/Home/Opus/Quarter_Note/docs/architecture.md): Technical architecture, database schema, and sequence diagrams.
- [llm-developer-guide.md](file:///C:/Users/costa/Home/Opus/Quarter_Note/docs/llm-developer-guide.md): Developer recipes and rules for LLM-assisted modification.

---

## Progress Overview

- [x] **Phase 1: Monorepo Workspace & Shared Types Setup**
  - [x] 1.1 Root monorepo configuration (`package.json`, `.gitignore`, `tsconfig.base.json`)
  - [x] 1.2 `shared` package: TypeScript interfaces (`Track`, `Album`, `Artist`, `Playlist`, `ScanStatus`, `AppSettings`)
- [x] **Phase 2: Core Backend (Fastify, SQLite & Library Scanner)**
  - [x] 2.1 `server` package setup (`package.json`, `tsconfig.json`)
  - [x] 2.2 Embedded SQLite layer using `node:sqlite` (`DatabaseSync`) in WAL mode with migrations
  - [x] 2.3 Library crawler and scanner (`music-metadata`, 250x250 WebP thumbnails with `sharp`)
  - [x] 2.4 API Routes:
    - [x] `/api/scan`: asynchronous scanning and status polling
    - [x] `/api/library`: artists, albums, tracks catalog and real-time search
    - [x] `/api/stream/:id`: HTTP `Range` streaming (`206 Partial Content`)
    - [x] `/api/cover/:albumId`: WebP album art and SVG fallbacks
    - [x] `/api/playlists`: playlists CRUD and track management
    - [x] `/api/favorites`: custom divider containers and drag-and-drop sorting
    - [x] `/api/settings`: music directory configuration and default view selector
  - [x] 2.5 Production static file serving (`client/dist`)
- [x] **Phase 3: Frontend (Vue 3, Vite, Tailwind CSS & Audio Engine)**
  - [x] 3.1 `client` package setup (Vue 3, Vite, Tailwind CSS, Lucide icons, Vue Router)
  - [x] 3.2 Reactive Audio Engine (`usePlayerStore`) with HTML5 Audio, speed control (`playbackRate`), and queue
  - [x] 3.3 TUI & BBS Components:
    - [x] `TuiWindow.vue` and `TuiFrame.vue`: curses-style window borders and color variants
    - [x] `CassettePlayer.vue`: cassette tape animation and VU meter needles
    - [x] `SpectrumMeter.vue`: animated 8-band retro frequency bars
    - [x] `QueueDrawer.vue`: slide-over playback queue drawer ('Q')
    - [x] `CrtScanlines.vue`: toggleable retro CRT phosphor shader ('C')
    - [x] `HelpModal.vue`: keybindings modal dialog ('F1' / '?')
  - [x] 3.4 Application Views:
    - [x] `ArtistsView.vue` and `ArtistDetailView.vue` (F2)
    - [x] `AlbumsView.vue` and `AlbumDetailView.vue` (F3)
    - [x] `FavoritesView.vue` (F4) with custom divider containers and HTML5 drag-and-drop
    - [x] `PlaylistsView.vue` and `PlaylistDetailView.vue` (F5)
    - [x] `SettingsView.vue` (F6)
- [x] **Phase 4: Dockerization & CasaOS Deployment**
  - [x] 4.1 Multi-stage `Dockerfile` optimized for Node 24 Alpine
  - [x] 4.2 CasaOS-compliant `docker-compose.yml` with `x-casaos` metadata and tagged image
  - [x] 4.3 Container health check using built-in Node 24 `fetch`
- [x] **Phase 5: Retro TUI Aesthetic & Internationalization**
  - [x] 5.1 Authentic retro BBS / curses terminal overhaul across all views
  - [x] 5.2 Global keyboard shortcuts (`F1`-`F6`, `Space`, `N`, `P`, `/`, `Q`, `C`, `ESC`)
  - [x] 5.3 Full English translation across UI, backend responses, and documentation
