import { getDatabase } from '../db.js';
import { idFromText } from './types.js';

export function getAllTrackFilepathsWithMtime(): Map<string, { id: string; mtime: number }> {
  const db = getDatabase();
  const rows = db.prepare('SELECT id, filepath, mtime FROM tracks').all() as unknown as { id: string; filepath: string; mtime: number }[];
  const map = new Map<string, { id: string; mtime: number }>();
  for (const r of rows) {
    map.set(r.filepath, { id: r.id, mtime: r.mtime });
  }
  return map;
}

export function upsertArtist(name: string): string {
  const db = getDatabase();
  const id = idFromText(name);
  db.prepare('INSERT OR IGNORE INTO artists (id, name) VALUES (?, ?)').run(id, name);
  return id;
}

export function upsertAlbum(title: string, artistId: string, artistName: string, year?: number, coverPath?: string): string {
  const db = getDatabase();
  const id = idFromText(`${artistName}-${title}`);
  
  const existing = db.prepare('SELECT id, cover_path, year FROM albums WHERE id = ?').get(id) as unknown as { id: string; cover_path: string | null; year: number | null } | undefined;
  if (!existing) {
    db.prepare(`
      INSERT INTO albums (id, title, artist_id, artist_name, year, cover_path)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, title, artistId, artistName, year ?? null, coverPath ?? null);
  } else {
    // Update cover or year if newly available
    const newCover = coverPath || existing.cover_path;
    const newYear = year || existing.year;
    db.prepare('UPDATE albums SET cover_path = ?, year = ? WHERE id = ?').run(newCover ?? null, newYear ?? null, id);
  }

  return id;
}

export function saveTrack(track: {
  id: string;
  filepath: string;
  title: string;
  artistName: string;
  albumId: string;
  albumTitle: string;
  trackNumber?: number;
  discNumber?: number;
  year?: number;
  duration: number;
  bitrate?: number;
  format: string;
  size: number;
  mtime: number;
  hasCover: boolean;
}): void {
  const db = getDatabase();
  db.prepare(`
    INSERT INTO tracks (
      id, filepath, title, artist_name, album_id, album_title,
      track_number, disc_number, year, duration, bitrate, format, size, mtime, has_cover
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(filepath) DO UPDATE SET
      title = excluded.title,
      artist_name = excluded.artist_name,
      album_id = excluded.album_id,
      album_title = excluded.album_title,
      track_number = excluded.track_number,
      disc_number = excluded.disc_number,
      year = excluded.year,
      duration = excluded.duration,
      bitrate = excluded.bitrate,
      format = excluded.format,
      size = excluded.size,
      mtime = excluded.mtime,
      has_cover = excluded.has_cover
  `).run(
    track.id,
    track.filepath,
    track.title,
    track.artistName,
    track.albumId,
    track.albumTitle,
    track.trackNumber ?? null,
    track.discNumber ?? null,
    track.year ?? null,
    track.duration,
    track.bitrate ?? null,
    track.format,
    track.size,
    track.mtime,
    track.hasCover ? 1 : 0
  );
}

export function deleteTrack(id: string): void {
  const db = getDatabase();
  db.prepare('DELETE FROM tracks WHERE id = ?').run(id);
}

export function cleanupEmptyArtistsAndAlbums(): void {
  const db = getDatabase();
  // Delete albums with no tracks
  db.prepare(`
    DELETE FROM albums 
    WHERE id NOT IN (SELECT DISTINCT album_id FROM tracks)
  `).run();

  // Delete artists with no albums and no tracks
  db.prepare(`
    DELETE FROM artists 
    WHERE id NOT IN (SELECT DISTINCT artist_id FROM albums)
      AND name NOT IN (SELECT DISTINCT artist_name FROM tracks)
  `).run();
}
