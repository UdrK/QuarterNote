import { getDatabase } from '../db.js';
import type { SearchResponse } from '@quarter-note/shared';
import { type DbTrackRow, mapTrackRow } from './types.js';

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
