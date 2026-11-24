import { getDatabase } from '../db.js';
import type { Artist, Album, Track } from '@quarter-note/shared';
import { getAlbums } from './albums.js';
import { type DbTrackRow, mapTrackRow } from './types.js';

export function getArtists(): Artist[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT 
      a.id, 
      a.name, 
      a.image_path,
      COUNT(DISTINCT alb.id) as album_count,
      COUNT(t.id) as track_count,
      (
        SELECT alb2.id FROM albums alb2 
        WHERE alb2.artist_id = a.id AND alb2.cover_path IS NOT NULL AND alb2.cover_path != '' 
        ORDER BY alb2.year DESC, alb2.title ASC LIMIT 1
      ) as cover_album_id
    FROM artists a
    LEFT JOIN albums alb ON alb.artist_id = a.id
    LEFT JOIN tracks t ON t.artist_name = a.name
    GROUP BY a.id, a.name
    ORDER BY a.name COLLATE NOCASE ASC
  `);
  const rows = stmt.all() as unknown as { 
    id: string; 
    name: string; 
    image_path: string | null; 
    album_count: number; 
    track_count: number; 
    cover_album_id: string | null;
  }[];

  return rows.map(r => {
    let imageUrl = `/api/artists/${r.id}/image`;
    if (r.image_path) {
      imageUrl = `/api/artists/${r.id}/image`;
    } else if (r.cover_album_id) {
      imageUrl = `/api/cover/${r.cover_album_id}`;
    }
    return {
      id: r.id,
      name: r.name,
      albumCount: Number(r.album_count),
      trackCount: Number(r.track_count),
      imageUrl,
    };
  });
}

export function getArtistById(id: string): { artist: Artist; albums: Album[]; tracks: Track[] } | null {
  const db = getDatabase();
  const artistRow = db.prepare('SELECT id, name, image_path FROM artists WHERE id = ?').get(id) as unknown as { id: string; name: string; image_path: string | null } | undefined;
  if (!artistRow) return null;

  const albums = getAlbums(artistRow.id);
  const trackRows = db.prepare(`
    SELECT * FROM tracks WHERE artist_name = ? ORDER BY year DESC, album_title ASC, track_number ASC
  `).all(artistRow.name) as unknown as DbTrackRow[];

  const tracks = trackRows.map(mapTrackRow);

  const firstAlbumWithCover = albums.find(a => a.coverUrl);
  let imageUrl = `/api/artists/${artistRow.id}/image`;
  if (!artistRow.image_path && firstAlbumWithCover) {
    imageUrl = firstAlbumWithCover.coverUrl;
  }

  return {
    artist: {
      id: artistRow.id,
      name: artistRow.name,
      albumCount: albums.length,
      trackCount: tracks.length,
      imageUrl,
    },
    albums,
    tracks,
  };
}

export function getArtistImagePath(id: string): { 
  customImagePath: string | null; 
  fallbackCoverPath: string | null;
  firstAlbumId: string | null;
} | null {
  const db = getDatabase();
  const artistRow = db.prepare('SELECT id, image_path FROM artists WHERE id = ?').get(id) as unknown as { id: string; image_path: string | null } | undefined;
  if (!artistRow) return null;

  let fallbackCoverPath: string | null = null;
  let firstAlbumId: string | null = null;

  // First try album with cover_path
  const albumWithCover = db.prepare(`
    SELECT id, cover_path FROM albums 
    WHERE artist_id = ? AND cover_path IS NOT NULL AND cover_path != '' 
    ORDER BY year DESC, title ASC LIMIT 1
  `).get(id) as unknown as { id: string; cover_path: string } | undefined;

  if (albumWithCover) {
    fallbackCoverPath = albumWithCover.cover_path;
    firstAlbumId = albumWithCover.id;
  } else {
    // Try any album of this artist
    const anyAlbum = db.prepare(`
      SELECT id FROM albums 
      WHERE artist_id = ? 
      ORDER BY year DESC, title ASC LIMIT 1
    `).get(id) as unknown as { id: string } | undefined;
    if (anyAlbum) {
      firstAlbumId = anyAlbum.id;
    }
  }

  return {
    customImagePath: artistRow.image_path,
    fallbackCoverPath,
    firstAlbumId,
  };
}

export function updateArtistImage(id: string, imagePath: string): void {
  const db = getDatabase();
  db.prepare('UPDATE artists SET image_path = ? WHERE id = ?').run(imagePath, id);
}
