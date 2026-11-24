import { getDatabase } from '../db.js';
import type { Track } from '@quarter-note/shared';
import { type DbTrackRow, mapTrackRow } from './types.js';

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
