import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { 
  createFavoriteContainer,
  toggleFavorite,
  moveFavoriteItem,
  getAllFavoriteItemIds,
  getFavoriteContainers
} from '../repository.js';
import { setDatabase } from '../db.js';

describe('Favorites Repository', () => {
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
        cover_path TEXT
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
        has_cover INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS playlists (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        image_path TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
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
    `);

    // Insert sample track
    memDb.prepare(`
      INSERT INTO tracks (id, filepath, title, artist_name, album_id, album_title, duration, format, size, mtime)
      VALUES ('t-1', '/music/1.mp3', 'Echoes', 'Pink Floyd', 'alb-1', 'Meddle', 1400, 'mp3', 30000000, 1700000000)
    `).run();

    setDatabase(memDb);
  });

  it('toggles item into default container and removes on second toggle', () => {
    const c = createFavoriteContainer('Tracks');
    
    // Toggle ON
    const res1 = toggleFavorite('track', 't-1', c.id);
    assert.equal(res1.favorited, true);
    assert.ok(res1.item);
    assert.equal(res1.item.itemId, 't-1');

    const ids = getAllFavoriteItemIds();
    assert.deepEqual(ids.tracks, ['t-1']);

    // Toggle OFF
    const res2 = toggleFavorite('track', 't-1');
    assert.equal(res2.favorited, false);

    const idsAfter = getAllFavoriteItemIds();
    assert.deepEqual(idsAfter.tracks, []);
  });

  it('moves favorite item between containers', () => {
    const c1 = createFavoriteContainer('Main');
    const c2 = createFavoriteContainer('Secondary');

    const res = toggleFavorite('track', 't-1', c1.id);
    assert.equal(res.favorited, true);

    const moved = moveFavoriteItem(res.item!.id, c2.id);
    assert.equal(moved, true);

    const containers = getFavoriteContainers();
    const main = containers.find(c => c.id === c1.id);
    const secondary = containers.find(c => c.id === c2.id);

    assert.equal(main?.items.length, 0);
    assert.equal(secondary?.items.length, 1);
    assert.equal(secondary?.items[0].itemId, 't-1');
  });
});
