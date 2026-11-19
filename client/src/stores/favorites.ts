import { reactive } from 'vue';
import type { FavoriteContainer, FavoriteItemType } from '@quarter-note/shared';
import {
  fetchFavorites,
  fetchFavoriteIds,
  toggleFavoriteApi,
  createContainerApi,
  updateContainerApi,
  deleteContainerApi,
  reorderContainersApi,
  moveFavoriteItemApi,
} from '../api/client';

export const favoritesState = reactive({
  containers: [] as FavoriteContainer[],
  favoriteArtistIds: new Set<string>(),
  favoriteAlbumIds: new Set<string>(),
  favoriteTrackIds: new Set<string>(),
  favoritePlaylistIds: new Set<string>(),
  isLoading: false,
  isInitialized: false,
});

export function isFavorite(type: FavoriteItemType, id: string): boolean {
  if (type === 'artist') return favoritesState.favoriteArtistIds.has(id);
  if (type === 'album') return favoritesState.favoriteAlbumIds.has(id);
  if (type === 'track') return favoritesState.favoriteTrackIds.has(id);
  if (type === 'playlist') return favoritesState.favoritePlaylistIds.has(id);
  return false;
}

export async function initFavorites(): Promise<void> {
  if (favoritesState.isInitialized) return;
  try {
    const ids = await fetchFavoriteIds();
    favoritesState.favoriteArtistIds = new Set(ids.artists);
    favoritesState.favoriteAlbumIds = new Set(ids.albums);
    favoritesState.favoriteTrackIds = new Set(ids.tracks);
    favoritesState.favoritePlaylistIds = new Set(ids.playlists);
    favoritesState.isInitialized = true;
  } catch (err) {
    console.error('Failed to load favorite IDs:', err);
  }
}

export async function loadFavorites(): Promise<void> {
  favoritesState.isLoading = true;
  try {
    const containers = await fetchFavorites();
    favoritesState.containers = containers;

    // Synchronize sets
    const artists = new Set<string>();
    const albums = new Set<string>();
    const tracks = new Set<string>();
    const playlists = new Set<string>();

    for (const c of containers) {
      for (const item of c.items) {
        if (item.itemType === 'artist') artists.add(item.itemId);
        else if (item.itemType === 'album') albums.add(item.itemId);
        else if (item.itemType === 'track') tracks.add(item.itemId);
        else if (item.itemType === 'playlist') playlists.add(item.itemId);
      }
    }

    favoritesState.favoriteArtistIds = artists;
    favoritesState.favoriteAlbumIds = albums;
    favoritesState.favoriteTrackIds = tracks;
    favoritesState.favoritePlaylistIds = playlists;
    favoritesState.isInitialized = true;
  } catch (err) {
    console.error('Failed to load favorite containers:', err);
  } finally {
    favoritesState.isLoading = false;
  }
}

export async function toggleFavorite(
  type: FavoriteItemType,
  id: string,
  containerId?: string
): Promise<boolean> {
  // Determine optimistic state
  const currentlyFavorited = isFavorite(type, id);
  const targetSet =
    type === 'artist'
      ? favoritesState.favoriteArtistIds
      : type === 'album'
      ? favoritesState.favoriteAlbumIds
      : type === 'track'
      ? favoritesState.favoriteTrackIds
      : favoritesState.favoritePlaylistIds;

  if (currentlyFavorited) {
    targetSet.delete(id);
  } else {
    targetSet.add(id);
  }

  try {
    const res = await toggleFavoriteApi(type, id, containerId);

    // If containers are currently loaded in state, reflect change
    if (favoritesState.containers.length > 0) {
      if (!res.favorited) {
        for (const c of favoritesState.containers) {
          c.items = c.items.filter((item) => !(item.itemType === type && item.itemId === id));
        }
      } else if (res.item) {
        const destContainer = favoritesState.containers.find((c) => c.id === res.item?.containerId);
        if (destContainer) {
          destContainer.items.push(res.item);
        } else {
          // If container not found, reload all containers
          await loadFavorites();
        }
      }
    }

    return res.favorited;
  } catch (err) {
    // Rollback optimistic update
    if (currentlyFavorited) {
      targetSet.add(id);
    } else {
      targetSet.delete(id);
    }
    console.error('Failed to toggle favorite:', err);
    throw err;
  }
}

export async function createDivider(title: string): Promise<void> {
  const container = await createContainerApi(title);
  favoritesState.containers.push(container);
}

export async function renameDivider(id: string, newTitle: string): Promise<void> {
  const updated = await updateContainerApi(id, { title: newTitle });
  const idx = favoritesState.containers.findIndex((c) => c.id === id);
  if (idx !== -1) {
    favoritesState.containers[idx].title = updated.title;
  }
}

export async function deleteDivider(id: string): Promise<void> {
  await deleteContainerApi(id);
  favoritesState.containers = favoritesState.containers.filter((c) => c.id !== id);
}

export async function reorderDividers(orderedIds: string[]): Promise<void> {
  await reorderContainersApi(orderedIds);
  favoritesState.containers.sort(
    (a, b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id)
  );
}

export async function moveItem(favoriteId: string, targetContainerId: string): Promise<void> {
  await moveFavoriteItemApi(favoriteId, targetContainerId);

  // Update in local state
  let foundItem: any = null;
  for (const c of favoritesState.containers) {
    const idx = c.items.findIndex((item) => item.id === favoriteId);
    if (idx !== -1) {
      foundItem = c.items.splice(idx, 1)[0];
      break;
    }
  }

  if (foundItem) {
    foundItem.containerId = targetContainerId;
    const dest = favoritesState.containers.find((c) => c.id === targetContainerId);
    if (dest) {
      dest.items.push(foundItem);
    }
  }
}
