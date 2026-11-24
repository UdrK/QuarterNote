import type { Track } from '@quarter-note/shared';
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
