import { getDatabase } from './db.js';
import type { 
  Track, Album, Artist, Playlist, PlaylistTrack, SearchResponse,
  FavoriteContainer, FavoriteItem, FavoriteItemType 
} from '@quarter-note/shared';
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
    coverUrl: `/api/playlists/${r.id}/cover`,
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
      coverUrl: `/api/playlists/${playlistRow.id}/cover`,
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
  db.prepare('UPDATE playlists SET image_path = ? WHERE id = ?').run(imagePath, id);
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

// ----------------- SETTINGS & STATS -----------------

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

// ----------------- FAVORITES & CONTAINERS -----------------

export function getFavoriteContainers(): FavoriteContainer[] {
  const db = getDatabase();
  const containerRows = db.prepare(`
    SELECT id, title, position, is_default, created_at 
    FROM favorite_containers 
    ORDER BY position ASC, created_at ASC
  `).all() as unknown as { id: string; title: string; position: number; is_default: number; created_at: number }[];

  const favoriteRows = db.prepare(`
    SELECT id, container_id, item_type, item_id, position, created_at
    FROM favorites
    ORDER BY position ASC, created_at ASC
  `).all() as unknown as { id: string; container_id: string; item_type: FavoriteItemType; item_id: string; position: number; created_at: number }[];

  // Prepare lookups for hydration
  const orphanIds: string[] = [];
  const containerMap = new Map<string, FavoriteContainer>();

  for (const c of containerRows) {
    containerMap.set(c.id, {
      id: c.id,
      title: c.title,
      position: Number(c.position),
      isDefault: Boolean(c.is_default),
      createdAt: Number(c.created_at),
      items: [],
    });
  }

  // Hydrate items
  for (const f of favoriteRows) {
    const container = containerMap.get(f.container_id);
    if (!container) {
      orphanIds.push(f.id);
      continue;
    }

    let hydratedArtist: Artist | undefined;
    let hydratedAlbum: Album | undefined;
    let hydratedTrack: Track | undefined;
    let hydratedPlaylist: Playlist | undefined;

    if (f.item_type === 'artist') {
      const art = getArtistById(f.item_id);
      if (art) hydratedArtist = art.artist;
    } else if (f.item_type === 'album') {
      const alb = getAlbumById(f.item_id);
      if (alb) hydratedAlbum = alb.album;
    } else if (f.item_type === 'track') {
      const trk = getTrackById(f.item_id);
      if (trk) hydratedTrack = trk;
    } else if (f.item_type === 'playlist') {
      const pl = getPlaylistById(f.item_id);
      if (pl) hydratedPlaylist = pl.playlist;
    }

    // If underlying resource was deleted, mark orphan to clean up
    if (!hydratedArtist && !hydratedAlbum && !hydratedTrack && !hydratedPlaylist) {
      orphanIds.push(f.id);
      continue;
    }

    container.items.push({
      id: f.id,
      containerId: f.container_id,
      itemType: f.item_type,
      itemId: f.item_id,
      position: Number(f.position),
      createdAt: Number(f.created_at),
      artist: hydratedArtist,
      album: hydratedAlbum,
      track: hydratedTrack,
      playlist: hydratedPlaylist,
    });
  }

  // Asynchronously/opportunistically clean up orphans if any
  if (orphanIds.length > 0) {
    const deleteStmt = db.prepare('DELETE FROM favorites WHERE id = ?');
    for (const orphanId of orphanIds) {
      deleteStmt.run(orphanId);
    }
  }

  return Array.from(containerMap.values());
}

export function createFavoriteContainer(title: string): FavoriteContainer {
  const db = getDatabase();
  const maxPosRow = db.prepare('SELECT MAX(position) as maxPos FROM favorite_containers').get() as unknown as { maxPos: number | null };
  const position = (maxPosRow?.maxPos !== null && maxPosRow?.maxPos !== undefined) ? Number(maxPosRow.maxPos) + 1 : 0;
  const id = generateId();
  const now = Date.now();

  db.prepare(`
    INSERT INTO favorite_containers (id, title, position, is_default, created_at)
    VALUES (?, ?, ?, 0, ?)
  `).run(id, title.trim(), position, now);

  return {
    id,
    title: title.trim(),
    position,
    isDefault: false,
    createdAt: now,
    items: [],
  };
}

export function updateFavoriteContainer(id: string, updates: { title?: string; position?: number }): FavoriteContainer | null {
  const db = getDatabase();
  const existing = db.prepare('SELECT id, title, position, is_default, created_at FROM favorite_containers WHERE id = ?').get(id) as unknown as { id: string; title: string; position: number; is_default: number; created_at: number } | undefined;
  if (!existing) return null;

  const title = updates.title !== undefined ? updates.title.trim() : existing.title;
  const position = updates.position !== undefined ? updates.position : Number(existing.position);

  db.prepare(`
    UPDATE favorite_containers SET title = ?, position = ? WHERE id = ?
  `).run(title, position, id);

  return {
    id,
    title,
    position,
    isDefault: Boolean(existing.is_default),
    createdAt: Number(existing.created_at),
    items: [],
  };
}

export function deleteFavoriteContainer(id: string): boolean {
  const db = getDatabase();
  // Don't allow deleting if it doesn't exist
  const res = db.prepare('DELETE FROM favorite_containers WHERE id = ?').run(id);
  return res.changes > 0;
}

