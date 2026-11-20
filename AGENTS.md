# AGENTS.md - LLM & AI Developer Guide for Quarter Note ♩

> This guide is specifically written for AI agents (Claude, Gemini, ChatGPT, Cursor, Copilot, Aider) and human developers using LLMs to contribute to, extend, or maintain **Quarter Note**.

---

## 1. Project Philosophy & Golden Rules

1. **Retro BBS / Curses TUI Aesthetic is Sacred**:
   - The entire UI is built with a nostalgic terminal / BBS / curses aesthetic: monospace font (`font-mono`), windowed ASCII frames (`TuiWindow`, `TuiFrame`), brackets `[ BUTTON ]`, uppercase headers, terminal green/cyan/amber accents, and optional CRT scanlines (`CrtScanlines.vue`).
   - **NEVER** introduce modern rounded glassmorphism, floating blur cards, or generic flat UI designs.
2. **Zero Bloat & Peak Performance**:
   - The backend runs on **Node 24 LTS** using the native built-in **`node:sqlite`** (`DatabaseSync`) module. Do NOT import `better-sqlite3`, `sqlite3`, or heavy ORMs (Prisma, TypeORM).
   - Fast startup, minimal memory footprint (~30-50 MB RAM).
3. **Bit-Perfect Streaming (No Transcoding)**:
   - Audio is streamed directly as raw bytes with HTTP `Range` headers (`206 Partial Content`). Do not inject FFmpeg transcoding or lossy conversions.
4. **Zero Login (Single User Local / Home Server)**:
   - Quarter Note is designed for home networks and personal NAS devices (like ZimaBlade). No authentication, JWTs, user management, or cloud callbacks.

---

## 2. Monorepo Structure

```text
Quarter_Note/
├── shared/                   # @quarter-note/shared: Centralized TypeScript types
│   ├── src/index.ts          # Track, Album, Artist, Playlist, Favorite, ScanStatus, etc.
│   └── package.json
│
├── server/                   # Fastify backend (Port 8080)
│   ├── src/
│   │   ├── index.ts          # Fastify bootstrap, static file serving, routes registration
│   │   ├── db/
│   │   │   ├── db.ts         # SQLite init, WAL mode, schema & safe migrations
│   │   │   └── repository.ts # Clean CRUD functions for database queries
│   │   ├── routes/
│   │   │   ├── scan.ts       # POST /api/scan, GET /api/scan/status
│   │   │   ├── library.ts    # GET artists, albums, tracks, instant search
│   │   │   ├── stream.ts     # GET /api/stream/:id with 206 Range headers
│   │   │   ├── cover.ts      # GET /api/cover/:albumId, artist & playlist images
│   │   │   ├── playlists.ts  # CRUD for custom playlists & tracks
│   │   │   ├── favorites.ts  # CRUD for favorite containers & items
│   │   │   └── settings.ts   # GET/POST /api/settings (musicDir, defaultView)
│   │   └── scanner/
│   │       └── scanner.ts    # Crawls /music, extracts tags via music-metadata & sharp
│   └── package.json
│
├── client/                   # Vue 3 SPA + Vite + Tailwind CSS
│   ├── src/
│   │   ├── main.ts           # Vue app entrypoint
│   │   ├── App.vue           # Root component, global keyboard shortcut listener
│   │   ├── api/client.ts     # Typed fetch wrappers for all server endpoints
│   │   ├── stores/
│   │   │   └── player.ts     # usePlayerStore: reactive HTML5 audio engine
│   │   ├── components/
│   │   │   ├── TuiWindow.vue # Monospace window frame with ASCII title and hotkey badge
│   │   │   ├── TuiFrame.vue  # Sub-container frame with custom border colors
│   │   │   ├── TuiHeader.vue # ASCII banner, clock, and search input prompt
│   │   │   ├── CassettePlayer.vue # Docked bottom player with spinning cassette reels
│   │   │   ├── SpectrumMeter.vue  # Animated 8-bar retro frequency visualizer
│   │   │   ├── QueueDrawer.vue    # Slide-over playback queue drawer ('Q')
│   │   │   ├── CrtScanlines.vue   # Retro CRT shader overlay ('C')
│   │   │   └── HelpModal.vue      # F1 / '?' Keybindings reference modal
│   │   └── views/
│   │       ├── ArtistsView.vue    # F2: Artists grid with custom/album photos
│   │       ├── ArtistDetailView.vue
│   │       ├── AlbumsView.vue     # F3: Catalog of 250x250 WebP album covers
│   │       ├── AlbumDetailView.vue
│   │       ├── FavoritesView.vue  # F4: Custom divider containers with Drag & Drop
│   │       ├── PlaylistsView.vue  # F5: Custom playlists management
│   │       ├── PlaylistDetailView.vue
│   │       └── SettingsView.vue   # F6: Music folder & default view configuration
│   └── package.json
│
├── docs/                     # Full technical documentation
│   ├── architecture.md       # Architecture diagrams, database ER, sequence flows
│   ├── scope.md              # Requirements and feature boundaries
│   ├── development.md        # Development plan and roadmap
│   └── llm-developer-guide.md# In-depth LLM modification guide
├── docker-compose.yml        # CasaOS & ZimaBlade optimized Docker Compose
├── Dockerfile                # Multi-stage production build (Node 24 Alpine)
└── package.json              # Monorepo root with npm workspaces
```

