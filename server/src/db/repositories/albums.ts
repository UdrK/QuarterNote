import { getDatabase } from '../db.js';
import type { Album, Track } from '@quarter-note/shared';
import { type DbTrackRow, mapTrackRow } from './types.js';

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
