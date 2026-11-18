import { getDatabase } from './db.js';
import type { Track, Album, Artist, Playlist, PlaylistTrack, SearchResponse } from '@quarter-note/shared';
import crypto from 'node:crypto';

export function generateId(): string {
  return crypto.randomUUID();
}

export function idFromText(text: string): string {
  return crypto.createHash('sha1').update(text.trim().toLowerCase()).digest('hex').slice(0, 16);
}

export interface DbTrackRow {
  id: string;
  filepath: string;
  title: string;
  artist_name: string;
  album_id: string;
  album_title: string;
  track_number: number | null;
  disc_number: number | null;
  year: number | null;
  duration: number;
  bitrate: number | null;
  format: string;
  size: number;
  mtime: number;
  has_cover: number;
}

export function mapTrackRow(row: DbTrackRow): Track {
  return {
    id: row.id,
    filepath: row.filepath,
    title: row.title,
    artistName: row.artist_name,
    albumId: row.album_id,
    albumTitle: row.album_title,
    trackNumber: row.track_number ?? undefined,
    discNumber: row.disc_number ?? undefined,
    year: row.year ?? undefined,
    duration: row.duration,
    bitrate: row.bitrate ?? undefined,
    format: row.format,
    size: row.size,
    mtime: row.mtime,
    hasCover: Boolean(row.has_cover),
  };
}

// ----------------- ARTISTS -----------------

export function getArtists(): Artist[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT 
      a.id, 
      a.name, 
      COUNT(DISTINCT alb.id) as album_count,
      COUNT(t.id) as track_count
    FROM artists a
    LEFT JOIN albums alb ON alb.artist_id = a.id
    LEFT JOIN tracks t ON t.artist_name = a.name
    GROUP BY a.id, a.name
    ORDER BY a.name COLLATE NOCASE ASC
  `);
  const rows = stmt.all() as unknown as { id: string; name: string; album_count: number; track_count: number }[];
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    albumCount: Number(r.album_count),
    trackCount: Number(r.track_count),
  }));
}

export function getArtistById(id: string): { artist: Artist; albums: Album[]; tracks: Track[] } | null {
  const db = getDatabase();
  const artistRow = db.prepare('SELECT id, name FROM artists WHERE id = ?').get(id) as unknown as { id: string; name: string } | undefined;
  if (!artistRow) return null;

  const albums = getAlbums(artistRow.id);
  const trackRows = db.prepare(`
    SELECT * FROM tracks WHERE artist_name = ? ORDER BY year DESC, album_title ASC, track_number ASC
  `).all(artistRow.name) as unknown as DbTrackRow[];

  const tracks = trackRows.map(mapTrackRow);

  return {
    artist: {
      id: artistRow.id,
      name: artistRow.name,
      albumCount: albums.length,
      trackCount: tracks.length,
    },
    albums,
    tracks,
  };
}

// ----------------- ALBUMS -----------------

export function getAlbums(artistId?: string): Album[] {
  const db = getDatabase();
  let query = `
    SELECT 
      alb.id, 
      alb.title, 
      alb.artist_id, 
      alb.artist_name, 
      alb.year, 
      alb.cover_path,
      COUNT(t.id) as track_count,
      COALESCE(SUM(t.duration), 0) as duration
    FROM albums alb
    LEFT JOIN tracks t ON t.album_id = alb.id
  `;
  const params: string[] = [];
  if (artistId) {
    query += ' WHERE alb.artist_id = ? ';
    params.push(artistId);
  }
  query += ' GROUP BY alb.id ORDER BY alb.title COLLATE NOCASE ASC';

  const stmt = db.prepare(query);
  const rows = (params.length ? stmt.all(...params) : stmt.all()) as unknown as {
    id: string;
    title: string;
    artist_id: string;
    artist_name: string;
    year: number | null;
    cover_path: string | null;
    track_count: number;
    duration: number;
  }[];

  return rows.map(r => ({
    id: r.id,
    title: r.title,
    artistId: r.artist_id,
    artistName: r.artist_name,
    year: r.year ?? undefined,
    trackCount: Number(r.track_count),
    duration: Number(r.duration),
    coverUrl: `/api/cover/${r.id}`,
  }));
}

export function getAlbumById(id: string): { album: Album; tracks: Track[] } | null {
  const db = getDatabase();
  const albumRow = db.prepare(`
    SELECT 
      alb.id, 
      alb.title, 
      alb.artist_id, 
      alb.artist_name, 
      alb.year, 
      alb.cover_path,
      COUNT(t.id) as track_count,
      COALESCE(SUM(t.duration), 0) as duration
    FROM albums alb
    LEFT JOIN tracks t ON t.album_id = alb.id
    WHERE alb.id = ?
    GROUP BY alb.id
  `).get(id) as unknown as {
    id: string;
    title: string;
    artist_id: string;
    artist_name: string;
    year: number | null;
    cover_path: string | null;
    track_count: number;
    duration: number;
  } | undefined;

  if (!albumRow) return null;

  const trackRows = db.prepare(`
    SELECT * FROM tracks 
    WHERE album_id = ? 
    ORDER BY COALESCE(disc_number, 1) ASC, COALESCE(track_number, 999) ASC, title ASC
  `).all(id) as unknown as DbTrackRow[];

  const album: Album = {
    id: albumRow.id,
    title: albumRow.title,
    artistId: albumRow.artist_id,
    artistName: albumRow.artist_name,
    year: albumRow.year ?? undefined,
    trackCount: Number(albumRow.track_count),
    duration: Number(albumRow.duration),
    coverUrl: `/api/cover/${albumRow.id}`,
  };

  return {
    album,
    tracks: trackRows.map(mapTrackRow),
  };
}

// ----------------- TRACKS -----------------

export function getTracks(): Track[] {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT * FROM tracks ORDER BY title COLLATE NOCASE ASC
  `).all() as unknown as DbTrackRow[];
  return rows.map(mapTrackRow);
}

