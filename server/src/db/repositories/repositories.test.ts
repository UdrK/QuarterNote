import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { 
  createPlaylist, 
  getPlaylists, 
  getPlaylistById, 
  deletePlaylist,
  createFavoriteContainer,
  getFavoriteContainers,
  deleteFavoriteContainer,
  getSetting,
  setSetting,
} from '../repository.js';
import { setDatabase } from '../db.js';

describe('Database Repositories with in-memory SQLite', () => {
  let memDb: DatabaseSync;

  beforeEach(() => {
    memDb = new DatabaseSync(':memory:');
    memDb.exec('PRAGMA foreign_keys = ON;');
    memDb.exec(`
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
        image_path TEXT,
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
    `);

    setDatabase(memDb);
  });

  describe('Settings', () => {
    it('sets and retrieves configuration settings', () => {
      assert.equal(getSetting('theme'), null);
      setSetting('theme', 'amber');
      assert.equal(getSetting('theme'), 'amber');

      setSetting('theme', 'green');
      assert.equal(getSetting('theme'), 'green');
    });
  });

  describe('Playlists CRUD', () => {
    it('creates, retrieves and deletes playlists', () => {
      const pl = createPlaylist('Synthwave Favorites');
      assert.equal(pl.name, 'Synthwave Favorites');
      assert.ok(pl.id);

      const all = getPlaylists();
      assert.equal(all.length, 1);
      assert.equal(all[0].name, 'Synthwave Favorites');

      const details = getPlaylistById(pl.id);
      assert.ok(details);
      assert.equal(details.playlist.id, pl.id);
      assert.equal(details.tracks.length, 0);

      const deleted = deletePlaylist(pl.id);
      assert.equal(deleted, true);
      assert.equal(getPlaylists().length, 0);
    });
  });

  describe('Favorite Containers', () => {
    it('creates and retrieves custom favorite containers', () => {
      const c1 = createFavoriteContainer('Heavy Rotation');
      const c2 = createFavoriteContainer('Chill Mix');

      assert.equal(c1.title, 'Heavy Rotation');
      assert.equal(c2.title, 'Chill Mix');

      const containers = getFavoriteContainers();
      assert.equal(containers.length, 2);
      assert.equal(containers[0].title, 'Heavy Rotation');
      assert.equal(containers[1].title, 'Chill Mix');

      const deleted = deleteFavoriteContainer(c1.id);
      assert.equal(deleted, true);
      assert.equal(getFavoriteContainers().length, 1);
    });
  });
});
