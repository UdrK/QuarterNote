# Project Scope: Minimal Self-Hosted Music Streamer

This document defines the goals, technical decisions, and functional scope of **Quarter Note**, a local music streamer designed to run on ZimaBlade (and any Docker-capable host).

---

## 1. Primary Goals

- **Simplicity & Extreme Lightweight**: Zero bloat, instant startup, low RAM consumption (~20-50 MB).
- **Zero Login (Single User)**: Instant access across the local network with no accounts, passwords, or authentication tokens.
- **Fluid & Dense UX**: Fast navigation across Artists, Albums, Playlists, and Favorites with an authentic retro BBS / curses TUI aesthetic.
- **Advanced Playback Control**: Native variable speed controller / slow-down practice mode (`0.5x` - `2.0x`) for music transcription, instrument practice, or customized listening.
- **Bit-Perfect Audio Quality**: Direct HTTP Range streaming (`206 Partial Content`) of original audio files without lossy transcoding.
- **Zero-Hassle Docker & CasaOS Deployment**: A single lightweight container with bind mounts for `/music` (read-only) and `/data`.

---

## 2. Feature Boundaries

### A. Library Scanning & File System
- `[YES]` **Recursive Directory Scanning**: Crawls local audio files (`.mp3`, `.flac`, `.m4a`, `.ogg`, `.wav`, `.opus`).
- `[YES]` **Metadata Tagging**: Extracts Title, Artist, Album, Track Number, Year, Duration, and Bitrate.
- `[YES]` **Manual Rescan**: Sidebar button and API endpoint to scan and update the library on demand.
- `[NO]` **Real-time File Watchdog**: No background file watcher daemon constantly polling the disk.
- `[NO]` **Folder View**: Navigation is strictly driven by metadata (Artists ➔ Albums ➔ Tracks).
- `[NO]` **Aggressive Tag Normalization**: Original audio tags are never rewritten or altered on disk.
- `[NO]` **Automatic Album Versioning**: No forced grouping or complex deduplication algorithms.

### B. Cover Art & Imagery
- `[YES]` **Embedded Cover Art**: Extracts album art embedded in audio file tags.
- `[YES]` **Folder Art**: Fallback search for `cover.jpg`, `cover.png`, `folder.jpg`, `front.jpg` in the album directory.
- `[YES]` **Cached WebP Thumbnails**: Generates 250x250 WebP thumbnails for albums, and 300x300 for artists/playlists using `sharp`.
- `[NO]` **Cloud Metadata Downloads**: No outbound API calls to Last.fm, Spotify, or MusicBrainz.
- `[NO]` **Color Palettes & Blurhash**: No dynamic blur effects that contradict the retro TUI aesthetic.

### C. Audio Playback & Player
- `[YES]` **HTTP Range Streaming (`206 Partial Content`)**: Instant seek and scrubbing through original files.
- `[YES]` **Integrated Playback Rate Controller**: Native browser time-stretching with selectable speeds (`0.5x`, `0.75x`, `0.85x`, `1.0x`, `1.15x`, `1.25x`, `1.5x`, `2.0x`).
- `[YES]` **Full Playback Controls & Queue**: Play/Pause, Next/Previous, Seek bar, Slide-over Queue drawer ('Q'), Shuffle, and Repeat modes.
- `[NO]` **On-the-Fly Transcoding**: No FFmpeg overhead; tracks are delivered bit-perfect.
- `[NO]` **Silence Detection / Crossfade**: No synthetic audio processing.
- `[NO]` **Multi-Device Sync / Cast**: Single client local playback.

### D. Organization & Search
- `[YES]` **Dedicated TUI Views**: Artists directory, Albums catalog, Playlists archive, and Favorites board.
- `[YES]` **Instant Search**: Real-time filtering as you type, grouped by Artists, Albums, and Tracks.
- `[YES]` **Custom Playlists**: Create, reorder, manage custom cover art, and play custom playlists.
- `[YES]` **Favorites with Custom Dividers & Drag & Drop**: Categorize favorites across customizable containers.

### E. Social, Lyrics & Statistics
- `[NO]` **Daily Mixes & Algorithmic Feeds**: No auto-generated playlists.
- `[NO]` **Play Count & History Tracking**: No background metrics tracking.
- `[NO]` **Last.fm Scrobbling**: No outbound tracking or telemetry.
- `[NO]` **Lyrics Display**: No lyrics scrapers or synchronizers.

### F. Security & Deployment
- `[YES]` **Zero Login (Single-User)**: Ready to use immediately upon opening the Web UI.
- `[YES]` **Docker & CasaOS Compatibility**:
  - Single multi-stage `Dockerfile`.
  - Service tagged as `quarter-note:latest` with full `x-casaos` metadata.
  - Native Node.js container health checks.
