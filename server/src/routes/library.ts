import type { FastifyPluginAsync } from 'fastify';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {
  getArtists,
  getArtistById,
  getArtistImagePath,
  updateArtistImage,
  getAlbums,
  getAlbumById,
  getTracks,
  getTrackById,
  search,
} from '../db/repository.js';

const ARTIST_PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 250" width="250" height="250">
  <defs>
    <linearGradient id="artistGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#334155"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
  </defs>
  <rect width="250" height="250" rx="125" fill="url(#artistGrad)"/>
  <circle cx="125" cy="95" r="40" fill="#94a3b8"/>
  <path d="M60 210 c0 -40 30 -65 65 -65 s65 25 65 65 z" fill="#94a3b8"/>
</svg>`;

export const libraryRoutes = (dataDir: string): FastifyPluginAsync => {
  const artistsDir = path.join(dataDir, 'artists');
  const coversDir = path.join(dataDir, 'covers');

  return async (fastify) => {
    // Artists
    fastify.get('/artists', async () => {
      return getArtists();
    });

    fastify.get<{ Params: { id: string } }>('/artists/:id', async (request, reply) => {
      const artist = getArtistById(request.params.id);
      if (!artist) {
        return reply.code(404).send({ error: 'Artist not found' });
      }
      return artist;
    });

    // Artist image: GET (serves custom uploaded webp, or fallback album cover, or SVG)
    fastify.get<{ Params: { id: string } }>('/artists/:id/image', async (request, reply) => {
      const { id } = request.params;
      const customFile = path.join(artistsDir, `${id}.webp`);

      if (fs.existsSync(customFile)) {
        reply.header('Content-Type', 'image/webp');
        reply.header('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
        return reply.send(fs.createReadStream(customFile));
      }

      const imgInfo = getArtistImagePath(id);
      if (imgInfo?.fallbackCoverPath) {
        const coverFile = path.isAbsolute(imgInfo.fallbackCoverPath)
          ? imgInfo.fallbackCoverPath
          : path.join(coversDir, imgInfo.fallbackCoverPath);

        if (fs.existsSync(coverFile)) {
          reply.header('Content-Type', 'image/webp');
          reply.header('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
          return reply.send(fs.createReadStream(coverFile));
        }
      }

      if (imgInfo?.firstAlbumId) {
        const albumCoverFile = path.join(coversDir, `${imgInfo.firstAlbumId}.webp`);
        if (fs.existsSync(albumCoverFile)) {
          reply.header('Content-Type', 'image/webp');
          reply.header('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
          return reply.send(fs.createReadStream(albumCoverFile));
        }
      }

      reply.header('Content-Type', 'image/svg+xml');
      reply.header('Cache-Control', 'no-cache, must-revalidate');
      return reply.send(ARTIST_PLACEHOLDER_SVG);
    });

    // Artist image: POST (upload custom photo)
    fastify.post<{ Params: { id: string }; Body: { image: string } }>('/artists/:id/image', async (request, reply) => {
      const { id } = request.params;
      const { image } = request.body || {};

      if (!image || typeof image !== 'string') {
        return reply.code(400).send({ error: 'Missing or invalid image payload' });
      }

      const artist = getArtistById(id);
      if (!artist) {
        return reply.code(404).send({ error: 'Artist not found' });
      }

      try {
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        if (!fs.existsSync(artistsDir)) {
          fs.mkdirSync(artistsDir, { recursive: true });
        }

        const destPath = path.join(artistsDir, `${id}.webp`);
        await sharp(buffer)
          .resize(300, 300, { fit: 'cover' })
          .webp({ quality: 85 })
          .toFile(destPath);

        updateArtistImage(id, destPath);

        return {
          success: true,
          imageUrl: `/api/artists/${id}/image?t=${Date.now()}`,
        };
      } catch (err) {
        fastify.log.error(err);
        return reply.code(500).send({ error: 'Error processing artist image' });
      }
    });

    // Albums
    fastify.get<{ Querystring: { artistId?: string } }>('/albums', async (request) => {
      return getAlbums(request.query.artistId);
    });

    fastify.get<{ Params: { id: string } }>('/albums/:id', async (request, reply) => {
      const album = getAlbumById(request.params.id);
      if (!album) {
        return reply.code(404).send({ error: 'Album not found' });
      }
      return album;
    });

    // Tracks
    fastify.get('/tracks', async () => {
      return getTracks();
    });

    fastify.get<{ Params: { id: string } }>('/tracks/:id', async (request, reply) => {
      const track = getTrackById(request.params.id);
      if (!track) {
        return reply.code(404).send({ error: 'Track not found' });
      }
      return track;
    });

    // Search
    fastify.get<{ Querystring: { q: string } }>('/search', async (request) => {
      const query = request.query.q || '';
      if (!query.trim()) {
        return { artists: [], albums: [], tracks: [] };
      }
      return search(query);
    });
  };
};
