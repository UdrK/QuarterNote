import type { FastifyPluginAsync } from 'fastify';
import {
  getPlaylists,
  getPlaylistById,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  addTracksToPlaylist,
  removeTrackFromPlaylist,
  reorderPlaylistTracks,
} from '../db/repository.js';
import type {
  CreatePlaylistInput,
  UpdatePlaylistInput,
  AddTracksToPlaylistInput,
  ReorderPlaylistTracksInput,
} from '@quarter-note/shared';

export const playlistRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/playlists', async () => {
    return getPlaylists();
  });

  fastify.post<{ Body: CreatePlaylistInput }>('/playlists', async (request, reply) => {
    const { name } = request.body || {};
    if (!name || !name.trim()) {
      return reply.code(400).send({ error: 'Playlist name is required' });
    }
    const playlist = createPlaylist(name);
    return reply.code(201).send(playlist);
  });

  fastify.get<{ Params: { id: string } }>('/playlists/:id', async (request, reply) => {
    const playlist = getPlaylistById(request.params.id);
    if (!playlist) {
      return reply.code(404).send({ error: 'Playlist not found' });
    }
    return playlist;
  });

  fastify.put<{ Params: { id: string }; Body: UpdatePlaylistInput }>('/playlists/:id', async (request, reply) => {
    const { name } = request.body || {};
    if (!name || !name.trim()) {
      return reply.code(400).send({ error: 'Playlist name cannot be empty' });
    }
    const updated = updatePlaylist(request.params.id, name);
    if (!updated) {
      return reply.code(404).send({ error: 'Playlist not found' });
    }
    return { success: true };
  });

  fastify.delete<{ Params: { id: string } }>('/playlists/:id', async (request, reply) => {
    const deleted = deletePlaylist(request.params.id);
    if (!deleted) {
      return reply.code(404).send({ error: 'Playlist not found' });
    }
    return { success: true };
  });

  fastify.post<{ Params: { id: string }; Body: AddTracksToPlaylistInput }>('/playlists/:id/tracks', async (request, reply) => {
    const { trackIds } = request.body || {};
    if (!trackIds || !Array.isArray(trackIds) || trackIds.length === 0) {
      return reply.code(400).send({ error: 'trackIds array is required' });
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
      return reply.code(400).send({ error: 'trackPositions array is required' });
    }
    reorderPlaylistTracks(request.params.id, trackPositions);
    return { success: true };
  });
};
