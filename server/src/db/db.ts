import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

let dbInstance: DatabaseSync | null = null;

export function initDatabase(dataDir: string): DatabaseSync {
  if (dbInstance) {
    return dbInstance;
  }

  // Ensure data directory exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Ensure covers and artists directories exist inside data directory
  const coversDir = path.join(dataDir, 'covers');
  if (!fs.existsSync(coversDir)) {
    fs.mkdirSync(coversDir, { recursive: true });
  }
  const artistsDir = path.join(dataDir, 'artists');
  if (!fs.existsSync(artistsDir)) {
    fs.mkdirSync(artistsDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'quarter.db');
  const db = new DatabaseSync(dbPath);

  // Enable WAL mode and foreign keys for high performance concurrent reads
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA synchronous = NORMAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS artists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      image_path TEXT
    );

    CREATE TABLE IF NOT EXISTS albums (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      artist_id TEXT NOT NULL,
      artist_name TEXT NOT NULL,
      year INTEGER,
      cover_path TEXT,
      FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tracks (
      id TEXT PRIMARY KEY,
      filepath TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      artist_name TEXT NOT NULL,
      album_id TEXT NOT NULL,
      album_title TEXT NOT NULL,
      track_number INTEGER,
      disc_number INTEGER,
      year INTEGER,
      duration REAL NOT NULL DEFAULT 0,
      bitrate INTEGER,
      format TEXT NOT NULL,
      size INTEGER NOT NULL,
      mtime INTEGER NOT NULL,
      has_cover INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS playlists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS playlist_tracks (
      id TEXT PRIMARY KEY,
      playlist_id TEXT NOT NULL,
      track_id TEXT NOT NULL,
      position INTEGER NOT NULL,
      added_at INTEGER NOT NULL,
      FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
      FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS favorite_containers (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      position INTEGER NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id TEXT PRIMARY KEY,
      container_id TEXT NOT NULL,
      item_type TEXT NOT NULL,
      item_id TEXT NOT NULL,
      position INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (container_id) REFERENCES favorite_containers(id) ON DELETE CASCADE,
      UNIQUE(container_id, item_type, item_id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_tracks_album_id ON tracks(album_id);
    CREATE INDEX IF NOT EXISTS idx_tracks_artist_name ON tracks(artist_name);
    CREATE INDEX IF NOT EXISTS idx_tracks_title ON tracks(title);
    CREATE INDEX IF NOT EXISTS idx_albums_artist_id ON albums(artist_id);
    CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist_id ON playlist_tracks(playlist_id, position);
    CREATE INDEX IF NOT EXISTS idx_favorites_container_id ON favorites(container_id, position);
    CREATE INDEX IF NOT EXISTS idx_favorites_item ON favorites(item_type, item_id);
  `);

  // Migration: Ensure image_path exists in artists table if created previously without it
  try {
    db.exec('ALTER TABLE artists ADD COLUMN image_path TEXT;');
  } catch {
    // Ignore error if column already exists
  }

  // Seed default favorite containers if none exist
  const containerCountRow = db.prepare('SELECT COUNT(*) as count FROM favorite_containers').get() as unknown as { count: number };
  if (!containerCountRow || Number(containerCountRow.count) === 0) {
    const defaultContainers = [
      { id: 'default-artists', title: 'Artisti', position: 0 },
      { id: 'default-albums', title: 'Album', position: 1 },
      { id: 'default-tracks', title: 'Brani', position: 2 },
      { id: 'default-playlists', title: 'Playlist', position: 3 },
    ];
    const insertStmt = db.prepare('INSERT INTO favorite_containers (id, title, position, is_default, created_at) VALUES (?, ?, ?, 1, ?)');
    const now = Date.now();
    for (const c of defaultContainers) {
      insertStmt.run(c.id, c.title, c.position, now);
    }
  }

  dbInstance = db;
  return db;
}

export function getDatabase(): DatabaseSync {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return dbInstance;
}