export function reorderFavoriteContainers(orderedIds: string[]): void {
  const db = getDatabase();
  const updateStmt = db.prepare('UPDATE favorite_containers SET position = ? WHERE id = ?');
  orderedIds.forEach((id, index) => {
    updateStmt.run(index, id);
  });
}

export function toggleFavorite(
  itemType: FavoriteItemType, 
  itemId: string, 
  containerId?: string
): { favorited: boolean; item?: FavoriteItem } {
  const db = getDatabase();

  // Check if item is already favorited (in any container)
  const existing = db.prepare('SELECT id, container_id FROM favorites WHERE item_type = ? AND item_id = ?').get(itemType, itemId) as unknown as { id: string; container_id: string } | undefined;

  if (existing) {
    db.prepare('DELETE FROM favorites WHERE id = ?').run(existing.id);
    return { favorited: false };
  }

  // Not favorited yet, determine target container
  let targetContainerId = containerId;
  if (!targetContainerId) {
    // Match by item type title or is_default
    const defaultTitleMap: Record<FavoriteItemType, string> = {
      artist: 'Artisti',
      album: 'Album',
      track: 'Brani',
      playlist: 'Playlist',
    };
    const defaultTitle = defaultTitleMap[itemType];
    const container = db.prepare('SELECT id FROM favorite_containers WHERE title = ? ORDER BY position ASC LIMIT 1').get(defaultTitle) as unknown as { id: string } | undefined;

    if (container) {
      targetContainerId = container.id;
    } else {
      // Fallback to first available container
      const firstContainer = db.prepare('SELECT id FROM favorite_containers ORDER BY position ASC LIMIT 1').get() as unknown as { id: string } | undefined;
      if (firstContainer) {
        targetContainerId = firstContainer.id;
      } else {
        // Create container if none exists
        const newContainer = createFavoriteContainer(defaultTitle);
        targetContainerId = newContainer.id;
      }
    }
  }

  const maxPosRow = db.prepare('SELECT MAX(position) as maxPos FROM favorites WHERE container_id = ?').get(targetContainerId) as unknown as { maxPos: number | null };
  const position = (maxPosRow?.maxPos !== null && maxPosRow?.maxPos !== undefined) ? Number(maxPosRow.maxPos) + 1 : 0;
  const id = generateId();
  const now = Date.now();

  db.prepare(`
    INSERT INTO favorites (id, container_id, item_type, item_id, position, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, targetContainerId, itemType, itemId, position, now);

  // Return hydrated item
  let hydratedArtist: Artist | undefined;
  let hydratedAlbum: Album | undefined;
  let hydratedTrack: Track | undefined;
  let hydratedPlaylist: Playlist | undefined;

  if (itemType === 'artist') {
    const art = getArtistById(itemId);
    if (art) hydratedArtist = art.artist;
  } else if (itemType === 'album') {
    const alb = getAlbumById(itemId);
    if (alb) hydratedAlbum = alb.album;
  } else if (itemType === 'track') {
    const trk = getTrackById(itemId);
    if (trk) hydratedTrack = trk;
  } else if (itemType === 'playlist') {
    const pl = getPlaylistById(itemId);
    if (pl) hydratedPlaylist = pl.playlist;
  }

  return {
    favorited: true,
    item: {
      id,
      containerId: targetContainerId,
      itemType,
      itemId,
      position,
      createdAt: now,
      artist: hydratedArtist,
      album: hydratedAlbum,
      track: hydratedTrack,
      playlist: hydratedPlaylist,
    },
  };
}

export function moveFavoriteItem(favoriteId: string, targetContainerId: string, position?: number): boolean {
  const db = getDatabase();
  const existing = db.prepare('SELECT id, container_id FROM favorites WHERE id = ?').get(favoriteId) as unknown as { id: string; container_id: string } | undefined;
  if (!existing) return false;

  let newPos = position;
  if (newPos === undefined || newPos === null) {
    const maxPosRow = db.prepare('SELECT MAX(position) as maxPos FROM favorites WHERE container_id = ?').get(targetContainerId) as unknown as { maxPos: number | null };
    newPos = (maxPosRow?.maxPos !== null && maxPosRow?.maxPos !== undefined) ? Number(maxPosRow.maxPos) + 1 : 0;
  }

  const res = db.prepare(`
    UPDATE favorites SET container_id = ?, position = ? WHERE id = ?
  `).run(targetContainerId, newPos, favoriteId);

  return res.changes > 0;
}

export function getAllFavoriteItemIds(): { artists: string[]; albums: string[]; tracks: string[]; playlists: string[] } {
  const db = getDatabase();
  const rows = db.prepare('SELECT item_type, item_id FROM favorites').all() as unknown as { item_type: FavoriteItemType; item_id: string }[];

  const result: { artists: string[]; albums: string[]; tracks: string[]; playlists: string[] } = {
    artists: [],
    albums: [],
    tracks: [],
    playlists: [],
  };

  for (const r of rows) {
    if (r.item_type === 'artist') result.artists.push(r.item_id);
    else if (r.item_type === 'album') result.albums.push(r.item_id);
    else if (r.item_type === 'track') result.tracks.push(r.item_id);
    else if (r.item_type === 'playlist') result.playlists.push(r.item_id);
  }

  return result;
}
