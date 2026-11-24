import { getDatabase } from '../db.js';
import type { Playlist, PlaylistTrack } from '@quarter-note/shared';
import { generateId, type DbTrackRow, mapTrackRow } from './types.js';

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
    coverUrl: `/api/playlists/${r.id}/cover?t=${r.updated_at || r.created_at}`,
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
      coverUrl: `/api/playlists/${playlistRow.id}/cover?t=${playlistRow.updated_at || playlistRow.created_at}`,
    },
    tracks,
  };
}

export function getPlaylistImagePath(id: string): string | null {
  const db = getDatabase();
  const row = db.prepare('SELECT image_path FROM playlists WHERE id = ?').get(id) as unknown as { image_path: string | null } | undefined;
  return row?.image_path || null;
}

export function updatePlaylistImage(id: string, imagePath: string): void {
  const db = getDatabase();
  const now = Date.now();
  db.prepare('UPDATE playlists SET image_path = ?, updated_at = ? WHERE id = ?').run(imagePath, now, id);
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
