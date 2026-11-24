import { getDatabase } from '../db.js';

export function getSetting(key: string): string | null {
  const db = getDatabase();
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as unknown as { value: string } | undefined;
  return row ? row.value : null;
}

export function setSetting(key: string, value: string): void {
  const db = getDatabase();
  db.prepare(`
    INSERT INTO settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(key, value);
}

export function getLibraryStats(): { totalTracks: number; totalAlbums: number; totalArtists: number } {
  const db = getDatabase();
  const trackCountRow = db.prepare('SELECT COUNT(*) as count FROM tracks').get() as unknown as { count: number };
  const albumCountRow = db.prepare('SELECT COUNT(*) as count FROM albums').get() as unknown as { count: number };
  const artistCountRow = db.prepare('SELECT COUNT(*) as count FROM artists').get() as unknown as { count: number };

  return {
    totalTracks: Number(trackCountRow?.count || 0),
    totalAlbums: Number(albumCountRow?.count || 0),
    totalArtists: Number(artistCountRow?.count || 0),
  };
}