export function getTrackById(id: string): Track | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM tracks WHERE id = ?').get(id) as unknown as DbTrackRow | undefined;
  return row ? mapTrackRow(row) : null;
}

export function getTrackByFilepath(filepath: string): Track | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM tracks WHERE filepath = ?').get(filepath) as unknown as DbTrackRow | undefined;
  return row ? mapTrackRow(row) : null;
}

// ----------------- SEARCH -----------------

export function search(query: string): SearchResponse {
  const db = getDatabase();
  const pattern = `%${query.trim()}%`;

  const artistRows = db.prepare(`
    SELECT 
      a.id, 
      a.name, 
      COUNT(DISTINCT alb.id) as album_count,
      COUNT(t.id) as track_count
    FROM artists a
    LEFT JOIN albums alb ON alb.artist_id = a.id
    LEFT JOIN tracks t ON t.artist_name = a.name
    WHERE a.name LIKE ?
    GROUP BY a.id, a.name
    ORDER BY a.name COLLATE NOCASE ASC
    LIMIT 20
  `).all(pattern) as unknown as { id: string; name: string; album_count: number; track_count: number }[];

  const albumRows = db.prepare(`
    SELECT 
      alb.id, 
      alb.title, 
      alb.artist_id, 
      alb.artist_name, 
      alb.year, 
      alb.cover_path,
      COUNT(t.id) as track_count,
      COALESCE(SUM(t.duration), 0) as duration
    FROM albums alb
    LEFT JOIN tracks t ON t.album_id = alb.id
    WHERE alb.title LIKE ? OR alb.artist_name LIKE ?
    GROUP BY alb.id
    ORDER BY alb.title COLLATE NOCASE ASC
    LIMIT 20
  `).all(pattern, pattern) as unknown as {
    id: string;
    title: string;
    artist_id: string;
    artist_name: string;
    year: number | null;
    cover_path: string | null;
    track_count: number;
    duration: number;
  }[];

  const trackRows = db.prepare(`
    SELECT * FROM tracks 
    WHERE title LIKE ? OR artist_name LIKE ? OR album_title LIKE ?
    ORDER BY title COLLATE NOCASE ASC
    LIMIT 50
  `).all(pattern, pattern, pattern) as unknown as DbTrackRow[];

  return {
    artists: artistRows.map(r => ({
      id: r.id,
      name: r.name,
      albumCount: Number(r.album_count),
      trackCount: Number(r.track_count),
    })),
    albums: albumRows.map(r => ({
      id: r.id,
      title: r.title,
      artistId: r.artist_id,
      artistName: r.artist_name,
      year: r.year ?? undefined,
      trackCount: Number(r.track_count),
      duration: Number(r.duration),
      coverUrl: `/api/cover/${r.id}`,
    })),
    tracks: trackRows.map(mapTrackRow),
  };
}

// ----------------- PLAYLISTS -----------------

