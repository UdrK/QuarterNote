# Quarter Note ♩ - Technical Architecture

Questo documento descrive l'architettura tecnica, i contratti dati e i componenti del progetto **Quarter note**.

---

## 1. Tecnologie e Dipendenze

```mermaid
flowchart LR
    subgraph Client ["Client (Vue 3 + Vite)"]
        UI["Vue 3 (Composition API)"]
        TW["Tailwind CSS + Lucide Icons"]
        AudioEngine["HTML5 Audio + playbackRate"]
    end

    subgraph Server ["Server (Node.js 24 + TypeScript)"]
        Fastify["Fastify Web Framework"]
        Scanner["Directory Scanner (music-metadata)"]
        Thumbnails["Image Processor (sharp)"]
        DB["SQLite (better-sqlite3, WAL mode)"]
    end

    subgraph Storage ["Storage Mounts (ZimaBlade / Docker)"]
        MusicDir["/music (Read-Only Audio Files)"]
        DataDir["/data (quarter.db + covers/ cache)"]
    end

    Client -->|HTTP REST & Range Stream| Fastify
    Fastify --> DB
    Fastify -->|Stream audio| MusicDir
    Scanner -->|Read tags & embedded art| MusicDir
    Scanner -->|Store metadata| DB
    Thumbnails -->|Save 250x250 webp| DataDir
```

- **Runtime**: Node.js 24 (LTS)
- **Backend**:
  - `fastify`: Server HTTP ad altissime prestazioni e basso overhead di memoria.
  - `@fastify/static`: Servizio file statici (frontend compilato e copertine).
  - `@fastify/cors`: CORS per sviluppo locale.
  - `better-sqlite3`: Driver SQLite sincrono nativo C++, il più veloce in ambiente Node.
  - `music-metadata`: Estrazione metadati (ID3v1, ID3v2, FLAC, Vorbis, MP4/AAC, Opus, Ogg, WAV) e copertine embedded.
  - `sharp`: Generazione thumbnail WebP (250x250) ad alta velocità con libvips.
- **Frontend**:
  - `vue`: Vue 3 con `<script setup lang="ts">`.
  - `vue-router`: Routing client-side SPA.
  - `vite`: Build tool fulmineo.
  - `tailwindcss`: Design scuro, compatto, ad alta densità informativa.
  - `lucide-vue-next`: Icone vettoriali pulite e leggere.
- **Shared**:
  - Interfacce TypeScript condivise (`Track`, `Album`, `Artist`, `Playlist`, `ScanStatus`).

---

## 2. Schema Database SQLite (`/data/quarter.db`)

```mermaid
erDiagram
    ARTISTS ||--o{ ALBUMS : creates
    ARTISTS ||--o{ TRACKS : performs
    ALBUMS ||--o{ TRACKS : contains
    PLAYLISTS ||--o{ PLAYLIST_TRACKS : includes
    TRACKS ||--o{ PLAYLIST_TRACKS : referenced_by

    ARTISTS {
        string id PK
        string name
        int track_count
        int album_count
    }

    ALBUMS {
        string id PK
        string title
        string artist_id FK
        string artist_name
        int year
        string cover_path
        int track_count
        int duration
    }

    TRACKS {
        string id PK
        string filepath UK
        string title
        string artist_name
        string album_id FK
        string album_title
        int track_number
        int disc_number
        int year
        int duration
        int bitrate
        string format
        int size
        int mtime
        boolean has_cover
    }

    PLAYLISTS {
        string id PK
        string name
        int created_at
        int updated_at
    }

    PLAYLIST_TRACKS {
        string id PK
        string playlist_id FK
        string track_id FK
        int position
        int added_at
    }
```

---

## 3. Flusso Dati e Componenti

### A. Scansione Libreria (Scanner Flow)
```mermaid
sequenceDiagram
    autonumber
    actor User as Utente (UI)
    participant API as Fastify API (/api/scan)
    participant Scan as Scanner Service
    participant FS as File System (/music)
    participant MM as music-metadata & sharp
    participant DB as SQLite DB

    User->>API: POST /api/scan
    API->>Scan: startScan() (asincrono in background)
    API-->>User: 202 Accepted { status: "scanning" }

    Scan->>FS: Ricorsione cartelle (/music)
    loop Per ogni file audio
        Scan->>DB: Check file mtime
        alt File non modificato
            Scan-->>Scan: Skip estrazione
        else File nuovo o modificato
            Scan->>MM: Estrai tag (titolo, artista, album, durata)
            Scan->>MM: Estrai copertina (embedded o cover.jpg)
            MM->>FS: Salva thumbnail /data/covers/{album_id}.webp
            Scan->>DB: UPSERT artist, album, track
        end
    end
    Scan->>DB: Rimuovi tracce non più presenti su disco
    Scan-->>API: Scan completato
```

