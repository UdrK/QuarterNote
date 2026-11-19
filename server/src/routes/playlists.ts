import type { FastifyPluginAsync } from 'fastify';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {
  getPlaylists,
  getPlaylistById,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  addTracksToPlaylist,
  removeTrackFromPlaylist,
  reorderPlaylistTracks,
  updatePlaylistImage,
} from '../db/repository.js';
import type {
  CreatePlaylistInput,
  UpdatePlaylistInput,
  AddTracksToPlaylistInput,
  ReorderPlaylistTracksInput,
} from '@quarter-note/shared';

const PLAYLIST_PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 250" width="250" height="250">
  <defs>
    <linearGradient id="plGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#065f46"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
  </defs>
  <rect width="250" height="250" rx="16" fill="url(#plGrad)"/>
  <path d="M75 80 h100 M75 115 h100 M75 150 h60" stroke="#34d399" stroke-width="12" stroke-linecap="round"/>
  <circle cx="165" cy="165" r="15" fill="#34d399"/>
  <path d="M180 165 v-35 h20" stroke="#34d399" stroke-width="8" stroke-linecap="round" fill="none"/>
</svg>`;

export const playlistRoutes = (dataDir: string): FastifyPluginAsync => {
  const playlistsDir = path.join(dataDir, 'playlists');

  return async (fastify) => {
    fastify.get('/playlists', async () => {
      return getPlaylists();
    });

    fastify.post<{ Body: CreatePlaylistInput }>('/playlists', async (request, reply) => {
      const { name } = request.body || {};
      if (!name || !name.trim()) {
        return reply.code(400).send({ error: 'Il nome della playlist è obbligatorio' });
      }
      const playlist = createPlaylist(name.trim());
      return reply.code(201).send(playlist);
    });

    fastify.get<{ Params: { id: string } }>('/playlists/:id', async (request, reply) => {
      const playlist = getPlaylistById(request.params.id);
      if (!playlist) {
        return reply.code(404).send({ error: 'Playlist non trovata' });
      }
      return playlist;
    });

    // Playlist cover: GET
    fastify.get<{ Params: { id: string } }>('/playlists/:id/cover', async (request, reply) => {
      const { id } = request.params;
      const customFile = path.join(playlistsDir, `${id}.webp`);

      if (fs.existsSync(customFile)) {
        reply.header('Content-Type', 'image/webp');
        reply.header('Cache-Control', 'public, max-age=3600');
        return reply.send(fs.createReadStream(customFile));
      }

      reply.header('Content-Type', 'image/svg+xml');
      reply.header('Cache-Control', 'no-cache, no-store, must-revalidate');
      return reply.send(PLAYLIST_PLACEHOLDER_SVG);
    });

    // Playlist cover: POST (upload custom cover)
    fastify.post<{ Params: { id: string }; Body: { image: string } }>('/playlists/:id/cover', async (request, reply) => {
      const { id } = request.params;
      const { image } = request.body || {};

      if (!image || typeof image !== 'string') {
        return reply.code(400).send({ error: 'Payload immagine mancante o non valido' });
      }

      const playlist = getPlaylistById(id);
      if (!playlist) {
        return reply.code(404).send({ error: 'Playlist non trovata' });
      }

      try {
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        if (!fs.existsSync(playlistsDir)) {
          fs.mkdirSync(playlistsDir, { recursive: true });
        }

        const destPath = path.join(playlistsDir, `${id}.webp`);
        await sharp(buffer)
          .resize(300, 300, { fit: 'cover' })
          .webp({ quality: 85 })
          .toFile(destPath);

        updatePlaylistImage(id, destPath);

        return {
          success: true,
          coverUrl: `/api/playlists/${id}/cover?t=${Date.now()}`,
        };
      } catch (err) {
        fastify.log.error(err);
        return reply.code(500).send({ error: 'Errore durante l\'elaborazione della copertina della playlist' });
      }
    });

    fastify.put<{ Params: { id: string }; Body: UpdatePlaylistInput }>('/playlists/:id', async (request, reply) => {
      const { name } = request.body || {};
      if (!name || !name.trim()) {
        return reply.code(400).send({ error: 'Il nome della playlist non può essere vuoto' });
      }
      const updated = updatePlaylist(request.params.id, name.trim());
      if (!updated) {
        return reply.code(404).send({ error: 'Playlist non trovata' });
      }
      return { success: true };
    });

    fastify.delete<{ Params: { id: string } }>('/playlists/:id', async (request, reply) => {
      const deleted = deletePlaylist(request.params.id);
      if (!deleted) {
        return reply.code(404).send({ error: 'Playlist non trovata' });
      }

      // Cleanup custom cover file if it exists
      const customFile = path.join(playlistsDir, `${request.params.id}.webp`);
      if (fs.existsSync(customFile)) {
        try {
          fs.unlinkSync(customFile);
        } catch {
          // Ignore
        }
      }

      return { success: true };
    });

    fastify.post<{ Params: { id: string }; Body: AddTracksToPlaylistInput }>('/playlists/:id/tracks', async (request, reply) => {
      const { trackIds } = request.body || {};
      if (!trackIds || !Array.isArray(trackIds) || trackIds.length === 0) {
        return reply.code(400).send({ error: 'trackIds array è obbligatorio' });
      }
      addTracksToPlaylist(request.params.id, trackIds);
      return { success: true };
    });

    fastify.delete<{ Params: { id: string; trackId: string } }>('/playlists/:id/tracks/:trackId', async (request, reply) => {
      removeTrackFromPlaylist(request.params.id, request.params.trackId);
      return { success: true };
    });

    fastify.put<{ Params: { id: string }; Body: ReorderPlaylistTracksInput }>('/playlists/:id/reorder', async (request, reply) => {
      const { trackPositions } = request.body || {};
      if (!trackPositions || !Array.isArray(trackPositions)) {
        return reply.code(400).send({ error: 'trackPositions array è obbligatorio' });
      }
      reorderPlaylistTracks(request.params.id, trackPositions);
      return { success: true };
    });
  };
};
