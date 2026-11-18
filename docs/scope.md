# Project Scope: Minimal Self-Hosted Music Streamer

Questo documento definisce gli obiettivi, l'architettura e lo scope funzionale del nuovo music streamer locale pensato per girare su ZimaBlade (e qualsiasi host Docker).

---

## 1. Obiettivi Principali
- **Semplicità e leggerezza**: Zero bloat, avvio istantaneo, basso consumo di RAM (~20-50 MB).
- **Zero Login (Single User)**: Accesso immediato nella rete locale, nessun account, password o token da gestire.
- **UX fluida ed efficiente**: Navigazione rapida tra Canzone / Album / Artista, pochi click, layout denso e leggibile.
- **Controllo avanzato del playback**: Riproduzione a velocità variabile / rallentatore nativo (0.5x - 2.0x) per studio, trascrizione o ascolto personalizzato.
- **Qualità audio intatta**: Streaming diretto dei file originali (senza transcodifica né perdita di qualità) con supporto scrubbing/seek HTTP Range.
- **Deploy Docker "zero-hassle"**: Un unico container Docker leggero con bind mount per `/music` e `/data`.

---

## 2. Decisioni sulle Funzionalità

### A. Scansione Libreria & File System
- `[SI]` **Directory Scanning ricorsivo**: Scansione dei file audio locali (.mp3, .flac, .m4a, .ogg, .wav, .opus).
- `[SI]` **Estrazione Metadati (Tagging)**: Lettura di Titolo, Artista, Album, Numero traccia, Anno, Genere, Durata.
- `[SI]` **Scansione manuale**: Pulsante nell'interfaccia (o chiamata API) per avviare o aggiornare la scansione quando si aggiunge musica.
- `[NO]` **Watchdog in tempo reale**: Nessun demone che monitora costantemente il disco in background.
- `[NO]` **Navigazione per cartelle (Folder view)**: Navigazione incentrata unicamente sui metadati (Artisti ➔ Album ➔ Brani).
- `[NO]` **Normalizzazione aggressiva dei metadati**: Nessuna riscrittura forzata o alterazione dei tag originali.
- `[NO]` **Album versioning automatico**: Nessun raggruppamento forzato di edizioni speciali.

### B. Immagini & Copertine
- `[SI]` **Copertine incorporate (Embedded Cover Art)**: Estrazione della copertina memorizzata nei tag del file audio.
- `[SI]` **Copertine da cartella (Folder Art)**: Se il file non ha copertina incorporata, ricerca automatica di `cover.jpg`, `cover.png`, `folder.jpg`, `front.jpg` nella cartella dell'album.
- `[SI]` **Generazione miniature (Thumbnails)**: Generazione e cache di immagini ridimensionate (es. 250x250) per caricare istantaneamente le liste senza saturare la banda.
- `[NO]` **Download da Internet**: Nessuna chiamata esterna a Last.fm/Spotify/MusicBrainz.
- `[NO]` **Palette colori / Blurhash**: Nessuna elaborazione complessa di colori dinamici per la UI.

### C. Riproduzione Audio & Player
- `[SI]` **Streaming HTTP con supporto Range (`206 Partial Content`)**: Seek/scrubbing immediato lungo la traccia a qualità originale.
- `[SI]` **Riproduzione a velocità variabile / Rallentatore**: Controllo slider o bottoni per il playback rate (`0.5x`, `0.75x`, `1.0x`, `1.25x`, `1.5x`, `2.0x`).
- `[SI]` **Controlli base & Coda di riproduzione (Queue)**: Play/Pausa, Traccia successiva/precedente, Volume, Barra seek, Coda brani (Next up), Shuffle e Repeat.
- `[NO]` **Transcodifica al volo**: Nessun overhead FFmpeg; i brani vengono sempre inviati a qualità originale bit-perfect.
- `[NO]` **Silence detection**: Nessun taglio del silenzio o cross-fade forzato.
- `[NO]` **Sincronizzazione playback multi-device (Remote play)**: Nessun bisogno di websocket complesse per pilotare altri dispositivi.

### D. Organizzazione & Ricerca
- `[SI]` **Navigazione Artisti / Album / Brani**: Viste dedicate, veloci e compatte.
- `[SI]` **Ricerca istantanea (Search)**: Filtro rapido in tempo reale mentre si digita.
- `[SI]` **Playlist personalizzate**: Creazione, modifica brani, riordino e riproduzione di playlist.
- `[NO]` **Preferiti**: Nessun sistema a parte di "cuoricini" (le playlist coprono l'esigenza di collezionare brani).
- `[NO]` **Collezioni complesse o suggerimenti simili**: Nessun algoritmo di raccomandazione.

### E. Statistiche, Social & Testi
- `[NO]` **Daily Mixes**: Nessuna generazione automatica di playlist.
- `[NO]` **Cronologia di ascolto & Play Count**: Nessun tracciamento degli ascolti o database di conteggi.
- `[NO]` **Last.fm Scrobbling**: Nessun invio dati all'esterno.
- `[NO]` **Testi delle canzoni (Lyrics)**: Nessun visualizzatore o downloader di testi.

### F. Utenti, Sicurezza & Deploy
- `[SI]` **Zero Login (Single-user)**: L'app si apre subito, pronta all'uso senza inserire credenziali.
- `[SI]` **Deploy Docker su ZimaBlade**: Un singolo `Dockerfile` multi-stage:
  - Esposizione di una sola porta (es. `8080`).
  - Volume `/music` (in sola lettura) per la propria libreria.
  - Volume `/data` per il file SQLite e la cartella cache delle miniature.

---

## 3. Architettura Tecnica & Stack Scelto: Full-Stack TypeScript

- **Runtime & Linguaggio**: Node.js v24 (LTS) con TypeScript strict.
- **Backend (`/server`)**:
  - **Framework Web**: **Fastify** (estremamente veloce, basso consumo di memoria, supporto nativo a streaming e range requests con `@fastify/static` / stream pipelines).
  - **Database**: **SQLite** tramite `better-sqlite3` (sincrono, performante, WAL mode per letture concorrenti).
  - **Lettore Metadati Audio**: `music-metadata` (libreria leader per decodifica tag ID3v1, ID3v2, FLAC, Vorbis, MP4/M4A, Ogg, Opus ed estrazione immagini).
  - **Generazione Thumbnail**: `sharp` (processamento immagini C/libvips ultra-veloce per ridimensionare le copertine a 250x250 webp/jpeg).
- **Frontend (`/client`)**:
  - **Framework**: **Vue 3** (Composition API) + **Vite** + **TypeScript**.
  - **Styling**: **Tailwind CSS** (design compatto e scuro, spazi ben ottimizzati, pulsanti chiaramente visibili).
  - **Icone**: `lucide-vue-next`.
  - **Audio Engine**: HTML5 `Audio` nativo con `playbackRate` controllabile via slider UI.
- **Condivisione Tipi (`/shared`)**: Interfacce TypeScript condivise (`Track`, `Album`, `Artist`, `Playlist`) tra backend e frontend per garanzia di consistenza API.
- **Containerizzazione**:
  - Singolo `Dockerfile` multi-stage:
    1. Build del client Vue con Vite.
    2. Build del server TypeScript.
    3. Immagine finale Alpine/Slim con soli file di produzione, che serve il frontend e le API sulla porta 8080.
