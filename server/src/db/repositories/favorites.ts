import { getDatabase } from '../db.js';
import type { 
  FavoriteContainer, FavoriteItem, FavoriteItemType,
  Artist, Album, Track, Playlist 
} from '@quarter-note/shared';
import { generateId } from './types.js';
import { getArtistById } from './artists.js';
import { getAlbumById } from './albums.js';
import { getTrackById } from './tracks.js';
import { getPlaylistById } from './playlists.js';

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
    const defaultTitleMap: Record<FavoriteItemType, string[]> = {
      artist: ['Artists', 'Artisti'],
      album: ['Albums', 'Album'],
      track: ['Tracks', 'Brani'],
      playlist: ['Playlists', 'Playlist'],
    };
    const titles = defaultTitleMap[itemType];
    const placeholders = titles.map(() => '?').join(',');
    const container = db.prepare(`SELECT id FROM favorite_containers WHERE title IN (${placeholders}) ORDER BY position ASC LIMIT 1`).get(...titles) as unknown as { id: string } | undefined;

    if (container) {
      targetContainerId = container.id;
    } else {
      const firstContainer = db.prepare('SELECT id FROM favorite_containers ORDER BY position ASC LIMIT 1').get() as unknown as { id: string } | undefined;
      if (firstContainer) {
        targetContainerId = firstContainer.id;
      } else {
        const newContainer = createFavoriteContainer(titles[0]);
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
