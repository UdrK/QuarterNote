/**
 * Quarter Note ♩ - Shared TypeScript Types and Interfaces
 */

export interface Track {
  id: string;
  filepath: string;
  title: string;
  artistName: string;
  albumId: string;
  albumTitle: string;
  trackNumber?: number;
  discNumber?: number;
  year?: number;
  duration: number; // in seconds
  bitrate?: number; // in bps
  format: string; // e.g. 'flac', 'mp3', 'm4a', 'ogg'
  size: number; // file size in bytes
  mtime: number; // file modified timestamp (ms)
  hasCover: boolean;
}

export interface Album {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  year?: number;
  trackCount: number;
  duration: number; // total duration in seconds
  coverUrl: string;
}

export interface Artist {
  id: string;
  name: string;
  albumCount: number;
  trackCount: number;
  imageUrl?: string;
}

export interface Playlist {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  trackCount: number;
  totalDuration: number;
  coverUrl?: string;
}

export interface PlaylistTrack {
  id: string;
  playlistId: string;
  trackId: string;
  position: number;
  addedAt: number;
  track: Track;
}

export interface ScanStatus {
  isScanning: boolean;
  scannedFiles: number;
  totalFiles: number;
  currentFile?: string;
  error?: string;
  lastScanCompletedAt?: number;
}

export interface SearchResponse {
  artists: Artist[];
  albums: Album[];
  tracks: Track[];
}

export type PlaybackRate = 0.5 | 0.75 | 0.85 | 1.0 | 1.15 | 1.25 | 1.5 | 2.0;

export type RepeatMode = 'off' | 'all' | 'one';

export interface CreatePlaylistInput {
  name: string;
}

export interface UpdatePlaylistInput {
  name?: string;
}

export interface AddTracksToPlaylistInput {
  trackIds: string[];
}

export interface ReorderPlaylistTracksInput {
  trackPositions: { trackId: string; position: number }[];
}

export interface AppSettings {
  musicDir: string;
  dataDir: string;
  defaultView: DefaultViewType;
  totalTracks: number;
  totalAlbums: number;
  totalArtists: number;
}

export interface UpdateSettingsInput {
  musicDir?: string;
  defaultView?: DefaultViewType;
}

export type DefaultViewType = 'artists' | 'albums' | 'favorites' | 'playlists';

export type FavoriteItemType = 'artist' | 'album' | 'track' | 'playlist';

export interface FavoriteItem {
  id: string;
  containerId: string;
  itemType: FavoriteItemType;
  itemId: string;
  position: number;
  createdAt: number;
  artist?: Artist;
  album?: Album;
  track?: Track;
  playlist?: Playlist;
}

export interface FavoriteContainer {
  id: string;
  title: string;
  position: number;
  isDefault: boolean;
  createdAt: number;
  items: FavoriteItem[];
}

export interface CreateContainerInput {
  title: string;
}

export interface UpdateContainerInput {
  title?: string;
  position?: number;
}

export interface ToggleFavoriteInput {
  itemType: FavoriteItemType;
  itemId: string;
  containerId?: string;
}

export interface MoveFavoriteInput {
  targetContainerId: string;
  position?: number;
}