### B. Streaming Audio con Controllo Velocità (Playback Flow)
```mermaid
sequenceDiagram
    autonumber
    actor User as Utente (UI)
    participant Player as Audio Player (Vue Engine)
    participant StreamAPI as Fastify (/api/stream/:id)
    participant FS as File System (/music)

    User->>Player: Click "Play" su traccia
    Player->>StreamAPI: GET /api/stream/:id (Header: Range: bytes=0-)
    StreamAPI->>FS: fs.createReadStream(filepath, { start, end })
    StreamAPI-->>Player: 206 Partial Content (Accept-Ranges, Content-Range, audio/...)
    Player->>Player: Riproduzione streaming immediata
    User->>Player: Cambia velocità a 0.75x
    Player->>Player: audio.playbackRate = 0.75 (Time-stretch istantaneo via browser)
```

---

## 4. Architettura Frontend (Vue 3)

### Albero Componenti
```text
App.vue
├── Sidebar.vue            # Logo "Quarter Note", Navigazione (Artisti, Album, Brani, Playlist), Tasto Scan
├── Header.vue             # Barra di ricerca rapida, breadcrumb di navigazione
├── RouterView             # Viste dense e compatte
│   ├── ArtistsView.vue    # Griglia/lista compatta artisti
│   ├── ArtistDetail.vue   # Album e brani dell'artista selezionato
│   ├── AlbumsView.vue     # Griglia copertine + titoli (250x250)
│   ├── AlbumDetail.vue    # Dettaglio album con tabella brani (colonne: #, Titolo, Durata, Azioni)
│   ├── TracksView.vue     # Lista complessiva brani con ordinamento veloce
│   ├── PlaylistsView.vue  # Gestione playlist
│   └── PlaylistDetail.vue # Brani in playlist con riordino e rimozione
├── Player.vue             # Barra player fissa in basso
│   ├── TrackInfo.vue      # Copertina miniatura, Titolo, Artista (link rapidi)
│   ├── PlaybackControls   # Prev, Play/Pause, Next, Shuffle, Repeat
│   ├── ProgressBar.vue    # Scrubber temporale continuo con drag
│   ├── SpeedSelector.vue  # Selettore velocità (0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x)
│   ├── VolumeControl.vue  # Slider volume + Mute
│   └── QueueToggle.vue    # Pulsante per aprire il pannello Coda
└── QueueDrawer.vue        # Pannello a comparsa laterale: brani in coda, riordino, pulisci coda
```

### State Management (`usePlayerStore`)
Un composable o store centralizzato per il ciclo audio:
- `currentTrack: Track | null`
- `isPlaying: boolean`
- `currentTime: number`
- `duration: number`
- `playbackRate: number` (default `1.0`)
- `volume: number` (default `1.0`, persistito in localStorage)
- `queue: Track[]`
- `queueIndex: number`
- `shuffle: boolean`
- `repeatMode: 'off' | 'all' | 'one'`

---

## 5. Deployment Docker (ZimaBlade)

### Dockerfile Multi-Stage
1. **Stage `builder-client`** (`node:24-alpine`): compila il frontend Vue con Vite (`npm run build` ➔ `/client/dist`).
2. **Stage `builder-server`** (`node:24-alpine`): compila TypeScript del server (`npm run build` ➔ `/server/dist`).
3. **Stage `runner`** (`node:24-alpine`): installa solo le dipendenze di produzione (con compilazione nativa per `better-sqlite3` e `sharp`), copia i file compilati, espone la porta `8080`, definisce volumi `/music` (ro) e `/data`.

### File `docker-compose.yml`
```yaml
services:
  quarter-note:
    build: .
    container_name: quarter-note
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      - PORT=8080
      - MUSIC_DIR=/music
      - DATA_DIR=/data
    volumes:
      - /path/to/my/music:/music:ro
      - /path/to/app/data:/data
```
