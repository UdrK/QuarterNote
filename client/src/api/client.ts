import type {
  Artist,
  Album,
  Track,
  Playlist,
  PlaylistTrack,
  ScanStatus,
  SearchResponse,
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
