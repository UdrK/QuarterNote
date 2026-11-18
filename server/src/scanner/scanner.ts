import fs from 'node:fs';
import path from 'node:path';
import * as mm from 'music-metadata';
import sharp from 'sharp';
import type { ScanStatus } from '@quarter-note/shared';
import {
  getAllTrackFilepathsWithMtime,
  upsertArtist,
  upsertAlbum,
  saveTrack,
  deleteTrack,
  cleanupEmptyArtistsAndAlbums,
  idFromText,
  generateId,
} from '../db/repository.js';

const SUPPORTED_EXTENSIONS = new Set([
  '.mp3',
  '.flac',
  '.m4a',
  '.aac',
  '.ogg',
  '.opus',
  '.wav',
  '.wma',
]);

const COVER_FILENAMES = [
  'cover.jpg',
  'cover.jpeg',
  'cover.png',
  'folder.jpg',
  'folder.jpeg',
  'folder.png',
  'front.jpg',
  'front.png',
  'album.jpg',
  'album.png',
];

export class ScannerService {
  private musicDir: string;
  private dataDir: string;
  private coversDir: string;
  private status: ScanStatus = {
    isScanning: false,
    scannedFiles: 0,
    totalFiles: 0,
  };

  constructor(musicDir: string, dataDir: string) {
    this.musicDir = musicDir;
    this.dataDir = dataDir;
    this.coversDir = path.join(dataDir, 'covers');
  }

  public getStatus(): ScanStatus {
    return { ...this.status };
  }

  public setMusicDir(newDir: string): void {
    this.musicDir = newDir;
  }

  public getMusicDir(): string {
    return this.musicDir;
  }

  public async startScan(): Promise<void> {
    if (this.status.isScanning) {
      return;
    }

    this.status = {
      isScanning: true,
      scannedFiles: 0,
      totalFiles: 0,
      error: undefined,
    };

    // Run in background without blocking API response
    this.runScan().catch(err => {
      console.error('Scan error:', err);
      this.status.error = err instanceof Error ? err.message : String(err);
      this.status.isScanning = false;
    });
  }

  private async runScan(): Promise<void> {
    const startTime = Date.now();
    console.log(`[Scanner] Starting scan on: ${this.musicDir}`);

    if (!fs.existsSync(this.musicDir)) {
      throw new Error(`Music directory not found: ${this.musicDir}`);
    }

    if (!fs.existsSync(this.coversDir)) {
      fs.mkdirSync(this.coversDir, { recursive: true });
    }

    // 1. Collect all audio files
    const audioFiles: string[] = [];
    await this.collectFiles(this.musicDir, audioFiles);
    this.status.totalFiles = audioFiles.length;
    console.log(`[Scanner] Found ${audioFiles.length} audio files.`);

    // 2. Fetch existing tracks to perform incremental scan
    const existingTracksMap = getAllTrackFilepathsWithMtime();
    const seenFilepaths = new Set<string>();

    // 3. Process each file
    for (let i = 0; i < audioFiles.length; i++) {
      const filepath = audioFiles[i];
      seenFilepaths.add(filepath);
      this.status.scannedFiles = i + 1;
      this.status.currentFile = path.basename(filepath);

      try {
        const stats = await fs.promises.stat(filepath);
        const mtime = Math.floor(stats.mtimeMs);
        const existing = existingTracksMap.get(filepath);

        // If file unchanged, skip metadata parse
        if (existing && existing.mtime === mtime) {
          continue;
        }

        // Parse metadata
        const metadata = await mm.parseFile(filepath, { duration: true, skipCovers: false });
        const formatName = path.extname(filepath).toLowerCase().replace('.', '') || 'unknown';

        const rawArtist = metadata.common.artist || metadata.common.albumartist || 'Unknown Artist';
        const artistName = rawArtist.trim();

        const parentFolder = path.basename(path.dirname(filepath));
        const rawAlbum = metadata.common.album || parentFolder || 'Unknown Album';
        const albumTitle = rawAlbum.trim();

        const filenameNoExt = path.basename(filepath, path.extname(filepath));
        const trackTitle = (metadata.common.title || filenameNoExt).trim();

        const year = metadata.common.year || (metadata.common.date ? parseInt(metadata.common.date.substring(0, 4), 10) : undefined);
        const trackNumber = metadata.common.track?.no ?? undefined;
        const discNumber = metadata.common.disk?.no ?? undefined;
        const duration = metadata.format.duration || 0;
        const bitrate = metadata.format.bitrate;

        // Upsert artist & album
        const artistId = upsertArtist(artistName);
        const albumId = idFromText(`${artistName}-${albumTitle}`);
        const coverFilename = `${albumId}.webp`;
        const coverPathOnDisk = path.join(this.coversDir, coverFilename);

        let hasCover = fs.existsSync(coverPathOnDisk);

        // Process cover if not already cached
        if (!hasCover) {
          let coverBuffer: Buffer | null = null;

          // 1. Embedded cover
          if (metadata.common.picture && metadata.common.picture.length > 0) {
            coverBuffer = Buffer.from(metadata.common.picture[0].data);
          } else {
            // 2. Folder cover
            const dir = path.dirname(filepath);
            for (const name of COVER_FILENAMES) {
              const candidate = path.join(dir, name);
              if (fs.existsSync(candidate)) {
                try {
                  coverBuffer = await fs.promises.readFile(candidate);
                  break;
                } catch {
                  // ignore read error
                }
              }
            }
          }

          if (coverBuffer) {
            try {
              await sharp(coverBuffer)
                .resize(250, 250, { fit: 'cover' })
                .webp({ quality: 80 })
                .toFile(coverPathOnDisk);
              hasCover = true;
            } catch (coverErr) {
              console.warn(`[Scanner] Failed to process cover for album ${albumTitle}:`, coverErr);
            }
          }
        }

        upsertAlbum(albumTitle, artistId, artistName, year, hasCover ? coverFilename : undefined);

        const trackId = existing ? existing.id : generateId();
        saveTrack({
          id: trackId,
          filepath,
          title: trackTitle,
          artistName,
          albumId,
          albumTitle,
          trackNumber,
          discNumber,
          year,
          duration,
          bitrate,
          format: formatName,
          size: stats.size,
          mtime,
          hasCover,
        });
      } catch (fileErr) {
        console.error(`[Scanner] Error reading ${filepath}:`, fileErr);
      }
    }

    // 4. Remove deleted tracks
    for (const [filepath, { id }] of existingTracksMap.entries()) {
      if (!seenFilepaths.has(filepath)) {
        console.log(`[Scanner] Removing deleted file: ${filepath}`);
        deleteTrack(id);
      }
    }

    // 5. Cleanup empty albums/artists
    cleanupEmptyArtistsAndAlbums();

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Scanner] Scan completed in ${elapsed}s.`);
    this.status = {
      isScanning: false,
      scannedFiles: this.status.totalFiles,
      totalFiles: this.status.totalFiles,
      currentFile: undefined,
      lastScanCompletedAt: Date.now(),
    };
  }

  private async collectFiles(dir: string, fileList: string[]): Promise<void> {
    let entries: fs.Dirent[];
    try {
      entries = await fs.promises.readdir(dir, { withFileTypes: true });
    } catch (err) {
      console.warn(`[Scanner] Could not read dir: ${dir}`);
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await this.collectFiles(fullPath, fileList);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (SUPPORTED_EXTENSIONS.has(ext)) {
          fileList.push(fullPath);
        }
      }
    }
  }
}
