# Quarter Note ♩ - Piano di Implementazione & Sviluppo

Questo documento traccia la roadmap dettagliata per lo sviluppo di **Quarter Note**, un music streamer self-hosted minimale, veloce e senza bloat, pensato per girare su ZimaBlade in container Docker.

Documenti di riferimento:
- [scope.md](file:///C:/Users/costa/Home/Opus/Quarter_Note/docs/scope.md): Obiettivi e requisiti funzionali approvati.
- [architecture.md](file:///C:/Users/costa/Home/Opus/Quarter_Note/docs/architecture.md): Architettura tecnica, schema database e diagrammi di flusso.

---

## Stato Avanzamento Lavori

- [x] **Fase 1: Setup Workspace Monorepo & Tipi Condivisi**
  - [x] 1.1 Inizializzazione root monorepo (`package.json`, `.gitignore`, `tsconfig.base.json`)
  - [x] 1.2 Pacchetto `shared`: interfacce TypeScript condivise (`Track`, `Album`, `Artist`, `Playlist`, `ScanStatus`)
- [x] **Fase 2: Backend Core (Fastify, SQLite & Scanner)**
  - [x] 2.1 Setup del pacchetto `server` (`package.json`, `tsconfig.json`)
  - [x] 2.2 Layer Database SQLite con `node:sqlite` (`DatabaseSync`) in WAL mode e migrazioni
  - [x] 2.3 Scanner della libreria (crawler ricorsivo, `music-metadata`, generazione miniature 250x250 con `sharp`)
  - [x] 2.4 API Routes:
    - [x] `/api/scan`: avvio e stato scansione
    - [x] `/api/library`: consultazione artisti, album, brani e ricerca istantanea
    - [x] `/api/stream/:id`: streaming con header `Range` (HTTP 206 Partial Content)
    - [x] `/api/cover/:albumId`: servizio copertine WebP e fallback SVG
    - [x] `/api/playlists`: CRUD playlist e gestione tracce
  - [x] 2.5 Entrypoint server (`server/src/index.ts`) con servizio file statici in produzione
- [x] **Fase 3: Frontend (Vue 3, Vite, Tailwind CSS & Player Audio)**
  - [x] 3.1 Setup del pacchetto `client` (Vue 3, Vite, Tailwind CSS, Lucide icons, Vue Router)
  - [x] 3.2 Audio Engine reattivo (`usePlayerStore`) con `HTML5 Audio`, controllo velocità (`playbackRate`), coda e persistenza
  - [x] 3.3 Componenti UI:
    - [x] `Sidebar.vue`: navigazione rapida e pulsante rescansione con spinner
    - [x] `Player.vue`: barra fissa con copertina, controlli playback, progress bar scrubber, selettore velocità (0.5x - 2.0x), volume
    - [x] `QueueDrawer.vue`: cassetto laterale per visualizzare e riordinare la coda
  - [x] 3.4 Viste dell'applicazione:
    - [x] `ArtistsView.vue` e `ArtistDetail.vue`
    - [x] `AlbumsView.vue` e `AlbumDetail.vue`
    - [x] `TracksView.vue` (tabella densa e veloce con menu contestuale)
    - [x] `PlaylistsView.vue` e `PlaylistDetail.vue`
    - [x] Ricerca rapida con filtri in tempo reale
- [x] **Fase 4: Dockerizzazione & Deployment su ZimaBlade**
  - [x] 4.1 `Dockerfile` multi-stage ottimizzato per Node 24 Alpine
  - [x] 4.2 `docker-compose.yml` di riferimento per ZimaBlade (`/music:ro` e `/data`)
  - [x] 4.3 Test end-to-end di build, scansione ed esecuzione streaming

---

## Dettaglio delle Fasi

### Fase 1: Setup Workspace Monorepo & Tipi Condivisi
1. **Configurazione Root**:
   - `package.json` con configurazione workspaces (`shared`, `server`, `client`).
   - `.gitignore` (node_modules, dist, data, covers, file temporanei).
   - `tsconfig.base.json` con impostazioni TypeScript moderne (`target: ES2022`, `moduleResolution: bundler`, `strict: true`).
2. **Pacchetto `shared`**:
   - Esportazione di tipi e interfacce TypeScript usate sia dal backend Fastify che dal frontend Vue:
     - `Track`: identificatore, titolo, artista, album, durata, track number, disc number, anno, formato, bitrate, mtime, hasCover.
     - `Album`: identificatore, titolo, artista, anno, numero tracce, durata totale, coverUrl.
     - `Artist`: identificatore, nome, numero album, numero tracce.
     - `Playlist` e `PlaylistTrack`.
     - `ScanStatus`: stato scansione (idle, scanning, count, file corrente).
     - `SearchResponse`: risultati raggruppati per artisti, album e brani.

### Fase 2: Backend Core
1. **Database SQLite (`server/src/db/`)**:
   - Connessione con `better-sqlite3`.
   - Attivazione `PRAGMA journal_mode = WAL;`, `PRAGMA synchronous = NORMAL;`, `PRAGMA foreign_keys = ON;`.
   - Inizializzazione schema con tabelle: `artists`, `albums`, `tracks`, `playlists`, `playlist_tracks`.
   - Indici su `artist_name`, `album_title`, `title` e `filepath` per garantire ricerche e inserimenti fulminei.
2. **Scanner della Libreria (`server/src/scanner/`)**:
   - Scansione ricorsiva della cartella configurata (es. `/music`).
   - Verifica di `mtime` del file sul filesystem rispetto al database: se il file non è cambiato, lo scan lo salta all'istante (scansione incrementale in pochi secondi).
   - Estrazione metadati con `music-metadata`.
   - Se la traccia contiene una copertina incorporata, estrazione del buffer; altrimenti ricerca di file copertina nella cartella (`cover.jpg`, `folder.jpg`, etc.).
   - Elaborazione della copertina con `sharp`: salvataggio di una thumbnail WebP 250x250 in `/data/covers/{album_id}.webp`.
   - Pulizia automatica dei brani rimossi dal disco.
3. **API HTTP Fastify (`server/src/routes/`)**:
   - `/api/scan`: avvio scansione asincrona e monitoraggio progresso.
   - `/api/library`: endpoint paginati e filtrabili per artisti, album e brani.
   - `/api/stream/:id`: gestione delle richieste parziali HTTP `Range` per consentire scrubbing e seek istantaneo dei file audio originali.
   - `/api/cover/:albumId`: restituzione della thumbnail WebP con header di caching (ETag, Cache-Control).
   - `/api/playlists`: creazione, modifica, eliminazione playlist e aggiunta/rimozione brani.
4. **Server Integration (`server/src/index.ts`)**:
   - Configurazione Fastify, CORS e registrazione rotte.
   - Fallback per servire l'app SPA compilata di Vue (`client/dist`).

### Fase 3: Frontend Vue 3
1. **Struttura Client (`client/`)**:
   - Vue 3 con Composition API `<script setup lang="ts">`.
   - Tailwind CSS configurato con tema scuro e compatto.
   - Icone Lucide per un'interfaccia elegante e moderna.
2. **Audio Engine (`usePlayerStore`)**:
   - Singleton basato su `<audio>` nativo.
   - Gestione dello stato: traccia in riproduzione, stato play/pause, tempo corrente, durata, volume, coda.
   - **Rallentatore**: slider e scorciatoie per impostare `audio.playbackRate` (`0.5x`, `0.75x`, `1.0x`, `1.25x`, `1.5x`, `2.0x`).
   - Coda di riproduzione con supporto aggiungi come prossimo, accoda in fondo, e pulisci coda.
3. **UI ad Alta Densità**:
   - Sidebar compatta con navigazione per sezioni e indicatore stato scansione.
   - Viste dense a tabella/griglia senza sprechi di pixel.
   - Player audio sempre visibile in basso con comandi grandi e chiari.
   - Pannello a cassetto laterale per gestire la coda di riproduzione.

### Fase 4: Dockerizzazione & Deployment
1. **Dockerfile Multi-Stage**:
   - Stage 1: Build client Vue con Vite.
   - Stage 2: Compilazione TypeScript del server.
   - Stage 3: Immagine Alpine snella con soli moduli di produzione e binari compilati nativamente (`better-sqlite3`, `sharp`).
2. **docker-compose.yml**:
   - Mappatura volumi `/music` (in sola lettura) e `/data` (per database e copertine).
   - Configurazione variabili d'ambiente (`PORT`, `MUSIC_DIR`, `DATA_DIR`).