---

## 3. Essential Commands

Always run commands from the repository root:

```bash
# 1. Install all dependencies across monorepo workspaces
npm install

# 2. Build everything (shared -> client -> server)
npm run build

# 3. Development Mode
# Terminal 1: Backend API (runs on http://localhost:8080)
npm run dev:server

# Terminal 2: Vite Frontend (runs on http://localhost:5173 with proxy to 8080)
npm run dev:client
```

---

## 4. Key Implementation Patterns for LLMs

### A. Sharing Types Across Client and Server
1. When modifying or creating data models, **always edit `shared/src/index.ts` first**.
2. Recompile the shared package:
   ```bash
   npm --workspace=shared run build
   ```
3. Import the shared types using `@quarter-note/shared` in both server and client.

### B. Modifying the SQLite Database (`node:sqlite`)
1. Table schemas are defined in `server/src/db/db.ts`.
2. To add columns or tables, write an `ALTER TABLE` statement wrapped in a `try / catch` block to preserve backward compatibility with existing user databases:
   ```typescript
   try {
     db.exec('ALTER TABLE playlists ADD COLUMN image_path TEXT;');
   } catch {
     // Ignore if column already exists
   }
   ```
3. Keep database access functions inside `server/src/db/repository.ts`.
4. Always use prepared statements (`db.prepare(...)`) with parameter bindings (`.run(...)`, `.all(...)`, `.get(...)`) to prevent SQL injection.

### C. Creating or Updating API Routes
1. Create or modify route handlers inside `server/src/routes/`.
2. Register the route plugin in `server/src/index.ts`.
3. Add the corresponding typed API client call in `client/src/api/client.ts`.

### D. Writing TUI Frontend Components
1. Use Vue 3 `<script setup lang="ts">`.
2. Wrap primary screens in `<TuiWindow title="..." badge="..." hotkey="..." variant="...">`.
3. Available color variants: `'green'` (default), `'cyan'`, `'amber'`, `'magenta'`, `'blue'`.
4. Maintain keyboard shortcuts:
   - Check `client/src/App.vue` where the global `window.addEventListener('keydown', ...)` handler resides.
   - Guard inputs: ignore global shortcuts when the user is typing in `<input>` or `<textarea>`.

### E. Docker & CasaOS Rules
1. **Never add `VOLUME` in `Dockerfile`**: This causes Docker and CasaOS to generate unintended empty anonymous volumes in `/var/lib/docker/volumes/`.
2. **Always retain `image: quarter-note:latest` in `docker-compose.yml`**: CasaOS requires this tag to make volume editing available in the GUI.
3. **Always preserve the `x-casaos` block**: CasaOS uses `port_map: "8080"`, `scheme: http`, `index: /`, and `main: quarter-note` to render the app launch button.