export function getPlaylists(): Playlist[] {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT 
      p.id, 
      p.name, 
      p.created_at, 
      p.updated_at,
      COUNT(pt.id) as track_count,
      COALESCE(SUM(t.duration), 0) as total_duration
    FROM playlists p
    LEFT JOIN playlist_tracks pt ON pt.playlist_id = p.id
    LEFT JOIN tracks t ON t.id = pt.track_id
    GROUP BY p.id
    ORDER BY p.name COLLATE NOCASE ASC
  `).all() as unknown as {
    id: string;
    name: string;
    created_at: number;
    updated_at: number;
    track_count: number;
    total_duration: number;
  }[];

  return rows.map(r => ({
    id: r.id,
    name: r.name,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    trackCount: Number(r.track_count),
    totalDuration: Number(r.total_duration),
  }));
}

export function getPlaylistById(id: string): { playlist: Playlist; tracks: PlaylistTrack[] } | null {
  const db = getDatabase();
  const playlistRow = db.prepare(`
    SELECT 
      p.id, 
      p.name, 
      p.created_at, 
      p.updated_at,
      COUNT(pt.id) as track_count,
      COALESCE(SUM(t.duration), 0) as total_duration
    FROM playlists p
    LEFT JOIN playlist_tracks pt ON pt.playlist_id = p.id
    LEFT JOIN tracks t ON t.id = pt.track_id
    WHERE p.id = ?
    GROUP BY p.id
  `).get(id) as unknown as {
    id: string;
    name: string;
    created_at: number;
    updated_at: number;
    track_count: number;
    total_duration: number;
  } | undefined;

  if (!playlistRow) return null;

  const trackRows = db.prepare(`
    SELECT 
      pt.id as pt_id,
      pt.playlist_id,
      pt.track_id,
      pt.position,
      pt.added_at,
      t.*
    FROM playlist_tracks pt
    JOIN tracks t ON t.id = pt.track_id
    WHERE pt.playlist_id = ?
    ORDER BY pt.position ASC
  `).all(id) as unknown as (DbTrackRow & {
    pt_id: string;
    playlist_id: string;
    track_id: string;
    position: number;
    added_at: number;
  })[];

  const tracks: PlaylistTrack[] = trackRows.map(r => ({
    id: r.pt_id,
    playlistId: r.playlist_id,
    trackId: r.track_id,
    position: r.position,
    addedAt: r.added_at,
    track: mapTrackRow(r),
  }));

  return {
    playlist: {
      id: playlistRow.id,
      name: playlistRow.name,
      createdAt: playlistRow.created_at,
      updatedAt: playlistRow.updated_at,
      trackCount: Number(playlistRow.track_count),
      totalDuration: Number(playlistRow.total_duration),
    },
    tracks,
  };
}

export function createPlaylist(name: string): Playlist {
  const db = getDatabase();
  const id = generateId();
  const now = Date.now();
  db.prepare('INSERT INTO playlists (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)').run(
    id,
    name.trim(),
    now,
    now
  );
  return {
    id,
    name: name.trim(),
    createdAt: now,
    updatedAt: now,
    trackCount: 0,
    totalDuration: 0,
  };
}

export function updatePlaylist(id: string, name: string): boolean {
  const db = getDatabase();
  const result = db.prepare('UPDATE playlists SET name = ?, updated_at = ? WHERE id = ?').run(
    name.trim(),
    Date.now(),
    id
  );
  return result.changes > 0;
}

export function deletePlaylist(id: string): boolean {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM playlists WHERE id = ?').run(id);
  return result.changes > 0;
}

export function addTracksToPlaylist(playlistId: string, trackIds: string[]): boolean {
  const db = getDatabase();
  const maxPosRow = db.prepare('SELECT COALESCE(MAX(position), -1) as max_pos FROM playlist_tracks WHERE playlist_id = ?').get(playlistId) as unknown as { max_pos: number } | undefined;
  let startPos = maxPosRow ? maxPosRow.max_pos + 1 : 0;
  const now = Date.now();

  const insertStmt = db.prepare(`
    INSERT INTO playlist_tracks (id, playlist_id, track_id, position, added_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const trackId of trackIds) {
    insertStmt.run(generateId(), playlistId, trackId, startPos++, now);
  }

  db.prepare('UPDATE playlists SET updated_at = ? WHERE id = ?').run(now, playlistId);
  return true;
}

export function removeTrackFromPlaylist(playlistId: string, playlistTrackId: string): boolean {
  const db = getDatabase();
  db.prepare('DELETE FROM playlist_tracks WHERE id = ? AND playlist_id = ?').run(playlistTrackId, playlistId);
  
  // Renumber remaining positions
  const rows = db.prepare('SELECT id FROM playlist_tracks WHERE playlist_id = ? ORDER BY position ASC').all(playlistId) as unknown as { id: string }[];
  const updateStmt = db.prepare('UPDATE playlist_tracks SET position = ? WHERE id = ?');
  rows.forEach((r, idx) => {
    updateStmt.run(idx, r.id);
  });

  db.prepare('UPDATE playlists SET updated_at = ? WHERE id = ?').run(Date.now(), playlistId);
  return true;
}

export function reorderPlaylistTracks(playlistId: string, trackPositions: { trackId: string; position: number }[]): boolean {
  const db = getDatabase();
  const updateStmt = db.prepare('UPDATE playlist_tracks SET position = ? WHERE playlist_id = ? AND track_id = ?');
  for (const item of trackPositions) {
    updateStmt.run(item.position, playlistId, item.trackId);
  }
  db.prepare('UPDATE playlists SET updated_at = ? WHERE id = ?').run(Date.now(), playlistId);
  return true;
}

// ----------------- SCANNER DB HELPERS -----------------

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
