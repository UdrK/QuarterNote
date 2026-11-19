import type {
  Artist,
  Album,
  Track,
  Playlist,
  PlaylistTrack,
  ScanStatus,
  SearchResponse,
  AppSettings,
  UpdateSettingsInput,
  FavoriteContainer,
  FavoriteItem,
  FavoriteItemType,
} from '@quarter-note/shared';

const API_BASE = '/api';

export async function fetchArtists(): Promise<Artist[]> {
  const res = await fetch(`${API_BASE}/artists`);
  return res.json();
}

export async function fetchArtist(id: string): Promise<{ artist: Artist; albums: Album[]; tracks: Track[] }> {
  const res = await fetch(`${API_BASE}/artists/${id}`);
  return res.json();
}

export async function uploadArtistImage(artistId: string, image: string): Promise<{ success: boolean; imageUrl: string }> {
  const res = await fetch(`${API_BASE}/artists/${artistId}/image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Impossibile caricare l\'immagine dell\'artista');
  }
  return res.json();
}

export async function fetchAlbums(artistId?: string): Promise<Album[]> {
  const url = artistId ? `${API_BASE}/albums?artistId=${artistId}` : `${API_BASE}/albums`;
  const res = await fetch(url);
  return res.json();
}

export async function fetchAlbum(id: string): Promise<{ album: Album; tracks: Track[] }> {
  const res = await fetch(`${API_BASE}/albums/${id}`);
  return res.json();
}

export async function fetchTracks(): Promise<Track[]> {
  const res = await fetch(`${API_BASE}/tracks`);
  return res.json();
}

export async function searchLibrary(query: string): Promise<SearchResponse> {
  const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
  return res.json();
}

export async function fetchPlaylists(): Promise<Playlist[]> {
  const res = await fetch(`${API_BASE}/playlists`);
  return res.json();
}

export async function fetchPlaylist(id: string): Promise<{ playlist: Playlist; tracks: PlaylistTrack[] }> {
  const res = await fetch(`${API_BASE}/playlists/${id}`);
  return res.json();
}

export async function createPlaylist(name: string): Promise<Playlist> {
  const res = await fetch(`${API_BASE}/playlists`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return res.json();
}

export async function deletePlaylist(id: string): Promise<void> {
  await fetch(`${API_BASE}/playlists/${id}`, { method: 'DELETE' });
}

export async function addTracksToPlaylist(playlistId: string, trackIds: string[]): Promise<void> {
  await fetch(`${API_BASE}/playlists/${playlistId}/tracks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trackIds }),
  });
}

export async function removeTrackFromPlaylist(playlistId: string, playlistTrackId: string): Promise<void> {
  await fetch(`${API_BASE}/playlists/${playlistId}/tracks/${playlistTrackId}`, {
    method: 'DELETE',
  });
}

export async function triggerScan(): Promise<ScanStatus> {
  const res = await fetch(`${API_BASE}/scan`, { method: 'POST' });
  return res.json();
}

export async function fetchScanStatus(): Promise<ScanStatus> {
  const res = await fetch(`${API_BASE}/scan/status`);
  return res.json();
}

export async function fetchSettings(): Promise<AppSettings> {
  const res = await fetch(`${API_BASE}/settings`);
  if (!res.ok) {
    throw new Error('Impossibile caricare le impostazioni dal server');
  }
  return res.json();
}

export async function updateSettings(input: UpdateSettingsInput): Promise<AppSettings> {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Impossibile aggiornare le impostazioni');
  }
  return res.json();
}

// ----------------- FAVORITES API -----------------

export async function fetchFavorites(): Promise<FavoriteContainer[]> {
  const res = await fetch(`${API_BASE}/favorites`);
  if (!res.ok) throw new Error('Errore durante il recupero dei preferiti');
  return res.json();
}

export async function fetchFavoriteIds(): Promise<{ artists: string[]; albums: string[]; tracks: string[]; playlists: string[] }> {
  const res = await fetch(`${API_BASE}/favorites/ids`);
  if (!res.ok) throw new Error('Errore durante il recupero degli ID dei preferiti');
  return res.json();
}

export async function toggleFavoriteApi(
  itemType: FavoriteItemType,
  itemId: string,
  containerId?: string
): Promise<{ favorited: boolean; item?: FavoriteItem }> {
  const res = await fetch(`${API_BASE}/favorites/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemType, itemId, containerId }),
  });
  if (!res.ok) throw new Error('Errore durante l\'aggiornamento del preferito');
  return res.json();
}

export async function createContainerApi(title: string): Promise<FavoriteContainer> {
  const res = await fetch(`${API_BASE}/favorites/containers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error('Errore durante la creazione del divisore');
  return res.json();
}

export async function updateContainerApi(id: string, updates: { title?: string; position?: number }): Promise<FavoriteContainer> {
  const res = await fetch(`${API_BASE}/favorites/containers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Errore durante la modifica del divisore');
  return res.json();
}

export async function deleteContainerApi(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/favorites/containers/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Errore durante l\'eliminazione del divisore');
}

export async function reorderContainersApi(containerIds: string[]): Promise<void> {
  const res = await fetch(`${API_BASE}/favorites/containers/reorder`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ containerIds }),
  });
  if (!res.ok) throw new Error('Errore durante il riordinamento dei divisori');
}

export async function moveFavoriteItemApi(favoriteId: string, targetContainerId: string, position?: number): Promise<void> {
  const res = await fetch(`${API_BASE}/favorites/items/${favoriteId}/move`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetContainerId, position }),
  });
  if (!res.ok) throw new Error('Errore durante lo spostamento del preferito');
}
